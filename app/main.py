"""AgentDoc FastAPI application.

Provides:
- POST /agent — Accept natural-language requests and run the autonomous pipeline
- GET /documents/{filename} — Safely retrieve generated documents
- GET /health — Service health check
- GET / — Serve the frontend
"""

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.config import OUTPUT_DIR, STATIC_DIR, OPENAI_API_KEY, GROQ_API_KEY, LLM_PROVIDER
from app.models import AgentRequest, AgentResponse
from app.agent.orchestrator import run_agent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# --- App ---
app = FastAPI(
    title="AgentDoc",
    description="Autonomous AI Document Generation Agent",
    version="1.0.0",
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# --- Endpoints ---

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve the frontend single-page application."""
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found.")
    return HTMLResponse(content=index_path.read_text())


@app.get("/health")
async def health_check():
    """Return service health without exposing secrets."""
    return {
        "status": "healthy",
        "service": "AgentDoc",
        "api_key_configured": bool(GROQ_API_KEY) if LLM_PROVIDER == "groq" else bool(OPENAI_API_KEY),
    }


@app.get("/agent/stream")
async def stream_process_request(request: str):
    """Run the agent pipeline and stream progress via Server-Sent Events (SSE)."""
    if not request.strip():
        raise HTTPException(status_code=400, detail="Empty request")
        
    logger.info("Received SSE request: %s", request[:100])

    if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key is not configured.")
    elif LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API key is not configured.")

    import asyncio
    import json
    queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def progress_callback(stage: str):
        asyncio.run_coroutine_threadsafe(queue.put({"type": "progress", "stage": stage}), loop)

    async def event_generator():
        # Start a background task to run the agent
        task = loop.run_in_executor(None, lambda: run_agent(request, progress_callback))
        
        while not task.done():
            try:
                # Wait for progress updates with a short timeout
                msg = await asyncio.wait_for(queue.get(), timeout=0.1)
                yield f"data: {json.dumps(msg)}\n\n"
            except asyncio.TimeoutError:
                pass
        
        # Drain any remaining progress messages
        while not queue.empty():
            msg = queue.get_nowait()
            yield f"data: {json.dumps(msg)}\n\n"

        # Get the final result
        try:
            result = task.result()
            if result.status == "failed":
                 yield f"data: {json.dumps({'type': 'error', 'error': result.error or 'Pipeline failed.'})}\n\n"
            else:
                 yield f"data: {json.dumps({'type': 'result', 'data': result.model_dump()})}\n\n"
        except Exception as e:
            logger.error("Error in stream: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/agent", response_model=AgentResponse)
async def process_request(body: AgentRequest):
    """Accept a natural-language request and run the autonomous agent pipeline."""
    logger.info("Received agent request: %s", body.request[:100])

    if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key is not configured.")
    elif LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API key is not configured.")

    try:
        result = run_agent(body.request)
        if result.status == "failed":
            raise HTTPException(status_code=500, detail=result.error or "Agent pipeline failed.")
        return result
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)[:200]}")


@app.get("/documents/{filename}")
async def get_document(filename: str):
    """Safely retrieve a generated document.

    Prevents path traversal by resolving the path and checking
    it remains within the output directory.
    """
    # Sanitize: reject any path separators or parent references
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    # Resolve the path and verify it's inside OUTPUT_DIR
    file_path = (OUTPUT_DIR / filename).resolve()
    output_resolved = OUTPUT_DIR.resolve()

    if not str(file_path).startswith(str(output_resolved)):
        logger.warning("Path traversal attempt blocked: %s", filename)
        raise HTTPException(status_code=403, detail="Access denied.")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document not found.")

    if not file_path.suffix == ".docx":
        raise HTTPException(status_code=400, detail="Only .docx files can be retrieved.")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

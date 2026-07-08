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

from app.config import OUTPUT_DIR, STATIC_DIR, OPENAI_API_KEY
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
        "api_key_configured": bool(OPENAI_API_KEY),
    }


@app.post("/agent", response_model=AgentResponse)
async def process_request(body: AgentRequest):
    """Accept a natural-language request and run the autonomous agent pipeline."""
    logger.info("Received agent request: %s", body.request[:100])

    if not OPENAI_API_KEY:
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

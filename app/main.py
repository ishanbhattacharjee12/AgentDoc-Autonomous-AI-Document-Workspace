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
from pydantic import ValidationError

from app.config import OUTPUT_DIR, LLM_API_KEY, BUDGET_MAX_STAGE_LATENCY
from app.models import AgentRequest, AgentResponse, PlanEditRequest
from app.agent.orchestrator import run_agent, execute_plan_only

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

# Configure CORS Middleware for cross-origin deployments
from fastapi.middleware.cors import CORSMiddleware
import os

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.get("/", response_class=HTMLResponse)
async def serve_api_landing():
    """Serve a professional API landing page."""
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentDoc Backend API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #0c0d0e;
            color: #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            background-color: #16181a;
            border: 1px solid #2d3134;
            border-radius: 12px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
        }
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 8px;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 8px #10b981;
        }
        .version {
            color: #718096;
            font-size: 14px;
            margin-bottom: 24px;
            display: inline-block;
            vertical-align: middle;
        }
        p {
            color: #a0aec0;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 28px;
        }
        .section-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #718096;
            margin-bottom: 12px;
            font-weight: 700;
        }
        .links {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 28px;
        }
        .links a {
            color: #63b3ed;
            text-decoration: none;
            background-color: #1e2225;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            border: 1px solid #2d3134;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .links a:hover {
            background-color: #262b2f;
            border-color: #4a5568;
            color: #90cdf4;
        }
        .links a::after {
            content: "→";
            font-weight: bold;
        }
        .frontend-url {
            background-color: #1e2225;
            border: 1px dashed #4a5568;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 14px;
            color: #a0aec0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AgentDoc Backend API</h1>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; height: 26px;">
            <span class="status-badge"><span class="status-dot"></span> Online</span>
            <span class="version">v1.0.0</span>
        </div>
        <p>Autonomous AI Document Intelligence Platform Backend. Exposes multi-stage document generation reasoning pipeline API endpoints.</p>
        
        <div class="section-title">Developer Resources</div>
        <div class="links">
            <a href="/docs">API Documentation (Swagger UI)</a>
            <a href="/openapi.json">OpenAPI Specification (JSON)</a>
            <a href="/health">Health Status</a>
        </div>
        
        <div class="section-title">Connected Frontend</div>
        <div class="frontend-url">
            <strong>Frontend URL:</strong><br>
            <span style="color: #718096; font-style: italic;">(To be added after Vercel deployment)</span>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html_content)


@app.get("/health")
async def health_check():
    """Return service health without exposing secrets."""
    from app.config import DEBUG, ENABLE_CACHE, ACTIVE_MODEL
    return {
        "status": "healthy",
        "service": "AgentDoc",
        "api_key_configured": bool(LLM_API_KEY),
        "debug": DEBUG,
        "enable_cache": ENABLE_CACHE,
        "active_model": ACTIVE_MODEL
    }


@app.get("/agent/stream")
async def stream_process_request(request: str, require_review: bool = False, format: str = "docx", mode: str = "standard", ignore_cache: bool = False):
    """Run the agent pipeline and stream progress via Server-Sent Events (SSE)."""
    if not request.strip():
        raise HTTPException(status_code=400, detail="Empty request")
        
    import time
    from app.config import DEBUG_TIMING
    from app.metrics import _current_stage
    
    if DEBUG_TIMING:
        logger.info("[INSTRUMENTATION] SSE Request Received: timestamp=%f", time.time())
        logger.info("[INSTRUMENTATION] Connection Opened: timestamp=%f", time.time())

    if not LLM_API_KEY and not __import__("app.config", fromlist=["USE_DEMO_MODE"]).USE_DEMO_MODE:
        raise HTTPException(status_code=503, detail="LLM API key is not configured.")

    import asyncio
    import json
    queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def progress_callback(stage: str):
        asyncio.run_coroutine_threadsafe(queue.put({"type": "progress", "stage": stage}), loop)

    def token_callback(token: str):
        asyncio.run_coroutine_threadsafe(queue.put({"type": "token", "content": token}), loop)

    async def event_generator():
        start_time = time.time()
        
        # Start a background task to run the agent
        task = loop.run_in_executor(
            None, 
            lambda: run_agent(request, progress_callback, require_review, format, mode, ignore_cache, token_callback)
        )
        
        while not task.done():
            # Fail-fast check
            if time.time() - start_time > BUDGET_MAX_STAGE_LATENCY:
                import traceback
                import sys
                frames = sys._current_frames()
                stack_traces = []
                for thread_id, frame in frames.items():
                    stack_traces.append(f"Thread {thread_id}:\n" + "".join(traceback.format_stack(frame)))
                
                logger.error(
                    "Fail-Fast Safeguard Triggered! Request exceeded %ds limit. "
                    "Elapsed: %.2fs. Active stage: %s. Thread Stack Traces:\n%s",
                    int(BUDGET_MAX_STAGE_LATENCY),
                    time.time() - start_time,
                    _current_stage.get(),
                    "\n".join(stack_traces)
                )
                
                yield f"data: {json.dumps({'type': 'error', 'error': f'Pipeline timeout: stage execution exceeded {int(BUDGET_MAX_STAGE_LATENCY)}s limit.'})}\n\n"
                return

            try:
                # Wait for progress updates with a short timeout
                msg = await asyncio.wait_for(queue.get(), timeout=0.1)
                if DEBUG_TIMING:
                    logger.info("[INSTRUMENTATION] Emitting Stream Event (type=%s): timestamp=%f", msg.get("type"), time.time())
                yield f"data: {json.dumps(msg)}\n\n"
            except asyncio.TimeoutError:
                pass
        
        # Drain any remaining progress messages
        while not queue.empty():
            msg = queue.get_nowait()
            if DEBUG_TIMING:
                logger.info("[INSTRUMENTATION] Emitting Stream Event (type=%s, drained): timestamp=%f", msg.get("type"), time.time())
            yield f"data: {json.dumps(msg)}\n\n"

        # Get the final result
        try:
            result = task.result()
            if result.status == "failed":
                 if DEBUG_TIMING:
                     logger.info("[INSTRUMENTATION] Emitting Stream Event (type=error): timestamp=%f", time.time())
                 yield f"data: {json.dumps({'type': 'error', 'error': result.error or 'Pipeline failed.'})}\n\n"
            else:
                 if DEBUG_TIMING:
                     logger.info("[INSTRUMENTATION] Emitting Stream Event (type=result): timestamp=%f", time.time())
                 yield f"data: {json.dumps({'type': 'result', 'data': result.model_dump()})}\n\n"
        except Exception as e:
            logger.error("Error in stream: %s", e)
            if DEBUG_TIMING:
                logger.info("[INSTRUMENTATION] Emitting Stream Event (type=error exception): timestamp=%f", time.time())
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
        if DEBUG_TIMING:
            logger.info("[INSTRUMENTATION] Emitting Stream Event (type=done): timestamp=%f", time.time())
            logger.info("[INSTRUMENTATION] Final SSE event sent: timestamp=%f", time.time())
            logger.info("[INSTRUMENTATION] Generator Exits: timestamp=%f", time.time())
            logger.info("[INSTRUMENTATION] HTTP response closes: timestamp=%f", time.time())

    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/agent/execute/stream")
async def stream_execute_plan(body: PlanEditRequest):
    """Execute a user-approved plan and stream progress via SSE."""
    if not LLM_API_KEY and not __import__("app.config", fromlist=["USE_DEMO_MODE"]).USE_DEMO_MODE:
        raise HTTPException(status_code=503, detail="LLM API key is not configured.")

    import asyncio
    import json
    import time
    from app.config import DEBUG_TIMING
    from app.metrics import _current_stage
    
    if DEBUG_TIMING:
        logger.info("[INSTRUMENTATION] SSE Execute Plan Request Received: timestamp=%f", time.time())
        logger.info("[INSTRUMENTATION] Connection Opened: timestamp=%f", time.time())

    queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def progress_callback(stage: str):
        asyncio.run_coroutine_threadsafe(queue.put({"type": "progress", "stage": stage}), loop)

    def token_callback(token: str):
        asyncio.run_coroutine_threadsafe(queue.put({"type": "token", "content": token}), loop)

    async def event_generator():
        start_time = time.time()
        task = loop.run_in_executor(None, lambda: execute_plan_only(body, progress_callback, token_callback))
        
        while not task.done():
            # Fail-fast check
            if time.time() - start_time > BUDGET_MAX_STAGE_LATENCY:
                import traceback
                import sys
                frames = sys._current_frames()
                stack_traces = []
                for thread_id, frame in frames.items():
                    stack_traces.append(f"Thread {thread_id}:\n" + "".join(traceback.format_stack(frame)))
                
                logger.error(
                    "Fail-Fast Safeguard Triggered! Request exceeded %ds limit. "
                    "Elapsed: %.2fs. Active stage: %s. Thread Stack Traces:\n%s",
                    int(BUDGET_MAX_STAGE_LATENCY),
                    time.time() - start_time,
                    _current_stage.get(),
                    "\n".join(stack_traces)
                )
                
                yield f"data: {json.dumps({'type': 'error', 'error': f'Pipeline timeout: stage execution exceeded {int(BUDGET_MAX_STAGE_LATENCY)}s limit.'})}\n\n"
                return

            try:
                msg = await asyncio.wait_for(queue.get(), timeout=0.1)
                if DEBUG_TIMING:
                    logger.info("[INSTRUMENTATION] Emitting Stream Event (type=%s): timestamp=%f", msg.get("type"), time.time())
                yield f"data: {json.dumps(msg)}\n\n"
            except asyncio.TimeoutError:
                pass
        
        while not queue.empty():
            msg = queue.get_nowait()
            if DEBUG_TIMING:
                logger.info("[INSTRUMENTATION] Emitting Stream Event (type=%s, drained): timestamp=%f", msg.get("type"), time.time())
            yield f"data: {json.dumps(msg)}\n\n"

        try:
            result = task.result()
            if result.status == "failed":
                 if DEBUG_TIMING:
                     logger.info("[INSTRUMENTATION] Emitting Stream Event (type=error): timestamp=%f", time.time())
                 yield f"data: {json.dumps({'type': 'error', 'error': result.error or 'Pipeline failed.'})}\n\n"
            else:
                 if DEBUG_TIMING:
                     logger.info("[INSTRUMENTATION] Emitting Stream Event (type=result): timestamp=%f", time.time())
                 yield f"data: {json.dumps({'type': 'result', 'data': result.model_dump()})}\n\n"
        except Exception as e:
            logger.error("Error in execute stream: %s", e)
            if DEBUG_TIMING:
                logger.info("[INSTRUMENTATION] Emitting Stream Event (type=error exception): timestamp=%f", time.time())
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
        if DEBUG_TIMING:
            logger.info("[INSTRUMENTATION] Emitting Stream Event (type=done): timestamp=%f", time.time())
            logger.info("[INSTRUMENTATION] Final SSE event sent: timestamp=%f", time.time())
            logger.info("[INSTRUMENTATION] Generator Exits: timestamp=%f", time.time())
            logger.info("[INSTRUMENTATION] HTTP response closes: timestamp=%f", time.time())

    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/agent", response_model=AgentResponse)
async def process_request(body: AgentRequest):
    """Accept a natural-language request and run the autonomous agent pipeline."""
    logger.info("Received agent request: %s", body.request[:100])

    if not LLM_API_KEY and not __import__("app.config", fromlist=["USE_DEMO_MODE"]).USE_DEMO_MODE:
        raise HTTPException(status_code=503, detail="LLM API key is not configured.")

    try:
        result = run_agent(body.request, require_review=body.require_review, format=body.format, mode=body.mode, ignore_cache=body.ignore_cache)
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

    allowed_extensions = {".docx", ".pdf", ".html", ".md"}
    if file_path.suffix not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format.")

    media_types = {
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pdf": "application/pdf",
        ".html": "text/html",
        ".md": "text/markdown",
    }

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type=media_types.get(file_path.suffix, "application/octet-stream"),
    )

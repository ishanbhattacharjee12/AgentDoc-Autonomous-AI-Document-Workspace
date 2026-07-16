# Installation & Local Setup Guide

Follow this guide to install, configure, and launch the AgentDoc autonomous document pipeline workspace locally.

---

## 1. Prerequisites

Ensure you have the following runtimes installed on your system:
*   **Python**: Version 3.11 or later.
*   **Node.js**: Version 20 or later (with `npm`).

---

## 2. Server Pipeline Setup (FastAPI Backend)

1.  Navigate to the repository root directory.
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  Install backend dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment keys in a `.env` file at the root:
    ```env
    # API configuration keys
    GEMINI_API_KEY=your_gemini_key_here
    OPENAI_API_KEY=your_openai_key_here
    
    # Platform settings
    ENABLE_CACHE=true
    USE_DEMO_MODE=true
    ```
    *Note: If API keys are missing, setting `USE_DEMO_MODE=true` allows the server to stream mock document stages for evaluation.*
5.  Launch the FastAPI server:
    ```bash
    PYTHONPATH=. .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
    ```
    The server will be reachable at `http://127.0.0.1:8000/health`.

---

## 3. UI Workspace Setup (React Frontend)

1.  Navigate to the `frontend-react` folder:
    ```bash
    cd frontend-react
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure local proxy target redirect inside `vite.config.ts` (configured by default to redirect request urls `/agent` and `/documents` to `http://127.0.0.1:8000`).
4.  Launch the Vite developer client:
    ```bash
    npm run dev
    ```
    The client workspace will be reachable at `http://localhost:5173`.

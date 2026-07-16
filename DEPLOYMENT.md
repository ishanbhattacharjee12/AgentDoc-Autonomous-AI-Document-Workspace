# Production Deployment Guide

This guide describes how to deploy the AgentDoc full-stack application to static CDN hosts (frontend) and containerized API servers (backend).

---

## 1. Environment Variable Reference

| Environment Variable | Target System | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Frontend | Target API server root (e.g. `https://api.agentdoc.io`) |
| `GEMINI_API_KEY` | Backend | API Key for planning and synthesis pipeline LLM models |
| `ENABLE_CACHE` | Backend | Enable SQLite query-response requests cache (`true` or `false`) |
| `USE_DEMO_MODE` | Backend | Enable mock generation fallback if API keys are missing |

---

## 2. Frontend Static Deployment (Vercel / Netlify)

The Vite client builds as a static Single Page Application (SPA):
1.  **Build Command**: `npm run build`
2.  **Output Folder**: `dist/` (contains optimized lazy-loaded routes and split vendor packages).
3.  **Proxy / Redirect Configuration**:
    *   To route `/agent` API calls to the remote backend, deploy a `vercel.json` file in the root of the project:
        ```json
        {
          "rewrites": [
            {
              "source": "/agent/:path*",
              "destination": "https://api.agentdoc.io/agent/:path*"
            },
            {
              "source": "/documents/:path*",
              "destination": "https://api.agentdoc.io/documents/:path*"
            }
          ]
        }
        ```

---

## 3. Backend Containerized Deployment (Render / Fly.io / Docker)

The backend is built as a lightweight Python server:
1.  **Startup Command**:
    ```bash
    gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
    ```
2.  **Docker Setup**:
    *   Write a standard Dockerfile exposing port `8000`.
    *   Set up SQLite directory persistence under `/app/cache/` to ensure cached queries are preserved during container recycles.
3.  **Health Audits**:
    *   Configure deployment platform liveness and readiness health checks pointing to `GET /health` with a threshold of 3 consecutive checks.
4.  **Rollback Steps**:
    *   Deployments should preserve versioned container images (e.g., tags `v1.0.0`, `v0.3.0`) on registry stores. Rollback is triggered by deploying the previous tagged image hash instantly when a build fails the liveness probe.

# AgentDoc – Autonomous Document Intelligence Platform

**AgentDoc – Autonomous Document Intelligence Platform** is a complete autonomous AI document-generation agent for a Python AI Engineer assignment. It accepts a natural-language business request, understands the goal, creates its own dynamic task plan, executes the plan using controlled tools, synthesizes the results, performs a reflection/self-check, revises once if necessary, and generates a polished Microsoft Word `.docx` document.

## Features

- **Autonomous Dynamic Planning**: The LLM determines the goal, document type, assumptions, and task decomposition (including tool routing) dynamically based on the input request.
- **Controlled Tool Execution**: Maps LLM tasks to specific controlled internal tools (analysis, knowledge).
- **Reflection & Self-Check**: Evaluates the generated draft against the original request and plan, and performs exactly one revision pass if meaningful issues are found. Reflection results fall into three distinct states: Passed, Revised, or Provider Error (with graceful fallback). This bounds the execution loop while improving output quality.
- **Professional DOCX Generation**: Automatically generates request-specific, properly formatted `.docx` files using `python-docx`.
- **Modern SPA Frontend**: Visualizes the agent's autonomous workflow, showing the plan, assumptions, execution status, reflection grades, execution duration, LLM call counts, and providing a download link for the document.

## Architecture

The system follows a sequential orchestrated pipeline:

```mermaid
graph TD
    A[User Request] --> B[Validation & Intent Understanding]
    B --> C[Dynamic Planning & Assumptions]
    C --> D[Sequential Task Execution]
    D --> E[Result Synthesis]
    E --> F[Draft Creation]
    F --> G{Reflection & Self-Check}
    G -- Issues Found --> H[One Revision Pass]
    G -- Passed --> I[DOCX Generation]
    H --> I
    I --> J[API Response & Document Download]
```

### Folder Structure

```
AgentDoc_Project/
├── app/
│   ├── main.py                # FastAPI application
│   ├── config.py              # Environment configuration
│   ├── models.py              # Pydantic schema validation
│   ├── agent/                 # Core agent logic
│   │   ├── orchestrator.py    # Main pipeline orchestrator
│   │   ├── planner.py         # Dynamic task planner
│   │   ├── executor.py        # Task executor and context manager
│   │   ├── synthesizer.py     # Document draft synthesis
│   │   └── reflector.py       # Reflection and revision logic
│   ├── llm/
│   │   └── client.py          # Groq wrapper with retry
│   ├── tools/
│   │   ├── registry.py        # Tool allowlist
│   │   ├── analysis_tool.py   # Analytical reasoning tool
│   │   ├── knowledge_tool.py  # Domain knowledge tool
│   │   └── document_tool.py   # DOCX generation tool
│   ├── prompts/               # System and user prompts for LLM interactions
│   ├── static/                # Vanilla JS frontend
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   └── outputs/               # Generated DOCX files (git-ignored)
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Technologies

- **Backend**: Python 3, FastAPI, Pydantic, python-docx, python-dotenv, Groq API.
- **Frontend**: HTML5, CSS3, Vanilla JavaScript.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ishanbhattacharjee12/AgentDoc.git
   cd AgentDoc
   ```

2. **Set up a virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy the example config and edit it with your real Groq API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   GROQ_API_KEY=gsk-...
   GROQ_MODEL=llama-3.1-8b-instant
   LLM_PROVIDER=groq
   ```

## Running the Application

Start the FastAPI server via Uvicorn:
```bash
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The application will be accessible at:
- **Frontend / UI**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## Usage

### Frontend Usage
Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser. You can enter a custom request or use the provided demo buttons to automatically populate standard test cases.

### API Usage
You can run the agent pipeline via the `/agent` endpoint using `curl` or Postman.

```bash
curl -X POST http://127.0.0.1:8000/agent \
     -H "Content-Type: application/json" \
     -d '{"request": "Create a project plan for launching an AI-powered customer support chatbot..."}'
```

Retrieve the generated document using the URL provided in the response:
```bash
curl -O http://127.0.0.1:8000/documents/agentdoc_project_plan_12345.docx
```

## Required Test Cases

The application includes two primary test cases that demonstrate bounded autonomy:

1. **Standard Business Request**:
   *Request*: "Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company..."
   *Result*: The agent recognizes a project-plan intent, generates standard business assumptions, creates a 7-step plan, executes it, and generates a `.docx` project plan with phases, timelines, risks, and success metrics.

2. **Complex Ambiguous Request**:
   *Request*: "We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership..."
   *Result*: The agent identifies the missing information and ambiguity, decides to investigate low-effort/high-return analytics first, builds a phased 90-day plan respecting constrained engineering capacity and budget, and outputs a leadership-ready improvement plan.

## Reflection and Self-Check

We implemented a **Reflection/Self-Check stage** because LLM-generated documents may appear structurally complete while still missing user requirements, lacking logical flow, or containing inconsistencies.

After the initial synthesis step, the Reflector evaluates the draft against the original request, the generated plan, and any explicit assumptions. If it finds missing actions, unclear priorities, or unfulfilled requests, it performs exactly **one controlled revision pass**. This improves output quality substantially while keeping latency and API usage tightly bounded (no uncontrolled loops).

### Debugging Insight: Groq TPM Limits
During real-mode testing, the reflection step encountered a `413 Payload Too Large` error on complex documents (like a CRM Vendor Evaluation). This was traced not to a pure context-length issue, but to Groq's 6,000 Tokens-Per-Minute (TPM) limit on `llama-3.1-8b-instant`. The underlying API client originally defaulted to `max_tokens=4000`, causing the total request footprint (prompt + max_tokens) to instantly exceed 6,000. Fixing this required dropping the explicit `max_tokens` limit on revisions so Groq dynamically calculates usage, preventing upfront rate-limit rejection.

## Error Recovery & Security

- **Path Traversal Protection**: The `/documents/{filename}` endpoint enforces strict checks to prevent unauthorized filesystem access (e.g., trying to read `../../.env`).
- **Secret Safety**: The `.env` file and `app/outputs/` directory are excluded via `.gitignore`. API keys are never exposed to the frontend or logs.
- **Graceful Fallbacks**: If the LLM generates malformed JSON for a plan, the client attempts to clean it, retries once with a repair prompt, and uses a deterministic fallback plan if it continues to fail.

## Engineering Tradeoff

**Autonomous Planning vs Deterministic Workflows**
AgentDoc allows the LLM to dynamically determine document type, assumptions, task decomposition, task order, and tool mapping. Fully unconstrained autonomy would reduce predictability and debuggability. Therefore, we used **bounded autonomy**: the LLM generates the plan, but it is validated via Pydantic schemas, routed to a controlled tool allowlist, protected by safe fallback behavior, and capped at one maximum reflection/revision pass before deterministic DOCX generation.

## Limitations and Future Improvements

- **External Integrations**: The Knowledge Tool is currently mocked/simulated and relies solely on the LLM's parametric knowledge. In the future, this could be extended to connect to internal company wikis or use RAG (Retrieval-Augmented Generation).
- **Asynchronous Execution**: Long-running requests may trigger HTTP timeouts. The endpoint should ideally be converted to an async job queue (e.g., background tasks or Celery) returning a job ID that the frontend can poll.

# AgentDoc — Build Specification

## 1. Objective

Build **AgentDoc**, a complete autonomous AI document-generation agent for a Python AI Engineer assignment.

The system must accept a natural-language business request, understand the goal, create its own dynamic task plan, execute the plan using controlled tools, synthesize the results, perform a reflection/self-check, revise once if necessary, and generate a polished Microsoft Word `.docx` document.

The project must be fully functional end-to-end and suitable for an 8–10 minute technical demonstration.

Prioritize:
1. Working end-to-end system
2. Genuine autonomous planning
3. Reliable task execution
4. Visible agent behavior
5. Reflection/self-check
6. Professional DOCX output
7. Clean API and code architecture
8. Minimal demo-friendly frontend
9. Documentation and testing

Do not overengineer the solution.

---

## 2. Required Stack

Backend:
- Python
- FastAPI
- Pydantic
- python-docx
- python-dotenv
- OpenAI API
- pathlib
- Python logging

Frontend:
- HTML
- CSS
- Vanilla JavaScript
- served directly by FastAPI

Keep dependencies minimal.

Do not use LangChain, LangGraph, CrewAI, databases, Docker, Redis, Celery, authentication, or unnecessary infrastructure.

Use a clean custom Python orchestration workflow.

---

## 3. Configuration

The local `.env` should support:

OPENAI_API_KEY=<provided separately>
OPENAI_MODEL=<configurable model>

Create `.env.example` with placeholders only.

The real API key must:
- exist only in local `.env`;
- never appear in source code;
- never be sent to the frontend;
- never be logged;
- never appear in README;
- never be committed or pushed.

Create `.gitignore` before staging files.

---

## 4. Core Agent Workflow

Implement this workflow:

User Request
→ Validation
→ Intent Understanding
→ Dynamic Planning
→ Assumption Generation
→ Tool Selection
→ Sequential Task Execution
→ Result Synthesis
→ Draft Creation
→ Reflection/Self-Check
→ One Revision Pass if Needed
→ DOCX Generation
→ API Response

The system must demonstrate bounded autonomy.

The LLM decides:
- interpreted goal;
- document type;
- assumptions;
- task decomposition;
- task order;
- tool selection.

The application controls:
- allowed tools;
- schema validation;
- execution loop;
- retries;
- revision limit;
- filesystem access;
- document generation.

Do not expose hidden chain-of-thought. Only show high-level plans, assumptions, tool choices, statuses, summaries, and reflection results.

---

## 5. API

### POST /agent

Input:

{
  "request": "Create a project plan for launching an AI-powered customer support chatbot."
}

Validate with Pydantic.

Reject:
- empty input;
- whitespace-only input;
- non-actionable input;
- excessively long input.

A successful response should contain:

- status
- interpreted goal
- document type
- assumptions
- generated plan
- task purposes
- selected tools
- task execution statuses
- short execution summaries
- reflection result
- improvements applied
- final summary
- document filename
- document URL

Example conceptual structure:

{
  "status": "completed",
  "goal": "...",
  "document_type": "project_plan",
  "assumptions": ["..."],
  "plan": [
    {
      "id": 1,
      "task": "...",
      "purpose": "...",
      "tool": "analysis",
      "status": "completed"
    }
  ],
  "execution_results": [],
  "reflection": {
    "passed": true,
    "issues_found": [],
    "improvements_applied": []
  },
  "summary": "...",
  "document_filename": "...docx",
  "document_url": "/documents/...docx"
}

### GET /documents/{filename}

Safely return generated `.docx` files.

Prevent path traversal using resolved pathlib paths and ensure files remain inside the output directory.

Never allow retrieval of arbitrary files such as:

../../.env

### GET /health

Return basic service health information without exposing configuration or secrets.

### GET /

Serve the frontend.

---

## 6. Autonomous Planner

The planner must dynamically analyze each request.

It must return structured data containing:

{
  "goal": "string",
  "document_type": "string",
  "assumptions": ["string"],
  "tasks": [
    {
      "id": 1,
      "task": "string",
      "purpose": "string",
      "tool": "analysis|knowledge|document",
      "depends_on": []
    }
  ]
}

Plans must genuinely differ according to the request.

Do not use a fixed TODO sequence with renamed tasks.

Examples:

A project plan may require:
- objective analysis;
- scope definition;
- phase planning;
- timeline development;
- role allocation;
- risk analysis;
- success metrics.

An ambiguous business problem may require:
- problem framing;
- unknown identification;
- assumptions;
- investigation priorities;
- hypothesis prioritization;
- low-cost experiments;
- phased actions;
- metrics;
- risks;
- leadership recommendations.

Use Pydantic validation.

Prefer structured model output when reliable.

If planner output is malformed:
1. clean Markdown code fences if present;
2. attempt parsing and validation;
3. retry once with a repair instruction;
4. if still invalid, use a safe deterministic fallback plan.

Planning failure must not crash the whole application.

---

## 7. Tools and Execution

Implement a controlled tool registry.

Required tools:

### Analysis Tool
Used for:
- requirement analysis;
- ambiguity resolution;
- constraints;
- assumptions;
- prioritization;
- tradeoffs;
- structured reasoning.

### Knowledge Tool
Used for:
- domain context;
- business or technical considerations;
- common practices;
- relevant background knowledge.

No live internet access is required.

Never fabricate citations or fake sources.

Clearly distinguish assumptions from verified facts.

### Document Tool
Used for deterministic `.docx` generation.

The executor must route tasks according to the planner's selected tool.

If an unknown tool is returned:
- log the recovery;
- route safely to the Analysis Tool;
- continue execution.

Each task should have a visible status:

- pending
- running
- completed
- failed
- recovered

Execute tasks sequentially.

Each task receives relevant context:
- original request;
- goal;
- document type;
- assumptions;
- plan;
- current task;
- relevant previous task results.

Do not fake multi-step execution by sending everything through one giant hidden prompt.

---

## 8. Synthesis

After execution, combine task outputs into a coherent document draft.

The structure must adapt to the requested document type.

Examples:
- project plan;
- proposal;
- technical design;
- SOP;
- meeting minutes;
- business report;
- product specification;
- leadership improvement plan.

Do not force every request into the same document template.

The synthesis should consider:
- original request;
- intended audience;
- assumptions;
- execution results;
- requested sections;
- document type.

---

## 9. Mandatory Engineering Improvement: Reflection/Self-Check

Implement Reflection/Self-Check as the mandatory engineering improvement.

Before DOCX generation, evaluate the draft against:
- original request;
- generated plan;
- assumptions;
- requested sections;
- logical consistency;
- completeness;
- audience usefulness;
- unsupported certainty;
- missing actions;
- unclear priorities;
- timeline and metric quality where relevant.

Return structured reflection output:

{
  "passed": true,
  "issues_found": [],
  "improvements": []
}

If meaningful problems are found:
- perform exactly one revision pass;
- preserve strong content;
- correct identified issues;
- continue to document generation.

Never create an uncontrolled reflection loop.

Expose reflection results in:
- logs;
- API response;
- frontend.

README explanation:

"We implemented a reflection/self-check stage because LLM-generated documents may appear structurally complete while still missing user requirements or containing inconsistencies. The reflection stage evaluates the draft against the original request and execution plan, then allows one controlled revision before document generation. This improves output quality while keeping latency and API usage bounded."

---

## 10. DOCX Generation

Use `python-docx`.

Generate professional, request-specific documents.

Where relevant include:
- title;
- subtitle/context;
- generation date;
- executive summary;
- assumptions;
- structured sections;
- bullet lists;
- numbered actions;
- tables;
- timeline;
- roles and responsibilities;
- risks and mitigations;
- success metrics;
- recommendations;
- next steps;
- conclusion;
- footer.

Only include sections appropriate to the request.

Requirements:
- no leaked Markdown syntax;
- consistent heading hierarchy;
- readable tables;
- proper Word bullets;
- no empty sections;
- sanitized filenames;
- unique filename using timestamp or short UUID.

Generated documents must not be committed to Git.

---

## 11. Frontend

Build a minimal professional single-page frontend.

It must include:
- AgentDoc branding;
- short subtitle;
- request textarea;
- buttons/options for the two demo inputs;
- Run Agent button;
- loading state;
- interpreted goal;
- assumptions;
- generated task plan;
- tool selected per task;
- task statuses;
- execution summaries;
- reflection result;
- final summary;
- document retrieval button/link.

The frontend exists to visualize autonomy, not to become the main project.

Keep it clean, modern, restrained, responsive, and easy to demonstrate.

Do not use React or a separate frontend server.

Do not expose hidden reasoning or chain-of-thought.

---

## 12. Required Test Cases

### Test 1 — Standard Business Request

"Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. Include objectives, scope, phases, timeline, team responsibilities, risks, success metrics, and next steps."

Expected:
- project-plan intent recognized;
- dynamic plan generated;
- relevant assumptions;
- requested sections included;
- reflection performed;
- polished DOCX generated.

### Test 2 — Complex Ambiguous Request

"We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership. We want results quickly, the budget is limited, and engineering capacity is small. Decide what should be investigated first, make reasonable assumptions where information is missing, prioritize actions, define success metrics, risks, and a phased 90-day plan."

Expected:
- ambiguity recognized;
- missing information identified;
- reasonable assumptions made explicitly;
- investigation priorities decided autonomously;
- low-cost/high-information actions prioritized;
- phased 90-day plan created;
- metrics and risks defined;
- leadership-ready document produced;
- reflection performed.

Do not ask follow-up questions for this test.

The agent must make reasonable bounded assumptions.

---

## 13. Error Handling

Handle gracefully:
- missing API key;
- invalid API key;
- model failure;
- timeout;
- malformed structured output;
- invalid user request;
- unknown tool;
- document generation error;
- missing output directory;
- unsafe filename;
- missing document.

Requirements:
- create output directory automatically;
- use meaningful logs;
- never expose secrets;
- use bounded retries;
- return useful HTTP errors;
- do not repeatedly retry the same failure blindly.

---

## 14. Code Quality

Use:
- type hints;
- Pydantic models;
- pathlib;
- Python logging;
- focused functions;
- useful docstrings;
- separation of concerns;
- explicit error handling.

Maintain clear separation between:
- API;
- planner;
- executor;
- tool registry;
- LLM client;
- synthesizer;
- reflector;
- document generator;
- frontend.

Avoid:
- giant single-file implementation;
- fake execution;
- hardcoded test outputs;
- fixed plans;
- TODO placeholders;
- dead code;
- unnecessary abstractions.

---

## 15. Recommended Structure

A suitable structure is:

app/
  main.py
  models.py
  config.py

  agent/
    orchestrator.py
    planner.py
    executor.py
    synthesizer.py
    reflector.py

  llm/
    client.py

  tools/
    registry.py
    analysis_tool.py
    knowledge_tool.py
    document_tool.py

  prompts/
    planner_prompt.py
    executor_prompt.py
    synthesis_prompt.py
    reflection_prompt.py
    revision_prompt.py

  static/
    index.html
    styles.css
    app.js

  outputs/

tests/
requirements.txt
.env
.env.example
.gitignore
README.md

This structure may be simplified where beneficial, but preserve separation of concerns.

---

## 16. README

Create a professional README containing:
- project overview;
- features;
- architecture;
- agent workflow;
- folder structure;
- technologies;
- setup;
- environment variables;
- running instructions;
- API usage;
- frontend usage;
- both test cases;
- reflection/self-check explanation;
- error recovery;
- security considerations;
- debugging insight;
- engineering tradeoff;
- video demo flow;
- limitations;
- future improvements.

Include a Mermaid architecture diagram if appropriate.

Never include real secrets.

---

## 17. Debugging Story

Document a genuine debugging issue encountered during development.

A suitable story, only if it actually occurs, is malformed LLM JSON.

Possible explanation:
- model returned JSON inside Markdown fences or malformed structured output;
- parsing failed;
- root cause was probabilistic model output;
- fixed through cleaning, Pydantic validation, one repair retry, and deterministic fallback planning.

Do not fabricate an issue if a more genuine implementation problem occurs.

---

## 18. Engineering Tradeoff

Use:

### Autonomous Planning vs Deterministic Workflows

AgentDoc allows the LLM to dynamically determine:
- document type;
- assumptions;
- task decomposition;
- task order;
- tool mapping.

Fully unconstrained autonomy would reduce predictability and debuggability.

Therefore use bounded autonomy:
- LLM generates the plan;
- controlled tool allowlist;
- schema validation;
- safe fallback behavior;
- one revision maximum;
- controlled filesystem access;
- deterministic DOCX generation.

---

## 19. Git and Repository Safety

Repository URL will be provided separately in the launch prompt.

Before staging:
- create `.gitignore`;
- ensure `.env` is ignored;
- ensure generated DOCX files are ignored;
- ensure virtual environments and caches are ignored.

At minimum ignore:

.env
.env.*
!.env.example
__pycache__/
*.py[cod]
.venv/
venv/
env/
.pytest_cache/
.DS_Store
.idea/
.vscode/
app/outputs/*.docx
outputs/*.docx

Before every commit/push:
- inspect git status;
- inspect staged files;
- confirm `.env` is untracked;
- confirm API keys are absent;
- confirm generated documents are not staged.

Never:
- force push;
- rewrite remote history;
- commit secrets;
- delete unrelated files;
- use destructive Git commands.

Use meaningful commits and push only tested code.

---

## 20. Non-Destructive Execution

Only modify files belonging to this project.

Never use destructive broad deletion commands such as `rm -rf`.

Never:
- wipe the workspace;
- delete unrelated directories;
- reset unrelated repositories;
- overwrite unrelated user files;
- expose credentials.

If a command fails:
- inspect the error;
- identify the cause;
- change the approach;
- do not retry blindly.

---

## 21. Implementation Order

Follow this order:

1. Inspect workspace and Git state.
2. Create `.gitignore`.
3. Configure local environment securely.
4. Create project structure.
5. Implement models and config.
6. Implement LLM client.
7. Implement dynamic planner.
8. Implement structured validation and fallback.
9. Implement tool registry and tools.
10. Implement sequential executor.
11. Implement synthesizer.
12. Implement reflection and one-pass revision.
13. Implement DOCX generation.
14. Implement API endpoints.
15. Implement safe document retrieval.
16. Implement minimal frontend.
17. Create README.
18. Install dependencies.
19. Run syntax/import checks.
20. Start application.
21. Test health endpoint.
22. Run Test Case 1.
23. Verify DOCX exists and contains meaningful content.
24. Run Test Case 2.
25. Verify DOCX exists and contains meaningful content.
26. Confirm plans differ meaningfully.
27. Test invalid input.
28. Test path traversal protection.
29. Fix discovered issues.
30. Re-run tests.
31. Verify Git secret safety.
32. Commit and push safely.

---

## 22. Acceptance Criteria

The project is complete only when:

### Backend
- FastAPI starts successfully.
- `/health` works.
- `/agent` accepts valid requests.
- invalid input is handled.
- dynamic plans are generated.
- tasks execute sequentially.
- tool selection is visible.
- reflection runs.
- revision is limited to one pass.
- DOCX files are generated.
- document retrieval works safely.

### Autonomy
- plans are not hardcoded;
- both test cases produce meaningfully different plans;
- assumptions are explicit;
- complex test decides what to investigate first;
- previous execution context is used appropriately;
- reflection compares output against request and plan.

### Documents
- both tests create valid non-empty DOCX files;
- documents contain meaningful request-specific content;
- formatting is professional;
- standard test contains required project-plan sections;
- complex test contains a phased 90-day plan.

### Frontend
- page loads;
- request submission works;
- loading state is shown;
- goal, assumptions, plan, tools, statuses, reflection, and summary are visible;
- generated document can be retrieved.

### Security
- `.env` is ignored;
- secrets are not committed;
- API key is not exposed to frontend or logs;
- generated documents are not committed;
- path traversal is blocked.

### Repository
- README is complete;
- `.env.example` contains placeholders only;
- dependencies are reproducible;
- tested project is pushed safely.

---

## 23. Final Priority if Time Is Limited

Prioritize in this exact order:

1. Working POST `/agent`
2. Dynamic planning
3. Sequential task execution
4. Visible statuses
5. Request-specific synthesis
6. Reflection/self-check
7. Valid polished DOCX generation
8. Safe document retrieval
9. Both required tests
10. Minimal frontend
11. Error recovery
12. README and polish

Never sacrifice core autonomous behavior for frontend styling.
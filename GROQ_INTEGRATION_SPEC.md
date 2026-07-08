Resume work on the existing completed AgentDoc project.

This is a targeted provider-integration and verification task.

The project has already been implemented, tested in Demo Mode, committed, and pushed. Do NOT redesign the architecture, rebuild the project, rewrite working components, add unrelated features, change the frontend design unnecessarily, or expand the project scope.

The sole primary objective is:

Replace Demo Mode as the active execution path with a real Groq-backed LLM execution path, while preserving the existing AgentDoc architecture and strictly maintaining all requirements in `AgentDoc_BuildSpec.md`.

Read `AgentDoc_BuildSpec.md` completely before making changes. Treat it as the authoritative source of truth. The Groq integration must preserve the assignment requirements exactly.

PROJECT CONFIGURATION

Groq API Key:
gsk_...

IMPORTANT SECRET HANDLING:

The Groq API key above is sensitive.

Before writing it anywhere:

1. Inspect `.gitignore`.
2. Confirm `.env` is ignored.
3. Confirm `.env` is not currently tracked by Git.
4. Store the key only in the local `.env`.
5. Never print or echo the complete key.
6. Never place the real key in source code.
7. Never place it in frontend JavaScript.
8. Never place it in README.
9. Never place it in `.env.example`.
10. Never include it in logs or API responses.
11. Never commit or push it.
12. Before every commit and push, verify that no secret is staged, tracked, or present in repository files.

Do not repeat the key in your final response.

────────────────────────────────────
1. FIRST INSPECT THE CURRENT PROJECT
────────────────────────────────────

Before changing code:

1. Read `AgentDoc_BuildSpec.md` completely.
2. Inspect the current project structure.
3. Inspect the current Git status and branch.
4. Inspect the existing LLM client implementation.
5. Inspect configuration loading.
6. Inspect the current Demo Mode implementation.
7. Inspect planner integration.
8. Inspect executor and tool integration.
9. Inspect synthesis integration.
10. Inspect reflection and revision integration.
11. Inspect the FastAPI endpoints.
12. Inspect the frontend API interaction.
13. Inspect current tests.
14. Inspect README sections related to model providers and Demo Mode.

Determine exactly how the current pipeline works before making changes.

Do not assume the architecture based only on filenames or README text.

Trace the actual runtime path from:

POST /agent
→ orchestrator
→ planner
→ executor
→ tool routing
→ synthesizer
→ reflector
→ optional revision
→ document generation
→ API response.

Identify where Demo Mode currently intercepts or replaces real model calls.

Then make the smallest coherent set of changes needed to support real Groq execution.

────────────────────────────────────
2. PRESERVE THE EXISTING ARCHITECTURE
────────────────────────────────────

Do not redesign AgentDoc.

Preserve the existing architecture and separation of concerns, including the current equivalents of:

- FastAPI API layer;
- Pydantic validation;
- orchestrator;
- planner;
- sequential executor;
- controlled tool registry;
- Analysis Tool;
- Knowledge Tool;
- synthesizer;
- reflector;
- one-pass revision;
- deterministic python-docx generation;
- safe document retrieval;
- minimal frontend.

The intended real execution flow must remain:

User Request
→ Request Validation
→ Intent Understanding
→ Groq-backed Dynamic Planning
→ Assumption Generation
→ Tool Selection
→ Sequential Task Execution
→ Result Synthesis
→ Draft Creation
→ Reflection/Self-Check
→ Maximum One Revision Pass if Required
→ Deterministic DOCX Generation
→ API Response and Document Retrieval

Do not collapse this into one large LLM call.

Do not fake task statuses.

Do not replace dynamic planning with templates.

Do not add a multi-agent framework.

Do not introduce LangChain, LangGraph, CrewAI, a database, Redis, Celery, Docker, authentication, a vector database, or unrelated infrastructure.

This task is provider integration and real-pipeline verification only.

────────────────────────────────────
3. ADD GROQ AS THE REAL ACTIVE PROVIDER
────────────────────────────────────

Integrate Groq cleanly into the existing LLM abstraction.

Prefer the smallest reliable implementation compatible with the current architecture.

If the existing LLM client abstraction can support a provider adapter cleanly, extend it.

Do not rewrite the entire agent pipeline.

The rest of the application should continue calling the existing LLM abstraction rather than importing Groq-specific code throughout the planner, executor, tools, synthesizer, or reflector.

Use either:

- the official Groq Python SDK; or
- Groq's OpenAI-compatible API interface,

whichever produces the smallest, clearest, and most reliable integration with the current code.

Do not use deprecated client patterns.

Update dependencies only as necessary.

Configuration should conceptually support:

GROQ_API_KEY=<local secret>
GROQ_MODEL=<valid model identifier>
LLM_PROVIDER=groq
USE_DEMO_MODE=false

Adapt variable names to the existing configuration architecture if necessary, but keep configuration clear.

Update `.env.example` with placeholders only, for example:

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=your_model_name_here
LLM_PROVIDER=groq
USE_DEMO_MODE=false

Do not include the real key.

Before choosing a model identifier:

1. Determine which Groq models are currently accessible using the configured account/API.
2. Select an appropriate currently available general-purpose instruction/reasoning model suitable for:
   - structured planning;
   - business document generation;
   - JSON output;
   - synthesis;
   - reflection.
3. Make the model configurable through the environment.
4. Do not scatter a hardcoded model identifier throughout the codebase.
5. Do not guess an obsolete model name.

The active demo configuration for final verification must use:

LLM_PROVIDER=groq
USE_DEMO_MODE=false

or the equivalent configuration supported by the project's existing architecture.

────────────────────────────────────
4. KEEP DEMO MODE ONLY AS AN EXPLICIT FALLBACK
────────────────────────────────────

Do not delete Demo Mode if removing it would create unnecessary changes.

It may remain as an explicit development/testing fallback, but it must NOT be the active path during final verification.

Demo Mode must never silently activate during the final real-LLM tests.

For the final verification:

- Groq must be the active provider.
- Demo Mode must be false/disabled.
- The API must fail clearly if Groq authentication or model access fails.
- Do not silently switch to deterministic outputs and report the run as successful real LLM execution.

If the current application automatically falls back to Demo Mode after a provider error, inspect that behavior carefully.

For final verification, ensure there is an observable distinction between:

1. successful real Groq execution;
2. explicit Demo Mode execution;
3. provider failure.

A provider authentication or API failure must not be mislabeled as successful real LLM execution.

────────────────────────────────────
5. STRUCTURED PLANNING MUST REMAIN DYNAMIC
────────────────────────────────────

The Groq-backed planner must dynamically inspect each request and produce structured planning output compatible with the existing Pydantic models.

Preserve the current planning schema or its existing equivalent.

Conceptually it should include:

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

Allowed tool names must remain controlled.

Do not permit arbitrary tool execution.

The two assignment test cases must produce meaningfully different plans.

Additionally, test at least one unseen request that is not specifically handled by Demo Mode keyword patterns or hardcoded fixtures.

The unseen test exists only to verify genuine generalization of the real LLM planner. Do not add it as a hardcoded application path.

Use this unseen test:

"Create a practical incident response SOP for a SaaS company experiencing recurring production database outages. Include severity levels, detection and triage, escalation responsibilities, internal and customer communication, recovery steps, service restoration checks, and a post-incident review process."

Expected behavior:

The real planner should recognize an SOP/incident-response document and generate a request-specific plan substantially different from both assignment test cases.

Do not hardcode expected task names for this test.

The point is to prove that the planner is genuinely dynamic.

────────────────────────────────────
6. PRESERVE STRUCTURED OUTPUT RELIABILITY
────────────────────────────────────

The real Groq integration must preserve or improve the existing defensive handling of model output.

Inspect how structured output is currently parsed.

Maintain:

1. structured prompting;
2. JSON parsing;
3. Markdown code-fence cleanup if needed;
4. Pydantic validation;
5. one bounded repair retry where appropriate;
6. safe deterministic fallback planning only where already architecturally justified.

Important distinction:

A deterministic fallback plan for malformed planner JSON may remain as resilience behavior if required by the project specification.

However, this must not silently turn the entire application into Demo Mode.

A malformed planning response and an explicit Demo Mode are separate concepts.

Do not report fallback planning as successful Groq-generated planning.

Log recovery behavior safely without exposing prompts containing secrets or any API credentials.

────────────────────────────────────
7. REAL MULTI-STEP EXECUTION
────────────────────────────────────

Verify that real Groq calls are used in the intended semantic stages of the current architecture.

Trace and confirm the actual implementation.

The expected architecture should use the model where semantic generation is required, while Python controls orchestration.

Depending on the existing implementation, this should include the appropriate equivalents of:

- planning;
- task execution through Analysis/Knowledge tools;
- synthesis;
- reflection;
- optional revision.

Do not artificially increase the number of API calls just to make the project appear more autonomous.

Preserve the existing efficient architecture.

Do not merge all stages into one call.

Each planned task must continue to have genuine execution state management:

- pending;
- running;
- completed;
- failed;
- recovered,

or the existing equivalent.

Relevant previous execution context should continue to flow into later tasks where appropriate.

Keep context bounded and avoid unnecessary prompt duplication.

────────────────────────────────────
8. RATE LIMIT AND LATENCY AWARENESS
────────────────────────────────────

Groq free-tier limits may be model-specific.

Do not overcomplicate the architecture, but make the existing pipeline practical for a live demo.

Inspect the number of LLM calls made by one `/agent` request.

Do not remove required autonomous stages merely to reduce calls.

However:

- avoid duplicate unnecessary model calls;
- avoid accidental repeated execution;
- avoid retry loops;
- keep repair retry bounded;
- keep reflection revision limited to one pass;
- do not call the model twice for identical work;
- do not send unnecessarily huge duplicated context.

If the free-tier API returns a rate-limit response during testing:

1. identify the exact sanitized error;
2. determine whether it is requests-per-minute, tokens-per-minute, or another model-specific limit;
3. make the smallest reasonable adjustment;
4. do not bypass required assignment behavior;
5. do not silently switch to Demo Mode and claim real execution.

If modest retry handling for transient 429 or network errors is needed, keep it bounded and simple.

────────────────────────────────────
9. DO NOT CHANGE THE FRONTEND UNNECESSARILY
────────────────────────────────────

The frontend has already been tested successfully.

Do not redesign it.

Do not change styling merely for preference.

Only modify frontend code if required to:

- accurately represent real provider execution;
- fix a genuine discovered bug;
- expose an already-existing useful high-level status required by the specification.

The frontend should continue showing:

- interpreted goal;
- assumptions;
- dynamic task plan;
- tool selected;
- task statuses;
- execution summaries;
- reflection result;
- final summary;
- document link.

Do not expose chain-of-thought or hidden reasoning.

Do not expose API credentials.

Do not add unnecessary model/provider controls to the UI unless the existing architecture genuinely requires them.

Provider selection should remain server-side configuration.

────────────────────────────────────
10. FIRST TEST THE GROQ CONNECTION IN ISOLATION
────────────────────────────────────

Before running the full expensive pipeline:

1. Confirm the Groq API key is loaded from `.env` without printing it.
2. Confirm the selected model is accessible.
3. Make one minimal safe test call through the implemented LLM client.
4. Confirm a valid response.
5. Report only sanitized status information.
6. Do not print the API key.
7. Do not expose sensitive headers.

Only after the isolated provider test succeeds should you run the complete AgentDoc pipeline.

If the provider test fails:

- diagnose the actual cause;
- do not enable Demo Mode as a workaround;
- do not make unrelated application changes;
- report the sanitized error if genuinely blocked.

────────────────────────────────────
11. RUN THE TWO REQUIRED ASSIGNMENT TESTS IN REAL MODE
────────────────────────────────────

After Groq integration succeeds, run both exact required tests with Demo Mode disabled.

TEST CASE 1:

"Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. Include objectives, scope, phases, timeline, team responsibilities, risks, success metrics, and next steps."

Verify:

- real Groq provider is active;
- project-plan intent is recognized;
- assumptions are generated;
- dynamic task plan is generated;
- appropriate tools are selected;
- tasks execute sequentially;
- execution summaries are meaningful;
- synthesis creates project-specific content;
- reflection executes;
- revision occurs only if required;
- valid DOCX is generated;
- document is non-empty;
- required sections are present;
- document retrieval works.

TEST CASE 2:

"We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership. We want results quickly, the budget is limited, and engineering capacity is small. Decide what should be investigated first, make reasonable assumptions where information is missing, prioritize actions, define success metrics, risks, and a phased 90-day plan."

Verify:

- real Groq provider is active;
- ambiguity is recognized;
- explicit assumptions are made;
- the plan differs meaningfully from Test Case 1;
- the system decides what should be investigated first;
- low-cost/high-information diagnostics are prioritized;
- limited budget is considered;
- limited engineering capacity is considered;
- priorities are clear;
- success metrics are defined;
- risks are included;
- a phased 90-day plan is present;
- reflection executes;
- DOCX is valid and non-empty;
- document retrieval works.

Do not ask follow-up questions for Test Case 2.

The agent must make bounded reasonable assumptions as required by the assignment.

────────────────────────────────────
12. RUN THE UNSEEN GENERALIZATION TEST
────────────────────────────────────

After the two required tests pass, run:

"Create a practical incident response SOP for a SaaS company experiencing recurring production database outages. Include severity levels, detection and triage, escalation responsibilities, internal and customer communication, recovery steps, service restoration checks, and a post-incident review process."

Verify:

- real Groq mode remains active;
- document type is recognized appropriately;
- plan is not a copy of the chatbot project plan;
- plan is not a copy of the onboarding improvement plan;
- tasks are relevant to incident response;
- final document structure is appropriate for an SOP;
- reflection runs;
- DOCX is generated successfully.

This test is for internal verification of genuine dynamic behavior.

Do not unnecessarily add this third test to the assignment requirements or present it as a mandatory requirement in the README. It may be mentioned as additional validation if useful.

────────────────────────────────────
13. VERIFY DOCUMENT CONTENT PROGRAMMATICALLY
────────────────────────────────────

For all final real-mode tests:

1. Confirm the `.docx` file exists.
2. Confirm file size is non-zero.
3. Open it using `python-docx`.
4. Inspect paragraphs and tables programmatically.
5. Confirm meaningful request-specific content exists.
6. Confirm no raw JSON is dumped into the document.
7. Confirm no Markdown code fences appear.
8. Confirm headings and sections are structurally reasonable.
9. Confirm the document matches the requested document type.

Do not commit generated test documents.

────────────────────────────────────
14. VERIFY THE FRONTEND WITH REAL GROQ MODE
────────────────────────────────────

After backend real-mode tests succeed:

1. Start the FastAPI application as documented.
2. Keep it running.
3. Open the actual frontend.
4. Submit at least one required test through the frontend.
5. Confirm the visible result came from the real Groq-backed pipeline.
6. Confirm:
   - loading state works;
   - result sections render;
   - assumptions render;
   - plan renders;
   - tools render;
   - statuses render;
   - reflection renders;
   - final summary renders;
   - document link works.

Inspect browser console and backend logs for genuine errors.

Do not use a headless-only result as the sole frontend verification if an interactive browser is available.

────────────────────────────────────
15. UPDATE README ACCURATELY
────────────────────────────────────

Update README only where necessary to reflect the actual final implementation.

Do not rewrite unrelated sections.

The README must accurately explain:

- Groq is the active real LLM provider for the demonstrated configuration;
- model name is configurable;
- Demo Mode exists only as an explicit fallback/development mode if retained;
- how to configure Groq safely;
- how to run the application;
- that generated documents are ignored;
- the bounded-autonomy architecture;
- reflection/self-check;
- error handling;
- tradeoff discussion.

Remove or correct any wording that could falsely imply the final successful tests used OpenAI if they used Groq.

Remove or correct any wording that presents Demo Mode outputs as real LLM-generated autonomous decisions.

Do not claim provider capabilities that were not tested.

Do not include the real Groq key.

Keep the assignment-focused architecture explanation intact.

────────────────────────────────────
16. PRESERVE THE ASSIGNMENT TRADEOFF
────────────────────────────────────

Maintain the project's existing engineering tradeoff:

Autonomous Planning vs Deterministic Workflows.

The accurate explanation should remain:

The LLM dynamically determines:

- interpreted goal;
- document type;
- assumptions;
- task decomposition;
- task ordering;
- controlled tool mapping.

Python deterministically controls:

- validation;
- orchestration;
- tool allowlist;
- task status transitions;
- schema validation;
- retry bounds;
- reflection revision limit;
- filesystem safety;
- DOCX generation;
- document retrieval.

Do not change this into a multi-agent architecture.

────────────────────────────────────
17. SECURITY AND GUARDRAILS
────────────────────────────────────

Maintain all existing security requirements.

The LLM must not have arbitrary shell access.

LLM-generated tool names must map only to controlled Python tools.

Unknown tools must use the existing safe recovery behavior.

Document retrieval must remain protected against path traversal.

Requests must remain validated.

Secrets must never be exposed.

Before committing:

1. Inspect `git status`.
2. Inspect staged files.
3. Confirm `.env` is ignored and untracked.
4. Confirm the Groq key does not appear in tracked project files.
5. Confirm the OpenAI key, if still locally present, does not appear in tracked files.
6. Confirm generated `.docx` files are ignored.
7. Confirm virtual environments and caches are ignored.
8. Confirm no temporary provider-test output contains secrets.
9. Run relevant tests again after final changes.

Do not print full environment files during diagnostics.

Do not use commands that expose secret values.

────────────────────────────────────
18. NON-DESTRUCTIVE CHANGE RULES
────────────────────────────────────

Only modify files necessary for:

- Groq provider integration;
- configuration;
- dependency changes;
- tests;
- minimal error handling required by real provider use;
- accurate README documentation.

Do not perform unrelated refactoring.

Do not rename the project.

Do not redesign the UI.

Do not replace FastAPI.

Do not replace python-docx.

Do not replace the custom orchestrator with an agent framework.

Do not delete working features.

Never use destructive broad deletion commands.

Never:

- wipe the workspace;
- delete unrelated files;
- reset unrelated repositories;
- force-push;
- rewrite Git history;
- expose credentials.

If an existing implementation differs slightly from this prompt but already satisfies `AgentDoc_BuildSpec.md`, preserve the working implementation rather than changing it for stylistic reasons.

────────────────────────────────────
19. DEBUGGING PROCESS
────────────────────────────────────

If an issue occurs:

1. inspect the exact sanitized error;
2. identify the actual root cause;
3. determine whether the problem is:
   - provider authentication;
   - model access;
   - configuration loading;
   - request formatting;
   - structured output parsing;
   - rate limiting;
   - context/token size;
   - orchestration integration;
   - document generation;
   - frontend/backend interaction;
4. make the smallest targeted fix;
5. rerun the failing test;
6. rerun affected end-to-end tests.

Do not repeatedly retry failed API calls without understanding the failure.

Keep a brief record of genuine issues encountered during this Groq integration. If this produces a stronger truthful debugging story than the previous Demo Mode/OpenAI 401 issue, update the README debugging section accurately.

Do not fabricate debugging events.

────────────────────────────────────
20. FINAL GIT WORKFLOW
────────────────────────────────────

After all real-mode verification is complete:

1. Inspect all changes.
2. Inspect Git diff.
3. Verify changes are limited to necessary provider integration and related documentation/testing.
4. Run final relevant tests.
5. Verify secret safety.
6. Stage only appropriate project files.
7. Inspect staged diff.
8. Confirm no `.env` file is staged.
9. Confirm no API key appears in staged content.
10. Confirm no generated DOCX is staged.
11. Create a clear commit describing the Groq real-LLM integration.
12. Push normally to the existing main branch.
13. Do not force-push.

If authentication prevents Git push, preserve local work and report the sanitized blocker.

────────────────────────────────────
21. COMPLETION CRITERIA
────────────────────────────────────

Do not declare this task complete until all feasible criteria are satisfied:

Provider:
- Groq key loads securely.
- Selected Groq model is accessible.
- Minimal isolated model call succeeds.
- Groq is the active provider.
- Demo Mode is disabled for final tests.

Pipeline:
- `/agent` works using real Groq execution.
- Planner dynamically generates structured plans.
- task execution remains sequential.
- controlled tool routing works.
- synthesis works.
- reflection works.
- revision remains bounded to one pass.
- DOCX generation works.

Required tests:
- Test Case 1 passes in real mode.
- Test Case 2 passes in real mode.
- their plans differ meaningfully.
- both generate valid non-empty documents.
- both documents contain appropriate request-specific content.

Generalization:
- unseen incident-response SOP test produces a genuinely different plan and appropriate document.

Frontend:
- frontend works with real Groq mode.
- visible results render correctly.
- document retrieval works.

Security:
- no API keys are committed.
- `.env` remains ignored.
- generated documents remain ignored.
- path traversal protection remains intact.
- no arbitrary LLM-driven shell execution exists.

Documentation:
- README accurately describes Groq integration and actual execution modes.
- no misleading claims remain about Demo Mode or provider usage.

Repository:
- changes are committed.
- changes are pushed safely.
- working tree is clean or any remaining local-only ignored files are understood.

────────────────────────────────────
22. FINAL REPORT
────────────────────────────────────

At completion, provide a concise factual report containing:

1. Existing architecture preserved.
2. Files changed and why.
3. Groq integration approach used.
4. Selected model identifier and why it was selected.
5. Confirmation that the key was stored only in local `.env`.
6. Confirmation that Demo Mode was disabled for final tests.
7. Result of isolated Groq connection test.
8. Test Case 1 result.
9. Test Case 2 result.
10. Evidence that the plans differed meaningfully.
11. Unseen incident-response SOP test result.
12. Reflection and revision behavior observed.
13. DOCX verification results.
14. Frontend real-mode verification result.
15. Any rate-limit or provider issues encountered.
16. Genuine debugging issue encountered, if any.
17. Security checks performed.
18. Git commit and push status.
19. Any remaining limitations.

Do not include or repeat any secret values.

## Local Startup and Demo Reliability

Do not change the frontend framework or introduce React/Vite.

Preserve the existing FastAPI-served HTML/CSS/JavaScript frontend.

Ensure the application has one clear, reliable startup command that starts both:
- the FastAPI backend API;
- the existing static frontend served by FastAPI.

Verify that the README clearly documents the exact startup sequence.

If practical, add a small non-destructive convenience startup script such as `run.sh` for macOS/Linux that:
- activates or uses the expected local Python environment safely;
- starts the FastAPI application;
- does not daemonize hidden processes;
- does not expose environment secrets.

The application is expected to remain available only while the server process is running. Do not attempt to solve normal server lifecycle behavior by introducing React, a second development server, Docker, or unnecessary process-management infrastructure.

For final verification, start the server, confirm it remains running, verify `/health`, verify `/`, and perform the frontend tests while the server process is active.

Document the exact command the user should run before recording the demo.
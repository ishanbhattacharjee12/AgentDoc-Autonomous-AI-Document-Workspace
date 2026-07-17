# AgentDoc --- Architecture Refactor & Production Hardening Specification

## IMPORTANT

This specification supersedes all previous architectural refactor discussions, implementation notes, and optimization plans.

If any previous documents (such as Build_Spec.md or Refinement.md) conflict with this specification, this document takes precedence.

Treat this document as the single source of truth for all future architectural decisions.

This is an architectural refactor focused on production hardening, not a feature expansion.

> **Purpose**
>
> This document defines the final engineering refactor required to
> transform AgentDoc into a flagship portfolio project. It is **not** a
> feature expansion. The objective is to improve performance,
> reliability, maintainability, and production readiness while
> preserving the existing autonomous-agent architecture.

------------------------------------------------------------------------

# 1. Project Context

AgentDoc is an autonomous AI document generation platform built around a
logical pipeline:

``` text
Planner
   ↓
Executor
   ↓
Synthesizer
   ↓
Reflector
```

Supporting capabilities:

-   Human Review Mode
-   SSE live execution
-   Explainability dashboard
-   Provider abstraction
-   Multi-format exports (DOCX / PDF / HTML / Markdown)
-   Professional UI
-   Analytics dashboard

These are strengths and **must remain**.

The current bottlenecks are:

-   \~300--350 second execution time
-   \~31,000 tokens per request
-   6+ sequential LLM calls
-   Reflection failures occasionally surface provider issues
-   Planner over-engineers simple requests
-   Excessive context duplication
-   Poor UX caused by long waits

Target:

-   15--20 second default execution
-   3--4 network calls maximum
-   10--15k tokens
-   No provider errors visible to users
-   Reliable structured output
-   Preserve existing architecture

------------------------------------------------------------------------

# 2. Architectural Principles

These MUST remain:

-   Planner
-   Executor
-   Synthesizer
-   Reflector
-   Human Review
-   SSE Streaming
-   Explainability
-   Provider abstraction
-   Multi-format exports

Do NOT:

-   Convert into a chatbot
-   Collapse into one unstructured prompt
-   Remove explainability
-   Remove autonomous planning

The logical pipeline remains unchanged.

------------------------------------------------------------------------

# 3. Decouple Architecture from API Calls

Keep four logical stages.

Do NOT map every stage 1:1 to a network request.

## Standard Mode (Default)

Call 1:

Planner + Executor + Synthesizer

Return structured JSON containing:

-   plan
-   phase outputs
-   synthesized content

Internally populate the Planner, Executor, Synthesizer objects
separately so the UI still behaves exactly as before.

Call 2:

Lightweight Reflector.

Total:

2 network calls.

## Advanced Analysis Mode

(Optional)

Retain the original multi-stage implementation.

Clearly label it as slower and more thorough.

------------------------------------------------------------------------

# 4. Model Capability Registry

Never hardcode model names inside business logic.

Create a configuration-driven capability registry.

Each model profile contains:

-   provider
-   reasoning
-   supports_json
-   latency_tier
-   streaming
-   max_output_tokens

Pipeline chooses usage profiles:

-   fast_generation
-   reflection
-   deep_analysis

Changing models must require only configuration updates.

------------------------------------------------------------------------

# 5. Planner Redesign

Planner should become template-first.

Common document types:

-   Project Plan
-   Proposal
-   Business Report
-   SOP
-   Technical Design

Use adaptive templates.

Planner may customize phases.

Planner must never exceed five phases.

Classification must NOT require another LLM call.

Perform heuristic classification in code or fold it into the first
prompt.

------------------------------------------------------------------------

# 6. Executor Redesign

Executor operates on phases.

Not micro tasks.

One phase produces one cohesive structured output.

Parallelize independent phases only in Advanced Mode.

------------------------------------------------------------------------

# 7. Context Passing

Replace repeated conversation history with a shared state object.

State includes:

-   request summary
-   constraints
-   selected template
-   phase summaries

Never resend full execution history unless required.

Goal:

Reduce tokens by \>50%.

------------------------------------------------------------------------

# 8. Prompt Design Rules

Every prompt must follow:

-   No duplicated instructions.
-   No repeated context.
-   Prefer schemas over verbose prose.
-   Minimize tokens.
-   Preserve quality while reducing size.

Prompt changes must reduce---not increase---prompt length whenever
possible.

------------------------------------------------------------------------

# 9. Reflection

Reflection must never block delivery.

On timeout, parse error, malformed JSON, or provider failure:

-   Skip reflection.
-   Log internally.
-   Return pre-reflection document.

Users must never see provider internals.

------------------------------------------------------------------------

# 10. Execution Caching

Implement hash-based caching.

Reuse outputs whose inputs have not changed.

Small edits should only regenerate affected downstream stages.

------------------------------------------------------------------------

# 11. Timeouts

Introduce stage-specific timeouts.

Suggested defaults:

-   Planner: 20 s
-   Executor: 30 s
-   Synthesizer: 20 s
-   Reflector: 10 s

On timeout:

-   retry once using a faster capability profile where appropriate
-   otherwise fail gracefully

Never leave the UI appearing frozen.

------------------------------------------------------------------------

# 12. Reasoning Models

Only Advanced Mode should use reasoning-heavy models.

Strip:

-   `<think>`{=html}
-   `<analysis>`{=html}
-   reasoning blocks

before parsing.

JSON repair remains a fallback, not the primary parser.

------------------------------------------------------------------------

# 13. Performance Instrumentation

Every optimization must record before/after metrics.

Track:

-   total execution time
-   stage timings
-   LLM call count
-   tokens
-   average latency
-   time-to-first-token
-   retries
-   cache hits

No optimization should be accepted without measurable improvement.

------------------------------------------------------------------------

# 14. Rollback Policy

Performance improvements must not reduce:

-   document quality
-   export quality
-   planner correctness
-   JSON reliability
-   UX

If quality regresses, redesign or revert.

Never trade correctness solely for speed.

------------------------------------------------------------------------

# 15. Success Criteria

-   15--20 second execution
-   2 calls in Standard Mode
-   ≤4 calls in Advanced Mode
-   10--15k tokens
-   ≤5 planner phases
-   reflection failures hidden from users
-   planner/executor/synthesizer preserved logically
-   SSE timeline unchanged
-   provider abstraction preserved
-   no provider-specific hardcoding

------------------------------------------------------------------------

# 16. Recommended Implementation Order

1.  Context trimming
2.  Prompt optimization
3.  Capability registry
4.  Standard Mode (merged calls)
5.  Planner templates
6.  Reflection soft-fail
7.  Timeouts
8.  Execution caching
9.  Advanced Mode
10. Benchmark everything

------------------------------------------------------------------------

# 17. Final Engineering Review Request

Act as a Staff AI Software Engineer.

Do not immediately implement changes.

First review:

-   architecture
-   execution flow
-   prompts
-   batching
-   planner
-   executor
-   synthesizer
-   reflection
-   provider abstraction
-   frontend UX
-   scalability
-   maintainability

For every issue provide:

1.  Problem
2.  Root cause
3.  Impact
4.  Multiple possible solutions
5.  Recommended solution
6.  Estimated implementation effort
7.  Expected performance improvement
8.  Risks

Only after the review is complete should implementation begin.

The objective is not to add features.

The objective is to make AgentDoc feel like a production-quality AI SaaS
application while preserving its autonomous-agent architecture.


# Final Engineering Review Instructions

Before implementing any changes, perform a complete architectural review of the current codebase against this specification.

Do NOT immediately begin coding.

First identify:

- architectural conflicts
- incorrect assumptions
- hidden dependencies
- implementation risks
- opportunities to simplify the design
- possible performance bottlenecks
- opportunities to reduce latency without sacrificing quality

For every major issue provide:

1. Problem
2. Root Cause
3. Impact
4. Multiple Possible Solutions
5. Advantages and disadvantages of each solution
6. Recommended Solution
7. Expected Performance Improvement
8. Implementation Complexity
9. Trade-offs

If you disagree with any recommendation in this specification, explain why and propose a better alternative.

Only after completing the architectural review and producing a concrete implementation plan should implementation begin.

------------------------------------------------------------------------

# During implementation:

- verify every optimization with measurable benchmarks
- record before/after execution time
- record before/after token usage
- record before/after LLM call count
- record stage-by-stage latency
- preserve document quality
- preserve the Planner → Executor → Synthesizer → Reflector architecture

Never optimize solely for speed if it significantly reduces document quality or the engineering quality of the project.

The objective is to produce a production-quality flagship AI portfolio project rather than simply reducing execution time.

------------------------------------------------------------------------

## Provider Configuration

The project currently uses the OpenCode Zen gateway.

The API key is stored only in the local `.env` file.

Never hardcode API keys or secrets into source code or documentation.

Read all provider configuration from environment variables:

- LLM_PROVIDER
- LLM_API_KEY
- LLM_BASE_URL
- LLM_MODEL

If additional configuration is required, extend the environment configuration rather than embedding secrets into the repository.

------------------------------------------------------------------------

When implementation is complete, perform a final end-to-end review of the entire project and recommend any remaining improvements that would further strengthen AgentDoc as a flagship AI portfolio project before considering the refactor complete.
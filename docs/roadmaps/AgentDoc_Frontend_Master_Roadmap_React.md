# AgentDoc Frontend Redesign Master Specification

**Version:** 2.0 **Status:** Approved Design Roadmap **Implementation
Target:** React + Vite + FastAPI Backend

------------------------------------------------------------------------

# Executive Vision

AgentDoc's backend has reached production-quality maturity. The next
milestone is to rebuild the frontend into a modern AI SaaS application
while preserving every backend capability.

This is **not** a backend rewrite.

This is a **frontend architecture migration** from the existing
HTML/CSS/JavaScript implementation to a component-based React
application using Vite.

The existing FastAPI backend remains unchanged and becomes a clean API
provider.

Target architecture:

``` text
React (Vite)
    │
    ▼
FastAPI REST + SSE
    │
    ▼
Agent Pipeline
    │
    ▼
LLMs / PDF Generator
```

------------------------------------------------------------------------

# Primary Objectives

-   Preserve all backend behaviour.
-   Modernize the frontend architecture.
-   Introduce reusable React components.
-   Improve UX without changing business logic.
-   Produce a polished portfolio-quality AI SaaS application.

------------------------------------------------------------------------

# Design Inspiration

The UI should be **inspired** by the design language of the existing
Verity project.

Do NOT clone Verity.

Borrow the principles:

-   Light, spacious layout
-   Clear visual hierarchy
-   Persistent navigation
-   Premium typography
-   Rounded cards
-   Restrained use of color
-   One primary accent color (AgentDoc's existing purple/indigo)
-   Large amounts of whitespace
-   Calm, enterprise SaaS aesthetic

Also take inspiration from products such as:

-   ChatGPT
-   Claude
-   Cursor
-   Notion AI
-   Linear
-   Harvey AI

Avoid:

-   Glassmorphism
-   Heavy gradients
-   Dashboard clutter
-   Multiple accent colors
-   Dense layouts
-   Excessive animations

------------------------------------------------------------------------

# Technology Stack

Frontend

-   React 19+
-   Vite
-   React Router
-   CSS Modules or Tailwind (choose one and stay consistent)
-   Lucide Icons
-   React Markdown (if required)
-   Context API (Phase 1)
-   Optional Zustand (future)

Backend

-   Existing FastAPI
-   Existing SSE endpoints
-   Existing PDF generation
-   Existing orchestration

No backend refactoring.

------------------------------------------------------------------------

# Project Structure

``` text
src/
  components/
  layouts/
  pages/
  hooks/
  context/
  services/
  styles/
  assets/
  utils/
```

Every UI element should become a reusable component.

------------------------------------------------------------------------

# Design System

## Colors

Background: - #FAFAFA - #F7F8FC

Cards: - White

Primary Text: - #1A1A2E

Secondary Text: - #6B7280

Border: - #E5E7EB

Accent: - Existing AgentDoc Purple

Only one accent color.

------------------------------------------------------------------------

# Typography

Modern sans-serif (Inter preferred).

Consistent scale:

Display H1 H2 H3 Body Caption

Use typography---not borders---to create hierarchy.

------------------------------------------------------------------------

# PHASE 1 --- Foundation

Goal: Build a professional React application shell without changing
functionality.

## Deliverables

### 1. React Migration

Migrate the existing frontend to React + Vite.

Keep every backend endpoint unchanged.

### 2. Application Shell

Persistent left sidebar.

Navigation:

-   Generate
-   History (placeholder)
-   Settings (placeholder)

### 3. Global Design System

Create reusable:

-   Buttons
-   Cards
-   Inputs
-   Selects
-   Toggles
-   Badges
-   Section headers
-   Empty states
-   Loading states

### 4. Landing Page

Clean document generation experience.

Visible:

-   Prompt
-   Pipeline selector
-   Format selector
-   Run Agent

Developer diagnostics move into collapsed Advanced Settings.

### 5. Theme

Light theme throughout.

Every screen must follow one design language.

### 6. Streaming

Retain existing streaming logic.

Improve presentation only.

### Acceptance Criteria

-   Backend unchanged
-   Streaming unchanged
-   PDF generation unchanged
-   All existing features work
-   React frontend operational

------------------------------------------------------------------------

# PHASE 2 --- Workflow Experience

Goal: Improve usability and information architecture.

## Implement

-   Dedicated Results page
-   React Router navigation
-   Compact Overview section
-   Tabs:
    -   Document
    -   Execution
    -   Metrics
    -   Insights
-   Compact document preview
-   Better Explainability dashboard
-   Responsive two-column layouts
-   Better loading and empty states

Do not modify backend APIs.

------------------------------------------------------------------------

# PHASE 3 --- Product Polish

Goal: Transform AgentDoc into a portfolio-grade SaaS.

## Features

-   History page
-   Settings page
-   Theme persistence
-   Keyboard shortcuts
-   Better animations
-   Toast notifications
-   Better onboarding
-   Skeleton loading
-   Accessibility improvements
-   Responsive refinements

Optional future enhancements:

-   Authentication
-   Cloud storage
-   Team workspaces
-   Analytics

------------------------------------------------------------------------

# UX Principles

Every screen should answer:

-   What am I looking at?
-   What should I do next?
-   What just happened?

Avoid endless scrolling.

Progressively disclose advanced information.

Document should always be primary.

------------------------------------------------------------------------

# Visual QA Checklist

Before every release verify:

-   Consistent spacing
-   Typography hierarchy
-   Sidebar consistency
-   Card consistency
-   One accent color
-   Readability
-   Responsive layout
-   Accessibility
-   Performance
-   No regressions

------------------------------------------------------------------------

# Verification

For each phase provide:

-   Before/after screenshots
-   Architecture summary
-   Component inventory
-   QA checklist
-   Manual verification report

------------------------------------------------------------------------

# Final Deliverable

The finished application should resemble a polished commercial AI SaaS
product.

Someone opening AgentDoc should immediately think:

"This looks like software that could be shipped to customers."

without any changes to the mature backend already in place.

# AgentDoc Frontend Master Roadmap — Addendum

**Purpose:** This addendum closes gaps identified in a review of Master
Specification v2.0. Append this section to the end of that document.
Nothing here changes the approved direction, phasing, or design language —
it adds missing operational detail the coding agent will otherwise have to
guess at.

------------------------------------------------------------------------

# Addendum 1 — Resolving the History/Settings vs. "No Backend Refactoring" Conflict

**Problem:** The spec lists "History" (Phase 1 placeholder, Phase 3 real
feature) and "Settings" (Phase 3) as frontend deliverables, while also
stating "No backend refactoring" throughout. A functional History page
requires persisted storage of past generated documents, which does not
currently exist in the backend. A functional Settings page that actually
changes model/provider behavior requires reading and writing the Model
Capability Registry config, which is backend-adjacent even if it isn't
pipeline logic.

**Resolution — make this explicit so the agent doesn't guess:**

- **Phase 1 "History" and "Settings":** frontend-only placeholder pages.
  Render the nav item, an empty state ("No history yet" / "Settings coming
  soon"), and nothing functional behind it. No backend calls.
- **Phase 3 "History":** before implementing this as a real feature,
  explicitly decide and document one of:
  - (a) Frontend-only, browser-local persistence (e.g. `localStorage`
    equivalent or IndexedDB) of recently generated documents for the
    current browser/session only — no backend changes required, but
    history is lost if the user clears browser data or switches devices.
  - (b) A new, explicitly-scoped backend persistence endpoint (e.g. a
    simple SQLite table storing past generations) — this **is** a backend
    change and must be called out and approved as such before work starts,
    not silently added under the umbrella of "frontend redesign."
  - Do not let the coding agent default to (b) without flagging it
    explicitly as an out-of-scope backend addition first.
- **Phase 3 "Settings":** same distinction — if Settings only controls
  frontend preferences (theme, display density, etc.), it's pure frontend.
  If it's meant to let a user change the active model/provider at runtime,
  that requires a backend config read/write path and must be scoped and
  approved explicitly, not assumed.

------------------------------------------------------------------------

# Addendum 2 — Migration Safety & Rollback Plan

**Problem:** This is a full frontend rewrite of the application currently
used for live demos. Nothing in the spec addresses how to avoid a period
where AgentDoc has no working, demoable frontend.

**Requirements:**

- The existing HTML/CSS/JS frontend must remain fully intact and servable
  throughout Phase 1 and Phase 2 development — e.g. served at its current
  path/port, or behind a separate route/flag — so there is always a known
  -working version to demo if the React migration is mid-flight.
- Do not remove, delete, or overwrite the existing frontend files until
  the React version has passed all Phase 1 acceptance criteria and been
  manually verified end-to-end (form submission → plan review → streaming
  → results → PDF download all working).
- Recommend working in a separate branch or a clearly separated directory
  (e.g. `frontend-react/` alongside the existing static frontend) rather
  than replacing files in place, so rollback is a non-event if something
  breaks partway through.
- Only remove the legacy frontend once the React version is confirmed
  stable and has been the primary version in use for a reasonable period
  (your call on how long — even "a few days of no regressions" is
  reasonable for a portfolio project).

------------------------------------------------------------------------

# Addendum 3 — Dev Environment & Serving Strategy

**Problem:** The spec doesn't define how the Vite dev server communicates
with FastAPI during development, or how the built React app is served
alongside/instead of the current static frontend in the running app.

**Requirements — decide and document explicitly, don't leave implicit:**

- **Development:** Configure Vite's dev server proxy (`vite.config.js`
  `server.proxy`) to forward API/SSE requests to the FastAPI backend's
  port, so the React dev server and FastAPI can run simultaneously without
  CORS friction during development.
- **CORS:** Confirm FastAPI's CORS middleware explicitly allows the Vite
  dev server's origin during development. Do not use a wildcard (`*`)
  origin if credentials/cookies are involved anywhere in the app.
- **Production/demo serving:** Decide one of:
  - (a) FastAPI serves the built React static output (`npm run build`
    output directory) directly as static files, so the whole app is one
    process on one port — simplest for a portfolio project/demo.
  - (b) React build is served separately (e.g. via a simple static file
    server) and configured to talk to FastAPI as a separate API origin.
  - Recommend (a) for this project given the "single interview demo"
    use case — one process, one port, nothing extra to start before a
    live demo.
- Document the exact commands needed to run the full app locally (both
  dev mode and "demo/production" mode) in the project README, so there's
  no ambiguity about how to start it before an interview.

------------------------------------------------------------------------

# Addendum 4 — SSE Streaming Performance in React

**Problem:** "Retain existing streaming logic, improve presentation only"
undersells a real risk specific to React: naively calling `setState` (or
equivalent) on every single SSE message/token causes a React re-render per
token. On a ~5,000 token streamed document, this can cause visible jank,
dropped frames, or a sluggish feel — directly undermining the "best
feature" status this view currently has.

**Requirements:**

- Do not update component state directly on every SSE `onmessage` event.
- Buffer incoming tokens/chunks in a ref or local accumulator, and flush
  to React state on a throttle (e.g. every ~50–100ms via
  `requestAnimationFrame` or a small `setInterval`/debounce), so the UI
  updates smoothly without a render-per-token.
- Verify smooth scrolling/rendering behavior specifically on a full-length
  document generation (not just a short test string) before considering
  this task complete — short-document testing will not reveal this
  problem.
- Ensure the stream cleanly handles connection drops/errors (see Addendum
  5) rather than leaving the UI stuck mid-stream with no indication
  anything went wrong.

------------------------------------------------------------------------

# Addendum 5 — Error & Failure States (Currently Missing Entirely)

**Problem:** The spec defines loading and empty states but never addresses
what the UI shows when something goes wrong — generation failure, request
timeout, backend error, or a dropped SSE connection. Given the backend
already has per-stage timeout and soft-fail/reflection-skip logic built
in, the frontend needs a defined, intentional way to surface failure
states gracefully — this is a required piece of the redesign, not an
edge case to handle later.

**Requirements — define an explicit state/component for each of:**

- **Request failure before generation starts** (e.g. network error, 4xx/5xx
  from FastAPI): clear error message in the main content area, with a
  retry action. Do not fail silently or leave the UI in a stuck loading
  state.
- **Timeout during a pipeline stage** (per the backend's existing per-stage
  timeout config): surface a clear "this stage took longer than expected"
  message, consistent with the backend's graceful-degradation behavior —
  do not let the frontend just spin indefinitely if the backend has
  already given up on a stage.
- **SSE connection drop mid-stream:** detect the dropped connection
  (`onerror`/connection close without a completion signal) and show a
  clear "connection lost" state with a retry/reconnect option, rather than
  leaving the streaming view frozen on partial content with no
  indication anything went wrong.
- **PDF/document generation failure after content is generated:** clear
  error state distinct from a generation failure, since the underlying
  content may still be recoverable/viewable even if export failed.
- Add an `ErrorState` component to the reusable component set (see
  Addendum 6) so these are all built on one consistent pattern, not four
  separate one-off implementations.

------------------------------------------------------------------------

# Addendum 6 — Concrete Component Inventory

**Problem:** The spec's component list ("Buttons, Cards, Inputs, Selects,
Toggles, Badges, Section headers, Empty states, Loading states") is
generic UI-kit language. Given AgentDoc's actual screens, several
composite, app-specific components should be explicitly named so the
agent builds them as genuine reusable components rather than one-off
inline markup scattered across pages.

**Add these named composite components to the Phase 1/2 deliverables:**

- `StageTracker` — the Planning → Executing → Synthesizing → Reflecting →
  Document pipeline progress indicator, with active/completed/upcoming
  visual states.
- `StreamingDocumentViewer` — the live-generation text stream display,
  incorporating the throttled-update behavior from Addendum 4.
- `TaskCard` — a single task/phase card (used in both Plan Review and
  Task Breakdown views) — build this once, reuse in both places rather
  than maintaining two similar-but-different implementations.
- `MetricStatCard` — the small stat block pattern (execution time, tokens
  used, LLM calls, etc.) — reusable across the Metrics tab and any
  summary/overview row.
- `ExplainabilityPanel` — document type detection, template selection,
  confidence rating, execution strategy display.
- `PlanReviewCard` — the editable task list shown before execution
  (currently the page with the white-background bug) — should reuse
  `TaskCard` internally where possible.
- `ErrorState` — shared component for all failure states from Addendum 5.
- `DocumentPreviewCompact` — the shrunk, merged preview+download card from
  the earlier redesign spec's Issue 8 fix.

Each of these should be a genuine standalone component with defined
props, not markup duplicated across multiple page files.

------------------------------------------------------------------------

# Addendum 7 — Frontend Performance & Accessibility Budget

**Problem:** The project already applies explicit performance budgets on
the backend (prompt size, completion size, stage latency, etc.). The
frontend redesign currently has no equivalent budget, despite being a
full rewrite that could regress load time or responsiveness relative to
the current lightweight static HTML/JS version.

**Requirements:**

- **Bundle size:** set a rough ceiling for the production JS bundle (e.g.
  under ~300–500KB gzipped as a starting target) and check it after each
  phase — a React + Router + component library rewrite can silently
  balloon past a plain HTML/JS page's footprint if unmanaged.
- **Load time:** the built app's initial load should not regress
  meaningfully versus the current static frontend's load time. Measure
  both before removing the legacy frontend (see Addendum 2).
- **Lighthouse targets:** aim for Performance and Accessibility scores in
  the 90+ range on the built production app — reasonable and achievable
  for an app of this size, and a concrete, checkable number rather than a
  vague "should be fast" goal.
- **Accessibility baseline:** keyboard navigability for all interactive
  elements (form, sidebar nav, tabs, buttons), sufficient color contrast
  ratios per WCAG AA (this should fall out naturally from the light theme
  + dark text design system, but verify explicitly rather than assume),
  and appropriate ARIA labeling on icon-only buttons/nav items.
- Add "bundle size, load time, Lighthouse scores" as a checked line item
  in the existing Visual QA Checklist, alongside spacing/typography/
  color consistency.

------------------------------------------------------------------------

# Updated Verification Requirement

For each phase, in addition to the verification items already listed in
the master spec (before/after screenshots, architecture summary,
component inventory, QA checklist, manual verification report), also
report:

- Confirmation that the legacy frontend remains intact and untouched
  (Addendum 2), until explicitly approved for removal.
- Confirmation of which serving strategy was implemented (Addendum 3) and
  the exact commands to run the app locally.
- A specific test of streaming performance on a full-length (~5,000
  token) document generation, not just a short test string (Addendum 4).
- A demonstration of at least one error/failure state actually triggered
  and displayed correctly (Addendum 5) — e.g. by temporarily stopping the
  backend mid-request, or simulating a timeout.
- Bundle size and Lighthouse score readout (Addendum 7).

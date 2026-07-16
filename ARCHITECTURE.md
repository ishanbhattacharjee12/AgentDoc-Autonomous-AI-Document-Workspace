# Architecture & System Design Documentation

This document explains the technical details, multi-agent pipelines, database models, and React state architectures powering the AgentDoc v1.0 workspace.

---

## 1. System Topology Overview

```
                      [ Client UI React Workspace ]
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼ (Search / Star Favorites)   ▼ (Execute Commands)         ▼ (PDF / MD Downloads)
 [ Client IndexedDB ]          [ Commands Context Registry ] [ FastAPI Static Server ]
                                    │
                                    ▼ (Trigger Generation API POST)
                       [ FastAPI Request Router ]
                                    │
             ┌──────────────────────┴──────────────────────┐
             ▼ (Caches matching requests)                  ▼ (Bypasses / Cache Misses)
  [ SQLite Cache Store ]                      [ Multi-Agent Pipeline ]
                                                           │
        ┌──────────────┬──────────────┬──────────────┬─────┴────────┬──────────────┐
        ▼              ▼              ▼              ▼              ▼              ▼
   [ Classifier ] [ Planner ]   [ Plan Review ] [ Executor ]  [ Synthesizer ] [ Reflector ]
   (Resolves mode)(Drafts outline)(Pause / Edit)(Runs steps)   (Markdown build)(Score checks)
```

---

## 2. Multi-Agent Backend Pipeline

When a generation request is dispatched, it runs sequentially through dedicated stages:
1.  **Classifier**: Maps the request prompt type (e.g. business proposal, technical checklist, onboarding guide) and assigns the execution mode.
2.  **Planner**: Outlines a list of task steps (outline) required to synthesize the document, detailing target scopes and formats.
3.  **Plan Review (Human-in-the-Loop)**: If requested, pipeline execution pauses. The task checklist is exposed to the client to modify (rename, add, remove, or rearrange steps) before resuming.
4.  **Executor**: Runs individual checklist tasks, querying contextual resources.
5.  **Synthesizer**: Consolidates executor outputs and drafts a detailed unified markdown document.
6.  **Reflector**: Conducts self-check audits, grading the output based on completeness, formatting, and formatting styles.

---

## 3. Frontend Client Architecture

### Decoupled Actions Registry
To support global keyboard shortcuts (`Cmd+K`, `Cmd+Enter`, `Cmd+S`) without bloat or prop drilling, we use a React Context-based **Registry Pattern**:
*   **Provider Context**: Exposes methods `registerAction(id, callback)` and `unregisterAction(id)`.
*   **Contextual Registry**: Workspace pages register actions on mount and clear them on unmount.
*   **Palette Interaction**: The Command Palette inspects which actions are active and exposes them dynamically to the user.

### Local Library Data Models (IndexedDB)
Client document histories are stored securely in browser IndexedDB (upgraded to Schema Version 2):
*   `entries` Store:
    *   `id`: auto-incrementing integer key.
    *   `title`: editable user-defined title.
    *   `prompt`: original query text.
    *   `summary`: generated markdown synopsis.
    *   `is_favorite`: boolean toggle index for quick favorites queries.
    *   `created_at`: absolute timestamp string.

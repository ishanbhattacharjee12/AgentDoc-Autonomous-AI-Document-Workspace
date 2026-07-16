# Changelog

All notable changes to the AgentDoc project are documented in this file.

---

## [v1.0.0] - 2026-07-17

### Added
*   **Dedicated Landing Page (`/`)**: Introduces value proposition, feature grids, technology stack cards, and visual execution flow overview without sidebar layouts.
*   **Ctrl+K Command Palette**: Keyboard-first fuzzy search interface for quick routing, generation tasks execution, document clearing, and exports.
*   **Accessibility (A11y) Layers**: Comprehensive ARIA controls (`role="dialog"`, `role="listbox"`, `role="option"`, `aria-activedescendant`), keyboard selections, and focus trapping.
*   **Route-Based Lazy Loading**: Suspense boundary splits for all workspaces.
*   **Rollup manualChunks Splitting**: Offloaded React framework runtimes into dedicated cached vendor chunks.
*   **MIT License & Contributor Guilds**: Production readiness setup guides.

---

## [v0.3.0] - 2026-07-16

### Added
*   **IndexedDB Version 2 Schema**: Added favoriting and archival indexes. Resilient idempotent upgrade migration triggers.
*   **Document Library Cards**: Notion-style layout card previews containing inline titles editing, Prompt overlays, favorites pinning, duplication, and details sidebar drawer.
*   **Suggested Empty States**: Preset prompt templates seeding Generate page inputs.

---

## [v0.2.0] - 2026-07-15

### Added
*   **Explainability & Insights tab**: Dials, COMPLEXITY rationales, planner assumptions, and reflection grades.
*   **Developer Settings tab**: Configurable model routing, cache ignore toggles, and workspace state storage.
*   **Interactive Plan Review**: Editable outline task listings with inline additions, shifts, and deletions.

---

## [v0.1.0] - 2026-07-14

### Added
*   **React + Vite Migration**: Full frontend TypeScript code structure migration.
*   **FastAPI Backend Pipeline**: Multi-agent task execution, Reflect reflection models, and server-sent stream events.

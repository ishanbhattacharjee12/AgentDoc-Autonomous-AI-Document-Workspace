# Demonstration Playbook & Evaluation Scripts

This guide provides step-by-step walkthrough scripts to demo the AgentDoc platform for recruiters, technical leads, and system architects.

---

## 1. Recruiter Demo (2 Minutes)

*   **Objective**: Show visual speed, simplicity, and polish of autonomous generation.
*   **Demonstrated Features**: Workspace input form, streaming document viewer, and PDF exporter.
*   **Prompt**:
    ```text
    Create a project plan for launching an AI-powered customer support chatbot in a remote team context.
    ```
*   **Script Sequence**:
    1.  On the **Generate Page**, select "Default Format: PDF" and "Mode: Standard Generation".
    2.  Paste the prompt inside the prompt box and click **Run Agent Pipeline**.
    3.  Explain: *"The agent decomposes this request in the background and is now streaming the raw output sections in real-time."*
    4.  As soon as the synthesis stage finishes, highlight the completed document rendering on the left and click **Download PDF** on the toolbar. Show the beautifully typeset local PDF copy.

---

## 2. Technical Lead Demo (5 Minutes)

*   **Objective**: Demonstrate Human-in-the-Loop checkpoints, explainability insights, and document libraries.
*   **Demonstrated Features**: Interactive Plan Review, Insights gauges, History library inline renaming, and favorites star.
*   **Prompt**:
    ```text
    Onboarding roadmap for remote engineering personnel at a distributed tech company.
    ```
*   **Script Sequence**:
    1.  Toggle **Always Require Plan Review** to `true` and click **Run Agent Pipeline**.
    2.  Explain: *"The system pauses after the initial planning phase to let us inspect the agent's task checklist."*
    3.  Double-click Step 2, edit the task text, and delete Step 3. Click **Resume Execution**.
    4.  When synthesis completes, navigate to the **Insights** tab. Highlight confidence ratings, complexity classifications, and planner assumptions.
    5.  Navigate to the **History** page. Hover over our draft's card, click the star icon, double-click the title to rename it to `"Engineering Roadmap v1"`, and click **Duplicate**.
    6.  Open `Cmd+K` and type `"Go to Settings"` to demonstrate keyboard navigation.

---

## 3. Architecture Walkthrough (10 Minutes)

*   **Objective**: Outline system robustness, caching, and code quality.
*   **Demonstrated Features**: Caching database persistence, Vite lazy split chunks, and Actions Context Registry.
*   **Walkthrough Sequence**:
    1.  Explain the **Request Cache**: Run the chatbot demo prompt twice. The second run completes instantly because the SQLite backend intercepts matching requests.
    2.  Open Chrome DevTools Network Tab: Navigate between Generate, History, and Settings pages. Show that JavaScript chunks (`GeneratePage-[hash].js`, etc.) load dynamically.
    3.  Showcase [ARCHITECTURE.md](../ARCHITECTURE.md) flowcharts.

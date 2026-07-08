/* AgentDoc — Frontend Application */

const DEMO_INPUTS = {
    1: "Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. Include objectives, scope, phases, timeline, team responsibilities, risks, success metrics, and next steps.",
    2: "We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership. We want results quickly, the budget is limited, and engineering capacity is small. Decide what should be investigated first, make reasonable assumptions where information is missing, prioritize actions, define success metrics, risks, and a phased 90-day plan."
};

function loadDemo(num) {
    document.getElementById("request-input").value = DEMO_INPUTS[num] || "";
}

async function runAgent() {
    const requestText = document.getElementById("request-input").value.trim();
    if (!requestText) {
        showError("Please enter a document request.");
        return;
    }

    // Show loading, hide others
    show("loading-section");
    hide("results-section");
    hide("error-section");
    document.getElementById("run-btn").disabled = true;

    try {
        const response = await fetch("/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request: requestText }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        renderResults(data);

    } catch (err) {
        showError(err.message || "An unexpected error occurred.");
    } finally {
        hide("loading-section");
        document.getElementById("run-btn").disabled = false;
    }
}

function renderResults(data) {
    // Goal
    document.getElementById("goal-text").textContent = data.goal || "N/A";
    const badge = document.getElementById("doctype-badge");
    badge.textContent = (data.document_type || "").replace(/_/g, " ").toUpperCase();
    badge.style.display = data.document_type ? "inline-block" : "none";

    // Assumptions
    const assumptionsList = document.getElementById("assumptions-list");
    assumptionsList.innerHTML = "";
    (data.assumptions || []).forEach(a => {
        const li = document.createElement("li");
        li.textContent = a;
        assumptionsList.appendChild(li);
    });

    // Plan
    renderPlanTable(data.plan || []);

    // Execution
    renderExecution(data.execution_results || []);

    // Reflection
    renderReflection(data.reflection);

    // Summary
    document.getElementById("summary-text").textContent = data.summary || "";

    // Download
    const link = document.getElementById("download-link");
    if (data.document_url) {
        link.href = data.document_url;
        link.textContent = "⬇ Download: " + (data.document_filename || "document.docx");
        show("download-card");
    } else {
        hide("download-card");
    }

    show("results-section");
}

function renderPlanTable(plan) {
    const container = document.getElementById("plan-table-container");
    if (!plan.length) {
        container.innerHTML = "<p class='card-body'>No plan generated.</p>";
        return;
    }

    let html = `<table class="plan-table">
        <thead><tr>
            <th>#</th><th>Task</th><th>Purpose</th><th>Tool</th><th>Status</th>
        </tr></thead><tbody>`;

    plan.forEach(t => {
        const toolClass = `tool-${t.tool || "analysis"}`;
        const statusClass = `status-${t.status || "pending"}`;
        html += `<tr>
            <td>${t.id}</td>
            <td>${escapeHtml(t.task)}</td>
            <td>${escapeHtml(t.purpose)}</td>
            <td><span class="tool-badge ${toolClass}">${t.tool || "—"}</span></td>
            <td><span class="status ${statusClass}">${t.status || "pending"}</span></td>
        </tr>`;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

function renderExecution(results) {
    const container = document.getElementById("execution-list");
    if (!results.length) {
        container.innerHTML = "<p class='card-body'>No execution results.</p>";
        return;
    }

    let html = "";
    results.forEach(r => {
        const statusClass = `status-${r.status || "pending"}`;
        html += `<div class="exec-item">
            <div class="exec-item-header">
                <span class="exec-task-name">${escapeHtml(r.task || "")}</span>
                <span class="status ${statusClass}">${r.status || ""}</span>
            </div>
            <div class="exec-summary">${escapeHtml(r.summary || "")}</div>
        </div>`;
    });

    container.innerHTML = html;
}

function renderReflection(reflection) {
    const container = document.getElementById("reflection-content");
    if (!reflection) {
        container.innerHTML = "<p class='card-body'>Reflection not available.</p>";
        return;
    }

    let passedClass, passedText;
    if (reflection.error) {
        passedClass = "reflection-failed";
        passedText = "⚠️ Reflection Skipped (Provider Error)";
    } else if (reflection.passed) {
        passedClass = "reflection-passed";
        passedText = "✅ Quality Check Passed";
    } else {
        passedClass = "reflection-failed";
        passedText = "⚠️ Issues Found — Revision Applied";
    }

    let html = `<div class="reflection-status ${passedClass}">${passedText}</div>`;

    if (reflection.issues_found && reflection.issues_found.length) {
        html += `<p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:6px;">Issues identified:</p>
            <ul class="reflection-list">`;
        reflection.issues_found.forEach(i => {
            html += `<li>${escapeHtml(i)}</li>`;
        });
        html += "</ul>";
    }

    if (reflection.improvements_applied && reflection.improvements_applied.length) {
        html += `<p style="color:var(--text-muted);font-size:0.88rem;margin-top:12px;margin-bottom:6px;">Improvements applied:</p>
            <ul class="reflection-list">`;
        reflection.improvements_applied.forEach(i => {
            html += `<li>${escapeHtml(i)}</li>`;
        });
        html += "</ul>";
    }

    container.innerHTML = html;
}

function showError(message) {
    document.getElementById("error-text").textContent = message;
    show("error-section");
    hide("results-section");
    hide("loading-section");
}

function show(id) {
    document.getElementById(id).classList.remove("hidden");
}

function hide(id) {
    document.getElementById(id).classList.add("hidden");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

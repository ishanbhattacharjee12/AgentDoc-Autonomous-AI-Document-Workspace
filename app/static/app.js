/* AgentDoc — Frontend Application */

const DEMO_INPUTS = {
    1: "Create a project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. Include objectives, scope, phases, timeline, team responsibilities, risks, success metrics, and next steps.",
    2: "We need to improve customer onboarding because users are dropping off, but we don't know exactly where. Create a practical improvement plan that can be presented to leadership. We want results quickly, the budget is limited, and engineering capacity is small. Decide what should be investigated first, make reasonable assumptions where information is missing, prioritize actions, define success metrics, risks, and a phased 90-day plan."
};

function loadDemo(num) {
    document.getElementById("request-input").value = DEMO_INPUTS[num] || "";
}

// Initialize icons when document loads
document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});

function copyContent(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text).then(() => {
        // Optional: show small toast or change icon briefly
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

async function runAgent() {
    const requestText = document.getElementById("request-input").value.trim();
    if (!requestText) {
        showError("Please enter a document request.");
        return;
    }
    const requireReview = document.getElementById("review-toggle").checked;
    const format = document.getElementById("format-select").value;

    // Show loading, hide others
    show("loading-section");
    hide("results-section");
    hide("error-section");
    hide("review-section");
    document.getElementById("run-btn").disabled = true;

    // Reset stepper
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active', 'completed');
    });
    document.querySelectorAll('.step-line').forEach(el => {
        el.classList.remove('completed');
    });
    document.getElementById('step-planning').classList.add('active');
    document.getElementById('loading-status').textContent = "Initializing...";

    const updateStepper = (stageName) => {
        const stageMap = {
            "Planning": "planning",
            "Executing": "executing",
            "Synthesizing": "synthesizing",
            "Reflecting": "reflecting",
            "Generating Document": "generating"
        };
        
        let targetStep = null;
        for (const key in stageMap) {
            if (stageName.startsWith(key)) {
                targetStep = stageMap[key];
                break;
            }
        }
        
        if (targetStep) {
            const steps = ["planning", "executing", "synthesizing", "reflecting", "generating"];
            let found = false;
            
            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                const stepEl = document.getElementById(`step-${s}`);
                const lineEl = stepEl.nextElementSibling;
                
                if (s === targetStep) {
                    stepEl.classList.add('active');
                    stepEl.classList.remove('completed');
                    found = true;
                } else if (!found) {
                    stepEl.classList.add('completed');
                    stepEl.classList.remove('active');
                    if (lineEl && lineEl.classList.contains('step-line')) {
                        lineEl.classList.add('completed');
                    }
                } else {
                    stepEl.classList.remove('active', 'completed');
                    if (lineEl && lineEl.classList.contains('step-line')) {
                        lineEl.classList.remove('completed');
                    }
                }
            }
        }
        
        document.getElementById('loading-status').textContent = stageName + "...";
    };

    try {
        const url = `/agent/stream?request=${encodeURIComponent(requestText)}&require_review=${requireReview}&format=${format}`;
        const eventSource = new EventSource(url);
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "progress") {
                updateStepper(data.stage);
            } else if (data.type === "result") {
                eventSource.close();
                if (data.data.status === "requires_review") {
                    showReviewScreen(data.data, requestText, format);
                } else {
                    renderResults(data.data);
                }
                hide("loading-section");
                document.getElementById("run-btn").disabled = false;
            } else if (data.type === "error") {
                eventSource.close();
                showError(data.error);
                hide("loading-section");
                document.getElementById("run-btn").disabled = false;
            }
        };
        
        eventSource.onerror = (err) => {
            if (eventSource.readyState === EventSource.CLOSED) return;
            eventSource.close();
            console.error("SSE Error:", err);
            showError("Connection to agent stream lost or failed to start.");
            hide("loading-section");
            document.getElementById("run-btn").disabled = false;
        };

    } catch (err) {
        showError(err.message || "An unexpected error occurred.");
        hide("loading-section");
        document.getElementById("run-btn").disabled = false;
    }
}

let currentPlanData = null;
let currentRequestText = "";
let currentFormat = "";

function showReviewScreen(data, requestText, format) {
    currentPlanData = data;
    currentRequestText = requestText;
    currentFormat = format;

    // Display summary and explainability
    let html = `
        <div style="margin-bottom: 20px;">
            <strong>Goal:</strong> ${escapeHtml(data.goal)}<br>
            <strong>Document Type:</strong> ${escapeHtml(data.document_type)}
        </div>
    `;

    html += `<h4>Tasks (Editable)</h4><div style="display:flex; flex-direction:column; gap:10px;">`;
    
    data.plan.forEach((task, index) => {
        html += `
            <div class="task-edit-card" style="border:1px solid #ddd; padding:10px; border-radius:4px;">
                <strong>Task ${task.id}:</strong> 
                <input type="text" id="edit-task-${index}" value="${escapeHtml(task.task)}" style="width:100%; margin-top:5px; padding:5px;"><br>
                <strong>Purpose:</strong> 
                <input type="text" id="edit-purpose-${index}" value="${escapeHtml(task.purpose)}" style="width:100%; margin-top:5px; padding:5px;"><br>
                <strong>Tool:</strong> 
                <select id="edit-tool-${index}" style="margin-top:5px; padding:5px;">
                    <option value="analysis" ${task.tool==='analysis'?'selected':''}>analysis</option>
                    <option value="knowledge" ${task.tool==='knowledge'?'selected':''}>knowledge</option>
                    <option value="requirements_analysis" ${task.tool==='requirements_analysis'?'selected':''}>requirements_analysis</option>
                    <option value="stakeholder_analysis" ${task.tool==='stakeholder_analysis'?'selected':''}>stakeholder_analysis</option>
                    <option value="compliance_review" ${task.tool==='compliance_review'?'selected':''}>compliance_review</option>
                    <option value="cost_benefit_analysis" ${task.tool==='cost_benefit_analysis'?'selected':''}>cost_benefit_analysis</option>
                    <option value="priority_matrix" ${task.tool==='priority_matrix'?'selected':''}>priority_matrix</option>
                </select>
                <div style="margin-top:5px; font-size:0.85em; color:#666;">
                    Dependencies: ${task.depends_on && task.depends_on.length ? task.depends_on.join(', ') : 'None'}
                </div>
            </div>
        `;
    });
    html += `</div>`;

    document.getElementById("review-plan-content").innerHTML = html;
    show("review-section");
    hide("loading-section");
    if (window.lucide) { lucide.createIcons(); }
}

function cancelExecution() {
    hide("review-section");
    document.getElementById("run-btn").disabled = false;
    showError("Execution cancelled by user.");
}

async function resumeExecution() {
    // Gather edited tasks
    const editedTasks = currentPlanData.plan.map((t, index) => {
        return {
            ...t,
            task: document.getElementById(`edit-task-${index}`).value,
            purpose: document.getElementById(`edit-purpose-${index}`).value,
            tool: document.getElementById(`edit-tool-${index}`).value
        };
    });
    
    currentPlanData.tasks = editedTasks; // For python model

    const payload = {
        request: currentRequestText,
        format: currentFormat,
        planner_output: currentPlanData
    };

    hide("review-section");
    show("loading-section");
    document.getElementById("loading-status").textContent = "Resuming Execution...";

    try {
        const response = await fetch('/agent/execute/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            let lines = buffer.split("\n\n");
            buffer = lines.pop(); // Keep incomplete chunk
            
            for (let line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    if (!dataStr.trim()) continue;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.type === "progress") {
                            // Re-use updateStepper logic
                            document.getElementById('loading-status').textContent = data.stage + "...";
                        } else if (data.type === "result") {
                            renderResults(data.data);
                            hide("loading-section");
                            document.getElementById("run-btn").disabled = false;
                        } else if (data.type === "error") {
                            showError(data.error);
                            hide("loading-section");
                            document.getElementById("run-btn").disabled = false;
                        }
                    } catch (e) {
                        console.error("Error parsing JSON:", e, dataStr);
                    }
                }
            }
        }
    } catch (err) {
        showError(err.message || "Execution failed.");
        hide("loading-section");
        document.getElementById("run-btn").disabled = false;
    }
}

function renderResults(data) {
    // Metrics
    document.getElementById("metric-time").textContent = data.total_execution_time ? data.total_execution_time + " s" : "--";
    document.getElementById("metric-llm").textContent = data.llm_call_count !== undefined ? data.llm_call_count : "--";
    document.getElementById("metric-tasks").textContent = (data.plan && data.plan.length) ? data.plan.length : "--";
    document.getElementById("metric-revisions").textContent = data.revision_count !== undefined ? data.revision_count : "--";

    // Goal
    document.getElementById("goal-text").textContent = data.goal || "N/A";
    const badge = document.getElementById("doctype-badge");
    badge.textContent = (data.document_type || "").replace(/_/g, " ").toUpperCase();
    badge.style.display = data.document_type ? "inline-block" : "none";

    // Confidence and Complexity
    const confidenceBadge = document.getElementById("confidence-badge");
    const complexityBadge = document.getElementById("complexity-badge");
    
    if (data.confidence) {
        confidenceBadge.textContent = "Confidence: " + data.confidence;
        confidenceBadge.title = data.confidence_reason || "";
        confidenceBadge.style.display = "inline-block";
    } else {
        confidenceBadge.style.display = "none";
    }
    
    if (data.complexity) {
        complexityBadge.textContent = "Complexity: " + data.complexity;
        complexityBadge.title = data.complexity_reason || "";
        complexityBadge.style.display = "inline-block";
    } else {
        complexityBadge.style.display = "none";
    }

    // Add reading time & effort to badges if we want, or summary
    const goalCard = document.getElementById("goal-card");
    let extraBadges = goalCard.querySelector(".extra-badges");
    if(!extraBadges) {
        extraBadges = document.createElement("div");
        extraBadges.className = "extra-badges";
        extraBadges.style.marginTop = "10px";
        goalCard.appendChild(extraBadges);
    }
    extraBadges.innerHTML = "";
    if (data.reading_time) {
        extraBadges.innerHTML += `<span class="badge" style="background:#e3f2fd; color:#1565c0;"><i data-lucide="book-open" style="width:14px; margin-right:4px;"></i> Reading Time: ${escapeHtml(data.reading_time)}</span> `;
    }
    if (data.implementation_effort) {
        extraBadges.innerHTML += `<span class="badge" style="background:#f3e5f5; color:#7b1fa2;"><i data-lucide="zap" style="width:14px; margin-right:4px;"></i> Effort: ${escapeHtml(data.implementation_effort)}</span>`;
    }

    // Assumptions
    const assumptionsList = document.getElementById("assumptions-list");
    assumptionsList.innerHTML = "";
    (data.assumptions || []).forEach(a => {
        const li = document.createElement("li");
        li.textContent = a;
        assumptionsList.appendChild(li);
    });

    // Planning Summary
    const planningSummary = document.getElementById("planning-summary-container");
    if (data.planning_summary) {
        planningSummary.innerHTML = "<strong>Planning Summary:</strong><br>" + escapeHtml(data.planning_summary);
        planningSummary.style.display = "block";
    } else {
        planningSummary.style.display = "none";
    }

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
    const previewContainer = document.getElementById("preview-container");
    const previewCard = document.getElementById("preview-card");

    if (data.document_url) {
        link.href = data.document_url;
        link.innerHTML = `<i data-lucide="download" style="margin-right: 8px;"></i> Download ` + escapeHtml(data.document_filename || "Document");
        show("download-card");
        
        // Simple preview (iframe)
        if (data.document_url.endsWith('.html') || data.document_url.endsWith('.pdf')) {
            previewContainer.innerHTML = `<iframe src="${data.document_url}" width="100%" height="400px" style="border:none;"></iframe>`;
            previewCard.style.display = "block";
        } else if (data.document_url.endsWith('.md')) {
            // Fetch and show markdown
            fetch(data.document_url).then(r=>r.text()).then(t => {
                previewContainer.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${escapeHtml(t)}</pre>`;
                previewCard.style.display = "block";
            });
        } else {
            previewCard.style.display = "none";
        }
    } else {
        hide("download-card");
        previewCard.style.display = "none";
    }

    show("results-section");
    if (window.lucide) {
        lucide.createIcons();
    }
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
    const badge = document.getElementById("reflection-grade-badge");
    
    if (!reflection) {
        container.innerHTML = "<p class='card-body'>Reflection not available.</p>";
        badge.style.display = "none";
        return;
    }

    const grade = reflection.grade || "Acceptable";
    badge.textContent = "Grade: " + grade;
    badge.style.display = "inline-block";
    
    // Set badge color based on grade
    if (grade === "Excellent" || grade === "Good") {
        badge.className = "badge status-completed";
    } else if (grade === "Acceptable") {
        badge.className = "badge status-running";
    } else {
        badge.className = "badge status-failed";
    }

    let passedClass, passedText;
    if (reflection.error) {
        passedClass = "reflection-failed";
        passedText = "Reflection Skipped (Provider Error)";
    } else if (reflection.passed) {
        passedClass = "reflection-passed";
        passedText = "Quality Check Passed";
    } else {
        passedClass = "reflection-failed";
        passedText = "Issues Found — Revision Applied";
    }

    let html = `<div class="reflection-status ${passedClass}">${passedText}</div>`;
    
    if (reflection.reason) {
        html += `<p style="color:var(--text-muted);font-size:0.95rem;margin-bottom:12px;"><strong>Reason:</strong> ${escapeHtml(reflection.reason)}</p>`;
    }

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

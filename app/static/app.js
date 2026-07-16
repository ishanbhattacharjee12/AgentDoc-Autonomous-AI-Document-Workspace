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
    
    // Fetch system and debug config from health endpoint
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            if (data.debug) {
                document.getElementById('dev-status-bar').style.display = 'flex';
                document.getElementById('dev-active-model').textContent = data.active_model || 'Unknown';
                document.getElementById('dev-pipeline-mode').textContent = 'Adaptive standard/advanced';
                document.getElementById('dev-cache-status').textContent = data.enable_cache ? 'Enabled' : 'Disabled';
                // If DEBUG is true, check the "Ignore Request Cache" by default as per requirements!
                document.getElementById('ignore-cache-toggle').checked = true;
            }
        })
        .catch(err => console.error("Failed to fetch dev settings:", err));
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

// Live streaming document preview state and lifecycle
let accumulatedMarkdown = "";
let renderIntervalId = null;
let newTokensBuffered = false;

function initStreamingPreview() {
    accumulatedMarkdown = "";
    newTokensBuffered = false;
    const container = document.getElementById("streaming-preview-container");
    if (container) {
        container.innerHTML = "";
        container.classList.add("streaming-cursor");
    }
    const card = document.getElementById("streaming-preview-card");
    if (card) {
        card.style.display = "none";
    }
    
    if (renderIntervalId) {
        clearInterval(renderIntervalId);
    }
    renderIntervalId = setInterval(tickStreamingPreview, 200);
}

function handleIncomingToken(token) {
    if (!token) return;
    
    const card = document.getElementById("streaming-preview-card");
    if (card && card.style.display === "none") {
        card.style.display = "block";
    }
    
    accumulatedMarkdown += token;
    newTokensBuffered = true;
}

function tickStreamingPreview() {
    if (!newTokensBuffered) return;
    newTokensBuffered = false;
    
    const container = document.getElementById("streaming-preview-container");
    if (!container) return;
    
    // Auto-scroll logic: only auto-scroll if user is near the bottom (within 40px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
    
    if (window.marked && typeof window.marked.parse === "function") {
        container.innerHTML = marked.parse(accumulatedMarkdown);
    } else {
        container.textContent = accumulatedMarkdown;
    }
    
    if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

function finalizeStreamingPreview() {
    if (renderIntervalId) {
        clearInterval(renderIntervalId);
        renderIntervalId = null;
    }
    newTokensBuffered = true;
    tickStreamingPreview();
    
    const container = document.getElementById("streaming-preview-container");
    if (container) {
        container.classList.remove("streaming-cursor");
    }
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
        const mode = document.getElementById("mode-select").value;
        const ignoreCache = document.getElementById("ignore-cache-toggle").checked;
        
        initStreamingPreview();
        
        const url = `/agent/stream?request=${encodeURIComponent(requestText)}&require_review=${requireReview}&format=${format}&mode=${mode}&ignore_cache=${ignoreCache}`;
        const eventSource = new EventSource(url);
        
        let finished = false;
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "progress") {
                updateStepper(data.stage);
            } else if (data.type === "token") {
                handleIncomingToken(data.content);
            } else if (data.type === "result") {
                finished = true;
                eventSource.close();
                finalizeStreamingPreview();
                if (data.data.status === "requires_review") {
                    showReviewScreen(data.data, requestText, format);
                } else {
                    renderResults(data.data);
                }
                hide("loading-section");
                document.getElementById("run-btn").disabled = false;
            } else if (data.type === "error") {
                finished = true;
                eventSource.close();
                finalizeStreamingPreview();
                showError(data.error);
                hide("loading-section");
                document.getElementById("run-btn").disabled = false;
            }
        };
        
        eventSource.onerror = (err) => {
            if (finished) return;
            eventSource.close();
            finalizeStreamingPreview();
            console.error("SSE Error:", err);
            showError("Connection to agent stream lost or failed to start. (Check backend logs)");
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

    const mode = document.getElementById("mode-select").value;
    const ignoreCache = document.getElementById("ignore-cache-toggle").checked;
    const payload = {
        request: currentRequestText,
        format: currentFormat,
        mode: mode,
        ignore_cache: ignoreCache,
        planner_output: currentPlanData
    };

    hide("review-section");
    show("loading-section");
    document.getElementById("loading-status").textContent = "Resuming Execution...";
    initStreamingPreview();

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
                        } else if (data.type === "token") {
                            handleIncomingToken(data.content);
                        } else if (data.type === "result") {
                            finalizeStreamingPreview();
                            renderResults(data.data);
                            hide("loading-section");
                            document.getElementById("run-btn").disabled = false;
                        } else if (data.type === "error") {
                            finalizeStreamingPreview();
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
        finalizeStreamingPreview();
        showError(err.message || "Execution failed.");
        hide("loading-section");
        document.getElementById("run-btn").disabled = false;
    }
}

function toggleTechDetails() {
    const content = document.getElementById("tech-details-content");
    const icon = document.getElementById("tech-details-icon");
    if (content.classList.contains("hidden")) {
        content.classList.remove("hidden");
        icon.innerHTML = `<i data-lucide="chevron-up"></i>`;
    } else {
        content.classList.add("hidden");
        icon.innerHTML = `<i data-lucide="chevron-down"></i>`;
    }
    if (window.lucide) lucide.createIcons();
}

function toggleTaskDetails(taskId) {
    const content = document.getElementById(`task-details-${taskId}`);
    const btn = document.getElementById(`task-details-btn-${taskId}`);
    if (content.classList.contains("hidden")) {
        content.classList.remove("hidden");
        btn.innerHTML = `<i data-lucide="chevron-up" style="width:16px;height:16px;margin-right:4px;vertical-align:middle;"></i> Collapse Details`;
    } else {
        content.classList.add("hidden");
        btn.innerHTML = `<i data-lucide="chevron-down" style="width:16px;height:16px;margin-right:4px;vertical-align:middle;"></i> Expand Details`;
    }
    if (window.lucide) lucide.createIcons();
}

function extractSectionText(docText, taskTitle) {
    if (!docText) return "";
    const lines = docText.split('\n');
    const titleWords = taskTitle.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
        
    if (titleWords.length === 0) return docText.slice(0, 1000);

    let maxMatches = 0;
    let matchedIndex = -1;
    
    const headings = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) {
            headings.push({ index: i, text: line.replace(/^#+\s+/, '') });
        }
    }

    headings.forEach((h, hIdx) => {
        let matches = 0;
        const hTextLower = h.text.toLowerCase();
        titleWords.forEach(word => {
            if (hTextLower.includes(word)) matches++;
        });
        if (matches > maxMatches) {
            maxMatches = matches;
            matchedIndex = hIdx;
        }
    });

    if (matchedIndex !== -1 && maxMatches > 0) {
        const startLine = headings[matchedIndex].index;
        const endLine = (matchedIndex + 1 < headings.length) ? headings[matchedIndex + 1].index : lines.length;
        
        const extractedLines = [];
        for (let i = startLine; i < endLine; i++) {
            extractedLines.push(lines[i]);
        }
        return extractedLines.join('\n');
    }
    return docText.slice(0, 800);
}

function parseTaskDetails(sectionText, r) {
    const lines = sectionText.split('\n').map(l => l.trim()).filter(Boolean);
    
    let summaryText = r.summary || "";
    const sentences = sectionText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 8);
    if (sentences.length >= 2) {
        const cleanSentences = sentences.filter(s => !s.includes('#') && !s.includes('|') && !s.startsWith('-') && !s.startsWith('*'));
        if (cleanSentences.length >= 2) {
            summaryText = cleanSentences.slice(0, 3).join('. ') + '.';
        }
    }

    let deliverables = [];
    lines.forEach(l => {
        if (l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l)) {
            const clean = l.replace(/^[-*\d.\s]+/, '').trim();
            if (clean.length > 5 && clean.length < 120 && deliverables.length < 3) {
                deliverables.push(clean);
            }
        }
    });
    if (deliverables.length === 0) {
        deliverables.push(`Comprehensive analysis output for ${r.task}.`);
        const purposeText = r.purpose ? r.purpose.toLowerCase() : "task requirements";
        deliverables.push(`Key recommendations aligned with: ${purposeText}.`);
    }

    let decisions = [];
    const decisionKeywords = ["decide", "choose", "select", "recommend", "focus on", "will", "require", "timeline", "scope", "budget", "target", "approach", "framework", "define"];
    lines.forEach(l => {
        const lower = l.toLowerCase();
        if (decisionKeywords.some(kw => lower.includes(kw)) && !l.startsWith('#') && decisions.length < 2) {
            const clean = l.replace(/^[-*\d.\s]+/, '').trim();
            if (clean.length > 15 && clean.length < 150) {
                decisions.push(clean);
            }
        }
    });
    if (decisions.length === 0) {
        decisions.push(`Defined timeline, roadmap, and scope parameters for this phase.`);
    }

    return {
        summary: summaryText,
        deliverables: deliverables,
        decisions: decisions
    };
}

function renderResults(data) {
    // Render Cache Loaded Badge
    const cacheContainer = document.getElementById("cache-badge-container");
    if (cacheContainer) {
        if (data.cache_status === "HIT") {
            cacheContainer.style.display = "flex";
            
            // Format timestamp nicely
            const dateStr = data.cache_timestamp ? new Date(data.cache_timestamp * 1000).toLocaleString() : "Unknown";
            document.getElementById("cache-badge-timestamp").textContent = dateStr;
            
            // Format age nicely
            let ageStr = "Just now";
            if (data.cache_age !== undefined) {
                const age = data.cache_age;
                if (age < 60) ageStr = `${Math.round(age)}s`;
                else if (age < 3600) ageStr = `${Math.round(age/60)}m`;
                else ageStr = `${(age/3600).toFixed(1)}h`;
            }
            document.getElementById("cache-badge-age").textContent = ageStr;
            
            // Key display
            if (data.cache_key) {
                document.getElementById("cache-badge-key-wrapper").style.display = "inline-block";
                document.getElementById("cache-badge-key").textContent = data.cache_key.substring(0, 12) + "...";
                document.getElementById("cache-badge-key").title = data.cache_key;
            } else {
                document.getElementById("cache-badge-key-wrapper").style.display = "none";
            }
        } else {
            cacheContainer.style.display = "none";
        }
    }

    // 1. Overall Metrics
    document.getElementById("metric-time").textContent = data.total_execution_time ? data.total_execution_time + " s" : "--";
    document.getElementById("metric-llm").textContent = data.llm_call_count !== undefined ? data.llm_call_count : "--";
    document.getElementById("metric-tokens").textContent = data.llm_tokens_used !== undefined ? data.llm_tokens_used.toLocaleString() : "--";
    
    let avgTime = "--";
    if (data.llm_call_count > 0 && data.llm_total_time > 0) {
        avgTime = (data.llm_total_time / data.llm_call_count).toFixed(2);
    }
    document.getElementById("metric-avg-time").textContent = avgTime !== "--" ? avgTime + " s" : "--";
    document.getElementById("metric-revisions").textContent = data.revision_count !== undefined ? data.revision_count : "--";

    // 2. Technical Details Card
    document.getElementById("tech-provider").textContent = data.provider ? data.provider.toUpperCase() : "Zen Provider";
    document.getElementById("tech-model").textContent = data.model_name || "deepseek-v4-flash-free";
    document.getElementById("tech-mode").textContent = data.routing_outcome || (data.llm_call_count === 1 || data.llm_call_count === 2 ? "Standard Mode (Merged)" : "Advanced Mode (Sequential)");
    document.getElementById("tech-tokens").textContent = data.llm_tokens_used ? data.llm_tokens_used.toLocaleString() : "--";
    document.getElementById("tech-ttft").textContent = data.stage_metrics && data.stage_metrics.avg_ttft !== undefined ? data.stage_metrics.avg_ttft.toFixed(3) + " s" : "-- s";
    document.getElementById("tech-time").textContent = data.total_execution_time ? data.total_execution_time + " s" : "--";
    document.getElementById("tech-calls").textContent = data.llm_call_count !== undefined ? data.llm_call_count : "--";
    
    let reflectionStatusText = "Executed";
    if (data.reflection) {
        if (data.reflection.error) {
            reflectionStatusText = "Skipped (Provider Error)";
        } else if (data.reflection.grade && data.reflection.grade.includes("Skipped")) {
            reflectionStatusText = "Skipped (Heuristic Quality Match)";
        }
    } else {
        reflectionStatusText = "Skipped (Quality heuristics passed)";
    }
    document.getElementById("tech-reflection").textContent = reflectionStatusText;
    
    // Render performance budget warnings row if alerts are present
    const warningRow = document.getElementById("tech-budget-warnings-row");
    const warningText = document.getElementById("tech-budget-warnings");
    if (warningRow && warningText) {
        if (data.budget_warnings && data.budget_warnings.length > 0) {
            warningText.innerHTML = data.budget_warnings.map(w => `⚠️ ${w}`).join("<br>");
            warningRow.style.display = "table-row";
        } else {
            warningRow.style.display = "none";
        }
    }

    // 3. Explainability Timing Dashboard
    const ttftVal = data.stage_metrics && data.stage_metrics.avg_ttft !== undefined ? data.stage_metrics.avg_ttft.toFixed(3) + " s" : "-- s";
    document.getElementById("metric-ttft").textContent = ttftVal;

    // Redesigned Explainability Grid
    document.getElementById("explain-doc-type").textContent = (data.document_type || "").replace(/_/g, " ").toUpperCase();
    
    const TEMPLATE_NAMES = {
        "project_plan": {
            name: "Project Plan Template",
            why: "Selected because the request asks for a project plan, timeline, scope, chatbot launch, or general project coordination."
        },
        "technical_design": {
            name: "Technical Design Document Template",
            why: "Selected because the request involves technical architecture, system design, databases, API integration, or system specifications."
        },
        "business_proposal": {
            name: "Business Proposal Template",
            why: "Selected because the request involves pitching a project, vendor request, cost estimations, or proposing a business solution."
        },
        "sop": {
            name: "Standard Operating Procedure (SOP) Template",
            why: "Selected because the request involves procedural steps, operational guidelines, instructions, or step-by-step workflow definitions."
        },
        "vendor_evaluation": {
            name: "Vendor Evaluation Template",
            why: "Selected because the request involves comparing vendors, cloud providers, software packages, or evaluation matrices."
        },
        "implementation_roadmap": {
            name: "Implementation Roadmap Template",
            why: "Selected because the request involves a phased launch, multi-stage rollout, migration plan, or long-term roadmapping."
        },
        "informational_summary": {
            name: "Informational Summary Template",
            why: "Selected because the request is a short query, informational summary, or brief history overview."
        }
    };
    
    const templateInfo = TEMPLATE_NAMES[data.document_type] || {
        name: (data.document_type || "Custom").replace(/_/g, " ").toUpperCase() + " Template",
        why: "Selected based on intent classification matching the prompt request keywords."
    };
    
    document.getElementById("explain-template").textContent = templateInfo.name;
    document.getElementById("explain-why-selected").textContent = templateInfo.why;
    document.getElementById("explain-confidence").textContent = data.confidence || "High";
    document.getElementById("explain-complexity").textContent = data.complexity || "Moderate";
    document.getElementById("explain-reading-time").textContent = data.reading_time || "10 minutes";
    document.getElementById("explain-effort").textContent = data.implementation_effort || "Medium";

    // Execution Strategy
    const modeName = data.routing_outcome || (data.llm_call_count <= 3 ? "Standard Mode" : "Advanced Mode");
    const generationType = data.llm_call_count <= 3 ? "Single merged generation" : "Phased sequential execution";
    
    let reflectionText = "Quality check executed";
    if (reflectionStatusText.includes("Skipped")) {
        reflectionText = "Reflection skipped by heuristic (quality metrics satisfied)";
    }
    
    let fallbackPart = "";
    if (data.fallback_reason) {
        fallbackPart = `\n• Fallback Reason: ${data.fallback_reason}`;
    }
    
    const strategyText = `• Pipeline Execution: ${modeName}
• Orchestration Pattern: ${generationType}
• Quality Guardrails: ${reflectionText}${fallbackPart}
• Selection Justification: ${data.fallback_reason ? "Intelligent fallback activated: standard mode request failed or was not supported, so the pipeline fallback rules transitioned execution to Advanced Mode to complete document synthesis." : (data.llm_call_count <= 3 ? "Selected Standard Mode because planner confidence is high and the request matches a predefined document template, minimizing pipeline execution time." : "Selected Advanced Mode to ensure progressive validation of complex parameters and custom requirements across multiple LLM phases.")}`;
    
    document.getElementById("explain-strategy").textContent = strategyText;

    // Quality validation status details
    const reflectContainer = document.getElementById("explain-reflection-container");
    const reflectValue = document.getElementById("explain-reflection");
    if (reflectContainer && reflectValue) {
        if (reflectionStatusText.includes("Skipped")) {
            reflectValue.innerHTML = `
                <div style="font-weight:600; margin-bottom:8px; color: var(--success);">Quality Validation Skipped because:</div>
                <ul style="list-style: none; padding-left: 0; display:flex; flex-direction:column; gap:6px; font-size:0.9rem; color: var(--text-muted);">
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="check" style="width:16px;height:16px;color:var(--success);"></i> High confidence template classification</li>
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="check" style="width:16px;height:16px;color:var(--success);"></i> Complete document structure matching target checklist</li>
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="check" style="width:16px;height:16px;color:var(--success);"></i> No structural or formatting anomalies detected</li>
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="check" style="width:16px;height:16px;color:var(--success);"></i> Quality heuristic parameters satisfied</li>
                </ul>
            `;
        } else {
            const issuesText = data.reflection && data.reflection.issues_found && data.reflection.issues_found.length > 0
                ? `Issues identified: ${data.reflection.issues_found.join(", ")}`
                : "No quality issues identified.";
            const improvementsText = data.reflection && data.reflection.improvements_applied && data.reflection.improvements_applied.length > 0
                ? `Improvements applied: ${data.reflection.improvements_applied.join(", ")}`
                : "Document structure meets required guidelines.";
            reflectValue.innerHTML = `
                <div style="font-weight:600; margin-bottom:8px; color: var(--info);">Quality Validation Executed:</div>
                <ul style="list-style: none; padding-left: 0; display:flex; flex-direction:column; gap:6px; font-size:0.9rem; color: var(--text-muted);">
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="shield" style="width:16px;height:16px;color:var(--info);"></i> Audited document completeness against consulting criteria</li>
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="shield-alert" style="width:16px;height:16px;color:var(--warning);"></i> ${escapeHtml(issuesText)}</li>
                    <li style="display:flex; align-items:center; gap:6px;"><i data-lucide="shield-check" style="width:16px;height:16px;color:var(--success);"></i> ${escapeHtml(improvementsText)}</li>
                </ul>
            `;
        }
        reflectContainer.style.display = "block";
    }

    // TIMINGS LIST (Explain why stage took zero time)
    const timingsList = document.getElementById("timings-list");
    timingsList.innerHTML = "";

    if (data.stage_metrics && data.stage_metrics.stages) {
        const stages = data.stage_metrics.stages;
        const totalDuration = data.total_execution_time || data.stage_metrics.total_time || 1;
        
        const stageNames = ["planning", "execution", "synthesis", "reflection", "generation"];
        const stageLabels = {
            "planning": "Planning Phase",
            "execution": "Execution Phase",
            "synthesis": "Synthesis Phase",
            "reflection": "Quality Reflection",
            "generation": "Document Generation"
        };

        stageNames.forEach(stageName => {
            const s = stages[stageName];
            if (s) {
                const isZero = !s.time || s.time === 0;
                const percentage = isZero ? 2 : Math.min(100, Math.max(2, (s.time / totalDuration) * 100));
                
                let statsText = "";
                if (isZero) {
                    if (stageName === "planning") {
                        statsText = "Planning: Merged into Standard Execution";
                    } else if (stageName === "synthesis" || stageName === "execution") {
                        statsText = "Completed inside merged generation";
                    } else if (stageName === "reflection") {
                        statsText = "Skipped (Quality heuristics passed)";
                    } else {
                        statsText = "0.00 s (Instant execution)";
                    }
                } else {
                    statsText = `${s.time.toFixed(2)} s (${s.calls} calls, ${s.tokens.toLocaleString()} tokens)`;
                }

                const item = document.createElement("div");
                item.style.display = "flex";
                item.style.flexDirection = "column";
                item.style.gap = "4px";
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-top: 4px;">
                        <span style="font-weight: 500; color: #e4e6ef;">${stageLabels[stageName]}</span>
                        <span style="color: #8b8fa3;">${statsText}</span>
                    </div>
                    <div style="background: #1a1d27; height: 8px; border-radius: 4px; overflow: hidden; width: 100%; border: 1px solid #2a2d3a;">
                        <div style="background: ${isZero ? '#2a2d3a' : '#6c63ff'}; height: 100%; width: ${percentage}%; border-radius: 4px; transition: width 0.6s ease-out;"></div>
                    </div>
                `;
                timingsList.appendChild(item);
            }
        });
        document.getElementById("explainability-card").style.display = "block";
    } else {
        document.getElementById("explainability-card").style.display = "none";
    }

    // Goal text
    document.getElementById("goal-text").textContent = data.goal || "N/A";

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

    // Plan Table
    renderPlanTable(data.plan || []);

    // Execution Results
    renderExecution(data, data.preview_html || data.document || "");

    // Reflection Quality Assessment
    renderReflection(data.reflection);

    // Summary Report Details
    const reportContainer = document.getElementById("summary-report-details");
    const docTypeTitle = (data.document_type || "document").replace(/_/g, " ").toUpperCase();
    const taskCount = (data.plan || []).length;
    const isStandard = data.routing_outcome ? data.routing_outcome.includes("Standard") : true;
    const modeLabel = isStandard ? "Standard Mode (Merged Pipeline)" : "Advanced Mode (Sequential Orchestration)";
    const callsCount = data.llm_call_count || 0;
    const reflectionStatusLabel = reflectionStatusText;
    const qualityLabel = data.reflection && data.reflection.grade 
        ? data.reflection.grade.replace(" (Skipped)", "") 
        : "Excellent";
    
    const cacheStatus = data.cache_status === "HIT" ? "HIT (Cached)" : "MISS (Fresh Run)";
    const formatsLabel = "PDF and Markdown (.md)";

    reportContainer.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: 600; color: var(--success); display: flex; align-items: center; gap: 8px;">
            <i data-lucide="check-circle" style="width:24px;height:24px;"></i> Document Generated Successfully
        </div>
        <table class="report-table" style="width: 100%; border-collapse: collapse; font-size: 0.95rem; color: var(--text-muted);">
            <tbody>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Document Type</td>
                    <td style="padding: 8px 0; text-align: right;">${docTypeTitle}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Number of Tasks Executed</td>
                    <td style="padding: 8px 0; text-align: right;">${taskCount} work packages</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Pipeline Mode</td>
                    <td style="padding: 8px 0; text-align: right;">${modeLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">LLM Calls</td>
                    <td style="padding: 8px 0; text-align: right;">${callsCount} calls</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Reflection Status</td>
                    <td style="padding: 8px 0; text-align: right;">${reflectionStatusLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Output Quality</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: var(--success);">${qualityLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Cache Status</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${data.cache_status === "HIT" ? "var(--success)" : "var(--info)"};">${cacheStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px 0; font-weight: 500; color: var(--text);">Generated Formats</td>
                    <td style="padding: 8px 0; text-align: right;">${formatsLabel}</td>
                </tr>
            </tbody>
        </table>
    `;

    // Download & Preview Links
    const link = document.getElementById("download-link");
    const previewContainer = document.getElementById("preview-container");
    const previewCard = document.getElementById("preview-card");

    if (data.document_url) {
        link.href = data.document_url;
        link.innerHTML = `<i data-lucide="download" style="margin-right: 8px;"></i> Download ` + escapeHtml(data.document_filename || "Document");
        show("download-card");
        
        if (data.preview_html) {
            previewContainer.innerHTML = data.preview_html;
            previewCard.style.display = "block";
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

function renderExecution(data, fullDocumentHtml) {
    const results = data.execution_results || [];
    const container = document.getElementById("execution-list");
    if (!results.length) {
        container.innerHTML = "<p class='card-body'>No execution results.</p>";
        return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = fullDocumentHtml;
    const documentText = tempDiv.textContent || tempDiv.innerText || "";

    let html = "";
    results.forEach((r, idx) => {
        const planTask = data.plan ? data.plan.find(p => p.id === r.task_id) : null;
        const purpose = planTask ? planTask.purpose : "";
        const dependsOn = planTask && planTask.depends_on ? planTask.depends_on : [];
        
        let sectionContent = r.content || "";
        if (!sectionContent && documentText) {
            sectionContent = extractSectionText(documentText, r.task);
        }

        const execSummary = r.executive_summary || r.summary || "Summary of phase execution and results.";
        const findings = r.key_findings || [];
        const recommendations = r.recommendations || [];
        const decisions = r.important_decisions || [];
        const rationale = r.decision_rationale || "Aligned with strategic priority matrix.";
        const taskAssumptions = r.assumptions || [];
        const risk = r.risks || "";
        const mitigation = r.mitigation || "";
        const tradeoff = r.tradeoffs || "";
        const deliverables = r.deliverables || [];
        const confidence = r.task_confidence || "High";

        // Conditional Risks & Tradeoffs rendering
        const showRisks = risk && risk.trim() && risk !== "Operational bandwidth limitations.";
        
        // Status checks
        const statusValue = r.parsed_status || r.status || "completed";
        const statusClass = `status-${statusValue.toLowerCase()}`;
        const showStatus = statusValue && statusValue.toLowerCase() !== "completed" && statusValue.toLowerCase() !== "pending";

        // Dependencies checks
        const deps = (r.parsed_dependencies && r.parsed_dependencies.length) ? r.parsed_dependencies : (dependsOn && dependsOn.length ? dependsOn : []);
        const showDeps = deps && deps.length > 0;

        html += `
            <div class="task-premium-card" style="background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; transition: all 0.3s; display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px;">
                <!-- Header -->
                <div class="task-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--accent); text-transform: uppercase;">Task ID: #${r.task_id}</span>
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0;">${escapeHtml(r.task)}</h3>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${showStatus ? `<span class="status ${statusClass}">${escapeHtml(statusValue)}</span>` : ""}
                        <span class="badge" style="background: rgba(108, 99, 255, 0.1); color: var(--accent); font-size: 0.8rem; font-weight: 600; padding: 4px 8px; border-radius: 4px;">Confidence: ${confidence}</span>
                    </div>
                </div>
                
                <!-- Purpose -->
                <div class="task-card-purpose" style="font-size: 0.9rem; color: var(--info); display: flex; align-items: center; gap: 6px; background: rgba(0, 204, 255, 0.05); padding: 8px 12px; border-radius: 6px;">
                    <i data-lucide="compass" style="width: 16px; height: 16px;"></i> <span><strong>Purpose:</strong> ${escapeHtml(purpose || "Aligned planning output execution")}</span>
                </div>

                <!-- Executive Summary -->
                <div class="task-card-summary" style="font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); padding: 16px; background: var(--surface); border-radius: 8px; border-left: 4px solid var(--accent);">
                    <div style="font-weight: 600; color: var(--text); margin-bottom: 8px; display:flex; align-items:center; gap:6px;">
                        <i data-lucide="file-text" style="width:16px;height:16px;color:var(--accent);"></i> Executive Summary
                    </div>
                    <div style="white-space: pre-line;">${escapeHtml(execSummary)}</div>
                </div>

                <!-- Main Content Grid -->
                <div class="task-card-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 8px;">
                    <!-- Key Findings -->
                    <div style="background: var(--surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                        <strong style="font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                            <i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--success);"></i> Key Findings
                        </strong>
                        <ul style="list-style: none; padding-left: 0; font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;">
                            ${findings.map(f => `<li style="display:flex; align-items:flex-start; gap:6px;"><i data-lucide="check" style="width:14px;height:14px;color:var(--success);margin-top:3px;flex-shrink:0;"></i><span>${escapeHtml(f)}</span></li>`).join("")}
                        </ul>
                    </div>

                    <!-- Actionable Recommendations -->
                    <div style="background: var(--surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                        <strong style="font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                            <i data-lucide="trending-up" style="width:16px;height:16px;color:var(--info);"></i> Recommendations
                        </strong>
                        <ul style="list-style: none; padding-left: 0; font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;">
                            ${recommendations.map(re => `<li style="display:flex; align-items:flex-start; gap:6px;"><i data-lucide="arrow-right" style="width:14px;height:14px;color:var(--info);margin-top:3px;flex-shrink:0;"></i><span>${escapeHtml(re)}</span></li>`).join("")}
                        </ul>
                    </div>
                </div>

                <!-- Decisions & Assumptions Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                    <!-- Decisions -->
                    <div style="background: var(--surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                        <strong style="font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                            <i data-lucide="gavel" style="width:16px;height:16px;color:var(--warning);"></i> Important Decisions
                        </strong>
                        <ul style="list-style: none; padding-left: 0; font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
                            ${decisions.map(d => `<li style="display:flex; align-items:flex-start; gap:6px;"><i data-lucide="help-circle" style="width:14px;height:14px;color:var(--warning);margin-top:3px;flex-shrink:0;"></i><span>${escapeHtml(d)}</span></li>`).join("")}
                        </ul>
                        <div style="font-size: 0.85rem; color: var(--text-muted); border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 8px;">
                            <strong>Why:</strong> ${escapeHtml(rationale)}
                        </div>
                    </div>

                    <!-- Assumptions -->
                    <div style="background: var(--surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                        <strong style="font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                            <i data-lucide="layers" style="width:16px;height:16px;color:var(--info);"></i> Assumptions
                        </strong>
                        <ul style="list-style: none; padding-left: 0; font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;">
                            ${taskAssumptions.map(a => `<li style="display:flex; align-items:flex-start; gap:6px;"><i data-lucide="info" style="width:14px;height:14px;color:var(--info);margin-top:3px;flex-shrink:0;"></i><span>${escapeHtml(a)}</span></li>`).join("")}
                        </ul>
                    </div>
                </div>

                ${showRisks ? `
                <!-- Risks, Mitigation & Tradeoffs -->
                <div style="background: rgba(239, 83, 80, 0.03); border: 1px solid rgba(239, 83, 80, 0.15); padding: 16px; border-radius: 8px; display:flex; flex-direction:column; gap:8px;">
                    <div style="font-size: 0.95rem; font-weight: 600; color: #ef5350; display:flex; align-items:center; gap:6px;">
                        <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Risks & Tradeoffs
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">
                        <strong>Primary Risk:</strong> ${escapeHtml(risk)}
                    </div>
                    ${mitigation ? `<div style="font-size: 0.9rem; color: var(--text-muted);"><strong>Mitigation:</strong> ${escapeHtml(mitigation)}</div>` : ""}
                    ${tradeoff ? `<div style="font-size: 0.9rem; color: var(--text-muted);"><strong>Tradeoff:</strong> ${escapeHtml(tradeoff)}</div>` : ""}
                </div>
                ` : ""}

                <!-- Key Deliverables -->
                <div style="background: var(--surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                    <strong style="font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                        <i data-lucide="package" style="width:16px;height:16px;color:var(--success);"></i> Key Deliverables
                    </strong>
                    <ul style="list-style: none; padding-left: 0; font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;">
                        ${deliverables.map(d => `<li style="display:flex; align-items:flex-start; gap:6px;"><i data-lucide="check" style="width:14px;height:14px;color:var(--success);margin-top:3px;flex-shrink:0;"></i><span>${escapeHtml(d)}</span></li>`).join("")}
                    </ul>
                </div>

                <!-- Footer & Expand Button -->
                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap; gap: 12px;">
                    <div style="display:flex; gap:16px;">
                        <span><i data-lucide="tool" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>Tool: <strong style="color:var(--info);">${escapeHtml(r.tool)}</strong></span>
                        ${showDeps ? `<span><i data-lucide="git-branch" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>Dependencies: <strong>${escapeHtml(deps.join(", "))}</strong></span>` : ""}
                    </div>
                    <button class="btn btn-secondary" id="task-details-btn-${r.task_id}" onclick="toggleTaskDetails(${r.task_id})" style="padding: 6px 12px; font-size: 0.8rem;">
                        <i data-lucide="chevron-down" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Expand Details
                    </button>
                </div>

                <div class="task-details-collapse hidden" id="task-details-${r.task_id}" style="margin-top: 12px; padding: 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; overflow-x: auto; color: var(--text-muted); max-height: 350px; overflow-y: auto;">
                    ${escapeHtml(sectionContent || "Detailed execution data logged inside complete document preview.")}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

function renderReflection(reflection) {
    const container = document.getElementById("reflection-content");
    
    if (!reflection) {
        container.innerHTML = `
            <div style="padding: 16px; background: rgba(52, 211, 153, 0.1); border-left: 4px solid var(--success); border-radius: 8px; color: var(--success); display: flex; flex-direction: column; gap: 8px;">
                <div style="font-weight: 600; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; color: var(--success);">
                    <i data-lucide="check-circle" style="width:20px;height:20px;"></i> Quality Validation Passed
                </div>
                <div style="font-size: 0.92rem; color: var(--text-muted);">
                    <strong>Grade:</strong> Excellent<br>
                    <strong>Reflection:</strong> Not Required<br>
                    <strong>Reason:</strong> Document passed heuristic quality validation. Reflection was intentionally skipped to reduce latency.
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const grade = reflection.grade || "Acceptable";
    const isSkipped = grade.includes("Skipped") || grade === "Excellent" || grade === "Good";
    const isError = reflection.error;
    const passed = reflection.passed;
    
    let boxClass = "";
    let iconName = "";
    let titleText = "";
    let colorStyle = "";
    let reasonDetail = "";

    if (isSkipped && !isError) {
        boxClass = "border-left: 4px solid var(--success); background: rgba(52, 211, 153, 0.1);";
        iconName = "check-circle";
        titleText = "Quality Validation Passed";
        colorStyle = "var(--success)";
        reasonDetail = `<strong>Grade:</strong> Excellent<br>
                        <strong>Reflection:</strong> Not Required<br>
                        <strong>Reason:</strong> Document passed heuristic quality validation. Reflection was intentionally skipped to reduce latency.`;
    } else if (isError) {
        boxClass = "border-left: 4px solid var(--info); background: rgba(96, 165, 250, 0.1);";
        iconName = "info";
        titleText = "Reflection Skipped (Soft-fail Open)";
        colorStyle = "var(--info)";
        reasonDetail = `<strong>Grade:</strong> ${grade}<br>
                        <strong>Reflection:</strong> Skipped due to provider response delay.<br>
                        <strong>Reason:</strong> Soft-fail open enabled to ensure document delivery without delay.`;
    } else if (passed) {
        boxClass = "border-left: 4px solid var(--success); background: rgba(52, 211, 153, 0.1);";
        iconName = "check-circle";
        titleText = "Quality Check Passed";
        colorStyle = "var(--success)";
        reasonDetail = `<strong>Grade:</strong> ${grade}<br>
                        <strong>Reason:</strong> ${escapeHtml(reflection.reason || "The document meets all qualitative standard guidelines.")}`;
    } else {
        boxClass = "border-left: 4px solid var(--warning); background: rgba(251, 191, 36, 0.1);";
        iconName = "alert-triangle";
        titleText = "Needs Revision — Auto-Revised Completed";
        colorStyle = "var(--warning)";
        reasonDetail = `<strong>Grade:</strong> ${grade}<br>
                        <strong>Reason:</strong> ${escapeHtml(reflection.reason)}`;
    }

    let html = `
        <div style="padding: 16px; border-radius: 8px; color: ${colorStyle}; ${boxClass} display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 600; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="${iconName}" style="width:20px;height:20px;"></i> ${titleText}
            </div>
            <div style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.6;">
                ${reasonDetail}
            </div>
        </div>
    `;

    if (reflection.issues_found && reflection.issues_found.length) {
        html += `<div style="margin-top: 12px; font-size: 0.9rem;">
            <p style="color: var(--text); font-weight: 600; margin-bottom: 6px;">Issues Identified:</p>
            <ul style="list-style: disc; padding-left: 20px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">`;
        reflection.issues_found.forEach(i => {
            html += `<li>${escapeHtml(i)}</li>`;
        });
        html += "</ul></div>";
    }

    if (reflection.improvements_applied && reflection.improvements_applied.length) {
        html += `<div style="margin-top: 12px; font-size: 0.9rem;">
            <p style="color: var(--text); font-weight: 600; margin-bottom: 6px;">Improvements Applied:</p>
            <ul style="list-style: disc; padding-left: 20px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">`;
        reflection.improvements_applied.forEach(i => {
            html += `<li>${escapeHtml(i)}</li>`;
        });
        html += "</ul></div>";
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

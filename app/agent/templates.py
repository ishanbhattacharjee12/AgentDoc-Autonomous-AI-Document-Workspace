"""Adaptive document templates with predefined phases and assumptions."""

from typing import Dict, List, Any

DOCUMENT_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "project_plan": {
        "title": "Project Plan",
        "implementation_effort": "High",
        "complexity": "High",
        "reading_time": "15 minutes",
        "assumptions": [
            "Project sponsor has authorized the budget and resource commitments.",
            "Key stakeholders are identified and aligned on the primary objectives.",
            "Timeline assumes standard work week without unforeseen external delays.",
            "Contingency buffer of 10-15% is integrated into the final schedule."
        ],
        "phases": [
            {"id": 1, "task": "Project Definition & Objectives", "purpose": "Establish project goals, business case, and measurable targets.", "tool": "requirements_analysis"},
            {"id": 2, "task": "Scope & Boundaries Definition", "purpose": "Clarify in-scope vs out-of-scope deliverables to prevent creep.", "tool": "analysis"},
            {"id": 3, "task": "Execution Timeline & Milestones", "purpose": "Map tasks to phases with timelines, key milestones, and dependencies.", "tool": "priority_matrix"},
            {"id": 4, "task": "Team Structure & RACI Matrix", "purpose": "Define roles, responsibilities, and decision-making authority.", "tool": "stakeholder_analysis"},
            {"id": 5, "task": "Risk Assessment & Mitigation", "purpose": "Identify potential roadblocks and define proactive mitigation plans.", "tool": "compliance_review"}
        ]
    },
    "improvement_plan": {
        "title": "Improvement Plan",
        "implementation_effort": "High",
        "complexity": "High",
        "reading_time": "15 minutes",
        "assumptions": [
            "Current baseline metrics are available or can be estimated.",
            "Engineering and product teams have partial capacity to implement recommendations.",
            "Budget constraint of $50K applies to the initial implementation.",
            "Leadership requires weekly updates on progress and metric impact."
        ],
        "phases": [
            {"id": 1, "task": "Problem Framing & Baseline Analysis", "purpose": "Define the current issues, impact on business, and unknown factors.", "tool": "analysis"},
            {"id": 2, "task": "Hypothesis Generation & Prioritization", "purpose": "Identify potential root causes and rank solutions by impact vs effort.", "tool": "priority_matrix"},
            {"id": 3, "task": "Phased 90-Day Implementation Roadmap", "purpose": "Detail quick wins, experimental phases, and scale schedules.", "tool": "analysis"},
            {"id": 4, "task": "Success Metrics & Measurement Framework", "purpose": "Define key performance indicators and analytics tracking plans.", "tool": "requirements_analysis"},
            {"id": 5, "task": "Risks, Constraints & Mitigation", "purpose": "Address resource limits, data gaps, and engineering capacity.", "tool": "cost_benefit_analysis"}
        ]
    },
    "proposal": {
        "title": "Proposal",
        "implementation_effort": "Medium",
        "complexity": "Moderate",
        "reading_time": "10 minutes",
        "assumptions": [
            "Target audience has a basic understanding of the domain.",
            "The proposed solution is aligned with industry best practices.",
            "Pricing and resource estimates are preliminary and subject to change."
        ],
        "phases": [
            {"id": 1, "task": "Executive Summary & Goal Statement", "purpose": "Present a compelling overview of the proposed solution and benefits.", "tool": "analysis"},
            {"id": 2, "task": "Problem Definition & Need Assessment", "purpose": "Demonstrate a deep understanding of the client's challenges.", "tool": "requirements_analysis"},
            {"id": 3, "task": "Proposed Solution & Methodology", "purpose": "Detail the technical or business approach to solve the problem.", "tool": "knowledge"},
            {"id": 4, "task": "Timeline, Deliverables & Budget", "purpose": "Outline the project phases, schedule, and cost breakdown.", "tool": "cost_benefit_analysis"}
        ]
    },
    "sop": {
        "title": "Standard Operating Procedure",
        "implementation_effort": "Medium",
        "complexity": "Moderate",
        "reading_time": "10 minutes",
        "assumptions": [
            "Operators have completed basic training on relevant tools.",
            "SOP is compliant with existing security and organizational policies.",
            "Exceptions must be escalated to the supervisor immediately."
        ],
        "phases": [
            {"id": 1, "task": "Purpose & Scope Definition", "purpose": "Define what the procedure covers and who must follow it.", "tool": "analysis"},
            {"id": 2, "task": "Roles & Responsibilities", "purpose": "Assign ownership and specify who performs each step.", "tool": "stakeholder_analysis"},
            {"id": 3, "task": "Procedure Execution Steps", "purpose": "Provide step-by-step instructions for executing the process.", "tool": "knowledge"},
            {"id": 4, "task": "Quality Control & Exception Handling", "purpose": "Outline verification checks and actions to take when errors occur.", "tool": "compliance_review"}
        ]
    },
    "technical_design": {
        "title": "Technical Design",
        "implementation_effort": "High",
        "complexity": "High",
        "reading_time": "15 minutes",
        "assumptions": [
            "System will run on standard cloud infrastructure.",
            "Existing codebase can be extended with minimal rewrite.",
            "Latency and scalability requirements are defined in the product specification."
        ],
        "phases": [
            {"id": 1, "task": "System Overview & Requirements", "purpose": "Provide high-level architecture and functional/non-functional needs.", "tool": "requirements_analysis"},
            {"id": 2, "task": "Architectural Design & Flowchart", "purpose": "Detail components, database schemas, and API contracts.", "tool": "analysis"},
            {"id": 3, "task": "Component Specifications", "purpose": "Deep dive into algorithms, integrations, and services.", "tool": "knowledge"},
            {"id": 4, "task": "Risk Analysis & Trade-offs", "purpose": "Discuss performance, security, scaling risks, and design choices.", "tool": "compliance_review"}
        ]
    },
    "informational_summary": {
        "title": "Informational Summary",
        "implementation_effort": "Low",
        "complexity": "Basic",
        "reading_time": "5 minutes",
        "assumptions": [
            "Audience is seeking a concise, structured introduction to the topic.",
            "Historical facts and industry context are sourced from verified definitions."
        ],
        "phases": [
            {"id": 1, "task": "Core Concept & Definitions", "purpose": "Define the topic and outline its basic parameters.", "tool": "knowledge"},
            {"id": 2, "task": "Historical Context & Milestones", "purpose": "Trace the origin, key breakthroughs, and evolution timeline.", "tool": "analysis"},
            {"id": 3, "task": "Impact & Present Day Context", "purpose": "Explain the current applications and significance.", "tool": "priority_matrix"}
        ]
    },
    "business_document": {
        "title": "Business Document",
        "implementation_effort": "Medium",
        "complexity": "Moderate",
        "reading_time": "10 minutes",
        "assumptions": [
            "Standard business guidelines apply.",
            "The document aims to provide actionable insight for decision-making."
        ],
        "phases": [
            {"id": 1, "task": "Objectives & Context Analysis", "purpose": "Define the purpose and relevant context of the request.", "tool": "analysis"},
            {"id": 2, "task": "Core Analysis & Insights", "purpose": "Perform deep domain analysis and gather findings.", "tool": "knowledge"},
            {"id": 3, "task": "Recommendations & Next Steps", "purpose": "Offer clear, structured, and actionable recommendations.", "tool": "priority_matrix"}
        ]
    }
}

def get_template(doc_type: str) -> Dict[str, Any]:
    """Retrieve the template configuration for a given document type."""
    return DOCUMENT_TEMPLATES.get(doc_type, DOCUMENT_TEMPLATES["business_document"])

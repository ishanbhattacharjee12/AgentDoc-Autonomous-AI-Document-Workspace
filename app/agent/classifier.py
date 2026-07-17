"""Confidence-aware heuristic document classifier."""

import re
from typing import Tuple, Optional

def classify_request(request: str) -> Tuple[str, str]:
    """Classify the user request into a document type with a confidence score.
    
    Returns (document_type, confidence).
    Confidence can be "High", "Medium", or "Low".
    If confidence is "Low", the orchestrator should fall back to free-form planning.
    """
    req_lower = request.lower()
    
    # 1. Project Plan
    project_plan_keywords = ["project plan", "gantt", "launching", "milestones", "timeline", "roadmap"]
    if any(k in req_lower for k in project_plan_keywords):
        if "project plan" in req_lower:
            return "project_plan", "High"
        return "project_plan", "Medium"
        
    # 2. Improvement Plan
    improvement_keywords = ["improvement plan", "onboarding", "retention", "drop off", "dropping off", "churn", "optimization"]
    if any(k in req_lower for k in improvement_keywords):
        if "improvement plan" in req_lower or "onboarding" in req_lower:
            return "improvement_plan", "High"
        return "improvement_plan", "Medium"
        
    # 3. Proposal
    proposal_keywords = ["proposal", "rfp", "request for proposal", "pitch", "bid"]
    if any(k in req_lower for k in proposal_keywords):
        return "proposal", "High"
        
    # 4. Standard Operating Procedure (SOP)
    sop_keywords = ["sop", "standard operating procedure", "procedure", "operations manual", "checklist"]
    if any(k in req_lower for k in sop_keywords):
        if "sop" in req_lower or "standard operating procedure" in req_lower:
            return "sop", "High"
        return "sop", "Medium"
        
    # 5. Technical Design
    tech_keywords = ["technical design", "architecture", "system design", "technical specification", "database schema"]
    if any(k in req_lower for k in tech_keywords):
        if "technical design" in req_lower or "architecture" in req_lower:
            return "technical_design", "High"
        return "technical_design", "Medium"

    # 6. Informational Summary
    summary_keywords = ["summary", "summarize", "history", "explain", "brief", "overview"]
    word_count = len(request.split())
    if any(k in req_lower for k in summary_keywords) or word_count < 15:
        if "summary" in req_lower or "summarize" in req_lower:
            return "informational_summary", "High"
        return "informational_summary", "Medium"

    # Fallback / Low confidence
    return "business_document", "Low"

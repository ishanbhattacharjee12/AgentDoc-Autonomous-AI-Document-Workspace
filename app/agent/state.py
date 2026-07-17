"""Shared pipeline state to carry context and prevent conversation duplication."""

from typing import List, Dict, Any
from pydantic import BaseModel, Field

class PipelineState(BaseModel):
    """Encapsulates the shared context of a document generation run."""
    request: str
    goal: str
    document_type: str
    assumptions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    phase_summaries: List[Dict[str, Any]] = Field(default_factory=list)
    
    def get_summary_text(self) -> str:
        """Get a compact summary of previous phase outcomes for context passing."""
        if not self.phase_summaries:
            return "No prior phases completed."
        
        lines = []
        for p in self.phase_summaries:
            lines.append(f"- Phase '{p.get('task', '')}': {p.get('summary', '')[:200]}...")
        return "\n".join(lines)

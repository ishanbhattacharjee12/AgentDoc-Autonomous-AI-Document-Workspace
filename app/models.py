"""AgentDoc Pydantic models.

Defines all data structures for the agent pipeline:
request/response, planning, task execution, reflection.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# --- Request / Response ---

class AgentRequest(BaseModel):
    """Incoming user request."""
    request: str = Field(..., min_length=1, max_length=2000)
    require_review: bool = Field(default=False)
    format: str = Field(default="docx")

    @field_validator("request")
    @classmethod
    def validate_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Request must not be empty or whitespace-only.")
        if len(v.strip().split()) < 3:
            raise ValueError("Request is too short to be actionable.")
        return v.strip()


class TaskPlan(BaseModel):
    """A single task in the generated plan."""
    id: int
    task: str
    purpose: str
    tool: str = Field(default="analysis")
    depends_on: list[int] = Field(default_factory=list)
    status: str = Field(default="pending")
    summary: str = Field(default="")


class PlannerOutput(BaseModel):
    """Structured output from the autonomous planner."""
    goal: str
    document_type: str
    confidence: str = Field(default="Medium")
    confidence_reason: str = Field(default="")
    complexity: str = Field(default="Moderate")
    complexity_reason: str = Field(default="")
    reading_time: str = Field(default="")
    implementation_effort: str = Field(default="")
    planning_summary: str = Field(default="")
    assumptions: list[str] = Field(default_factory=list)
    tasks: list[TaskPlan] = Field(default_factory=list)


class PlanEditRequest(BaseModel):
    """Approved or edited plan to resume execution."""
    request: str = Field(..., min_length=1)
    format: str = Field(default="docx")
    planner_output: PlannerOutput


class ReflectionResult(BaseModel):
    """Result of the reflection/self-check stage."""
    passed: bool = True
    grade: str = Field(default="Satisfactory")
    reason: str = Field(default="")
    issues_found: list[str] = Field(default_factory=list)
    improvements_applied: list[str] = Field(default_factory=list)
    error: bool = False


class ExecutionResult(BaseModel):
    """Result of executing a single task."""
    task_id: int
    task: str
    tool: str
    status: str
    summary: str
    content: str = Field(default="")


class AgentResponse(BaseModel):
    """Full response from the agent pipeline."""
    status: str
    goal: str = ""
    document_type: str = ""
    confidence: str = ""
    confidence_reason: str = ""
    complexity: str = ""
    complexity_reason: str = ""
    reading_time: str = ""
    implementation_effort: str = ""
    planning_summary: str = ""
    assumptions: list[str] = Field(default_factory=list)
    plan: list[dict] = Field(default_factory=list)
    execution_results: list[dict] = Field(default_factory=list)
    reflection: Optional[dict] = None
    summary: str = ""
    document_filename: str = ""
    document_url: str = ""
    error: str = ""
    total_execution_time: float = 0.0
    llm_call_count: int = 0
    revision_count: int = 0

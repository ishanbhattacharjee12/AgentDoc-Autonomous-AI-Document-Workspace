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
    assumptions: list[str] = Field(default_factory=list)
    tasks: list[TaskPlan] = Field(default_factory=list)


class ReflectionResult(BaseModel):
    """Result of the reflection/self-check stage."""
    passed: bool = True
    issues_found: list[str] = Field(default_factory=list)
    improvements_applied: list[str] = Field(default_factory=list)


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
    assumptions: list[str] = Field(default_factory=list)
    plan: list[dict] = Field(default_factory=list)
    execution_results: list[dict] = Field(default_factory=list)
    reflection: Optional[dict] = None
    summary: str = ""
    document_filename: str = ""
    document_url: str = ""
    error: str = ""

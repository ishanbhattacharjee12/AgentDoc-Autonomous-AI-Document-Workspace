"""Model capability registry for provider-agnostic model selection."""

import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class ModelProfile(BaseModel):
    name: str
    provider: str = Field(default="generic")
    reasoning: bool = Field(default=False)
    supports_json: bool = Field(default=True)
    supports_streaming: bool = Field(default=False)
    supports_reasoning_effort: bool = Field(default=False)  # Whether the model accepts reasoning_effort parameter
    latency_tier: str = Field(default="medium")  # "fast", "medium", "slow"
    max_output_tokens: int = Field(default=4000)
    recommended_use: str = Field(default="fast_generation")  # "fast_generation", "reflection", "deep_analysis"

# Registry of known models and their capabilities
MODEL_REGISTRY: Dict[str, ModelProfile] = {
    # OpenCode Zen defaults
    "tencent/hy3:free": ModelProfile(
        name="tencent/hy3:free",
        provider="zen",
        reasoning=True,
        supports_json=False,
        supports_reasoning_effort=True,  # Verified: reasoning_effort="none" yields 0 reasoning tokens
        latency_tier="medium",
        max_output_tokens=4000,
        recommended_use="deep_analysis"
    ),
    "hy3-free": ModelProfile(
        name="hy3-free",
        provider="zen",
        reasoning=True,
        supports_json=False,
        supports_reasoning_effort=True,  # Verified: reasoning_effort="none" yields 0 reasoning tokens
        latency_tier="medium",
        max_output_tokens=4000,
        recommended_use="deep_analysis"
    ),
    "deepseek-v4-flash-free": ModelProfile(
        name="deepseek-v4-flash-free",
        provider="zen",
        reasoning=False,
        supports_json=True,
        supports_reasoning_effort=False,  # Verified: reasoning_effort="none"/"minimal" returns 400 upstream error
        latency_tier="fast",
        max_output_tokens=8000,
        recommended_use="fast_generation"
    ),
    "mimo-v2.5-free": ModelProfile(
        name="mimo-v2.5-free",
        provider="zen",
        reasoning=True,
        supports_json=True,
        supports_reasoning_effort=False,
        latency_tier="fast",
        max_output_tokens=8000,
        recommended_use="fast_generation"
    ),
    "deepseek/deepseek-r1": ModelProfile(
        name="deepseek/deepseek-r1",
        provider="zen",
        reasoning=True,
        supports_json=False,
        latency_tier="slow",
        max_output_tokens=8000,
        recommended_use="deep_analysis"
    ),
    "gpt-4o-mini": ModelProfile(
        name="gpt-4o-mini",
        provider="openai",
        reasoning=False,
        supports_json=True,
        latency_tier="fast",
        max_output_tokens=4000,
        recommended_use="fast_generation"
    ),
    "gpt-4o": ModelProfile(
        name="gpt-4o",
        provider="openai",
        reasoning=False,
        supports_json=True,
        latency_tier="fast",
        max_output_tokens=4000,
        recommended_use="deep_analysis"
    ),
    "o1-mini": ModelProfile(
        name="o1-mini",
        provider="openai",
        reasoning=True,
        supports_json=False,
        latency_tier="medium",
        max_output_tokens=4000,
        recommended_use="reflection"
    ),
}

# Environment variable mappings for profiles
import os
PROFILE_TO_MODEL: Dict[str, str] = {
    "fast_generation": os.getenv("LLM_MODEL_FAST", "").strip() or os.getenv("LLM_MODEL", "").strip() or "deepseek-v4-flash-free",
    "reflection": os.getenv("LLM_MODEL_REFLECTION", "").strip() or os.getenv("LLM_MODEL", "").strip() or "hy3-free",
    "deep_analysis": os.getenv("LLM_MODEL_DEEP", "").strip() or os.getenv("LLM_MODEL", "").strip() or "hy3-free",
}

def get_model_for_profile(profile: str) -> str:
    """Resolve a capability profile name to a configured model name."""
    return PROFILE_TO_MODEL.get(profile, PROFILE_TO_MODEL["fast_generation"])

def get_profile_capabilities(profile: str) -> ModelProfile:
    """Get the capabilities of the model assigned to a given usage profile."""
    model_name = get_model_for_profile(profile)
    return get_model_profile(model_name)

def get_model_profile(model_name: str) -> ModelProfile:
    """Retrieve capabilities profile for a given model.
    
    If the model is not registered, infer its profile from heuristics to prevent failures.
    """
    model_name_stripped = model_name.strip()
    
    if model_name_stripped in MODEL_REGISTRY:
        return MODEL_REGISTRY[model_name_stripped]
        
    # Heuristically infer capabilities for unregistered models
    logger.warning("Model '%s' not found in registry. Inferring capabilities.", model_name_stripped)
    name_lower = model_name_stripped.lower()
    
    # Infer reasoning capabilities
    is_reasoning = any(x in name_lower for x in ["hy3", "r1", "reasoning", "think", "o1", "o3"])
    
    # Infer latency tier
    if any(x in name_lower for x in ["flash", "mini", "fast", "speed"]):
        latency = "fast"
    elif any(x in name_lower for x in ["r1", "pro", "ultra", "large", "o1"]):
        latency = "slow"
    else:
        latency = "medium"
        
    # Infer provider
    if "gpt" in name_lower or name_lower.startswith("o1") or name_lower.startswith("o3"):
        provider = "openai"
    elif "claude" in name_lower:
        provider = "anthropic"
    elif "gemini" in name_lower:
        provider = "google"
    else:
        provider = "generic"
        
    profile = ModelProfile(
        name=model_name_stripped,
        provider=provider,
        reasoning=is_reasoning,
        supports_json=not is_reasoning,  # Reasoning models often fail native JSON mode
        latency_tier=latency,
        max_output_tokens=4000,
        recommended_use="deep_analysis" if is_reasoning else "fast_generation"
    )
    
    return profile

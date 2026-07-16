"""AgentDoc LLM client.

Wraps the LLM API with retry logic, structured output parsing, and capability profiles.
Supports demo mode for testing when API key is unavailable.
"""

import json
import logging
import re
import time
from typing import Optional

import openai

from app.config import (
    LLM_PROVIDER,
    LLM_API_KEY,
    LLM_BASE_URL,
    ACTIVE_MODEL,
    ACTIVE_MODEL_PROFILE,
    USE_DEMO_MODE
)
from app.llm.demo import _demo_response
from app.llm.budget_guard import check_budget_pre_llm, check_budget_post_llm

logger = logging.getLogger(__name__)

_client: Optional[openai.Client] = None
_global_llm_calls: int = 0
_global_tokens_used: int = 0
_global_total_time: float = 0.0

_last_llm_diagnostics = []

def get_last_llm_diagnostics() -> list:
    global _last_llm_diagnostics
    return _last_llm_diagnostics

def reset_llm_diagnostics():
    global _last_llm_diagnostics
    _last_llm_diagnostics.clear()


def get_llm_call_count() -> int:
    return _global_llm_calls


def get_llm_tokens_used() -> int:
    return _global_tokens_used


def get_llm_total_time() -> float:
    return _global_total_time


def reset_llm_metrics() -> None:
    global _global_llm_calls, _global_tokens_used, _global_total_time
    _global_llm_calls = 0
    _global_tokens_used = 0
    _global_total_time = 0.0


def get_client() -> openai.Client:
    """Get or create the OpenAI-compatible client singleton."""
    global _client
    if _client is None:
        if not LLM_API_KEY:
            raise RuntimeError("LLM_API_KEY is not configured.")
        _client = openai.Client(
            api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL
        )
    return _client


def strip_reasoning_tags(text: str) -> str:
    """Strip XML-style reasoning tags like <think>...</think> and <analysis>...</analysis>."""
    if not text:
        return text
    text = text.strip()
    for tag in ["reasoning", "think", "analysis"]:
        pattern = f"<{tag}>.*?</{tag}>"
        text = re.sub(pattern, "", text, flags=re.DOTALL | re.IGNORECASE)
    return text.strip()


def clean_json_response(text: str) -> str:
    """Strip markdown fences, reasoning tags, and whitespace from LLM JSON output."""
    text = strip_reasoning_tags(text)
    
    # Remove ```json ... ``` or ``` ... ```
    pattern = r"^```(?:json)?\s*\n?(.*?)\n?\s*```$"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        text = match.group(1).strip()
    
    # Iteratively search for the first valid JSON dictionary block containing known keys
    KNOWN_KEYS = {"goal", "document_type", "tasks", "plan", "document", "grade", "passed", "issues_found"}
    start_pos = 0
    while True:
        idx = text.find("{", start_pos)
        if idx == -1:
            break
        
        end_idx = text.rfind("}")
        if end_idx != -1 and end_idx > idx:
            candidate = text[idx:end_idx+1]
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict) and any(k in parsed for k in KNOWN_KEYS):
                    return candidate
            except Exception:
                pass
        start_pos = idx + 1
        
    # Fallback to simple outermost brace slice if validation loop didn't succeed
    first_brace = text.find("{")
    if first_brace != -1:
        end_idx = text.rfind("}")
        if end_idx != -1 and end_idx > first_brace:
            return text[first_brace:end_idx+1].strip()
                
    return text.strip()


def _sanitize_error(error: Exception) -> str:
    """Remove any potential API key fragments from error messages."""
    msg = str(error)
    # Remove anything that looks like an API key
    msg = re.sub(r'sk-[a-zA-Z0-9_-]{10,}', 'sk-***', msg)
    return msg[:200]





def call_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    timeout: Optional[float] = None,
    profile: str = "fast_generation",
    json_mode: bool = False,
    token_callback: Optional[callable] = None,
) -> str:
    """Call the LLM using streaming to measure TTFT and return the text response.

    Uses demo mode if configured, otherwise calls the configured LLM API.
    Retries once on transient errors.
    """
    global _global_llm_calls, _global_tokens_used, _global_total_time
    _global_llm_calls += 1

    if USE_DEMO_MODE:
        start_time = time.time()
        resp = _demo_response(system_prompt, user_prompt)
        elapsed = time.time() - start_time
        _global_total_time += elapsed
        
        # Record mock metrics for demo mode
        from app.metrics import get_active_metrics
        metrics = get_active_metrics()
        if metrics:
            metrics.record_llm_call(tokens=0, elapsed_time=elapsed, retry_count=0, ttft=0.005)
            
        if token_callback:
            # Simulate streaming by sending chunks of 40 characters every 20ms
            import time as sleep_time
            chunks = [resp[i:i+40] for i in range(0, len(resp), 40)]
            for chunk in chunks:
                try:
                    token_callback(chunk)
                except Exception as cb_err:
                    logger.warning("Error in token_callback: %s", cb_err)
                sleep_time.sleep(0.02)
                
        return resp

    from app.llm.registry import get_model_for_profile, get_model_profile
    model_name = get_model_for_profile(profile)
    model_profile = get_model_profile(model_name)

    client = get_client()
    call_timeout = timeout or 120

    for attempt in range(2):
        try:
            start_time = time.time()
            
            kwargs = {}
            if json_mode and model_profile.supports_json:
                kwargs["response_format"] = {"type": "json_object"}
                
            # Request usage in stream if supported by the provider
            if model_profile.provider in ("openai", "zen"):
                kwargs["stream_options"] = {"include_usage": True}
                
            # Conditionally suppress reasoning tokens for models that support it.
            # Only applied when the model's registry profile indicates support,
            # preventing 400 errors on models that reject this parameter.
            if model_profile.supports_reasoning_effort and model_profile.reasoning:
                kwargs["reasoning_effort"] = "none"
                logger.info("[Reasoning] Applying reasoning_effort='none' for model %s (profile: %s)", model_name, profile)
                
            # Resolve maximum output tokens limit based on registry capability if not explicitly overridden by caller
            limit_tokens = max_tokens or model_profile.max_output_tokens

            # Enforce pre-LLM performance budget check
            check_budget_pre_llm(system_prompt, user_prompt)
            
            try:
                response_stream = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    max_tokens=limit_tokens,
                    timeout=call_timeout,
                    stream=True,
                    **kwargs
                )
            except Exception as stream_err:
                # Fallback: retry without stream_options if it fails
                logger.warning("Streaming with usage options failed: %s. Retrying without usage options.", stream_err)
                kwargs.pop("stream_options", None)
                response_stream = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    max_tokens=limit_tokens,
                    timeout=call_timeout,
                    stream=True,
                    **kwargs
                )

            content_chunks = []
            ttft = None
            usage_tokens = 0
            
            sse_events = 0
            has_hidden_reasoning_delta = False
            final_usage = None
            finish_reason = None
            system_fingerprint = None
            
            for chunk in response_stream:
                sse_events += 1
                if getattr(chunk, "usage", None):
                    final_usage = chunk.usage
                    usage_tokens = chunk.usage.total_tokens
                if getattr(chunk, "system_fingerprint", None):
                    system_fingerprint = chunk.system_fingerprint
                
                if not chunk.choices:
                    continue
                    
                choice = chunk.choices[0]
                if getattr(choice, "finish_reason", None):
                    finish_reason = choice.finish_reason
                    
                delta = choice.delta
                has_content = delta.content or getattr(delta, "reasoning", None) or getattr(delta, "reasoning_content", None)
                if getattr(delta, "reasoning", None) or getattr(delta, "reasoning_content", None):
                    has_hidden_reasoning_delta = True
                
                if ttft is None and has_content:
                    ttft = time.time() - start_time
                    
                chunk_text = ""
                if delta.content:
                    chunk_text = delta.content
                    
                # Track presence of reasoning tokens for diagnostic reporting
                if getattr(delta, "reasoning", None) or getattr(delta, "reasoning_content", None):
                    has_hidden_reasoning_delta = True
                    
                if chunk_text:
                    content_chunks.append(chunk_text)
                    if token_callback:
                        try:
                            token_callback(chunk_text)
                        except Exception as cb_err:
                            logger.warning("Error in token_callback: %s", cb_err)

            content = "".join(content_chunks)
            elapsed_time = time.time() - start_time
            _global_total_time += elapsed_time

            # Fallback heuristic for token estimation
            if usage_tokens == 0:
                usage_tokens = (len(system_prompt) + len(user_prompt) + len(content)) // 4
                
            _global_tokens_used += usage_tokens

            # Record active pipeline stage metrics
            from app.metrics import get_active_metrics
            metrics = get_active_metrics()
            if metrics:
                metrics.record_llm_call(usage_tokens, elapsed_time, attempt, ttft)

            # Record diagnostic report if enabled
            from app.config import LLM_DIAGNOSTICS
            if LLM_DIAGNOSTICS:
                usage_details = {}
                if final_usage:
                    usage_details["prompt_tokens"] = getattr(final_usage, "prompt_tokens", 0)
                    usage_details["completion_tokens"] = getattr(final_usage, "completion_tokens", 0)
                    usage_details["total_tokens"] = getattr(final_usage, "total_tokens", 0)
                    
                    ctd = getattr(final_usage, "completion_tokens_details", None)
                    if ctd:
                        usage_details["reasoning_tokens"] = getattr(ctd, "reasoning_tokens", 0)
                        usage_details["accepted_prediction_tokens"] = getattr(ctd, "accepted_prediction_tokens", 0)
                        usage_details["rejected_prediction_tokens"] = getattr(ctd, "rejected_prediction_tokens", 0)
                    else:
                        # Fallback try dict mapping if it's a dict
                        ctd_dict = getattr(final_usage, "completion_tokens_details", {}) if isinstance(getattr(final_usage, "completion_tokens_details", None), dict) else {}
                        usage_details["reasoning_tokens"] = ctd_dict.get("reasoning_tokens", 0)
                        usage_details["accepted_prediction_tokens"] = ctd_dict.get("accepted_prediction_tokens", 0)
                        usage_details["rejected_prediction_tokens"] = ctd_dict.get("rejected_prediction_tokens", 0)
                        
                    ptd = getattr(final_usage, "prompt_tokens_details", None)
                    if ptd:
                        usage_details["cached_tokens"] = getattr(ptd, "cached_tokens", 0)
                    else:
                        ptd_dict = getattr(final_usage, "prompt_tokens_details", {}) if isinstance(getattr(final_usage, "prompt_tokens_details", None), dict) else {}
                        usage_details["cached_tokens"] = ptd_dict.get("cached_tokens", 0)
                else:
                    usage_details = {
                        "prompt_tokens": len(system_prompt) // 4,
                        "completion_tokens": len(content) // 4,
                        "total_tokens": (len(system_prompt) + len(content)) // 4,
                        "reasoning_tokens": 0,
                        "cached_tokens": 0,
                        "accepted_prediction_tokens": 0,
                        "rejected_prediction_tokens": 0
                    }
                
                has_hidden_think_tags = bool(re.search(r"<think>|<analysis>", content, re.IGNORECASE))
                approx_tokens = len(content.split()) * 1.3
                
                diagnostic_run = {
                    "provider": model_profile.provider,
                    "model": model_name,
                    "json_mode": json_mode,
                    "streaming": True,
                    "ttft": ttft,
                    "total_time": elapsed_time,
                    "sse_events": sse_events,
                    "approx_completion_tokens": approx_tokens,
                    "usage_prompt_tokens": usage_details.get("prompt_tokens", 0),
                    "usage_completion_tokens": usage_details.get("completion_tokens", 0),
                    "usage_total_tokens": usage_details.get("total_tokens", 0),
                    "usage_reasoning_tokens": usage_details.get("reasoning_tokens", 0),
                    "usage_cached_tokens": usage_details.get("cached_tokens", 0),
                    "usage_accepted_prediction_tokens": usage_details.get("accepted_prediction_tokens", 0),
                    "usage_rejected_prediction_tokens": usage_details.get("rejected_prediction_tokens", 0),
                    "finish_reason": finish_reason,
                    "system_fingerprint": system_fingerprint,
                    "has_hidden_reasoning_delta": has_hidden_reasoning_delta,
                    "has_hidden_think_tags": has_hidden_think_tags,
                }
                _last_llm_diagnostics.append(diagnostic_run)
                
                logger.info(
                    "[LLM_DIAGNOSTICS] Model: %s, TTFT: %.2f s, Time: %.2f s, SSE Events: %d, Generated Tokens: %d, Reasoning Tokens: %d, Think Tags: %s",
                    model_name, ttft, elapsed_time, sse_events, usage_details.get("completion_tokens", 0), 
                    usage_details.get("reasoning_tokens", 0), has_hidden_think_tags
                )

            # Enforce post-LLM performance budget check using visible completion tokens only (excluding hidden reasoning tokens)
            completion_tokens_val = getattr(final_usage, "completion_tokens", 0) if final_usage else len(content) // 4
            reasoning_tokens_val = 0
            if final_usage:
                ctd = getattr(final_usage, "completion_tokens_details", None)
                if ctd:
                    reasoning_tokens_val = getattr(ctd, "reasoning_tokens", 0)
                elif isinstance(getattr(final_usage, "completion_tokens_details", None), dict):
                    reasoning_tokens_val = getattr(final_usage, "completion_tokens_details", {}).get("reasoning_tokens", 0)
            
            visible_completion_tokens = max(0, completion_tokens_val - reasoning_tokens_val)
            check_budget_post_llm(visible_completion_tokens, elapsed_time, model_name)

            # Extract content natively
            # Check for provider-specific reasoning fields
            if not content:
                raise RuntimeError("Unexpected LLM call failure: LLM returned empty response.")
                
            # Strip reasoning tags if model profile indicates it's a reasoning model
            if model_profile.reasoning:
                content = strip_reasoning_tags(content)

            return content.strip()

        except openai.RateLimitError as e:
            if attempt == 0:
                logger.warning("Rate limit hit, retrying after delay: %s", e)
                time.sleep(2)
                continue
            raise RuntimeError(f"Rate limit exceeded: {_sanitize_error(e)}") from e
        except openai.AuthenticationError as e:
            raise RuntimeError("LLM authentication failed. Check your API key.") from e
        except openai.APIError as e:
            if attempt == 0:
                logger.warning("Transient LLM error (attempt %d): %s", attempt + 1, e)
                time.sleep(1)
                continue
            raise RuntimeError(f"LLM API error: {_sanitize_error(e)}") from e
        except Exception as e:
            raise RuntimeError(f"Unexpected LLM call failure: {_sanitize_error(e)}") from e

    raise RuntimeError("LLM call failed unexpectedly.")


def call_llm_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.4,
    max_tokens: Optional[int] = 4000,
    timeout: Optional[float] = None,
    profile: str = "fast_generation",
) -> dict:
    """Call the LLM and parse the response as JSON.

    Cleans markdown fences, retries once with repair instruction on parse failure.
    """
    raw = call_llm(system_prompt, user_prompt, temperature, max_tokens, timeout, profile=profile, json_mode=True)
    cleaned = clean_json_response(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning("JSON parse failed on first attempt: %s. Raw: %s, Cleaned: %s", e, raw, cleaned)

    # Retry with repair instruction (disable json_mode on retry to avoid gateway empty-response bugs)
    repair_prompt = (
        "Your previous response was not valid JSON. "
        "Please return ONLY valid JSON with no markdown formatting, "
        "no code fences, and no additional text. "
        "Original request:\n\n" + user_prompt
    )
    raw_retry = call_llm(system_prompt, repair_prompt, temperature=0.2, max_tokens=max_tokens, timeout=timeout, profile=profile, json_mode=False)
    cleaned_retry = clean_json_response(raw_retry)

    try:
        return json.loads(cleaned_retry)
    except json.JSONDecodeError as e:
        logger.error("JSON parse failed on repair attempt: %s. Raw: %s, Cleaned: %s", e, raw_retry, cleaned_retry)
        raise RuntimeError(f"Failed to parse LLM JSON after repair: {e}") from e

import logging
import time
from app import config

logger = logging.getLogger(__name__)

class PerformanceBudgetError(RuntimeError):
    """Exception raised when a performance budget ceiling is exceeded in development."""
    pass

# Budgets configuration parameters (can also be loaded from config.py)
BUDGET_MAX_PROMPT_TOKENS = getattr(config, "BUDGET_MAX_PROMPT_TOKENS", 6000)
BUDGET_MAX_COMPLETION_TOKENS = getattr(config, "BUDGET_MAX_COMPLETION_TOKENS", 5000)
BUDGET_MAX_STAGE_LATENCY = getattr(config, "BUDGET_MAX_STAGE_LATENCY", 90.0)      # Max seconds per LLM call
BUDGET_MAX_PARSER_LATENCY = getattr(config, "BUDGET_MAX_PARSER_LATENCY", 5.0)      # Max seconds parsing JSON/markdown
BUDGET_MAX_PDF_LATENCY = getattr(config, "BUDGET_MAX_PDF_LATENCY", 10.0)          # Max seconds generating PDF

# Registry to collect budget warnings during execution
_budget_warnings = []

def reset_budget_warnings():
    """Reset the collected budget warnings."""
    global _budget_warnings
    _budget_warnings = []

def add_budget_warning(message: str):
    """Append a budget warning."""
    global _budget_warnings
    if message not in _budget_warnings:
        _budget_warnings.append(message)

def get_budget_warnings():
    """Retrieve all collected budget warnings."""
    global _budget_warnings
    return list(_budget_warnings)

def check_budget_pre_llm(system_prompt: str, user_prompt: str):
    """Check prompt token budget before calling the LLM (with 10% grace budget)."""
    approx_prompt_tokens = (len(system_prompt) + len(user_prompt)) // 4
    target = BUDGET_MAX_PROMPT_TOKENS
    
    if approx_prompt_tokens > target:
        overrun_pct = ((approx_prompt_tokens - target) / target) * 100
        if approx_prompt_tokens <= target * 1.10:
            # Under 10% overrun is a warning
            msg = f"Prompt Tokens: {approx_prompt_tokens} (Target: {target} | Warning: {overrun_pct:.1f}% over budget)"
            add_budget_warning(msg)
            logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)
        else:
            # Over 10% overrun is a hard failure
            msg = (f"Performance Budget Exceeded: Prompt token volume is approximately {approx_prompt_tokens} "
                   f"tokens, exceeding the budget limit of {target} tokens by {overrun_pct:.1f}% (grace limit exceeded).")
            if config.DEBUG:
                raise PerformanceBudgetError(msg)
            else:
                logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)

def check_budget_post_llm(completion_tokens: int, elapsed_time: float, model: str):
    """Check completion token budget and generation latency after calling the LLM (with 10% grace budget)."""
    # 1. Completion Tokens
    target_tokens = BUDGET_MAX_COMPLETION_TOKENS
    if completion_tokens > target_tokens:
        overrun_pct = ((completion_tokens - target_tokens) / target_tokens) * 100
        if completion_tokens <= target_tokens * 1.10:
            msg = f"Completion Tokens: {completion_tokens} (Target: {target_tokens} | Warning: {overrun_pct:.1f}% over budget)"
            add_budget_warning(msg)
            logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)
        else:
            msg = (f"Performance Budget Exceeded: Model '{model}' generated {completion_tokens} completion tokens, "
                   f"exceeding the budget limit of {target_tokens} tokens by {overrun_pct:.1f}% (grace limit exceeded).")
            if config.DEBUG:
                raise PerformanceBudgetError(msg)
            else:
                logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)

    # 2. Stage Latency
    target_latency = BUDGET_MAX_STAGE_LATENCY
    if elapsed_time > target_latency:
        overrun_pct = ((elapsed_time - target_latency) / target_latency) * 100
        if elapsed_time <= target_latency * 1.10:
            msg = f"Stage Latency: {elapsed_time:.2f}s (Target: {target_latency:.2f}s | Warning: {overrun_pct:.1f}% over budget)"
            add_budget_warning(msg)
            logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)
        else:
            msg = (f"Performance Budget Exceeded: LLM call for model '{model}' took {elapsed_time:.2f} seconds, "
                   f"exceeding the latency budget limit of {target_latency} seconds by {overrun_pct:.1f}% (grace limit exceeded).")
            if config.DEBUG:
                raise PerformanceBudgetError(msg)
            else:
                logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)

def check_budget_parser(elapsed_time: float):
    """Check content parsing duration budget (with 10% grace budget)."""
    target = BUDGET_MAX_PARSER_LATENCY
    if elapsed_time > target:
        overrun_pct = ((elapsed_time - target) / target) * 100
        if elapsed_time <= target * 1.10:
            msg = f"Parser Latency: {elapsed_time:.2f}s (Target: {target:.2f}s | Warning: {overrun_pct:.1f}% over budget)"
            add_budget_warning(msg)
            logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)
        else:
            msg = (f"Performance Budget Exceeded: Document content parsing took {elapsed_time:.2f} seconds, "
                   f"exceeding the parser budget limit of {target} seconds by {overrun_pct:.1f}% (grace limit exceeded).")
            if config.DEBUG:
                raise PerformanceBudgetError(msg)
            else:
                logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)

def check_budget_pdf(elapsed_time: float, format_ext: str):
    """Check document compilation/export duration budget (with 10% grace budget)."""
    target = BUDGET_MAX_PDF_LATENCY
    if elapsed_time > target:
        overrun_pct = ((elapsed_time - target) / target) * 100
        if elapsed_time <= target * 1.10:
            msg = f"Export Latency ({format_ext}): {elapsed_time:.2f}s (Target: {target:.2f}s | Warning: {overrun_pct:.1f}% over budget)"
            add_budget_warning(msg)
            logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)
        else:
            msg = (f"Performance Budget Exceeded: Document export ({format_ext}) took {elapsed_time:.2f} seconds, "
                   f"exceeding the export budget limit of {target} seconds by {overrun_pct:.1f}% (grace limit exceeded).")
            if config.DEBUG:
                raise PerformanceBudgetError(msg)
            else:
                logger.warning("[PERFORMANCE_BUDGET_WARNING] %s", msg)

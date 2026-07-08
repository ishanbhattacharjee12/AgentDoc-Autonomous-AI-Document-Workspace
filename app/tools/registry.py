"""Tool registry for controlled tool access.

Maintains the allowlist of tools available to the agent executor.
Unknown tools are safely routed to the analysis tool with logging.
"""

import logging
from typing import Callable

logger = logging.getLogger(__name__)

# Tool registry maps tool names to their execution functions
_registry: dict[str, Callable] = {}


def register_tool(name: str, func: Callable) -> None:
    """Register a tool in the allowlist."""
    _registry[name] = func
    logger.info("Registered tool: %s", name)


def get_tool(name: str) -> Callable:
    """Get a tool by name. Falls back to 'analysis' for unknown tools."""
    if name in _registry:
        return _registry[name]

    logger.warning("Unknown tool '%s' requested. Falling back to 'analysis'.", name)
    if "analysis" in _registry:
        return _registry["analysis"]

    raise RuntimeError(f"Tool '{name}' not found and fallback 'analysis' tool is not registered.")


def list_tools() -> list[str]:
    """List all registered tool names."""
    return list(_registry.keys())


def is_registered(name: str) -> bool:
    """Check if a tool is registered."""
    return name in _registry

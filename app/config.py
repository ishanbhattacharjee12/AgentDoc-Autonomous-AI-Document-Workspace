"""AgentDoc configuration module.

Loads environment variables and provides typed configuration.
"""

import logging
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
STATIC_DIR = BASE_DIR / "static"

# Ensure output directory exists
OUTPUT_DIR.mkdir(exist_ok=True)

# LLM Provider Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "zen")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "").strip()
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://opencode.ai/zen/v1")

# Validation
if not LLM_API_KEY:
    logging.warning("LLM_API_KEY is not set. Agent requests will fail in real execution mode.")
if not LLM_MODEL:
    logging.warning("LLM_MODEL is not set. Please set the LLM_MODEL environment variable (e.g., 'gpt-5.6-sol' or 'deepseek-v4-flash-free') before running real execution.")

# Limits
MAX_REQUEST_LENGTH = 2000
MAX_RETRIES = 1
REQUEST_TIMEOUT = 120

# Demo mode: enabled explicitly via env var, or auto-enabled if no API key
USE_DEMO_MODE = os.getenv("USE_DEMO_MODE", "").lower() in ("true", "1", "yes")
if not LLM_API_KEY:
    USE_DEMO_MODE = True
    logging.info("Demo mode auto-enabled: no LLM API key configured.")

# Active Model Selection
ACTIVE_MODEL = LLM_MODEL

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

# LLM Provider
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Validation
if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
    logging.warning("GROQ_API_KEY is not set. Agent requests will fail in Groq mode.")
elif LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
    logging.warning("OPENAI_API_KEY is not set. Agent requests will fail in OpenAI mode.")

# Limits
MAX_REQUEST_LENGTH = 2000
MAX_RETRIES = 1
REQUEST_TIMEOUT = 120

# Demo mode: enabled explicitly via env var, or auto-enabled if no API key
USE_DEMO_MODE = os.getenv("USE_DEMO_MODE", "").lower() in ("true", "1", "yes")
if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
    USE_DEMO_MODE = True
    logging.info("Demo mode auto-enabled: no Groq API key configured.")
elif LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
    USE_DEMO_MODE = True
    logging.info("Demo mode auto-enabled: no OpenAI API key configured.")

# Active Model Selection
ACTIVE_MODEL = GROQ_MODEL if LLM_PROVIDER == "groq" else OPENAI_MODEL

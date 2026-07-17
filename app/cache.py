"""Hash-based request caching system with file persistence and TTL support."""

import os
import json
import hashlib
import time
import logging
from typing import Optional
from app.models import AgentResponse

logger = logging.getLogger(__name__)

# Cache directory located inside the app package
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")
DEFAULT_TTL = 3600  # 1 hour in seconds


def get_cache_key(request: str, format: str, mode: str, model: str) -> str:
    """Generate a unique SHA-256 hash key based on the request configuration."""
    data = f"{request.strip()}|{format.strip()}|{mode.strip()}|{model.strip()}"
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def get_cached_response(key: str) -> Optional[AgentResponse]:
    """Retrieve a cached response if it exists and has not expired."""
    from app.config import ENABLE_CACHE
    if not ENABLE_CACHE:
        logger.info("Caching is disabled via config (ENABLE_CACHE=False). Bypassing cache lookup.")
        return None

    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_path = os.path.join(CACHE_DIR, f"{key}.json")
    
    if not os.path.exists(cache_path):
        return None
        
    try:
        with open(cache_path, "r") as f:
            data = json.load(f)
            
        timestamp = data.get("timestamp", 0)
        ttl = data.get("ttl", DEFAULT_TTL)
        
        # Check if expired
        if time.time() - timestamp > ttl:
            logger.info("Cache hit but expired for key: %s", key)
            os.remove(cache_path)
            return None
            
        logger.info("Cache hit and valid for key: %s", key)
        resp = AgentResponse(**data["response"])
        resp.cache_timestamp = timestamp
        resp.cache_age = round(time.time() - timestamp, 1)
        resp.cache_key = key
        return resp
    except Exception as e:
        logger.warning("Failed to read cache file: %s", e)
        return None


def set_cached_response(key: str, response: AgentResponse, ttl: int = DEFAULT_TTL) -> None:
    """Store a response in the file-based cache with a timestamp."""
    from app.config import ENABLE_CACHE
    if not ENABLE_CACHE:
        return

    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_path = os.path.join(CACHE_DIR, f"{key}.json")
    
    try:
        # Don't cache failed runs
        if response.status == "failed":
            return
            
        data = {
            "timestamp": time.time(),
            "ttl": ttl,
            "response": response.model_dump()
        }
        
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)
        logger.info("Response cached successfully for key: %s", key)
    except Exception as e:
        logger.warning("Failed to write to cache: %s", e)

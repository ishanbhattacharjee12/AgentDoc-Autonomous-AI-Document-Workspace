"""Pipeline metrics tracking system, including stage timings and TTFT."""

import time
import contextvars
from typing import Dict, Any, Optional, List

# Context variable to track the current active pipeline stage
_current_stage = contextvars.ContextVar("current_stage", default="idle")

class PipelineMetrics:
    def __init__(self):
        self.start_time = time.time()
        self.total_time: float = 0.0
        self.ttfts: List[float] = []
        self.stages: Dict[str, Dict[str, Any]] = {
            "planning": {"time": 0.0, "tokens": 0, "calls": 0, "retries": 0, "ttft": 0.0},
            "execution": {"time": 0.0, "tokens": 0, "calls": 0, "retries": 0, "ttft": 0.0},
            "synthesis": {"time": 0.0, "tokens": 0, "calls": 0, "retries": 0, "ttft": 0.0},
            "reflection": {"time": 0.0, "tokens": 0, "calls": 0, "retries": 0, "ttft": 0.0},
            "generation": {"time": 0.0, "tokens": 0, "calls": 0, "retries": 0, "ttft": 0.0},
        }

    def start_stage(self, stage: str):
        if stage in self.stages:
            self.stages[stage]["start_time"] = time.time()
            _current_stage.set(stage)
            import json
            import logging
            logging.getLogger("app.metrics").info(json.dumps({
                "log_type": "stage_instrumentation",
                "stage": stage,
                "action": "start",
                "timestamp": time.time()
            }))
            from app.config import DEBUG_TIMING
            if DEBUG_TIMING:
                name_map = {
                    "planning": "Planner",
                    "execution": "Executor",
                    "synthesis": "Synthesizer",
                    "reflection": "Reflection",
                    "generation": "Document generation"
                }
                logger_name = name_map.get(stage, stage.title())
                logging.getLogger("app.metrics").info("[INSTRUMENTATION] %s start: timestamp=%f", logger_name, time.time())

    def end_stage(self, stage: str):
        if stage in self.stages and "start_time" in self.stages[stage]:
            elapsed = time.time() - self.stages[stage]["start_time"]
            self.stages[stage]["time"] += elapsed
            del self.stages[stage]["start_time"]
            _current_stage.set("idle")
            import json
            import logging
            logging.getLogger("app.metrics").info(json.dumps({
                "log_type": "stage_instrumentation",
                "stage": stage,
                "action": "end",
                "timestamp": time.time(),
                "duration_ms": round(elapsed * 1000.0, 2)
            }))
            from app.config import DEBUG_TIMING
            if DEBUG_TIMING:
                name_map = {
                    "planning": "Planner",
                    "execution": "Executor",
                    "synthesis": "Synthesizer",
                    "reflection": "Reflection",
                    "generation": "Document generation"
                }
                logger_name = name_map.get(stage, stage.title())
                logging.getLogger("app.metrics").info("[INSTRUMENTATION] %s end: timestamp=%f", logger_name, time.time())

    def record_llm_call(self, tokens: int, elapsed_time: float, retry_count: int = 0, ttft: Optional[float] = None):
        stage = _current_stage.get()
        if stage in self.stages:
            self.stages[stage]["tokens"] += tokens
            self.stages[stage]["calls"] += 1
            self.stages[stage]["retries"] += retry_count
            if ttft is not None:
                self.ttfts.append(ttft)
                # Store the most recent TTFT or average for the stage
                self.stages[stage]["ttft"] = ttft

    def finalize(self) -> float:
        self.total_time = time.time() - self.start_time
        import json
        import logging
        logging.getLogger("app.metrics").info(json.dumps({
            "log_type": "pipeline_finalization",
            "total_time_ms": round(self.total_time * 1000.0, 2),
            "timestamp": time.time()
        }))
        from app.config import DEBUG_TIMING
        if DEBUG_TIMING:
            logging.getLogger("app.metrics").info("[INSTRUMENTATION] Metrics finalization: timestamp=%f", time.time())
        return self.total_time

    def to_dict(self) -> Dict[str, Any]:
        avg_ttft = sum(self.ttfts) / len(self.ttfts) if self.ttfts else 0.0
        return {
            "total_time": round(self.total_time, 2),
            "avg_ttft": round(avg_ttft, 3),
            "stages": {
                name: {k: round(v, 3) if isinstance(v, float) else v for k, v in metrics.items() if k != "start_time"}
                for name, metrics in self.stages.items()
            }
        }

# Global context-local metrics instance to track active pipeline run
_active_metrics = contextvars.ContextVar("active_metrics", default=None)

def get_active_metrics() -> Optional[PipelineMetrics]:
    return _active_metrics.get()

def set_active_metrics(metrics: Optional[PipelineMetrics]):
    _active_metrics.set(metrics)

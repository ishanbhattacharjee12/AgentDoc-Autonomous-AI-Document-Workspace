#!/usr/bin/env python
"""AgentDoc Canonical Performance Validation & Benchmarking Tool.

Runs representative workloads, measures latency/tokens/quality metrics,
compares results against baseline to identify regressions, and saves trends.
"""

import os
import sys
import time
import json
import argparse
import subprocess
from datetime import datetime
script_dir = os.path.dirname(os.path.abspath(__file__))

# Ensure dotenv is loaded from the correct location
load_dotenv(os.path.join(script_dir, ".env"))

from app.agent.orchestrator import run_agent
from app.llm.client import get_last_llm_diagnostics, reset_llm_diagnostics
from app import config

HISTORY_FILE = os.path.join(script_dir, "app/outputs/benchmark_history.json")

def get_git_commit():
    try:
        commit = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], 
                                         cwd=script_dir).decode("utf-8").strip()
        return commit
    except Exception:
        return "unknown"

def run_workload(name: str, prompt: str, ignore_cache: bool):
    reset_llm_diagnostics()
    
    start_time = time.time()
    success = True
    error_msg = ""
    
    # Track metrics
    llm_calls_before = 0
    
    try:
        response = run_agent(
            request=prompt,
            progress_cb=None,
            require_review=False,
            format="docx",
            mode="standard",
            ignore_cache=ignore_cache
        )
        if response.status != "completed":
            success = False
            error_msg = f"Pipeline returned incomplete status: {response.status}"
    except Exception as e:
        success = False
        error_msg = str(e)
        
    elapsed = time.time() - start_time
    diagnostics = get_last_llm_diagnostics()
    
    # Default metric structure
    metrics = {
        "success": success,
        "latency": elapsed,
        "error": error_msg,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "reasoning_tokens": 0,
        "cached_tokens": 0,
        "total_tokens": 0,
        "ttft": 0.0,
        "sse_events": 0,
        "finish_reason": "unknown",
        "system_fingerprint": None,
        "has_hidden_reasoning": False,
        "llm_calls": 0,
        "reflection_executed": False,
        "retry_count": 0,
        "markdown_valid": success,
        "pdf_valid": success,
        "output_file_size": 0
    }
    
    if diagnostics:
        metrics["llm_calls"] = len(diagnostics)
        # Use details from last call
        diag = diagnostics[-1]
        metrics["prompt_tokens"] = diag.get("usage_prompt_tokens", 0)
        metrics["completion_tokens"] = diag.get("usage_completion_tokens", 0)
        metrics["reasoning_tokens"] = diag.get("usage_reasoning_tokens", 0)
        metrics["cached_tokens"] = diag.get("usage_cached_tokens", 0)
        metrics["total_tokens"] = diag.get("usage_total_tokens", 0)
        metrics["ttft"] = diag.get("ttft", 0.0)
        metrics["sse_events"] = diag.get("sse_events", 0)
        metrics["finish_reason"] = diag.get("finish_reason", "stop")
        metrics["system_fingerprint"] = diag.get("system_fingerprint")
        metrics["has_hidden_reasoning"] = diag.get("has_hidden_reasoning_delta", False) or (metrics["reasoning_tokens"] > 0)
        
        # Determine if reflection ran
        # If diagnostics has multiple calls, reflection or retries ran
        if len(diagnostics) > 1:
            metrics["reflection_executed"] = True
            metrics["retry_count"] = len(diagnostics) - 1

    # Check generated document size if successful
    if success:
        output_dir = os.path.join(script_dir, "app/outputs")
        try:
            files = os.listdir(output_dir)
            if files:
                files.sort(key=lambda x: os.path.getmtime(os.path.join(output_dir, x)))
                latest_path = os.path.join(output_dir, files[-1])
                metrics["output_file_size"] = os.path.getsize(latest_path)
        except Exception:
            pass
            
    return metrics

def run_benchmark():
    workloads = {
        "Customer Onboarding": (
            "We need to improve customer onboarding because users are dropping off. "
            "Create a practical improvement plan that can be presented to leadership."
        ),
        "Tech Stack Migration": (
            "Design a tech stack migration plan for moving a legacy Django application to FastAPI. "
            "Outline timeline, stages, tasks, risks, and assumptions."
        )
    }
    
    # Configure diagnostics and disable caching to measure steady-state provider
    config.LLM_DIAGNOSTICS = True
    config.ENABLE_CACHE = False
    
    # Gather environment metadata
    from app.llm.registry import get_model_profile
    model_profile = get_model_profile(config.ACTIVE_MODEL if config.ACTIVE_MODEL else "hy3-free")
    
    run_meta = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "git_commit": get_git_commit(),
        "provider": model_profile.provider,
        "active_model": config.ACTIVE_MODEL if config.ACTIVE_MODEL else "hy3-free",
        "pipeline_mode": "standard",
        "export_format": "docx",
        "cache_enabled": config.ENABLE_CACHE,
        "diagnostics_enabled": config.LLM_DIAGNOSTICS
    }
    
    print("=" * 80)
    print(f"STARTING BENCHMARK RUN: {run_meta['timestamp']}")
    print(f"Model: {run_meta['active_model']} | Provider: {run_meta['provider']} | Git: {run_meta['git_commit']}")
    print("=" * 80)
    
    run_results = {}
    
    for name, prompt in workloads.items():
        print(f"\nWorkload: {name}")
        
        # Cold execution (first run, ignore_cache=True)
        print("  -> Running Cold Loop (Fresh execution)...")
        cold_metrics = run_workload(name, prompt, ignore_cache=True)
        print(f"     Latency: {cold_metrics['latency']:.2f}s | Success: {cold_metrics['success']}")
        
        # Warm execution (repeat execution to check warm TCP socket connection)
        print("  -> Running Warm Loop (Connection reuse)...")
        warm_metrics = run_workload(name, prompt, ignore_cache=True)
        print(f"     Latency: {warm_metrics['latency']:.2f}s | Success: {warm_metrics['success']}")
        
        run_results[name] = {
            "cold": cold_metrics,
            "warm": warm_metrics
        }
        
    full_run = {
        "metadata": run_meta,
        "workloads": run_results
    }
    
    # Append to history file
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except Exception:
            pass
            
    history.append(full_run)
    
    # Ensure outputs directory exists
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)
        
    print(f"\nBenchmark completed successfully! Run saved to history registry: {HISTORY_FILE}")
    return full_run

from statistics import median

def calculate_health_score(run):
    score = 100
    details = []
    
    for name, data in run["workloads"].items():
        for loop in ["cold", "warm"]:
            metrics = data[loop]
            if not metrics["success"]:
                score -= 30
                details.append(f"-30: Workload '{name}' ({loop}) failed.")
            else:
                if metrics["latency"] > 60:
                    score -= 5
                    details.append(f"-5: Workload '{name}' ({loop}) latency > 60s ({metrics['latency']:.2f}s).")
                if metrics["retry_count"] > 0:
                    deduction = metrics["retry_count"] * 5
                    score -= deduction
                    details.append(f"-{deduction}: Workload '{name}' ({loop}) had {metrics['retry_count']} retries.")
                    
    score = max(0, score)
    
    if score >= 90:
        grade = "A (Excellent)"
    elif score >= 80:
        grade = "B (Good)"
    elif score >= 70:
        grade = "C (Satisfactory)"
    else:
        grade = "F (Failing/Critical Regression)"
        
    return score, grade, details

def check_regression(current_run, history):
    if not history or len(history) < 2:
        print("\n[INFO] No prior history found for regression comparison.")
        return
        
    # Get last up to 5 successful runs as our rolling baseline registry
    successful_runs = []
    for run in reversed(history[:-1]): # Exclude current run (which is already appended)
        # Check if all workloads in the run succeeded
        all_passed = True
        for w_data in run["workloads"].values():
            if not w_data["cold"]["success"] or not w_data["warm"]["success"]:
                all_passed = False
                break
        if all_passed:
            successful_runs.append(run)
            if len(successful_runs) == 5:
                break
                
    if not successful_runs:
        # Fallback to the immediately previous run if no fully successful runs found
        successful_runs = [history[-2]]
        
    print("\n" + "=" * 80)
    print(f"REGRESSION DETECTION REPORT (Rolling Baseline: Median of last {len(successful_runs)} runs)")
    print("=" * 80)
    
    has_regressions = False
    
    for name in current_run["workloads"]:
        print(f"\nWorkload: {name}")
        
        # Compare Cold and Warm runs
        curr_cold = current_run["workloads"][name]["cold"]
        curr_warm = current_run["workloads"][name]["warm"]
        
        for run_type, curr in [("Cold", curr_cold), ("Warm", curr_warm)]:
            print(f"  [{run_type} Run]:")
            
            # Compute rolling medians for latency, total_tokens, and retry_count
            latencies = []
            tokens = []
            retries = []
            
            for run in successful_runs:
                if name in run["workloads"]:
                    latencies.append(run["workloads"][name][run_type.lower()]["latency"])
                    tokens.append(run["workloads"][name][run_type.lower()]["total_tokens"])
                    retries.append(run["workloads"][name][run_type.lower()]["retry_count"])
                    
            if not latencies:
                continue
                
            prev_latency = median(latencies)
            prev_tokens = median(tokens)
            prev_retry = median(retries)
            
            # 1. Success Rate
            if not curr["success"]:
                print(f"    - REGRESSED: Workload execution failed!")
                has_regressions = True
                continue
            
            # 2. Latency (> 20% increase)
            lat_pct = ((curr["latency"] - prev_latency) / prev_latency) * 100 if prev_latency > 0 else 0
            if lat_pct > 20:
                print(f"    - REGRESSED: Latency increased by {lat_pct:.1f}% against median baseline! (Current: {curr['latency']:.2f}s, Baseline Median: {prev_latency:.2f}s)")
                has_regressions = True
            elif lat_pct < -20:
                print(f"    - IMPROVED: Latency decreased by {abs(lat_pct):.1f}% against median baseline! (Current: {curr['latency']:.2f}s, Baseline Median: {prev_latency:.2f}s)")
            else:
                print(f"    - UNCHANGED: Latency delta is within threshold bounds ({lat_pct:+.1f}%)")
                
            # 3. Token usage (> 500 tokens diff)
            tok_diff = curr["total_tokens"] - prev_tokens
            if tok_diff > 500:
                print(f"    - REGRESSED: Token usage increased significantly! (Current: {curr['total_tokens']}, Baseline Median: {prev_tokens:.0f} | Diff: +{tok_diff:.0f})")
                has_regressions = True
            elif tok_diff < -500:
                print(f"    - IMPROVED: Token usage decreased! (Current: {curr['total_tokens']}, Baseline Median: {prev_tokens:.0f} | Diff: {tok_diff:.0f})")
                
            # 4. Retry / Reflection changes
            if curr["retry_count"] > prev_retry:
                print(f"    - REGRESSED: Retry count grew! (Current: {curr['retry_count']}, Baseline Median: {prev_retry:.0f})")
                has_regressions = True

    if not has_regressions:
        print("\n[SUCCESS] No performance regressions detected! Overall system performance is stable or improved.")
    else:
        print("\n[WARNING] Performance regressions detected! Please review the explainability logs above.")

def print_markdown_table(run):
    print("\n" + "=" * 80)
    print("BENCHMARK EXECUTIVE SUMMARY")
    print("=" * 80)
    
    score, grade, details = calculate_health_score(run)
    print(f"System Health score: {score} | System Health Grade: {grade}")
    if details:
        print("Deduction details:")
        for det in details:
            print(f"  {det}")
            
    print()
    headers = ["Workload", "Loop", "Status", "Latency (s)", "TTFT (s)", "Completion Tok", "Reasoning Tok", "SSE Events", "File Size (KB)"]
    print("| " + " | ".join(headers) + " |")
    print("| " + " | ".join(["---"] * len(headers)) + " |")
    
    for name, data in run["workloads"].items():
        for loop in ["cold", "warm"]:
            metrics = data[loop]
            row = [
                name,
                loop.capitalize(),
                "PASS" if metrics["success"] else "FAIL",
                f"{metrics['latency']:.2f}",
                f"{metrics['ttft']:.2f}",
                str(metrics["completion_tokens"]),
                str(metrics["reasoning_tokens"]),
                str(metrics["sse_events"]),
                f"{metrics['output_file_size'] / 1024:.1f}"
            ]
            print("| " + " | ".join(row) + " |")

def main():
    parser = argparse.ArgumentParser(description="AgentDoc Benchmarking Harness.")
    parser.add_argument("--runs", type=int, default=1, help="Number of benchmark runs (defaults to 1 cold + 1 warm).")
    parser.add_argument("--compare", action="store_true", help="Compare current benchmark against prior run.")
    parser.add_argument("--json-output", type=str, default="", help="Path to write structured JSON output.")
    
    args = parser.parse_args()
    
    # Read history to get previous baseline
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except Exception:
            pass
            
    # Execute benchmark
    current_run = run_benchmark()
    
    # Print console output
    print_markdown_table(current_run)
    
    # Perform regression comparison
    if args.compare:
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
            except Exception:
                pass
        check_regression(current_run, history)
        
    # Export machine-readable JSON if requested
    if args.json_output:
        try:
            with open(args.json_output, "w") as f:
                json.dump(current_run, f, indent=2)
            print(f"\nExported machine-readable JSON: {args.json_output}")
        except Exception as e:
            print(f"Error exporting JSON: {e}")

if __name__ == "__main__":
    main()

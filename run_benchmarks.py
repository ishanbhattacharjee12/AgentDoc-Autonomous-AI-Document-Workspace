import time
import logging
from app.agent.orchestrator import run_agent

# Disable verbose logs for cleaner output
logging.getLogger("app").setLevel(logging.WARNING)

WORKLOADS = {
    "Project Plan": "Create a comprehensive project plan for launching a new mobile shopping application, including stages, milestones, and resource allocation.",
    "Technical Design Document": "Develop a technical design document for a distributed notification service that supports email and SMS channels with retry logic.",
    "Business Proposal": "Draft a business proposal to pitch our cloud migration and infrastructure modernization services to a retail client.",
    "Standard Operating Procedure (SOP)": "Write a standard operating procedure for handling customer security incidents, from identification to post-mortem analysis.",
    "Vendor Evaluation": "Prepare a vendor evaluation report comparing AWS, GCP, and Azure for hosting a high-throughput financial transactions processing service.",
    "Implementation Roadmap": "Design a phased 12-month implementation roadmap for transitioning our legacy monolith software architecture to microservices."
}

def run_benchmarks():
    print("=" * 80)
    print("STARTING WORKLOAD BENCHMARKS (STANDARD MODE)")
    print("=" * 80)
    
    results = {}
    
    for name, prompt in WORKLOADS.items():
        print(f"\nRunning workload: {name}...")
        start_time = time.time()
        
        # Run standard mode
        response = run_agent(prompt, mode="standard")
        total_time = time.time() - start_time
        
        metrics = response.stage_metrics or {}
        
        # Extract individual metric attributes
        avg_ttft = metrics.get("avg_ttft", 0.0)
        stages = metrics.get("stages", {})
        
        # Calculate sum of retries
        retries = sum(stage.get("retries", 0) for stage in stages.values())
        
        results[name] = {
            "total_time": round(total_time, 3),
            "avg_ttft": round(avg_ttft, 3),
            "calls": response.llm_call_count,
            "tokens": response.llm_tokens_used,
            "retries": retries,
            "filename": response.document_filename,
            "stages": {s: round(m.get("time", 0.0), 3) for s, m in stages.items()}
        }
        
        print(f"Finished {name} in {total_time:.3f}s. Calls: {response.llm_call_count}, Avg TTFT: {avg_ttft:.3f}s, Tokens: {response.llm_tokens_used}")
        
    print("\n" + "=" * 80)
    print("BENCHMARK REPORT SUMMARY")
    print("=" * 80)
    print(f"{'Workload Name':<30} | {'Time (s)':<8} | {'TTFT (s)':<8} | {'Calls':<5} | {'Tokens':<8} | {'Retries':<7} | {'Document File'}")
    print("-" * 110)
    for name, r in results.items():
        print(f"{name:<30} | {r['total_time']:<8.3f} | {r['avg_ttft']:<8.3f} | {r['calls']:<5} | {r['tokens']:<8} | {r['retries']:<7} | {r['filename']}")
        
    print("\nStage Timings detail:")
    for name, r in results.items():
        print(f"  {name}: {r['stages']}")

if __name__ == "__main__":
    run_benchmarks()

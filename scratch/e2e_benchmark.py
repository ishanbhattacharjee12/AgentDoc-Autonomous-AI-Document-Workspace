"""E2E Benchmark — Multi-document-type comparison for Standard Mode optimization.

Uses the synchronous /agent endpoint for reliable benchmarking.
Tests 3 representative document types:
1. Project Plan
2. Business Proposal
3. Improvement Plan / Report
"""
import requests
import json
import time
import sys

BASE = "http://127.0.0.1:8000"

DOCUMENT_TYPES = {
    "project_plan": (
        "Create a professional project plan for launching an AI-powered customer support chatbot "
        "for a mid-sized e-commerce company.\n\nInclude:\n- Executive Summary\n- Business Objectives\n"
        "- Scope (In Scope / Out of Scope)\n- Key Assumptions\n- Stakeholder Analysis\n"
        "- Team Roles & Responsibilities (RACI)\n- Implementation Timeline (12 weeks)\n"
        "- Technical Architecture Overview\n- Risk Assessment & Mitigation\n- Budget Considerations\n"
        "- Success Metrics (KPIs)\n- Deployment Strategy\n- Post-launch Monitoring\n- Next Steps\n\n"
        "Present the document in a consultant-style format suitable for senior leadership."
    ),
    "business_proposal": (
        "Create a professional business proposal for a SaaS analytics platform "
        "targeting mid-market retail companies.\n\nInclude:\n- Executive Summary\n"
        "- Market Opportunity\n- Value Proposition\n- Competitive Analysis\n"
        "- Product Overview\n- Revenue Model\n- Go-to-Market Strategy\n"
        "- Financial Projections\n- Risk Assessment\n- Implementation Timeline\n"
        "- Partnership Opportunities\n- Next Steps\n\n"
        "Present the document in a consultant-style format suitable for investors and board members."
    ),
    "improvement_plan": (
        "Create a professional improvement plan for reducing customer churn "
        "at a subscription-based fitness app.\n\nInclude:\n- Executive Summary\n"
        "- Current State Analysis\n- Root Cause Analysis\n"
        "- Improvement Objectives\n- Strategic Initiatives\n"
        "- Implementation Roadmap\n- Resource Requirements\n"
        "- Success Metrics & KPIs\n- Risk Assessment\n- Budget Overview\n"
        "- Monitoring & Reporting\n- Governance Structure\n- Next Steps\n\n"
        "Present the document in a consultant-style format suitable for the executive team."
    ),
}


def run_benchmark(doc_type: str, request_text: str) -> dict:
    """Run a single E2E benchmark for one document type."""
    print(f"\n{'='*60}")
    print(f"  Benchmarking: {doc_type}")
    print(f"{'='*60}")

    payload = {
        "request": request_text,
        "require_review": False,
        "format": "pdf",
        "mode": "standard",
        "ignore_cache": True,
    }

    start = time.time()
    resp = requests.post(f"{BASE}/agent", json=payload, timeout=300)
    total_time = time.time() - start
    
    if resp.status_code != 200:
        print(f"  ERROR: HTTP {resp.status_code}: {resp.text[:200]}")
        return {"doc_type": doc_type, "error": f"HTTP {resp.status_code}"}

    data = resp.json()
    
    exec_report = data.get("execution_report", {})
    perf = exec_report.get("performance", {})
    diagnostics = exec_report.get("diagnostics", [])

    # Aggregate diagnostics
    total_prompt = 0
    total_completion = 0
    total_reasoning = 0
    first_ttft = None
    llm_calls = len(diagnostics)
    for d in diagnostics:
        total_prompt += d.get("usage_prompt_tokens", 0)
        total_completion += d.get("usage_completion_tokens", 0)
        total_reasoning += d.get("usage_reasoning_tokens", 0)
        if first_ttft is None and d.get("ttft"):
            first_ttft = d["ttft"]

    # Get markdown length
    markdown = data.get("document_markdown", "")
    word_count = len(markdown.split()) if markdown else 0

    reflection = data.get("reflection")
    if not reflection:
        reflection_status = "Skipped (Heuristic Pass)"
    else:
        reflection_status = reflection.get("grade", "Unknown")

    routing = exec_report.get("pipeline_mode", "Unknown")
    
    stage_metrics = data.get("stage_metrics", {})
    exec_time = stage_metrics.get("stages", {}).get("execution", {}).get("time", 0)

    metrics = {
        "doc_type": doc_type,
        "total_time_s": round(total_time, 1),
        "exec_time_s": round(exec_time, 1) if exec_time else round(total_time, 1),
        "ttft_s": round(first_ttft, 2) if first_ttft else None,
        "prompt_tokens": total_prompt,
        "completion_tokens": total_completion,
        "reasoning_tokens": total_reasoning,
        "llm_calls": llm_calls,
        "reflection": reflection_status,
        "routing": routing,
        "word_count": word_count,
        "markdown_chars": len(markdown) if markdown else 0,
    }

    print(f"  Total Time:        {metrics['total_time_s']}s")
    print(f"  TTFT:              {metrics['ttft_s']}s")
    print(f"  Prompt Tokens:     {metrics['prompt_tokens']}")
    print(f"  Completion Tokens: {metrics['completion_tokens']}")
    print(f"  Reasoning Tokens:  {metrics['reasoning_tokens']}")
    print(f"  LLM Calls:         {metrics['llm_calls']}")
    print(f"  Reflection:        {metrics['reflection']}")
    print(f"  Routing:           {metrics['routing']}")
    print(f"  Word Count:        {metrics['word_count']}")

    # Save the markdown for quality comparison
    out_path = f"/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/scratch/benchmark_{doc_type}.md"
    with open(out_path, "w") as f:
        f.write(markdown or "")
    print(f"  Saved markdown to: {out_path}")

    return metrics


def main():
    print("="*60)
    print("  AgentDoc Standard Mode E2E Benchmark (Optimized)")
    print("  Testing 3 document types via /agent endpoint")
    print("="*60)

    # Health check
    try:
        r = requests.get(f"{BASE}/health", timeout=5)
        r.raise_for_status()
    except Exception as e:
        print(f"ERROR: Server not reachable at {BASE}: {e}")
        sys.exit(1)

    all_results = []
    for doc_type, request_text in DOCUMENT_TYPES.items():
        try:
            result = run_benchmark(doc_type, request_text)
            all_results.append(result)
        except Exception as e:
            print(f"  ERROR benchmarking {doc_type}: {e}")
            all_results.append({"doc_type": doc_type, "error": str(e)})

    # Summary table
    print(f"\n{'='*60}")
    print("  BENCHMARK SUMMARY")
    print(f"{'='*60}")
    print(f"{'Doc Type':<20} {'Total(s)':<10} {'TTFT(s)':<10} {'Prompt':<10} {'Compl':<10} {'Reason':<10} {'Words':<10} {'LLM':<6}")
    print("-" * 86)
    for r in all_results:
        if "error" in r:
            print(f"{r['doc_type']:<20} ERROR: {r['error']}")
            continue
        ttft_str = str(r.get('ttft_s', 'N/A'))
        print(f"{r['doc_type']:<20} {r['total_time_s']:<10} {ttft_str:<10} {r['prompt_tokens']:<10} {r['completion_tokens']:<10} {r['reasoning_tokens']:<10} {r['word_count']:<10} {r['llm_calls']:<6}")

    # Compute averages
    valid = [r for r in all_results if "error" not in r]
    if valid:
        avg_time = sum(r["total_time_s"] for r in valid) / len(valid)
        avg_completion = sum(r["completion_tokens"] for r in valid) / len(valid)
        avg_words = sum(r["word_count"] for r in valid) / len(valid)
        print("-" * 86)
        print(f"{'AVERAGE':<20} {round(avg_time, 1):<10} {'---':<10} {'---':<10} {round(avg_completion):<10} {'---':<10} {round(avg_words):<10} {'---':<6}")

    # Save raw results
    with open("/Users/ishanbhattacharjee/Desktop/AgentDoc_Project/scratch/benchmark_results.json", "w") as f:
        json.dump(all_results, f, indent=2)
    print("\nRaw results saved to scratch/benchmark_results.json")


if __name__ == "__main__":
    main()

import httpx
import json
import sys

def main():
    prompt = (
        "Create a professional project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company.\n\n"
        "Include:\n\n"
        "- Executive Summary\n"
        "- Business Objectives\n"
        "- Scope (In Scope / Out of Scope)\n"
        "- Key Assumptions\n"
        "- Stakeholder Analysis\n"
        "- Team Roles & Responsibilities (RACI)\n"
        "- Implementation Timeline (12 weeks)\n"
        "- Technical Architecture Overview\n"
        "- Risk Assessment & Mitigation\n"
        "- Budget Considerations\n"
        "- Success Metrics (KPIs)\n"
        "- Deployment Strategy\n"
        "- Post-launch Monitoring\n"
        "- Next Steps\n\n"
        "Present the document in a consultant-style format suitable for senior leadership."
    )
    
    # 1. Start the first step (Generate Plan with require_review=true)
    url_stream = "http://127.0.0.1:8000/agent/stream"
    params = {
        "request": prompt,
        "require_review": "true",
        "format": "pdf",
        "mode": "standard",
        "ignore_cache": "true"
    }
    
    print("Step 1: Requesting Plan...")
    response_data = None
    with httpx.stream("GET", url_stream, params=params, timeout=60.0) as r:
        print(f"Status Code: {r.status_code}")
        for line in r.iter_lines():
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:]
                try:
                    data = json.loads(data_str)
                    if data.get("type") == "result":
                        response_data = data.get("data")
                        print("Plan received!")
                        break
                except Exception as e:
                    print(f"Error parsing json: {e}")
                    
    if not response_data:
        print("Failed to get plan data.")
        sys.exit(1)
        
    print("\nResponse Data:")
    print(json.dumps(response_data, indent=2))
    
    # Map "plan" to "planner_output"
    planner_output = {
        "goal": response_data.get("goal"),
        "document_type": response_data.get("document_type"),
        "confidence": response_data.get("confidence"),
        "confidence_reason": response_data.get("confidence_reason"),
        "complexity": response_data.get("complexity"),
        "complexity_reason": response_data.get("complexity_reason"),
        "reading_time": response_data.get("reading_time"),
        "implementation_effort": response_data.get("implementation_effort"),
        "planning_summary": response_data.get("planning_summary"),
        "assumptions": response_data.get("assumptions"),
        "tasks": response_data.get("plan")
    }
    
    # 2. POST to resume execution
    url_execute = "http://127.0.0.1:8000/agent/execute/stream"
    body = {
        "request": prompt,
        "format": "pdf",
        "mode": "standard",
        "ignore_cache": True,
        "planner_output": planner_output
    }
    
    print("\nStep 2: Resuming Execution...")
    with httpx.stream("POST", url_execute, json=body, timeout=120.0) as r:
        print(f"Status Code: {r.status_code}")
        for line in r.iter_lines():
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:]
                try:
                    data = json.loads(data_str)
                    msg_type = data.get("type")
                    if msg_type == "progress":
                        print(f"\nProgress: {data.get('stage')}")
                    elif msg_type == "token":
                        sys.stdout.write(data.get("content", ""))
                        sys.stdout.flush()
                    elif msg_type == "result":
                        print("\n=== SUCCESS ===")
                        print(json.dumps(data.get("data"), indent=2))
                    elif msg_type == "error":
                        print(f"\n=== ERROR ===: {data.get('error')}")
                except Exception as ex:
                    print(f"\nError parsing JSON: {ex}. Raw line: {line}")

if __name__ == "__main__":
    main()

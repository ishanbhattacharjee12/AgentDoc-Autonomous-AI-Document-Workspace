from app.agent.planner import generate_plan
import logging
logging.basicConfig(level=logging.INFO)
print("Starting...")
plan = generate_plan("Create a project plan for an AI chatbot")
print(plan)

import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("====================================================")
    print("RUNNING RESULTS PAGE DIAGNOSTICS & VERIFICATION")
    print("====================================================")
    
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 950})
        page = await context.new_page()
        
        # 1. Navigating to Generate Page
        print("-> Navigating to Generate Page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # Click a Quick Start template to populate the prompt
        print("-> Selecting 'AI Chatbot Launch' Quick Start Template...")
        template_btn = page.locator("button:has-text('AI Chatbot Launch')")
        await template_btn.click()
        await asyncio.sleep(0.5)
        
        # Select Advanced Mode
        print("-> Selecting Advanced Mode...")
        await page.locator("button:has-text('Standard Mode')").first.click()
        await asyncio.sleep(0.5)
        await page.locator("[role='option']:has-text('Advanced Mode')").first.click()
        await asyncio.sleep(0.5)

        # Click Run Agent Pipeline
        print("-> Clicking Run Agent Pipeline...")
        run_btn = page.locator("button:has-text('Run Agent Pipeline')")
        await run_btn.click()
        
        # Wait for the status to become completed (waiting for the Insights tab trigger)
        print("-> Waiting for generation to complete (up to 120 seconds)...")
        exec_tab = page.locator("button:has-text('Execution')").first
        await exec_tab.wait_for(state="visible", timeout=120000)
        print("-> Generation completed! Waiting for layout transition...")
        await asyncio.sleep(2.0)
        
        # Locate by text content explicitly scoped to tabs container
        doc_tab = page.locator("button:has-text('Document')").first
        exec_tab = page.locator("button:has-text('Execution')").first
        ins_tab = page.locator("button:has-text('Insights')").first
        
        print(f"-> Document Tab trigger visible: {await doc_tab.is_visible()}")
        print(f"-> Execution Tab trigger visible: {await exec_tab.is_visible()}")
        print(f"-> Insights Tab trigger visible: {await ins_tab.is_visible()}")
        
        # 2. Check tab visibility and capture screenshots
        document_path = os.path.join(artifact_dir, "final_workspace_document.png")
        await page.screenshot(path=document_path)
        print(f"-> Captured Document Tab View (Default): {document_path}")
        
        # 3. Click Execution tab
        print("-> Clicking Execution Tab...")
        await exec_tab.first.click()
        await asyncio.sleep(1.0)
        
        execution_path = os.path.join(artifact_dir, "final_workspace_execution.png")
        await page.screenshot(path=execution_path)
        print(f"-> Captured Execution Tab View (Task #1 expanded): {execution_path}")
        
        # Accordion: click task 1 header to collapse it
        print("-> Clicking Task ID: #1 header to collapse it...")
        task1_trigger = page.locator("button:has-text('Task ID: #1')")
        await task1_trigger.click()
        await asyncio.sleep(0.5)
        
        execution_collapsed_path = os.path.join(artifact_dir, "final_workspace_execution_collapsed.png")
        await page.screenshot(path=execution_collapsed_path)
        print(f"-> Captured Execution Tab View (All collapsed): {execution_collapsed_path}")
        
        # Click Task ID: #2 to expand it
        print("-> Clicking Task ID: #2 header to expand it...")
        task2_trigger = page.locator("button:has-text('Task ID: #2')")
        await task2_trigger.click()
        await asyncio.sleep(0.5)
        
        execution_expanded2_path = os.path.join(artifact_dir, "final_workspace_execution_expanded.png")
        await page.screenshot(path=execution_expanded2_path)
        print(f"-> Captured Execution Tab View (Task #2 expanded): {execution_expanded2_path}")
        
        # 4. Click Insights tab
        print("-> Clicking Insights Tab...")
        await ins_tab.first.click()
        await asyncio.sleep(1.0)
        
        insights_path = os.path.join(artifact_dir, "final_workspace_insights.png")
        await page.screenshot(path=insights_path)
        print(f"-> Captured Insights Tab View: {insights_path}")
        
        print("====================================================")
        print("DIAGNOSTICS & VERIFICATION SUITE FINISHED!")
        print("====================================================")

if __name__ == '__main__':
    asyncio.run(main())

import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("Starting Playwright Insights Workspace State Capture...")
    
    # Target directory for artifacts
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        # Launch browser context
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 950})
        page = await context.new_page()
        
        # Navigate to generate page
        print("Navigating to Generate page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        # Fill prompt
        prompt_text = "Create a project plan for launching a new software product in a remote team context."
        print(f"Typing prompt: {prompt_text}")
        await page.fill("textarea[placeholder*='Describe the document']", prompt_text)
        
        # Click Run Agent Pipeline
        print("Clicking 'Run Agent Pipeline'...")
        await page.locator("button:has-text('Run Agent Pipeline')").click()
        
        # Wait for E2E stream to complete
        print("Waiting for generation process completion...")
        await page.wait_for_selector("text=Document Completed Successfully", timeout=45000)
        await asyncio.sleep(0.5)
        
        # Click on the 'Insights' tab trigger
        print("Clicking on 'Insights' tab trigger...")
        await page.locator("button:has-text('Insights')").click()
        await page.wait_for_selector("text=Planner Confidence")
        await asyncio.sleep(0.5)
        
        # 1. Capture full Insights Workspace
        insights_workspace_path = os.path.join(artifact_dir, "insights_workspace.png")
        await page.screenshot(path=insights_workspace_path)
        print(f"1. Insights workspace screenshot saved to: {insights_workspace_path}")
        
        # 2. Capture Confidence and Complexity cards section close-up
        confidence_path = os.path.join(artifact_dir, "insights_confidence.png")
        await page.locator("div.grid").first.screenshot(path=confidence_path)
        print(f"2. Confidence/Complexity section saved to: {confidence_path}")
        
        # 3. Capture Assumptions panel close-up
        assumptions_path = os.path.join(artifact_dir, "insights_assumptions.png")
        await page.locator("xpath=//div[@data-slot='card-title' and contains(., 'Assumptions')]/../..").first.screenshot(path=assumptions_path)
        print(f"3. Assumptions panel saved to: {assumptions_path}")
        
        # 4. Capture Routing & Execution Strategy card close-up
        strategy_path = os.path.join(artifact_dir, "insights_strategy.png")
        await page.locator("xpath=//div[@data-slot='card-title' and contains(., 'Strategy')]/../..").first.screenshot(path=strategy_path)
        print(f"4. Strategy summary card saved to: {strategy_path}")
        
        await browser.close()
        print("Insights Workspace capture script finished successfully!")

if __name__ == "__main__":
    asyncio.run(main())

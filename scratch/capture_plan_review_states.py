import asyncio
import sys
from playwright.async_api import async_playwright

async def main():
    print("Starting Playwright Plan Review State Capture...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1200, "height": 850})
        page = await context.new_page()
        
        # Navigate to generate page
        print("Navigating to: http://localhost:5173/generate")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        
        # Fill input prompt
        prompt = "Create a project plan for launching a new software product in a remote team context."
        print(f"Typing prompt: {prompt}")
        await page.locator("textarea").fill(prompt)
        
        # Enable 'Require Review'
        print("Enabling 'Require Review' switcher...")
        # Target the shadcn Switch component relative to label text
        switch_locator = page.locator("span:has-text('Require Review')").locator("xpath=../..").locator("[data-slot='switch']")
        await switch_locator.click()
        
        # Wait a moment, check switch state
        is_checked = await switch_locator.get_attribute("aria-checked")
        print(f"Switch requireReview state: {is_checked}")
        
        # Click Run Agent Pipeline
        print("Clicking 'Run Agent Pipeline'...")
        await page.locator("button:has-text('Run Agent Pipeline')").click()
        
        # 1. Wait for plan review layout
        print("Waiting for review stage components...")
        await page.wait_for_selector("[data-slot='card-title']", timeout=15000)
        await asyncio.sleep(0.5)
        
        # Snap 1: Initial Review State
        initial_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/review_initial.png"
        await page.screenshot(path=initial_path)
        print(f"1. Initial Review state saved to: {initial_path}")
        
        # 2. Edit a task
        print("Editing Step 2 task text inline...")
        first_input = page.locator("input[placeholder='Describe task instruction...']").nth(1)
        await first_input.click()
        # Select all and replace text
        await first_input.press("Meta+A")
        await first_input.press("Backspace")
        await first_input.fill("Custom engineering team stakeholder alignment and capacity assessment")
        await asyncio.sleep(0.5)
        
        # Snap 2: Editing a Task State
        editing_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/review_editing.png"
        await page.screenshot(path=editing_path)
        print(f"2. Editing task state saved to: {editing_path}")
        
        # 3. Add a task
        print("Clicking 'Add Execution Task Step'...")
        await page.locator("button:has-text('Add Execution Task Step')").click()
        await asyncio.sleep(0.5)
        
        # Fill input text for newly added task step
        last_input = page.locator("input[placeholder='Describe task instruction...']").last
        await last_input.click()
        await last_input.press("Meta+A")
        await last_input.press("Backspace")
        await last_input.fill("Analyze final compliance standards and secure operational clearance")
        await asyncio.sleep(0.5)
        
        # Snap 3: Adding a Task State
        adding_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/review_adding.png"
        await page.screenshot(path=adding_path)
        print(f"3. Adding task state saved to: {adding_path}")
        
        # 4. Delete a task step (e.g. Delete the 3rd task)
        print("Deleting task step 3...")
        await page.locator("button[aria-label='Delete Task']").nth(2).click()
        await asyncio.sleep(0.5)
        
        # Snap 4: Deleting a Task State
        deleting_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/review_deleting.png"
        await page.screenshot(path=deleting_path)
        print(f"4. Deleting task state saved to: {deleting_path}")
        
        # 5. Resume execution
        print("Clicking 'Resume Execution Stream'...")
        await page.locator("button:has-text('Resume Execution Stream')").click()
        await asyncio.sleep(0.8)
        
        # Snap 5: Resuming Execution State (displays progress screen after resumption)
        resuming_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/review_resuming.png"
        await page.screenshot(path=resuming_path)
        print(f"5. Resuming execution state saved to: {resuming_path}")
        
        # Wait for E2E stream to complete to verify the entire flow works on modified plan data
        print("Waiting for generation process completion...")
        await page.wait_for_selector("text=Document Completed Successfully", timeout=45000)
        print("E2E generation completed successfully with custom edited plan!")
        
        await browser.close()
        print("Plan Review capture script finished successfully!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())

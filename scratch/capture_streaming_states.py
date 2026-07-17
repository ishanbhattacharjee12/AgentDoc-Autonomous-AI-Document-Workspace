import asyncio
from playwright.async_api import async_playwright
import sys

async def main():
    print("Starting React Streaming Flow State Capturing (Real-Time fresh run)...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1200, 'height': 800}
        )
        page = await context.new_page()
        
        # Navigate to Generate Page
        url = "http://localhost:5173/generate"
        print(f"Navigating to: {url}")
        await page.goto(url, wait_until="load", timeout=15000)
        await asyncio.sleep(2)
        
        # Type the fresh prompt
        prompt_text = "Write a brief document detailing three practical tips for improving productivity in a remote engineering team."
        print(f"Typing prompt: {prompt_text}")
        await page.fill("#prompt-input", prompt_text)
        await asyncio.sleep(0.5)
        
        # Open Advanced Options
        print("Opening Advanced Options...")
        await page.click("text=Advanced Options & Diagnostics")
        await asyncio.sleep(1.0)
        
        # Enable Ignore Request Cache toggle
        print("Enabling 'Ignore Request Cache'...")
        await page.locator("span:has-text('Ignore Request Cache')").locator("xpath=../..").locator("[data-slot='switch']").click()
        await asyncio.sleep(0.5)
        
        # Submit the form
        print("Clicking 'Run Agent Pipeline'...")
        await page.click("button:has-text('Run Agent Pipeline')")
        
        # Wait for the stream view to load and show Stage Tracker
        print("Waiting for streaming view stage tracker...")
        await page.wait_for_selector("text=Pipeline Flow Status", timeout=5000)
        
        # 1. Capture Initial Streaming State immediately
        initial_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/streaming_initial.png"
        await page.screenshot(path=initial_path)
        print(f"1. Initial Streaming State saved to: {initial_path}")
        
        # 2. Wait 300ms to capture mid-generation (with parsed streaming text)
        await asyncio.sleep(0.3)
        mid_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/streaming_mid.png"
        await page.screenshot(path=mid_path)
        print(f"2. Mid-Generation State saved to: {mid_path}")
        
        # 3. Wait for final completion (up to 30 seconds)
        print("Waiting for generation process to complete...")
        try:
            # Wait for download button to appear
            await page.wait_for_selector("a:has-text('Download PDF')", timeout=45000)
            print("Generation completed successfully!")
            await asyncio.sleep(2)
            
            # 3. Completed State - Tab 1: Document (Default Preview)
            completed_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/workspace_document.png"
            await page.screenshot(path=completed_path)
            print(f"3. Document Workspace tab saved to: {completed_path}")
            
            # Click Tab 2: Execution
            print("Switching to Execution tab...")
            await page.locator("button:has-text('Execution')").click()
            await asyncio.sleep(0.5)
            
            execution_collapsed_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/workspace_execution_collapsed.png"
            await page.screenshot(path=execution_collapsed_path)
            print(f"4. Execution Workspace tab (collapsed logs) saved to: {execution_collapsed_path}")
            
            # Expand Collapsible Logs
            print("Expanding Execution Logs...")
            await page.locator("summary:has-text('System Execution Logs')").click()
            await asyncio.sleep(0.5)
            
            execution_expanded_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/workspace_execution_expanded.png"
            await page.screenshot(path=execution_expanded_path)
            print(f"5. Execution Workspace tab (expanded logs) saved to: {execution_expanded_path}")
            
            # Click Tab 3: Insights
            print("Switching to Insights tab...")
            await page.locator("button:has-text('Insights')").click()
            await asyncio.sleep(0.5)
            
            insights_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/workspace_insights.png"
            await page.screenshot(path=insights_path)
            print(f"6. Insights Workspace tab saved to: {insights_path}")
            
            # Save original output path for compatibility tests
            compat_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/streaming_completed.png"
            await page.screenshot(path=compat_path)
            
        except Exception as e:
            print(f"Failed waiting for completion: {e}")
            # Capture screenshot of failure state if any
            err_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/streaming_error_debug.png"
            await page.screenshot(path=err_path)
            print(f"Error screenshot saved to: {err_path}")
            await browser.close()
            sys.exit(1)
            
        await browser.close()
        print("\nStreaming capture completed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())

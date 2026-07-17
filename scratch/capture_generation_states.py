import asyncio
from playwright.async_api import async_playwright
import sys

async def main():
    print("Starting React Generation Flow State Capturing...")
    
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
        
        # 1. Capture Idle State
        idle_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/generate_idle.png"
        await page.screenshot(path=idle_path)
        print(f"1. Idle State screenshot saved to: {idle_path}")
        
        # 2. Click the 'Project Plan Chatbot' demo prompt button to fill prompt
        print("Clicking Demo prompt button...")
        demo_button = page.locator("button:has-text('Project Plan Chatbot')")
        await demo_button.click()
        await asyncio.sleep(1)
        
        # 3. Submit the form
        print("Clicking 'Run Agent Pipeline'...")
        submit_button = page.locator("button:has-text('Run Agent Pipeline')")
        await submit_button.click()
        
        # Wait 1.5 seconds to capture the loading/streaming state
        await asyncio.sleep(1.5)
        
        # 4. Capture Loading/Streaming State
        loading_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/generate_loading.png"
        await page.screenshot(path=loading_path)
        print(f"2. Loading State screenshot saved to: {loading_path}")
        
        # 5. Wait for compilation to complete (should be instant due to cache HIT, but let's wait up to 10 seconds)
        print("Waiting for generation process to complete...")
        try:
            # Wait for download button to appear
            await page.wait_for_selector("a:has-text('Download PDF')", timeout=15000)
            print("Generation completed successfully!")
            await asyncio.sleep(1.5)
            
            # 6. Capture Completed State
            completed_path = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/generate_completed.png"
            await page.screenshot(path=completed_path)
            print(f"3. Completed State screenshot saved to: {completed_path}")
            
        except Exception as e:
            print(f"Failed waiting for completion: {e}")
            await browser.close()
            sys.exit(1)
            
        await browser.close()
        print("\nFlow capture completed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())

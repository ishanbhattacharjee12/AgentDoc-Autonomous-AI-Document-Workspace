import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1200})
        page = await context.new_page()
        
        print("-> Navigating to Generate page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # Start a real generation run
        print("-> Typing prompt...")
        input_textarea = page.locator("textarea[placeholder*='Describe the document']")
        await input_textarea.fill("Write a document plan for launching an online bookstore.")
        
        # Click Run
        print("-> Triggering run to capture running status...")
        await page.locator("button:has-text('Run Agent Pipeline')").click()
        
        # Wait a tiny bit (2 seconds) so it's in the planning or executing phase
        await asyncio.sleep(2.0)
        
        # Capture the sidebar while running
        sidebar_el = page.locator("aside")
        running_path = os.path.join(artifact_dir, "sidebar_running.png")
        await sidebar_el.screenshot(path=running_path)
        print(f"-> Captured sidebar with running entry: {running_path}")
        
        # Wait for reviewer stage if active, or just end
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())

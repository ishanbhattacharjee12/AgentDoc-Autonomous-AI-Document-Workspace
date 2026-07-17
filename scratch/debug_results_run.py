import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 950})
        page = await context.new_page()
        
        print("-> Navigating to page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        
        print("-> Clicking AI Chatbot Launch template...")
        await page.locator("button:has-text('AI Chatbot Launch')").click()
        await asyncio.sleep(0.5)
        
        print("-> Clicking Run Agent Pipeline...")
        await page.locator("button:has-text('Run Agent Pipeline')").click()
        
        for i in range(7):
            await asyncio.sleep(5.0)
            path = os.path.join(artifact_dir, f"debug_results_run_{i*5}.png")
            await page.screenshot(path=path)
            print(f"-> Captured screenshot at {i*5}s: {path}")
            
            # Check if there is an error message visible on screen
            error_el = page.locator("h2:has-text('Error')")
            if await error_el.is_visible():
                print(f"-> Error state detected at {i*5}s!")
                err_text = await page.locator("p.text-muted-foreground").text_content()
                print(f"-> Error message text: {err_text}")
                break

if __name__ == '__main__':
    asyncio.run(main())

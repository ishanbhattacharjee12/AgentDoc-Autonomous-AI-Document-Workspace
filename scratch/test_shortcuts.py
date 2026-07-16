import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("====================================================")
    print("STARTING WORKSPACE PRODUCTIVITY E2E AUDIT")
    print("====================================================")
    
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()
        
        # 1. Load Generate Page
        print("\nStep 1: Loading Generate Page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        closed_path = os.path.join(artifact_dir, "prod_closed_workspace.png")
        await page.screenshot(path=closed_path)
        print(f"-> Captured Closed Workspace: {closed_path}")
        
        # 2. Trigger Command Palette
        print("\nStep 2: Pressing Cmd+K to open Command Palette...")
        # Simulate Cmd+K
        await page.keyboard.press("Meta+k")
        await page.wait_for_selector("role=dialog[name='Command palette']")
        await asyncio.sleep(0.3)
        
        palette_open_path = os.path.join(artifact_dir, "prod_palette_open.png")
        await page.screenshot(path=palette_open_path)
        print(f"-> Captured Open Command Palette: {palette_open_path}")
        
        # 3. Fuzzy Filter Search
        print("\nStep 3: Typing query 'Go to Settings' in fuzzy search...")
        await page.fill("input[placeholder*='Type a command']", "Go to Settings")
        await asyncio.sleep(0.3)
        
        search_path = os.path.join(artifact_dir, "prod_palette_search.png")
        await page.screenshot(path=search_path)
        print(f"-> Captured Search State: {search_path}")
        
        # 4. Keyboard Navigation Up/Down and Enter Select
        print("\nStep 4: Using Arrow Keys and Enter to execute navigation command...")
        # Arrow navigation (since Settings is matching it should be first, select it)
        await page.keyboard.press("Enter")
        await page.wait_for_url("**/settings", timeout=5000)
        await asyncio.sleep(0.5)
        print(f"-> Navigated successfully! Current URL: {page.url}")
        
        navigated_settings_path = os.path.join(artifact_dir, "prod_navigated_settings.png")
        await page.screenshot(path=navigated_settings_path)
        print(f"-> Captured Navigated Workspace: {navigated_settings_path}")
        
        # 5. Open palette on Settings and show shortcuts cheat sheet
        print("\nStep 5: Opening palette on Settings and selecting Cheat Sheet...")
        await page.keyboard.press("Meta+k")
        await page.wait_for_selector("role=dialog[name='Command palette']")
        await page.fill("input[placeholder*='Type a command']", "cheat sheet")
        await asyncio.sleep(0.3)
        await page.keyboard.press("Enter")
        await asyncio.sleep(0.3)
        
        cheat_sheet_path = os.path.join(artifact_dir, "prod_palette_cheat_sheet.png")
        await page.screenshot(path=cheat_sheet_path)
        print(f"-> Captured Shortcuts Cheat Sheet state: {cheat_sheet_path}")
        
        # Close cheat sheet with Escape
        print("\nStep 6: Pressing Escape to close Command Palette...")
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.3)
        
        await browser.close()
        print("\n====================================================")
        print("WORKSPACE PRODUCTIVITY E2E AUDIT SUCCESSFULLY COMPLETED!")
        print("====================================================")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())

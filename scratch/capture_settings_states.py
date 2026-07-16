import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("Starting Playwright Settings Workspace State Capture...")
    
    # Target directory for artifacts
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        # Launch browser context
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        # Navigate to settings page
        print("Navigating to Settings page...")
        await page.goto("http://localhost:5173/settings")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        # 1. Capture User Preferences section
        print("Capturing User Preferences section...")
        user_path = os.path.join(artifact_dir, "settings_user.png")
        await page.screenshot(path=user_path)
        print(f"1. User preferences saved to: {user_path}")
        
        # Select custom format & mode to verify they work
        print("Selecting default format as Word (.docx)...")
        # Find format dropdown trigger
        await page.locator("[data-slot='select-trigger']").first.click()
        await page.wait_for_selector("text=Word Document (.docx)")
        await page.locator("text=Word Document (.docx)").click()
        await asyncio.sleep(0.3)
        
        # Find always require plan review switch
        print("Toggling Always Require Plan Review switcher...")
        # Get first switch
        await page.locator("[data-slot='switch']").first.click()
        await asyncio.sleep(0.3)
        
        # 2. Capture Advanced Settings section
        print("Capturing Advanced Settings section...")
        advanced_path = os.path.join(artifact_dir, "settings_advanced.png")
        await page.screenshot(path=advanced_path)
        print(f"2. Advanced settings saved to: {advanced_path}")
        
        # Click Save Preferences
        print("Clicking Save Preferences...")
        await page.locator("button:has-text('Save Preferences')").click()
        await page.wait_for_selector("text=Changes saved successfully!")
        await asyncio.sleep(0.5)
        
        # Verify localStorage values
        settings_json = await page.evaluate("localStorage.getItem('agentdoc_user_settings')")
        print(f"localStorage serialized settings value: {settings_json}")
        
        # 3. Capture Responsive Mobile Layout
        print("Changing viewport to mobile dimensions...")
        # Open in a mobile sized page
        mobile_context = await browser.new_context(
            viewport={"width": 375, "height": 812},
            is_mobile=True,
            has_touch=True
        )
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto("http://localhost:5173/settings")
        await mobile_page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        mobile_path = os.path.join(artifact_dir, "settings_mobile.png")
        await mobile_page.screenshot(path=mobile_path)
        print(f"3. Responsive mobile layout saved to: {mobile_path}")
        
        await browser.close()
        print("Settings Workspace capture script finished successfully!")

if __name__ == "__main__":
    asyncio.run(main())

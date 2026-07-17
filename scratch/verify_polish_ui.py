import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("====================================================")
    print("RUNNING SPRINT UI VISUAL AUDIT & SCREENSHOT CAPTURES")
    print("====================================================")
    
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 950})
        page = await context.new_page()
        
        # 1. Idle state Generate Page
        print("-> Navigating to Generate Page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0) # Wait for animation/hydration
        
        idle_path = os.path.join(artifact_dir, "generate_idle.png")
        await page.screenshot(path=idle_path)
        print(f"-> Captured Generate Page Idle State: {idle_path}")
        
        # 2. Trigger Require Review Tooltip
        print("-> Hovering Require Review Tooltip...")
        require_review_tooltip_btn = page.locator("span:has-text('Require Review') button")
        await require_review_tooltip_btn.scroll_into_view_if_needed()
        await require_review_tooltip_btn.hover()
        await asyncio.sleep(0.5) # Wait for tooltip display
        
        tooltip_rr_path = os.path.join(artifact_dir, "tooltip_require_review.png")
        await page.screenshot(path=tooltip_rr_path)
        print(f"-> Captured Require Review Tooltip: {tooltip_rr_path}")
        
        # Move mouse away to clear tooltip
        await page.mouse.move(0, 0)
        await asyncio.sleep(0.2)
        
        # 3. Trigger Execution Strategy Tooltip
        print("-> Hovering Execution Strategy Tooltip...")
        strategy_tooltip_btn = page.locator("label:has-text('Execution Strategy') button")
        await strategy_tooltip_btn.scroll_into_view_if_needed()
        await strategy_tooltip_btn.hover()
        await asyncio.sleep(0.5)
        
        tooltip_es_path = os.path.join(artifact_dir, "tooltip_execution_strategy.png")
        await page.screenshot(path=tooltip_es_path)
        print(f"-> Captured Execution Strategy Tooltip: {tooltip_es_path}")
        
        # Move mouse away
        await page.mouse.move(0, 0)
        await asyncio.sleep(0.2)
        
        # 4. Open Document Format Select Dropdown
        print("-> Clicking Document Format Dropdown...")
        format_select_trigger = page.locator("label:has-text('Document Format')").locator("..").locator("button[data-slot='select-trigger']")
        await format_select_trigger.scroll_into_view_if_needed()
        await format_select_trigger.click()
        await asyncio.sleep(0.5)
        
        dropdown_fmt_path = os.path.join(artifact_dir, "dropdown_format_open.png")
        await page.screenshot(path=dropdown_fmt_path)
        print(f"-> Captured Document Format Open Dropdown: {dropdown_fmt_path}")
        
        # Close dropdown via keyboard Escape
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.2)
        
        # 5. Open Execution Strategy Select Dropdown
        print("-> Clicking Execution Strategy Dropdown...")
        strategy_select_trigger = page.locator("label:has-text('Execution Strategy')").locator("..").locator("button[data-slot='select-trigger']")
        await strategy_select_trigger.scroll_into_view_if_needed()
        await strategy_select_trigger.click()
        await asyncio.sleep(0.5)
        
        dropdown_str_path = os.path.join(artifact_dir, "dropdown_strategy_open.png")
        await page.screenshot(path=dropdown_str_path)
        print(f"-> Captured Execution Strategy Open Dropdown: {dropdown_str_path}")
        
        # Close dropdown
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.2)
        
        # 6. Navigate to Settings and Capture Dropdowns
        print("-> Navigating to Settings Page...")
        await page.goto("http://localhost:5173/settings")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        settings_path = os.path.join(artifact_dir, "settings_idle.png")
        await page.screenshot(path=settings_path)
        print(f"-> Captured Settings Page: {settings_path}")
        
        print("-> Clicking Settings Document Format Dropdown...")
        settings_fmt_trigger = page.locator("h3:has-text('Default Document Format')").locator("..").locator("..").locator("button[data-slot='select-trigger']")
        await settings_fmt_trigger.scroll_into_view_if_needed()
        await settings_fmt_trigger.click()
        await asyncio.sleep(0.5)
        
        settings_fmt_open_path = os.path.join(artifact_dir, "settings_dropdown_format_open.png")
        await page.screenshot(path=settings_fmt_open_path)
        print(f"-> Captured Settings Document Format Open: {settings_fmt_open_path}")
        
        await browser.close()
        print("====================================================")
        print("VISUAL AUDIT SUITE FINISHED SUCCESSFUL!")
        print("====================================================")

if __name__ == '__main__':
    asyncio.run(main())

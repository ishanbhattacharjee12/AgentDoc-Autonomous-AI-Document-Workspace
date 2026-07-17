import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        await page.goto("http://localhost:5173/generate")
        await asyncio.sleep(2)
        
        # Take pre-click screenshot
        await page.screenshot(path="/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/debug_pre.png")
        print("Pre-click screenshot saved.")
        
        # Print list of buttons on the page
        buttons = await page.eval_on_selector_all("button", "elements => elements.map(e => ({ text: e.innerText, html: e.outerHTML }))")
        print("\nAll buttons on page:")
        for idx, btn in enumerate(buttons):
            print(f"Button {idx}: text={btn['text']} | html={btn['html'][:150]}...")
            
        # Click Advanced Options button
        print("\nClicking text=Advanced Options & Diagnostics...")
        await page.click("text=Advanced Options & Diagnostics")
        await asyncio.sleep(2)
        
        # Take post-click screenshot
        await page.screenshot(path="/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2/debug_post.png")
        print("Post-click screenshot saved.")
        
        # Print buttons again
        buttons_after = await page.eval_on_selector_all("button", "elements => elements.map(e => ({ text: e.innerText, html: e.outerHTML }))")
        print("\nAll buttons on page after click:")
        for idx, btn in enumerate(buttons_after):
            print(f"Button {idx}: text={btn['text']} | html={btn['html'][:150]}...")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

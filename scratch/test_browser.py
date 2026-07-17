import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Listen for console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append((msg.type, msg.text)))
        page.on("pageerror", lambda err: console_messages.append(("pageerror", err.message)))
        
        # Open page
        print("Navigating to http://127.0.0.1:8000 ...")
        await page.goto("http://127.0.0.1:8000")
        await page.wait_for_timeout(2000) # wait for DOMContentLoaded / async loads
        
        print("Page loaded. Initial Console Messages:")
        for msg_type, text in console_messages:
            print(f"[{msg_type.upper()}] {text}")
            
        # Fill in document request
        print("\nFilling request-input...")
        await page.fill("#request-input", "Create a project plan for launching a new product.")
        
        # Try to click "Run Agent"
        print("\nClicking 'Run Agent' button...")
        try:
            await page.click("#run-btn")
            print("Clicked!")
        except Exception as e:
            print(f"Click failed: {e}")
            
        await page.wait_for_timeout(5000)
        
        print("\nConsole Messages after click:")
        for msg_type, text in console_messages:
            print(f"[{msg_type.upper()}] {text}")
            
        # Check if the loading-section is visible (not having "hidden" class)
        classes = await page.eval_on_selector("#loading-section", "el => el.className")
        print(f"\nLoading section classes: '{classes}'")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

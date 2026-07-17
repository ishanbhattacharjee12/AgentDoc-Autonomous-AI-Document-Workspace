import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("====================================================")
    print("VERIFYING REACTIVE STATE SYNC (CLEAR HISTORY)")
    print("====================================================")
    
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1200})
        page = await context.new_page()
        
        # 1. Open history page to register IndexedDB store
        print("-> Navigating to History page...")
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Page Error: {err}"))
        
        await page.goto("http://localhost:5173/history")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # 2. Seed documents
        print("-> Seeding documents in database...")
        await page.evaluate("""
            () => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('agentdoc_history', 2);
                    request.onsuccess = () => {
                        const db = request.result;
                        const tx = db.transaction('documents', 'readwrite');
                        const store = tx.objectStore('documents');
                        
                        store.clear();
                        
                        const entries = [
                            {
                                prompt: "AI support implementation plan",
                                title: "AI Support Implementation Plan",
                                summary: "Test summary.",
                                document_filename: "doc_ai_support.pdf",
                                format: "pdf",
                                mode: "standard",
                                created_at: new Date().toISOString(),
                                time_taken: 15.0,
                                active_model: "hy3-free",
                                llm_call_count: 2,
                                is_favorite: false,
                                is_archived: false
                            }
                        ];
                        
                        const addReq = store.add(entries[0]);
                        addReq.onsuccess = () => {
                            db.close();
                            resolve();
                        };
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        """)
        
        # Reload to let hook fetch seeded data
        print("-> Reloading...")
        await page.reload()
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # Verify sidebar shows 1 document and Excellent quality initially
        doc_count_el = page.locator("div:has(> div > span:has-text('Documents')) > span.font-bold").first
        quality_el = page.locator("div:has(> div > span:has-text('Avg Quality')) > span.font-bold").first
        
        doc_count = await doc_count_el.inner_text()
        quality = await quality_el.inner_text()
        print(f"-> Initial sidebar: Documents={doc_count}, Quality={quality}")
        
        if doc_count != "1" or quality != "Excellent":
            print(f"ERROR: Initial state invalid! Got count={doc_count}, quality={quality}", file=sys.stderr)
            sys.exit(1)
            
        # 3. Click "Clear Library" button on History Page
        print("-> Clicking Clear Library button...")
        page.on("dialog", lambda dialog: dialog.accept())
        clear_btn = page.locator("button:has-text('Clear Library')")
        await clear_btn.click()
        
        # Wait a little bit for transaction and reactive event to fire
        await asyncio.sleep(1.0)
        
        # Verify sidebar immediately updated
        doc_count_after = await doc_count_el.inner_text()
        quality_after = await quality_el.inner_text()
        time_after = await page.locator("div:has(> div > span:has-text('Avg Time')) > span.font-bold").first.inner_text()
        mode_after = await page.locator("div:has(> div > span:has-text('Preferred Mode')) > span.font-bold").first.inner_text()
        
        print(f"-> After Clear Sidebar: Documents={doc_count_after}, Quality={quality_after}, Time={time_after}, Mode={mode_after}")
        
        if doc_count_after != "0":
            print(f"ERROR: Stored documents count is not 0! Got: {doc_count_after}", file=sys.stderr)
            sys.exit(1)
            
        if quality_after != "—" or time_after != "—" or mode_after != "—":
            print(f"ERROR: Metrics didn't reset to dashes! Got: Quality={quality_after}, Time={time_after}, Mode={mode_after}", file=sys.stderr)
            sys.exit(1)
            
        # Take a screenshot to show the empty/synchronized insights sidebar
        empty_insights_path = os.path.join(artifact_dir, "sidebar_insights_empty.png")
        await page.screenshot(path=empty_insights_path)
        print(f"-> Captured sidebar in empty/synced state: {empty_insights_path}")
        
        await browser.close()
        print("====================================================")
        print("REACTIVE STATE SYNC AUDIT COMPLETED SUCCESSFULLY!")
        print("====================================================")

if __name__ == '__main__':
    asyncio.run(main())

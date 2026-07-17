import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Increase viewport height to 1200 to fully display the sidebar cards
        context = await browser.new_context(viewport={"width": 1280, "height": 1200})
        page = await context.new_page()
        
        print("-> Navigating to History page...")
        await page.goto("http://localhost:5173/history")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # Seed the IndexedDB with some documents
        print("-> Seeding documents...")
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
                                prompt: "AI support implementation plan for customer service chatbot launch",
                                title: "AI Support Implementation Plan",
                                summary: "Plan to launch AI chatbot.",
                                document_filename: "doc_ai_support.pdf",
                                format: "pdf",
                                mode: "standard",
                                created_at: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
                                time_taken: 15.2,
                                active_model: "hy3-free",
                                llm_call_count: 2,
                                is_favorite: false,
                                is_archived: false
                            },
                            {
                                prompt: "Quarterly marketing goals review for Q3 campaigns",
                                title: "Q3 Marketing Review",
                                summary: "Q3 marketing review document.",
                                document_filename: "doc_marketing.docx",
                                format: "docx",
                                mode: "advanced",
                                created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                                time_taken: 45.1,
                                active_model: "hy3-free",
                                llm_call_count: 4,
                                is_favorite: false,
                                is_archived: false
                            },
                            {
                                prompt: "Employee onboarding handbook for product team",
                                title: "Onboarding Handbook",
                                summary: "Onboarding guide.",
                                document_filename: "doc_onboarding.pdf",
                                format: "pdf",
                                mode: "standard",
                                created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                                time_taken: 12.0,
                                active_model: "hy3-free",
                                llm_call_count: 3,
                                is_favorite: false,
                                is_archived: false
                            }
                        ];
                        
                        let count = 0;
                        entries.forEach(e => {
                            const addReq = store.add(e);
                            addReq.onsuccess = () => {
                                count++;
                                if (count === entries.length) {
                                    db.close();
                                    resolve();
                                }
                            };
                        });
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        """)
        
        # Reload to update UI
        print("-> Reloading page...")
        await page.reload()
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # Capture the whole page showing the sidebar
        full_path = os.path.join(artifact_dir, "sidebar_populated_full.png")
        await page.screenshot(path=full_path)
        print(f"-> Captured populated sidebar view: {full_path}")
        
        # Crop to the sidebar specifically
        sidebar_el = page.locator("aside")
        sidebar_path = os.path.join(artifact_dir, "sidebar_activity.png")
        await sidebar_el.screenshot(path=sidebar_path)
        print(f"-> Captured sidebar component: {sidebar_path}")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())

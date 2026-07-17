import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("Starting Playwright History Workspace State Capture...")
    
    # Target directory for artifacts
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        # Launch browser context
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        # 1. Capture Empty History State
        print("Navigating to History page (empty state)...")
        await page.goto("http://localhost:5173/history")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        empty_path = os.path.join(artifact_dir, "history_empty.png")
        await page.screenshot(path=empty_path)
        print(f"1. Empty history state saved to: {empty_path}")
        
        # 2. Seed IndexedDB with document metadata
        print("Seeding IndexedDB with document records...")
        await page.evaluate("""
            () => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('agentdoc_history', 1);
                    request.onupgradeneeded = () => {
                        const db = request.result;
                        if (!db.objectStoreNames.contains('documents')) {
                            const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                            store.createIndex('created_at', 'created_at', { unique: false });
                        }
                    };
                    request.onsuccess = () => {
                        const db = request.result;
                        const tx = db.transaction('documents', 'readwrite');
                        const store = tx.objectStore('documents');
                        
                        const entries = [
                            {
                                prompt: "Write a brief document detailing three practical tips for improving productivity in a remote engineering team.",
                                summary: "This document provides three actionable strategies for increasing remote engineering team output: optimizing asynchronous alignment protocols, defining clear focus hours, and utilizing automated CI/CD pipelines to reduce manual deployment overhead.",
                                document_filename: "productivity_remote_team_17841103.pdf",
                                format: "pdf",
                                mode: "standard",
                                created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                                time_taken: 14.2,
                                active_model: "gemini-2.5-pro",
                                llm_call_count: 3
                            },
                            {
                                prompt: "Create a project plan for launching a new software product in a remote team context.",
                                summary: "A comprehensive project initiation plan outlining launch phases, cross-functional engineering deliverables, stakeholder alignment milestones, and risk mitigation strategies tailored to a distributed operating environment.",
                                document_filename: "software_launch_plan_17842205.docx",
                                format: "docx",
                                mode: "advanced",
                                created_at: new Date(Date.now() - 60000).toISOString(),
                                time_taken: 28.5,
                                active_model: "gemini-2.5-pro",
                                llm_call_count: 8
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
                            addReq.onerror = () => reject(addReq.error);
                        });
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        """)
        
        # Reload to let history load the new entries from DB
        print("Reloading page to display history entries...")
        await page.reload()
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        # 3. Capture Populated History List
        populated_path = os.path.join(artifact_dir, "history_populated.png")
        await page.screenshot(path=populated_path)
        print(f"2. Populated history state saved to: {populated_path}")
        
        # 4. Trigger Preview Drawer (Click on the first item's preview action)
        print("Hovering card to reveal actions and clicking preview...")
        # Hover first card to make actions visible
        card = page.locator("div.group").first
        await card.hover()
        await asyncio.sleep(0.3)
        
        # Capture hover/download actions state
        download_path = os.path.join(artifact_dir, "history_download.png")
        await page.screenshot(path=download_path)
        print(f"3. Download actions (hover card) saved to: {download_path}")
        
        # Click Preview button
        print("Opening preview drawer...")
        await page.locator("button:has-text('Preview')").first.click()
        await page.wait_for_selector("text=Document Preview")
        await asyncio.sleep(0.5)
        
        # 5. Capture Preview Drawer State
        preview_path = os.path.join(artifact_dir, "history_preview.png")
        await page.screenshot(path=preview_path)
        print(f"4. Preview drawer state saved to: {preview_path}")
        
        await browser.close()
        print("History Workspace capture script finished successfully!")

if __name__ == "__main__":
    asyncio.run(main())

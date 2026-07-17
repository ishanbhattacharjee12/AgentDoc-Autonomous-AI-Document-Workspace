import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("====================================================")
    print("RUNNING HISTORY PAGE VERIFICATION & TEST SUITE")
    print("====================================================")
    
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 950})
        page = await context.new_page()
        
        # Open history page first to initialize/reset IndexedDB
        print("-> Navigating to History page to initialize...")
        await page.goto("http://localhost:5173/history")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # Clear IndexedDB and seed 12 entries
        print("-> Seeding 12 history entries (newest to oldest)...")
        await page.evaluate("""
            () => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('agentdoc_history', 2);
                    request.onsuccess = () => {
                        const db = request.result;
                        const tx = db.transaction('documents', 'readwrite');
                        const store = tx.objectStore('documents');
                        
                        // Clear existing
                        store.clear();
                        
                        // Create 12 documents with staggered timestamps
                        const entries = [];
                        for (let i = 1; i <= 12; i++) {
                            entries.push({
                                prompt: `User prompt query number ${i} for test verification`,
                                title: `Test Document Title ${i}`,
                                summary: `Generated summary description for document number ${i} in our database.`,
                                document_filename: `doc_report_test_${i}.pdf`,
                                format: "pdf",
                                mode: i % 2 === 0 ? "advanced" : "standard",
                                created_at: new Date(Date.now() - 3600000 * i).toISOString(), // i hours ago
                                time_taken: 10 + i,
                                active_model: "hy3-free",
                                llm_call_count: 3,
                                is_favorite: false,
                                is_archived: false
                            });
                        }
                        
                        // Add oldest first (or let's add them one by one using the normal save/add transaction)
                        // Note: Our saveHistoryEntry in historyDB.ts has the 10 limit, but since this is direct indexedDB,
                        // we can simulate the capping by keeping only the 10 latest. Or we can just call our saveHistoryEntry
                        // from window, but since it's a module, let's just write the direct seeding which mimics capping at 10.
                        // Wait! The easiest way is to seed all 12 one by one and check if capping works.
                        // Let's seed 12 and then cap at 10.
                        let count = 0;
                        entries.forEach(e => {
                            const addReq = store.add(e);
                            addReq.onsuccess = () => {
                                count++;
                                if (count === entries.length) {
                                    // Apply capping to latest 10
                                    const getAllReq = store.getAll();
                                    getAllReq.onsuccess = () => {
                                        const results = getAllReq.result;
                                        if (results.length > 10) {
                                            results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                            const toDelete = results.length - 10;
                                            for (let d = 0; d < toDelete; d++) {
                                                store.delete(results[d].id);
                                            }
                                        }
                                        db.close();
                                        resolve();
                                    };
                                }
                            };
                        });
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        """)
        
        # Reload page to populate UI from database
        print("-> Reloading History Page...")
        await page.reload()
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.0)
        
        # 1. Capture Populated History (Default View - showing 3 entries, informational note, and KPI verification)
        print("-> Capturing History Page populated default state...")
        history_path = os.path.join(artifact_dir, "history_populated.png")
        await page.screenshot(path=history_path)
        print(f"-> Captured default History view showing 3 cards: {history_path}")
        
        # Count visible history cards in grid
        card_count = await page.locator("div.main-history-list h3:has-text('Test Document Title')").count()
        print(f"-> Verified count of visible history cards (expected 3): {card_count}")
        if card_count != 3:
            print("ERROR: Expected exactly 3 visible history cards by default!", file=sys.stderr)
            sys.exit(1)
            
        # Verify presence of informational hint text
        hint_text = "Showing your 3 most recent documents. Use the search bar below to access up to your last 10 saved generations."
        is_hint_visible = await page.locator(f"text={hint_text}").is_visible()
        print(f"-> Informational hint visibility: {is_hint_visible}")
        if not is_hint_visible:
            print("ERROR: Informational hint text is missing or not visible!", file=sys.stderr)
            sys.exit(1)
            
        # 2. Search for an older document (e.g. Document Title 8, which shouldn't be in the 3 most recent documents)
        # Note: documents 1, 2, 3 are the most recent. Document 8 is older (8 hours ago) but still in the 10 stored entries.
        print("-> Searching for older document ('Title 8')...")
        search_input = page.locator("input[placeholder*='Search']")
        await search_input.fill("Title 8")
        await asyncio.sleep(1.0) # Wait for debounce/filtering
        
        # Capture search result page
        search_path = os.path.join(artifact_dir, "history_search_result.png")
        await page.screenshot(path=search_path)
        print(f"-> Captured search results: {search_path}")
        
        # Verify Document 8 is now visible in the search result list
        doc8_visible = await page.locator("div.main-history-list h3:has-text('Test Document Title 8')").is_visible()
        print(f"-> Search result visibility for 'Test Document Title 8': {doc8_visible}")
        if not doc8_visible:
            print("ERROR: Searched document 'Test Document Title 8' is not visible in search results!", file=sys.stderr)
            sys.exit(1)
            
        # Count search results (should be exactly 1)
        search_count = await page.locator("div.main-history-list h3:has-text('Test Document Title')").count()
        print(f"-> Count of visible cards in search results: {search_count}")
        if search_count != 1:
            print(f"ERROR: Expected exactly 1 match in search results, got {search_count}!", file=sys.stderr)
            sys.exit(1)
            
        # 3. Clear search and ensure we go back to showing 3 entries
        print("-> Clearing search query...")
        await search_input.fill("")
        await asyncio.sleep(1.0)
        
        card_count_after = await page.locator("div.main-history-list h3:has-text('Test Document Title')").count()
        print(f"-> Verified count of visible cards after clearing search (expected 3): {card_count_after}")
        if card_count_after != 3:
            print("ERROR: Expected to revert back to exactly 3 visible history cards!", file=sys.stderr)
            sys.exit(1)
            
        # 4. Navigate to Insights to capture and verify KPI cards layout and naming
        print("-> Navigating to Generate Page...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        # Trigger mock run so we can look at the Insights page or use previous generated screenshots.
        # Wait, since the server is running, we can trigger the pipeline to generate a real document!
        print("-> Triggering a real generation run to verify Insights KPI layout...")
        # Populate input
        input_textarea = page.locator("textarea[placeholder*='Describe the document']")
        await input_textarea.fill("Write a 1-paragraph explanation of evolutionary biology.")
        
        # Run agent
        run_btn = page.locator("button:has-text('Run Agent Pipeline')")
        await run_btn.click()
        
        print("-> Waiting for generation to complete (up to 45s)...")
        insights_tab = page.locator("button:has-text('Insights')")
        await insights_tab.wait_for(state="visible", timeout=45000)
        await asyncio.sleep(1.0)
        
        # Go to Insights tab
        print("-> Clicking Insights Tab...")
        await insights_tab.click()
        await asyncio.sleep(1.0)
        
        # Verify "Effort Level" card is present and visible
        effort_card = page.locator("span:has-text('Effort Level')")
        is_effort_visible = await effort_card.is_visible()
        print(f"-> 'Effort Level' KPI visibility: {is_effort_visible}")
        if not is_effort_visible:
            print("ERROR: 'Effort Level' KPI card is not found or not visible!", file=sys.stderr)
            sys.exit(1)
            
        # Capture Insights page
        insights_path = os.path.join(artifact_dir, "final_workspace_insights.png")
        await page.screenshot(path=insights_path)
        print(f"-> Captured completed Insights KPI layout: {insights_path}")
        
        await browser.close()
        print("====================================================")
        print("HISTORY & KPI ROW VERIFICATION SUCCESSFUL!")
        print("====================================================")

if __name__ == "__main__":
    asyncio.run(main())

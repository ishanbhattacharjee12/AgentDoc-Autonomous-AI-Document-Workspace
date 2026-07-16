import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("====================================================")
    print("STARTING FULL PHASE 2 E2E STABILIZATION & QUALITY AUDIT")
    print("====================================================")
    
    artifact_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        # Launch browser session
        browser = await p.chromium.launch(headless=True)
        # Desktop context
        desktop_context = await browser.new_context(viewport={"width": 1280, "height": 950})
        page = await desktop_context.new_page()
        
        # 1. Generate Page (Initial State)
        print("\nStep 1: Auditing Generate Page (Initial State)...")
        await page.goto("http://localhost:5173/generate")
        await page.wait_for_load_state("networkidle")
        
        # Seed localStorage to always require review and bypass cache
        print("-> Seeding localStorage user settings (requireReview=true, ignoreCache=true)...")
        await page.evaluate("""
            localStorage.setItem('agentdoc_user_settings', JSON.stringify({
                format: 'pdf',
                mode: 'standard',
                requireReview: true,
                ignoreCache: true
            }));
        """)
        await page.reload()
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        generate_initial_path = os.path.join(artifact_dir, "final_generate_initial.png")
        await page.screenshot(path=generate_initial_path)
        print(f"-> Captured initial Generate Page: {generate_initial_path}")
        
        # 2. Plan Review State
        print("\nStep 2: Auditing Plan Review Editor...")
        # Fill prompt
        await page.fill("textarea[placeholder*='Describe the document']", "Create a project plan for launching a new software product in a remote team context.")
        
        # Click Run Agent Pipeline
        await page.locator("button:has-text('Run Agent Pipeline')").click()
        print("-> Waiting for planner stage to output outline...")
        await page.wait_for_selector("[data-slot='card-title']", timeout=15000)
        await asyncio.sleep(0.5)
        
        review_initial_path = os.path.join(artifact_dir, "final_review_initial.png")
        await page.screenshot(path=review_initial_path)
        print(f"-> Captured Initial Plan Outline: {review_initial_path}")
        
        # Edit step 2 text
        print("-> Modifying Step 2 inline text...")
        first_input = page.locator("input[placeholder='Describe task instruction...']").nth(1)
        await first_input.click()
        await first_input.press("Meta+A")
        await first_input.press("Backspace")
        await first_input.fill("Custom engineering team stakeholder alignment and capacity assessment")
        await page.keyboard.press("Enter")
        await asyncio.sleep(0.3)
        
        review_edit_path = os.path.join(artifact_dir, "final_review_editing.png")
        await page.screenshot(path=review_edit_path)
        print(f"-> Captured Edited Plan: {review_edit_path}")
        
        # Delete step 3
        print("-> Deleting Step 3...")
        # Hover first to reveal trash icon
        await page.locator("input[placeholder='Describe task instruction...']").nth(2).hover()
        await asyncio.sleep(0.2)
        await page.locator("button[aria-label='Delete step 3']").click()
        await asyncio.sleep(0.3)
        
        # Add new step at bottom
        print("-> Adding custom task step...")
        await page.locator("button:has-text('Add Execution Task Step')").click()
        await asyncio.sleep(0.3)
        await page.locator("input[placeholder='Describe task instruction...']").last.fill("Analyze final compliance standards and secure operational clearance")
        await page.keyboard.press("Enter")
        await asyncio.sleep(0.3)
        
        review_mutated_path = os.path.join(artifact_dir, "final_review_mutated.png")
        await page.screenshot(path=review_mutated_path)
        print(f"-> Captured Mutated Plan: {review_mutated_path}")
        
        # 3. Resume & Stream Page
        print("\nStep 3: Auditing Execution Resumption & Stream view...")
        await page.locator("button:has-text('Resume Execution Stream')").click()
        await asyncio.sleep(0.8)
        
        stream_path = os.path.join(artifact_dir, "final_review_resuming.png")
        await page.screenshot(path=stream_path)
        print(f"-> Captured Resuming Stream view: {stream_path}")
        
        # Wait for completion
        print("-> Waiting for document generation to compile output...")
        await page.wait_for_selector("text=Document Completed Successfully", timeout=45000)
        await asyncio.sleep(0.5)
        
        # 4. Results Workspace - Tab 1: Document
        print("\nStep 4: Auditing Results Workspace - Document Tab...")
        doc_tab_path = os.path.join(artifact_dir, "final_workspace_document.png")
        await page.screenshot(path=doc_tab_path)
        print(f"-> Captured Document Tab: {doc_tab_path}")
        
        # 5. Results Workspace - Tab 2: Execution
        print("\nStep 5: Auditing Results Workspace - Execution Tab...")
        await page.locator("button:has-text('Execution')").click()
        await page.wait_for_selector("text=System Execution Logs")
        await asyncio.sleep(0.3)
        
        # Expand accordion
        await page.locator("summary").click()
        await asyncio.sleep(0.3)
        
        exec_tab_path = os.path.join(artifact_dir, "final_workspace_execution.png")
        await page.screenshot(path=exec_tab_path)
        print(f"-> Captured Execution Tab: {exec_tab_path}")
        
        # 6. Results Workspace - Tab 3: Insights (Explainability)
        print("\nStep 6: Auditing Results Workspace - Insights Tab...")
        await page.locator("button:has-text('Insights')").click()
        await page.wait_for_selector("text=Planner Confidence")
        await asyncio.sleep(0.5)
        
        insights_tab_path = os.path.join(artifact_dir, "final_workspace_insights.png")
        await page.screenshot(path=insights_tab_path)
        print(f"-> Captured Insights Tab: {insights_tab_path}")
        
        # 7. Settings Page
        print("\nStep 7: Auditing Settings Workspace...")
        await page.goto("http://localhost:5173/settings")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        settings_path = os.path.join(artifact_dir, "final_settings.png")
        await page.screenshot(path=settings_path)
        print(f"-> Captured Settings Page (Desktop): {settings_path}")
        
        # 8. History Page (Populated State)
        print("\nStep 8: Auditing History Workspace...")
        await page.goto("http://localhost:5173/history")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        history_path = os.path.join(artifact_dir, "final_history_populated.png")
        await page.screenshot(path=history_path)
        print(f"-> Captured History Page: {history_path}")
        
        # Click Preview Drawer
        print("-> Opening History Preview Drawer...")
        await page.locator("div.group").first.hover()
        await asyncio.sleep(0.2)
        await page.locator("button:has-text('Preview')").first.click()
        await page.wait_for_selector("text=Document Details")
        await asyncio.sleep(0.5)
        
        history_preview_path = os.path.join(artifact_dir, "final_history_preview.png")
        await page.screenshot(path=history_preview_path)
        print(f"-> Captured History Preview Drawer: {history_preview_path}")
        
        # 9. Settings Page (Mobile Viewport)
        print("\nStep 9: Auditing Settings Mobile Viewport...")
        mobile_context = await browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto("http://localhost:5173/settings")
        await mobile_page.wait_for_load_state("networkidle")
        await asyncio.sleep(0.5)
        
        settings_mobile_path = os.path.join(artifact_dir, "final_settings_mobile.png")
        await mobile_page.screenshot(path=settings_mobile_path)
        print(f"-> Captured Settings Page (Mobile): {settings_mobile_path}")
        
        await browser.close()
        print("\n====================================================")
        print("PHASE 2 FULL E2E STABILIZATION AUDIT SUCCESSFULLY COMPLETED!")
        print("====================================================")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())

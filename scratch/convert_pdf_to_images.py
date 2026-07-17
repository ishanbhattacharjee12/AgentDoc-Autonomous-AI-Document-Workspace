import fitz
import os

artifacts_dir = "/Users/ishanbhattacharjee/.gemini/antigravity/brain/e243c357-3a93-4f71-8cb8-96e71a54f1b2"

# Paths
before_pdf = "app/outputs/compare_before.pdf"
after_pdf = "app/outputs/compare_after.pdf"

# Convert function
def convert_pages(pdf_path, suffix):
    print(f"Opening {pdf_path}...")
    doc = fitz.open(pdf_path)
    
    # Page 1 (Cover)
    cover_page = doc.load_page(0)
    pix1 = cover_page.get_pixmap(dpi=150)
    out1 = os.path.join(artifacts_dir, f"cover_{suffix}.png")
    pix1.save(out1)
    print(f"Saved cover to {out1}")
    
    # Page 2 (Decision Snapshot Table)
    table_page = doc.load_page(1)
    pix2 = table_page.get_pixmap(dpi=150)
    out2 = os.path.join(artifacts_dir, f"table_{suffix}.png")
    pix2.save(out2)
    print(f"Saved table page to {out2}")

convert_pages(before_pdf, "before")
convert_pages(after_pdf, "after")
print("All conversions completed successfully!")

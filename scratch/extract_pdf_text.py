import pypdf
from pathlib import Path

pdf_path = Path("app/outputs/compare_after.pdf")
if not pdf_path.exists():
    print(f"Error: {pdf_path} does not exist!")
    sys.exit(1)

reader = pypdf.PdfReader(pdf_path)
print(f"Number of pages: {len(reader.pages)}")

for idx, page in enumerate(reader.pages):
    print(f"\n--- PAGE {idx + 1} ---")
    print(page.extract_text())

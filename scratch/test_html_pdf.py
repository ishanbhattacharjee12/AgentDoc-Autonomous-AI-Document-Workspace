import markdown
from fpdf import FPDF

class MyPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("helvetica", "I", 8)
            self.cell(0, 10, "Header text", align="L")
            self.ln(10)

    def footer(self):
        if self.page_no() > 1:
            self.set_y(-15)
            self.set_font("helvetica", "I", 8)
            self.cell(0, 10, f"Page {self.page_no()}", align="C")

pdf = MyPDF()
pdf.add_page()

md_content = """
# Title
## Section 1: Executive Summary
This is some **bold text** and some *italic text*.

Here is a list of items:
* Item 1 is **very important** because of reasons.
* Item 2 is also important.

| Priority | Risk | Investment |
| --- | --- | --- |
| High | Medium | Low |
| Low | Low | High |

### Subheading 1.1
Some more paragraph text here.
"""

html = markdown.markdown(md_content, extensions=['tables'])
print("Converted HTML:\n", html)

try:
    pdf.write_html(html)
    pdf.output("scratch/test_html_complex.pdf")
    print("Complex PDF generated successfully!")
except Exception as e:
    print(f"Error: {e}")

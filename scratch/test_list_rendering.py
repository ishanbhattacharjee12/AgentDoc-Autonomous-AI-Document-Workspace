from fpdf import FPDF
from fpdf.enums import XPos, YPos

pdf = FPDF()
pdf.add_page()

# Test 1: bullet list with indent
pdf.set_font("helvetica", size=10)
pdf.set_x(25)
pdf.write(6, "\x95  ")
pdf.multi_cell(0, 6, "This is a bullet list item. It is a long line to test wrapping. Let's see if the wrapped line starts at the left margin or at the indented position.", markdown=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(4)

# Test 2: bullet list with set_left_margin
pdf.set_left_margin(30)
pdf.set_x(25)
pdf.write(6, "\x95  ")
pdf.multi_cell(0, 6, "This is another bullet list item. With the left margin set to 30, the wrapped lines should start at the indented position 30, while the bullet is printed at 25.", markdown=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

# Reset margin
pdf.set_left_margin(10)
pdf.ln(10)
pdf.output("scratch/test_list_rendering.pdf")
print("List rendering PDF generated successfully")

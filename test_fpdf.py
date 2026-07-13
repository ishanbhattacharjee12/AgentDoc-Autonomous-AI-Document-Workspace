from fpdf import FPDF
from fpdf.enums import XPos, YPos

pdf = FPDF()
pdf.add_page()
pdf.set_margins(20, 20, 20)
pdf.set_auto_page_break(auto=True, margin=20)

pdf.set_font("helvetica", "B", 16)
pdf.cell(0, 10, "Executive Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.set_font("helvetica", "", 11)
pdf.multi_cell(0, 6, "Provide a recipe for a pizza, maybe also some background on pizza history.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(6)

pdf.set_font("helvetica", "B", 16)
pdf.cell(0, 10, "Key Assumptions", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

pdf.set_font("helvetica", "", 11)
for a in ["The user has basic kitchen equipment", "The user wants a traditional pizza recipe"]:
    pdf.multi_cell(0, 6, f"- {a}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

print("Success!")

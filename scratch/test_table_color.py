from fpdf import FPDF
from fpdf.fonts import FontFace

pdf = FPDF()
pdf.add_page()
pdf.set_font("helvetica", size=10)

h_face = FontFace(fill_color=(44, 82, 130), color=(255, 255, 255), emphasis="B")
rows = [["Header1", "Header2"], ["Value1", "Value2"]]

try:
    with pdf.table(rows=rows, headings_style=h_face, markdown=True) as t:
        pass
    pdf.output("scratch/test_table_color.pdf")
    print("PDF generated successfully!")
except Exception as e:
    print("Error:", e)

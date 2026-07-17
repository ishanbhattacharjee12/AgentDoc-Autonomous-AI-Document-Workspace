from fpdf import FPDF
from fpdf.enums import XPos, YPos
from fpdf.fonts import FontFace

pdf = FPDF()
pdf.add_page()

# Use Helvetica, same as the document generator
pdf.set_font("helvetica", size=9)

cleaned_rows = [
    ["Priority", "Risk", "Investment", "Timeline", "Expected ROI", "Confidence"],
    ["High", "Medium: Data gaps delay insights", "Low (< $50K)", "90 Days", "High: Increased conversion & reduced CAC", "Medium-High"]
]

num_cols = len(cleaned_rows[0])
cell_padding = 2.0

col_max_widths = [0.0] * num_cols
col_max_word_widths = [0.0] * num_cols
for row in cleaned_rows:
    for col_idx, cell in enumerate(row):
        if col_idx < num_cols:
            clean_cell = cell.replace('**', '').replace('*', '')
            str_w = pdf.get_string_width(clean_cell)
            col_max_widths[col_idx] = max(col_max_widths[col_idx], str_w)
            
            words = clean_cell.split()
            word_w = max(pdf.get_string_width(w) for w in words) if words else 0.0
            col_max_word_widths[col_idx] = max(col_max_word_widths[col_idx], word_w)

total_text_w = sum(col_max_widths)
usable_width = pdf.epw
col_widths = [(w / total_text_w) * usable_width for w in col_max_widths]

print("Initial col_widths based on string width:", col_widths)

for idx in range(num_cols):
    word_limit = col_max_word_widths[idx] + (2 * cell_padding) + 1.0 # 1mm safety margin
    hard_min = max(24.0, usable_width * 0.12)
    col_min = max(word_limit, hard_min)
    if col_widths[idx] < col_min:
        col_widths[idx] = col_min

total_w = sum(col_widths)
if total_w > usable_width:
    col_widths = [(w / total_w) * usable_width for w in col_widths]
else:
    remaining = usable_width - total_w
    if remaining > 0:
        col_widths = [w + (col_max_widths[idx] / total_text_w) * remaining for idx, w in enumerate(col_widths)]

print("Adjusted col_widths:", col_widths)
print("Sum of widths:", sum(col_widths), "Usable width:", usable_width)

heading_face = FontFace(fill_color=(44, 82, 130), color=(255, 255, 255), emphasis="B")

try:
    pdf.set_draw_color(218, 222, 229)
    pdf.set_line_width(0.2)
    with pdf.table(
        rows=cleaned_rows,
        align="CENTER",
        v_align="MIDDLE",
        padding=cell_padding,
        col_widths=col_widths,
        cell_fill_color=(245, 247, 250),
        cell_fill_mode="EVEN_ROWS",
        headings_style=heading_face
    ) as table:
        pass
    pdf.output("scratch/test_table_widths.pdf")
    print("PDF with adaptive table generated successfully!")
except Exception as e:
    print("Error:", e)

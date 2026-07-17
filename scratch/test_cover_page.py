from fpdf import FPDF
from fpdf.enums import XPos, YPos

pdf = FPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=False)

# Theme colors
COLOR_BG = (234, 241, 248)        # Soft Powder Blue (#EAF1F8)
COLOR_PRIMARY = (26, 54, 93)       # Dark Navy (#1A365D)
COLOR_ACCENT = (43, 76, 126)       # Slate Blue (#2B4C7E)
COLOR_TEXT = (33, 33, 33)          # Charcoal (#212121)
COLOR_MUTED = (100, 115, 140)      # Slate Grey

# 1. Background fill
pdf.set_fill_color(*COLOR_BG)
pdf.rect(0, 0, pdf.w, pdf.h, "F")

# Decorative double border
pdf.set_draw_color(*COLOR_ACCENT)
pdf.set_line_width(0.5)
pdf.rect(12, 12, pdf.w - 24, pdf.h - 24, "D")

pdf.set_left_margin(30)
pdf.set_right_margin(30)
pdf.set_x(30)

# Center vertically: start title block at 48mm
pdf.set_y(48)

# Document Type (sans-serif, centered)
pdf.set_font("helvetica", "B", 10)
pdf.set_text_color(*COLOR_ACCENT)
pdf.cell(0, 8, "IMPROVEMENT PLAN", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(3)

# Title Divider Line
pdf.set_draw_color(*COLOR_ACCENT)
pdf.set_line_width(1.0)
line_w = 60
start_x = (pdf.w - line_w) / 2
pdf.line(start_x, pdf.get_y(), start_x + line_w, pdf.get_y())
pdf.ln(8)

# Main Title in Times (Serif, size 24, dark navy, centered)
pdf.set_font("times", "B", 24)
pdf.set_text_color(*COLOR_PRIMARY)
pdf.multi_cell(0, 11, "Customer Onboarding Improvement Plan", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

# Accent Underline spanning Title block width
title_end_y = pdf.get_y()
pdf.set_draw_color(*COLOR_ACCENT)
pdf.set_line_width(1.2)
pdf.line(30, title_end_y + 4, pdf.w - 30, title_end_y + 4)

# Equal spacing: start the objective section
pdf.set_y(title_end_y + 16)

# Left-aligned Objective Section
pdf.set_font("helvetica", "B", 9.5)
pdf.set_text_color(*COLOR_ACCENT)
heading_y1 = pdf.get_y()
pdf.set_x(30)
pdf.cell(0, 6, "OBJECTIVE", align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

# Underline of exact label width
heading_w1 = pdf.get_string_width("OBJECTIVE")
pdf.set_draw_color(*COLOR_ACCENT)
pdf.set_line_width(0.6)
pdf.line(30, heading_y1 + 5.5, 30 + heading_w1, heading_y1 + 5.5)
pdf.ln(3)

# Description text (Left-aligned, size 10.5)
pdf.set_x(30)
pdf.set_font("helvetica", "", 10.5)
pdf.set_text_color(*COLOR_TEXT)
objective_val = "Identify primary drop-off points in the customer onboarding process and implement high-impact UX fixes."
pdf.multi_cell(0, 5.5, objective_val, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(10) # Equal spacing

# Left-aligned Expected Business Impact Section
pdf.set_font("helvetica", "B", 9.5)
pdf.set_text_color(*COLOR_ACCENT)
heading_y2 = pdf.get_y()
pdf.set_x(30)
pdf.cell(0, 6, "EXPECTED BUSINESS IMPACT", align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

# Underline of exact label width
heading_w2 = pdf.get_string_width("EXPECTED BUSINESS IMPACT")
pdf.set_draw_color(*COLOR_ACCENT)
pdf.set_line_width(0.6)
pdf.line(30, heading_y2 + 5.5, 30 + heading_w2, heading_y2 + 5.5)
pdf.ln(3)

# Description text (Left-aligned, size 10.5)
pdf.set_x(30)
pdf.set_font("helvetica", "", 10.5)
pdf.set_text_color(*COLOR_TEXT)
impact_val = "Projected 15-25% reduction in early-stage churn, improving user lifetime value."
pdf.multi_cell(0, 5.5, impact_val, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(10) # Equal spacing

# Second Divider Line above metadata
pdf.set_draw_color(*COLOR_MUTED)
pdf.set_line_width(0.3)
meta_line_w = 150
meta_start_x = (pdf.w - meta_line_w) / 2
pdf.line(meta_start_x, pdf.get_y(), meta_start_x + meta_line_w, pdf.get_y())
pdf.ln(10) # Equal spacing

# Three-Column Footer Metadata (Left-aligned columns, bold underlined headers in dark navy)
meta_y = pdf.get_y()
col_w = (pdf.w - 60) / 3

def print_footer_item(label: str, value: str, x: float, w: float, y_start: float):
    pdf.set_y(y_start)
    pdf.set_x(x)
    # Heading: Bold, Dark Navy, size 7.5
    pdf.set_font("helvetica", "B", 7.5)
    pdf.set_text_color(*COLOR_PRIMARY)
    pdf.cell(w, 4, label.upper(), align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    # Precise Underline
    label_w = pdf.get_string_width(label.upper())
    pdf.set_draw_color(*COLOR_ACCENT)
    pdf.set_line_width(0.5)
    pdf.line(x, y_start + 4.2, x + label_w, y_start + 4.2)
    
    # Value: Regular, Dark Navy, size 8.5
    pdf.set_y(y_start + 6.5)
    pdf.set_x(x)
    pdf.set_font("helvetica", "", 8.5)
    pdf.set_text_color(*COLOR_PRIMARY)
    pdf.multi_cell(w, 4.5, value, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

print_footer_item("Classification", "Confidential / Executive Ready", 30, col_w, meta_y)
print_footer_item("Prepared By", "AgentDoc Consulting Services", 30 + col_w, col_w, meta_y)
print_footer_item("Date of Issue", "July 16, 2026", 30 + 2 * col_w, col_w, meta_y)

pdf.output("scratch/test_cover_page.pdf")
print("Cover page generated successfully!")

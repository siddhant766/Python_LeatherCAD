from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.utils import timezone


def generate_tech_pack_pdf(design):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TechPackTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        alignment=1,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=15,
    )
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4b5563')
    )
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#111827'),
        spaceBefore=15,
        spaceAfter=10,
    )

    elements = []

    # Title
    elements.append(Paragraph("PRODUCTION TECH PACK", title_style))
    elements.append(Spacer(1, 10))

    # Meta
    date_str = timezone.now().strftime('%B %d, %Y')
    meta_text = f"<b>Design Ref:</b> #{design.id} &nbsp;|&nbsp; <b>Date:</b> {date_str}"
    elements.append(Paragraph(meta_text, meta_style))
    elements.append(Spacer(1, 15))

    # Product & Designer Details
    product_name = design.product.name if design.product else 'Custom Product'
    product_cat = design.product.category if design.product else 'Leather'
    designer_name = design.user.name or design.user.email if design.user else 'Unknown Designer'

    info_data = [
        [Paragraph("<b>Product:</b>", meta_style), Paragraph(f"{product_name} ({product_cat})", meta_style)],
        [Paragraph("<b>Designer:</b>", meta_style), Paragraph(designer_name, meta_style)],
        [Paragraph("<b>Design Name:</b>", meta_style), Paragraph(design.name, meta_style)],
        [Paragraph("<b>Status:</b>", meta_style), Paragraph(design.status.upper(), meta_style)],
    ]
    info_table = Table(info_data, colWidths=[120, 380])
    info_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # Bill of Materials (BOM)
    elements.append(Paragraph("Bill of Materials (BOM)", section_style))

    config = design.configuration or {}
    table_data = [
        [
            Paragraph("<b>Zone / Component</b>", meta_style),
            Paragraph("<b>Selection / Color</b>", meta_style),
            Paragraph("<b>SKU / Code</b>", meta_style)
        ]
    ]

    for key, value in config.items():
        table_data.append([
            Paragraph(str(key).upper(), meta_style),
            Paragraph(str(value), meta_style),
            Paragraph("STD-MAT-01", meta_style)
        ])

    if len(table_data) == 1:
        table_data.append([
            Paragraph("DEFAULT", meta_style),
            Paragraph("Standard Leather", meta_style),
            Paragraph("STD-MAT-01", meta_style)
        ])

    bom_table = Table(table_data, colWidths=[180, 200, 120])
    bom_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111827')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(bom_table)
    elements.append(Spacer(1, 30))

    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#9ca3af')
    )
    elements.append(Paragraph("LeatherCAD Platform — Automated Technical Specification Sheet", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer

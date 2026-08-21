import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_predictions_csv(predictions: list) -> str:
    """Generates a CSV report from a list of prediction records."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Prediction ID", "Machine ID", "Air Temp (K)", "Process Temp (K)", 
        "Rotational Speed (RPM)", "Torque (Nm)", "Tool Wear (min)", 
        "Product Type", "Failure Prob", "Is Failure", "Failure Type", 
        "Confidence Score", "Date Created"
    ])
    
    # Rows
    for p in predictions:
        sensor = p.get("sensor_data", {})
        writer.writerow([
            str(p.get("_id")),
            str(p.get("machine_id")),
            sensor.get("air_temp"),
            sensor.get("process_temp"),
            sensor.get("rotational_speed"),
            sensor.get("torque"),
            sensor.get("tool_wear"),
            sensor.get("product_type"),
            p.get("failure_probability"),
            p.get("is_failure"),
            p.get("failure_type"),
            p.get("confidence_score"),
            p.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if isinstance(p.get("created_at"), datetime) else str(p.get("created_at"))
        ])
        
    return output.getvalue()

def generate_machines_csv(machines: list) -> str:
    """Generates a CSV report from a list of machine records."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Machine ID", "Name", "Type", "Serial Number", "Location", "Status", "Date Registered"])
    
    # Rows
    for m in machines:
        writer.writerow([
            str(m.get("_id")),
            m.get("name"),
            m.get("type"),
            m.get("serial_number"),
            m.get("location"),
            m.get("status"),
            m.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if isinstance(m.get("created_at"), datetime) else str(m.get("created_at"))
        ])
        
    return output.getvalue()

def generate_predictions_pdf(predictions: list, title: str = "Prediction History Report") -> bytes:
    """Generates a styled PDF report of prediction logs."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=54)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Industrial AI Theme
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0F172A'), # dark slate
        spaceAfter=15,
        alignment=0 # Left aligned
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=30
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor('#334155')
    )
    
    # Add Title
    story.append(Paragraph(title, title_style))
    
    # Add Metadata Subtitle
    generated_on = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metadata_text = f"Smart Failure Detection System • Generated on: {generated_on} • Records: {len(predictions)}"
    story.append(Paragraph(metadata_text, subtitle_style))
    
    # Table data setup
    # Columns: Time, Machine, Sensor Specs, Failure Prob, Failure Type
    data = [[
        Paragraph("Timestamp", th_style),
        Paragraph("Machine ID", th_style),
        Paragraph("Sensor Variables (Air T / Proc T / Speed / Torque / Wear)", th_style),
        Paragraph("Prob", th_style),
        Paragraph("Status", th_style),
        Paragraph("Failure Mode", th_style)
    ]]
    
    for p in predictions:
        sensor = p.get("sensor_data", {})
        sensor_str = f"{sensor.get('air_temp')}K | {sensor.get('process_temp')}K | {sensor.get('rotational_speed')} RPM | {sensor.get('torque')} Nm | {sensor.get('tool_wear')}m"
        
        prob = p.get("failure_probability", 0.0)
        prob_str = f"{prob * 100:.1f}%"
        
        status_text = "CRITICAL" if prob > 0.8 else ("WARNING" if p.get("is_failure") else "HEALTHY")
        
        timestamp_str = p.get("created_at").strftime("%b %d, %H:%M") if isinstance(p.get("created_at"), datetime) else str(p.get("created_at"))[:16]
        
        data.append([
            Paragraph(timestamp_str, td_style),
            Paragraph(str(p.get("machine_id"))[-6:], td_style), # short machine ID
            Paragraph(sensor_str, td_style),
            Paragraph(prob_str, td_style),
            Paragraph(status_text, td_style),
            Paragraph(p.get("failure_type", "None"), td_style)
        ])
        
    # Table layout
    table = Table(data, colWidths=[70, 50, 230, 45, 50, 95])
    
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')), # Dark slate background for header
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')), # Light borders
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
    ])
    
    # Dynamic row backgrounds and text coloring for alarms
    for i in range(1, len(data)):
        status_cell = data[i][4].text
        if status_cell == "CRITICAL":
            table_style.add('BACKGROUND', (4, i), (4, i), colors.HexColor('#FEE2E2')) # light red
            table_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#DC2626'))
        elif status_cell == "WARNING":
            table_style.add('BACKGROUND', (4, i), (4, i), colors.HexColor('#FEF3C7')) # light yellow
            table_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#D97706'))
        else:
            table_style.add('BACKGROUND', (4, i), (4, i), colors.HexColor('#D1FAE5')) # light green
            table_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#059669'))
            
        # Alternating rows background
        if i % 2 == 0:
            table_style.add('BACKGROUND', (0, i), (3, i), colors.HexColor('#F8FAFC'))
            table_style.add('BACKGROUND', (5, i), (5, i), colors.HexColor('#F8FAFC'))
            
    table.setStyle(table_style)
    story.append(table)
    
    # Build Document
    doc.build(story)
    return buffer.getvalue()

def generate_machines_pdf(machines: list, title: str = "Machine Assets Health Report") -> bytes:
    """Generates a styled PDF report of machine statuses."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=54, bottomMargin=54)
    story = []
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=15,
        alignment=0
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=30
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor('#334155')
    )
    
    story.append(Paragraph(title, title_style))
    
    generated_on = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metadata_text = f"Smart Failure Detection System • Generated on: {generated_on} • Registered Machines: {len(machines)}"
    story.append(Paragraph(metadata_text, subtitle_style))
    
    # Table data setup
    data = [[
        Paragraph("Serial Number", th_style),
        Paragraph("Machine Name", th_style),
        Paragraph("Type", th_style),
        Paragraph("Location", th_style),
        Paragraph("Current Status", th_style),
        Paragraph("Date Registered", th_style)
    ]]
    
    for m in machines:
        status_text = m.get("status", "healthy").upper()
        date_str = m.get("created_at").strftime("%Y-%m-%d") if isinstance(m.get("created_at"), datetime) else str(m.get("created_at"))[:10]
        
        data.append([
            Paragraph(m.get("serial_number"), td_style),
            Paragraph(m.get("name"), td_style),
            Paragraph(f"Type {m.get('type')}", td_style),
            Paragraph(m.get("location"), td_style),
            Paragraph(status_text, td_style),
            Paragraph(date_str, td_style)
        ])
        
    table = Table(data, colWidths=[90, 140, 50, 110, 70, 80])
    
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
    ])
    
    for i in range(1, len(data)):
        status_cell = data[i][4].text
        if status_cell == "CRITICAL":
            table_style.add('BACKGROUND', (4, i), (4, i), colors.HexColor('#FEE2E2'))
            table_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#DC2626'))
        elif status_cell == "WARNING":
            table_style.add('BACKGROUND', (4, i), (4, i), colors.HexColor('#FEF3C7'))
            table_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#D97706'))
        else:
            table_style.add('BACKGROUND', (4, i), (4, i), colors.HexColor('#D1FAE5'))
            table_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#059669'))
            
        if i % 2 == 0:
            table_style.add('BACKGROUND', (0, i), (3, i), colors.HexColor('#F8FAFC'))
            table_style.add('BACKGROUND', (5, i), (5, i), colors.HexColor('#F8FAFC'))
            
    table.setStyle(table_style)
    story.append(table)
    
    doc.build(story)
    return buffer.getvalue()

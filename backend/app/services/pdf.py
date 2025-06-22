from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from app.services.medicines import get_medicines_for_calendar

moment_map = {
    "morning": "matin",
    "noon": "midi",
    "evening": "soir"
}

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

moment_map = {
    "morning": "matin",
    "noon": "midi",
    "evening": "soir"
}

def generate_medicine_conditions_pdf(calendar_id):
    medicines_grouped = get_medicines_for_calendar(calendar_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Conditions de prise des médicaments", styles['Heading1']))
    elements.append(Spacer(1, 12))

    for name, med_data in medicines_grouped.items():
        dose = med_data["dose"]
        conditions = med_data["conditions"]

        elements.append(Paragraph(f"<b>{name} ({dose} mg)</b>", styles['Heading3']))

        for cond in conditions:
            moment = moment_map.get(cond['time_of_day'], cond['time_of_day'])
            desc = f"- {cond['tablet_count']} comprimé(s) de {dose} mg tous les {cond['interval_days']} jour(s), le {moment}"
            if cond['start_date']:
                desc += f", à partir du {cond['start_date'].strftime('%d/%m/%Y')}"
            elements.append(Paragraph(desc, styles['Normal']))

        elements.append(Spacer(1, 10))

    doc.build(elements)
    buffer.seek(0)
    return buffer


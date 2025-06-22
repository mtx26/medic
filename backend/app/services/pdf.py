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

def generate_medicine_conditions_pdf(calendar_id):
    # Obtenir les données (doit renvoyer { name: [ {dose, tablet_count, time_of_day, interval_days, start_date} ] })
    medicines_grouped = get_medicines_for_calendar(calendar_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Conditions de prise des médicaments", styles['Heading1']))
    elements.append(Spacer(1, 12))

    for name, conditions in medicines_grouped.items():
        elements.append(Paragraph(f"<b>{name}</b>", styles['Heading3']))
        for cond in map(dict, conditions):  # convertit RealDictRow en dict
            moment = moment_map.get(cond['time_of_day'], cond['time_of_day'])
            desc = f"- {cond['tablet_count']} comprimé(s) de {cond['dose']}mg tous les {cond['interval_days']} jour(s), le {moment}"
            if cond['start_date']:
                desc += f", à partir du {cond['start_date'].strftime('%d/%m/%Y')}"
            elements.append(Paragraph(desc, styles['Normal']))
        elements.append(Spacer(1, 10))

    doc.build(elements)
    buffer.seek(0)
    return buffer  # Tu peux ensuite faire send_file(buffer, ...)

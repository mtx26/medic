from flask import request, Response
import requests
from app.db.connection import get_connection
from . import api

@api.route("/proxy/pdf", methods=["GET"])
def proxy_pdf():
    box_id = request.args.get("box_id")
    if not box_id:
        return "Missing box_id", 400

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM medicine_boxes WHERE id = %s", (box_id,))
            box = cursor.fetchone()
            if not box:
                return "Box not found", 404

            cursor.execute(
                "SELECT url_notice_fr FROM medicaments_afmps WHERE name ILIKE %s AND dose ILIKE %s",
                (f"%{box['name']}%", f"%{box['dose']}%")
            )
            url_result = cursor.fetchone()

    if not url_result or not url_result.get("url_notice_fr"):
        return "URL not found", 404

    r = requests.get(url_result["url_notice_fr"])
    return Response(
        r.content,
        content_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=notice.pdf"}
    )

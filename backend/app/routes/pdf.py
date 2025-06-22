from flask import request, Response, g
import requests
from app.db.connection import get_connection
from . import api
from app.utils.response import error_response
import time
from app.utils.logger import log_backend
import traceback

@api.route("/proxy/pdf", methods=["GET"])
def proxy_pdf():
    try:
        t_0 = time.time()

        box_id = request.args.get("box_id")
        if not box_id:
            return error_response(
                message="Missing box_id",
                code="MISSING_BOX_ID",
                status_code=400,
                uid=g.uid,
                origin="PDF_PROXY"
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM medicine_boxes WHERE id = %s", (box_id,))
                box = cursor.fetchone()
                if not box:
                    return error_response(
                        message="Box not found",
                        code="BOX_NOT_FOUND",
                        status_code=404,
                        uid=g.uid,
                        origin="PDF_PROXY"
                    )

                cursor.execute(
                    """
                    SELECT url_notice_fr
                    FROM medicaments_afmps
                    WHERE name ILIKE CONCAT('%%', %s, '%%')
                    AND dose ILIKE CONCAT('%%', %s, '%%')
                    """,
                    (box["name"], box["dose"])
                )
                url_result = cursor.fetchone()

        if not url_result or not url_result.get("url_notice_fr"):
            return error_response(
                message="URL not found",
                code="URL_NOT_FOUND",
                status_code=404,
                uid=g.uid,
                origin="PDF_PROXY"
            )
        r = requests.get(url_result["url_notice_fr"], stream=True, timeout=10)
        r.raise_for_status()

        t_1 = time.time()

        log_backend.info(f"PDF downloaded in {t_1 - t_0} seconds", {"origin": "PDF_PROXY", "code": "PDF_DOWNLOADED", "url": url_result["url_notice_fr"]})

        return Response(
            r.content,
            mimetype="application/pdf",
            headers={"Content-Disposition": "inline; filename=notice.pdf", "Content-Type": "application/pdf"}
        )
    except Exception as e:
        log_backend.error(f"Error downloading PDF: {e}", {
            "origin": "PDF_PROXY", 
            "code": "PDF_DOWNLOAD_ERROR", 
            "url": url_result["url_notice_fr"], 
            "error": traceback.format_exc(),
            "uid": g.uid
        })
        return f"Erreur lors du téléchargement : {e}", 500

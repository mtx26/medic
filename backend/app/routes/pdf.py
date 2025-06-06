from flask import Response, request
import requests
from . import api

@api.route("/proxy/pdf")
def proxy_pdf():
    remote_url = request.args.get("url")
    if not remote_url:
        return "Missing URL", 400

    r = requests.get(remote_url)
    return Response(
        r.content,
        content_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=notice.pdf"}
    )

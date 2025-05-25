from . import api
from flask import Blueprint
from app.utils.logo_upload import upload_logo
from app.utils.response import success_response, error_response, warning_response

@api.route("/upload/logo", methods=["POST"])
def upload_logo_route():

    user = verify_firebase_token()
    uid = user["uid"]

    file = request.files.get("file")   
    if not file:
        return warning_response(
            message=WARNING_NO_GOOGLE_PHOTO_URL_PROVIDED,
            code="NO_GOOGLE_PHOTO_URL_PROVIDED",
            status_code=400,
            uid=uid,
            origin="UPLOAD_LOGO"
        )
    
    url = upload_logo(file)
    if not url:
        return error_response(
            message=ERROR_IMAGE_UPLOAD,
            code="IMAGE_UPLOAD_FAILED",
            status_code=500,
            uid=uid,
            origin="UPLOAD_LOGO"
        )
    return success_response(
        message=SUCCESS_IMAGE_UPLOADED,
        code="IMAGE_UPLOADED",
        uid=uid,
        origin="UPLOAD_LOGO",
        data={"url": url})
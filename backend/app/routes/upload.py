from . import api
from flask import Blueprint, request, jsonify
from cloudinary.uploader import upload
from app.utils.response import success_response, error_response, warning_response
from app.utils.validators import verify_firebase_token
import requests
from app.utils.messages import (
    SUCCESS_IMAGE_UPLOADED,
    ERROR_IMAGE_UPLOAD,
    WARNING_NO_GOOGLE_PHOTO_URL_PROVIDED
)


@api.route("/api/upload/logo", methods=["POST"])
def upload_logo():
    try:
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
        
        result = upload(file)   
        
        print(result["url"])
        return success_response(
            message=SUCCESS_IMAGE_UPLOADED,
            code="IMAGE_UPLOADED",
            uid=uid,
            origin="UPLOAD_LOGO",
            data={"url": result["url"]}
        )
    except Exception as e:
        return error_response(
            message=ERROR_IMAGE_UPLOAD,
            code="IMAGE_UPLOAD_FAILED",
            status_code=500,
            uid=uid,
            origin="UPLOAD_IMAGE",
            error=str(e)
        )

from . import api
from flask import Blueprint, request, jsonify
from cloudinary_config import cloudinary
from cloudinary.uploader import upload
from response import success_response, error_response, warning_response
from auth import verify_firebase_token
import requests

@api.route("/api/upload/logo", methods=["POST"])
def upload_logo():
    try:
        user = verify_firebase_token()
        uid = user["uid"]

        googlePhotoUrl = request.json.get("googlePhotoUrl")        
        if not googlePhotoUrl:
            return warning_response(
                message="Aucune URL de photo Google fournie",
                code="NO_GOOGLE_PHOTO_URL_PROVIDED",
                status_code=400,
                uid=uid,
                origin="UPLOAD_LOGO"
            )

        response = requests.get(googlePhotoUrl)
        response.raise_for_status()
        image_bytes = response.content

        result = upload(image_bytes)
        print(result["url"])
        return success_response(
            message="Image téléchargée avec succès",
            code="IMAGE_UPLOADED",
            uid=uid,
            origin="UPLOAD_LOGO",
            data={"url": result["url"]}
        )
    except Exception as e:
        return error_response(
            message="Erreur lors du téléchargement de l'image",
            code="IMAGE_UPLOAD_FAILED",
            status_code=500,
            uid=uid,
            origin="UPLOAD_IMAGE",
            error=str(e)
        )

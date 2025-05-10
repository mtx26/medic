from . import api
from flask import Blueprint, request
from cloudinary_config import cloudinary
from cloudinary.uploader import upload
from response import success_response, error_response, warning_response
from auth import verify_firebase_token

import requests
import urllib.parse
import socket
import ipaddress

# Définir une liste blanche de domaines autorisés
ALLOWED_DOMAINS = ["lh3.googleusercontent.com", "googleusercontent.com"]

def is_domain_allowed(url):
    try:
        parsed_url = urllib.parse.urlparse(url)
        hostname = parsed_url.hostname

        if not hostname:
            return False

        # Vérifie si le domaine est dans la whitelist
        return any(hostname.endswith(allowed) for allowed in ALLOWED_DOMAINS)
    except Exception:
        return False

def is_ip_safe(url):
    try:
        hostname = urllib.parse.urlparse(url).hostname
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)

        # Refuse les IP privées, loopback, etc.
        return not (ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local)
    except Exception:
        return False

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

        # ⚠️ Validation stricte de l'URL
        if not is_domain_allowed(googlePhotoUrl) or not is_ip_safe(googlePhotoUrl):
            return warning_response(
                message="URL non autorisée ou potentiellement dangereuse",
                code="UNAUTHORIZED_GOOGLE_PHOTO_URL",
                status_code=400,
                uid=uid,
                origin="UPLOAD_LOGO"
            )

        response = requests.get(googlePhotoUrl)
        response.raise_for_status()
        image_bytes = response.content

        result = upload(image_bytes)
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

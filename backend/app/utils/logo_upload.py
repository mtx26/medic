from app.utils.validators import verify_firebase_token
from app.utils.response import success_response, error_response, warning_response
from cloudinary.uploader import upload
from app.utils.messages import (
    SUCCESS_IMAGE_UPLOADED,
    ERROR_IMAGE_UPLOAD,
    WARNING_NO_GOOGLE_PHOTO_URL_PROVIDED
)

def upload_logo(file, uid):
    try:
        
        result = upload(file)   
        
        return result["url"]

    except Exception as e:
        return None

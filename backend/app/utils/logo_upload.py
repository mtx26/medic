from cloudinary.uploader import upload

def upload_logo(file):
    try:
        
        result = upload(file)   
        
        return result["secure_url"]

    except Exception as e:
        return None

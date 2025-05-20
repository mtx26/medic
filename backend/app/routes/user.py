from . import api
from app.utils.validators import verify_firebase_token
from firebase_admin import firestore
from app.utils.response import success_response, error_response
from app.utils.messages import (
    SUCCESS_USER_INFO_FETCHED,
    ERROR_USER_INFO_FETCH,
    ERROR_USER_NOT_FOUND
)


def get_db():
    from firebase_admin import firestore
    return firestore.client()

# Récupérer les informations de l'utilisateur
@api.route("/user/info/<search_user_id>", methods=["GET"])
def handle_user_info(search_user_id):
    try:
        user = verify_firebase_token()
        user_id = user["uid"]
        
        db = get_db()

        search_user_doc = db.collection("users").document(search_user_id)

        if not search_user_doc.get().exists:
            return error_response(
                message=ERROR_USER_NOT_FOUND,
                code="USER_NOT_FOUND",
                status_code=404,
                uid=user_id,
                origin="USER_INFO",
                log_extra={"user_id": user_id, "search_user": search_user_id}
            )
        
        user_doc = search_user_doc.get().to_dict()
        display_name = user_doc.get("display_name")
        photo_url = user_doc.get("photo_url")
        email = user_doc.get("email")

        if not photo_url:
            photo_url = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"
        

        user_data = {
            "display_name": display_name,
            "photo_url": photo_url,
            "email": email
        }

        return success_response(
            message=SUCCESS_USER_INFO_FETCHED,
            code="USER_INFO_SUCCESS",
            uid=user_id,
            origin="USER_INFO",
            data={"user_data": user_data}
        )

    except Exception as e:
        return error_response(
            message=ERROR_USER_INFO_FETCH,
            code="USER_INFO_ERROR",
            status_code=500,
            uid=user_id,
            origin="USER_INFO",
            error=str(e),
            log_extra={"user_id": user_id}
        )


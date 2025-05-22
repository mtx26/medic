from flask import Blueprint

api = Blueprint('api', __name__)

# Importer les sous-modules pour enregistrer leurs routes
from .status import *
from .log import *
from .personnal_calendar import *
from .personnal_medicines import *
from .shared_users import *
from .shared_users_medicines import *
from .tokens import *
from .tokens_medicines import *
from .invitations import *
from .notifications import *
from .user import *
from .upload import *


def register_routes(app):
    app.register_blueprint(api, url_prefix='/api')

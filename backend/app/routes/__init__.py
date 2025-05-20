from flask import Blueprint

api = Blueprint('api', __name__)

# Importer les sous-modules pour enregistrer leurs routes
from .status import *
from .log import *
from .calendar import *
from .medicines import *
from .shared_users import *
from .tokens import *
from .invitations import *
from .notifications import *
from .user import *
from .upload import *


def register_routes(app):
    app.register_blueprint(api)

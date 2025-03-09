from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
import os

from app.config import (
    UPLOAD_FOLDER,
    GENERATED_FOLDER
)
from app.admin import admin
from app.main_routes import main_bp
from app.socket import socketio

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder="../static")
    CORS(app, resources={r"/*": {"origins": "*"}})

    socketio.init_app(app)

    swagger = Swagger(app, template_file='../static/swagger.json')

    app.register_blueprint(admin)
    app.register_blueprint(main_bp, url_prefix="/")

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['GENERATED_FOLDER'] = GENERATED_FOLDER

    for folder in [UPLOAD_FOLDER, GENERATED_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder)

    @app.route('/')
    def index():
        return 'ARTICKET 백엔드 서버입니다. 어드민 페이지(/admin)'

    return app
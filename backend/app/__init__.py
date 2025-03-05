from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flasgger import Swagger
import os

from app.config import (
    UPLOAD_FOLDER,
    GENERATED_FOLDER
)
from app.admin import admin, init_socketio
from app.main_routes import main_bp

socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    CORS(app)

    init_socketio(socketio)

    swagger = Swagger(app, template_file='./app/static/swagger.json')

    app.register_blueprint(admin)
    app.register_blueprint(main_bp)

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['GENERATED_FOLDER'] = GENERATED_FOLDER

    for folder in [UPLOAD_FOLDER, GENERATED_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder)

    @app.route('/')
    def index():
        return 'ARTICKET 백엔드 서버입니다. 어드민 페이지(/admin)'

    return app
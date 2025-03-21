from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger
import os
import secrets
import shutil
from flask_session import Session

from app.config import (
    UPLOAD_FOLDER,
    GENERATED_FOLDER, FRONTEND_URL
)
from app.admin import admin
from app.main_routes import main_bp
from app.socket_utils import socketio

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder="../static")

    app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(16)

    CORS(app, resources={r"/*": {"origins": FRONTEND_URL}}, supports_credentials=True)

    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "None"  # 크로스 도메인 쿠키 허용
    app.config["SESSION_COOKIE_SECURE"] = True  # HTTPS에서만 동작하도록 설정

    Session(app)

    socketio.init_app(app)

    swagger = Swagger(app, template_file='../static/swagger.json')

    app.register_blueprint(admin)
    app.register_blueprint(main_bp, url_prefix="/")

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['GENERATED_FOLDER'] = GENERATED_FOLDER

    # 업로드 및 생성 폴더가 존재하지 않으면 생성
    for folder in [UPLOAD_FOLDER, GENERATED_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder)
        else:
            # 기존의 모든 하위 폴더와 파일 삭제
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f"폴더 초기화 실패 {file_path}: {e}")

    for folder in [UPLOAD_FOLDER, GENERATED_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder)

    @app.route('/')
    def index():
        return 'ARTICKET 백엔드 서버입니다. 어드민 페이지(/admin)'

    return app
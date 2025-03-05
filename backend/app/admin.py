# app/admin.py
from flask import Blueprint, jsonify, request
from flask_socketio import SocketIO, emit

admin = Blueprint('admin', __name__)

# 소켓 초기화 함수
def init_socketio(socketio):
    # 필요할 경우 추가 소켓 이벤트 바인딩
    pass

# 단순 이벤트 예시
@admin.route('/admin')
def admin_index():
    return "관리자 페이지"

def log_progress(step, status, detail=None, log_type="info", extra_info=None):
    """
    관리자 페이지나 로그 모니터링을 위한 헬퍼 함수
    """
    print(f"[{log_type.upper()}] {step} - {status} - {detail or ''} - {extra_info or ''}")

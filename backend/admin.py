from flask import Blueprint, render_template
from flask_socketio import SocketIO

admin = Blueprint('admin', __name__, template_folder='templates')

# Socket.IO 객체는 main 파일에서 전달받아야 합니다.
socketio = None

def init_socketio(socketio_instance):
    global socketio
    socketio = socketio_instance

# 관리자 페이지 라우트
@admin.route('/admin')
def admin_page():
    return render_template('admin.html')

def log_progress(event, message, why, status="in-progress", data=None):
    """실시간 로그 전송 유틸리티 함수"""
    if socketio:
        socketio.emit('log', {
            "event": event,
            "message": message,
            "why": why,
            "status": status,
            "data": data
        })
    else:
        print("SocketIO is not initialized. Unable to send log.")
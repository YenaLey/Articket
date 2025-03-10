from flask import Blueprint, render_template
from app.socket import socketio 

admin = Blueprint('admin', __name__, template_folder="../templates")

@admin.route('/admin')
def admin_page():
    return render_template('admin.html')

def log_progress(event, message, why, status, data=None):
    """실시간 로그 전송 유틸리티 함수"""
    if socketio:
        try:
            socketio.emit('log', {
                "event": event,
                "message": message,
                "why": why,
                "status": status,
                "data": data
            }, to=None)
            socketio.sleep(0)
        except Exception as e:
            print(f"log_progress 에러 발생: {e}")
    else:
        print("SocketIO is not initialized. Unable to send log.")
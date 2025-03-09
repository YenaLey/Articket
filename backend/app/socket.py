from flask_socketio import SocketIO
from flask import request

socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet", ping_timeout=30, ping_interval=10)

@socketio.on('connect')
def test_connect():
    print(f"✅ 클라이언트 연결됨: {request.sid}")

@socketio.on('disconnect')
def test_disconnect():
    print(f"❌ 클라이언트 연결 종료됨: {request.sid}")

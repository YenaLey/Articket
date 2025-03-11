from flask_socketio import SocketIO, join_room
from flask import request

socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet", ping_timeout=30, ping_interval=10)

@socketio.on('connect')
def test_connect():
    print(f"✅ 클라이언트 연결됨: {request.sid}")

@socketio.on('disconnect')
def test_disconnect():
    print(f"❌ 클라이언트 연결 종료됨: {request.sid}")

@socketio.on("join")
def handle_join(data):
    room = data.get("room")
    if room:
        join_room(room)
        print(f"클라이언트 {request.sid}가 {room}에 가입했습니다.")
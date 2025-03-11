import eventlet
eventlet.monkey_patch()

from app import create_app
from app.socket_utils import socketio
from app.config import (
    BACKEND_URL,
    HOST,
    PORT
)

app = create_app()

if __name__ == '__main__':

    print(f"Flask 백엔드 서버 실행 중: {BACKEND_URL}")
    print(f"Swagger API 문서: {BACKEND_URL}/apidocs")
    print(f"관리자 페이지: {BACKEND_URL}/admin")
    
    socketio.run(app, host=HOST, port=PORT, use_reloader=False, debug=True)
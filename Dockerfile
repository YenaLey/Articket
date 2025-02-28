# 예: Python 3.9 slim 이미지
FROM python:3.9-slim

# 컨테이너 내에서 작업할 폴더를 지정 (없으면 자동 생성됨)
WORKDIR /app

# 1) requirements.txt 먼저 복사 & 설치
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 2) 전체 소스 복사 (backend 폴더 통째로)
COPY backend /app

# gunicorn 실행 명령 (Railway가 $PORT 환경변수로 포트를 넘겨줌)
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-b", "0.0.0.0:${PORT}", "app:app"]

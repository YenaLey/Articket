FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app

# 기본 포트 설정 (Railway 환경에서 사용될 환경변수 적용)
ENV PORT=5000

# CMD에서 쉘 모드로 실행하여 환경변수 적용
CMD exec gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:$PORT app:app

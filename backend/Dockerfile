# Python 3.9 이미지 사용
FROM python:3.9

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치
COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 코드 복사
COPY backend /app

# 포트 설정
EXPOSE 5000

# 서버 실행
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-b", "0.0.0.0:5000", "app:app"]

## 실행방법

### frontend 폴더 안에 .env 파일 추가 (./frontend/.env)

```
# 현재 노트북 IP로 설정
# IP를 바꿀 때는 여기 있는 HOST와 swagger.json의 host를 바꿔야 함
HOST=192.168.88.155
REACT_APP_HOST=$HOST
PORT=3000

# 현재 stable diffusion webui 서버로 수정
WEBUI_URL_1=https://h6uuae6yziz7kj-3001.proxy.runpod.net/
WEBUI_URL_2=https://dr9o6h711jnwva-3001.proxy.runpod.net/
WEBUI_URL_3=https://c2q0w5q9332l3i-3001.proxy.runpod.net/
BLIP_URL=https://ka2pk0g2zjq5ba-3002.proxy.runpod.net/

# 모든 사진 보관 폴더 지정(설정 안해도 됨 그럴 경우 주석처리)
# DESKTOP_FOLDER='/Users/leeyena/Desktop/articket'
```

### backend 서버 실행

```
cd backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Swagger UI 실행

```
"host": "192.168.46.155:5000", //backend/static/swagger.json에서 현재 노트북 IP로 수정
```

backend 서버 실행 후 http://호스트:5000/apidocs로 접속

### frontend 서버 실행

```
cd frontend
npm install
npm start
```

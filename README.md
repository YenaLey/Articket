## 실행방법

### stable diffusion webui 서버 실행

```
cd backend/static/file
stable-diffusion-server 파일을 google colab에서 실행 (1.5모델과 A100 GPU 사용, Lora 모델 파일들을 /models/Lora에 삽입)
생성된 public URL을 WEBUI_URL의 환경변수로 사용
```

### frontend 폴더 안에 .env 파일 추가 (./frontend/.env)
```
# 현재 노트북 IP로 수정
REACT_APP_HOST=192.168.46.155

# 현재 stable diffusion webui 서버로 수정
WEBUI_URL=https://1d3aebaf1cccc35cd9.gradio.live/

# 모든 사진 보관 폴더 지정(설정 안해도 됨 그럴 경우 주석처리)
# DESKTOP_FOLDER='/Users/leeyena/Desktop'
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
"host": "192.168.46.155:5000", //backend/swagger.json에서 현재 노트북 IP로 수정
```
backend 서버 실행 후 http://호스트:5000/apidocs로 접속

### frontend 서버 실행

```
cd frontend
npm install
npm start
```

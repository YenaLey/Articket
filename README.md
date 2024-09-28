## 실행방법

### stable diffusion webui 서버 실행

```
cd backend
cd stable-diffusion-webui
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
/models/Lora 에 모델 넣기
python launch.py --api --skip-torch-cuda-test
```

### backend 서버 실행

```
cd backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
WEBUI_URL= http://127.0.0.1:7860 내용의 .env 파일 생성
python app.py
```

### frontend 서버 실행

```
cd frontend
npm install
npm start
```

## 실행방법

### stable diffusion webui 서버 실행

```
cd backend/static/file
stable-diffusion-server 파일을 google colab에서 실행 (1.5모델과 A100 GPU 사용, Lora 모델 파일들을 /models/Lora에 삽입)
생성된 public URL을 WEBUI_URL의 환경변수로 사용
```

### backend 서버 실행

```
cd backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

.env 파일 추가
WEBUI_URL=https://5279210f23e5270644.gradio.live/ # 예시
DESKTOP_FOLDER='/Users/leeyena/Desktop/stable-diffusion-images' # 업로드한 이미지와 생성된 이미지들을 로컬에 자동 저장되도록 하는 폴더 경로 (생략 가능)

python app.py
```

### frontend 서버 실행

```
cd frontend
npm install
npm start
```

# 🎨 Articket
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/6317f46b-a112-49d2-bf34-2ba59e778a7b">


## 🔥 프로젝트 소개
- 사용자의 사진을 간단한 성격테스트를 통해 매칭된 화가의 스타일로 바꿔주는 서비스입니다.

**✅ 부스 운영 맞춤형 서비스**

- 사용자 휴대폰에서 사진을 업로드하고, 성격 테스트 옵션을 선택하고, 각 화가의 스타일로 변환된 모든 사진을 다운받을 수 있습니다.
- 이 모든 과정에서 휴대폰과 모니터가 데이터를 주고받으며, 모니터를 통해 모든 과정을 주변 사람들과 실시간으로 공유할 수 있습니다.

**✅ 빠른 이미지 생성 속도**

- 매칭된 화가뿐만 아니라 총 네 명의 화가 스타일로 변환된 사진을 제공하는데,
- 이때 이미지를 병렬적으로 생성하여 1분 이내로 변환된 사진들을 제공합니다.

**✅ 편리한 자동화 시스템**

- 생성된 이미지들을 담은 티켓을 출력하여 제공합니다.
- 이때 생성된 이미지들이 티켓 템플릿에 자동 포함되도록 하여 PDF로 저장되도록 합니다.
 
## 👨‍👩‍👧‍👦 팀원 구성

- 김시은 | AI Engineering
- 김예영 | Front-End | [@yezzero](https://github.com/yezzero)
- 이예나 | Back-End | [@YenaLey](https://github.com/YenaLey)
- 박혜민 | Design

## 💻 기술 스택
- Front-End
  - Language: JavaScript
  - Package Manager: npm 10.2.4
  - Library: React.js
- Back-End
  - Language: Python
  - Framework: Flask

## 🎥 실행방법

### frontend 폴더 안에 .env 파일 추가 (./frontend/.env)

```
# 현재 노트북 IP로 설정하기
# swagger.json의 host도 맞춰 수정하기
HOST=192.168.234.155
REACT_APP_FRONTEND_URL=http://192.168.234.155:3000
REACT_APP_BACKEND_URL=http://192.168.234.155:5000

# 현재 stable diffusion webui와 blip 서버로 수정
WEBUI_URL1=https://ggizb9f9xbnqsl-3001.proxy.runpod.net/
WEBUI_URL2=https://55et0ak9jfhlcu-3001.proxy.runpod.net/
BLIP_URL=https://16u02248i3wuem-3002.proxy.runpod.net/

# 모든 사진 보관 폴더 지정(설정 안해도 됨 그럴 경우 주석처리)
DESKTOP_FOLDER="/Users/leeyena/Library/CloudStorage/GoogleDrive-quipu0316@gmail.com/내 드라이브/articket1"
```

### backend 서버 실행

```
cd backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### frontend 서버 실행

```
cd frontend
npm install
npm start
```

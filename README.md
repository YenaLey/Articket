# 🎨 ARTICKET

<div align="center">
  <img alt="image" src="https://github.com/user-attachments/assets/fb8f0181-ad67-4926-84ab-a0b007f182f6" width="44%"/>
  <img alt="image" src="https://github.com/user-attachments/assets/36cdf1e5-6e94-434e-9a83-dc7db1abc1e7" width="44%"/>
</div>

**ARTICKET**은 Stable Diffusion을 활용한 이미지 생성 기반의 프로젝트로, 사용자에게 네 가지 화가(고흐, 피카소, 르누아르, 리히텐슈타인)의 화풍으로 변환된 이미지를 티켓 형태로 제공하는 서비스입니다.  
- **버전 1.0**: 개인 성격테스트를 통해 화가 스타일을 매칭한 뒤, 해당 스타일로 사진을 변환하여 PDF 티켓으로 출력  
- **버전 2.0**: 성격테스트 없이 원하는 화가 스타일로 즉시 이미지를 생성하고, 모바일 티켓을 발급

## 💡 버전별 소개

### ▶ Version 1.0 (2024 CO-SHOW 경진대회)

ARTICKET 1.0은 사용자와 예술 스타일을 연결하는 **성격 기반 매칭 시스템**을 중심으로 설계되었습니다.  
사용자는 간단한 성격테스트를 진행하고, AI가 사용자의 성향에 맞는 화가를 추천하여 해당 스타일로 사진을 변환합니다.  
<div align="left">
  <img alt="image" src="https://github.com/user-attachments/assets/165ca472-ba33-4a32-857c-f675dbc779fc" width="44%"/>
</div>

#### 🔹 주요 기능
- **성격테스트 기반 스타일 매칭**  
  - 8개의 A/B 유형 문항을 통해 사용자의 성향을 분석
  - 매칭된 화가뿐만 아니라, 상성이 좋은 스타일 및 대비되는 스타일까지 생성하여 비교 제공
- **즉각적인 이미지 변환**  
  - 사용자가 업로드한 사진을 Stable Diffusion을 활용하여 매칭된 화풍으로 변환
- **스마트폰 ↔ 모니터 연동 (WebSocket 기반)**  
  - 사용자는 스마트폰을 통해 성격테스트를 진행하고, 업로드된 이미지를 확인 및 관리  
  - 스마트폰이 **모니터를 제어하는 리모컨 역할** 수행 (옵션 선택, 사진 업로드, 결과 확인)
- **PDF 티켓 자동 생성 및 출력**  
  - 변환된 이미지를 티켓 디자인으로 변환하여 PDF로 출력  

#### 🛠 개발 포인트
- **Stable Diffusion API 최적화**  
  - 요청 병렬 처리 및 응답 시간 단축을 위한 큐 시스템 도입  
- **WebSocket 통신 구현**  
  - 사용자의 스마트폰과 부스 내 모니터 간 실시간 데이터 전송 및 제어  
- **UX 최적화**  
  - 성격테스트 흐름을 직관적으로 구성하여 참여율 증가  

### ▶ Version 2.0 (2025 서울시립대 동아리 홍보제 부스)
ARTICKET 2.0은 사용자 경험과 시스템 효율성을 향상시키기 위해 다양한 개선을 도입하였습니다.  
특히, 부스 운영의 효율성을 높이고, 사용자 참여를 간소화하기 위한 기능적 및 기술적 리팩토링을 수행하였습니다.
<div align="left">
  <img alt="image" src="https://github.com/user-attachments/assets/ff8abe5d-ef12-4219-9023-48c55eb312cb" width="22%"/>
</div>

#### 🔹 주요 기능 개선
- **성격테스트 제거 및 즉시 이미지 생성**  
  - 사용자 참여 시간을 단축하고, 서비스 체험 방법을 직관적으로 개선하기 위해 성격테스트를 제거하였습니다.  
  - 사용자는 사진을 업로드하면 즉시 네 명의 화가 스타일로 변환된 이미지를 확인할 수 있습니다.
- **모바일 티켓 발급 및 저장 기능**  
  - 생성된 이미지를 모바일 화면에서 즉시 확인하고, "티켓 발급하기" 버튼을 통해 손쉽게 캡처 및 저장할 수 있도록 하였습니다.
- **이미지 처리 방식 개선**  
  - 이전에는 생성된 이미지를 base64로 변환하여 프론트엔드로 전달하였으나, 이미지 경로만을 반환하는 방식으로 변경하여 시스템 부하를 줄였습니다.

#### 🛠 개발 포인트
- **코드 구조 리팩토링**  
  - 기존의 단일 파일 구조에서 핵심 기능별로 파일을 분리하여 유지보수성을 향상시켰습니다.  
  - 이미지 처리 함수와 Stable Diffusion 관련 기능을 `utils`에, API 흐름 관리를 `routes`에 배치하였습니다.
- **환경 설정 파일 도입 (`config.py`)**  
  - AI 모델 사용 여부, 병렬 처리 옵션, CLIP/BLIP 모델 선택 등을 설정 파일로 관리하여 개발 및 테스트 효율성을 높였습니다.
- **서버 배포 및 네트워크 접근성 향상**  
  - 로컬 서버의 네트워크 제한을 해결하기 위해 백엔드를 Railway에, 프론트엔드를 Netlify에 배포하였습니다.  
  - 이를 통해 사용자는 동일한 네트워크에 접속할 필요 없이 QR 코드 스캔만으로 서비스에 접근할 수 있게 되었습니다.
- **세션 및 룸(Room) 기능 도입**  
  - 사용자 데이터 혼선을 방지하기 위해 전역 변수 대신 세션을 활용하고, 각 사용자를 고유한 룸으로 관리하여 데이터 충돌을 방지하였습니다.
- **이미지 전처리 및 메모리 사용량 최적화**  
  - 고용량 이미지 전송으로 인한 메모리 사용량 증가 문제를 해결하기 위해 이미지 전처리 과정을 도입하였습니다.

## 🛠 기술 스택

- **프론트엔드**  
  - WebSocket  
  - React  
  - Netlify (배포)
- **백엔드**  
  - WebSocket  
  - Flask  
  - Railway (배포)
- **AI 서버**  
  - Stable Diffusion API  
  - RunPod의 RTX 4090 GPU (배포)

## ⚙️ Configuration (config.py 설정)

다양한 환경에서 유연하게 실행될 수 있도록 `config.py` 파일에서 주요 설정을 조정할 수 있습니다.  

```python
# 배포 여부 설정
USE_DEPLOY_BACKEND = True  # 백엔드 배포 여부 (True: 배포된 서버 사용, False: 로컬 서버 실행)
USE_DEPLOY_FRONTEND = True  # 프론트엔드 배포 여부 (True: 배포된 웹 애플리케이션 사용)

# AI 모델 사용 여부 설정
USE_CLIP = True  # CLIP 모델 사용 여부 (True: 이미지-텍스트 매칭 활성화)
USE_BLIP = False  # BLIP 모델 사용 여부 (True: 이미지 캡션 생성 기능 활성화)
USE_WEBUI = True  # Stable Diffusion WEBUI 사용 여부

# 생성 모드 설정
PARALLEL_MODE = False  # 병렬 생성 여부 (True: 여러 개의 이미지 동시에 생성, False: 순차 생성)

# API 서버 및 웹 UI 주소 설정
WEBUI_URL1 = "https://0b7dk2jorogzsw-3001.proxy.runpod.net/" # Stable Diffusion WEBUI 1
WEBUI_URL2 = "https://0b7dk2jorogzsw-3001.proxy.runpod.net/" # Stable Diffusion WEBUI 2
BLIP_URL   = "https://mm05wbqtthcrkn-3002.proxy.runpod.net/"

# 서버 실행 환경 설정
PORT = 8080  # 애플리케이션이 실행될 포트 번호
HOST = "10.0.11.122"  # 서버의 IP 주소 (로컬 네트워크)
```

## 📅 개발 일정

| 프로젝트        | 개발 기간           | 사용처                                      |
| --------------- | ------------------- | ------------------------------------------- |
| **Articket 1.0** | 2024.09 ~ 2024.11   | CO-SHOW (NCCOSS) 차세대통신 경진대회 부스 운영 |
| **Articket 2.0** | 2025.02             | 서울시립대학교 동아리 홍보제 부스 운영       |

> 자세한 개발 과정 및 구현 노하우는 아래 블로그 포스팅을 참고해주세요.  
> - [Articket 1.0](https://velog.io/@yena121/CO-SHOW-NCCOSS-%EC%B0%A8%EC%84%B8%EB%8C%80%ED%86%B5%EC%8B%A0-%EA%B2%BD%EC%A7%84%EB%8C%80%ED%9A%8C-%ED%9B%84%EA%B8%B0)  
> - [Articket 2.0](https://velog.io/@yena121/Articket-2.0-%EC%83%88%EB%A1%9C%EC%9A%B4-%EB%B6%80%EC%8A%A4%EB%A5%BC-%EC%9C%84%ED%95%9C-%EB%A6%AC%ED%8C%A9%ED%86%A0%EB%A7%81)

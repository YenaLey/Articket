USE_RAILWAY = True

USE_CLIP = False
USE_BLIP = True
USE_WEBUI = True

PARALLEL_MODE = True

WEBUI_URL1 = "https://c9zs2zafkesbzs-3001.proxy.runpod.net/"
WEBUI_URL2 = "https://eseoeg8rjf7iqz-3001.proxy.runpod.net/"
BLIP_URL   = "https://mm05wbqtthcrkn-3002.proxy.runpod.net/"

PORT = 8080
HOST = "0.0.0.0"

if USE_RAILWAY:
    BACKEND_URL = "https://articket-production.up.railway.app" # 배포된 백엔드 URL
else:
    BACKEND_URL = f'http://localhost:{PORT}'

UPLOAD_FOLDER  = './static/uploads'
GENERATED_FOLDER = './static/generated'
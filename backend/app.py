from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import os
import shutil
import base64
import requests
import time
import asyncio
from flasgger import Swagger
from dotenv import load_dotenv

load_dotenv(dotenv_path='../frontend/.env')

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return 'CORS 설정 완료'

swagger = Swagger(app, template_file='./static/swagger.json')

REACT_APP_HOST = os.getenv('HOST')
PORT = 5000
backend_url = f"http://{REACT_APP_HOST}:{PORT}"
WEBUI_URL = os.getenv('WEBUI_URL')

DESKTOP_FOLDER = os.getenv('DESKTOP_FOLDER', '../archive')  # DESKTOP_FOLDER 환경 변수에서 경로를 가져오고 없을 경우 기본 경로 설정
UPLOAD_FOLDER = './static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
GENERATED_FOLDER = './static/generated'
app.config['GENERATED_FOLDER'] = GENERATED_FOLDER

for folder in [UPLOAD_FOLDER, GENERATED_FOLDER, DESKTOP_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

selected_artists = {}
user_name = ''
result_artist = ''
upload_status = {
    'status': 'idle',
    'message': ''
}

def calculate_mbti(options_list):
    E, I = 0, 0
    N, S = 0, 0
    T, F = 0, 0
    J, P = 0, 0

    # E/I
    if options_list[0].upper() == 'A':
        E += 1
    else:
        I += 1
    if options_list[4].upper() == 'A':
        E += 1
    else:
        I += 1

    # N/S
    if options_list[1].upper() == 'A':
        N += 1
    else:
        S += 1
    if options_list[5].upper() == 'A':
        N += 1
    else:
        S += 1

    # T/F
    if options_list[2].upper() == 'A':
        T += 1
    else:
        F += 1
    if options_list[6].upper() == 'A':
        T += 1
    else:
        F += 1

    # J/P
    if options_list[3].upper() == 'A':
        J += 1
    else:
        P += 1
    if options_list[7].upper() == 'A':
        J += 1
    else:
        P += 1

    mbti = ''
    mbti += 'E' if E >= I else 'I'
    mbti += 'N' if N >= S else 'S'
    mbti += 'T' if T >= F else 'F'
    mbti += 'J' if J >= P else 'P'

    return mbti

ARTISTS = {
    '리히텐슈타인': {
        'description': '세련된 일상의 리히텐슈타인',
        'modifier': 'pop art, <lora:loy_xl-000013:1>, masterpiece,best quality, background with a dotted halftone pattern,portrait, ',
        'negative_prompt': 'lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        'steps': 150,
        'denoising_strength': 0.73,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["ENFP", "ENTP", "ESFP", "ESTP"]
    },
    '고흐': {
        'description': '감정과 열정의 섬세한 고흐',
        'modifier': 'painging, <lora:gogh_xl-000011:1>,masterpiece,best quality,Starry Night, portrait,',
        'negative_prompt': 'lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face,',
        'steps': 100,
        'denoising_strength': 0.75,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["INTJ", "INFJ", "ISTJ", "ISFJ"]
    },
    '피카소': {
        'description': '대담하고 창의적인 피카소',
        'modifier': 'illustration,style of Pablo Picasso, <lora:picasso_xl-000008:1>, masterpiece,best quality, portrait,',
        'negative_prompt': 'lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        'steps': 100,
        'denoising_strength': 0.75,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["ENTJ", "ENFJ", "ESTJ", "ESFJ"]
    },
    '르누아르': {
        'description': '낙천적이고 따뜻한 르누아르',
        'modifier': 'oil painging,style of Auguste Renoir, <lora:renoir_70_40_4:1>,masterpiece,best quality, portrait,',
        'negative_prompt': 'lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        'steps': 100,
        'denoising_strength': 0.73,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["INFP", "INTP", "ISFP", "ISTP"]
    }
}

# 특정 폴더 내의 파일들을 삭제하는 함수
def clear_folder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

# 데스크탑 폴더에서 가장 큰 카운트 값을 가져오는 함수
def get_latest_count_from_desktop():
    count_list = []
    for filename in os.listdir(DESKTOP_FOLDER):
        if filename.split('_')[0].isdigit():
            count_list.append(int(filename.split('_')[0]))
    return max(count_list) + 1 if count_list else 1

# 바탕화면 폴더에 이미지 저장 함수
def save_to_desktop(image_path, filename):
    desktop_path = os.path.join(DESKTOP_FOLDER, filename)
    shutil.copy(image_path, desktop_path)
    return desktop_path

# 이미지 파일을 base64로 인코딩하는 함수
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

# CLIP으로 이미지를 텍스트로 변환하는 함수
def clip_interrogate(image_path, clip_skip_level=1):
    start_time = time.time()
    image_base64 = encode_image_to_base64(image_path)
    interrogate_url = f"{WEBUI_URL}/sdapi/v1/interrogate"
    interrogate_data = {
        "image": f"data:image/png;base64,{image_base64}",
        "model": "clip",
        "clip_skip": clip_skip_level
    }
    response = requests.post(interrogate_url, json=interrogate_data)
    elapsed_time = time.time() - start_time
    print(f"CLIP 소요 시간: {elapsed_time:.2f} 초")

    if response.status_code != 200:
        return None
    return response.json().get('caption', '')

'''
이미지 업로드 API
사용자가 이미지를 업로드하고, 서버에 저장된 이미지의 경로를 반환합니다.
'''
@app.route('/upload-image/<name>', methods=['POST'])
def upload_image(name):
    global user_name, count, upload_status
    if not name:
        return jsonify({"error": "Missing user name"}), 400
    user_name = name 
    if 'image' not in request.files:
        return jsonify({"error": "No image file found"}), 400
    
    # 업로드 상태 초기화
    upload_status['status'] = 'uploading'
    upload_status['message'] = '이미지 업로드 중...'

    file = request.files['image']

    clear_folder(UPLOAD_FOLDER)
    clear_folder(GENERATED_FOLDER)

    count = get_latest_count_from_desktop()

    fixed_filename = f"{count}_{user_name}_original.png"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], fixed_filename)
    
    file.save(file_path)
    save_to_desktop(file_path, fixed_filename)
    
    selected_artists['image_path'] = file_path
    selected_artists['count'] = count

    file_path_for_url = backend_url + '/' + file_path.replace('./', '')

    # 업로드 완료 상태로 변경
    upload_status['status'] = 'completed'
    upload_status['message'] = '이미지 업로드 완료'
    
    return jsonify({"image_path": file_path_for_url}), 200

'''
클라이언트에서 이미지 업로드 상태를 확인하는 API.
'''
@app.route('/upload-image-status', methods=['GET'])
def get_upload_status():
    return jsonify(upload_status), 200

'''
성격 테스트 결과 전송 API
사용자의 선택을 바탕으로 성격에 해당되는 화가의 이름을 반환합니다.
'''
@app.route('/get-personality-result/<options>', methods=['POST'])
def test_result(options):
    global result_artist
    if not options:
        return jsonify({"error": "Missing options"}), 400

    options_list = list(options.upper())
    if len(options_list) != 8:
        return jsonify({"error": "Invalid number of options"}), 400

    mbti = calculate_mbti(options_list)
    print(f"Calculated MBTI: {mbti}")

    matched_artists = []

    for artist_name, artist_info in ARTISTS.items():
        condition = artist_info['condition']
        if condition(options_list):
            matched_artists.append(artist_name)

    if not matched_artists:
        return jsonify({"error": "No matching artist found"}), 400

    result_artist = matched_artists[0]

    return jsonify({"artist": result_artist, "mbti": mbti}), 200

'''
이미지 생성 및 이미지 경로 전송 API
사용자가 업로드한 이미지를 지정된 화가 스타일로 변환하고 경로를 반환합니다.
'''
@app.route('/get-generated-images', methods=['POST'])
async def generate_style_images():
    global count, result_artist

    artist_info = ARTISTS.get(result_artist)
    if not artist_info:
        return jsonify({"error": "Missing result artist"}), 400

    adorned_artist = artist_info['description']
    modifier = artist_info['modifier']
    negative_prompt = artist_info.get('negative_prompt')
    steps = artist_info.get('steps')
    denoising_strength = artist_info.get('denoising_strength')
    cfg_scale = artist_info.get('cfg_scale')

    image_path = selected_artists.get('image_path')

    if not image_path:
        return jsonify({"error": "Missing image"}), 400

    prompt = await asyncio.to_thread(clip_interrogate, image_path, clip_skip_level=1)
    if not prompt:
        return jsonify({"error": "Failed to interrogate image"}), 500

    current_count = selected_artists.get('count')
    image_base64 = encode_image_to_base64(image_path)

    async def generate_image(modifier, negative_prompt, steps, denoising_strength, cfg_scale, prompt):
        full_prompt = f"{modifier}, {prompt}"
        url = f"{WEBUI_URL}/sdapi/v1/img2img"
        headers = {"Content-Type": "application/json"}
        data = {
            "init_images": [f"data:image/png;base64,{image_base64}"],
            "prompt": full_prompt,
            "negative_prompt": negative_prompt,
            "steps": steps,
            "cfg_scale": cfg_scale,
            "denoising_strength": denoising_strength,
            "sampler_index": "Euler a",
            "batch_size": 1,
            "n_iter": 1
        }

        start_time = time.time()
        response = await asyncio.to_thread(requests.post, url, json=data, headers=headers)
        elapsed_time = time.time() - start_time
        print(f"이미지 생성 소요 시간 (수식어: {modifier}): {elapsed_time:.2f} 초")

        if response.status_code != 200:
            return None

        result = response.json()

        image_filename = f"{current_count}_{user_name}_result.png"
        generated_path = os.path.join(app.config['GENERATED_FOLDER'], image_filename)
        with open(generated_path, "wb") as f:
            f.write(base64.b64decode(result['images'][0]))

        save_to_desktop(generated_path, image_filename)

        file_path_for_url = backend_url + '/' + generated_path.replace('./', '')

        return file_path_for_url

    generated_image_url = await generate_image(modifier, negative_prompt, steps, denoising_strength, cfg_scale, prompt)

    count += 1

    return jsonify({
        "user_name": user_name,
        "artist": adorned_artist,
        "generated_image": generated_image_url,
        "qr_image": backend_url + '/static/personality-result-qr.png'
    }), 200

if __name__ == '__main__':
    try:
        print(f"Flask 백엔드 서버가 성공적으로 실행 중입니다: {backend_url}")
        print(f"Swagger API 문서를 보려면: {backend_url}/apidocs")
        app.run(debug=True, host=REACT_APP_HOST, port=PORT)
    except Exception as e:
        print(f"Flask 서버 실행 중 오류 발생: {e}")

from flask import Flask, request, jsonify
import asyncio
import os
import requests
import base64
import shutil
from flasgger import Swagger
from dotenv import load_dotenv
from datetime import datetime
import pytz
import time

load_dotenv()

app = Flask(__name__)

# Flasgger 설정
swagger = Swagger(app, template_file='./static/swagger.json')

WEBUI_URL = os.getenv('WEBUI_URL')

# 한국 시간대 설정 (Asia/Seoul)
KST = pytz.timezone('Asia/Seoul')

UPLOAD_FOLDER = './static/uploads'
GENERATED_FOLDER = './static/generated'
ARCHIVE_FOLDER = './static/archive'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['GENERATED_FOLDER'] = GENERATED_FOLDER
app.config['ARCHIVE_FOLDER'] = ARCHIVE_FOLDER

for folder in [UPLOAD_FOLDER, GENERATED_FOLDER, ARCHIVE_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

selected_artists = {}

# 보관함에서 가장 큰 카운트 값을 가져오는 함수
def get_latest_count_from_archive():
    count_list = []
    for filename in os.listdir(app.config['ARCHIVE_FOLDER']):
        if filename.split('_')[0].isdigit():
            count_list.append(int(filename.split('_')[0]))
    return max(count_list) + 1 if count_list else 1

# 이미지 파일을 base64로 인코딩하는 함수
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

# 보관함(ARCHIVE_FOLDER)에 이미지 저장 함수
def save_to_archive(image_path, filename):
    archive_path = os.path.join(app.config['ARCHIVE_FOLDER'], filename)
    shutil.copy(image_path, archive_path)
    return archive_path

# 이미지 업로드
@app.route('/upload-image', methods=['POST'])
def upload_image():
    global count
    if 'image' not in request.files:
        return jsonify({"error": "No image file found"}), 400
    file = request.files['image']

    count = get_latest_count_from_archive()

    fixed_filename = f"{count}_original.png"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], fixed_filename)
    
    file.save(file_path)
    save_to_archive(file_path, fixed_filename)
    
    selected_artists['image_path'] = file_path
    selected_artists['count'] = count
    
    return jsonify({"status": "image uploaded successfully", "image_path": file_path}), 200

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

# 이미지 변환 (비동기)
@app.route('/generate-images/<style>', methods=['POST'])
async def generate_style_images(style):
    global count
    image_path = selected_artists.get('image_path')

    if not image_path:
        return jsonify({"error": "Missing image"}), 400

    prompt = await asyncio.to_thread(clip_interrogate, image_path, clip_skip_level=1)
    if not prompt:
        return jsonify({"error": "Failed to interrogate image"}), 500

    if style == 'portrait':
        modifiers = [
            ('oil painting, style of Paul Cezanne,<lora:Paul_Cezanne:1.0>, masterpiece, best quality', '세잔'), 
            ('painting, style of Van Gogh,<lora:van_gogh:1>, masterpiece, best quality', '고흐'), 
            ('painting, style of Claude Monet,<lora:monet:1>, masterpiece, best quality', '모네')
        ]
    elif style == 'landscape':
        modifiers = [
            ('oil painting, style of Paul Cezanne,<lora:Paul_Cezanne:1.0>, masterpiece, best quality', '세잔'),
            ('painting, style of Van Gogh,<lora:van_gogh:1>, masterpiece, best quality', '고흐'),
            ('painting, style of Claude Monet,<lora:monet:1>, masterpiece, best quality', '모네')
        ]
    else:
        return jsonify({"error": "Invalid style"}), 400

    current_count = selected_artists.get('count')
    generated_images = []
    image_base64 = encode_image_to_base64(image_path)

    # 이미지 생성 함수
    async def generate_image(modifier, artist_name):
        full_prompt = f"{modifier}, {prompt}"
        url = f"{WEBUI_URL}/sdapi/v1/img2img"
        headers = {"Content-Type": "application/json"}
        data = {
            "init_images": [f"data:image/png;base64,{image_base64}"],
            "prompt": full_prompt,
            "steps": 20,
            "cfg_scale": 7,
            "denoising_strength": 0.7,
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

        image_filename = f"{current_count}_{artist_name}.png"
        generated_path = os.path.join(app.config['GENERATED_FOLDER'], image_filename)
        with open(generated_path, "wb") as f:
            f.write(base64.b64decode(result['images'][0]))

        save_to_archive(generated_path, image_filename)

        return generated_path

    tasks = [generate_image(modifier, artist_name) for modifier, artist_name in modifiers]
    generated_images = await asyncio.gather(*tasks)

    count += 1

    return jsonify({"generated_images": generated_images}), 200

# 생성된 이미지 및 업로드된 이미지 목록을 프론트엔드로 전송 (base64로 인코딩하여 JSON으로 전송)
@app.route('/get-generated-images', methods=['GET'])
def get_generated_images():
    uploaded_files = os.listdir(app.config['UPLOAD_FOLDER'])
    image_files = os.listdir(app.config['GENERATED_FOLDER'])
    image_data = []

    for img in uploaded_files:
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], img)
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            image_data.append({
                "filename": img,
                "image_base64": encoded_image,
                "type": "uploaded"
            })

    for img in image_files:
        image_path = os.path.join(app.config['GENERATED_FOLDER'], img)
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            image_data.append({
                "filename": img,
                "image_base64": encoded_image,
                "type": "generated"
            })
    
    return jsonify({"images": image_data}), 200

# 폴더 초기화 함수
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

# 각 테스트가 끝날 때 폴더 초기화
@app.route('/reset-folders', methods=['POST'])
def reset_folders():
    clear_folder(app.config['UPLOAD_FOLDER'])
    clear_folder(app.config['GENERATED_FOLDER'])
    return jsonify({"status": "Folders cleared successfully"}), 200

if __name__ == '__main__':
    try:
        print("Flask 백엔드 서버가 성공적으로 실행 중입니다: http://localhost:5000")
        print("Swagger API 문서를 보려면: http://localhost:5000/apidocs")
        app.run(debug=True, port=5000)
    except Exception as e:
        print(f"Flask 서버 실행 중 오류 발생: {e}")

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import requests
import base64
import shutil
from flasgger import Swagger
from dotenv import load_dotenv
import uuid

load_dotenv()

app = Flask(__name__)

# Flasgger 설정
swagger = Swagger(app, template_file='./static/swagger.json')

WEBUI_URL = os.getenv('WEBUI_URL')

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

# 이미지 파일을 base64로 인코딩하는 함수
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

# 보관함에 고유 이름으로 이미지 저장
def save_to_archive(image_path, group_id, image_type, count):
    filename = f"{group_id}_{image_type}_{count}.png"
    archive_path = os.path.join(app.config['ARCHIVE_FOLDER'], filename)
    shutil.copy(image_path, archive_path)
    return archive_path

# 이미지 업로드 (QR 또는 직접 촬영)
@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file found"}), 400
    file = request.files['image']
    filename = secure_filename(file.filename)
    
    # 고유한 그룹 ID 생성
    group_id = str(uuid.uuid4())
    
    # 업로드 파일을 uploads 폴더에 저장
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # 보관함 폴더에도 업로드 파일 저장
    save_to_archive(file_path, group_id, 'uploaded', 1)
    
    selected_artists['image_path'] = file_path
    selected_artists['group_id'] = group_id  # 그룹 ID 저장
    
    return jsonify({"status": "image uploaded successfully", "image_path": file_path}), 200

# CLIP으로 이미지를 텍스트로 변환하는 함수
def clip_interrogate(image_path):
    image_base64 = encode_image_to_base64(image_path)
    interrogate_url = f"{WEBUI_URL}/sdapi/v1/interrogate"
    interrogate_data = {
        "image": f"data:image/png;base64,{image_base64}",
        "model": "clip"
    }
    response = requests.post(interrogate_url, json=interrogate_data)
    if response.status_code != 200:
        return None
    return response.json()['caption']

# 기능1: 내 사진을 화가 스타일로 바꿔주는 API (인물과 풍경)
@app.route('/generate-style-images/<style>', methods=['POST'])
def generate_style_images(style):
    image_path = selected_artists.get('image_path')
    group_id = selected_artists.get('group_id')  # 업로드된 이미지의 그룹 ID 가져오기

    if not image_path or not group_id:
        return jsonify({"error": "Missing image or group ID"}), 400

    # CLIP으로 이미지 텍스트 변환
    prompt = clip_interrogate(image_path)
    if not prompt:
        return jsonify({"error": "Failed to interrogate image"}), 500

    # 인물과 풍경에 따른 수식어 리스트
    if style == 'portrait':
        modifiers = ['portrait_style1', 'portrait_style2', 'portrait_style3']
    elif style == 'landscape':
        modifiers = ['landscape_style1', 'landscape_style2', 'landscape_style3']
    else:
        return jsonify({"error": "Invalid style"}), 400

    generated_images = []
    image_base64 = encode_image_to_base64(image_path)

    image_count = 1  # 생성 이미지의 번호

    for modifier in modifiers:
        full_prompt = f"{modifier}, {prompt}"

        # 이미지 생성 API 호출
        url = f"{WEBUI_URL}/sdapi/v1/img2img"
        headers = {"Content-Type": "application/json"}
        data = {
            "init_images": [f"data:image/png;base64,{image_base64}"],
            "prompt": full_prompt,
            "steps": 20,
            "cfg_scale": 2,
            "denoising_strength": 0.75,
            "sampler_index": "Euler a",
            "batch_size": 1,
            "n_iter": 1
        }
        
        response = requests.post(url, json=data, headers=headers)
        if response.status_code != 200:
            return jsonify({"error": "Failed to generate images"}), 500

        result = response.json()

        # 생성 이미지 저장
        image_filename = f"{image_count}.png"
        generated_path = os.path.join(app.config['GENERATED_FOLDER'], image_filename)
        with open(generated_path, "wb") as f:
            f.write(base64.b64decode(result['images'][0]))

        # 보관함에 이미지 저장
        save_to_archive(generated_path, group_id, 'generated', image_count)

        generated_images.append(generated_path)
        image_count += 1

    return jsonify({"generated_images": generated_images}), 200

# 기능2: 대충 그린 그림을 해당 화가 스타일로 변환하는 API (인물과 풍경)
@app.route('/generate-enhanced-images/<style>', methods=['POST'])
def generate_enhanced_images(style):
    user_input = request.json.get('user_input')
    image_path = selected_artists.get('image_path')
    group_id = selected_artists.get('group_id')  # 업로드된 이미지의 그룹 ID 가져오기

    if not image_path or not user_input or not group_id:
        return jsonify({"error": "Missing image, user input or group ID"}), 400

    # CLIP으로 이미지 텍스트 변환
    prompt = clip_interrogate(image_path)
    if not prompt:
        return jsonify({"error": "Failed to interrogate image"}), 500

    if style == 'portrait':
        modifiers = ['portrait_style1', 'portrait_style2', 'portrait_style3']
    elif style == 'landscape':
        modifiers = ['landscape_style1', 'landscape_style2', 'landscape_style3']
    else:
        return jsonify({"error": "Invalid style"}), 400

    generated_images = []
    image_base64 = encode_image_to_base64(image_path)

    image_count = 1  # 생성 이미지의 번호

    for modifier in modifiers:
        full_prompt = f"{modifier}, {prompt}, {user_input}"

        # 이미지 생성 API 호출
        url = f"{WEBUI_URL}/sdapi/v1/img2img"
        headers = {"Content-Type": "application/json"}
        data = {
            "init_images": [f"data:image/png;base64,{image_base64}"],
            "prompt": full_prompt,
            "steps": 20,
            "cfg_scale": 2,
            "denoising_strength": 0.75,
            "sampler_index": "Euler a",
            "batch_size": 1,
            "n_iter": 1
        }
        
        response = requests.post(url, json=data, headers=headers)
        if response.status_code != 200:
            return jsonify({"error": "Failed to generate images"}), 500

        result = response.json()

        # 생성 이미지 저장
        image_filename = f"enhanced_{modifier.replace(' ', '_')}.png"
        generated_path = os.path.join(app.config['GENERATED_FOLDER'], image_filename)
        with open(generated_path, "wb") as f:
            f.write(base64.b64decode(result['images'][0]))

        # 보관함에 저장
        save_to_archive(generated_path, group_id, 'generated', image_count)

        generated_images.append(generated_path)
        image_count += 1

    return jsonify({"generated_images": generated_images}), 200

# 생성된 이미지 목록을 프론트엔드로 전송
@app.route('/get-generated-images', methods=['GET'])
def get_generated_images():
    image_files = os.listdir(app.config['GENERATED_FOLDER'])
    image_paths = [os.path.join(app.config['GENERATED_FOLDER'], img) for img in image_files]
    return jsonify({"generated_images": image_paths}), 200

# 폴더 초기화 함수
def clear_folder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)  # 파일 또는 심볼릭 링크 삭제
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)  # 디렉토리 삭제
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

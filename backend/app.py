from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import requests
import qrcode
import shutil
from flasgger import Swagger

app = Flask(__name__)

# Flasgger 설정
swagger = Swagger(app, template_file='./static/swagger.json')

UPLOAD_FOLDER = './static/uploads'
GENERATED_FOLDER = './static/generated'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['GENERATED_FOLDER'] = GENERATED_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(GENERATED_FOLDER):
    os.makedirs(GENERATED_FOLDER)

selected_artists = {}

# 카테고리 및 화가 선택
@app.route('/select-artists', methods=['POST'])
def select_artists():
    data = request.json
    category = data.get('category')
    artist1 = data.get('artist1')
    artist2 = data.get('artist2')   
    
    if not category or not artist1 or not artist2:
        return jsonify({"error": "Invalid input, missing category or artist"}), 400

    selected_artists['category'] = category
    selected_artists['artist1'] = artist1
    selected_artists['artist2'] = artist2
    
    return jsonify({"status": "success", "category": category, "artist1": artist1, "artist2": artist2}), 200

# 이미지 업로드 (QR 또는 직접 촬영)
@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file found"}), 400
    file = request.files['image']
    filename = secure_filename(file.filename)
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    selected_artists['image_path'] = file_path
    
    return jsonify({"status": "image uploaded successfully", "image_path": file_path}), 200

# 이미지 변환 및 결과 생성 (Stable Diffusion img2img API 호출)
@app.route('/generate-images', methods=['POST'])
def generate_images():
    style_intensity = request.json.get('style_intensity', 2)
    image_path = selected_artists.get('image_path')
    artist1 = selected_artists.get('artist1')
    artist2 = selected_artists.get('artist2')

    if not image_path or not artist1 or not artist2:
        return jsonify({"error": "Missing image or artist information"}), 400

    url = "http://localhost:7860/sdapi/v1/img2img"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "init_images": [image_path], 
        "prompt": f"style of {artist1}, style of {artist2}",
        "steps": 20,
        "cfg_scale": style_intensity 
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code != 200:
        return jsonify({"error": "Failed to generate images"}), 500
    
    result = response.json()
    
    return jsonify({
        "original": image_path,
        "artist1_image": result['images'][0],
        "artist2_image": result['images'][1],
        "combined_image": result['images'][2]
    }), 200

# 스타일 강도 조절
@app.route('/adjust-style', methods=['POST'])
def adjust_style():
    style_intensity = request.json.get('style_intensity', 2)
    
    return generate_images()

# QR 코드 생성 및 이미지 다운로드
@app.route('/generate-qr', methods=['POST'])
def generate_qr():
    image_url = request.json.get('image_url')
    
    if not image_url:
        return jsonify({"error": "No image URL provided"}), 400
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(image_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill='black', back_color='white')
    
    qr_code_path = os.path.join(app.config['GENERATED_FOLDER'], "qr_code.png")
    img.save(qr_code_path)
    
    return jsonify({"status": "QR code generated", "qr_code_url": qr_code_path}), 200

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

# Flask 서버 실행
if __name__ == '__main__':
    port = 5000
    swagger_url = f"http://localhost:{port}/apidocs"
    print(f"Server running on http://localhost:{port}")
    print(f"Swagger UI available at {swagger_url}")
    app.run(debug=True, port=port)

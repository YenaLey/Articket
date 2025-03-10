from flask import Blueprint, request, jsonify
import os

from app.config import (
  BACKEND_URL, 
  UPLOAD_FOLDER, GENERATED_FOLDER
)
from app.socket import socketio
from app.admin import log_progress
from app.image_utils import preprocess_image, clear_folder
from app.sd_utils import get_prompt_from_image, generate_all_artists

main_bp = Blueprint('main_bp', __name__)

selected_artists = {}
user_name = ''
selected_gender = ''

'''
이미지 업로드 API
사용자가 이미지를 업로드하고, 업로드 폴더에 저장합니다.
'''
@main_bp.route('/upload-image', methods=['POST'])
def upload_image():
    global user_name, selected_gender
    user_name = request.args.get("name")
    selected_gender = request.args.get("gender")

    if not user_name or not selected_gender or 'image' not in request.files:
        log_progress("upload image", "error", "missing required information", "error")
        return jsonify({"error": "Missing required information"}), 400

    file = request.files['image']
    
    clear_folder(UPLOAD_FOLDER)
    clear_folder(GENERATED_FOLDER)

    file_path = os.path.join(UPLOAD_FOLDER, f"{user_name}_original.png")
    file.save(file_path)

    preprocess_image(file_path)

    selected_artists['image_path'] = file_path
    original_image = BACKEND_URL + file_path.replace('./', '/')

    socketio.emit('upload_image', {'success': True, 'image_path': original_image}, to=None)

    log_progress("upload image", "completed", None, "completed", f"{user_name}, {selected_gender}, {user_name}_original.png")

    return jsonify({"image_path": original_image}), 200

'''
이미지 생성 API
모든 화가에 대한 이미지를 생성합니다.
'''
@main_bp.route('/generate-images', methods=['POST'])
def generate_images():
    global user_name, selected_gender

    if not user_name or not selected_gender:
        log_progress("generate images", "error", "User name or gender is missing", "error")
        return jsonify({"error": "User name or gender is missing"}), 400

    if 'image_path' not in selected_artists:
        log_progress("generate images", "error", "Image has not been uploaded", "error")
        return jsonify({"error": "Image has not been uploaded"}), 400

    # 우선 '시작' 이벤트를 emit
    socketio.emit('start_generate_images', {'success': True}, to=None)

    # 실제 시간 오래 걸리는 생성 로직은 백그라운드 태스크로 처리
    socketio.start_background_task(
        generate_images_task,
        user_name,
        selected_gender,
        selected_artists
    )

    return jsonify({"message": "Images generation started in the background"}), 200


def generate_images_task(user_name, selected_gender, selected_artists):
    image_path = selected_artists['image_path']
    prompt = get_prompt_from_image(image_path)

    if not prompt:
        log_progress("interrogate", "error", "Failed to get prompt from image", "error")
        socketio.emit('get_generate_images', {'error_status': True}, to=None)
        return

    log_progress("interrogate", "completed", prompt, "completed")

    all_results = generate_all_artists(user_name, selected_gender, image_path, prompt)

    if all_results is None:
        socketio.emit('get_generate_images', {'error_status': True}, to=None)
        return

    selected_artists['generated_images'] = all_results

    log_progress("generate images", "completed", None, "completed")

    socketio.emit('get_generate_images', {
        'success': True,
        'user_name': user_name,
        'original_image': BACKEND_URL + selected_artists.get('image_path').replace('./', '/'),
        'generated_image': selected_artists['generated_images']
    }, to=None)
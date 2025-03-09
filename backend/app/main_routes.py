from flask import Blueprint, request, jsonify
import os
import base64

from app.config import (
  BACKEND_URL, 
  UPLOAD_FOLDER, GENERATED_FOLDER, ARTISTS
)
from app.socket import socketio
from app.admin import log_progress
from app.image_utils import preprocess_image, encode_image_to_base64, clear_folder
from app.sd_utils import get_prompt_from_image, generate_all_artists


main_bp = Blueprint('main_bp', __name__)

selected_artists = {}
user_name = ''
selected_gender = ''


'''
이미지 업로드 API
사용자가 이미지를 업로드하고, 서버에 저장된 이미지의 경로를 반환합니다.
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
이미지 변환 시작 API
이미지 업로드 후 이 API를 호출하여 모든 화가에 대한 이미지를 생성합니다.
'''
@main_bp.route('/generate-images', methods=['POST'])
def generate_images():
    socketio.emit('start_generate_images', {'success': True}, to=None)

    global selected_artists, user_name, selected_gender

    if not user_name or not selected_gender:
        log_progress("generate images", "error", "User name or gender is missing", "error")
        return jsonify({"error": "User name or gender is missing"}), 400

    if 'image_path' not in selected_artists:
        log_progress("generate images", "error", "Image has not been uploaded", "error")
        return jsonify({"error": "Image has not been uploaded"}), 400

    image_path = selected_artists['image_path']
    prompt = get_prompt_from_image(image_path)

    if not prompt:
        log_progress("interrogate", "error", "Failed to get prompt from image", "error")
        socketio.emit('get_generate_images', {'error_status': True}, to=None)
        return jsonify({"error": "Failed to get prompt"}), 500
    else:
        log_progress("interrogate", "completed", prompt, "completed")

    def process_artist_group(artists, webui_url):
        group_results = {}
        from app.sd_utils import generate_image_with_retry
        image_base64 = encode_image_to_base64(image_path)

        for artist_name in artists:
            artist_info = ARTISTS[artist_name]
            modifier = artist_info['modifier']
            negative_prompt = artist_info['negative_prompt'].get(selected_gender, '')
            steps = artist_info['steps']
            denoising_strength = artist_info['denoising_strength']
            cfg_scale = artist_info['cfg_scale']

            if artist_name == '고흐' and selected_gender == 'male':
                modifier += 'handsome, portrait,'
            elif artist_name == '고흐' and selected_gender == 'female':
                modifier += 'pretty, portrait,'

            base64_img = generate_image_with_retry(
                webui_url,
                image_base64=image_base64,
                modifier=modifier,
                negative_prompt=negative_prompt,
                steps=steps,
                denoising_strength=denoising_strength,
                cfg_scale=cfg_scale,
                prompt=prompt,
                artist_name=artist_name
            )

            if not base64_img:
                log_progress("generate images", "error", f"Failed for {artist_name}", "error")
                socketio.emit('get_generate_images', {'error_status': True}, to=None)
                raise Exception(f"Failed to generate image for {artist_name}")

            filename = f"{user_name}_{artist_name}.png"
            save_path = os.path.join(GENERATED_FOLDER, filename)
            with open(save_path, "wb") as f:
                f.write(base64.b64decode(base64_img))

            group_results[artist_name] = {
                'file_path': save_path,
                'url': BACKEND_URL + save_path.replace('./', '/')
            }
        return group_results

    artist_keys = list(ARTISTS.keys())
    group1_artists = artist_keys[:2]
    group2_artists = artist_keys[2:]

    all_results = generate_all_artists(
        process_artist_group, group1_artists, group2_artists
    )
    if all_results is None:
        socketio.emit('get_generate_images', {'error_status': True}, to=None)
        return jsonify({"error": "Failed to generate some images"}), 500

    selected_artists['generated_images'] = all_results

    urls = []
    for artist in artist_keys:
        urls.append(selected_artists['generated_images'][artist]['url'])

    log_progress("generate images", "completed", None, "completed")

    socketio.emit('get_generate_images', {
        'success': True,
        'user_name': user_name,
        'original_image': BACKEND_URL + selected_artists.get('image_path').replace('./', '/'),
        'generated_image': urls
    }, to=None)

    return jsonify({"message": "Images generated successfully"}), 200
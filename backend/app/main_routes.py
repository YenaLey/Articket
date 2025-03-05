# app/main_routes.py
from flask import Blueprint, request, jsonify
import os
import base64
import requests
import shutil

from app.config import (
  BACKEND_URL, USE_BLIP, USE_CLIP,
  UPLOAD_FOLDER, GENERATED_FOLDER
)
from app.admin import log_progress
from app.image_utils import preprocess_image, encode_image_to_base64
from app.sd_utils import blip_interrogate, clip_interrogate, generate_all_artists


main_bp = Blueprint('main_bp', __name__)

selected_artists = {}
user_name = ''
selected_gender = ''
result_artist = ''

def clear_folder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

def get_prompt_from_image(image_path):
    """
    BLIP, CLIP, 모두 미사용 시에는 dummy prompt
    """
    if USE_BLIP:
        prompt = blip_interrogate(image_path)
        if prompt: return prompt
    if USE_CLIP:
        prompt = clip_interrogate(image_path, clip_skip_level=1)
        if prompt: return prompt
    # 둘 다 실패하거나 사용하지 않으면 dummy prompt
    return "a young girl wearing a baseball cap and a gray shirt"


def calculate_mbti(options_list):
    E, I, N, S, T, F, J, P = 0, 0, 0, 0, 0, 0, 0, 0
    E, I = (E + 1, I) if options_list[0].upper() == 'A' else (E, I + 1)
    E, I = (E + 1, I) if options_list[6].upper() == 'A' else (E, I + 1)
    N, S = (N + 1, S) if options_list[2].upper() == 'A' else (N, S + 1)
    N, S = (N + 1, S) if options_list[3].upper() == 'A' else (N, S + 1)
    T, F = (T + 1, F) if options_list[4].upper() == 'A' else (T, F + 1)
    T, F = (T + 1, F) if options_list[7].upper() == 'A' else (T, F + 1)
    J, P = (J + 1, P) if options_list[1].upper() == 'A' else (J, P + 1)
    J, P = (J + 1, P) if options_list[5].upper() == 'A' else (J, P + 1)

    return ''.join([
        'E' if E >= I else 'I',
        'N' if N >= S else 'S',
        'T' if T >= F else 'F',
        'J' if J >= P else 'P'
    ])

ARTISTS = {
    '리히텐슈타인': {
        'description': '세련된 일상의 리히텐슈타인',
        'modifier': 'pop art,<lora:loy2_xl:1>,masterpiece,best quality, background with a Ben-Day dots,portrait, artwork in the style of Roy Lichtenstein, pop art, bold primary colors, thick black outlines, comic book style, retro aesthetica, ',
        'negative_prompt': {
            'male': 'feminine,lipstick,red lips,makeup,beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 150,
        'denoising_strength': 0.7,
        'cfg_scale': 7,
        'condition': lambda opts: calculate_mbti(opts) in ["ENFP", "ESFP", "ESTP", "ENTP"]
    },
    '고흐': {
        'description': '감정과 열정의 섬세한 고흐',
        'modifier': 'painting,<lora:gogh_xl:1>,masterpiece,best quality,Starry Night of Gogh,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face',
        },
        'steps': 100,
        'denoising_strength': 0.65,
        'cfg_scale': 7,
        'condition': lambda opts: calculate_mbti(opts) in ["INFJ", "INFP", "INTJ", "INTP"]
    },
    '피카소': {
        'description': '대담하고 창의적인 피카소',
        'modifier': 'illustration,style of Pablo Picasso,<lora:picasso_xl:0.6>,masterpiece,best quality, portrait,cubism,abstract shapes,fragmented forms,bold lines,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 120,
        'denoising_strength': 0.66,
        'cfg_scale': 7,
        'condition': lambda opts: calculate_mbti(opts) in ["ENTJ", "ISTJ", "ESTJ", "ISTP"]
    },
    '르누아르': {
        'description': '낙천적이고 따뜻한 르누아르',
        'modifier': 'oil painting,style of Auguste Renoir,  <lora:renior2_xl:0.6>,masterpiece,best quality, portrait,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 100,
        'denoising_strength': 0.63,
        'cfg_scale': 7,
        'condition': lambda opts: calculate_mbti(opts) in ["ISFJ", "ESFJ", "ISFP", "ENFJ"]
    }
}

@main_bp.route('/upload-image/', methods=['POST'])
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
    original_image = BACKEND_URL + '/' + file_path.replace('./', '')

    log_progress("upload image", "completed", None, "completed", f"{user_name}, {selected_gender}, {user_name}_original.png")

    return jsonify({"image_path": original_image}), 200

@main_bp.route('/generate-images', methods=['POST'])
def generate_images():
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
                raise Exception(f"Failed to generate image for {artist_name}")

            filename = f"{user_name}_{artist_name}.png"
            save_path = os.path.join(GENERATED_FOLDER, filename)
            with open(save_path, "wb") as f:
                f.write(base64.b64decode(base64_img))

            group_results[artist_name] = {
                'file_path': save_path,
                'url': BACKEND_URL + '/' + save_path.replace('./', '')
            }
        return group_results

    artist_keys = list(ARTISTS.keys())
    group1_artists = artist_keys[:2]
    group2_artists = artist_keys[2:]

    all_results = generate_all_artists(
        process_artist_group, group1_artists, group2_artists
    )
    if all_results is None:
        return jsonify({"error": "Failed to generate some images"}), 500

    selected_artists['generated_images'] = all_results

    log_progress("generate images", "completed", None, "completed")
    return jsonify({"message": "Images generated successfully"}), 200

@main_bp.route('/get-personality-result/<options>', methods=['POST'])
def test_result(options):
    global result_artist
    if len(options) != 8:
        log_progress("get personality result", "error", "invalid number of options", "error")
        return jsonify({"error": "Invalid number of options"}), 400
    
    result_artist = next(
        (artist for artist, info in ARTISTS.items() if info['condition'](list(options.upper()))),
        None
    )

    if result_artist:
        log_progress("get personality result", "completed", None, "completed", f"{options}, {result_artist}")
        return jsonify({"artist": result_artist}), 200
    else:
        return jsonify({"error": "No matching artist found"}), 400

@main_bp.route('/get-generated-images', methods=['POST'])
def generate_style_images():
    global result_artist

    if result_artist == "":
        log_progress("get generated images", "error", "result-artist have not been selected", "error")
        return jsonify({"error": "result-artist have not been selected"}), 400

    if 'generated_images' not in selected_artists:
        log_progress("get generated images", "error", "Images have not been generated", "error")
        return jsonify({"error": "Images have not been generated"}), 400

    urls = []
    artist_keys = list(ARTISTS.keys())
    for artist in artist_keys:
        if artist not in selected_artists['generated_images']:
            return jsonify({"error": f"Image for artist {artist} not found"}), 500
        urls.append(selected_artists['generated_images'][artist]['url'])

    return jsonify({
        "user_name": user_name,
        "original_image": BACKEND_URL + '/' + selected_artists.get('image_path').replace('./', ''),
        "generated_image": urls,
    }), 200

@main_bp.route('/emit-options', methods=['POST'])
def emit_options():
    data = request.get_json()
    options = data.get('options', [])
    if not isinstance(options, list):
        return jsonify({"error": "Options must be provided as a list"}), 400
    return jsonify({"message": "Options emitted successfully", "options": options}), 200

@main_bp.route('/emit_index', methods=['POST'])
def emit_index():
    data = request.get_json()
    if 'index_status' not in data:
        return jsonify({"error": "index_status is required"}), 400
    index_status = data['index_status']
    if not isinstance(index_status, int):
        return jsonify({"error": "index_status must be an integer"}), 400
    return jsonify({"message": "index_data emitted successfully", "index_status": index_status}), 200

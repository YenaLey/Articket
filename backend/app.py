import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, abort
from flasgger import Swagger, swag_from
from flask_cors import CORS
from flask_socketio import SocketIO
import os
import shutil
import base64
import requests
import time
from flasgger import Swagger
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A5
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib import colors 
from io import BytesIO
from admin import admin, init_socketio, log_progress

"""
✅ Railway 사용 여부
"""
load_dotenv() # Railway 사용
# load_dotenv(dotenv_path='../frontend/.env') # Railway 미사용

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

init_socketio(socketio)
app.register_blueprint(admin)

@app.route('/')
def index():
    return 'CORS 설정 완료'

swagger = Swagger(app, template_file='./static/swagger.json')

BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL')
backend_url = f"{BACKEND_URL}"

# Stable Diffusion WebUI URL 설정
WEBUI_URL1 = os.getenv('WEBUI_URL1')
WEBUI_URL2 = os.getenv('WEBUI_URL2')

HOST = os.getenv('HOST')

# BLIP API URL 설정 (환경 변수에서 가져옴)
BLIP_URL = os.getenv('BLIP_URL')

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
current_count = 0
selected_gender = ''

def calculate_mbti(options_list):
    E, I, N, S, T, F, J, P = 0, 0, 0, 0, 0, 0, 0, 0
    # 조건을 통한 성향 카운트
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
        'condition': lambda options_list: calculate_mbti(options_list) in ["ENFP", "ESFP", "ESTP", "ENTP"]
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
        'condition': lambda options_list: calculate_mbti(options_list) in ["INFJ", "INFP", "INTJ", "INTP"]
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
        'condition': lambda options_list: calculate_mbti(options_list) in ["ENTJ", "ISTJ", "ESTJ", "ISTP"]
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
        'condition': lambda options_list: calculate_mbti(options_list) in ["ISFJ", "ESFJ", "ISFP", "ENFJ"]
    }
}

MATCHING_ARTISTS = {
    '피카소': {'good': '르누아르', 'bad': '리히텐슈타인', 'neutral': '고흐'},
    '고흐': {'good': '리히텐슈타인', 'bad': '피카소', 'neutral': '르누아르'},
    '르누아르': {'good': '피카소', 'bad': '고흐', 'neutral': '리히텐슈타인'},
    '리히텐슈타인': {'good': '고흐', 'bad': '르누아르', 'neutral': '피카소'},
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

# BLIP으로 이미지를 텍스트로 변환하는 함수
def blip_interrogate(image_path):

    # ##clip
    # image_base64 = encode_image_to_base64(image_path)
    # interrogate_url = f"{WEBUI_URL1}/sdapi/v1/interrogate"
    # interrogate_data = {
    #     "image": f"data:image/png;base64,{image_base64}",
    #     "model": "clip",
    #     "clip_skip": 1
    # }
    # response = requests.post(interrogate_url, json=interrogate_data)
    # if response.status_code != 200:
    #     return None
    # return response.json().get('caption', '')

    #blip
    interrogate_url = f"{BLIP_URL}/generate_caption"
    response = requests.post(interrogate_url, files={"file": open(image_path, "rb")})
    
    if response.status_code == 200:
        print("BLIP interrogate request successful!")
        return response.json().get('caption', '')
    else:
        print(f"BLIP interrogate request failed with status code: {response.status_code}")
        return None

def generate_image(webui_url, image_base64, modifier, negative_prompt, steps, denoising_strength, cfg_scale, prompt, artist_name):
    data = {
        "init_images": [f"data:image/png;base64, {image_base64}"],
        "prompt": f"{modifier}, {prompt}",
        "negative_prompt": negative_prompt,
        "steps": steps,
        "cfg_scale": cfg_scale,
        "denoising_strength": denoising_strength,
        "sampler_name": "DPM++ 2M Karras",
        "batch_size": 1,
        "n_iter": 1,
        "width": 1024,
        "height": 1024,
        "restore_faces": True,
        "tiling": False,
        "seed": -1
    }

    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            print(f"Attempt {attempt + 1}: Sending request to {webui_url}")
            log_progress(f"{artist_name}'s img2img", f"attempt{attempt+1}", None, "call")
            response = requests.post(
                f"{webui_url}/sdapi/v1/img2img",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=600
            )
            response.raise_for_status()
            response_data = response.json()

            image_filename = f"{current_count}_{user_name}_{artist_name}.png"
            generated_path = os.path.join(app.config['GENERATED_FOLDER'], image_filename)

            with open(generated_path, "wb") as f:
                f.write(base64.b64decode(response_data['images'][0]))

            save_to_desktop(generated_path, image_filename)
            log_progress(f"{artist_name}'s img2img", "completed", None, "completed")
            result = {
                'file_path': generated_path,
                'url': backend_url + '/' + generated_path.replace('./', '')
            }
            return result
        
        except requests.exceptions.RequestException as e:
            error_message = f"HTTP Error: {e.response.status_code} - {e.response.reason}" if e.response else str(e)
            log_progress(f"{artist_name}'s img2img", "error", error_message, "error")
            print(f"Request failed: {error_message}")
            if attempt == MAX_RETRIES - 1:
                return None
        except (ValueError, IndexError) as e:
            error_message = f"Response Parsing Error: {str(e)}"
            log_progress(f"{artist_name}'s img2img", "error", error_message, "error")
            print(f"Error decoding response: {error_message}")
            return None

def generate_image_with_retry(webui_url, *args, retries=3, delay=5, **kwargs):
    for attempt in range(retries):
        try:
            return generate_image(webui_url, *args, **kwargs)
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(delay)
    return None

pdfmetrics.registerFont(TTFont('Pretendard', './font/Pretendard-Thin.ttf'))

def edit_pdf_template(template_path, user_name, urls, save_path):
    try:
        reader = PdfReader(template_path)
        writer = PdfWriter()

        page_width, page_height = A5

        img_width = [137, 130, 130]
        img_height = [143, 130, 130]

        for page_number, page in enumerate(reader.pages):
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=(page_width, page_height))

            can.setFont("Pretendard", 9)
            can.setFillColor(colors.white)
            can.drawString(275, 428, f"{user_name}")

            x_position = [14, 242, 48]
            y_position = [426, 227, 42]
            for idx, img_url in enumerate(urls):
                if idx >= 3:
                    break
                try:
                    image_url = img_url.replace('\\', '/')
                    response = requests.get(image_url, stream=True)
                    response.raise_for_status()
                    img = ImageReader(response.raw)

                    can.drawImage(img, x_position[idx], y_position[idx], img_width[idx], img_height[idx])
                except Exception as e:
                    print(f"Error adding image {img_url}: {e}")

            can.save()
            packet.seek(0)

            overlay_reader = PdfReader(packet)
            overlay_page = overlay_reader.pages[0]
            page.merge_page(overlay_page)

            writer.add_page(page)

        with open(save_path, "wb") as output_pdf:
            writer.write(output_pdf)

        print(f"PDF saved to {save_path}")
        return {"message": "PDF generated successfully"}

    except Exception as e:
        print(f"Error editing PDF template: {e}")
        return {"error": "Failed to edit PDF template"}

'''
이미지 업로드 API
사용자가 이미지를 업로드하고, 서버에 저장된 이미지의 경로를 반환합니다.
'''
@app.route('/upload-image/', methods=['POST'])
def upload_image():
    global user_name, current_count, selected_gender
    user_name = request.args.get("name")
    selected_gender = request.args.get("gender")
    
    if not user_name or not selected_gender or 'image' not in request.files:
        log_progress("upload image", "error", "missing required information", "error")
        return jsonify({"error": "Missing required information"}), 400

    file = request.files['image']
    clear_folder(UPLOAD_FOLDER)
    clear_folder(GENERATED_FOLDER)
    current_count = get_latest_count_from_desktop()
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{current_count}_{user_name}_original.png")
    file.save(file_path)
    save_to_desktop(file_path, f"{current_count}_{user_name}_original.png")
    selected_artists['image_path'] = file_path
    original_image = backend_url + '/' + file_path.replace('./', '')

    socketio.emit('operation_status', {'success': True, 'image_path': original_image})
    socketio.emit('index_data', {'index_status': 0})

    log_progress("upload image", "completed", None, "completed", f"{user_name}, {selected_gender}, {current_count}_{user_name}_original.png")

    return jsonify({"image_path": original_image}), 200

'''
이미지 변환 시작 API
이미지 업로드 후 이 API를 호출하여 모든 화가에 대한 이미지를 생성합니다.
'''
@app.route('/generate-images', methods=['POST'])
def generate_images():
    global selected_artists, user_name, selected_gender, current_count

    if not selected_gender or not user_name:
        log_progress("generate images", "error", "User name or gender is missing", "error")
        return jsonify({"error": "User name or gender is missing"}), 400

    if 'image_path' not in selected_artists:
        log_progress("generate images", "error", "Image has not been uploaded", "error")
        return jsonify({"error": "Image has not been uploaded"}), 400

    image_path = selected_artists['image_path']

    image_base64 = encode_image_to_base64(image_path)

    """
    ✅ BLIP_URL 사용 여부 확인
    """
    prompt = "a young girl wearing a baseball cap and a gray shirt" ## BLIP_URL 미사용
    # prompt = blip_interrogate(image_path) ## BLIP_URL 사용

    if not prompt:
        log_progress("blip", "error", None, "error")
        socketio.emit('operation_status', {'error_status': True})
        return jsonify({"error": "Failed to interrogate image"}), 500
    else:
        log_progress("blip", "completed", None, "completed", f"{prompt}")

    selected_artists['generated_images'] = {}

    # 화가를 두 그룹으로 나눕니다.
    group1_artists = ['리히텐슈타인', '고흐']
    group2_artists = ['피카소', '르누아르']

    # 각 그룹을 처리하는 함수
    def process_artist_group(artists, webui_url):
        group_results = {}
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
            result = generate_image_with_retry(
                webui_url,
                image_base64,
                modifier,
                negative_prompt,
                steps,
                denoising_strength,
                cfg_scale,
                prompt,
                artist_name
            )
            if result is None:
                log_progress("generate images", "error", f"Failed to generate image for {artist_name}", "error")
                socketio.emit('operation_status', {'error_status': True})
                raise Exception(f"Failed to generate image for {artist_name}")
            group_results[artist_name] = result
        return group_results

    """
    ✅ WEBUI_URL 사용 여부 확인
    """
    ## WEBUI_URL 미사용
    selected_artists['generated_images'] = {
        '리히텐슈타인': {'file_path': './static/dummy/2_후추_리히텐슈타인.png', 'url': backend_url + '/static/dummy/2_후추_리히텐슈타인.png'},
        '고흐': {'file_path': './static/dummy/2_후추_고흐.png', 'url': backend_url + '/static/dummy/2_후추_고흐.png'},
        '피카소': {'file_path': './static/dummy/2_후추_피카소.png', 'url': backend_url + '/static/dummy/2_후추_피카소.png'},
        '르누아르': {'file_path': './static/dummy/2_후추_르누아르.png', 'url': backend_url + '/static/dummy/2_후추_르누아르.png'}
    }

    ## WEBUI_URL 사용
    ## ThreadPoolExecutor를 사용하여 두 그룹을 병렬로 처리합니다.
    # with ThreadPoolExecutor(max_workers=2) as executor:
    #     futures = []
    #     futures.append(executor.submit(process_artist_group, group1_artists, WEBUI_URL1))
    #     futures.append(executor.submit(process_artist_group, group2_artists, WEBUI_URL2))
    #     for future in as_completed(futures):
    #         try:
    #             group_results = future.result()
    #             selected_artists['generated_images'].update(group_results)
    #         except Exception as e:
    #             log_progress("generate images", "error", str(e), "error")
    #             return jsonify({"error": str(e)}), 500

    log_progress("generate images", "completed", None, "completed")
    socketio.emit('operation_status', {'image_success': True})

    return jsonify({"message": "Images generated successfully (Dummy Data Used)"}), 200

'''
백엔드에서 프론트엔드로 성공 여부를 알리기 위해 호출하는 API.
'''
@app.route('/select-option', methods=['GET'])
def select_option():
    socketio.emit('operation_status', {'success': True})
    return '', 200

'''
성격 테스트에서 옵션을 선택할 때 호출하는 API.
'''
@app.route('/emit-options', methods=['POST'])
def emit_options():
    data = request.get_json()
    options = data.get('options', [])
    
    if not isinstance(options, list):
        return jsonify({"error": "Options must be provided as a list"}), 400

    socketio.emit('options_data', {'options': options})
    return jsonify({"message": "Options emitted successfully", "options": options}), 200

'''
성격 테스트에서 인덱스를 변경할 때 호출하는 API.
'''
@app.route('/emit_index', methods=['POST'])
def emit_index():
    data = request.get_json()
    if 'index_status' not in data:
        return jsonify({"error": "index_status is required"}), 400

    index_status = data['index_status']
    if not isinstance(index_status, int):
        return jsonify({"error": "index_status must be an integer"}), 400

    socketio.emit('index_data', {'index_status': index_status})

    return jsonify({"message": "index_data emitted successfully", "index_status": index_status}), 200

'''
성격 테스트 결과 전송 API
사용자의 선택을 바탕으로 성격에 해당되는 화가의 이름을 반환합니다.
'''
@app.route('/get-personality-result/<options>', methods=['POST'])
def test_result(options):
    global result_artist
    if len(options) != 8:
        log_progress("get personality result", "error", "invalid number of options", "error")
        return jsonify({"error": "Invalid number of options"}), 400
    
    result_artist = next((artist for artist, info in ARTISTS.items() if info['condition'](list(options.upper()))), None)
    
    if result_artist:
        socketio.emit('operation_status', {'success': True})
        log_progress("get personality result", "completed", None, "completed", f"{options}, {result_artist}")

        return jsonify({"artist": result_artist, "mbti": calculate_mbti(list(options.upper()))}), 200
    else:
        return jsonify({"error": "No matching artist found"}), 400

'''
해당 화가에 대한 티켓 pdf를 만들고 사진들 경로를 반환하는 API
'''
@app.route('/get-generated-images', methods=['POST'])
def generate_style_images():

    global result_artist

    if result_artist == "":
        log_progress("get generated images", "error", "result-artist have not been selected", "error")
        return jsonify({"error": "result-artist have not been selected"}), 400

    if 'generated_images' not in selected_artists:
        log_progress("get generated images", "error", "Images have not been generated", "error")
        return jsonify({"error": "Images have not been generated"}), 400

    matching_artists = [result_artist, MATCHING_ARTISTS[result_artist]['good'], MATCHING_ARTISTS[result_artist]['bad']]
    urls = []

    for artist in ['피카소','르누아르','리히텐슈타인','고흐']:
        artist_result = selected_artists['generated_images'].get(artist)
        if artist_result is None:
            log_progress("get generated images", "error", f"Image for artist {artist} not found", "error")
            return jsonify({"error": f"Image for artist {artist} not found"}), 500
        image_url = artist_result['url']
        urls.append(image_url)

    template_path = f'./static/{result_artist}_티켓_템플릿.pdf'
    save_path = os.path.join(DESKTOP_FOLDER, f"{current_count}_{user_name}_티켓.pdf")

    if not os.path.exists(template_path):
        log_progress("get ticket pdf", "error", f"Template file for {result_artist} not found", "error")
    else:
        pdf_result = edit_pdf_template(template_path, user_name, urls, save_path)
        if "error" in pdf_result:   
            log_progress("get ticket pdf", "error", f"Failed to generate PDF", "error")
        else:
            log_progress(f"get {user_name}'s ticket pdf", "completed", None, "completed")

    socketio.emit('operation_status', {'success': True})

    return jsonify({
        "user_name": user_name,
        "artist": ARTISTS.get(result_artist)['description'],
        "matching_artists": {
            "good": ARTISTS[MATCHING_ARTISTS[result_artist]['good']]['description'],
            "bad": ARTISTS[MATCHING_ARTISTS[result_artist]['bad']]['description']
        },
        "original_image": backend_url + '/' + selected_artists.get('image_path').replace('./', ''),
        "generated_image": urls,
        "qr_image": backend_url + '/static/personality-result-qr.png'
    }), 200

'''
매칭된 화가들의 이미지를 Base64 문자열과 설명(description)으로 반환하는 API
'''
@app.route('/get-matching-images', methods=['GET'])
def get_matching_images():
    global result_artist

    if result_artist == "":
        log_progress("get matching images", "error", "Result artist has not been selected", "error")
        return jsonify({"error": "Result artist has not been selected"}), 400

    if 'generated_images' not in selected_artists:
        log_progress("get matching images", "error", "Images have not been generated", "error")
        return jsonify({"error": "Images have not been generated"}), 400

    try:
        matching_artists = {
            "match": result_artist,
            "good": MATCHING_ARTISTS[result_artist]['good'],
            "bad": MATCHING_ARTISTS[result_artist]['bad'],
            "neutral": MATCHING_ARTISTS[result_artist]['neutral']
        }

        matching_images = {}
        for key, artist_name in matching_artists.items():
            artist_result = selected_artists['generated_images'].get(artist_name)
            if artist_result is None:
                log_progress("get matching images", "error", f"Image for artist {artist_name} not found", "error")
                return jsonify({"error": f"Image for artist {artist_name} not found"}), 500
            image_path = artist_result['file_path']

            matching_images[key] = {
                "description": ARTISTS[artist_name]['description'],
                "image_base64": encode_image_to_base64(image_path)
            }

        log_progress("get matching images", "completed", None, "completed")
        return jsonify({"matching_artists": matching_images}), 200

    except Exception as e:
        log_progress("get matching images", "error", f"Error occurred: {str(e)}", "error")
        return jsonify({"error": "An error occurred while generating matching images"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Railway에서는 PORT 환경변수를 사용해야 함
    host = os.environ.get("HOST", "0.0.0.0")  # 기본 HOST 설정

    with app.app_context():
        try:
            print(f"Flask 백엔드 서버 실행 중: {backend_url}")
            print(f"Swagger API 문서: {backend_url}/apidocs")
            print(f"관리자 페이지: {backend_url}/admin")

            # Gunicorn을 사용하지 않는 경우
            socketio.run(app, debug=True, host=host, port=port, use_reloader=False)

        except Exception as e:
            log_progress("server", "error", f"Server encountered an exception: {str(e)}", "error")
            print(f"Flask 서버 실행 중 오류 발생: {e}")

        finally:
            log_progress("server_shutdown", "error", "Server is shutting down", "error")

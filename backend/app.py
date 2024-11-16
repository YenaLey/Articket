from flask import Flask, request, jsonify, abort
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

load_dotenv(dotenv_path='../frontend/.env')

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return 'CORS 설정 완료'

swagger = Swagger(app, template_file='./static/swagger.json')

REACT_APP_HOST = os.getenv('HOST')
PORT = 5000
backend_url = f"http://{REACT_APP_HOST}:{PORT}"

# Stable Diffusion WebUI URL 설정
WEBUI_URLS = [
    os.getenv('WEBUI_URL_1'),
    os.getenv('WEBUI_URL_2'),
    os.getenv('WEBUI_URL_3')
]

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
upload_status = {
    'status': 'idle',
    'message': ''
}   
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
        'denoising_strength': 0.76,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["ENFP", "ESFP", "ESTP", "ENTP"]
    },
    '고흐': {
        'description': '감정과 열정의 섬세한 고흐',
        'modifier': 'painging,<lora:gogh_xl:1>,masterpiece,best quality,Starry Night of gogh,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face',
        },
        'steps': 100,
        'denoising_strength': 0.75,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["INFJ", "INFP", "INTJ", "INTP"]
    },
    '피카소': {
        'description': '대담하고 창의적인 피카소',
        'modifier': 'illustration,style of Pablo Picasso,<lora:picasso_xl:0.7>,masterpiece,best quality, portrait,cubism,abstract shapes,fragmented forms,bold lines,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 150,
        'denoising_strength': 0.66,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["ENTJ", "ISTJ", "ESTJ", "ISTP"]
    },
    '르누아르': {
        'description': '낙천적이고 따뜻한 르누아르',
        'modifier': 'oil painging,style of Auguste Renoir, <lora:renior2_xl:1>,masterpiece,best quality, portrait,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 100,
        'denoising_strength': 0.67,
        'cfg_scale': 7,
        'condition': lambda options_list: calculate_mbti(options_list) in ["ISFJ", "ESFJ", "ISFP", "ENFJ"]
    }
}

MATCHING_ARTISTS = {
    '피카소': {'good': '르누아르', 'bad': '리히텐슈타인'},
    '고흐': {'good': '리히텐슈타인', 'bad': '피카소'},
    '르누아르': {'good': '피카소', 'bad': '고흐'},
    '리히텐슈타인': {'good': '고흐', 'bad': '르누아르'},
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

    ## clip
    # image_base64 = encode_image_to_base64(image_path)
    # interrogate_url = f"{WEBUI_URLS[0]}/sdapi/v1/interrogate"
    # interrogate_data = {"image": f"data:image/png;base64,{image_base64}", "model": "clip", "clip_skip": 1}
    # response = requests.post(interrogate_url, json=interrogate_data, headers={"Content-Type": "application/json"})
    # if response.status_code == 200:
    #     print("CLIP interrogate request successful!")
    #     return response.json().get('caption', '')
    # else:
    #     print(f"CLIP interrogate request failed with status code: {response.status_code}")
    #     return None

    ## blip
    interrogate_url = f"{BLIP_URL}/generate_caption"
    response = requests.post(interrogate_url, files={"file": open(image_path, "rb")})

    if response.status_code == 200:
        print("CLIP interrogate request successful!")
        return response.json().get('caption', '')
    else:
        print(f"CLIP interrogate request failed with status code: {response.status_code}")
        return None

    ## blip
    # interrogate_url = f"{BLIP_URL}/generate_caption"
    # response = requests.post(interrogate_url, files={"file": open(image_path, "rb")})
    # if response.status_code == 200:
    #     print("BLIP interrogate request successful!")
    #     return response.json().get('caption', '')
    # else:
    #     print(f"BLIP interrogate request failed with status code: {response.status_code}")
    #     return None

def generate_image(image_base64, modifier, negative_prompt, steps, denoising_strength, cfg_scale, prompt, result_number, url_index):
    webui_url = WEBUI_URLS[url_index % len(WEBUI_URLS)]
    data = {
        "init_images": [f"data:image/png;base64, {image_base64}"],
        "prompt": f"{modifier}, {prompt}",
        "negative_prompt": negative_prompt,
        "steps": steps,
        "cfg_scale": cfg_scale,
        "denoising_strength": denoising_strength,
        "sampler_index": "Euler a",
        "batch_size": 1,
        "n_iter": 1,
        "width": 1024,
        "height": 1024,
    }

    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            print(f"Attempt {attempt + 1}: Sending request to {webui_url}")
            response = requests.post(
                f"{webui_url}/sdapi/v1/img2img",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=600
            )
            response.raise_for_status()
            response_data = response.json()

            image_filename = f"{current_count}_{user_name}_result{result_number}.png"
            generated_path = os.path.join(app.config['GENERATED_FOLDER'], image_filename)

            with open(generated_path, "wb") as f:
                f.write(base64.b64decode(response_data['images'][0]))

            save_to_desktop(generated_path, image_filename)
            return backend_url + '/' + generated_path.replace('./', '')
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            if attempt == MAX_RETRIES - 1:
                return None
        except (ValueError, IndexError) as e:
            print(f"Error decoding response: {response.text}")
            return None

def generate_image_with_retry(*args, retries=3, delay=5, **kwargs):
    for attempt in range(retries):
        try:
            return generate_image(*args, **kwargs)
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
                    response = requests.get(img_url, stream=True)
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
        return jsonify({"error": "Missing required information"}), 400

    file = request.files['image']
    clear_folder(UPLOAD_FOLDER)
    clear_folder(GENERATED_FOLDER)
    current_count = get_latest_count_from_desktop()
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{current_count}_{user_name}_original.png")
    file.save(file_path)
    save_to_desktop(file_path, f"{current_count}_{user_name}_original.png")
    selected_artists['image_path'] = file_path
    upload_status.update({'status': 'completed', 'message': '이미지 업로드 완료'})
    original_image = backend_url + '/' + file_path.replace('./', '')
    socketio.emit('operation_status', {'success': True, 'image_path': original_image})
    return jsonify({"image_path": original_image}), 200


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
성격 테스트 결과 전송 API
사용자의 선택을 바탕으로 성격에 해당되는 화가의 이름을 반환합니다.
'''
@app.route('/get-personality-result/<options>', methods=['POST'])
def test_result(options):
    global result_artist
    if len(options) != 8:
        return jsonify({"error": "Invalid number of options"}), 400
    result_artist = next((artist for artist, info in ARTISTS.items() if info['condition'](list(options.upper()))), None)
    
    if result_artist:
        socketio.emit('operation_status', {'success': True})
        return jsonify({"artist": result_artist, "mbti": calculate_mbti(list(options.upper()))}), 200
    else:
        return jsonify({"error": "No matching artist found"}), 400

'''
해당 화가의 스타일로 변환된 이미지를 생성 후 저장하는 API
'''
@app.route('/get-generated-images', methods=['POST'])
def generate_style_images():
    global result_artist, selected_gender
    if not selected_gender:
        return jsonify({"error": "Gender information is missing"}), 400

    if not (image_path := selected_artists.get('image_path')) or not (artist_info := ARTISTS.get(result_artist)):
        return jsonify({"error": "Missing image or result artist"}), 400

    prompt = blip_interrogate(image_path)
    print(f"Generated caption: {prompt}")
    image_base64 = encode_image_to_base64(image_path)
    if not prompt:
        return jsonify({"error": "Failed to interrogate image"}), 500

    matching_artists = [result_artist, MATCHING_ARTISTS[result_artist]['good'], MATCHING_ARTISTS[result_artist]['bad']]
    urls = [None] * len(matching_artists)
    error_occurred = False

    ## 병렬 처리
    # with ThreadPoolExecutor() as executor:
    #     futures = {
    #         executor.submit(
    #             generate_image_with_retry,
    #             image_base64,
    #             ARTISTS[artist]['modifier'] + (
    #                 'handsome, portrait,' if artist == '고흐' and selected_gender == 'male' else
    #                 'pretty, portrait,' if artist == '고흐' and selected_gender == 'female' else ''
    #             ),
    #             ARTISTS[artist]['negative_prompt'].get(selected_gender, ''),
    #             ARTISTS[artist]['steps'],
    #             ARTISTS[artist]['denoising_strength'],
    #             ARTISTS[artist]['cfg_scale'],
    #             prompt,
    #             idx + 1,
    #             idx % len(WEBUI_URLS)
    #         )
    #         if result is None:
    #             error_occurred = True
    #         urls[idx] = result

    ## 순차적으로 처리
    for idx, artist in enumerate(matching_artists):
        try:
            result = generate_image_with_retry(
                image_base64,
                ARTISTS[artist]['modifier'] + (
                    'handsome, portrait,' if artist == '고흐' and selected_gender == 'male' else
                    'pretty, portrait,' if artist == '고흐' and selected_gender == 'female' else ''
                ),
                ARTISTS[artist]['negative_prompt'].get(selected_gender, ''),
                ARTISTS[artist]['steps'],
                ARTISTS[artist]['denoising_strength'],
                ARTISTS[artist]['cfg_scale'],
                prompt,
                idx + 1,
                idx % len(WEBUI_URLS)
            )
            if result is None:
                error_occurred = True
                break
            urls[idx] = result
        except Exception as e:
            print(f"Error generating image for artist {artist}: {e}")
            error_occurred = True
            break

    if error_occurred:
        return jsonify({"error": "Failed to generate one or more images"}), 500
    
    good = MATCHING_ARTISTS[result_artist]['good']
    bad = MATCHING_ARTISTS[result_artist]['bad']
    matching_artists = {'good': ARTISTS[good]['description'], 'bad': ARTISTS[bad]['description']}

    template_path = f'./static/{result_artist}_티켓_템플릿.pdf'
    save_path = os.path.join(DESKTOP_FOLDER, f"{current_count}_{user_name}_티켓.pdf")

    if not os.path.exists(template_path):
        return jsonify({"error": f"Template file for {result_artist} not found"}), 500

    pdf_result = edit_pdf_template(template_path, user_name, urls, save_path)

    if "error" in pdf_result:
        return jsonify({"error": "Failed to generate PDF"}), 500
    
    socketio.emit('operation_status', {'success': True})
    return jsonify({
        "user_name": user_name,
        "artist": artist_info['description'],
        "matching_artists": matching_artists,
        "original_image" : backend_url + '/' + selected_artists.get('image_path').replace('./', ''),
        "generated_image": urls,
        "qr_image": backend_url + '/static/personality-result-qr.png'
    }), 200

if __name__ == '__main__':
    try:
        print(f"Flask 백엔드 서버가 성공적으로 실행 중입니다: {backend_url}")
        print(f"Swagger API 문서를 보려면: {backend_url}/apidocs")
        app.run(debug=True, host=REACT_APP_HOST, port=PORT)
    except Exception as e:
        print(f"Flask 서버 실행 중 오류 발생: {e}")

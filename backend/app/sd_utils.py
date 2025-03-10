import requests
import time
import base64
import os
from concurrent.futures import ThreadPoolExecutor

from app.config import (
    BACKEND_URL, USE_WEBUI, WEBUI_URL1, WEBUI_URL2, BLIP_URL, USE_BLIP, USE_CLIP,
    PARALLEL_MODE, GENERATED_FOLDER, ARTISTS
)
from app.socket import socketio
from app.admin import log_progress
from app.image_utils import encode_image_to_base64

'''
BLIP을 사용하여 이미지에서 캡션(프롬프트) 추출
'''
def blip_interrogate(image_path, blip_url=BLIP_URL):

    response = requests.post(
        f"{blip_url}/generate_caption",
        files={"file": open(image_path, "rb")}
    )
    if response.status_code == 200:
        return response.json().get('caption', '')
    else:
        return None

'''
CLIP을 사용하여 이미지에서 캡션(프롬프트) 추출
'''
def clip_interrogate(image_path, clip_skip_level=1, webui_url=WEBUI_URL1):
    if not webui_url:
        return None
    image_base64 = encode_image_to_base64(image_path)
    interrogate_data = {
        "image": f"data:image/png;base64,{image_base64}",
        "model": "clip",
        "clip_skip": clip_skip_level
    }
    response = requests.post(f"{webui_url}/sdapi/v1/interrogate", json=interrogate_data)
    if response.status_code == 200:
        return response.json().get('caption', '')
    return None

'''
Stable Diffusion WebUI의 img2img 기능을 호출하여 이미지 생성
'''
def generate_image(
    webui_url, image_base64, modifier, negative_prompt,
    steps, denoising_strength, cfg_scale, prompt, artist_name
):
    # SD WebUI img2img 호출
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
    DELAY = 5
    for attempt in range(MAX_RETRIES):
        try:
            print(f"[SD] Attempt {attempt + 1}: Sending request to {webui_url}")
            log_progress(f"{artist_name}'s img2img", f"attempt{attempt+1}", None, "call")
            response = requests.post(
                f"{webui_url}/sdapi/v1/img2img",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=600
            )
            response.raise_for_status()
            response_data = response.json()

            return response_data['images'][0]

        except requests.exceptions.RequestException as e:
            error_message = f"HTTP Error: {e}"
            log_progress(f"{artist_name}'s img2img", "error", error_message, "error")
            print(f"Request failed: {error_message}")
            if attempt == MAX_RETRIES - 1:
                return None
        except (ValueError, IndexError) as e:
            error_message = f"Response Parsing Error: {str(e)}"
            log_progress(f"{artist_name}'s img2img", "error", error_message, "error")
            print(f"Error decoding response: {error_message}")
            return None
        
        time.sleep(DELAY)

'''
선택된 화가 그룹에 대해 이미지 변환을 수행하는 함수
'''
def process_artist_group(artists, webui_url, user_name, selected_gender, image_path, prompt, room):
    group_results = {}
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

        base64_img = generate_image(
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
            socketio.emit('get_generate_images', {'error_status': True}, room=room)
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

'''
이미지에서 프롬프트를 추출하는 함수 (BLIP 또는 CLIP 또는 더미 사용)
'''
def get_prompt_from_image(image_path):
    if USE_BLIP:
        prompt = blip_interrogate(image_path)
        if prompt: return prompt
    if USE_CLIP:
        prompt = clip_interrogate(image_path, clip_skip_level=1)
        if prompt: return prompt
    # 둘 다 사용하지 않거나 실패하면 dummy prompt 사용
    return "a young girl wearing a baseball cap and a gray shirt"

'''
선택된 모든 화가 스타일로 이미지를 변환하는 함수 (병렬 또는 순차 실행)
'''
def generate_all_artists(user_name, selected_gender, image_path, prompt, room):
    results = {}

    artist_keys = list(ARTISTS.keys())
    group1_artists = artist_keys[:2]
    group2_artists = artist_keys[2:]

    if not USE_WEBUI:
        # WEBUI 미사용 시 dummy 데이터 반환
        dummy_images = {
            '리히텐슈타인': './static/dummy/test_리히텐슈타인.png',
            '고흐': './static/dummy/test_고흐.png',
            '피카소': './static/dummy/test_피카소.png',
            '르누아르': './static/dummy/test_르누아르.png'
        }
        for artist, path in dummy_images.items():
            results[artist] = {
                'file_path': path,
                'url': BACKEND_URL + '/' + path.replace('./', '')
            }
        return results
    else:
        # WebUI 사용 시 호출
        with ThreadPoolExecutor(max_workers=2 if PARALLEL_MODE else 1) as executor:
            futures = []

            # group1 처리
            futures.append(executor.submit(process_artist_group, group1_artists, WEBUI_URL1, user_name, selected_gender, image_path, prompt, room))

            # 순차 모드일 경우
            if not PARALLEL_MODE:
                group_results1 = futures[0].result()
                results.update(group_results1)

            # group2 처리
            futures.append(executor.submit(process_artist_group, group2_artists, WEBUI_URL2, user_name, selected_gender, image_path, prompt, room))

            # 순차 모드일 경우
            if not PARALLEL_MODE:
                group_results2 = futures[1].result()
                results.update(group_results2)

            # 병렬 모드일 경우
            if PARALLEL_MODE:
                for future in futures:
                    try:
                        group_results = future.result()
                        results.update(group_results)
                    except Exception as e:
                        log_progress("generate images", "error", str(e), "error")
                        return None
        return results

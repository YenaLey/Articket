# app/sd_utils.py
import requests
import base64
import time
from flask import jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.config import (
    BACKEND_URL, USE_WEBUI, WEBUI_URL1, WEBUI_URL2, BLIP_URL,
    PARALLEL_MODE
)
from app.admin import log_progress
from app.image_utils import encode_image_to_base64

def blip_interrogate(image_path, blip_url=BLIP_URL):
    """
    BLIP으로 이미지를 텍스트로 변환
    """
    response = requests.post(
        f"{blip_url}/generate_caption",
        files={"file": open(image_path, "rb")}
    )
    if response.status_code == 200:
        return response.json().get('caption', '')
    else:
        return None

def clip_interrogate(image_path, clip_skip_level=1, webui_url=WEBUI_URL1):
    """
    CLIP으로 이미지를 텍스트로 변환
    """
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

def generate_image(
    webui_url, image_base64, modifier, negative_prompt,
    steps, denoising_strength, cfg_scale, prompt, artist_name
):
    """
    SD WebUI img2img 호출 로직
    """
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

def generate_image_with_retry(webui_url, *args, retries=3, delay=5, **kwargs):
    for attempt in range(retries):
        result = generate_image(webui_url, *args, **kwargs)
        if result is not None:
            return result
        time.sleep(delay)
    return None

def generate_all_artists(
    process_artist_group, group1_artists, group2_artists
):
    """
    group1_artists는 WEBUI_URL1,
    group2_artists는 WEBUI_URL2 로 호출
    병렬/순차 설정은 PARALLEL_MODE에 따름
    """
    results = {}
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

            # 1. group1 처리
            futures.append(executor.submit(process_artist_group, group1_artists, WEBUI_URL1))
            if not PARALLEL_MODE: # 병렬 모드가 아닐 경우
                group_results1 = futures[0].result()
                results.update(group_results1)

            # 2. group2 처리
            futures.append(executor.submit(process_artist_group, group2_artists, WEBUI_URL2))
            if not PARALLEL_MODE: # 병렬 모드가 아닐 경우
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

import base64
from PIL import Image, ImageOps

"""
이미지 전처리: 크기 조정 + 자동 회전 + JPEG 저장
"""
def preprocess_image(image_path, target_size=512, quality=85):
    try:
        img = Image.open(image_path).convert("RGB")
        img = ImageOps.exif_transpose(img)

        if max(img.width, img.height) > target_size:
            img.thumbnail((target_size, target_size))

        img.save(image_path, "JPEG", quality=quality, optimize=True, progressive=True)

        print(f"이미지 전처리 완료: {image_path}, 새 크기: {img.size}")
        return image_path

    except Exception as e:
        print("이미지 전처리 중 오류:", e)
        return image_path

"""
base64로 인코딩
"""
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')
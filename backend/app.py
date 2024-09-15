from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

def call_stable_diffusion_api(prompt):
    url = "http://localhost:7860/sdapi/v1/txt2img"
    headers = {"Content-Type": "application/json"}
    data = {
        "prompt": prompt,
        "steps": 20  # 이미지 생성 단계 수 (필요에 따라 조정 가능)
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()  # 오류가 발생하면 예외를 발생시킴
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

@app.route('/generate', methods=['POST'])
def generate_image():
    prompt = request.json.get('prompt')
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    response = call_stable_diffusion_api(prompt)
    return jsonify(response)

if __name__ == '__main__':
    # Flask 서버를 포트 5000에서 실행 (포트는 필요에 따라 변경 가능)
    app.run(debug=True, port=5000)

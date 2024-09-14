from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# WebUI API를 호출하여 이미지 생성
@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt')
    steps = data.get('steps', 50)

    # WebUI의 txt2img API 호출
    response = requests.post(
        'http://localhost:7860/sdapi/v1/txt2img',
        json={'prompt': prompt, 'steps': steps}
    )

    return jsonify(response.json())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

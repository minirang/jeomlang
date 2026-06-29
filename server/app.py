from flask import Flask, request, jsonify
from runner import run_code, check_code

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/run', methods=['POST'])
def run():
    data = request.get_json()

    if not data or 'code' not in data:
        return jsonify({'error': 'code 필드가 필요합니다'}), 400

    code = data['code']
    if not code.strip():
        return jsonify({'error': '코드가 비어있습니다'}), 400

    result = run_code(code)
    status = 200 if result['success'] else 400
    return jsonify(result), status


@app.route('/check', methods=['POST'])
def check():
    data = request.get_json()

    if not data or 'code' not in data:
        return jsonify({'error': 'code 필드가 필요합니다'}), 400

    code = data['code']
    if not code.strip():
        return jsonify({'error': '코드가 비어있습니다'}), 400

    result = check_code(code)
    status = 200 if result['valid'] else 400
    return jsonify(result), status


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)

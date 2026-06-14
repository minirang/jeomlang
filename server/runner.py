import subprocess
import os

NODE_RUNNER = os.path.join(os.path.dirname(__file__), 'node_runner.js')
TIMEOUT = 10  # 초


def run_code(code: str) -> dict:
    """jeom 코드를 실행하고 결과를 반환합니다."""
    try:
        result = subprocess.run(
            ['node', NODE_RUNNER, 'run'],
            input=code,
            capture_output=True,
            text=True,
            timeout=TIMEOUT
        )

        if result.returncode == 0:
            return {
                'success': True,
                'output': result.stdout
            }
        else:
            return {
                'success': False,
                'error': result.stderr.strip() or '알 수 없는 오류'
            }

    except subprocess.TimeoutExpired:
        return {'success': False, 'error': f'실행 시간 초과 ({TIMEOUT}초)'}
    except FileNotFoundError:
        return {'success': False, 'error': 'Node.js가 설치되어 있지 않습니다'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def check_code(code: str) -> dict:
    """jeom 코드의 문법을 검사하고 오류를 반환합니다."""
    try:
        result = subprocess.run(
            ['node', NODE_RUNNER, 'check'],
            input=code,
            capture_output=True,
            text=True,
            timeout=TIMEOUT
        )

        if result.returncode == 0:
            return {
                'valid': True,
                'message': '문법 오류 없음'
            }
        else:
            return {
                'valid': False,
                'error': result.stderr.strip() or '파싱 오류'
            }

    except subprocess.TimeoutExpired:
        return {'valid': False, 'error': '검사 시간 초과'}
    except FileNotFoundError:
        return {'valid': False, 'error': 'Node.js가 설치되어 있지 않습니다'}
    except Exception as e:
        return {'valid': False, 'error': str(e)}

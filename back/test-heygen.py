import os
import requests

def get():
    url = "https://api.heygen.com/v1/video_status.get?video_id=" + "024ba736992641a288336c0b84006878"

    headers = {
        "accept": "application/json",
        "x-api-key": os.environ["HEYGEN_API_KEY"],
    }

    response = requests.get(url, headers=headers)

    print(response.text)
    print(response.json()['data']['video_url_caption']) # None or url

def post():
    url = "https://api.heygen.com/v2/video/generate"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": os.environ["HEYGEN_API_KEY"],
    }

    payload = {
        "video_inputs": [{
            "voice": {
                "type": "text",
                "input_text": "Welcome to the HeyGen API!",
                "voice_id": "d36f8d1c27054f7baa52c216ad874d16",
            },
            "character": {
                "type": "avatar",
                "avatar_id": "nik_blue_expressive_20240910",
            },
        }],
        "caption": True,
        "dimension": {
            "width": 720,
            "height": 480,
        },
    }

    response = requests.post(url, json=payload, headers=headers)

    print(response.json()['data']['video_id'])

get()

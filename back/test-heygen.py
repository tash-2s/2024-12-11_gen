import os
import requests

def get():
    url = "https://api.heygen.com/v1/video_status.get?video_id=" + "4cc70043ce9a4aa29e1618b205a8ccad"

    headers = {
        "accept": "application/json",
        "x-api-key": os.environ["HEYGEN_API_KEY"],
    }

    response = requests.get(url, headers=headers)

    print(response.text)

def post():
    url = "https://api.heygen.com/v2/video/generate"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": os.environ["HEYGEN_API_KEY"],
    }

    payload = {
        "video_inputs": [{ "voice": {
            "type": "text",
            "input_text": "Welcome to the HeyGen API!",
            "voice_id": "1bd001e7e50f421d891986aad5158bc8",
        }}],
        "caption": True,
        "dimension": {
            "width": 1280,
            "height": 720,
        },
    }

    response = requests.post(url, json=payload, headers=headers)

    print(response.text)

get()

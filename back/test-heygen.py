import os
import requests

url = "https://api.heygen.com/v1/voice.list"

headers = {
    "accept": "application/json",
    "x-api-key": os.environ["HEYGEN_API_KEY"],
}

response = requests.get(url, headers=headers)

print(response.text)

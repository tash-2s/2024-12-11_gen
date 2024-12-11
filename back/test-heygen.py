import os
import requests

url = "https://api.heygen.com/v2/avatars"

headers = {
    "accept": "application/json",
    "x-api-key": os.environ["HEYGEN_API_KEY"],
}

response = requests.get(url, headers=headers)

print(response.text)

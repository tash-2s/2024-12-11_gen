from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
import requests
import re
import os

app = FastAPI()
origins = [
    "http://localhost:5173",
    "https://2024-12-11-gen.pages.dev",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
)

openai_client = OpenAI()

class Video(BaseModel):
    url: str

@app.put("/transcribe")
def transcribe(video: Video):
    print(video)

    video_id = parse_youtube_url(video.url)
    print(video_id)

    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    # print(transcript)

    transcript_text = clean_transcript_text(transcript)
    print(transcript_text)

    return {"text": transcript_text}

class Tx(BaseModel):
    text: str

@app.put("/summarize")
def put_summarize(t: Tx):
    text = t.text
    summary = summarize(text)
    print(summary)

    return {"summary": summary}

class HeygenText(BaseModel):
    text: str

@app.put("/heygen")
def gen_heygen(heygen_text: HeygenText):
    text = heygen_text.text
    print(text)

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": os.environ["HEYGEN_API_KEY"],
    }

    payload = {
        "video_inputs": [{
            "voice": {
                "type": "text",
                "input_text": text[:3000],
                "voice_id": "d36f8d1c27054f7baa52c216ad874d16",
            },
            "character": {
                "type": "avatar",
                "avatar_id": "nik_blue_expressive_20240910",
            },
        }],
        "dimension": {
            "width": 720,
            "height": 480,
        },
    }

    response = requests.post("https://api.heygen.com/v2/video/generate", json=payload, headers=headers)
    print(response.text)

    video_id = response.json()['data']['video_id']

    return {"video_id": video_id}

@app.get("/heygen/{video_id}")
def get_heygen(video_id: str):
    print(video_id)

    url = "https://api.heygen.com/v1/video_status.get?video_id=" + video_id

    headers = {
        "accept": "application/json",
        "x-api-key": os.environ["HEYGEN_API_KEY"],
    }

    response = requests.get(url, headers=headers)
    print(response.text)

    video_url = response.json()['data']['video_url']

    return {"video_url": video_url}

def parse_youtube_url(url: str)->str:
    data = re.findall(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if data:
        return data[0]
    raise ValueError("Invalid YouTube URL")

def clean_transcript_text(transcript):
    transcript_text = ' '.join(
        item['text'].replace('\n', ' ').strip() for item in transcript
    )
    return ' '.join(transcript_text.split())

def summarize(transcript_text):
    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system",
             "content": """
You are provided with a transcript from a YouTube video. Your task is to create a professional and concise script that summarizes the key points of the video. The script should be written from a neutral, third-person perspective, similar to how a news presenter or journalist might explain the video's content. Ensure the script:

1. Describes the video's content in an objective and impartial manner.
2. Uses clear and engaging language suitable for a general audience.
3. Maintains a professional tone throughout.
4. Has a natural flow, suitable for spoken delivery.
5. Focuses on explaining the content rather than adopting the perspective of the video's creator.

Additionally, ensure the script is concise enough to be spoken in under 1 minute at a typical speaking pace, and does not exceed this time limit.

Do not include any additional commentary, explanations, or metadata in your response. Provide only the finalized reading script.
             """},
            {"role": "user", "content": transcript_text}
        ]
    )

    print(completion)

    return completion.choices[0].message.content

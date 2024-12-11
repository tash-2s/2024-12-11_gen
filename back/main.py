from typing import Union
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
import re

app = FastAPI()
origins = [
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
)

openai_client = OpenAI()

class Video(BaseModel):
    url: str

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.put("/video")
def put_video(video: Video):
    print(video)

    video_id = parse_youtube_url(video.url)
    print(video_id)

    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    # print(transcript)

    transcript_text = clean_transcript_text(transcript)
    print(transcript_text)

    summary = summarize(transcript_text)
    # print(summary)

    return {"result": "ok"}

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

Do not include any additional commentary, explanations, or metadata in your response. Provide only the finalized reading script.
             """},
            {"role": "user", "content": transcript_text}
        ]
    )

    print(completion)

    return completion.choices[0].message.content

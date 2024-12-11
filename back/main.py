from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
import re

app = FastAPI()

class Video(BaseModel):
    url: str

def parse_youtube_url(url:str)->str:
    data = re.findall(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if data:
        return data[0]
    raise ValueError("Invalid YouTube URL")

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.put("/video")
def put_video(video: Video):
    video_id = parse_youtube_url(video.url)
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    print(transcript)
    return {"url": video.url, "id": video_id}

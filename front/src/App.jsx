import { useState, useEffect } from 'react'

function App() {
  const [url, setUrl] = useState("");
  const [isUrlLoading, setIsUrlLoading] = useState(false)
  const [summary, setSummary] = useState(null)

  const [videoId, setVideoId] = useState(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

  const [videoUrl, setVideoUrl] = useState(null)

  const foo = async () => {
    setIsUrlLoading(true)
    const s = await transcribe(url)
    setSummary(s)
  }

  const genVid = async () => {
    setIsGeneratingVideo(true)
    const v = await generateVideo(summary)
    setVideoId(v)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (videoId === null) {
        return
      }
      if (videoUrl !== null) {
        return
      }

      const u = await getVideoUrl(videoId)

      if (u === null) {
        return
      }

      setVideoUrl(u)
    }

    const interval = setInterval(fetchData, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Enter YouTube URL"
          size={50}
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        {" "}
        <button type="button" onClick={() => foo()}>Go</button>
        <br />
        <br />
        {isUrlLoading ? <div>
          <YoutubeEmbed yurl={url} />
        </div> : <></>}
        <br />
        {isUrlLoading ? <div>Getting transcript and summarizing...</div> : <></>}
      </div>
      {summary === null ? <></> :
        <>
          <br />
          <textarea
            value={summary || ""}
            rows="5"
            cols="50"
            style={{
              overflow: 'scroll',
            }}
            readOnly
          ></textarea>
          <br />
          <button
            type="button"
            onClick={() => genVid()}
          >
            Generate Video
          </button>
          <br />
          <br />
          {isGeneratingVideo ? <div>Generating video... ({videoId})</div> : <></>}
          <br />
          <br />
          {videoUrl !== null ? <VideoPlayer url={videoUrl} /> : <></>}
        </>
      }
    </>
  )
}

export default App

const transcribe = async (url) => {
  const r = await fetch(
    "http://127.0.0.1:8000/transcribe",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    }
  ).then(r => r.json())

  return r.summary
}

const generateVideo = async (text) => {
  const r = await fetch(
    "http://127.0.0.1:8000/heygen",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    }
  ).then(r => r.json())

  return r.video_id
}

const getVideoUrl = async (videoId) => {
  const r = await fetch(
    `http://127.0.0.1:8000/heygen/${videoId}`,
    {
      method: "GET",
    }
  ).then(r => r.json())

  return r.video_url
}

function VideoPlayer({ url }) {
  return (
    <div>
      <video controls width="640" height="360">
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

const YoutubeEmbed = ({ yurl }) => {
  const embedId = yurl.split('?v=')[1]
  return <iframe
      width="480"
      height="270"
      src={`https://www.youtube.com/embed/${embedId}`}
      style="boarder:0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Embedded youtube"
    />
}

// TODO: startButton, videoElement, userInput.value

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";

let avatar = null;
let sessionData = null;

// Helper function to fetch access token
async function fetchAccessToken() {
  const apiKey = import.meta.env.HEYGEN_API_KEY;
  const response = await fetch(
    "https://api.heygen.com/v1/streaming.create_token",
    {
      method: "POST",
      headers: { "x-api-key": apiKey },
    }
  );

  const { data } = await response.json();
  return data.token;
}

// Initialize streaming avatar session
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });

  sessionData = await avatar.createStartAvatar({
    quality: AvatarQuality.High,
    avatarName: "default",
  });

  console.log("Session data:", sessionData);

  startButton.disabled = true;

  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
}

// Handle when avatar stream is ready
function handleStreamReady(event) {
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(console.error);
    };
  } else {
    console.error("Stream is not available");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  startButton.disabled = false;
}

// TODO: startボタンで発火
// Handle speaking event
async function handleSpeak() {
  await initializeAvatarSession()
  if (avatar && userInput.value) {
    await avatar.speak({
      text: userInput.value,
      taskType: TaskType.REPEAT,
    });
    userInput.value = ""; // Clear input after speaking
  }
}

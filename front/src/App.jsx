import { useState } from 'react'

function App() {
  const [url, setUrl] = useState("");
  const [isUrlLoading, setIsUrlLoading] = useState(false)
  const [summary, setSummary] = useState(null)

  const foo = async () => {
    setIsUrlLoading(true)
    const s = await transcribe(url)
    setSummary(s)
  }

  const genVid = async () => {
    if (domManipulationArea.current) {
      const targetDiv = domManipulationArea.current;

      // <video id="avatarVideo" autoplay playsinline width="640" height="360"></video>
      videoElement = document.createElement('p');
      targetDiv.appendChild(videoElement);

      await handleSpeak(summary)
    }
  }

  const domManipulationArea = useRef(null);

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
            HeyGen!
          </button>
          <br />
          <br />
          <div ref={domManipulationArea}></div>
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

let videoElement = null

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
}

// Handle speaking event
async function handleSpeak(inputValue) {
  await initializeAvatarSession()
  if (avatar && inputValue) {
    await avatar.speak({
      text: inputValue,
      taskType: TaskType.REPEAT,
    });
  }
}

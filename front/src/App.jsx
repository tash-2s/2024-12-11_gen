import { useState, useRef } from 'react'

function App() {
  const [yurl, setYurl] = useState(null);

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState(null);

  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState("Hello there!") // TODO: `null`

  const handleTranscribe = async () => {
    setIsTranscribing(true)
    const t = await transcribe(yurl)
    setTranscript(t)
  }

  const handleSummarize = async () => {
    setIsSummarizing(true)
    const s = await summarize(transcript)
    setSummary(s)
  }

  const handleVideo = async () => {
    if (domManipulationArea.current) {
      const targetDiv = domManipulationArea.current;

      videoElement = document.createElement('video');

      videoElement.id = 'avatarVideo';
      videoElement.autoplay = true;
      videoElement.playsinline = true;
      videoElement.width = 360;
      videoElement.height = 360;

      targetDiv.appendChild(videoElement);

      await handleSpeak(summary)
    }
  }

  const domManipulationArea = useRef(null);

  return (
    <div style={{ marginLeft: '30px', marginTop: '20px' }}>
      <input
        type="text"
        placeholder="Enter YouTube URL"
        size={50}
        value={yurl || ""}
        onChange={e => setYurl(e.target.value)}
      />
      {" "}
      <button type="button" onClick={() => handleTranscribe()}>Transcribe</button>
      <br />
      <br />
      {isTranscribing ? <div>
        <YoutubeEmbed yurl={yurl} />
      </div> : <></>}
      <br />
      {isTranscribing ? <div>transcribing...</div> : <></>}
      {transcript === null ? <></> : <div>
        <br />
        <textarea
          value={transcript}
          rows="6"
          cols="60"
          style={{
            overflow: 'scroll',
          }}
          readOnly
        ></textarea>
        <br />
        <button
          type="button"
          onClick={() => handleSummarize()}
        >
          Summarize
        </button>
      </div>}
      <br />
      {isSummarizing ? <div>summarizing...</div> : <></>}
      {summary === null ? <></> :
        <div>
          <br />
          <textarea
            value={summary}
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
            onClick={() => handleVideo()}
          >
            HeyGen
          </button>
          <br />
          <br />
          <div ref={domManipulationArea}></div>
        </div>
      }
    </div>
  )
}

export default App

const host = "https://two024-12-11-gen.onrender.com"

const transcribe = async (url) => {
  const r = await fetch(
    `${host}/transcribe`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    }
  ).then(r => r.json())

  return r.text
}

const summarize = async (text) => {
  const r = await fetch(
    `${host}/summarize`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
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
      style={{boarder:0}}
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
  const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;
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

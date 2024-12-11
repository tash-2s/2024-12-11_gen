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
    console.log(v)
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

      const url = await getVideoUrl(videoId)

      if (url === null) {
        return
      }

      setVideoUrl(url)
    }

    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button type="button" onClick={() => foo()}>Go</button>
        {isUrlLoading ? <div>Getting transcript and summarizing...</div> : <></>}
      </div>
      {summary === null ? <></> :
        <>
          <textarea>{summary}</textarea>
          <br />
          <button
            type="button"
            onClick={() => genVid()}
          >
            Generate Video
          </button>
          {isGeneratingVideo ? <div>Generating video... ({videoId})</div> : <></>}
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

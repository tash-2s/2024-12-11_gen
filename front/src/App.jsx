import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState(null)

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button type="button" onClick={() => transcribe(url).then(setSummary)} />
      </div>
      <div>
        {summary}
      </div>
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

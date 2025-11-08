import { useEffect, useState, useRef } from "react";
import "./PodcastTTSPlayer.css";
import { getGeminiResponse } from "./utils/callGemini";
import { useAppState } from "./context/AppContext";

export default function PodcastTTSPlayer() {
  const synth = window.speechSynthesis;
  const { podcastTTSPrompt } = useAppState();

  const [voices, setVoices] = useState([]);
  const [scriptData, setScriptData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [femaleVoice, setFemaleVoice] = useState(localStorage.getItem("femaleVoice") || "Samantha");
  const [maleVoice, setMaleVoice] = useState(localStorage.getItem("maleVoice") || "Aaron");

  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("generate");
  const scriptInputRef = useRef();

  /* ------------ Persist selected voices ------------- */
  useEffect(() => localStorage.setItem("femaleVoice", femaleVoice), [femaleVoice]);
  useEffect(() => localStorage.setItem("maleVoice", maleVoice), [maleVoice]);

  /* ------------ Load Prompt from Global State ------------- */
  useEffect(() => {
    setPrompt(podcastTTSPrompt || "");
  }, [podcastTTSPrompt]);

  /* ------------ Voice Loading ------------- */
  useEffect(() => {
    const load = () => {
      const v = synth.getVoices();
      if (v.length > 0) setVoices(v);
    };
    load();
    synth.onvoiceschanged = load;
  }, []);

  /* ------------ Extract JSON ------------- */
  function extractJsonFromResponse(text) {
    if (!text || typeof text !== "string") return null;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) text = fenced[1].trim();
    try { return JSON.parse(text); } catch {}
    const fallback = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    try { return fallback ? JSON.parse(fallback[0]) : null; } catch {}
    return null;
  }

  function validateScriptFormat(data) {
    if (!Array.isArray(data)) throw new Error("Script must be a JSON array.");
    return data.map((item, i) => {
      if (!item.speaker || !item.gender || !item.text)
        throw new Error(`Item ${i + 1} missing fields.`);
      return { ...item, gender: item.gender.toLowerCase() };
    });
  }

  const loadScript = () => {
    try {
      const json = JSON.parse(scriptInputRef.current.value);
      setScriptData(validateScriptFormat(json));
      setCurrentIndex(0);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      scriptInputRef.current.value = text;
      loadScript();
    } catch {
      setErrorMsg("Clipboard blocked.");
    }
  };

  const pastePromptFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrompt(text);
    } catch {
      setErrorMsg("Clipboard blocked.");
    }
  }

  const loadFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        setScriptData(validateScriptFormat(JSON.parse(r.result)));
        setCurrentIndex(0);
      } catch {
        setErrorMsg("Invalid JSON file.");
      }
    };
    r.readAsText(file);
  };

  const handleGenerateScriptFromPrompt = async () => {
  if (!prompt.trim()) return;
  try {
    setLoading(true);
    const raw = await getGeminiResponse(`
      Return ONLY a JSON array representing a podcast conversation (no markdown).
      Each item: { "speaker": "", "gender": "male|female", "text": "" }
      Topic: "${prompt}"
    `);

    const parsed = extractJsonFromResponse(raw);
    const validated = validateScriptFormat(parsed);

    setScriptData(validated);
    setErrorMsg("");

    // Switch to Script Tab
    setActiveTab("script");

    // Update textarea if it's rendered
    setTimeout(() => {
      if (scriptInputRef.current) {
        scriptInputRef.current.value = JSON.stringify(validated, null, 2);
      }
    }, 50);

  } catch (err) {
    setErrorMsg("Generation failed. Ensure prompt is clear.");
  } finally {
    setLoading(false);
  }
};


  const getVoice = (gender) =>
    voices.find(v => v.name === (gender === "male" ? maleVoice : femaleVoice)) || voices[0];

  const speak = (i) => {
    if (!scriptData[i]) return;
    setCurrentIndex(i);
    const u = new SpeechSynthesisUtterance(scriptData[i].text);
    u.voice = getVoice(scriptData[i].gender);
    u.rate = rate; u.pitch = pitch; u.volume = volume;
    u.onend = () => speak(i + 1);
    synth.cancel();
    synth.speak(u);
  };

  const stop = () => synth.cancel();

  return (
    <div className="podcast-wrapper">

      {/* ---- Tabs ---- */}
      <div className="tabs">
        <button className={activeTab === "playback" ? "active" : ""} onClick={() => setActiveTab("playback")}>🎙 Playback</button>
        <button className={activeTab === "script" ? "active" : ""} onClick={() => setActiveTab("script")}>📜 Script</button>
        <button className={activeTab === "generate" ? "active" : ""} onClick={() => setActiveTab("generate")}>✨ Generate</button>
      </div>

      {/* ---- Playback ---- */}
      {activeTab === "playback" && (
        <div className="panel">
          <h2>Playback Controls</h2>

          <div className="controls">
            <button onClick={() => speak(currentIndex)}>▶ Play</button>
            <button onClick={() => synth.pause()}>⏸ Pause</button>
            <button onClick={() => synth.resume()}>⏯ Resume</button>
            <button className="danger" onClick={stop}>⏹ Stop</button>
          </div>

          <label>Female Voice</label>
          <select value={femaleVoice} onChange={(e) => setFemaleVoice(e.target.value)}>
            {voices.map(v => <option key={v.name}>{v.name}</option>)}
          </select>

          <label>Male Voice</label>
          <select value={maleVoice} onChange={(e) => setMaleVoice(e.target.value)}>
            {voices.map(v => <option key={v.name}>{v.name}</option>)}
          </select>

          <label>Speed</label><input type="range" min="0.5" max="2" step="0.05" value={rate} onChange={e => setRate(e.target.value)} />
          <label>Pitch</label><input type="range" min="0" max="2" step="0.05" value={pitch} onChange={e => setPitch(e.target.value)} />
          <label>Volume</label><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(e.target.value)} />
        </div>
      )}

      {/* ---- Script ---- */}
      {activeTab === "script" && (
        <div className="panel">
          <h2>Script Editor</h2>
          <textarea ref={scriptInputRef} placeholder="Paste JSON here"></textarea>
          <div className="controls">
            <button onClick={loadScript}>Load</button>
            <button onClick={pasteFromClipboard}>📋 Paste</button>
            <input type="file" accept="application/json" onChange={loadFromFile} />
          </div>

          {errorMsg && <div className="error">{errorMsg}</div>}

          <div className="script-list">
            {scriptData.map((line, i) => (
              <div key={i} className={`script-item ${i === currentIndex ? "active" : ""}`} onClick={() => setCurrentIndex(i)}>
                <strong>{line.speaker}</strong> ({line.gender})<br />{line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Generate ---- */}
      {activeTab === "generate" && (
        <div className="panel">
          <h2>Generate a Script</h2>
          <input type="text" placeholder="Conversation topic..." value={prompt} onChange={e => setPrompt(e.target.value)} />
          <button onClick={handleGenerateScriptFromPrompt} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
          <button onClick={() => { setPrompt(""); setScriptData([]); scriptInputRef.current.value = ""; setErrorMsg(""); } }>
            Clear
          </button>
          <button onClick={pastePromptFromClipboard}>
            Paste Prompt from Clipboard 
          </button>
          {errorMsg && <div className="error">{errorMsg}</div>}
        </div>
      )}
    </div>
  );
}

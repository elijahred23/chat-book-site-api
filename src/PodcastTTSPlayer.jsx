import { useEffect, useState, useRef } from "react";
import "./PodcastTTSPlayer.css";
import {getGeminiResponse} from "./utils/callGemini";

export default function PodcastTTSPlayer() {
  const synth = window.speechSynthesis;

  const [voices, setVoices] = useState([]);
  const [scriptData, setScriptData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [femaleVoice, setFemaleVoice] = useState("Samantha");
  const [maleVoice, setMaleVoice] = useState("Aaron");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const scriptInputRef = useRef();

  /* ---------------- Voice Loading ---------------- */
  useEffect(() => {
    const load = () => {
      const v = synth.getVoices();
      if (v.length > 0) setVoices(v);
    };
    load();
    synth.onvoiceschanged = load;
  }, []);

  /* ---------------- JSON Extractor ---------------- */
  function extractJsonFromResponse(text) {
    if (!text || typeof text !== "string") return null;

    // remove fenced code block if present
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) text = fenced[1].trim();

    try {
      return JSON.parse(text);
    } catch {
      const inner = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (inner) {
        try {
          return JSON.parse(inner[0]);
        } catch {}
      }
    }
    return null;
  }

  /* ---------------- Format Validator ---------------- */
  function validateScriptFormat(data) {
    if (!Array.isArray(data)) throw new Error("Script must be a JSON array.");

    data.forEach((item, i) => {
      if (!item.speaker || !item.gender || !item.text) {
        throw new Error(`Item ${i + 1} must have speaker, gender, and text.`);
      }
      if (!["male", "female"].includes(item.gender.toLowerCase())) {
        throw new Error(`Invalid gender at item ${i + 1}. Must be "male" or "female".`);
      }
    });
    return data.map(i => ({
      speaker: i.speaker,
      gender: i.gender.toLowerCase(),
      text: i.text
    }));
  }

  /* ---------------- Load JSON from Textarea ---------------- */
  const loadScript = () => {
    setErrorMsg("");
    try {
      const json = JSON.parse(scriptInputRef.current.value);
      setScriptData(validateScriptFormat(json));
      setCurrentIndex(0);
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  /* ---------------- Paste from Clipboard ---------------- */
  const pasteFromClipboard = async () => {
    setErrorMsg("");
    try {
      const text = await navigator.clipboard.readText();
      scriptInputRef.current.value = text;
      loadScript();
    } catch {
      setErrorMsg("Clipboard permissions blocked.");
    }
  };

  /* ---------------- Load JSON From File ---------------- */
  const loadFromFile = (e) => {
    setErrorMsg("");
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        setScriptData(validateScriptFormat(json));
        setCurrentIndex(0);
      } catch {
        setErrorMsg("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  /* ---------------- Generate Script Using Gemini ---------------- */
  const handleGenerateScriptFromPrompt = async () => {
    if (!prompt) return;
    try {
      setLoading(true);
      const instruction = `
        Generate a JSON array representing a podcast-style conversation.
        Format example:
        [
          { "speaker": "Alice", "gender": "female", "text": "Hello" },
          { "speaker": "Bob", "gender": "male", "text": "Hi" }
        ]
        Gender must be "male" or "female". Do NOT add explanations or markdown.
        Topic: "${prompt}"
      `;

      const rawResponse = await getGeminiResponse(instruction);
      const extractedJson = extractJsonFromResponse(rawResponse);
      if (!extractedJson) throw new Error("Model did not return valid JSON.");

      const validated = validateScriptFormat(extractedJson);
      setScriptData(validated);
      scriptInputRef.current.value = JSON.stringify(validated, null, 2);
      setErrorMsg(null);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Playback ---------------- */
  const getVoiceForGender = (gender) => {
    const name = gender === "male" ? maleVoice : femaleVoice;
    return voices.find((v) => v.name === name) || voices[0];
  };

  const speak = (index) => {
    if (!scriptData[index]) return;
    setCurrentIndex(index);

    const line = scriptData[index];
    const utter = new SpeechSynthesisUtterance(line.text);
    utter.voice = getVoiceForGender(line.gender);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;

    utter.onend = () => {
      if (index + 1 < scriptData.length) speak(index + 1);
    };

    synth.speak(utter);
  };

  const stop = () => synth.cancel();

  /* ---------------- Download ---------------- */
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(scriptData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.json";
    a.click();
  };

  return (
    <div className="wrapper">

      <header>
        <h1>Podcast Text-to-Speech Player</h1>
        <p>Load or Generate a JSON script, then play it with voice synthesis.</p>
      </header>

      {/* Prompt to Generate JSON */}
      <section className="panel" style={{ margin: "16px auto", maxWidth: "900px" }}>
        <h3>Generate Script From Prompt</h3>

        <input
          type="text"
          placeholder="Describe the conversation topic..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button onClick={handleGenerateScriptFromPrompt} disabled={loading}>
          {loading ? "Generating..." : "Generate Script"}
        </button>
      </section>

      <div className="main">

        <section className="panel">
          <h3>Playback</h3>
          <div className="controls">
            <button onClick={() => speak(currentIndex)}>▶ Play</button>
            <button onClick={() => synth.pause()}>⏸ Pause</button>
            <button onClick={() => synth.resume()}>⏯ Resume</button>
            <button className="danger" onClick={stop}>⏹ Stop</button>
          </div>

          <label>Female Voice</label>
          <select value={femaleVoice} onChange={(e) => setFemaleVoice(e.target.value)}>
            {voices.map((v, i) => <option key={i}>{v.name}</option>)}
          </select>

          <label>Male Voice</label>
          <select value={maleVoice} onChange={(e) => setMaleVoice(e.target.value)}>
            {voices.map((v, i) => <option key={i}>{v.name}</option>)}
          </select>

          <label>Speed: {rate}</label>
          <input type="range" min="0.5" max="2" step="0.05" value={rate} onChange={(e) => setRate(e.target.value)} />

          <label>Pitch: {pitch}</label>
          <input type="range" min="0" max="2" step="0.05" value={pitch} onChange={(e) => setPitch(e.target.value)} />

          <label>Volume: {volume}</label>
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(e.target.value)} />

          <h3>Load / Save Script</h3>

          <textarea ref={scriptInputRef} placeholder="Paste JSON here"></textarea>

          <button onClick={loadScript}>Load JSON</button>
          <button onClick={pasteFromClipboard}>📋 Paste from Clipboard</button>
          <input type="file" accept="application/json" onChange={loadFromFile} />
          <button onClick={downloadJSON}>💾 Download JSON</button>

          {errorMsg && <div className="error">{errorMsg}</div>}
        </section>

        <section className="panel">
          <h3>Script</h3>
          <div className="script-list">
            {scriptData.map((line, i) => (
              <div
                key={i}
                className={`script-item ${i === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(i)}
              >
                <strong>{line.speaker}</strong> ({line.gender})<br />{line.text}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

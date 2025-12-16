import React, { useEffect, useMemo, useState } from "react";
import { ClipLoader } from "react-spinners";
import { getGeminiResponse } from "./utils/callGemini";
import ActionButtons from "./ui/ActionButtons.jsx";

const DEFAULT_PROMPT = "Everyday greetings at a coffee shop";

const buildPrompt = (topic, level, focus) => `
You are a Bengali language tutor. Create a concise lesson as JSON (no extra text) with this shape:
{
  "title": "...",
  "summary": "...",
  "level": "beginner|intermediate|advanced",
  "topic": "...",
  "focus": "${focus}",
  "phrases": [
    {
      "bn": "Bengali phrase",
      "pronunciation": "Latin-script pronunciation",
      "en": "English meaning",
      "context": "When to use it"
    }
  ],
  "vocab": [
    { "bn": "word", "pronunciation": "...", "en": "meaning" }
  ],
  "practice": [
    { "type": "translation", "prompt": "English prompt", "answer": "Bengali answer" },
    { "type": "fill_blank", "prompt": "Sentence with ____", "answer": "Correct Bengali" }
  ],
  "notes": ["short tip", "short tip"]
}
Rules: Keep Bengali accurate, add pronunciations, keep JSON valid and parseable. Topic: ${topic}. Level: ${level}.`;

const parseJson = (text) => {
  if (!text) throw new Error("Empty response");
  const codeMatch = text.match(/```json\\s*([\\s\\S]*?)```/i);
  const raw = codeMatch?.[1] ?? text;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
  const snippet = raw.slice(firstBrace, lastBrace + 1);
  return JSON.parse(snippet);
};

const useVoices = () => {
  const [voices, setVoices] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => {
      const list = synth.getVoices?.() || [];
      setVoices(list);
      setReady(list.length > 0);
    };
    load();
    const id1 = setTimeout(load, 300);
    const id2 = setTimeout(load, 900);
    synth.onvoiceschanged = load;
    return () => {
      clearTimeout(id1);
      clearTimeout(id2);
      synth.onvoiceschanged = null;
    };
  }, []);
  return { voices, ready };
};

export default function BengaliTutor() {
  const [topic, setTopic] = useState(DEFAULT_PROMPT);
  const [level, setLevel] = useState("beginner");
  const [focus, setFocus] = useState("conversation");
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { voices, ready: voicesReady } = useVoices();
  const audioCacheRef = React.useRef(new Map()); // cache Bengali audio URLs by text+lang

  const speak = async (text, langPref = "bn") => {
    if (!text) return;
    if (langPref.startsWith("bn")) {
      // Bengali: force backend TTS only
      const langCandidates = ["bn-IN", "bn-BD", "bn"];
      for (const langCode of langCandidates) {
        const cacheKey = `${langCode}::${text}`;
        const cachedUrl = audioCacheRef.current.get(cacheKey);
        if (cachedUrl) {
          const audio = new Audio(cachedUrl);
          try {
            await audio.play();
            return;
          } catch (err) {
            // if cached URL fails, purge and refetch
            audioCacheRef.current.delete(cacheKey);
          }
        }
        try {
          const resp = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang: langCode }),
          });
          if (!resp.ok) continue;
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          audioCacheRef.current.set(cacheKey, url);
          const audio = new Audio(url);
          await audio.play();
          return;
        } catch (err) {}
      }
      return;
    }

    // English: prefer Sarah or any English voice locally
    const trySpeechSynth = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) return false;
      const synth = window.speechSynthesis;
      const list = synth.getVoices?.() || voices;
      const sarah = list.find((v) => v.name?.toLowerCase().includes("sarah"));
      const enVoice = sarah || list.find((v) => v.lang?.toLowerCase().startsWith("en"));
      const utter = new SpeechSynthesisUtterance(text);
      if (enVoice) utter.voice = enVoice;
      utter.lang = enVoice?.lang || "en-US";
      synth.cancel();
      synth.resume?.();
      synth.speak(utter);
      return true;
    };

    const synthWorked = trySpeechSynth();
    if (synthWorked) return;

    // Fallback to backend TTS for English if no local voice worked
    try {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: "en-US" }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError("");
      const promptText = buildPrompt(topic || DEFAULT_PROMPT, level, focus);
      const resp = await getGeminiResponse(promptText);
      const parsed = parseJson(resp);
      setLesson(parsed);
    } catch (err) {
      setError(err?.message || "Failed to build lesson");
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!lesson) return;
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lesson.title || "bengali-lesson"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadWords = () => {
    if (!lesson?.vocab?.length) return;
    const lines = lesson.vocab.map((w) => `${w.bn} (${w.pronunciation || ""}) - ${w.en}`).join("\\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lesson.title || "bengali-words"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const shellStyles = `
    .bn-shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 0.75rem;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    .bn-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 10px 24px rgba(15,23,42,0.08);
    }
    .bn-grid {
      display: grid;
      gap: 0.75rem;
    }
    @media (min-width: 820px) {
      .bn-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .bn-pill {
      padding: 0.4rem 0.7rem;
      border-radius: 999px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }
    .bn-section {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem;
      background: #f8fafc;
    }
    .bn-btn {
      padding: 0.65rem 0.85rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #0f172a;
      color: #fff;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 10px 24px rgba(0,0,0,0.08);
    }
    .bn-btn.secondary {
      background: #f8fafc;
      color: #0f172a;
      border-color: #e2e8f0;
    }
    .bn-row {
      display: grid;
      gap: 6px;
    }
    @media (min-width: 640px) {
      .bn-row {
        grid-template-columns: 1fr auto;
        align-items: center;
      }
    }
  `;

  const combinedLessonPrompt = useMemo(() => {
    if (!lesson) return "";
    const phrases = lesson.phrases?.map((p) => `${p.bn} (${p.pronunciation || ""}) - ${p.en}`) || [];
    return `${lesson.title || "Bengali Lesson"}: ${phrases.join(" | ")}`;
  }, [lesson]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>{shellStyles}</style>
      <div className="bn-shell">
        <div className="bn-card">
          <h2 style={{ margin: 0 }}>বাংলা Tutor</h2>
          <p style={{ margin: "4px 0", color: "#475569" }}>Generate concise Bengali lessons with pronunciations and practice.</p>
          <div className="bn-grid">
            <div className="bn-section" style={{ display: "grid", gap: 8 }}>
              <label style={{ fontWeight: 700, color: "#0f172a" }}>Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Ordering food at a cafe"
                style={{ padding: "0.7rem", borderRadius: 10, border: "1px solid #e2e8f0" }}
              />
              <label style={{ fontWeight: 700, color: "#0f172a" }}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ padding: "0.7rem", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <label style={{ fontWeight: 700, color: "#0f172a" }}>Focus</label>
              <select value={focus} onChange={(e) => setFocus(e.target.value)} style={{ padding: "0.7rem", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <option value="conversation">Conversation</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
              </select>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="bn-btn" onClick={fetchLesson} disabled={loading}>{loading ? "Generating..." : "Generate Lesson"}</button>
                <button className="bn-btn secondary" onClick={() => { setTopic(DEFAULT_PROMPT); setLesson(null); setError(""); }}>Reset</button>
              </div>
              {error && <div style={{ color: "#dc2626", fontWeight: 600 }}>{error}</div>}
            </div>
            <div className="bn-section" style={{ display: "grid", gap: 8 }}>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download lesson JSON</div>
                  <small style={{ color: "#475569" }}>Save and reuse</small>
                </div>
                <button className="bn-btn secondary" onClick={downloadJson} disabled={!lesson}>Download</button>
              </div>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download words</div>
                  <small style={{ color: "#475569" }}>Phrase list with pronunciations</small>
                </div>
                <button className="bn-btn secondary" onClick={downloadWords} disabled={!lesson?.vocab?.length}>Download</button>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bn-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipLoader size={22} color="#2563eb" />
            <span>Building your Bengali lesson…</span>
          </div>
        )}

        {lesson && !loading && (
          <div className="bn-card" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>{lesson.title}</h3>
              <span className="bn-pill">{lesson.level}</span>
              <span className="bn-pill">{lesson.focus}</span>
            </div>
            <p style={{ margin: 0, color: "#475569" }}>{lesson.summary}</p>
            <ActionButtons promptText={combinedLessonPrompt} />

            {lesson.phrases?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h4 style={{ margin: 0 }}>Key Phrases</h4>
                {lesson.phrases.map((p, idx) => (
                  <div key={idx} className="bn-section" style={{ background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{p.bn}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="bn-btn secondary" onClick={() => speak(p.bn, "bn")}>🔈 Bengali</button>
                        <button className="bn-btn secondary" onClick={() => speak(p.en, "en")}>🔈 English</button>
                      </div>
                    </div>
                    <div style={{ color: "#0f172a" }}>{p.pronunciation}</div>
                    <div style={{ color: "#475569" }}>{p.en}</div>
                    {p.context && <div style={{ color: "#475569" }}>Context: {p.context}</div>}
                    <div style={{ marginTop: 6 }}>
                      <ActionButtons limitButtons promptText={`${lesson.title}: ${p.bn} (${p.pronunciation}) - ${p.en}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {lesson.vocab?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 6 }}>
                <h4 style={{ margin: 0 }}>Vocabulary</h4>
                {lesson.vocab.map((v, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.bn}</div>
                      <div style={{ color: "#475569" }}>{v.pronunciation}</div>
                      <div style={{ color: "#0f172a" }}>{v.en}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="bn-btn secondary" onClick={() => speak(v.bn, "bn")}>🔈</button>
                      <button className="bn-btn secondary" onClick={() => speak(v.en, "en")}>🔈</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {lesson.practice?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 8 }}>
                <h4 style={{ margin: 0 }}>Practice</h4>
                {lesson.practice.map((q, idx) => (
                  <div key={idx} className="bn-section" style={{ background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.type?.toUpperCase()}</div>
                    <div style={{ color: "#0f172a" }}>{q.prompt}</div>
                    <div style={{ color: "#475569" }}>Answer: {q.answer}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {lesson.notes?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 4 }}>
                <h4 style={{ margin: 0 }}>Notes</h4>
                {lesson.notes.map((n, idx) => (
                  <div key={idx} style={{ color: "#475569" }}>• {n}</div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

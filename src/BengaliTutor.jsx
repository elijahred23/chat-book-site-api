import React, { useEffect, useMemo, useState } from "react";
import { ClipLoader } from "react-spinners";
import { getGeminiResponse } from "./utils/callGemini";
import ActionButtons from "./ui/ActionButtons.jsx";

const DEFAULT_PROMPT = "Everyday greetings at a coffee shop";
const LESSON_CACHE_KEY = "bengali_lesson_cache";
const INPUT_CACHE_KEY = "bengali_lesson_inputs";

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
  const [topic, setTopic] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_CACHE_KEY);
      return saved ? JSON.parse(saved).topic || DEFAULT_PROMPT : DEFAULT_PROMPT;
    } catch {
      return DEFAULT_PROMPT;
    }
  });
  const [level, setLevel] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_CACHE_KEY);
      return saved ? JSON.parse(saved).level || "beginner" : "beginner";
    } catch {
      return "beginner";
    }
  });
  const [focus, setFocus] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_CACHE_KEY);
      return saved ? JSON.parse(saved).focus || "conversation" : "conversation";
    } catch {
      return "conversation";
    }
  });
  const [lesson, setLesson] = useState(() => {
    try {
      const saved = localStorage.getItem(LESSON_CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vocabMp3Loading, setVocabMp3Loading] = useState(false);
  const { voices, ready: voicesReady } = useVoices();
  const audioCacheRef = React.useRef(new Map()); // cache Bengali audio URLs by text+lang
  const batchCacheRef = React.useRef(new Map()); // cache combined MP3 blobs for batch vocab
  const loopStateRef = React.useRef({ key: null, mode: null, abort: false, audio: null });
  const [, forceRender] = useState(0); // quick rerender for loop status

  const playAudioUrl = (url) =>
    new Promise((resolve, reject) => {
      const audio = new Audio(url);
      loopStateRef.current.audio = audio;
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });

  const synthesizeAndPlay = async (text, lang) => {
    const cacheKey = `${lang}::${text}`;
    let url = audioCacheRef.current.get(cacheKey);
    if (!url) {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!resp.ok) throw new Error("TTS failed");
      const blob = await resp.blob();
      url = URL.createObjectURL(blob);
      // Cache Bengali heavily; cache English to smooth looping as well
      audioCacheRef.current.set(cacheKey, url);
    }
    try {
      await playAudioUrl(url);
    } finally {
      // keep cached URL for reuse; do not revoke
    }
  };

  const speak = async (text, langPref = "bn", opts = {}) => {
    const forceApi = !!opts.forceApi;
    if (!text) return;

    // If explicitly forcing API, honor the requested language directly.
    if (forceApi) {
      try {
        await synthesizeAndPlay(text, langPref || "bn-IN");
      } catch {}
      return;
    }

    if (langPref.startsWith("bn")) {
      // Bengali: use backend TTS only
      const langCandidates = ["bn-IN", "bn-BD", "bn"];
      for (const langCode of langCandidates) {
        try {
          await synthesizeAndPlay(text, langCode);
          return;
        } catch {}
      }
      return;
    }

    // English: prefer Sarah or any English voice locally unless forcing API
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
      loopStateRef.current.audio = null;
      synth.speak(utter);
      return true;
    };

    const synthWorked = forceApi ? false : trySpeechSynth();
    if (synthWorked) return;

    // Backend TTS for English (forced or fallback)
    try {
      await synthesizeAndPlay(text, "en-US");
    } catch {}
  };

  const stopLoops = () => {
    loopStateRef.current.abort = true;
    loopStateRef.current.mode = null;
    loopStateRef.current.key = null;
    loopStateRef.current.audio?.pause?.();
    loopStateRef.current.audio = null;
    forceRender((x) => x + 1);
  };

  const loopSequence = async (key, mode, segments) => {
    stopLoops();
    loopStateRef.current.abort = false;
    loopStateRef.current.mode = mode;
    loopStateRef.current.key = key;
    forceRender((x) => x + 1);
    try {
      while (!loopStateRef.current.abort) {
        for (const seg of segments) {
          if (loopStateRef.current.abort) break;
          try {
            await speak(seg.text, seg.lang, { forceApi: seg.forceApi });
          } catch (err) {
            console.warn("Loop speak failed", err);
          }
          if (loopStateRef.current.abort) break;
          // small gap between clips to avoid overlap
          await new Promise((res) => setTimeout(res, 120));
        }
      }
    } finally {
      stopLoops();
    }
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError("");
      const promptText = buildPrompt(topic || DEFAULT_PROMPT, level, focus);
      const resp = await getGeminiResponse(promptText);
      const parsed = parseJson(resp);
      setLesson(parsed);
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(parsed));
      localStorage.setItem(
        INPUT_CACHE_KEY,
        JSON.stringify({ topic: topic || DEFAULT_PROMPT, level, focus })
      );
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

  const downloadCombinedVocabMp3 = async (lang = "bn-IN") => {
    if (!lesson?.vocab?.length) return;
    try {
      setVocabMp3Loading(true);
      const items = lesson.vocab.flatMap((v) => {
        if (lang.startsWith("bn")) {
          return [{ text: v.bn, lang }];
        }
        // Combined download: Bengali first, then English (bn -> en)
        return [
          { text: v.bn, lang: "bn-IN" },
          { text: v.en, lang: "en-US" },
        ];
      });
      const cacheKey = JSON.stringify(items);
      const cachedUrl = batchCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        const link = document.createElement("a");
        link.href = cachedUrl;
        link.download = `${lesson.title || "bengali-vocab"}-${lang}.mp3`;
        link.click();
        return;
      }
      const resp = await fetch("/api/tts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!resp.ok) throw new Error("Failed to generate MP3");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      batchCacheRef.current.set(cacheKey, url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lesson.title || "bengali-vocab"}-${lang}.mp3`;
      link.click();
    } catch (err) {
      setError(err?.message || "Failed to download vocab audio");
    } finally {
      setVocabMp3Loading(false);
    }
  };

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
                <label className="bn-btn secondary" style={{ cursor: "pointer" }}>
                  Upload Lesson JSON
                  <input
                    type="file"
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const parsed = JSON.parse(text);
                        setLesson(parsed);
                        localStorage.setItem(LESSON_CACHE_KEY, text);
                      } catch (err) {
                        setError("Invalid lesson JSON");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
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
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download vocab MP3</div>
                  <small style={{ color: "#475569" }}>Combined Bengali / English audio</small>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("bn-IN")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "Bengali MP3"}
                  </button>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("en-US")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "Bengali → English MP3"}
                  </button>
                </div>
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
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="bn-btn secondary" onClick={() => speak(p.bn, "bn")}>🔈 Bengali</button>
                        <button className="bn-btn secondary" onClick={() => speak(p.en, "en")}>🔈 English</button>
                        <button
                          className="bn-btn secondary"
                        onClick={() =>
                          loopSequence(
                            `phrase-${idx}`,
                            "phrase",
                            [
                              { text: p.bn, lang: "bn", forceApi: true },
                              { text: p.en, lang: "en", forceApi: true },
                            ]
                          )
                        }
                        style={{ background: loopStateRef.current.key === `phrase-${idx}` ? "#2563eb" : undefined, color: loopStateRef.current.key === `phrase-${idx}` ? "#fff" : undefined }}
                      >
                          🔁 Loop bn→en
                        </button>
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
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    className="bn-btn"
                    onClick={() =>
                      loopSequence(
                        "all-phrases",
                        "all",
                        lesson.phrases.flatMap((p) => [
                          { text: p.bn, lang: "bn", forceApi: true },
                          { text: p.en, lang: "en", forceApi: true },
                        ])
                      )
                    }
                    style={{ background: loopStateRef.current.key === "all-phrases" ? "#2563eb" : "#0f172a" }}
                  >
                    🔁 Loop all phrases (bn→en)
                  </button>
                  <button className="bn-btn secondary" onClick={stopLoops}>Stop Loop</button>
                </div>
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
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="bn-btn secondary" onClick={() => speak(v.bn, "bn", { forceApi: true })}>🔈 bn</button>
                      <button className="bn-btn secondary" onClick={() => speak(v.en, "en", { forceApi: true })}>🔈 en</button>
                      <button
                        className="bn-btn secondary"
                        onClick={() =>
                          loopSequence(`vocab-${idx}`, "vocab", [
                            { text: v.bn, lang: "bn", forceApi: true },
                            { text: v.en, lang: "en", forceApi: true },
                          ])
                        }
                        style={{ background: loopStateRef.current.key === `vocab-${idx}` ? "#2563eb" : undefined, color: loopStateRef.current.key === `vocab-${idx}` ? "#fff" : undefined }}
                      >
                        🔁 bn→en
                      </button>
                      <button
                        className="bn-btn secondary"
                        onClick={() =>
                          loopSequence(`vocab-enbn-${idx}`, "vocab", [
                            { text: v.en, lang: "en", forceApi: true },
                            { text: v.bn, lang: "bn", forceApi: true },
                          ])
                        }
                        style={{ background: loopStateRef.current.key === `vocab-enbn-${idx}` ? "#2563eb" : undefined, color: loopStateRef.current.key === `vocab-enbn-${idx}` ? "#fff" : undefined }}
                      >
                        🔁 en→bn
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                  <button
                    className="bn-btn"
                    onClick={() =>
                      loopSequence(
                        "all-vocab",
                        "all",
                        lesson.vocab.flatMap((v, i) => [
                          { text: v.bn, lang: "bn", forceApi: true },
                          { text: v.en, lang: "en", forceApi: true },
                        ])
                      )
                    }
                    style={{ background: loopStateRef.current.key === "all-vocab" ? "#2563eb" : "#0f172a" }}
                  >
                    🔁 Loop all vocab (bn→en)
                  </button>
                  <button
                    className="bn-btn"
                    onClick={() =>
                      loopSequence(
                        "all-vocab-enbn",
                        "all",
                        lesson.vocab.flatMap((v, i) => [
                          { text: v.en, lang: "en", forceApi: true },
                          { text: v.bn, lang: "bn", forceApi: true },
                        ])
                      )
                    }
                    style={{ background: loopStateRef.current.key === "all-vocab-enbn" ? "#2563eb" : "#0f172a" }}
                  >
                    🔁 Loop all vocab (en→bn)
                  </button>
                  <button className="bn-btn secondary" onClick={stopLoops}>Stop Loop</button>
                </div>
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

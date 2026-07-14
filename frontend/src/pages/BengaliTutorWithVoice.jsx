import { useEffect, useMemo, useState } from "react";
import BengaliTutor from "./BengaliTutor.jsx";

const VOICE_STORAGE_KEY = "bengali_tutor_voice";

const getSavedVoice = () => {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

export default function BengaliTutorWithVoice() {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(getSavedVoice);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return undefined;

    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());

    loadVoices();
    synth.addEventListener?.("voiceschanged", loadVoices);

    return () => synth.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  const bengaliVoices = useMemo(() => {
    const matching = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("bn"));
    return matching.length ? matching : voices;
  }, [voices]);

  useEffect(() => {
    if (!selectedVoiceName || bengaliVoices.some((voice) => voice.name === selectedVoiceName)) return;
    setSelectedVoiceName("");
  }, [bengaliVoices, selectedVoiceName]);

  useEffect(() => {
    try {
      if (selectedVoiceName) localStorage.setItem(VOICE_STORAGE_KEY, selectedVoiceName);
      else localStorage.removeItem(VOICE_STORAGE_KEY);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [selectedVoiceName]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return undefined;

    const synth = window.speechSynthesis;
    const originalSpeak = synth.speak.bind(synth);

    const speakWithSelectedVoice = (utterance) => {
      const isBengali = utterance?.lang?.toLowerCase().startsWith("bn");
      if (isBengali && selectedVoiceName) {
        const selectedVoice = synth.getVoices().find((voice) => voice.name === selectedVoiceName);
        if (selectedVoice) voiceUtterance(utterance, selectedVoice);
      }
      originalSpeak(utterance);
    };

    try {
      synth.speak = speakWithSelectedVoice;
    } catch {
      return undefined;
    }

    return () => {
      try {
        synth.speak = originalSpeak;
      } catch {
        // The browser may expose speechSynthesis.speak as read-only.
      }
    };
  }, [selectedVoiceName]);

  const handleVoiceChange = (event) => {
    const voiceName = event.target.value;
    setSelectedVoiceName(voiceName);

    if (!voiceName || typeof window === "undefined" || !window.speechSynthesis) return;
    const voice = window.speechSynthesis.getVoices().find((item) => item.name === voiceName);
    if (!voice) return;

    const preview = new SpeechSynthesisUtterance("স্বাগতম");
    preview.lang = voice.lang || "bn-BD";
    voiceUtterance(preview, voice);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(preview);
  };

  return (
    <>
      <section style={styles.voicePanel} aria-label="Bengali voice settings">
        <label style={styles.label} htmlFor="bengali-voice-select">
          Bengali voice
        </label>
        <select
          id="bengali-voice-select"
          value={selectedVoiceName}
          onChange={handleVoiceChange}
          style={styles.select}
        >
          <option value="">System default</option>
          {bengaliVoices.map((voice) => (
            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <span style={styles.helpText}>
          The selected voice is used for Bengali pronunciation throughout the tutor.
        </span>
      </section>
      <BengaliTutor />
    </>
  );
}

const voiceUtterance = (utterance, voice) => {
  utterance.voice = voice;
  utterance.lang = voice.lang || "bn-BD";
};

const styles = {
  voicePanel: {
    width: "min(100% - 2rem, 1100px)",
    margin: "1rem auto 0",
    padding: "0.9rem 1rem",
    display: "grid",
    gap: "0.45rem",
    border: "1px solid #dbe3ef",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  },
  label: {
    color: "#0f172a",
    fontWeight: 800,
  },
  select: {
    width: "100%",
    minHeight: "44px",
    padding: "0.65rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
  },
  helpText: {
    color: "#64748b",
    fontSize: "0.88rem",
  },
};

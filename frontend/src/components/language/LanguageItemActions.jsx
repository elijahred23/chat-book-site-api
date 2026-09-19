import { useState } from "react";
import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";
import { FaVolumeHigh } from "react-icons/fa6";

const voiceKey = (voice) => `${voice.name}__${voice.lang}`;

const speakSystem = (text, lang, selectedVoiceKey = "") => {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = window.speechSynthesis.getVoices().find((item) => voiceKey(item) === selectedVoiceKey);
  utterance.lang = voice?.lang || lang;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
};

function LanguageIcon({ language }) {
  return <span className="bn-language-icon" aria-hidden="true"><FaVolumeHigh /><span>{language}</span></span>;
}

export default function LanguageItemActions({ item, language, languageCode, languageShort, voice = "", translateCode, renderExtraAction }) {
  const [cloudStatus, setCloudStatus] = useState("idle");
  const source = item.script;
  const hearCloud = async () => {
    setCloudStatus("loading");
    try {
      window.speechSynthesis?.cancel();
      const response = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: source, lang: languageCode }) });
      if (!response.ok) throw new Error("Cloud speech failed");
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      const release = () => URL.revokeObjectURL(url);
      audio.addEventListener("ended", release, { once: true }); audio.addEventListener("error", release, { once: true });
      await audio.play(); setCloudStatus("idle");
    } catch { setCloudStatus("error"); }
  };
  const translateUrl = `https://translate.google.com/?sl=${translateCode}&tl=en&text=${encodeURIComponent(source)}&op=translate`;
  return (
    <div className="bn-game-actions bn-audio-actions language-item-actions" style={{ marginTop: 8 }}>
      <button className="bn-btn secondary bn-icon-btn" onClick={() => speakSystem(source, languageCode, voice)} aria-label={`Hear ${language} with system voice`} title={`Hear ${language} with system voice`}><LanguageIcon language={languageShort} /></button>
      <button className="bn-btn secondary bn-icon-btn" onClick={hearCloud} disabled={cloudStatus === "loading"} aria-label={`Hear ${language} with Google Text-to-Speech`} title={cloudStatus === "error" ? `Google ${language} speech failed. Try again.` : `Hear ${language} with Google Text-to-Speech`}><span className="bn-google-speech-icon" aria-hidden="true"><FcGoogle /><FaVolumeHigh /></span></button>
      <button className="bn-btn secondary bn-icon-btn" onClick={() => speakSystem(item.en, "en-US")} aria-label="Hear English" title="Hear English"><LanguageIcon language="EN" /></button>
      <a className="bn-btn secondary bn-icon-btn" href={translateUrl} target="_blank" rel="noreferrer" aria-label={`Translate ${source} from ${language} to English in Google Translate`} title="Open in Google Translate"><FcGoogle aria-hidden="true" /></a>
      {renderExtraAction?.(item)}
    </div>
  );
}

LanguageIcon.propTypes = { language: PropTypes.string.isRequired };
LanguageItemActions.propTypes = {
  item: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired,
  languageCode: PropTypes.string.isRequired,
  languageShort: PropTypes.string.isRequired,
  voice: PropTypes.string,
  translateCode: PropTypes.string.isRequired,
  renderExtraAction: PropTypes.func,
};

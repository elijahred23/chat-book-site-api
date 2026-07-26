import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaDownload, FaFastBackward, FaFastForward, FaPause, FaPlay, FaRedoAlt, FaStepBackward, FaStepForward, FaStop, FaTrash, FaUpload } from "react-icons/fa";
import BengaliTutor, { SELECTABLE_SAVED_LESSONS } from "./BengaliTutor.jsx";
import { phraseBreakdownItems, withPhraseWords } from "../utils/bengaliPhraseBreakdown.js";
import { getGoogleTtsAudio, GOOGLE_BENGALI_VOICE_KEY } from "../utils/googleTtsAudioCache.js";

const LESSON_KEY = "bengali_lesson_cache";
const SETTINGS_KEY = "bengali_word_loop_settings";
const BN_VOICE_KEY = "bengali_tutor_voice";
const EN_VOICE_KEY = "bengali_tutor_english_voice";
const TRANSLATION_HISTORY_KEY = "bengali_translation_history";
const TRANSLATION_VOICE_KEY = "bengali_translation_voice";
const MAX_SAVED_TRANSLATIONS = 20;

const voiceKey = (voice) => `${voice.name}__${voice.lang}`;
const fileSlug = (value) => String(value || "saved-translation")
  .toLocaleLowerCase()
  .normalize("NFKD")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 60) || "saved-translation";
const storedString = (key) => {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
};
const storedLesson = () => {
  try {
    const lesson = JSON.parse(localStorage.getItem(LESSON_KEY) || "null");
    return lesson ? withPhraseWords(lesson) : null;
  } catch { return null; }
};
const storedSettings = () => {
  const defaults = {
    dataset: "vocab",
    mode: "bengali",
    intervalSize: 10,
    intervalRepeats: 2,
    loopForever: true,
    search: "",
    facet: "all",
    chunkSize: 25,
    chunkIndex: 0,
    showImages: true,
    wordDelay: 0,
    bengaliSpeechSource: "pronunciation",
  };
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return defaults; }
};
const storedTranslations = () => {
  try {
    const records = JSON.parse(localStorage.getItem(TRANSLATION_HISTORY_KEY) || "[]");
    return Array.isArray(records)
      ? records.filter((record) => record?.id && record.bengali && record.pronunciation
        && record.translation && ((Array.isArray(record.sentences) && record.sentences.length)
          || (Array.isArray(record.words) && record.words.length)))
        .map((record) => ({
          ...record,
          sentences: Array.isArray(record.sentences) && record.sentences.length
            ? record.sentences
            : [{
              bengali: record.bengali,
              pronunciation: record.pronunciation,
              translation: record.translation,
              words: record.words,
            }],
        }))
        .slice(0, MAX_SAVED_TRANSLATIONS)
      : [];
  } catch {
    return [];
  }
};
const storedTranslationGameItems = () => storedTranslations().flatMap((record) => record.sentences.map((sentence) => ({
  bn: sentence.bengali,
  pronunciation: sentence.pronunciation,
  en: sentence.translation,
  words: sentence.words,
  category: "Saved translation",
})));

const itemFacets = (item) => {
  const values = [item.category, item.group, item.topic, item.level];
  if (Array.isArray(item.tags)) values.push(...item.tags);
  else if (item.tags) values.push(...String(item.tags).split(","));
  return values.map((value) => String(value || "").trim()).filter(Boolean);
};

export default function BengaliTutorFiltered() {
  const [tab, setTab] = useState("tutor");
  const [lesson, setLesson] = useState(() => {
    const saved = storedLesson();
    return SELECTABLE_SAVED_LESSONS.find((item) => item.id === saved?.id) || SELECTABLE_SAVED_LESSONS[0];
  });
  const [voices, setVoices] = useState([]);
  const [bnVoice, setBnVoice] = useState(() => storedString(BN_VOICE_KEY));
  const [enVoice, setEnVoice] = useState(() => storedString(EN_VOICE_KEY));

  useEffect(() => {
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth?.getVoices?.() || []);
    load();
    synth?.addEventListener?.("voiceschanged", load);
    return () => synth?.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    try {
      bnVoice ? localStorage.setItem(BN_VOICE_KEY, bnVoice) : localStorage.removeItem(BN_VOICE_KEY);
      enVoice ? localStorage.setItem(EN_VOICE_KEY, enVoice) : localStorage.removeItem(EN_VOICE_KEY);
    } catch {}
  }, [bnVoice, enVoice]);

  const bnVoices = useMemo(() => voices.filter((voice) => /^bn/i.test(voice.lang)), [voices]);
  const enVoices = useMemo(() => voices.filter((voice) => /^en/i.test(voice.lang)), [voices]);
  const translationGameItems = useMemo(() => tab === "games" ? storedTranslationGameItems() : [], [tab]);

  const preview = (key, text, lang) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((item) => voiceKey(item) === key);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const selectLesson = (lessonId) => {
    const selectedLesson = SELECTABLE_SAVED_LESSONS.find((item) => item.id === lessonId);
    if (!selectedLesson) return;
    window.speechSynthesis?.cancel();
    setLesson(selectedLesson);
    try {
      localStorage.setItem(LESSON_KEY, JSON.stringify(selectedLesson));
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  };

  return (
    <main style={ui.page}>
      <section style={ui.lessonPicker}>
        <Field label="Saved lesson category">
          <select style={ui.input} value={lesson.id} onChange={(event) => selectLesson(event.target.value)}>
            {SELECTABLE_SAVED_LESSONS.map((savedLesson) => (
              <option key={savedLesson.id} value={savedLesson.id}>{savedLesson.topic}</option>
            ))}
          </select>
        </Field>
      </section>
      <nav style={ui.tabs} aria-label="Bengali tutor sections">
        <button type="button" style={tab === "tutor" ? ui.active : ui.tab} onClick={() => setTab("tutor")}>Tutor</button>
        <button type="button" style={tab === "loop" ? ui.active : ui.tab} onClick={() => setTab("loop")}>Word Loop</button>
        <button type="button" style={tab === "translate" ? ui.active : ui.tab} onClick={() => setTab("translate")}>Bengali → English</button>
        <button type="button" style={tab === "games" ? ui.active : ui.tab} onClick={() => setTab("games")}>Games</button>
      </nav>
      {(tab === "tutor" || tab === "games") && (
        <VoiceSelect
          label="Bengali click voice"
          value={bnVoice}
          voices={bnVoices}
          extraOptions={[{ value: GOOGLE_BENGALI_VOICE_KEY, label: "Google Bengali (Cloud TTS)" }]}
          onChange={async (value) => {
            setBnVoice(value);
            if (value === GOOGLE_BENGALI_VOICE_KEY) {
              try {
                const audioUrl = URL.createObjectURL(await getGoogleTtsAudio("স্বাগতম", "bn-IN"));
                const audio = new Audio(audioUrl);
                const release = () => URL.revokeObjectURL(audioUrl);
                audio.addEventListener("ended", release, { once: true });
                audio.addEventListener("error", release, { once: true });
                try {
                  await audio.play();
                } catch (error) {
                  release();
                  throw error;
                }
              } catch (error) {
                console.error("Google Bengali voice preview error:", error);
              }
            } else if (value) {
              preview(value, "স্বাগতম", "bn-IN");
            }
          }}
        />
      )}
      {tab === "tutor" ? (
        <BengaliTutor key={lesson.id} bengaliVoice={bnVoice} initialLesson={lesson} showLessonSelector={false} />
      ) : tab === "loop" ? (
        <WordLoop key={lesson.id} lesson={lesson} voices={voices} bnVoices={bnVoices} enVoices={enVoices} bnVoice={bnVoice} enVoice={enVoice}
          setBnVoice={setBnVoice} setEnVoice={setEnVoice} preview={preview} />
      ) : tab === "translate" ? (
        <BengaliTranslator />
      ) : (
        <BengaliTutor
          key={`${lesson.id}-games`}
          bengaliVoice={bnVoice}
          initialLesson={lesson}
          showLessonSelector={false}
          translationItems={translationGameItems}
          view="games"
        />
      )}
    </main>
  );
}

function BengaliTranslator() {
  const [text, setText] = useState("");
  const [translations, setTranslations] = useState(storedTranslations);
  const [selectedTranslationId, setSelectedTranslationId] = useState("");
  const [speechSource, setSpeechSource] = useState(() => storedString(TRANSLATION_VOICE_KEY) || "system");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [translationFileStatus, setTranslationFileStatus] = useState("");
  const translationFileInputRef = useRef(null);
  const selectedTranslation = translations.find((record) => record.id === selectedTranslationId) || translations[0] || null;

  useEffect(() => {
    if (selectedTranslation?.id !== selectedTranslationId) {
      setSelectedTranslationId(selectedTranslation?.id || "");
    }
  }, [selectedTranslation, selectedTranslationId]);

  const changeSpeechSource = (value) => {
    setSpeechSource(value);
    try {
      localStorage.setItem(TRANSLATION_VOICE_KEY, value);
    } catch {
      // The selected voice still remains active for this session.
    }
  };

  const speakBengali = async (value) => {
    const spokenText = value?.trim();
    if (!spokenText) return;
    setSpeechError("");
    window.speechSynthesis?.cancel();
    try {
      if (speechSource === "google") {
        const audioUrl = URL.createObjectURL(await getGoogleTtsAudio(spokenText, "bn-IN"));
        const audio = new Audio(audioUrl);
        const release = () => URL.revokeObjectURL(audioUrl);
        audio.addEventListener("ended", release, { once: true });
        audio.addEventListener("error", release, { once: true });
        try {
          await audio.play();
        } catch (audioError) {
          release();
          throw audioError;
        }
        return;
      }
      if (!window.speechSynthesis) throw new Error("System speech synthesis is unavailable.");
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = "bn-IN";
      window.speechSynthesis.speak(utterance);
    } catch (speakError) {
      console.error("Bengali translation speech error:", speakError);
      setSpeechError("Bengali audio is unavailable. Try the other voice option.");
    }
  };

  const deleteTranslation = (record) => {
    if (!window.confirm(`Delete the saved translation “${record.translation}”?`)) return;
    setTranslations((current) => {
      const next = current.filter((item) => item.id !== record.id);
      try {
        if (next.length) localStorage.setItem(TRANSLATION_HISTORY_KEY, JSON.stringify(next));
        else localStorage.removeItem(TRANSLATION_HISTORY_KEY);
      } catch {
        // The translation is still removed for this session when storage is unavailable.
      }
      return next;
    });
  };

  const downloadTranslation = async (record) => {
    const json = `${JSON.stringify(record, null, 2)}\n`;
    const fileName = `${fileSlug(record.translation)}.json`;
    if (window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: "JSON file",
            accept: { "application/json": [".json"] },
          }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(json);
        await writable.close();
        setTranslationFileStatus(`Saved ${fileName}.`);
      } catch (saveError) {
        if (saveError.name !== "AbortError") {
          setTranslationFileStatus(`Could not save ${fileName}: ${saveError.message}`);
        }
      }
      return;
    }
    const url = URL.createObjectURL(new Blob([json], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setTranslationFileStatus(`Downloaded ${fileName}. Use your browser's download settings to choose a folder.`);
  };

  const uploadTranslation = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";
    if (!file) return;
    setTranslationFileStatus("");
    try {
      const value = JSON.parse(await file.text());
      const sentenceFieldsValid = Array.isArray(value?.sentences) && value.sentences.length
        && value.sentences.every((sentence) => sentence?.bengali && sentence.pronunciation && sentence.translation
          && Array.isArray(sentence.words)
          && sentence.words.every((word) => word?.bn && word.pronunciation && word.en));
      if (!value?.bengali || !value.pronunciation || !value.translation || !sentenceFieldsValid) {
        throw new Error("The file is not a complete saved Bengali translation.");
      }
      const importedRecord = {
        ...value,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        savedAt: new Date().toISOString(),
      };
      setSelectedTranslationId(importedRecord.id);
      setTranslations((current) => {
        const next = [importedRecord, ...current].slice(0, MAX_SAVED_TRANSLATIONS);
        try {
          localStorage.setItem(TRANSLATION_HISTORY_KEY, JSON.stringify(next));
        } catch {
          // The uploaded translation remains available for this session.
        }
        return next;
      });
      setTranslationFileStatus(`Added saved translation from ${file.name}.`);
    } catch (fileError) {
      setTranslationFileStatus(`Could not upload ${file.name}: ${fileError.message}`);
    }
  };

  const translate = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, source: "bn", target: "en" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Translation failed (${response.status}).`);
      if (!data.bengali || !data.pronunciation || !data.translation || !Array.isArray(data.sentences) || !data.sentences.length) {
        throw new Error("Gemini returned an incomplete phrase breakdown.");
      }
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        bengali: data.bengali,
        pronunciation: data.pronunciation,
        translation: data.translation,
        sentences: data.sentences,
        savedAt: new Date().toISOString(),
      };
      setSelectedTranslationId(record.id);
      setTranslations((current) => {
        const next = [record, ...current].slice(0, MAX_SAVED_TRANSLATIONS);
        try {
          localStorage.setItem(TRANSLATION_HISTORY_KEY, JSON.stringify(next));
        } catch {
          // The result still remains available for this session when storage is unavailable.
        }
        return next;
      });
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Translation is unavailable.");
      setStatus("error");
    }
  };

  const googleTranslateUrl = `https://translate.google.com/?sl=bn&tl=en&text=${encodeURIComponent(text.trim())}&op=translate`;

  return (
    <section style={ui.translator} aria-labelledby="bengali-translator-title">
      <div>
        <strong style={ui.eyebrow}>Bengali → English</strong>
        <h2 id="bengali-translator-title" style={ui.heading}>Translate Bengali</h2>
        <p style={ui.muted}>Gemini translates the phrase and explains each Bengali word in order. Successful results are saved on this device.</p>
      </div>
      <form style={ui.translatorForm} onSubmit={translate}>
        <Field label="Bengali text">
          <textarea
            style={ui.textarea}
            lang="bn"
            maxLength={5000}
            placeholder="বাংলা লেখা এখানে লিখুন"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </Field>
        <div style={ui.actions}>
          <button type="submit" style={ui.primary} disabled={!text.trim() || status === "loading"}>
            {status === "loading" ? "Building breakdown…" : "Translate with Gemini"}
          </button>
          <a
            style={{ ...ui.button, display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            href={googleTranslateUrl}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!text.trim()}
            onClick={(event) => { if (!text.trim()) event.preventDefault(); }}
          >
            Open in Google Translate
          </a>
        </div>
      </form>
      {error && <div style={ui.notice} role="alert">{error} You can still use “Open in Google Translate.”</div>}
      <div style={ui.speechControls}>
        <Field label="Bengali audio voice">
          <select style={ui.input} value={speechSource} onChange={(event) => changeSpeechSource(event.target.value)}>
            <option value="system">System default</option>
            <option value="google">Google Bengali</option>
          </select>
        </Field>
        <span style={ui.speechHint}>Use the play buttons for a full sentence, or select any Bengali word to hear it.</span>
      </div>
      {speechError && <div style={ui.notice} role="alert">{speechError}</div>}
      <div style={ui.translationHistoryHeader}>
        <h3 style={ui.translationHistoryTitle}>Saved translations</h3>
        <div style={ui.translationHistoryControls}>
          {translations.length > 1 && (
            <label style={ui.translationSelectLabel}>
              <span>Choose translation</span>
              <select
                style={ui.translationSelect}
                value={selectedTranslation?.id || ""}
                onChange={(event) => setSelectedTranslationId(event.target.value)}
              >
                {translations.map((record) => (
                  <option key={record.id} value={record.id}>{record.translation}</option>
                ))}
              </select>
            </label>
          )}
          <button type="button" style={ui.button} onClick={() => translationFileInputRef.current?.click()}>
            <FaUpload aria-hidden="true" /> Upload saved translation
          </button>
          <input ref={translationFileInputRef} type="file" accept="application/json,.json" onChange={uploadTranslation} hidden />
        </div>
      </div>
      {translationFileStatus && <div style={ui.translationFileStatus} role="status">{translationFileStatus}</div>}
      <div style={ui.translationHistory} aria-live="polite">
        {selectedTranslation && [selectedTranslation].map((record) => (
          <article key={record.id} style={ui.translationCard}>
            <div>
              <div style={ui.translationCardHeader}>
                <small style={ui.resultLabel}>{record.id === translations[0]?.id && status === "success" ? "New translation" : "Saved translation"}</small>
                <div style={ui.translationCardActions}>
                  <button
                    type="button"
                    style={ui.downloadButton}
                    onClick={() => downloadTranslation(record)}
                    aria-label={`Download translation: ${record.translation}`}
                    title="Download this saved translation as JSON"
                  >
                    <FaDownload aria-hidden="true" /> Download
                  </button>
                  <button
                    type="button"
                    style={ui.deleteButton}
                    onClick={() => deleteTranslation(record)}
                    aria-label={`Delete translation: ${record.translation}`}
                    title="Delete this saved translation"
                  >
                    <FaTrash aria-hidden="true" /> Delete
                  </button>
                </div>
              </div>
              <div style={ui.resultBengali} lang="bn">{record.bengali}</div>
              <div style={ui.resultPronunciation}>{record.pronunciation}</div>
              <div style={ui.resultEnglish}>{record.translation}</div>
              <button type="button" style={ui.speakButton} onClick={() => speakBengali(record.bengali)}>
                <FaPlay aria-hidden="true" /> Read all Bengali
              </button>
            </div>
            <div style={ui.breakdown}>
              <strong>Sentence breakdown</strong>
              {record.sentences.map((sentence, sentenceIndex) => (
                <section style={ui.sentenceCard} key={`${record.id}-sentence-${sentenceIndex}`}>
                  <div style={ui.sentenceHeader}>
                    <div>
                      <small style={ui.sentenceLabel}>Sentence {sentenceIndex + 1}</small>
                      <div style={ui.sentenceBengali} lang="bn">{sentence.bengali}</div>
                      <div style={ui.resultPronunciation}>{sentence.pronunciation}</div>
                      <div style={ui.resultEnglish}>{sentence.translation}</div>
                    </div>
                    <button
                      type="button"
                      style={ui.iconButton}
                      onClick={() => speakBengali(sentence.bengali)}
                      aria-label={`Read sentence ${sentenceIndex + 1} in Bengali`}
                      title="Read this sentence in Bengali"
                    >
                      <FaPlay aria-hidden="true" />
                    </button>
                  </div>
                  <div style={ui.breakdownList}>
                    {sentence.words.map((word, wordIndex) => (
                      <button
                        type="button"
                        style={ui.breakdownWord}
                        key={`${record.id}-${sentenceIndex}-${word.bn}-${wordIndex}`}
                        onClick={() => speakBengali(word.bn)}
                        aria-label={`Hear ${word.bn} in Bengali`}
                        title="Hear this Bengali word"
                      >
                        <span style={ui.breakdownBengali} lang="bn">{word.bn}</span>
                        <span style={ui.breakdownPronunciation}>{word.pronunciation}</span>
                        <span style={ui.breakdownEnglish}>{word.en}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        ))}
        {!translations.length && <div style={ui.emptyTranslation}>Your saved translations will appear here.</div>}
      </div>
    </section>
  );
}

function WordLoop({ lesson, voices, bnVoices, enVoices, bnVoice, enVoice, setBnVoice, setEnVoice, preview }) {
  const initial = useMemo(storedSettings, []);
  const [dataset, setDataset] = useState(initial.dataset);
  const [mode, setMode] = useState(initial.mode);
  const [intervalSize, setIntervalSize] = useState(initial.intervalSize);
  const [intervalRepeats, setIntervalRepeats] = useState(initial.intervalRepeats);
  const [loopForever, setLoopForever] = useState(initial.loopForever);
  const [search, setSearch] = useState(initial.search);
  const [facet, setFacet] = useState(initial.facet);
  const [chunkSize, setChunkSize] = useState(initial.chunkSize);
  const [chunkIndex, setChunkIndex] = useState(initial.chunkIndex);
  const [showImages, setShowImages] = useState(initial.showImages);
  const [wordDelay, setWordDelay] = useState(initial.wordDelay);
  const [bengaliSpeechSource, setBengaliSpeechSource] = useState(initial.bengaliSpeechSource);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pass, setPass] = useState(1);
  const [status, setStatus] = useState("Ready");
  const [photo, setPhoto] = useState(null);
  const [photoStatus, setPhotoStatus] = useState("idle");
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);
  const passRef = useRef(1);
  const playbackGenerationRef = useRef(0);
  const photoRequestRef = useRef(null);
  const googleAudioRef = useRef(null);

  const sourceItems = useMemo(() => {
    const source = dataset === "breakdowns" || dataset === "phrases"
      ? phraseBreakdownItems(lesson)
      : lesson?.vocab;
    return (source || []).filter((item) => item?.bn && item?.en);
  }, [dataset, lesson]);

  const facets = useMemo(() => [...new Set(sourceItems.flatMap(itemFacets))].sort((a, b) => a.localeCompare(b)), [sourceItems]);
  const matchingItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sourceItems.filter((item) => {
      if (facet !== "all" && !itemFacets(item).some((value) => value.toLocaleLowerCase() === facet.toLocaleLowerCase())) return false;
      if (!query) return true;
      const haystack = [item.bn, item.en, item.pronunciation, item.context, ...itemFacets(item)].join(" ").toLocaleLowerCase();
      return haystack.includes(query);
    });
  }, [sourceItems, search, facet]);

  const safeChunkSize = Math.max(1, Number(chunkSize) || 25);
  const chunkCount = Math.max(1, Math.ceil(matchingItems.length / safeChunkSize));
  const safeChunkIndex = Math.min(Math.max(Number(chunkIndex) || 0, 0), chunkCount - 1);
  const chunkStart = safeChunkIndex * safeChunkSize;
  const items = matchingItems.slice(chunkStart, chunkStart + safeChunkSize);
  const size = Math.max(1, Number(intervalSize) || 1);
  const repeats = Math.max(1, Number(intervalRepeats) || 1);
  const delaySeconds = Math.max(0, Number(wordDelay) || 0);

  const cancelGoogleAudio = useCallback(() => {
    googleAudioRef.current?.finish();
    googleAudioRef.current = null;
  }, []);

  const stop = useCallback((message = "Stopped") => {
    playbackGenerationRef.current += 1;
    playingRef.current = false;
    pausedRef.current = false;
    setPlaying(false);
    setPaused(false);
    setStatus(message);
    window.speechSynthesis?.cancel();
    cancelGoogleAudio();
  }, [cancelGoogleAudio]);

  useEffect(() => {
    if (safeChunkIndex !== Number(chunkIndex)) setChunkIndex(safeChunkIndex);
  }, [chunkIndex, safeChunkIndex]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dataset, mode, intervalSize: size, intervalRepeats: repeats, loopForever, search, facet, chunkSize: safeChunkSize, chunkIndex: safeChunkIndex, showImages, wordDelay: delaySeconds, bengaliSpeechSource }));
    } catch {}
  }, [dataset, mode, size, repeats, loopForever, search, facet, safeChunkSize, safeChunkIndex, showImages, delaySeconds, bengaliSpeechSource]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    stop("Ready");
    indexRef.current = 0;
    passRef.current = 1;
    setCurrentIndex(0);
    setPass(1);
  }, [dataset, mode, intervalSize, intervalRepeats, loopForever, search, facet, safeChunkSize, safeChunkIndex, showImages, delaySeconds, bengaliSpeechSource, bnVoice, enVoice, stop]);

  const jumpToWord = (event) => {
    const nextIndex = Math.min(Math.max(Number(event.target.value) || 0, 0), Math.max(items.length - 1, 0));
    stop(`Ready at item ${chunkStart + nextIndex + 1}`);
    indexRef.current = nextIndex;
    passRef.current = 1;
    setCurrentIndex(nextIndex);
    setPass(1);
  };

  const speak = useCallback(async (text, lang, key) => {
    if (!playingRef.current || !text) return;

    if (key === GOOGLE_BENGALI_VOICE_KEY && /^bn/i.test(lang)) {
      try {
        const audioBlob = await getGoogleTtsAudio(text, "bn-IN");
        if (!playingRef.current) return;
        await new Promise((resolve) => {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          let finished = false;
          const finish = () => {
            if (finished) return;
            finished = true;
            audio.pause();
            URL.revokeObjectURL(audioUrl);
            if (googleAudioRef.current?.audio === audio) googleAudioRef.current = null;
            resolve();
          };
          googleAudioRef.current = { audio, finish };
          audio.addEventListener("ended", finish, { once: true });
          audio.addEventListener("error", finish, { once: true });
          audio.play().catch(finish);
        });
        return;
      } catch (error) {
        console.error("Google Bengali loop voice error:", error);
        setStatus("Google Bengali voice unavailable; using the system voice");
      }
    }

    await new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find((item) => voiceKey(item) === key);
      utterance.lang = voice?.lang || lang;
      if (voice) utterance.voice = voice;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
  }, [voices]);

  const settlePhotoRequest = useCallback((request, rendered) => {
    if (!request || request.settled) return;
    request.settled = true;
    if (request.renderTimer) window.clearTimeout(request.renderTimer);
    request.resolve(rendered);
  }, []);

  const requestPhoto = useCallback((query) => {
    if (!showImages || !query?.trim()) return Promise.resolve(true);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const existing = photoRequestRef.current;
    if (existing?.query === normalizedQuery) return existing.promise;

    if (existing) {
      existing.controller.abort();
      settlePhotoRequest(existing, false);
    }

    const controller = new AbortController();
    const request = { query: normalizedQuery, controller, settled: false };
    request.promise = new Promise((resolve) => { request.resolve = resolve; });
    photoRequestRef.current = request;
    setPhoto(null);
    setPhotoStatus("loading");

    fetch(`/api/vocabulary-image?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Image request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (photoRequestRef.current !== request) return;
        if (!data.image) {
          setPhotoStatus("empty");
          settlePhotoRequest(request, false);
          return;
        }
        setPhoto(data.image);
        setPhotoStatus("rendering");
        request.renderTimer = window.setTimeout(() => {
          if (photoRequestRef.current === request && !request.settled) setPhotoStatus("error");
          settlePhotoRequest(request, false);
        }, 10000);
      })
      .catch((error) => {
        if (photoRequestRef.current !== request) return;
        if (error.name !== "AbortError") setPhotoStatus("error");
        settlePhotoRequest(request, false);
      });
    return request.promise;
  }, [settlePhotoRequest, showImages]);

  const readItem = useCallback(async (item, generation) => {
    await requestPhoto(item.en);
    const isActive = () => playingRef.current && !pausedRef.current && playbackGenerationRef.current === generation;
    if (!isActive()) return;
    const englishSpeechText = dataset === "breakdowns" ? item.breakdownEnglish || item.en : item.en;
    const bengaliSpeechText = bnVoice !== GOOGLE_BENGALI_VOICE_KEY && bengaliSpeechSource === "pronunciation" && item.pronunciation?.trim()
      ? item.pronunciation.trim()
      : item.bn;
    if (mode === "english-bengali") {
      await speak(englishSpeechText, "en-US", enVoice);
      if (isActive()) await speak(bengaliSpeechText, "bn-IN", bnVoice);
      return;
    }
    await speak(bengaliSpeechText, "bn-IN", bnVoice);
    if (mode === "bengali-english" && isActive()) await speak(englishSpeechText, "en-US", enVoice);
  }, [mode, speak, bnVoice, enVoice, requestPhoto, bengaliSpeechSource, dataset]);

  const waitBeforeNextWord = useCallback((generation) => new Promise((resolve) => {
    if (!delaySeconds) return resolve(playingRef.current && !pausedRef.current && playbackGenerationRef.current === generation);
    window.setTimeout(() => {
      resolve(playingRef.current && !pausedRef.current && playbackGenerationRef.current === generation);
    }, delaySeconds * 1000);
  }), [delaySeconds]);

  const play = useCallback(async (resumeIndex, generation) => {
    let batchStart = Math.floor(resumeIndex / size) * size;
    let currentPass = passRef.current;
    while (playingRef.current && playbackGenerationRef.current === generation) {
      const batchEnd = Math.min(batchStart + size, items.length);
      for (let index = Math.max(resumeIndex, batchStart); index < batchEnd; index += 1) {
        if (!playingRef.current || pausedRef.current) return;
        indexRef.current = index;
        setCurrentIndex(index);
        setPass(currentPass);
        setStatus(`Chunk ${safeChunkIndex + 1}/${chunkCount} · Item ${index + 1}/${items.length} · Set ${Math.floor(batchStart / size) + 1}/${Math.ceil(items.length / size)} · Pass ${currentPass}/${repeats}`);
        await readItem(items[index], generation);
        const finishesPlayback = !loopForever && batchEnd >= items.length && currentPass >= repeats && index === batchEnd - 1;
        if (!finishesPlayback && !await waitBeforeNextWord(generation)) return;
      }
      if (!playingRef.current || pausedRef.current) return;
      if (currentPass < repeats) {
        currentPass += 1;
        passRef.current = currentPass;
        resumeIndex = batchStart;
        continue;
      }
      batchStart = batchEnd;
      currentPass = 1;
      passRef.current = 1;
      if (batchStart >= items.length) {
        if (!loopForever) return stop("Completed active chunk");
        batchStart = 0;
        setStatus("Starting the active chunk again");
      }
      resumeIndex = batchStart;
    }
  }, [items, loopForever, readItem, repeats, size, stop, safeChunkIndex, chunkCount, waitBeforeNextWord]);

  const start = () => {
    if (!items.length) return;
    window.speechSynthesis.cancel();
    playingRef.current = true;
    pausedRef.current = false;
    playbackGenerationRef.current += 1;
    const generation = playbackGenerationRef.current;
    setPlaying(true);
    setPaused(false);
    play(indexRef.current, generation);
  };
  const togglePause = () => {
    if (!playing) return;
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      playbackGenerationRef.current += 1;
      play(indexRef.current, playbackGenerationRef.current);
    } else {
      playbackGenerationRef.current += 1;
      pausedRef.current = true;
      setPaused(true);
      setStatus("Paused");
      window.speechSynthesis.cancel();
      cancelGoogleAudio();
    }
  };
  const restart = () => {
    stop("Ready from the beginning of this chunk");
    indexRef.current = 0;
    passRef.current = 1;
    setCurrentIndex(0);
    setPass(1);
  };

  const goToWord = (nextIndex) => {
    if (!items.length) return;
    const boundedIndex = Math.min(Math.max(nextIndex, 0), items.length - 1);
    stop(`Ready at item ${chunkStart + boundedIndex + 1}`);
    indexRef.current = boundedIndex;
    passRef.current = 1;
    setCurrentIndex(boundedIndex);
    setPass(1);
  };

  const goToInterval = (direction) => {
    const intervalStart = Math.floor(currentIndex / size) * size;
    goToWord(intervalStart + direction * size);
  };

  const goToChunk = (direction) => {
    stop("Ready");
    setChunkIndex((value) => Math.min(chunkCount - 1, Math.max(0, Number(value) + direction)));
  };

  const item = items[currentIndex];
  const chunkLabel = matchingItems.length ? `${chunkStart + 1}–${Math.min(chunkStart + safeChunkSize, matchingItems.length)}` : "0";

  useEffect(() => {
    const query = item?.en?.trim();
    if (!query || !showImages) {
      const existing = photoRequestRef.current;
      if (existing) {
        existing.controller.abort();
        settlePhotoRequest(existing, false);
        photoRequestRef.current = null;
      }
      setPhoto(null);
      setPhotoStatus("idle");
      return;
    }
    requestPhoto(query);
  }, [item?.en, requestPhoto, settlePhotoRequest, showImages]);

  useEffect(() => () => {
    const existing = photoRequestRef.current;
    if (existing) {
      existing.controller.abort();
      settlePhotoRequest(existing, false);
    }
  }, [settlePhotoRequest]);

  return (
    <section className="bn-word-loop" style={ui.card}>
      <div><strong style={ui.eyebrow}>Focused practice</strong><h1 style={ui.heading}>Bengali Word Loop</h1>
        <p style={ui.muted}>Filter a large lesson, switch between study chunks, and loop only the active chunk.</p></div>

      <section style={ui.filterPanel} aria-label="Word filters">
        <div style={ui.grid}>
          <Field label="Items"><select style={ui.input} value={dataset} onChange={(event) => { setDataset(event.target.value); setChunkIndex(0); }}><option value="vocab">Vocabulary words</option><option value="phrases">Lesson phrases</option><option value="breakdowns">Phrase breakdowns</option></select></Field>
          <Field label="Words per study chunk"><select style={ui.input} value={safeChunkSize} onChange={(event) => { setChunkSize(Number(event.target.value)); setChunkIndex(0); }}><option value="10">10</option><option value="20">20</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="150">150</option><option value="200">200</option><option value="250">250</option><option value="300">300</option></select></Field>
        </div>
        <div style={ui.chunkRow}>
          <Field label={`Study chunk (${matchingItems.length} matching)`}><select style={ui.input} value={safeChunkIndex} onChange={(event) => setChunkIndex(Number(event.target.value))}>{Array.from({ length: chunkCount }, (_, index) => { const start = index * safeChunkSize + 1; const end = Math.min((index + 1) * safeChunkSize, matchingItems.length); return <option key={index} value={index}>Chunk {index + 1}: {matchingItems.length ? `${start}–${end}` : "empty"}</option>; })}</select></Field>
        </div>
        <div style={ui.summary}>Showing {items.length} items from positions {chunkLabel} of {matchingItems.length} filtered results, from {sourceItems.length} total.</div>
      </section>

      <div style={ui.grid}>
        <Field label="Reading mode"><select style={ui.input} value={mode} onChange={(event) => setMode(event.target.value)}><option value="bengali">Bengali only</option><option value="bengali-english">Bengali, then English</option><option value="english-bengali">English, then Bengali</option></select></Field>
        <Field label="Words per interval"><input style={ui.input} type="number" min="1" value={intervalSize} onChange={(event) => setIntervalSize(event.target.value)} /></Field>
        <Field label="Repeat each interval"><input style={ui.input} type="number" min="1" value={intervalRepeats} onChange={(event) => setIntervalRepeats(event.target.value)} /></Field>
        <Field label="Delay before next word (seconds)"><input style={ui.input} type="number" min="0" step="0.5" value={wordDelay} onChange={(event) => setWordDelay(event.target.value)} /></Field>
      </div>
      {items.length > 0 && <Field label={dataset === "breakdowns" || dataset === "phrases" ? "Skip to phrase in active chunk" : "Skip to word in active chunk"}><select style={ui.input} value={currentIndex} onChange={jumpToWord}>{items.map((word, index) => <option key={`${word.bn}-${word.en}-${index}`} value={index}>{chunkStart + index + 1}. {word.pronunciation || word.bn} · {word.en}</option>)}</select></Field>}
      <div style={ui.grid}>
        <div style={ui.voiceStack}>
          <VoiceSelect
            compact
            label="Bengali voice"
            value={bnVoice}
            voices={bnVoices}
            extraOptions={[{ value: GOOGLE_BENGALI_VOICE_KEY, label: "Google Bengali (Cloud TTS)" }]}
            onChange={async (value) => {
              setBnVoice(value);
              if (value === GOOGLE_BENGALI_VOICE_KEY) {
                try {
                  const audioUrl = URL.createObjectURL(await getGoogleTtsAudio("স্বাগতম", "bn-IN"));
                  const audio = new Audio(audioUrl);
                  const release = () => URL.revokeObjectURL(audioUrl);
                  audio.addEventListener("ended", release, { once: true });
                  audio.addEventListener("error", release, { once: true });
                  try {
                    await audio.play();
                  } catch (error) {
                    release();
                    throw error;
                  }
                } catch (error) {
                  console.error("Google Bengali voice preview error:", error);
                }
              } else if (value) {
                preview(value, "স্বাগতম", "bn-IN");
              }
            }}
          />
          <Field label="Bengali speech source"><select style={ui.input} value={bengaliSpeechSource} onChange={(event) => setBengaliSpeechSource(event.target.value)}><option value="pronunciation">Pronunciation (fallback to Bengali script)</option><option value="bengali">Bengali script</option></select></Field>
        </div>
        <VoiceSelect compact label="English voice" value={enVoice} voices={enVoices} onChange={(value) => { setEnVoice(value); if (value) preview(value, "Welcome to Bengali practice", "en-US"); }} />
      </div>
      <div className="bn-word-loop__toggles" style={ui.toggles}>
        <label className="bn-word-loop__toggle" style={ui.check}><input type="checkbox" checked={loopForever} onChange={(event) => setLoopForever(event.target.checked)} /><span>Loop the active study chunk forever</span></label>
        <label className="bn-word-loop__toggle" style={ui.check}><input type="checkbox" checked={showImages} onChange={(event) => setShowImages(event.target.checked)} /><span>Show stock photos for vocabulary words</span></label>
      </div>
      {!lesson ? <div style={ui.notice}>Generate or upload a lesson in the Tutor tab first.</div> : !items.length ? <div style={ui.notice}>No items match the active filters.</div> : <>
        <div style={ui.flash}><small>Chunk {safeChunkIndex + 1}/{chunkCount} · {currentIndex + 1}/{items.length} · Overall filtered position {chunkStart + currentIndex + 1}/{matchingItems.length} · Pass {pass}/{repeats}</small><strong lang="bn" style={ui.bn}>{item?.bn}</strong>{item?.pronunciation && <strong style={ui.activePronunciation}>{item.pronunciation}</strong>}<span style={ui.en}>{item?.en}</span>{(dataset === "breakdowns" || dataset === "phrases") && <section className="bn-loop-breakdown" aria-label="Complete phrase breakdown"><strong className="bn-loop-breakdown__title">Phrase breakdown</strong><div className="bn-loop-breakdown__literal"><small>Literal Bengali order</small><span>{item?.breakdownEnglish}</span></div><div className="bn-loop-breakdown__grid">{item?.words?.map((word, wordIndex) => <article className="bn-loop-breakdown__word" key={`${item.bn}-${word.bn}-${wordIndex}`}><span lang="bn">{word.bn}</span><strong>{word.pronunciation}</strong><small>{word.en}</small></article>)}</div></section>}
          {showImages && <div style={ui.photoFrame} aria-live="polite">
            {photoStatus === "loading" && <span style={ui.muted}>Finding a photo…</span>}
            {photoStatus === "empty" && <span style={ui.muted}>No photo found for this item.</span>}
            {photoStatus === "error" && <span style={ui.muted}>Photo unavailable.</span>}
            {(photoStatus === "rendering" || photoStatus === "ready") && photo && <><img style={ui.photo} src={photo.imageUrl} alt={photo.title || item.en} referrerPolicy="no-referrer" onLoad={() => { setPhotoStatus("ready"); settlePhotoRequest(photoRequestRef.current, true); }} onError={() => { setPhotoStatus("error"); settlePhotoRequest(photoRequestRef.current, false); }} />
              <small style={ui.credit}>{photo.creator && <>Photo by {photo.creator} · </>}<a href={photo.sourceUrl || photo.fullImageUrl} target="_blank" rel="noreferrer">View source</a>{photo.license && <> · {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license.toUpperCase()}</a> : photo.license.toUpperCase()}</>}</small></>}
          </div>}
        </div>
        <div className="bn-word-loop__actions" style={ui.actions} role="group" aria-label="Word loop controls">
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton label="Previous chunk" disabled={safeChunkIndex === 0} onClick={() => goToChunk(-1)}><FaAngleDoubleLeft /></IconButton>
            <IconButton label="Next chunk" disabled={safeChunkIndex >= chunkCount - 1} onClick={() => goToChunk(1)}><FaAngleDoubleRight /></IconButton>
          </span>
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton label="Previous interval" disabled={currentIndex < size} onClick={() => goToInterval(-1)}><FaFastBackward /></IconButton>
            <IconButton label="Next interval" disabled={Math.floor(currentIndex / size) * size + size >= items.length} onClick={() => goToInterval(1)}><FaFastForward /></IconButton>
          </span>
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton label="Previous word" disabled={currentIndex === 0} onClick={() => goToWord(currentIndex - 1)}><FaStepBackward /></IconButton>
            <IconButton label="Next word" disabled={currentIndex >= items.length - 1} onClick={() => goToWord(currentIndex + 1)}><FaStepForward /></IconButton>
          </span>
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton primary label={paused ? "Resume" : playing ? "Playing" : "Start"} disabled={playing && !paused} onClick={start}><FaPlay /></IconButton>
            <IconButton label={paused ? "Resume" : "Pause"} disabled={!playing} onClick={togglePause}>{paused ? <FaPlay /> : <FaPause />}</IconButton>
            <IconButton label="Stop" disabled={!playing && !paused} onClick={() => stop()}><FaStop /></IconButton>
            <IconButton label="Restart chunk" onClick={restart}><FaRedoAlt /></IconButton>
          </span>
        </div>
        <strong style={ui.muted}>{status}</strong></>}
    </section>
  );
}

function VoiceSelect({ label, value, voices, onChange, compact, extraOptions = [] }) {
  return <section style={compact ? ui.voiceCompact : ui.voice}><Field label={label}><select style={ui.input} value={value} onChange={(event) => onChange(event.target.value)}><option value="">System default</option>{extraOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}{voices.map((voice) => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} ({voice.lang})</option>)}</select></Field></section>;
}
function Field({ label, children }) { return <label style={ui.field}><strong>{label}</strong>{children}</label>; }
// This file's existing local components intentionally use lightweight destructured props.
// eslint-disable-next-line react/prop-types
function IconButton({ label, children, disabled, onClick, primary }) { return <button type="button" style={primary ? ui.iconPrimary : ui.iconButton} disabled={disabled} onClick={onClick} aria-label={label} title={label}>{children}</button>; }

const ui = {
  page: { minHeight: "100%", color: "#0f172a" },
  lessonPicker: { width: "min(100% - 2rem, 1100px)", margin: "1rem auto 0", padding: "1rem", border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff" },
  tabs: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 0", padding: ".35rem", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: ".35rem", background: "#e2e8f0", borderRadius: 14 },
  tab: { minHeight: 44, border: 0, borderRadius: 10, background: "transparent", color: "#334155", fontWeight: 800 },
  active: { minHeight: 44, border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 900 },
  voice: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 0", padding: "1rem", border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff" },
  translator: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 0", padding: "1rem", display: "grid", gap: ".85rem", border: "1px solid #bfdbfe", borderRadius: 14, background: "#f8fbff" },
  translatorForm: { display: "grid", gap: ".75rem" },
  textarea: { width: "100%", minHeight: 110, resize: "vertical", padding: ".75rem", border: "1px solid #94a3b8", borderRadius: 10, background: "#fff", color: "#0f172a", font: "inherit", fontSize: "1.1rem" },
  translationHistory: { display: "grid", gap: ".85rem" },
  translationHistoryHeader: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: ".75rem" },
  translationHistoryTitle: { margin: 0, color: "#0f172a" },
  translationHistoryControls: { display: "flex", flex: "1 1 440px", flexWrap: "wrap", alignItems: "end", justifyContent: "flex-end", gap: ".6rem" },
  translationSelectLabel: { flex: "1 1 240px", display: "grid", gap: ".3rem", color: "#334155", fontSize: ".82rem", fontWeight: 800 },
  translationSelect: { width: "100%", minHeight: 44, padding: ".6rem .7rem", border: "1px solid #94a3b8", borderRadius: 10, background: "#fff", color: "#0f172a", font: "inherit", fontWeight: 700 },
  translationFileStatus: { color: "#475569", fontWeight: 700, overflowWrap: "anywhere" },
  translationCard: { padding: "1rem", display: "grid", gap: "1rem", border: "1px solid #86efac", borderRadius: 14, background: "#f0fdf4", color: "#14532d" },
  translationCardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".75rem" },
  translationCardActions: { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: ".45rem" },
  resultLabel: { color: "#15803d", fontWeight: 850, textTransform: "uppercase", letterSpacing: ".04em" },
  downloadButton: { minHeight: 36, padding: ".45rem .65rem", display: "inline-flex", alignItems: "center", gap: ".35rem", border: "1px solid #bfdbfe", borderRadius: 8, background: "#fff", color: "#1d4ed8", fontWeight: 800 },
  deleteButton: { minHeight: 36, padding: ".45rem .65rem", display: "inline-flex", alignItems: "center", gap: ".35rem", border: "1px solid #fecaca", borderRadius: 8, background: "#fff", color: "#b91c1c", fontWeight: 800 },
  resultBengali: { marginTop: ".35rem", color: "#0f172a", fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 850, lineHeight: 1.3 },
  resultPronunciation: { marginTop: ".25rem", color: "#1d4ed8", fontSize: "1.05rem", fontWeight: 750 },
  resultEnglish: { marginTop: ".45rem", color: "#14532d", fontSize: "1.15rem", fontWeight: 850 },
  speechControls: { padding: ".85rem", display: "grid", gridTemplateColumns: "minmax(180px, 280px) minmax(0, 1fr)", alignItems: "end", gap: ".75rem", border: "1px solid #bfdbfe", borderRadius: 12, background: "#eff6ff" },
  speechHint: { minHeight: 44, display: "flex", alignItems: "center", color: "#475569", fontWeight: 700 },
  speakButton: { minHeight: 40, marginTop: ".65rem", padding: ".55rem .8rem", display: "inline-flex", alignItems: "center", gap: ".4rem", border: 0, borderRadius: 9, background: "#166534", color: "#fff", fontWeight: 800 },
  breakdown: { display: "grid", gap: ".55rem" },
  sentenceCard: { padding: ".85rem", display: "grid", gap: ".75rem", border: "1px solid #86efac", borderRadius: 12, background: "#ecfdf5" },
  sentenceHeader: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start", gap: ".75rem" },
  sentenceLabel: { color: "#047857", fontWeight: 850, textTransform: "uppercase", letterSpacing: ".04em" },
  sentenceBengali: { marginTop: ".25rem", color: "#0f172a", fontSize: "1.6rem", fontWeight: 850, lineHeight: 1.3 },
  breakdownList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: ".55rem" },
  breakdownWord: { minWidth: 0, padding: ".7rem", display: "grid", gap: ".2rem", border: "1px solid #bbf7d0", borderRadius: 10, background: "#fff", color: "#0f172a", font: "inherit", textAlign: "left", cursor: "pointer" },
  breakdownBengali: { color: "#0f172a", fontSize: "1.35rem", fontWeight: 850, overflowWrap: "anywhere" },
  breakdownPronunciation: { color: "#1d4ed8", fontWeight: 700, overflowWrap: "anywhere" },
  breakdownEnglish: { color: "#475569", overflowWrap: "anywhere" },
  emptyTranslation: { padding: "1rem", border: "1px dashed #94a3b8", borderRadius: 12, color: "#64748b", textAlign: "center" },
  voiceCompact: { padding: ".85rem", border: "1px solid #dbe3ef", borderRadius: 12, background: "#f8fafc" },
  voiceStack: { display: "grid", alignContent: "start", gap: ".65rem" },
  card: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 1.5rem", padding: "1rem", display: "grid", gap: "1rem", border: "1px solid #dbe3ef", borderRadius: 16, background: "#fff" },
  filterPanel: { display: "grid", gap: ".8rem", padding: "1rem", border: "1px solid #bfdbfe", borderRadius: 14, background: "#f8fbff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: ".75rem" },
  chunkRow: { display: "grid", gridTemplateColumns: "minmax(210px,1fr)", alignItems: "end", gap: ".6rem" },
  field: { display: "grid", gap: ".4rem", color: "#0f172a" },
  input: { width: "100%", minHeight: 44, padding: ".65rem .75rem", border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 700 },
  check: { display: "flex", gap: ".55rem", alignItems: "center", color: "#0f172a", fontWeight: 800 },
  toggles: { display: "grid", gap: ".55rem" },
  summary: { color: "#475569", fontSize: ".9rem", fontWeight: 700 },
  flash: { minHeight: 180, padding: "1.25rem", display: "grid", placeItems: "center", alignContent: "center", gap: ".45rem", border: "1px solid #bfdbfe", borderRadius: 16, background: "linear-gradient(145deg,#eff6ff,#f0fdf4)", textAlign: "center" },
  activePronunciation: { color: "#1d4ed8", fontSize: "clamp(1.35rem,4vw,2rem)", lineHeight: 1.25 },
  photoFrame: { width: "min(100%, 560px)", minHeight: 80, marginTop: ".5rem", display: "grid", placeItems: "center", gap: ".35rem" },
  photo: { width: "100%", maxHeight: 320, display: "block", objectFit: "cover", borderRadius: 14, background: "#e2e8f0" },
  credit: { color: "#475569" },
  bn: { color: "#0f172a", fontSize: "clamp(2rem,7vw,4rem)", lineHeight: 1.2 },
  en: { color: "#1e3a8a", fontSize: "1.2rem", fontWeight: 850 },
  actions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".45rem" },
  controlGroup: { display: "inline-flex", gap: ".25rem", padding: ".25rem", border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc" },
  iconButton: { width: 34, height: 34, padding: 0, display: "inline-grid", placeItems: "center", border: "1px solid #94a3b8", borderRadius: 8, background: "#fff", color: "#0f172a", fontSize: ".85rem" },
  iconPrimary: { width: 34, height: 34, padding: 0, display: "inline-grid", placeItems: "center", border: 0, borderRadius: 8, background: "#0f172a", color: "#fff", fontSize: ".85rem" },
  primary: { minHeight: 44, padding: ".65rem 1rem", border: 0, borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 850 },
  button: { minHeight: 44, padding: ".65rem 1rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: ".45rem", border: "1px solid #94a3b8", borderRadius: 10, background: "#f8fafc", color: "#0f172a", fontWeight: 800 },
  notice: { padding: "1rem", borderRadius: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 750 },
  eyebrow: { color: "#2563eb", fontSize: ".78rem", textTransform: "uppercase" },
  heading: { margin: ".25rem 0", color: "#0f172a" },
  muted: { color: "#64748b" },
};

/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import LanguageTutorTabs from "../components/language/LanguageTutorTabs.jsx";
import LanguageTutorContentTabs from "../components/language/LanguageTutorContentTabs.jsx";
import LanguageTutorItemList from "../components/language/LanguageTutorItemList.jsx";
import LanguageTutorScroller from "../components/language/LanguageTutorScroller.jsx";
import LanguageLessonPicker from "../components/language/LanguageLessonPicker.jsx";
import LanguageVoicePicker from "../components/language/LanguageVoicePicker.jsx";
import LanguageTutorHero from "../components/language/LanguageTutorHero.jsx";
import LanguageLessonHeader from "../components/language/LanguageLessonHeader.jsx";
import LanguageMp3Downloads from "../components/language/LanguageMp3Downloads.jsx";
import LanguageContentOptions from "../components/language/LanguageContentOptions.jsx";
import LanguageItemActions from "../components/language/LanguageItemActions.jsx";
import LanguagePhraseBreakdown from "../components/language/LanguagePhraseBreakdown.jsx";
import { normalizeLanguageItems } from "../utils/languageLessonAdapter.js";
import { LanguageTranslator, WordLoop } from "./BengaliTutorFiltered.jsx";
import BengaliTutor from "./BengaliTutor.jsx";
import { ARABIC_LESSONS } from "../data/arabicLessons.js";
import "./ArabicTutor.css";

const LESSON_KEY = "arabic-tutor-lesson";
const PROGRESS_KEY = "arabic-tutor-progress";
const readStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
};

const speak = (text, lang = "ar-SA", voiceKey = "", rate = 0.78) => {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = window.speechSynthesis.getVoices().find((item) => `${item.name}__${item.lang}` === voiceKey);
  utterance.lang = voice?.lang || lang;
  utterance.rate = rate;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
};

export default function ArabicTutor() {
  const savedLessonId = readStored(LESSON_KEY, ARABIC_LESSONS[0].id);
  const [tab, setTab] = useState("tutor");
  const [lessonId, setLessonId] = useState(savedLessonId);
  const [voices, setVoices] = useState([]);
  const [arabicVoice, setArabicVoice] = useState("");
  const [englishVoice, setEnglishVoice] = useState("");
  const [progress] = useState(() => readStored(PROGRESS_KEY, {}));
  const lesson = ARABIC_LESSONS.find((item) => item.id === lessonId) || ARABIC_LESSONS[0];

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth?.getVoices?.() || []);
    loadVoices();
    synth?.addEventListener?.("voiceschanged", loadVoices);
    return () => synth?.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  useEffect(() => localStorage.setItem(LESSON_KEY, JSON.stringify(lesson.id)), [lesson.id]);
  useEffect(() => localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)), [progress]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const arabicVoices = voices.filter((voice) => /^ar/i.test(voice.lang));
  const englishVoices = voices.filter((voice) => /^en/i.test(voice.lang));
  const loopLesson = useMemo(() => ({ ...lesson, phrases: lesson.phrases.map((item) => ({ ...item, bn: item.ar, words: item.words?.map((word) => ({ ...word, bn: word.ar })), breakdownEnglish: item.words?.map((word) => word.en).join(" ") })), vocab: lesson.vocab.map((item) => ({ ...item, bn: item.ar })) }), [lesson]);
  const preview = (key, text, lang) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const selected = voices.find((item) => `${item.name}__${item.lang}` === key);
    utterance.lang = selected?.lang || lang; if (selected) utterance.voice = selected;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  };
  const chooseLesson = (id) => {
    window.speechSynthesis?.cancel();
    setLessonId(id);
  };

  return (
    <main className="arabic-page bn-page">
      <LanguageLessonPicker lessons={ARABIC_LESSONS} value={lesson.id} onChange={chooseLesson} getLabel={(item) => `${item.topic} — ${item.title}`} />

      <LanguageTutorTabs language="Arabic" activeTab={tab} onChange={setTab} className="arabic-learning-tabs" />

      {(tab === "tutor" || tab === "games") && (
        <LanguageVoicePicker label="Arabic click voice" value={arabicVoice} voices={arabicVoices} onChange={(value) => { setArabicVoice(value); speak("مَرْحَبًا", "ar-SA", value); }} />
      )}

      {tab === "tutor" && <Tutor lesson={lesson} voice={arabicVoice} completed={Boolean(progress[lesson.id])} />}
      {tab === "loop" && <WordLoop key={lesson.id} lesson={loopLesson} voices={voices} bnVoices={arabicVoices} enVoices={englishVoices} bnVoice={arabicVoice} enVoice={englishVoice} setBnVoice={setArabicVoice} setEnVoice={setEnglishVoice} preview={preview} translationSets={[]} language="Arabic" languageCode="ar-XA" languageTag="ar" welcomeText="مَرْحَبًا" cloudVoiceKey="google-arabic-cloud" settingsKey="arabic_word_loop_settings" />}
      {tab === "translate" && <LanguageTranslator language="Arabic" sourceCode="ar" languageCode="ar-XA" languageTag="ar" placeholder="اكتب العربية هنا…" historyKey="arabic_translation_history" voiceKey="arabic_translation_voice" enableBreakdownDrawer={false} />}
      {tab === "games" && (
        <BengaliTutor
          key={`${lesson.id}-games`}
          bengaliVoice={arabicVoice}
          initialLesson={loopLesson}
          showLessonSelector={false}
          translationSets={[]}
          view="games"
          languageName="Arabic"
          languageCode="ar-SA"
          languageTag="ar"
          nativeName="العربية"
          gameStorageKey="arabic_game_direction"
          recallPlaceholder="اكتب بالعربية"
          enableBreakdownDrawer={false}
        />
      )}
      {tab === "downloads" && <LanguageMp3Downloads language="Arabic" languageCode="ar-XA" scriptKey="ar" sourceName={lesson.title} collections={[{ id: "phrases", label: "lesson phrases", items: lesson.phrases }, { id: "vocab", label: "lesson vocabulary", items: lesson.vocab }]} className="arabic-tool-card arabic-download-card" />}
    </main>
  );
}

function Tutor({ lesson, voice, completed }) {
  const [contentTab, setContentTab] = useState("phrases");
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [visibleContent, setVisibleContent] = useState({ script: true, pronunciation: true, english: true, breakdown: true });
  const [breakdownSpeechSource, setBreakdownSpeechSource] = useState("google");
  const sourceItems = contentTab === "phrases" ? lesson.phrases : lesson.vocab;
  const items = useMemo(() => {
    const normalized = normalizeLanguageItems(sourceItems, "ar");
    return shuffleVersion ? normalized.sort(() => Math.random() - .5) : normalized;
  }, [shuffleVersion, sourceItems]);
  const speakBreakdownWord = async (text, source) => {
    if (source === "system") { speak(text, "ar-SA", voice); return; }
    try {
      const response = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang: "ar-XA" }) });
      if (!response.ok) throw new Error("Cloud speech failed");
      const url = URL.createObjectURL(await response.blob()); const audio = new Audio(url); audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true }); await audio.play();
    } catch { speak(text, "ar-SA", voice); }
  };
  return (
    <div className="bn-shell">
      <LanguageTutorHero nativeName="العربية" languageCode="ar" direction="rtl" title="Tutor" eyebrow="Learn naturally" description="Choose a saved lesson, hear pronunciation, and build understanding phrase by phrase." className="bn-card bn-header-card" copyClassName="bn-hero-copy" kickerClassName="bn-kicker">
        <div className="bn-action-area"><LanguageContentOptions value={visibleContent} onChange={setVisibleContent} scriptLabel="Arabic" className="bn-content-options" /></div>
      </LanguageTutorHero>
      <section className="bn-card bn-lesson-card">
        <LanguageLessonHeader title={lesson.title} summary={lesson.summary} badges={[completed ? "Completed" : "", lesson.level, lesson.focus, `${lesson.phrases.length + lesson.vocab.length} items`]} className="bn-lesson-heading-shared" badgeClassName="bn-pill" />
        <div className="bn-tutor-order-controls">
          <LanguageTutorContentTabs activeTab={contentTab} onChange={(nextTab) => { setContentTab(nextTab); setShuffleVersion(0); }} phraseCount={lesson.phrases.length} vocabCount={lesson.vocab.length} className="bn-tabs" buttonClassName="bn-tab" />
          <button type="button" className="bn-btn secondary bn-shuffle-btn" disabled={items.length < 2} onClick={() => setShuffleVersion((version) => version + 1)}>Shuffle {contentTab === "phrases" ? "phrases" : "vocabulary"}</button>
        </div>
        <LanguageTutorScroller items={items} itemType={contentTab} idPrefix="ar" storagePrefix="arabic-tutor-scroll" scriptKey="script">
          <LanguageTutorItemList
          items={items}
          kind={contentTab}
          scriptKey="script"
          languageCode="ar"
          direction="rtl"
          visibleContent={visibleContent}
          idPrefix="ar"
          classes={{
            section: "bn-section bn-shared-item-list",
            heading: "bn-content-heading",
            card: "bn-section bn-shared-item-card",
            copy: "bn-shared-item-copy",
            script: "bn-script arabic-script",
            pronunciation: "bn-pronunciation",
            translation: "bn-translation",
            context: "bn-context",
          }}
          renderBreakdown={(phrase) => <LanguagePhraseBreakdown phrase={phrase} languageCode="ar" direction="rtl" speechSource={breakdownSpeechSource} onSpeechSourceChange={setBreakdownSpeechSource} onSpeakWord={speakBreakdownWord} visiblePronunciation={visibleContent.pronunciation} />}
          renderActions={(item) => <LanguageItemActions item={item} language="Arabic" languageCode="ar-XA" languageShort="AR" translateCode="ar" voice={voice} />}
          />
        </LanguageTutorScroller>
        <section className="bn-section"><h3>Lesson notes</h3>{lesson.notes.map((note) => <p key={note}>• {note}</p>)}</section>
      </section>
    </div>
  );
}

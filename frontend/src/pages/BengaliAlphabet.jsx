import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";
import {
  FaArrowRight,
  FaBookOpen,
  FaCheck,
  FaGamepad,
  FaLanguage,
  FaPenNib,
  FaPlay,
  FaRotateRight,
  FaVolumeHigh,
} from "react-icons/fa6";
import { getGoogleTtsAudio } from "../utils/googleTtsAudioCache.js";
import "./BengaliAlphabet.css";

const VOWELS = [
  { bn: "অ", sound: "ô", example: "অজগর", word: "ôjogor", meaning: "python" },
  { bn: "আ", sound: "a", example: "আম", word: "am", meaning: "mango" },
  { bn: "ই", sound: "i", example: "ইঁদুর", word: "ĩdur", meaning: "mouse" },
  { bn: "ঈ", sound: "ee", example: "ঈগল", word: "eegol", meaning: "eagle" },
  { bn: "উ", sound: "u", example: "উট", word: "uṭ", meaning: "camel" },
  { bn: "ঊ", sound: "oo", example: "ঊষা", word: "usha", meaning: "dawn" },
  { bn: "ঋ", sound: "ri", example: "ঋষি", word: "rishi", meaning: "sage" },
  { bn: "এ", sound: "e", example: "এক", word: "ek", meaning: "one" },
  { bn: "ঐ", sound: "oi", example: "ঐক্য", word: "oikko", meaning: "unity" },
  { bn: "ও", sound: "o", example: "ওজন", word: "ojon", meaning: "weight" },
  { bn: "ঔ", sound: "ou", example: "ঔষধ", word: "oushodh", meaning: "medicine" },
];

const CONSONANTS = [
  ["ক", "kô", "কলম", "kolom", "pen"], ["খ", "khô", "খাতা", "khata", "notebook"],
  ["গ", "gô", "গাছ", "gachh", "tree"], ["ঘ", "ghô", "ঘর", "ghor", "house"],
  ["ঙ", "ngô", "রঙ", "rong", "color"], ["চ", "chô", "চাঁদ", "chãd", "moon"],
  ["ছ", "chhô", "ছাতা", "chhata", "umbrella"], ["জ", "jô", "জল", "jol", "water"],
  ["ঝ", "jhô", "ঝড়", "jhoṛ", "storm"], ["ঞ", "nyô", "পঞ্চ", "poncho", "five"],
  ["ট", "ṭô", "টাকা", "ṭaka", "money"], ["ঠ", "ṭhô", "ঠোঁট", "ṭhõṭ", "lip"],
  ["ড", "ḍô", "ডাল", "ḍal", "lentils"], ["ঢ", "ḍhô", "ঢাক", "ḍhak", "drum"],
  ["ণ", "ṇô", "হরিণ", "horiṇ", "deer"], ["ত", "tô", "তারা", "tara", "star"],
  ["থ", "thô", "থালা", "thala", "plate"], ["দ", "dô", "দরজা", "dorja", "door"],
  ["ধ", "dhô", "ধান", "dhan", "paddy"], ["ন", "nô", "নদী", "nodi", "river"],
  ["প", "pô", "পাখি", "pakhi", "bird"], ["ফ", "phô", "ফুল", "phul", "flower"],
  ["ব", "bô", "বই", "boi", "book"], ["ভ", "bhô", "ভাত", "bhat", "rice"],
  ["ম", "mô", "মাছ", "machh", "fish"], ["য", "jô", "যান", "jan", "vehicle"],
  ["র", "rô", "রাত", "rat", "night"], ["ল", "lô", "লাল", "lal", "red"],
  ["শ", "shô", "শাপলা", "shapla", "water lily"], ["ষ", "shô", "ষাট", "shaṭ", "sixty"],
  ["স", "sô", "সকাল", "shokal", "morning"], ["হ", "hô", "হাত", "hat", "hand"],
  ["ড়", "ṛô", "গাড়ি", "gaṛi", "car"], ["ঢ়", "ṛhô", "আষাঢ়", "ashaṛh", "monsoon month"],
  ["য়", "yô", "সময়", "shomoy", "time"], ["ৎ", "t", "জগৎ", "jogot", "world"],
  ["ং", "ng", "বাংলা", "bangla", "Bengali"], ["ঃ", "h", "দুঃখ", "dukkho", "sadness"],
  ["ঁ", "nasal", "চাঁদ", "chãd", "moon"],
].map(([bn, sound, example, word, meaning]) => ({ bn, sound, example, word, meaning }));

const LESSONS = [
  {
    id: 1,
    eyebrow: "FOUNDATIONS",
    title: "Meet the vowel family",
    description: "Learn the 11 independent vowel forms and hear how each one opens a word.",
    chars: VOWELS.slice(0, 6),
    minutes: 6,
  },
  {
    id: 2,
    eyebrow: "STROKE PATTERNS",
    title: "The ক family",
    description: "Notice the shared shapes and add breath to move from ক to খ, গ to ঘ.",
    chars: CONSONANTS.slice(0, 5),
    minutes: 8,
  },
  {
    id: 3,
    eyebrow: "READING",
    title: "Build your first words",
    description: "Combine familiar letters and vowel marks to decode useful everyday words.",
    chars: [CONSONANTS[0], VOWELS[1], CONSONANTS[22], CONSONANTS[26]],
    minutes: 10,
  },
  {
    id: 4,
    eyebrow: "VOWEL MARKS",
    title: "From আ to কার",
    description: "See how independent vowels change shape when they attach to a consonant.",
    chars: [
      { bn: "কা", sound: "ka", example: "কাজ", word: "kaj", meaning: "work" },
      { bn: "কি", sound: "ki", example: "কি", word: "ki", meaning: "what" },
      { bn: "কী", sound: "kee", example: "কী", word: "kee", meaning: "what" },
      { bn: "কু", sound: "ku", example: "কুকুর", word: "kukur", meaning: "dog" },
    ],
    minutes: 9,
  },
];

const TABS = [
  { id: "learn", label: "Learn", icon: FaBookOpen },
  { id: "lessons", label: "Lessons", icon: FaPlay },
  { id: "practice", label: "Practice", icon: FaPenNib },
  { id: "games", label: "Games", icon: FaGamepad },
  { id: "translate", label: "Translate", icon: FaLanguage },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

function speakBengali(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "bn-BD";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function speakGoogleBengali(text) {
  window.speechSynthesis?.cancel();
  const audioUrl = URL.createObjectURL(await getGoogleTtsAudio(text, "bn-IN"));
  const audio = new Audio(audioUrl);
  const releaseAudio = () => URL.revokeObjectURL(audioUrl);
  audio.addEventListener("ended", releaseAudio, { once: true });
  audio.addEventListener("error", releaseAudio, { once: true });
  try {
    await audio.play();
  } catch (error) {
    releaseAudio();
    throw error;
  }
}

function AudioButton({ text, label, voiceMode }) {
  const [status, setStatus] = useState("idle");

  const playAudio = async () => {
    if (voiceMode === "system") {
      speakBengali(text);
      return;
    }
    setStatus("loading");
    try {
      await speakGoogleBengali(text);
      setStatus("idle");
    } catch (error) {
      console.error("Google Bengali speech error:", error);
      setStatus("error");
    }
  };

  return (
    <button
      className="alpha-audio"
      type="button"
      onClick={playAudio}
      disabled={status === "loading"}
      aria-label={`${label} with ${voiceMode === "google" ? "Google" : "system"} voice`}
      title={status === "error" ? "Google speech was unavailable. Try again." : undefined}
    >
      {voiceMode === "google" ? <FcGoogle aria-hidden="true" /> : <FaVolumeHigh aria-hidden="true" />}
    </button>
  );
}

function CharacterCard({ character, learned, onLearn, voiceMode }) {
  return (
    <article className={`alpha-character-card ${learned ? "is-learned" : ""}`}>
      <div className="alpha-character-top">
        <span className="alpha-glyph">{character.bn}</span>
        <AudioButton text={character.bn} label={`Hear ${character.bn}`} voiceMode={voiceMode} />
      </div>
      <strong className="alpha-sound">{character.sound}</strong>
      <div className="alpha-example">
        <span lang="bn">{character.example}</span>
        <small>{character.word} · {character.meaning}</small>
      </div>
      <button className="alpha-learn-button" type="button" onClick={onLearn}>
        {learned ? <><FaCheck /> Learned</> : "Mark as learned"}
      </button>
    </article>
  );
}

AudioButton.propTypes = {
  text: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  voiceMode: PropTypes.oneOf(["system", "google"]).isRequired,
};

CharacterCard.propTypes = {
  character: PropTypes.shape({
    bn: PropTypes.string.isRequired,
    sound: PropTypes.string.isRequired,
    example: PropTypes.string.isRequired,
    word: PropTypes.string.isRequired,
    meaning: PropTypes.string.isRequired,
  }).isRequired,
  learned: PropTypes.bool.isRequired,
  onLearn: PropTypes.func.isRequired,
  voiceMode: PropTypes.oneOf(["system", "google"]).isRequired,
};

export default function BengaliAlphabet() {
  const [tab, setTab] = useState("learn");
  const [group, setGroup] = useState("vowels");
  const [learned, setLearned] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bangla-alphabet-progress") || "[]");
    } catch {
      return [];
    }
  });
  const allCharacters = useMemo(() => [...VOWELS, ...CONSONANTS], []);
  const [quiz, setQuiz] = useState(() => makeQuiz(VOWELS));
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const [lessonId, setLessonId] = useState(1);
  const [translateText, setTranslateText] = useState("");
  const [voiceMode, setVoiceMode] = useState(() => localStorage.getItem("bangla-alphabet-voice") || "system");

  useEffect(() => {
    localStorage.setItem("bangla-alphabet-progress", JSON.stringify(learned));
  }, [learned]);

  useEffect(() => {
    localStorage.setItem("bangla-alphabet-voice", voiceMode);
    window.speechSynthesis?.cancel();
  }, [voiceMode]);

  const progress = Math.round((learned.length / allCharacters.length) * 100);
  const activeLesson = LESSONS.find((lesson) => lesson.id === lessonId);
  const characters = group === "vowels" ? VOWELS : CONSONANTS;

  function toggleLearned(character) {
    setLearned((current) => current.includes(character)
      ? current.filter((item) => item !== character)
      : [...current, character]);
  }

  function chooseAnswer(choice) {
    if (answer) return;
    setAnswer(choice);
    const correct = choice === quiz.target.sound;
    setScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      total: current.total + 1,
      streak: correct ? current.streak + 1 : 0,
    }));
  }

  function nextQuestion() {
    setQuiz(makeQuiz(allCharacters));
    setAnswer("");
  }

  return (
    <div className="alpha-page">
      <div className="alpha-shell">
        <section className="alpha-hero">
          <div className="alpha-hero-copy">
            <span className="alpha-kicker">বাংলা বর্ণমালা · BANGLA ALPHABET</span>
            <h1>Learn to read <span>বাংলা</span>,<br />one character at a time.</h1>
            <p>Master every Bangla letter through sound, simple words, guided lessons, and quick games.</p>
            <button className="alpha-primary-button" type="button" onClick={() => { setTab("lessons"); setLessonId(1); }}>
              Continue lesson <FaArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="alpha-hero-art" aria-hidden="true">
            <span className="alpha-orbit alpha-orbit-one">অ</span>
            <span className="alpha-orbit alpha-orbit-two">ক</span>
            <span className="alpha-orbit alpha-orbit-three">ম</span>
            <div className="alpha-hero-glyph">আ</div>
            <small>vowel · a</small>
          </div>
        </section>

        <section className="alpha-progress-card" aria-label="Alphabet progress">
          <div className="alpha-progress-heading">
            <div>
              <span>Your alphabet journey</span>
              <strong>{learned.length} of {allCharacters.length} characters learned</strong>
            </div>
            <b>{progress}%</b>
          </div>
          <div className="alpha-progress-track"><span style={{ width: `${progress}%` }} /></div>
        </section>

        <section className="alpha-voice-card" aria-label="Bengali voice preference">
          <div>
            <span className="alpha-voice-icon"><FaVolumeHigh aria-hidden="true" /></span>
            <div>
              <strong>Reading voice</strong>
              <small>Use this voice for every Bangla character and word.</small>
            </div>
          </div>
          <div className="alpha-voice-toggle">
            <button type="button" className={voiceMode === "system" ? "active" : ""} onClick={() => setVoiceMode("system")}>
              <FaVolumeHigh aria-hidden="true" /> System default
            </button>
            <button type="button" className={voiceMode === "google" ? "active" : ""} onClick={() => setVoiceMode("google")}>
              <FcGoogle aria-hidden="true" /> Google voice
            </button>
          </div>
        </section>

        <nav className="alpha-tabs" aria-label="Bangla alphabet sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        {tab === "learn" && (
          <main className="alpha-content">
            <div className="alpha-section-heading">
              <div>
                <span className="alpha-kicker">CHARACTER LIBRARY</span>
                <h2>Meet the Bangla characters</h2>
                <p>Tap the speaker to hear a letter. Use each example word to remember its sound.</p>
              </div>
              <div className="alpha-segmented">
                <button className={group === "vowels" ? "active" : ""} type="button" onClick={() => setGroup("vowels")}>Vowels · স্বরবর্ণ</button>
                <button className={group === "consonants" ? "active" : ""} type="button" onClick={() => setGroup("consonants")}>Consonants · ব্যঞ্জনবর্ণ</button>
              </div>
            </div>
            <div className="alpha-character-grid">
              {characters.map((character) => (
                <CharacterCard
                  key={character.bn}
                  character={character}
                  learned={learned.includes(character.bn)}
                  onLearn={() => toggleLearned(character.bn)}
                  voiceMode={voiceMode}
                />
              ))}
            </div>
          </main>
        )}

        {tab === "lessons" && (
          <main className="alpha-content alpha-lesson-layout">
            <aside className="alpha-lesson-list">
              <span className="alpha-kicker">LEARNING PATH</span>
              <h2>Character lessons</h2>
              {LESSONS.map((lesson) => (
                <button key={lesson.id} type="button" className={lessonId === lesson.id ? "active" : ""} onClick={() => setLessonId(lesson.id)}>
                  <span>{lesson.id}</span>
                  <div><strong>{lesson.title}</strong><small>{lesson.minutes} min</small></div>
                  {lessonId > lesson.id && <FaCheck aria-label="Complete" />}
                </button>
              ))}
            </aside>
            <article className="alpha-lesson-detail">
              <span className="alpha-kicker">{activeLesson.eyebrow} · LESSON {activeLesson.id}</span>
              <h2>{activeLesson.title}</h2>
              <p>{activeLesson.description}</p>
              <div className="alpha-lesson-characters">
                {activeLesson.chars.map((character) => (
                  <button key={character.bn} type="button" onClick={() => voiceMode === "google" ? speakGoogleBengali(character.bn).catch((error) => console.error("Google Bengali speech error:", error)) : speakBengali(character.bn)}>
                    <span>{character.bn}</span>
                    <strong>{character.sound}</strong>
                    <small><FaVolumeHigh /> hear sound</small>
                  </button>
                ))}
              </div>
              <div className="alpha-tip">
                <span>Quick tip</span>
                Bangla letters hang from a horizontal line called the <strong>মাত্রা (matra)</strong>. Look for that shared top line as you read.
              </div>
              <button
                className="alpha-primary-button"
                type="button"
                onClick={() => setLessonId((current) => current === LESSONS.length ? 1 : current + 1)}
              >
                Next lesson <FaArrowRight />
              </button>
            </article>
          </main>
        )}

        {tab === "practice" && (
          <main className="alpha-content">
            <div className="alpha-section-heading">
              <div><span className="alpha-kicker">TRACE & REMEMBER</span><h2>Character practice</h2><p>Say the sound, trace the shape with your finger, then reveal the example.</p></div>
            </div>
            <div className="alpha-practice-grid">
              {allCharacters.slice(0, 12).map((character, index) => (
                <article className="alpha-trace-card" key={character.bn}>
                  <span className="alpha-trace-number">{String(index + 1).padStart(2, "0")}</span>
                  <div className="alpha-trace-glyph">{character.bn}</div>
                  <div className="alpha-trace-lines" aria-hidden="true"><span /><span /><span /></div>
                  <div><strong>{character.sound}</strong><AudioButton text={character.example} label={`Hear ${character.example}`} voiceMode={voiceMode} /></div>
                  <small>{character.example} · {character.meaning}</small>
                </article>
              ))}
            </div>
          </main>
        )}

        {tab === "games" && (
          <main className="alpha-content alpha-game-layout">
            <section className="alpha-game-card">
              <span className="alpha-kicker">SOUND MATCH</span>
              <h2>Which sound matches?</h2>
              <p>Choose the Romanized sound for this character.</p>
              <div className="alpha-game-glyph">{quiz.target.bn}</div>
              <AudioButton text={quiz.target.bn} label={`Hear ${quiz.target.bn}`} voiceMode={voiceMode} />
              <div className="alpha-game-options">
                {quiz.options.map((option) => {
                  const isCorrect = answer && option === quiz.target.sound;
                  const isWrong = answer === option && !isCorrect;
                  return (
                    <button className={`${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} key={option} type="button" onClick={() => chooseAnswer(option)}>
                      {option}{isCorrect && <FaCheck />}
                    </button>
                  );
                })}
              </div>
              {answer && (
                <div className="alpha-game-result">
                  <span>{answer === quiz.target.sound ? "শাবাশ! Great work." : `The answer is ${quiz.target.sound}.`}</span>
                  <button type="button" onClick={nextQuestion}>Next <FaArrowRight /></button>
                </div>
              )}
            </section>
            <aside className="alpha-score-card">
              <span className="alpha-kicker">THIS ROUND</span>
              <div><strong>{score.correct}</strong><span>Correct</span></div>
              <div><strong>{score.total}</strong><span>Questions</span></div>
              <div><strong>{score.streak}</strong><span>Streak</span></div>
              <button type="button" onClick={() => { setScore({ correct: 0, total: 0, streak: 0 }); nextQuestion(); }}><FaRotateRight /> Reset round</button>
            </aside>
          </main>
        )}

        {tab === "translate" && (
          <main className="alpha-content alpha-translate">
            <div className="alpha-section-heading">
              <div><span className="alpha-kicker">GOOGLE TRANSLATE</span><h2>Explore words you discover</h2><p>Type a Bangla character or word, then continue in Google Translate for meaning and pronunciation.</p></div>
            </div>
            <section className="alpha-translate-card">
              <div className="alpha-language-row"><span>বাংলা · Bengali</span><FaArrowRight /><span>English</span></div>
              <textarea value={translateText} onChange={(event) => setTranslateText(event.target.value)} lang="bn" placeholder="বাংলায় লিখুন…" aria-label="Bangla text to translate" />
              <div className="alpha-translate-actions">
                <button
                  type="button"
                  onClick={() => voiceMode === "google" ? speakGoogleBengali(translateText).catch((error) => console.error("Google Bengali speech error:", error)) : speakBengali(translateText)}
                  disabled={!translateText}
                >
                  {voiceMode === "google" ? <FcGoogle /> : <FaVolumeHigh />} Hear Bangla
                </button>
                <a
                  className={translateText ? "" : "disabled"}
                  href={`https://translate.google.com/?sl=bn&tl=en&text=${encodeURIComponent(translateText)}&op=translate`}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!translateText}
                  onClick={(event) => !translateText && event.preventDefault()}
                >
                  <FcGoogle /> Translate with Google <FaArrowRight />
                </a>
              </div>
            </section>
            <div className="alpha-suggestion-row">
              <span>Try a word:</span>
              {["বাংলা", "অক্ষর", "বই", "আম"].map((word) => <button type="button" key={word} onClick={() => setTranslateText(word)}>{word}</button>)}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function makeQuiz(items) {
  const target = items[Math.floor(Math.random() * items.length)];
  const distractors = shuffle(items.filter((item) => item.sound !== target.sound)).slice(0, 3);
  return { target, options: shuffle([target, ...distractors]).map((item) => item.sound) };
}

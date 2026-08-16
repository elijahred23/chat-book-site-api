import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";
import { FaVolumeHigh } from "react-icons/fa6";
import { FaBackward, FaCompressAlt, FaExpandAlt, FaForward, FaLanguage, FaMinus, FaPause, FaPlay, FaPlus, FaRedoAlt, FaStepBackward, FaStepForward, FaUndoAlt } from "react-icons/fa";
import ActionButtons from "../ui/ActionButtons.jsx";
import { actions, useAppDispatch } from "../context/AppContext.jsx";
import { withPhraseWords } from "../utils/bengaliPhraseBreakdown.js";
import { getGoogleTtsAudio, GOOGLE_BENGALI_VOICE_KEY } from "../utils/googleTtsAudioCache.js";
import adjectivesLesson from "../bengali_lessons/adjectives.json";
import adverbsLesson from "../bengali_lessons/adverbs.json";
import anthropicPrincipleLesson from "../bengali_lessons/anthropic-principle.json";
import aspnetMvcLesson from "../bengali_lessons/aspnet-core-mvc.json";
import characterAaLesson from "../bengali_lessons/character-aa.json";
import characterAwLesson from "../bengali_lessons/character-aw.json";
import characterELesson from "../bengali_lessons/character-e.json";
import characterILesson from "../bengali_lessons/character-i.json";
import characterIiLesson from "../bengali_lessons/character-ii.json";
import characterOLesson from "../bengali_lessons/character-o.json";
import characterOiLesson from "../bengali_lessons/character-oi.json";
import characterOuLesson from "../bengali_lessons/character-ou.json";
import characterRiLesson from "../bengali_lessons/character-ri.json";
import characterULesson from "../bengali_lessons/character-u.json";
import characterUuLesson from "../bengali_lessons/character-uu.json";
import conjunctionsLesson from "../bengali_lessons/conjunctions.json";
import cpuAdventureLesson from "../bengali_lessons/cpu-adventure.json";
import dotnetRuntimeLesson from "../bengali_lessons/dotnet-runtime.json";
import halloweenMovieLesson from "../bengali_lessons/halloween-movie.json";
import nounsLesson from "../bengali_lessons/nouns.json";
import numbersLesson from "../bengali_lessons/numbers.json";
import prepositionsLesson from "../bengali_lessons/prepositions.json";
import pronounsLesson from "../bengali_lessons/pronouns.json";
import starBirthLesson from "../bengali_lessons/star-birth.json";
import spiderManMovieLesson from "../bengali_lessons/spider-man-movie.json";
import top125PhrasesLesson from "../bengali_lessons/top-125-phrases.json";
import top150SentencesLesson from "../bengali_lessons/top-150-sentences.json";
import top250WordsLesson from "../bengali_lessons/top-250-words.json";
import verbsLesson from "../bengali_lessons/verbs.json";
import { BENGALI_CLASS_LESSONS } from "../data/bengaliClassLessons.js";
import "./BengaliTutor.css";

const expandedLessonModules = import.meta.glob("../bengali_lessons/{greetings-introductions,family-relationships,food-restaurants,time-dates-days,weather-seasons,colors-shapes-sizes,home-household,clothing-personal-items,body-health-doctor,school-education,work-workplace,hobbies-sports-entertainment,travel-hotels-airports,phone-text-messages,asking-questions,commands-polite-requests,possession-ownership,plurals-classifiers,present-tense,past-tense,future-tense,negatives-saying-no,formal-informal}.json", {
  eager: true,
  import: "default",
});
const expandedLessons = Object.values(expandedLessonModules);
const consonantLessonModules = import.meta.glob("../bengali_lessons/consonant-*.json", {
  eager: true,
  import: "default",
});
const consonantLessons = Object.values(consonantLessonModules);

const LESSON_CACHE_KEY = "bengali_lesson_cache";
const BREAKDOWN_SPEECH_KEY = "bn_breakdown_speech_source";
const AUTO_SCROLL_SPEED_KEY = "bengali_tutor_auto_scroll_speed";
const AUTO_SCROLL_LOOP_KEY = "bengali_tutor_auto_scroll_loop";
const AUTO_SCROLL_DELAY_KEY = "bengali_tutor_auto_scroll_delay";
const CORRECT_TIME = 250;
const INCORRECT_TIME = 700;

export const SAVED_LESSONS = [
  adjectivesLesson,
  adverbsLesson,
  anthropicPrincipleLesson,
  aspnetMvcLesson,
  characterAaLesson,
  characterAwLesson,
  characterELesson,
  characterILesson,
  characterIiLesson,
  characterOLesson,
  characterOiLesson,
  characterOuLesson,
  characterRiLesson,
  characterULesson,
  characterUuLesson,
  conjunctionsLesson,
  cpuAdventureLesson,
  dotnetRuntimeLesson,
  halloweenMovieLesson,
  nounsLesson,
  numbersLesson,
  prepositionsLesson,
  pronounsLesson,
  starBirthLesson,
  spiderManMovieLesson,
  top125PhrasesLesson,
  top150SentencesLesson,
  top250WordsLesson,
  verbsLesson,
  ...BENGALI_CLASS_LESSONS,
  ...expandedLessons,
  ...consonantLessons,
].map(withPhraseWords).sort((a, b) => a.topic.localeCompare(b.topic, undefined, { numeric: true }));
const HIDDEN_LESSON_DROPDOWN_IDS = new Set(["aspnet-core-mvc", "dotnet-runtime"]);
export const SELECTABLE_SAVED_LESSONS = SAVED_LESSONS.filter(
  (lesson) => !HIDDEN_LESSON_DROPDOWN_IDS.has(lesson.id),
);

const initialSavedLesson = () => {
  try {
    const savedId = JSON.parse(localStorage.getItem(LESSON_CACHE_KEY) || "null")?.id;
    return SAVED_LESSONS.find((lesson) => lesson.id === savedId) || SAVED_LESSONS[0];
  } catch {
    return SAVED_LESSONS[0];
  }
};

const initialBreakdownSpeechSource = () => {
  try {
    const savedSource = localStorage.getItem(BREAKDOWN_SPEECH_KEY);
    return savedSource === "system" ? "system" : "google";
  } catch {
    return "google";
  }
};

const initialAutoScrollSpeed = () => {
  try {
    const value = Number(localStorage.getItem(AUTO_SCROLL_SPEED_KEY));
    return Number.isFinite(value) && value >= 5 && value <= 200 ? value : 30;
  } catch {
    return 30;
  }
};
const initialAutoScrollLoop = () => {
  try { return localStorage.getItem(AUTO_SCROLL_LOOP_KEY) === "true"; } catch { return false; }
};
const initialAutoScrollDelay = () => {
  try {
    const value = Number(localStorage.getItem(AUTO_SCROLL_DELAY_KEY));
    return Number.isFinite(value) && value >= 0 && value <= 60 ? value : 3;
  } catch { return 3; }
};

const wordKey = (item) => JSON.stringify([item?.bn || "", item?.en || ""]);
const bengaliLabel = (item) => item.pronunciation ? `${item.bn} (${item.pronunciation})` : item.bn;
const promptLabel = (item, direction) => (direction === "en-bn" ? item.en : bengaliLabel(item));
const optionLabel = (item, direction) => direction === "en-bn" ? bengaliLabel(item) : item.en;
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const containsBengali = (value) => /\p{Script=Bengali}/u.test(String(value || ""));
const normalizeAnswer = (value) => value.trim().toLocaleLowerCase().replace(/[.,!?।'’"-]/g, "").replace(/\s+/g, " ");
const googleTranslateUrl = (text) => `https://translate.google.com/?sl=bn&tl=en&text=${encodeURIComponent(text)}&op=translate`;
const shortTranslationLabel = (value, maxLength = 32) => {
  const label = String(value || "").trim().replace(/\s+/g, " ");
  return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;
};

const statusForWord = (stats, key) => {
  const record = stats[key];
  if (!record) return "new";
  return record.last === "wrong" ? "wrong" : "correct";
};

const statusClassForKey = (stats, key) => `match-${statusForWord(stats, key)}`;

const MATCH_ITEM_WEIGHTS = {
  unseen: 20,
  incorrect: 30,
  correct: 1,
};

const pickWeightedItem = (items, stats) => {
  const weighted = items.flatMap((item) => {
    const record = stats[wordKey(item)];
    const weight = !record
      ? MATCH_ITEM_WEIGHTS.unseen
      : record.last === "wrong"
        ? MATCH_ITEM_WEIGHTS.incorrect
        : MATCH_ITEM_WEIGHTS.correct;
    return Array.from({ length: weight }, () => item);
  });

  return weighted[Math.floor(Math.random() * weighted.length)] || items[0];
};

const initialScore = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
const EMPTY_TRANSLATION_SETS = [];

const speak = (text, lang = "bn", selectedVoiceKey = "") => {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  const fallbackLang = lang.startsWith("bn") ? "bn-IN" : "en-US";
  const voice = window.speechSynthesis.getVoices().find((item) => `${item.name}__${item.lang}` === selectedVoiceKey);
  utter.lang = voice?.lang || fallbackLang;
  if (voice) utter.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
};

const speakWithGoogleTts = async (text) => {
  const audioUrl = URL.createObjectURL(await getGoogleTtsAudio(text, "bn-IN"));
  const audio = new Audio(audioUrl);
  const releaseAudioUrl = () => URL.revokeObjectURL(audioUrl);
  audio.addEventListener("ended", releaseAudioUrl, { once: true });
  audio.addEventListener("error", releaseAudioUrl, { once: true });
  try {
    await audio.play();
  } catch (error) {
    releaseAudioUrl();
    throw error;
  }
};

const LanguageIcon = ({ language }) => (
  <span className="bn-language-icon" aria-hidden="true">
    <FaVolumeHigh />
    <span>{language}</span>
  </span>
);

const BengaliItemActions = ({ item }) => {
  const dispatch = useAppDispatch();
  const [googleSpeechStatus, setGoogleSpeechStatus] = useState("idle");

  const hearGoogleBengali = async () => {
    setGoogleSpeechStatus("loading");
    try {
      window.speechSynthesis?.cancel();
      await speakWithGoogleTts(item.bn);
      setGoogleSpeechStatus("idle");
    } catch (error) {
      console.error("Google Bengali speech error:", error);
      setGoogleSpeechStatus("error");
    }
  };

  return (
    <div className="bn-game-actions bn-audio-actions" style={{ marginTop: 8 }}>
      <button
        className="bn-btn secondary bn-icon-btn"
        onClick={() => speak(item.bn, "bn")}
        aria-label="Hear Bengali with system voice"
        title="Hear Bengali with system voice"
      >
        <LanguageIcon language="BN" />
      </button>
      <button
        className="bn-btn secondary bn-icon-btn"
        onClick={hearGoogleBengali}
        disabled={googleSpeechStatus === "loading"}
        aria-label="Hear Bengali with Google Text-to-Speech"
        title={googleSpeechStatus === "error" ? "Google Bengali speech failed. Try again." : "Hear Bengali with Google Text-to-Speech"}
      >
        <span className="bn-google-speech-icon" aria-hidden="true">
          <FcGoogle />
          <FaVolumeHigh />
        </span>
      </button>
      <button
        className="bn-btn secondary bn-icon-btn"
        onClick={() => speak(item.en, "en")}
        aria-label="Hear English"
        title="Hear English"
      >
        <LanguageIcon language="EN" />
      </button>
      <a
        className="bn-btn secondary bn-icon-btn"
        href={googleTranslateUrl(item.bn)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Translate ${item.bn} from Bengali to English in Google Translate`}
        title="Open in Google Translate"
      >
        <FcGoogle aria-hidden="true" />
      </a>
      <button
        className="bn-btn secondary bn-icon-btn"
        type="button"
        onClick={() => {
          dispatch(actions.setBengaliBreakdownText(item.bn));
          if (item.words?.length) dispatch(actions.setBengaliBreakdownWords(item.words));
          dispatch(actions.setIsBengaliBreakdownOpen(true));
        }}
        aria-label={`Open Bengali breakdown for ${item.bn}`}
        title="Open in Bengali Breakdown"
      >
        <FaLanguage aria-hidden="true" />
      </button>
    </div>
  );
};

LanguageIcon.propTypes = {
  language: PropTypes.string.isRequired,
};

BengaliItemActions.propTypes = {
  item: PropTypes.shape({
    bn: PropTypes.string.isRequired,
    en: PropTypes.string.isRequired,
    words: PropTypes.arrayOf(PropTypes.shape({
      bn: PropTypes.string,
      pronunciation: PropTypes.string,
      en: PropTypes.string,
    })),
  }).isRequired,
};

export default function BengaliTutor({ bengaliVoice = "", initialLesson, showLessonSelector = true, translationSets = EMPTY_TRANSLATION_SETS, view = "tutor" }) {
  const dispatch = useAppDispatch();
  const startingLesson = initialLesson || initialSavedLesson();
  const [lesson, setLesson] = useState(startingLesson);
  const [savedLessonId, setSavedLessonId] = useState(startingLesson.id);
  const [breakdownSpeechSource, setBreakdownSpeechSource] = useState(initialBreakdownSpeechSource);
  const speakSelectedBengali = useCallback((text) => {
    if (bengaliVoice === GOOGLE_BENGALI_VOICE_KEY) {
      window.speechSynthesis?.cancel();
      speakWithGoogleTts(text).catch((error) => console.error("Google Bengali speech error:", error));
      return;
    }
    speak(text, "bn", bengaliVoice);
  }, [bengaliVoice]);
  const speakBreakdownWord = useCallback((text) => {
    if (breakdownSpeechSource === "system") {
      speak(text, "bn", bengaliVoice === GOOGLE_BENGALI_VOICE_KEY ? "" : bengaliVoice);
      return;
    }
    window.speechSynthesis?.cancel();
    speakWithGoogleTts(text).catch((error) => {
      console.error("Google Bengali breakdown speech error:", error);
      speak(text, "bn", bengaliVoice === GOOGLE_BENGALI_VOICE_KEY ? "" : bengaliVoice);
    });
  }, [bengaliVoice, breakdownSpeechSource]);
  const [contentTab, setContentTab] = useState(view === "games" ? "games" : "phrases");
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState(1);
  const [scrollSpeed, setScrollSpeed] = useState(initialAutoScrollSpeed);
  const [isScrollLooping, setIsScrollLooping] = useState(initialAutoScrollLoop);
  const [scrollRestartDelay, setScrollRestartDelay] = useState(initialAutoScrollDelay);
  const [isTutorWindowView, setIsTutorWindowView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const tutorContentRef = useRef(null);
  const scrollDirectionRef = useRef(scrollDirection);
  const scrollSpeedRef = useRef(scrollSpeed);
  const scrollLoopTimeoutRef = useRef(null);
  const [jumpTarget, setJumpTarget] = useState("");
  const [phraseShuffleVersion, setPhraseShuffleVersion] = useState(0);
  const [vocabShuffleVersion, setVocabShuffleVersion] = useState(0);
  const [gameDataset, setGameDataset] = useState("vocab");
  const [translationSetId, setTranslationSetId] = useState(() => translationSets[0]?.id || "");
  const [gameDirection, setGameDirection] = useState(() => {
    try {
      return localStorage.getItem("bn_game_direction") || "bn-en";
    } catch {
      return "bn-en";
    }
  });
  const [matchOptionsCount, setMatchOptionsCount] = useState(4);
  const [gameMode, setGameMode] = useState("match");
  const [gameQuestion, setGameQuestion] = useState(null);
  const [gameChoice, setGameChoice] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [matchStats, setMatchStats] = useState({});
  const [gameScore, setGameScore] = useState(initialScore);
  const [recallAnswer, setRecallAnswer] = useState("");
  const [recallResult, setRecallResult] = useState(null);
  const [memoryCards, setMemoryCards] = useState([]);
  const [memoryOpen, setMemoryOpen] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryLocked, setMemoryLocked] = useState(false);
  const [arcadeRunning, setArcadeRunning] = useState(false);
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeCombo, setArcadeCombo] = useState(0);
  const [arcadeTime, setArcadeTime] = useState(30);
  const [arcadeLives, setArcadeLives] = useState(3);
  const [arcadeMessage, setArcadeMessage] = useState("");
  const [bingoBoard, setBingoBoard] = useState([]);
  const [bingoTarget, setBingoTarget] = useState(null);
  const [bingoMatched, setBingoMatched] = useState([]);

  useEffect(() => {
    scrollDirectionRef.current = scrollDirection;
  }, [scrollDirection]);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
    try {
      localStorage.setItem(AUTO_SCROLL_SPEED_KEY, String(scrollSpeed));
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [scrollSpeed]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_SCROLL_LOOP_KEY, String(isScrollLooping));
      localStorage.setItem(AUTO_SCROLL_DELAY_KEY, String(scrollRestartDelay));
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [isScrollLooping, scrollRestartDelay]);

  useEffect(() => {
    if (!isTutorWindowView) return undefined;
    document.body.classList.add("bn-tutor-window-open");
    const closeWindowView = (event) => {
      if (event.key === "Escape") setIsTutorWindowView(false);
    };
    window.addEventListener("keydown", closeWindowView);
    return () => {
      window.removeEventListener("keydown", closeWindowView);
      document.body.classList.remove("bn-tutor-window-open");
    };
  }, [isTutorWindowView]);

  useEffect(() => () => clearTimeout(scrollLoopTimeoutRef.current), []);

  useEffect(() => {
    if (!isScrollLooping) clearTimeout(scrollLoopTimeoutRef.current);
  }, [isScrollLooping]);

  useEffect(() => {
    if (!isAutoScrolling || view !== "tutor") return undefined;
    let frame;
    let previousTime = null;
    let preciseScrollTop = tutorContentRef.current?.scrollTop || 0;

    const scroll = (timestamp) => {
      const container = tutorContentRef.current;
      if (!container) return;
      if (previousTime === null) previousTime = timestamp;
      const elapsedSeconds = Math.min((timestamp - previousTime) / 1000, 0.1);
      previousTime = timestamp;
      if (Math.abs(container.scrollTop - preciseScrollTop) > 1) preciseScrollTop = container.scrollTop;

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      preciseScrollTop = Math.max(0, Math.min(
        maxScrollTop,
        preciseScrollTop + scrollDirectionRef.current * scrollSpeedRef.current * elapsedSeconds,
      ));
      container.scrollTop = preciseScrollTop;
      setScrollProgress(maxScrollTop ? (preciseScrollTop / maxScrollTop) * 100 : 100);

      const reachedEnd = scrollDirectionRef.current > 0
        ? preciseScrollTop >= maxScrollTop
        : preciseScrollTop <= 0;
      if (reachedEnd) {
        if (isScrollLooping && scrollDirectionRef.current > 0) {
          setIsAutoScrolling(false);
          scrollLoopTimeoutRef.current = setTimeout(() => {
            const nextContainer = tutorContentRef.current;
            if (!nextContainer) return;
            nextContainer.scrollTop = 0;
            setIsAutoScrolling(true);
          }, scrollRestartDelay * 1000);
          return;
        }
        setIsAutoScrolling(false);
        return;
      }
      frame = requestAnimationFrame(scroll);
    };

    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [isAutoScrolling, isScrollLooping, scrollRestartDelay, view]);

  useEffect(() => {
    clearTimeout(scrollLoopTimeoutRef.current);
    setIsAutoScrolling(false);
    setScrollProgress(0);
    if (tutorContentRef.current) tutorContentRef.current.scrollTop = 0;
  }, [contentTab, lesson]);

  const activateScrollDirection = (direction) => {
    clearTimeout(scrollLoopTimeoutRef.current);
    setScrollDirection(direction);
    setIsAutoScrolling(true);
  };

  const nudgeTutorScroll = (change) => {
    const container = tutorContentRef.current;
    if (!container) return;
    const distance = Math.min(240, container.clientHeight * 0.35);
    container.scrollTop += change * distance;
  };

  const seekTutorScroll = (percentage) => {
    const container = tutorContentRef.current;
    if (!container) return;
    const nextPercentage = Math.max(0, Math.min(100, percentage));
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollTop = maxScrollTop * (nextPercentage / 100);
    setScrollProgress(nextPercentage);
  };
  const [bingoMistakes, setBingoMistakes] = useState(0);
  const [pronunciationQuestion, setPronunciationQuestion] = useState(null);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [pronunciationChoice, setPronunciationChoice] = useState(null);
  const matchStatsRef = React.useRef({});
  const memoryTimerRef = React.useRef(null);
  const keyboardActionsRef = React.useRef({});

  useEffect(() => {
    try {
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(lesson));
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [lesson]);

  useEffect(() => {
    try {
      localStorage.setItem("bn_game_direction", gameDirection);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [gameDirection]);

  useEffect(() => {
    try {
      localStorage.setItem(BREAKDOWN_SPEECH_KEY, breakdownSpeechSource);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [breakdownSpeechSource]);

  const filteredVocab = useMemo(() => lesson?.vocab?.filter((v) => v?.bn && v?.en) || [], [lesson]);
  const filteredPhrases = useMemo(() => lesson?.phrases?.filter((p) => p?.bn && p?.en) || [], [lesson]);
  const orderedVocab = useMemo(
    () => vocabShuffleVersion ? shuffle(filteredVocab) : filteredVocab,
    [filteredVocab, vocabShuffleVersion],
  );
  const orderedPhrases = useMemo(
    () => phraseShuffleVersion ? shuffle(filteredPhrases) : filteredPhrases,
    [filteredPhrases, phraseShuffleVersion],
  );
  const activeTutorItems = contentTab === "phrases" ? orderedPhrases : orderedVocab;
  const selectedTranslationSet = useMemo(
    () => translationSets.find((set) => set.id === translationSetId) || translationSets[0] || null,
    [translationSetId, translationSets],
  );
  const translationItems = useMemo(
    () => selectedTranslationSet?.phrases?.filter((phrase) => phrase?.bn && phrase?.en) || [],
    [selectedTranslationSet],
  );

  useEffect(() => {
    if (selectedTranslationSet?.id !== translationSetId) {
      setTranslationSetId(selectedTranslationSet?.id || "");
    }
  }, [selectedTranslationSet, translationSetId]);

  const breakdownWords = useMemo(() => {
    const uniqueWords = new Map();
    filteredPhrases.forEach((phrase) => {
      phrase.words?.forEach((word) => {
        if (!word?.bn || !word?.en) return;
        const item = { ...word, sourcePhrase: phrase.bn, category: phrase.category };
        const key = wordKey(item);
        if (!uniqueWords.has(key)) uniqueWords.set(key, item);
      });
    });
    return [...uniqueWords.values()];
  }, [filteredPhrases]);
  const translationWords = useMemo(() => {
    const uniqueWords = new Map();
    translationItems.forEach((sentence) => {
      sentence.words?.forEach((word) => {
        if (!word?.bn || !word?.en) return;
        const item = {
          ...word,
          sourcePhrase: sentence.bn,
          category: sentence.category || `Saved translation: ${selectedTranslationSet?.title || ""}`,
          sourceTranslationId: selectedTranslationSet?.id,
        };
        const key = wordKey(item);
        if (!uniqueWords.has(key)) uniqueWords.set(key, item);
      });
    });
    return [...uniqueWords.values()];
  }, [selectedTranslationSet, translationItems]);
  const gameItems = useMemo(() => {
    if (gameDataset === "phrases") return filteredPhrases;
    if (gameDataset === "breakdown-words") return breakdownWords;
    if (gameDataset === "translation-phrases") return translationItems;
    if (gameDataset === "translation-words") return translationWords;
    return filteredVocab;
  }, [breakdownWords, filteredPhrases, filteredVocab, gameDataset, translationItems, translationWords]);
  const usingTranslations = view === "games" && gameDataset.startsWith("translation-");

  const combinedLessonPrompt = useMemo(() => {
    if (!lesson) return "";
    const isBreakdownWords = contentTab === "games" && gameDataset === "breakdown-words";
    const isVocab = contentTab === "vocab" || (contentTab === "games" && gameDataset === "vocab");
    const source = isBreakdownWords ? breakdownWords : isVocab ? orderedVocab : orderedPhrases;
    const label = isBreakdownWords ? "Phrase breakdown words" : isVocab ? "Vocab" : "Phrases";
    const items = source.map((item, index) => [
      `${index + 1}. ${item.bn}`,
      item.pronunciation ? `   Pronunciation: ${item.pronunciation}` : "",
      `   English: ${item.en}`,
    ].filter(Boolean).join("\n"));
    return `${lesson.title}\n${label}\n\n${items.join("\n\n")}`;
  }, [lesson, breakdownWords, orderedPhrases, orderedVocab, contentTab, gameDataset]);

  const buildGameQuestion = useCallback((items, direction = gameDirection, stats = matchStatsRef.current) => {
    if (!items?.length || items.length < 2) return null;
    const correct = pickWeightedItem(items, stats);
    const distractors = shuffle(items.filter((item) => wordKey(item) !== wordKey(correct))).slice(
      0,
      Math.min(matchOptionsCount - 1, items.length - 1)
    );
    const options = shuffle([...distractors, correct]).map((item) => ({ key: wordKey(item), label: optionLabel(item, direction) }));

    return {
      key: wordKey(correct),
      bn: correct.bn,
      bengaliDisplay: bengaliLabel(correct),
      en: correct.en,
      pronunciation: correct.pronunciation || "",
      displayQuestion: promptLabel(correct, direction),
      correctAnswer: optionLabel(correct, direction),
      options,
    };
  }, [gameDirection, matchOptionsCount]);

  const startNewGameRound = useCallback((direction = gameDirection, stats = matchStatsRef.current) => {
    const question = buildGameQuestion(gameItems, direction, stats);
    if (!question) return;
    setGameQuestion(question);
    setGameChoice(null);
    setGameResult(null);
    setRecallAnswer("");
    setRecallResult(null);
  }, [buildGameQuestion, gameDirection, gameItems]);

  const startMemoryRound = useCallback(() => {
    if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    const pairs = shuffle(gameItems).slice(0, Math.min(6, gameItems.length));
    const cards = pairs.flatMap((item) => {
      const key = wordKey(item);
      return [
        { id: `${key}-prompt`, pairKey: key, label: promptLabel(item, gameDirection), language: gameDirection === "bn-en" ? "bn" : "en" },
        { id: `${key}-answer`, pairKey: key, label: optionLabel(item, gameDirection), language: gameDirection === "bn-en" ? "en" : "bn" },
      ];
    });
    setMemoryCards(shuffle(cards));
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryMoves(0);
    setMemoryLocked(false);
  }, [gameDirection, gameItems]);

  const startBingoRound = useCallback(() => {
    const board = shuffle(gameItems).slice(0, Math.min(9, gameItems.length));
    setBingoBoard(board);
    setBingoMatched([]);
    setBingoMistakes(0);
    setBingoTarget(board[0] || null);
  }, [gameItems]);

  const startPronunciationRound = useCallback(() => {
    const playableItems = gameItems.filter((item) => item.pronunciation);
    if (playableItems.length < 2) {
      setPronunciationQuestion(null);
      return;
    }
    const correct = playableItems[Math.floor(Math.random() * playableItems.length)];
    const distractors = shuffle(playableItems.filter((item) => wordKey(item) !== wordKey(correct))).slice(0, Math.min(3, playableItems.length - 1));
    setPronunciationQuestion({
      key: wordKey(correct),
      bn: correct.bn,
      bengaliDisplay: bengaliLabel(correct),
      en: correct.en,
      pronunciation: correct.pronunciation,
      options: shuffle([correct, ...distractors]).map((item) => item.en),
    });
    setPronunciationResult(null);
    setPronunciationChoice(null);
  }, [gameItems]);

  useEffect(() => {
    const nextStats = {};
    matchStatsRef.current = nextStats;
    setMatchStats(nextStats);
    setGameScore(initialScore);
    setGameQuestion(null);
    setGameChoice(null);
    setGameResult(null);

    if (gameItems.length >= 2) {
      const id = setTimeout(() => startNewGameRound(gameDirection, nextStats), 0);
      return () => clearTimeout(id);
    }
  }, [gameDataset, lesson, gameDirection, gameItems.length, startNewGameRound]);

  useEffect(() => {
    if (gameItems.length >= 2) startNewGameRound(gameDirection);
  }, [matchOptionsCount, gameDirection, gameItems.length, startNewGameRound]);

  useEffect(() => {
    if (gameItems.length >= 2) startMemoryRound();
    return () => {
      if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    };
  }, [gameDataset, gameDirection, gameItems.length, lesson, startMemoryRound]);

  useEffect(() => {
    if (gameItems.length >= 2) {
      startBingoRound();
      startPronunciationRound();
    }
  }, [gameDataset, gameItems.length, lesson, startBingoRound, startPronunciationRound]);

  useEffect(() => {
    if (gameMode !== "sprint" || !arcadeRunning) return undefined;
    const timer = setInterval(() => {
      setArcadeTime((time) => {
        if (time <= 1) {
          setArcadeRunning(false);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [arcadeRunning, gameMode]);

  useEffect(() => {
    if (gameMode === "sound" && arcadeRunning && gameQuestion) {
      const timer = setTimeout(() => speakSelectedBengali(gameQuestion.bn), 120);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [arcadeRunning, gameMode, gameQuestion, speakSelectedBengali]);

  useEffect(() => {
    if (gameMode === "bingo" && bingoTarget) {
      const timer = setTimeout(() => speakSelectedBengali(bingoTarget.bn), 180);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [bingoTarget, gameMode, speakSelectedBengali]);

  const loadSavedLesson = (lessonId) => {
    setSavedLessonId(lessonId);
    if (!lessonId) return;

    const selectedLesson = SAVED_LESSONS.find((item) => item.id === lessonId);
    if (!selectedLesson) return;

    setLesson(selectedLesson);
    setContentTab(selectedLesson.phrases?.length ? "phrases" : "vocab");
    setJumpTarget("");
    setPhraseShuffleVersion(0);
    setVocabShuffleVersion(0);
    setGameDataset(selectedLesson.vocab?.length ? "vocab" : "phrases");
    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(selectedLesson));
  };

  const handleGamePick = (option) => {
    if (!gameQuestion || gameResult) return;
    const isCorrect = option.label === gameQuestion.correctAnswer;
    setGameChoice(option.label);
    setGameResult(isCorrect ? "correct" : "wrong");

    const current = matchStatsRef.current[gameQuestion.key] || { correct: 0, wrong: 0, last: null };
    const nextStats = {
      ...matchStatsRef.current,
      [gameQuestion.key]: {
        correct: current.correct + (isCorrect ? 1 : 0),
        wrong: current.wrong + (isCorrect ? 0 : 1),
        last: isCorrect ? "correct" : "wrong",
      },
    };
    matchStatsRef.current = nextStats;
    setMatchStats(nextStats);

    setGameScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
    setTimeout(() => startNewGameRound(gameDirection, nextStats), isCorrect ? CORRECT_TIME : INCORRECT_TIME);
  };

  const handleRecallSubmit = (event) => {
    event.preventDefault();
    if (!gameQuestion || recallResult || !recallAnswer.trim()) return;
    const expected = gameDirection === "en-bn" ? gameQuestion.bn : gameQuestion.en;
    const isCorrect = normalizeAnswer(recallAnswer) === normalizeAnswer(expected);
    setRecallResult(isCorrect ? "correct" : "wrong");
    setGameScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
  };

  const handleMemoryCard = (card) => {
    if (memoryLocked || memoryOpen.includes(card.id) || memoryMatched.includes(card.pairKey)) return;
    const cardText = card.label.replace(/\s*\([^)]*\)\s*$/, "");
    if (card.language.startsWith("bn")) speakSelectedBengali(cardText);
    else speak(cardText, card.language);
    const nextOpen = [...memoryOpen, card.id];
    setMemoryOpen(nextOpen);
    if (nextOpen.length < 2) return;

    setMemoryMoves((moves) => moves + 1);
    setMemoryLocked(true);
    const firstCard = memoryCards.find((item) => item.id === nextOpen[0]);
    if (firstCard?.pairKey === card.pairKey) {
      setMemoryMatched((matched) => [...matched, card.pairKey]);
      setMemoryOpen([]);
      setMemoryLocked(false);
      return;
    }

    memoryTimerRef.current = setTimeout(() => {
      setMemoryOpen([]);
      setMemoryLocked(false);
    }, 700);
  };

  const startArcadeGame = (mode) => {
    setArcadeScore(0);
    setArcadeCombo(0);
    setArcadeTime(30);
    setArcadeLives(3);
    setArcadeMessage("");
    setArcadeRunning(true);
    startNewGameRound(mode === "sound" ? "bn-en" : gameDirection);
    if (mode === "sound") setArcadeMessage("Listen closely!");
  };

  const handleArcadePick = (option) => {
    if (!arcadeRunning || !gameQuestion) return;
    const isCorrect = option.label === gameQuestion.correctAnswer;
    if (isCorrect) {
      const nextCombo = arcadeCombo + 1;
      setArcadeCombo(nextCombo);
      setArcadeScore((score) => score + 100 + Math.min(nextCombo - 1, 5) * 25);
      setArcadeMessage(nextCombo >= 3 ? `🔥 ${nextCombo}x combo!` : "✨ Nice hit!");
    } else {
      setArcadeCombo(0);
      setArcadeMessage(`💥 It was ${gameQuestion.correctAnswer}`);
      if (gameMode === "sound") {
        setArcadeLives((lives) => {
          const nextLives = lives - 1;
          if (nextLives <= 0) setArcadeRunning(false);
          return Math.max(0, nextLives);
        });
      } else {
        setArcadeScore((score) => Math.max(0, score - 25));
      }
    }
    startNewGameRound(gameMode === "sound" ? "bn-en" : gameDirection);
  };

  const handleBingoPick = (item) => {
    if (!bingoTarget || bingoMatched.includes(wordKey(item))) return;
    if (wordKey(item) !== wordKey(bingoTarget)) {
      setBingoMistakes((mistakes) => mistakes + 1);
      return;
    }
    const nextMatched = [...bingoMatched, wordKey(item)];
    setBingoMatched(nextMatched);
    const remaining = bingoBoard.filter((card) => !nextMatched.includes(wordKey(card)));
    const nextTarget = remaining[Math.floor(Math.random() * remaining.length)] || null;
    setBingoTarget(nextTarget);
    if (nextTarget) setTimeout(() => speakSelectedBengali(nextTarget.bn), 180);
  };

  const handlePronunciationPick = (option) => {
    if (!pronunciationQuestion || pronunciationResult) return;
    const isCorrect = option === pronunciationQuestion.en;
    setPronunciationChoice(option);
    setPronunciationResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setArcadeScore((score) => score + 100);
      setArcadeCombo((combo) => combo + 1);
      setTimeout(startPronunciationRound, 700);
    } else {
      setArcadeCombo(0);
    }
  };

  keyboardActionsRef.current = {
    pickGame: handleGamePick,
    pickArcade: handleArcadePick,
    pickBingo: handleBingoPick,
    pickPronunciation: handlePronunciationPick,
  };

  useEffect(() => {
    if (contentTab !== "games") return undefined;

    const handleGameKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;

      const shortcutKey = event.key.toLocaleLowerCase();
      if (shortcutKey === "r" || shortcutKey === "t") {
        const targetBengali = gameMode === "bingo"
          ? bingoTarget?.bn
          : gameMode === "pronunciation"
            ? pronunciationQuestion?.bn
            : gameQuestion?.bn;
        if (targetBengali) {
          event.preventDefault();
          if (shortcutKey === "r") {
            speakSelectedBengali(targetBengali);
          } else if (containsBengali(targetBengali)) {
            dispatch(actions.setBengaliBreakdownText(targetBengali));
            dispatch(actions.setIsBengaliBreakdownOpen(true));
          }
        }
        return;
      }

      if (!/^\d$/.test(event.key)) return;
      const optionIndex = event.key === "0" ? 9 : Number(event.key) - 1;
      if (optionIndex < 0) return;

      if (gameMode === "match" && !gameResult) {
        const option = gameQuestion?.options[optionIndex];
        if (option) keyboardActionsRef.current.pickGame(option);
      } else if ((gameMode === "sprint" || gameMode === "sound") && arcadeRunning) {
        const option = gameQuestion?.options[optionIndex];
        if (option) keyboardActionsRef.current.pickArcade(option);
      } else if (gameMode === "bingo") {
        const option = bingoBoard[optionIndex];
        if (option) keyboardActionsRef.current.pickBingo(option);
      } else if (gameMode === "pronunciation" && !pronunciationResult) {
        const option = pronunciationQuestion?.options[optionIndex];
        if (option) keyboardActionsRef.current.pickPronunciation(option);
      } else {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", handleGameKeyDown);
    return () => window.removeEventListener("keydown", handleGameKeyDown);
  }, [
    arcadeRunning,
    bingoBoard,
    bingoTarget,
    contentTab,
    dispatch,
    gameMode,
    gameQuestion,
    gameResult,
    pronunciationQuestion,
    pronunciationResult,
    speakSelectedBengali,
  ]);

  const statsSummary = useMemo(() => {
    return gameItems.map(wordKey).reduce((acc, key) => {
      acc[statusForWord(matchStats, key)] += 1;
      return acc;
    }, { correct: 0, wrong: 0, new: 0 });
  }, [gameItems, matchStats]);

  const accuracy = gameScore.total ? Math.round((gameScore.correct / gameScore.total) * 100) : 0;
  const memoryComplete = memoryCards.length > 0 && memoryMatched.length === memoryCards.length / 2;

  const shellStyles = `
    .bn-shell { max-width: 1100px; margin: 0 auto; padding: 1rem; display: grid; gap: 0.75rem; font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif; }
    .bn-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; box-shadow: 0 10px 24px rgba(15,23,42,0.08); }
    .bn-grid { display: grid; gap: 0.75rem; }
    @media (min-width: 820px) { .bn-grid { grid-template-columns: 1fr 1fr; } }
    .bn-section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; background: #f8fafc; }
    .bn-pill { padding: 0.4rem 0.7rem; border-radius: 999px; background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; font-size: 0.9rem; }
    .bn-btn { padding: 0.65rem 0.85rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #0f172a; color: #fff; cursor: pointer; font-weight: 700; }
    .bn-btn.secondary { background: #f8fafc; color: #0f172a; }
    .bn-tabs { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
    .bn-tab { border: 1px solid #e2e8f0; background: rgba(255,255,255,0.78); color: #0f172a; border-radius: 999px; padding: 0.45rem 0.7rem; font-weight: 700; cursor: pointer; text-align: center; }
    .bn-tab.active { background: #111827; color: #fff; border-color: #111827; }
    .bn-tab:disabled { cursor: not-allowed; opacity: 0.48; }
    .bn-select, .bn-input { padding: 0.7rem; border-radius: 10px; border: 1px solid #dbe3ef; background: #fff; color: #0f172a; font-weight: 700; }
    .bn-row { display: grid; gap: 6px; }
    .bn-game-picker { width: min(100%, 360px); }
    .bn-game-picker .bn-select { min-height: 48px; font-size: 1rem; cursor: pointer; }
    .bn-game-shell { display: grid; gap: 14px; padding: 1rem; border: 1px solid #dbe3ef; border-radius: 16px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 18px 40px rgba(15,23,42,0.08); }
    .bn-game-scoreboard { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (min-width: 760px) { .bn-game-scoreboard { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .bn-stat { min-width: 0; padding: 0.65rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 12px; background: rgba(255,255,255,0.86); }
    .bn-stat-label { color: #64748b; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
    .bn-stat-value { margin-top: 2px; color: #0f172a; font-size: 1rem; font-weight: 900; }
    .bn-game-card { display: grid; gap: 12px; padding: 1rem; border: 1px solid #dbe3ef; border-radius: 16px; background: #fff; box-shadow: 0 14px 34px rgba(15,23,42,0.08); }
    .bn-game-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .bn-game-prompt { display: inline-block; color: #0f172a; font-size: 1.25rem; font-weight: 900; line-height: 1.25; border-radius: 10px; padding: 0.12rem 0.45rem; }
    .bn-game-prompt.bn-match-prompt { display: block; font-size: clamp(2.75rem, 9vw, 5.5rem) !important; line-height: 1.12; }
    .bn-game-prompt.match-correct { background: #dcfce7; color: #14532d; border: 1px solid #16a34a; }
    .bn-game-prompt.match-wrong { background: #fee2e2; color: #7f1d1d; border: 1px solid #ef4444; }
    .bn-game-prompt.match-new { background: #fef9c3; color: #713f12; border: 1px solid #eab308; }
    .bn-game-subtext { color: #64748b; font-size: 0.95rem; font-weight: 700; line-height: 1.35; }
    .bn-game-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .bn-game-options { display: grid; gap: 8px; }
    .bn-game-option { width: 100%; border: 1px solid #dbe3ef; background: #fff; color: #1e293b; padding: 0.75rem 0.85rem; border-radius: 12px; font-weight: 800; text-align: left; cursor: pointer; box-shadow: 0 8px 18px rgba(15,23,42,0.05); }
    .bn-game-option.correct { background: #dcfce7; border-color: #16a34a; color: #14532d; }
    .bn-game-option.wrong { background: #fee2e2; border-color: #ef4444; color: #7f1d1d; }
    .bn-option-index { display: inline-flex; align-items: center; justify-content: center; width: 1.45rem; height: 1.45rem; margin-right: 0.65rem; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 0.76rem; font-weight: 900; }
    .bn-game-feedback { padding: 0.75rem 0.85rem; border-radius: 12px; font-weight: 800; }
    .bn-game-feedback.correct { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .bn-game-feedback.wrong { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .bn-recall-form { display: grid; gap: 10px; }
    .bn-recall-form .bn-input { width: 100%; min-height: 48px; font-size: 1rem; }
    .bn-memory-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .bn-memory-card { min-height: 84px; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 12px; background: #176b4d; color: transparent; cursor: pointer; font-weight: 850; line-height: 1.25; box-shadow: 0 7px 16px rgba(15,23,42,0.09); }
    .bn-memory-card::after { content: "?"; color: #fff; font-size: 1.35rem; }
    .bn-memory-card.open, .bn-memory-card.matched { background: #fff; color: #17211b; }
    .bn-memory-card.open::after, .bn-memory-card.matched::after { content: ""; }
    .bn-memory-card.matched { border-color: #16a34a; background: #dcfce7; color: #14532d; cursor: default; }
    .bn-arcade-card { overflow: hidden; border: 2px solid #7c3aed; background: radial-gradient(circle at top right, rgba(250,204,21,.22), transparent 35%), linear-gradient(145deg, #faf5ff, #eff6ff); }
    .bn-arcade-card.sound { border-color: #0891b2; background: radial-gradient(circle at top right, rgba(34,211,238,.22), transparent 38%), linear-gradient(145deg, #ecfeff, #f0fdf4); }
    .bn-arcade-hud { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .bn-arcade-hud span { padding: 0.65rem; border-radius: 12px; background: #fff; color: #312e81; box-shadow: 0 5px 14px rgba(49,46,129,.1); font-size: 1.05rem; font-weight: 900; text-align: center; }
    .bn-arcade-start { display: grid; justify-items: center; gap: 12px; padding: 1.5rem 0.5rem; text-align: center; }
    .bn-sound-target { display: flex; align-items: center; gap: 10px; color: #164e63; font-size: clamp(1.4rem, 4vw, 2rem); font-weight: 950; }
    .bn-bingo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .bn-bingo-card { min-height: 92px; padding: 0.65rem; border: 2px solid #f59e0b; border-radius: 16px; background: linear-gradient(145deg, #fffbeb, #fff7ed); color: #78350f; cursor: pointer; font-weight: 850; box-shadow: 0 7px 16px rgba(180,83,9,.11); }
    .bn-bingo-card.matched { border-color: #16a34a; background: #dcfce7; color: #14532d; cursor: default; }
    .bn-bingo-card small { display: block; margin-top: 5px; font-weight: 700; opacity: .72; }
    .bn-pop-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; padding-bottom: 10px; }
    .bn-pop-option { position: relative; min-height: 110px; padding: 1rem; border: 0; border-radius: 50% 50% 46% 46%; background: radial-gradient(circle at 35% 25%, #fff, #bae6fd 18%, #0ea5e9 75%); color: #082f49; cursor: pointer; font-size: 1rem; font-weight: 950; box-shadow: 0 12px 22px rgba(14,165,233,.22); transform-origin: center bottom; animation: bn-balloon-float 2.2s ease-in-out infinite alternate; }
    .bn-pop-option:nth-child(2n) { background: radial-gradient(circle at 35% 25%, #fff, #ddd6fe 18%, #8b5cf6 75%); color: #2e1065; }
    .bn-pop-option:nth-child(3n) { animation-delay: -1.1s; }
    .bn-pop-option::after { content: ""; position: absolute; bottom: -8px; left: calc(50% - 7px); width: 0; height: 0; border-right: 7px solid transparent; border-bottom: 0; border-left: 7px solid transparent; border-top: 11px solid #0ea5e9; }
    .bn-pop-option:nth-child(2n)::after { border-top-color: #8b5cf6; }
    .bn-pop-option.correct { outline: 4px solid #22c55e; }
    .bn-pop-option.wrong { outline: 4px solid #ef4444; }
    .bn-pop-option.popping { pointer-events: none; animation: bn-balloon-pop 380ms cubic-bezier(.2,.8,.3,1) forwards; }
    .bn-pop-burst { position: absolute; inset: 50% auto auto 50%; z-index: 3; pointer-events: none; font-size: 2rem; animation: bn-pop-burst 650ms ease-out forwards; }
    .bn-pop-stage { position: relative; }
    @keyframes bn-balloon-float { from { transform: translateY(3px) rotate(-1deg); } to { transform: translateY(-5px) rotate(1deg); } }
    @keyframes bn-balloon-pop { 0% { opacity: 1; transform: scale(1); } 42% { opacity: 1; transform: scale(1.22,.82); } 70% { opacity: .9; transform: scale(1.5); filter: saturate(1.8); } 100% { opacity: 0; transform: scale(1.9); filter: blur(5px); } }
    @keyframes bn-pop-burst { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.2) rotate(-12deg); } 35% { opacity: 1; transform: translate(-50%,-50%) scale(1.35) rotate(6deg); } 100% { opacity: 0; transform: translate(-50%,-90%) scale(1.8) rotate(12deg); } }
    @media (max-width: 520px) { .bn-memory-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 520px) { .bn-bingo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (prefers-reduced-motion: reduce) { .bn-pop-option { animation: none; } .bn-pop-option.popping { opacity: 0; } .bn-pop-burst { animation: none; } }
    .bn-script { display: inline-block; font-size: 3rem; font-weight: 800; color: #0f172a; border-radius: 10px; padding: 0.08rem 0.35rem; }
    .bn-pronunciation { color: #475569; font-weight: 700; }
    .bn-translation { color: #0f172a; }
    .bn-breakdown { display: grid; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .bn-breakdown-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .bn-breakdown-speech-control { display: flex; align-items: center; gap: 8px; color: #475569; font-size: .82rem; font-weight: 700; }
    .bn-breakdown-speech-control .bn-select { min-height: 38px; padding: .45rem .65rem; }
    .bn-breakdown-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
    .bn-breakdown-word { display: grid; gap: 3px; padding: 0.65rem; border: 1px solid #dbe3ef; border-radius: 10px; background: #f8fafc; }
    .bn-breakdown-word .bn-pronunciation { color: #1d4ed8; }
  `;

  return (
    <main className="bn-page">
      <style>{shellStyles}</style>
      <div className="bn-shell">
        {view !== "games" && 
        <header className="bn-card" style={{ display: "grid", gap: 12 }}>
          <div>
            <span className="bn-pill">{view === "games" ? "Practice and recall" : "Learn naturally"}</span>
            <h1><span lang="bn">বাংলা</span> {view === "games" ? "Games" : "Tutor"}</h1>
            <p>{view === "games"
              ? "Strengthen Bengali recall with focused games from the selected lesson."
              : "Choose a saved lesson, hear pronunciation, and build understanding phrase by phrase."}</p>
          </div>
          {view === "tutor" && lesson && <ActionButtons promptText={combinedLessonPrompt} />}
          {showLessonSelector && (
            <div className="bn-grid">
              <label className="bn-row">
                <strong>Saved lesson category</strong>
                <select className="bn-select" value={savedLessonId} onChange={(e) => loadSavedLesson(e.target.value)}>
                  {SELECTABLE_SAVED_LESSONS.map((savedLesson) => (
                    <option key={savedLesson.id} value={savedLesson.id}>{savedLesson.topic}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </header>
        }

        {lesson && (
          <article className="bn-card" style={{ display: "grid", gap: 12 }}>
            <div>
              <h2>{usingTranslations ? selectedTranslationSet?.title || "Saved Bengali → English result" : lesson.title}</h2>
              <p>{usingTranslations
                ? `Practice this saved translation as ${translationItems.length} phrase${translationItems.length === 1 ? "" : "s"} or ${translationWords.length} word${translationWords.length === 1 ? "" : "s"}.`
                : lesson.summary}</p>
              <div className="bn-game-actions">
                {!usingTranslations && <span className="bn-pill">{lesson.level}</span>}
                {!usingTranslations && <span className="bn-pill">{lesson.focus}</span>}
                <span className="bn-pill">{usingTranslations ? gameItems.length : filteredVocab.length + filteredPhrases.length} items</span>
              </div>
            </div>

            {view === "tutor" && (
              <div className="bn-tutor-order-controls">
                <div className="bn-tabs">
                  <button className={`bn-tab ${contentTab === "phrases" ? "active" : ""}`} onClick={() => { setContentTab("phrases"); setJumpTarget(""); }} disabled={!filteredPhrases.length}>Key Phrases</button>
                  <button className={`bn-tab ${contentTab === "vocab" ? "active" : ""}`} onClick={() => { setContentTab("vocab"); setJumpTarget(""); }} disabled={!filteredVocab.length}>Vocabulary</button>
                </div>
                <button
                  type="button"
                  className="bn-btn secondary bn-shuffle-btn"
                  disabled={activeTutorItems.length < 2}
                  onClick={() => {
                    setJumpTarget("");
                    if (contentTab === "phrases") setPhraseShuffleVersion((version) => version + 1);
                    else setVocabShuffleVersion((version) => version + 1);
                  }}
                >
                  Shuffle {contentTab === "phrases" ? "phrases" : "vocabulary"}
                </button>
              </div>
            )}

            {view === "tutor" && (
              <div className={`bn-tutor-scroll-shell ${isTutorWindowView ? "bn-tutor-window-view" : ""}`}>
                <div className="bn-auto-scroll" aria-label="Automatic lesson scroll controls">
                  <div className="bn-scroll-button-group">
                    <button type="button" className={scrollDirection < 0 ? "active" : ""} onClick={() => activateScrollDirection(-1)} aria-label="Auto-scroll up" title="Auto-scroll up"><FaBackward aria-hidden="true" /></button>
                    <button type="button" className="primary" onClick={() => setIsAutoScrolling((running) => !running)} aria-label={isAutoScrolling ? "Pause automatic scrolling" : "Start automatic scrolling"}>{isAutoScrolling ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}</button>
                    <button type="button" className={isScrollLooping ? "active" : ""} onClick={() => setIsScrollLooping((looping) => !looping)} aria-label={isScrollLooping ? "Disable looping" : "Enable looping"} title="Toggle looping"><FaRedoAlt aria-hidden="true" /></button>
                    <button type="button" className={scrollDirection > 0 ? "active" : ""} onClick={() => activateScrollDirection(1)} aria-label="Auto-scroll down" title="Auto-scroll down"><FaForward aria-hidden="true" /></button>
                    <button type="button" onClick={() => { setIsAutoScrolling(false); tutorContentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Return to top" title="Return to top"><FaUndoAlt aria-hidden="true" /></button>
                    <button type="button" onClick={() => nudgeTutorScroll(-1)} aria-label="Scroll up a little" title="Scroll up a little"><FaStepBackward aria-hidden="true" /></button>
                    <button type="button" onClick={() => nudgeTutorScroll(1)} aria-label="Scroll down a little" title="Scroll down a little"><FaStepForward aria-hidden="true" /></button>
                  </div>
                  <div className="bn-scroll-settings">
                    <button type="button" onClick={() => setScrollSpeed((speed) => Math.max(5, speed - 5))} aria-label="Decrease scroll speed" title="Decrease scroll speed"><FaMinus aria-hidden="true" /></button>
                    <button type="button" onClick={() => setScrollSpeed((speed) => Math.min(200, speed + 5))} aria-label="Increase scroll speed" title="Increase scroll speed"><FaPlus aria-hidden="true" /></button>
                    <span className="bn-scroll-speed">{scrollSpeed} px/s</span>
                    <label className="bn-scroll-delay">
                      <span>Restart</span>
                      <input type="number" min="0" max="60" step="0.5" value={scrollRestartDelay} onChange={(event) => setScrollRestartDelay(Math.max(0, Math.min(60, Number(event.target.value) || 0)))} aria-label="Loop restart delay in seconds" />
                      <span>sec</span>
                    </label>
                    <button type="button" className="bn-window-button" onClick={() => setIsTutorWindowView((expanded) => !expanded)} aria-label={isTutorWindowView ? "Exit full window view" : "Open lesson in full window view"} title={isTutorWindowView ? "Exit full window (Esc)" : "Full window"}>
                      {isTutorWindowView ? <FaCompressAlt aria-hidden="true" /> : <FaExpandAlt aria-hidden="true" />}
                      <span>{isTutorWindowView ? "Exit" : "Full window"}</span>
                    </button>
                  </div>
                  <label className="bn-jump-bar">
                    <select
                      className="bn-select"
                      value={jumpTarget}
                      aria-label={`Jump to ${contentTab === "phrases" ? "phrase" : "word"}`}
                      onChange={(event) => {
                        const targetId = event.target.value;
                        setJumpTarget(targetId);
                        setIsAutoScrolling(false);
                        const container = tutorContentRef.current;
                        const target = document.getElementById(targetId);
                        if (!container || !target) return;
                        const containerRect = container.getBoundingClientRect();
                        const targetRect = target.getBoundingClientRect();
                        container.scrollTo({
                          top: container.scrollTop + targetRect.top - containerRect.top
                            - Math.max(0, (container.clientHeight - targetRect.height) / 2),
                          behavior: "smooth",
                        });
                      }}
                    >
                      <option value="">Choose in English…</option>
                      {activeTutorItems.map((item, idx) => (
                        <option key={`${item.bn}-${idx}`} value={`bn-${contentTab}-${idx}`}>
                          {item.en}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div
                  className="bn-scroll-progress"
                  role="slider"
                  tabIndex="0"
                  aria-label="Lesson scroll position"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={Math.round(scrollProgress)}
                  aria-valuetext={`${Math.round(scrollProgress)} percent`}
                  onPointerDown={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    seekTutorScroll(((event.clientX - bounds.left) / bounds.width) * 100);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                    event.preventDefault();
                    seekTutorScroll(scrollProgress + (event.key === "ArrowRight" ? 5 : -5));
                  }}
                >
                  <span style={{ width: `${scrollProgress}%` }} />
                </div>
                <div
                  className="bn-tutor-scroll-content"
                  ref={tutorContentRef}
                  onScroll={(event) => {
                    const container = event.currentTarget;
                    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
                    setScrollProgress(maxScrollTop ? (container.scrollTop / maxScrollTop) * 100 : 100);
                  }}
                >
            {contentTab === "phrases" && (
              <section className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h3>Key phrases</h3>
                {orderedPhrases.map((phrase, idx) => (
                  <article id={`bn-phrases-${idx}`} key={`${phrase.bn}-${idx}`} className="bn-section" style={{ background: "#fff" }}>
                    <div className="bn-script" lang="bn">{phrase.bn}</div>
                    <div className="bn-pronunciation">{phrase.pronunciation}</div>
                    <div className="bn-translation">{phrase.en}</div>
                    {phrase.context && <div style={{ color: "#475569" }}>{phrase.context}</div>}
                    <div className="bn-breakdown">
                      <div className="bn-breakdown-header">
                        <strong>Phrase breakdown</strong>
                        <label className="bn-breakdown-speech-control">
                          <span>Word speech</span>
                          <select
                            className="bn-select"
                            value={breakdownSpeechSource}
                            onChange={(event) => setBreakdownSpeechSource(event.target.value)}
                            aria-label="Choose phrase breakdown word speech source"
                          >
                            <option value="google">Google voice</option>
                            <option value="system">System default</option>
                          </select>
                        </label>
                      </div>
                      <div className="bn-breakdown-list">
                        {phrase.words.map((word, wordIndex) => (
                          <div className="bn-breakdown-word" key={`${phrase.bn}-${word.bn}-${wordIndex}`}>
                            <button
                              type="button"
                              className="bn-script bn-breakdown-speakable"
                              lang="bn"
                              aria-label={`Hear ${word.bn} in Bengali with ${breakdownSpeechSource === "google" ? "Google voice" : "the system default voice"}`}
                              title={`Hear with ${breakdownSpeechSource === "google" ? "Google voice" : "system default"}`}
                              onClick={() => speakBreakdownWord(word.bn)}
                            >
                              {word.bn}
                            </button>
                            <span className="bn-pronunciation">{word.pronunciation}</span>
                            <span className="bn-translation">{word.en}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <BengaliItemActions item={phrase} />
                  </article>
                ))}
              </section>
            )}

            {contentTab === "vocab" && (
              <section className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h3>Vocabulary</h3>
                {orderedVocab.map((word, idx) => (
                  <article id={`bn-vocab-${idx}`} key={`${word.bn}-${idx}`} className="bn-section" style={{ background: "#fff" }}>
                    <div className="bn-script" lang="bn">{word.bn}</div>
                    <div className="bn-pronunciation">{word.pronunciation}</div>
                    <div className="bn-translation">{word.en}</div>
                    <BengaliItemActions item={word} />
                  </article>
                ))}
              </section>
            )}
                </div>
              </div>
            )}

            {view === "games" && (
              <div className="bn-game-shell">
                {translationSets.length > 0 && (
                  <label className="bn-row bn-game-picker">
                    <strong>Saved translation</strong>
                    <select
                      className="bn-select"
                      value={selectedTranslationSet?.id || ""}
                      onChange={(event) => setTranslationSetId(event.target.value)}
                    >
                      {translationSets.map((set, index) => (
                        <option key={set.id} value={set.id}>
                          {index + 1}. {shortTranslationLabel(set.title)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="bn-row bn-game-picker">
                  <strong>Practice set</strong>
                  <select className="bn-select" value={gameDataset} onChange={(event) => setGameDataset(event.target.value)}>
                    <option value="vocab" disabled={!filteredVocab.length}>Vocab set</option>
                    <option value="phrases" disabled={!filteredPhrases.length}>Phrases set</option>
                    <option value="breakdown-words" disabled={breakdownWords.length < 2}>Breakdown words</option>
                    <option value="translation-phrases" disabled={!translationItems.length}>Selected translation phrases ({translationItems.length})</option>
                    <option value="translation-words" disabled={!translationWords.length}>Selected translation words ({translationWords.length})</option>
                  </select>
                </label>
                <div className="bn-tabs">
                  <button className={`bn-tab ${gameDirection === "bn-en" ? "active" : ""}`} onClick={() => setGameDirection("bn-en")}>Bengali to English</button>
                  <button className={`bn-tab ${gameDirection === "en-bn" ? "active" : ""}`} onClick={() => setGameDirection("en-bn")}>English to Bengali</button>
                </div>

                <label className="bn-row bn-game-picker">
                  <strong>Choose a game</strong>
                  <select
                    className="bn-select"
                    value={gameMode}
                    onChange={(event) => {
                      setGameMode(event.target.value);
                      setArcadeRunning(false);
                    }}
                  >
                    <option value="match">🎯 Match It</option>
                    <option value="sprint">⚡ 30s Sprint</option>
                    <option value="sound">🎧 Sound Quest</option>
                    <option value="bingo">🎵 Bengali Bingo</option>
                    <option value="pronunciation">🎈 Word Pop</option>
                    <option value="memory">🧠 Memory Flip</option>
                    <option value="recall">✍️ Type Recall</option>
                  </select>
                </label>

                {(gameMode === "match" || gameMode === "recall") && <div className="bn-game-scoreboard">
                  <div className="bn-stat"><div className="bn-stat-label">Score</div><div className="bn-stat-value">{gameScore.correct}/{gameScore.total}</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Accuracy</div><div className="bn-stat-value">{accuracy}%</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Learned</div><div className="bn-stat-value">{statsSummary.correct}/{gameItems.length}</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Streak</div><div className="bn-stat-value">{gameScore.streak} / {gameScore.bestStreak}</div></div>
                </div>}

                {gameMode === "match" && (gameQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div
                          className={`bn-game-prompt bn-match-prompt ${statusClassForKey(matchStats, gameQuestion.key)}`}
                          style={{ fontSize: "clamp(2.75rem, 9vw, 5.5rem)" }}
                        >
                          {gameDirection === "bn-en" ? (
                            <>
                              <span lang="bn">{gameQuestion.bn}</span>
                              {gameQuestion.pronunciation && <span className="bn-match-pronunciation"> ({gameQuestion.pronunciation})</span>}
                            </>
                          ) : gameQuestion.en}
                        </div>
                      </div>
                      <label className="bn-row" style={{ width: 130 }}>
                        <strong>Options</strong>
                        <select className="bn-select" value={matchOptionsCount} onChange={(e) => setMatchOptionsCount(Number(e.target.value))}>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="bn-game-actions">
                      <button className="bn-btn secondary" onClick={() => speakSelectedBengali(gameQuestion.bn)}>Hear target Bengali</button>
                      {containsBengali(gameQuestion.bn) && (
                        <button
                          type="button"
                          className="bn-btn secondary"
                          onClick={() => {
                            dispatch(actions.setBengaliBreakdownText(gameQuestion.bn));
                            dispatch(actions.setIsBengaliBreakdownOpen(true));
                          }}
                        >
                          Open Bengali breakdown
                        </button>
                      )}
                      <button className="bn-btn secondary" onClick={() => startNewGameRound()}>New card</button>
                    </div>
                    <div className="bn-game-options">
                      {gameQuestion.options.map((option, idx) => {
                        const isCorrect = option.label === gameQuestion.correctAnswer;
                        const stateClass = gameResult ? isCorrect ? "correct" : option.label === gameChoice ? "wrong" : "" : "";
                        return (
                          <button key={`${option.key}-${option.label}`} className={`bn-game-option ${stateClass}`} onClick={() => handleGamePick(option)} disabled={!!gameResult}>
                            <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {gameResult && (
                      <div className={`bn-game-feedback ${gameResult}`}>
                        {gameResult === "correct" ? "Correct" : `Answer: ${gameQuestion.correctAnswer}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "#475569" }}>Add at least two items to start Match It.</div>
                ))}

                {gameMode === "recall" && (gameQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-subtext">Type the {gameDirection === "en-bn" ? "Bengali" : "English"} translation from memory</div>
                        <div className={`bn-game-prompt ${statusClassForKey(matchStats, gameQuestion.key)}`}>{gameQuestion.displayQuestion}</div>
                      </div>
                      <button
                        className="bn-btn secondary bn-icon-btn"
                        onClick={() => speakSelectedBengali(gameQuestion.bn)}
                        aria-label="Hear Bengali"
                        title="Hear Bengali"
                      >
                        <LanguageIcon language="BN" />
                      </button>
                    </div>
                    <form className="bn-recall-form" onSubmit={handleRecallSubmit}>
                      <label className="bn-row">
                        <strong>Your answer</strong>
                        <input
                          className="bn-input"
                          value={recallAnswer}
                          onChange={(event) => setRecallAnswer(event.target.value)}
                          placeholder={gameDirection === "en-bn" ? "বাংলায় লিখুন" : "Type in English"}
                          autoComplete="off"
                          disabled={!!recallResult}
                        />
                      </label>
                      <div className="bn-game-actions">
                        <button className="bn-btn" type="submit" disabled={!recallAnswer.trim() || !!recallResult}>Check answer</button>
                        {recallResult && <button className="bn-btn secondary" type="button" onClick={() => startNewGameRound()}>Next word</button>}
                      </div>
                    </form>
                    {recallResult && (
                      <div className={`bn-game-feedback ${recallResult}`}>
                        {recallResult === "correct" ? "✨ Nailed it! Active recall makes memories stick." : `Keep going — the answer is ${gameDirection === "en-bn" ? gameQuestion.bengaliDisplay : gameQuestion.en}.`}
                      </div>
                    )}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to start Type Recall.</div>)}

                {(gameMode === "sprint" || gameMode === "sound") && (gameQuestion ? (
                  <div className={`bn-game-card bn-arcade-card ${gameMode}`}>
                    <div className="bn-arcade-hud">
                      <span>🏆 {arcadeScore}</span>
                      {gameMode === "sprint" ? <span>⏱️ {arcadeTime}s</span> : <span aria-label={`${arcadeLives} lives`}>{"❤️".repeat(arcadeLives)}{"🖤".repeat(3 - arcadeLives)}</span>}
                      <span>🔥 {arcadeCombo}x</span>
                    </div>
                    {!arcadeRunning ? (
                      <div className="bn-arcade-start">
                        <div className="bn-game-prompt">{gameMode === "sprint" ? "Score as many points as you can in 30 seconds!" : arcadeLives === 0 ? "Quest over! Ready for another run?" : "Listen and find the right meaning. Three lives!"}</div>
                        <div className="bn-game-subtext">Correct streaks unlock combo bonus points.</div>
                        <button className="bn-btn" onClick={() => startArcadeGame(gameMode)}>{arcadeScore ? "Play again" : "Start game"}</button>
                      </div>
                    ) : (
                      <>
                        <div className="bn-game-card-top">
                          <div>
                            {gameMode === "sprint" ? (
                              <div className="bn-game-prompt">{gameQuestion.displayQuestion}</div>
                            ) : (
                              <div>
                                <div className="bn-sound-target">🎧 <span>What did you hear?</span></div>
                                <div className="bn-game-subtext" lang="bn">{gameQuestion.bengaliDisplay}</div>
                              </div>
                            )}
                            <div className="bn-game-subtext">{arcadeMessage || "Go!"}</div>
                          </div>
                          {gameMode === "sound" && <button className="bn-btn secondary" onClick={() => speakSelectedBengali(gameQuestion.bn)}>🔊 Replay sound</button>}
                        </div>
                        <div className="bn-game-options">
                          {gameQuestion.options.map((option, idx) => (
                            <button key={`${option.key}-${option.label}`} className="bn-game-option" onClick={() => handleArcadePick(option)}>
                              <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to enter the arcade.</div>)}

                {gameMode === "bingo" && (bingoBoard.length ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-prompt">🎵 Bengali Bingo</div>
                        <div className="bn-game-subtext">Listen, then tap the matching meaning. Clear the whole board!</div>
                      </div>
                      <div className="bn-game-actions">
                        <span className="bn-pill">✅ {bingoMatched.length}/{bingoBoard.length}</span>
                        <span className="bn-pill">💥 {bingoMistakes}</span>
                        <button className="bn-btn secondary" onClick={() => bingoTarget && speakSelectedBengali(bingoTarget.bn)}>🔊 Replay</button>
                        <button className="bn-btn secondary" onClick={startBingoRound}>New board</button>
                      </div>
                    </div>
                    {bingoTarget && <div className="bn-game-feedback correct" lang="bn">Find: {bengaliLabel(bingoTarget)}</div>}
                    <div className="bn-bingo-grid">
                      {bingoBoard.map((item, idx) => {
                        const matched = bingoMatched.includes(wordKey(item));
                        return (
                          <button key={wordKey(item)} className={`bn-bingo-card ${matched ? "matched" : ""}`} onClick={() => handleBingoPick(item)} disabled={matched}>
                            <span className="bn-option-index">{idx + 1}</span>
                            {matched ? "✓ " : ""}{item.en}
                            {matched && <small>{bengaliLabel(item)}</small>}
                          </button>
                        );
                      })}
                    </div>
                    {!bingoTarget && <div className="bn-game-feedback correct">🎉 BINGO! Board cleared with {bingoMistakes} mistake{bingoMistakes === 1 ? "" : "s"}.</div>}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to play Bengali Bingo.</div>)}

                {gameMode === "pronunciation" && (pronunciationQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-subtext">Pop the balloon with the matching meaning</div>
                        <div className="bn-game-prompt" lang="bn">{pronunciationQuestion.bengaliDisplay}</div>
                      </div>
                      <div className="bn-game-actions">
                        <span className="bn-pill">🏆 {arcadeScore}</span>
                        <span className="bn-pill">🔥 {arcadeCombo}x</span>
                        <button className="bn-btn secondary" onClick={() => speakSelectedBengali(pronunciationQuestion.bn)}>🔊 Hear it</button>
                      </div>
                    </div>
                    <div className="bn-pop-stage">
                      {pronunciationResult === "correct" && <div className="bn-pop-burst" aria-hidden="true">💥✨🎉</div>}
                      <div className="bn-pop-options">
                        {pronunciationQuestion.options.map((option, idx) => {
                          const stateClass = pronunciationResult ? option === pronunciationQuestion.en ? "correct" : option === pronunciationChoice ? "wrong" : "" : "";
                          const isPopping = pronunciationResult && option === pronunciationChoice;
                          return <button key={option} className={`bn-pop-option ${stateClass} ${isPopping ? "popping" : ""}`} onClick={() => handlePronunciationPick(option)} disabled={!!pronunciationResult}><span className="bn-option-index">{idx + 1}</span>{option}</button>;
                        })}
                      </div>
                    </div>
                    {pronunciationResult === "wrong" && (
                      <div className="bn-game-feedback wrong">
                        The answer is {pronunciationQuestion.en}.
                        <button className="bn-btn secondary" onClick={startPronunciationRound} style={{ marginLeft: 10 }}>Next balloon</button>
                      </div>
                    )}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add pronunciations for at least two items to play Word Pop.</div>)}

                {gameMode === "memory" && (memoryCards.length ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-prompt">Find every matching pair</div>
                        <div className="bn-game-subtext">Flip a Bengali card and its translation. Cards speak when revealed.</div>
                      </div>
                      <div className="bn-game-actions">
                        <span className="bn-pill">{memoryMatched.length}/{memoryCards.length / 2} pairs</span>
                        <span className="bn-pill">{memoryMoves} moves</span>
                        <button className="bn-btn secondary" onClick={startMemoryRound}>Shuffle</button>
                      </div>
                    </div>
                    <div className="bn-memory-grid">
                      {memoryCards.map((card) => {
                        const isOpen = memoryOpen.includes(card.id);
                        const isMatched = memoryMatched.includes(card.pairKey);
                        return (
                          <button
                            key={card.id}
                            className={`bn-memory-card ${isOpen ? "open" : ""} ${isMatched ? "matched" : ""}`}
                            onClick={() => handleMemoryCard(card)}
                            disabled={memoryLocked || isMatched}
                            aria-label={isOpen || isMatched ? card.label : "Hidden memory card"}
                          >
                            {isOpen || isMatched ? card.label : "Hidden"}
                          </button>
                        );
                      })}
                    </div>
                    {memoryComplete && <div className="bn-game-feedback correct">🎉 Board cleared in {memoryMoves} moves! Shuffle and try to beat your score.</div>}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to start Memory Flip.</div>)}
              </div>
            )}

            {view === "tutor" && lesson.practice?.length ? (
              <section className="bn-section" style={{ display: "grid", gap: 8 }}>
                <h3>Practice</h3>
                {lesson.practice.map((item, idx) => (
                  <div key={idx} className="bn-section" style={{ background: "#fff" }}>
                    <strong>{item.type}</strong>
                    <div>{item.prompt}</div>
                    <div style={{ color: "#475569" }}>Answer: {item.answer}</div>
                  </div>
                ))}
              </section>
            ) : null}

            {view === "tutor" && lesson.notes?.length ? (
              <section className="bn-section">
                <h3>Notes</h3>
                {lesson.notes.map((note, idx) => <div key={idx} style={{ color: "#475569" }}>• {note}</div>)}
              </section>
            ) : null}
          </article>
        )}
      </div>
    </main>
  );
}

BengaliTutor.propTypes = {
  bengaliVoice: PropTypes.string,
  initialLesson: PropTypes.object,
  showLessonSelector: PropTypes.bool,
  translationSets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    phrases: PropTypes.arrayOf(PropTypes.object).isRequired,
  })),
  view: PropTypes.oneOf(["tutor", "games"]),
};

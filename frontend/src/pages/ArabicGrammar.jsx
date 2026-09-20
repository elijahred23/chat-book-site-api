import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaCheck,
  FaFont,
  FaGamepad,
  FaLayerGroup,
  FaLightbulb,
  FaRotateRight,
  FaVolumeHigh,
} from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { getGoogleTtsAudio } from "../utils/googleTtsAudioCache.js";
import "./ArabicGrammar.css";

const STORAGE_KEY = "arabic-grammar-progress";
const ALPHABET_STORAGE_KEY = "arabic-alphabet-progress";
const SECTION_STORAGE_KEY = "arabic-grammar-section";
const VALID_SECTIONS = ["alphabet", "positions", "grammar", "game"];
const NON_CONNECTING_LETTERS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

const ARABIC_ALPHABET = [
  { letter: "ا", name: "أَلِف", sound: "a / ā", forms: ["ا", "ا", "ـا", "ـا"], example: "أَسَد", romanized: "asad", meaning: "lion" },
  { letter: "ب", name: "بَاء", sound: "b", forms: ["ب", "بـ", "ـبـ", "ـب"], example: "بَاب", romanized: "bāb", meaning: "door" },
  { letter: "ت", name: "تَاء", sound: "t", forms: ["ت", "تـ", "ـتـ", "ـت"], example: "تُفَّاح", romanized: "tuffāḥ", meaning: "apples" },
  { letter: "ث", name: "ثَاء", sound: "th", forms: ["ث", "ثـ", "ـثـ", "ـث"], example: "ثَعْلَب", romanized: "thaʿlab", meaning: "fox" },
  { letter: "ج", name: "جِيم", sound: "j", forms: ["ج", "جـ", "ـجـ", "ـج"], example: "جَمَل", romanized: "jamal", meaning: "camel" },
  { letter: "ح", name: "حَاء", sound: "ḥ", forms: ["ح", "حـ", "ـحـ", "ـح"], example: "حَلِيب", romanized: "ḥalīb", meaning: "milk" },
  { letter: "خ", name: "خَاء", sound: "kh", forms: ["خ", "خـ", "ـخـ", "ـخ"], example: "خُبْز", romanized: "khubz", meaning: "bread" },
  { letter: "د", name: "دَال", sound: "d", forms: ["د", "د", "ـد", "ـد"], example: "دَار", romanized: "dār", meaning: "home" },
  { letter: "ذ", name: "ذَال", sound: "dh", forms: ["ذ", "ذ", "ـذ", "ـذ"], example: "ذَهَب", romanized: "dhahab", meaning: "gold" },
  { letter: "ر", name: "رَاء", sound: "r", forms: ["ر", "ر", "ـر", "ـر"], example: "رَجُل", romanized: "rajul", meaning: "man" },
  { letter: "ز", name: "زَاي", sound: "z", forms: ["ز", "ز", "ـز", "ـز"], example: "زَهْرَة", romanized: "zahrah", meaning: "flower" },
  { letter: "س", name: "سِين", sound: "s", forms: ["س", "سـ", "ـسـ", "ـس"], example: "سَمَك", romanized: "samak", meaning: "fish" },
  { letter: "ش", name: "شِين", sound: "sh", forms: ["ش", "شـ", "ـشـ", "ـش"], example: "شَمْس", romanized: "shams", meaning: "sun" },
  { letter: "ص", name: "صَاد", sound: "ṣ", forms: ["ص", "صـ", "ـصـ", "ـص"], example: "صَقْر", romanized: "ṣaqr", meaning: "falcon" },
  { letter: "ض", name: "ضَاد", sound: "ḍ", forms: ["ض", "ضـ", "ـضـ", "ـض"], example: "ضِفْدَع", romanized: "ḍifdaʿ", meaning: "frog" },
  { letter: "ط", name: "طَاء", sound: "ṭ", forms: ["ط", "طـ", "ـطـ", "ـط"], example: "طَائِر", romanized: "ṭāʾir", meaning: "bird" },
  { letter: "ظ", name: "ظَاء", sound: "ẓ", forms: ["ظ", "ظـ", "ـظـ", "ـظ"], example: "ظَرْف", romanized: "ẓarf", meaning: "envelope" },
  { letter: "ع", name: "عَيْن", sound: "ʿ", forms: ["ع", "عـ", "ـعـ", "ـع"], example: "عَيْن", romanized: "ʿayn", meaning: "eye" },
  { letter: "غ", name: "غَيْن", sound: "gh", forms: ["غ", "غـ", "ـغـ", "ـغ"], example: "غَزَال", romanized: "ghazāl", meaning: "gazelle" },
  { letter: "ف", name: "فَاء", sound: "f", forms: ["ف", "فـ", "ـفـ", "ـف"], example: "فِيل", romanized: "fīl", meaning: "elephant" },
  { letter: "ق", name: "قَاف", sound: "q", forms: ["ق", "قـ", "ـقـ", "ـق"], example: "قَمَر", romanized: "qamar", meaning: "moon" },
  { letter: "ك", name: "كَاف", sound: "k", forms: ["ك", "كـ", "ـكـ", "ـك"], example: "كِتَاب", romanized: "kitāb", meaning: "book" },
  { letter: "ل", name: "لَام", sound: "l", forms: ["ل", "لـ", "ـلـ", "ـل"], example: "لَيْمُون", romanized: "laymūn", meaning: "lemon" },
  { letter: "م", name: "مِيم", sound: "m", forms: ["م", "مـ", "ـمـ", "ـم"], example: "مَاء", romanized: "māʾ", meaning: "water" },
  { letter: "ن", name: "نُون", sound: "n", forms: ["ن", "نـ", "ـنـ", "ـن"], example: "نَجْم", romanized: "najm", meaning: "star" },
  { letter: "ه", name: "هَاء", sound: "h", forms: ["ه", "هـ", "ـهـ", "ـه"], example: "هِلَال", romanized: "hilāl", meaning: "crescent" },
  { letter: "و", name: "وَاو", sound: "w / ū", forms: ["و", "و", "ـو", "ـو"], example: "وَرْدَة", romanized: "wardah", meaning: "rose" },
  { letter: "ي", name: "يَاء", sound: "y / ī", forms: ["ي", "يـ", "ـيـ", "ـي"], example: "يَد", romanized: "yad", meaning: "hand" },
];

const POSITION_LABELS = ["Isolated", "Initial", "Medial", "Final"];

const LESSONS = [
  {
    category: "Foundations",
    title: "Nominal sentences",
    arTitle: "الْجُمْلَةُ الِاسْمِيَّةُ",
    description: "Introduce a person or thing with a sentence that begins with a noun or pronoun.",
    pattern: "subject (مُبْتَدَأ) + information (خَبَر)",
    examples: [
      ["أَنَا طَالِبٌ.", "anā ṭālibun", "I am a student."],
      ["الْبَيْتُ كَبِيرٌ.", "al-baytu kabīrun", "The house is big."],
      ["هِيَ مُعَلِّمَةٌ.", "hiya muʿallimatun", "She is a teacher."],
    ],
    note: "Arabic normally omits “am,” “is,” and “are” in present-tense nominal sentences.",
  },
  {
    category: "Foundations",
    title: "Definite and indefinite nouns",
    arTitle: "الْمَعْرِفَةُ وَالنَّكِرَةُ",
    description: "Use الـ for “the,” and recognize nunation as a common sign of an indefinite noun.",
    pattern: "الـ + noun = the noun · noun + ـٌ = a noun",
    examples: [
      ["كِتَابٌ", "kitābun", "a book"],
      ["الْكِتَابُ", "al-kitābu", "the book"],
      ["هٰذَا بَيْتٌ جَدِيدٌ.", "hādhā baytun jadīdun", "This is a new house."],
    ],
    note: "The lām in الـ is written every time, but its sound assimilates before a sun letter: الشَّمْسُ is pronounced ash-shamsu.",
  },
  {
    category: "Agreement",
    title: "Gender",
    arTitle: "الْمُذَكَّرُ وَالْمُؤَنَّثُ",
    description: "Match adjectives and pronouns with masculine and feminine nouns.",
    pattern: "masculine: جَدِيدٌ · feminine: جَدِيدَةٌ",
    examples: [
      ["وَلَدٌ صَغِيرٌ", "waladun ṣaghīrun", "a small boy"],
      ["بِنْتٌ صَغِيرَةٌ", "bintun ṣaghīratun", "a small girl"],
      ["السَّيَّارَةُ سَرِيعَةٌ.", "as-sayyāratu sarīʿatun", "The car is fast."],
    ],
    note: "The ending ة is a frequent marker of feminine nouns and adjectives, though there are exceptions.",
  },
  {
    category: "Agreement",
    title: "Adjective agreement",
    arTitle: "النَّعْتُ وَالْمَنْعُوتُ",
    description: "Place an adjective after its noun and match it in definiteness, gender, number, and case.",
    pattern: "noun + matching adjective",
    examples: [
      ["كِتَابٌ مُفِيدٌ", "kitābun mufīdun", "a useful book"],
      ["الْكِتَابُ الْمُفِيدُ", "al-kitābu al-mufīdu", "the useful book"],
      ["الطَّالِبَاتُ الْمُجْتَهِدَاتُ", "aṭ-ṭālibātu al-mujtahidātu", "the hardworking female students"],
    ],
    note: "If the noun is definite, its adjective is definite too. Compare كِتَابٌ جَدِيدٌ with الْكِتَابُ الْجَدِيدُ.",
  },
  {
    category: "Sentences",
    title: "Verbal sentences",
    arTitle: "الْجُمْلَةُ الْفِعْلِيَّةُ",
    description: "Describe an action with a sentence that commonly begins with the verb.",
    pattern: "verb + subject + object",
    examples: [
      ["قَرَأَ الطَّالِبُ الْكِتَابَ.", "qaraʾa aṭ-ṭālibu al-kitāba", "The student read the book."],
      ["كَتَبَتْ مَرْيَمُ رِسَالَةً.", "katabat Maryamu risālatan", "Maryam wrote a letter."],
      ["يَشْرَبُ الْوَلَدُ الْمَاءَ.", "yashrabu al-waladu al-māʾa", "The boy drinks the water."],
    ],
    note: "A verb-first sentence is especially common in formal Arabic. Subject-first order is also possible when the subject is the topic.",
  },
  {
    category: "Nouns",
    title: "Singular, dual, and plural",
    arTitle: "الْمُفْرَدُ وَالْمُثَنَّى وَالْجَمْعُ",
    description: "Talk about one, two, or more than two with Arabic’s three number forms.",
    pattern: "one مُعَلِّم · two مُعَلِّمَان · many مُعَلِّمُون",
    examples: [
      ["طَالِبٌ وَاحِدٌ", "ṭālibun wāḥidun", "one male student"],
      ["طَالِبَانِ", "ṭālibāni", "two male students"],
      ["طُلَّابٌ كَثِيرُونَ", "ṭullābun kathīrūna", "many male students"],
    ],
    note: "Arabic has sound plurals and broken plurals. Learn each broken plural, such as كِتَاب ← كُتُب, with its singular.",
  },
  {
    category: "Nouns",
    title: "Possession with iḍāfa",
    arTitle: "الْإِضَافَةُ",
    description: "Join two nouns to express ownership or a close relationship between them.",
    pattern: "possessed noun + owner",
    examples: [
      ["كِتَابُ الطَّالِبِ", "kitābu aṭ-ṭālibi", "the student’s book"],
      ["بَابُ الْبَيْتِ", "bābu al-bayti", "the door of the house"],
      ["مُدِيرَةُ الْمَدْرَسَةِ", "mudīratu al-madrasati", "the school’s principal"],
    ],
    note: "The first noun does not take الـ or nunation. The second noun is genitive and determines whether the whole phrase is definite.",
  },
  {
    category: "Pronouns",
    title: "Attached pronouns",
    arTitle: "الضَّمَائِرُ الْمُتَّصِلَةُ",
    description: "Attach short pronouns to nouns and prepositions to mean my, your, his, her, and more.",
    pattern: "noun + suffix: كِتَابِي · كِتَابُكَ · كِتَابُهَا",
    examples: [
      ["هٰذَا كِتَابِي.", "hādhā kitābī", "This is my book."],
      ["مَا اسْمُكَ؟", "mā ismuka?", "What is your name? (to a man)"],
      ["بَيْتُهَا قَرِيبٌ.", "baytuhā qarībun", "Her house is near."],
    ],
    note: "The suffix ـك changes pronunciation by gender: ـكَ (your, masculine) and ـكِ (your, feminine).",
  },
  {
    category: "Verbs",
    title: "The present tense",
    arTitle: "الْفِعْلُ الْمُضَارِعُ",
    description: "Use prefixes and endings to show who performs a present or ongoing action.",
    pattern: "أَكْتُبُ · تَكْتُبُ · يَكْتُبُ · نَكْتُبُ",
    examples: [
      ["أَنَا أَدْرُسُ الْعَرَبِيَّةَ.", "anā adrusu al-ʿarabiyyata", "I study Arabic."],
      ["هُوَ يَعْمَلُ فِي الْمَدِينَةِ.", "huwa yaʿmalu fī al-madīnati", "He works in the city."],
      ["نَحْنُ نَذْهَبُ الْآنَ.", "naḥnu nadhhabu al-āna", "We are going now."],
    ],
    note: "The present-tense prefix points to the subject: أ for I, ن for we, ي often for he, and ت for you or she.",
  },
  {
    category: "Verbs",
    title: "The past tense",
    arTitle: "الْفِعْلُ الْمَاضِي",
    description: "Add endings to a stable verb stem to identify who completed an action.",
    pattern: "كَتَبْتُ · كَتَبْتَ · كَتَبَ · كَتَبَتْ",
    examples: [
      ["كَتَبْتُ الدَّرْسَ.", "katabtu ad-darsa", "I wrote the lesson."],
      ["ذَهَبَ إِلَى السُّوقِ.", "dhahaba ilā as-sūqi", "He went to the market."],
      ["وَصَلَتْ سَلْمَى مُبَكِّرًا.", "waṣalat Salmā mubakkiran", "Salma arrived early."],
    ],
    note: "Past-tense endings carry the subject, so the independent pronoun is often unnecessary unless you want emphasis.",
  },
  {
    category: "Sentences",
    title: "Negation",
    arTitle: "النَّفْيُ",
    description: "Choose a negative particle that matches the kind and time of the sentence.",
    pattern: "لَا + present · مَا + past · لَيْسَ + nominal",
    examples: [
      ["لَا أَفْهَمُ.", "lā afhamu", "I do not understand."],
      ["مَا ذَهَبْتُ إِلَى الْعَمَلِ.", "mā dhahabtu ilā al-ʿamali", "I did not go to work."],
      ["الطَّقْسُ لَيْسَ بَارِدًا.", "aṭ-ṭaqsu laysa bāridan", "The weather is not cold."],
    ],
    note: "لَا commonly negates the present. لَمْ also negates a past event, but it takes the jussive form of the present verb.",
  },
  {
    category: "Conversation",
    title: "Asking questions",
    arTitle: "أَدَوَاتُ الِاسْتِفْهَامِ",
    description: "Ask yes-or-no and information questions with common question particles.",
    pattern: "هَلْ · مَنْ · مَا/مَاذَا · أَيْنَ · مَتَى · لِمَاذَا · كَيْفَ",
    examples: [
      ["هَلْ تَتَكَلَّمُ الْعَرَبِيَّةَ؟", "hal tatakallamu al-ʿarabiyyata?", "Do you speak Arabic?"],
      ["أَيْنَ تَسْكُنُ؟", "ayna taskunu?", "Where do you live?"],
      ["مَاذَا تُرِيدُ؟", "mādhā turīdu?", "What do you want?"],
    ],
    note: "هَلْ introduces a neutral yes-or-no question. Information words usually appear near the beginning of the sentence.",
  },
];

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function buildGameQuestions() {
  const examples = LESSONS.flatMap((lesson) => lesson.examples.map(([arabic, romanized, meaning]) => ({
    arabic,
    romanized,
    meaning,
    lesson: lesson.title,
  })));

  return shuffle(examples).slice(0, 10).map((example) => {
    const distractors = shuffle(examples.filter((item) => item.meaning !== example.meaning)).slice(0, 3);
    return { ...example, answer: example.meaning, choices: shuffle([example.meaning, ...distractors.map((item) => item.meaning)]) };
  });
}

function buildAlphabetGameQuestions(type = "names") {
  return shuffle(ARABIC_ALPHABET).map((letter, index) => {
    const distractors = shuffle(ARABIC_ALPHABET.filter((item) => item.name !== letter.name)).slice(0, 3);
    const formIndex = index % POSITION_LABELS.length;
    return {
      ...letter,
      answer: letter.name,
      choices: shuffle([letter.name, ...distractors.map((item) => item.name)]),
      displayForm: type === "positions" ? letter.forms[formIndex] : letter.letter,
      position: POSITION_LABELS[formIndex],
    };
  });
}

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const lesson = Math.max(0, Math.min(Number(saved.lesson) || 0, LESSONS.length - 1));
    const completed = Array.isArray(saved.completed)
      ? [...new Set(saved.completed.filter((index) => Number.isInteger(index) && index >= 0 && index < LESSONS.length))]
      : [];
    return { lesson, completed };
  } catch {
    return { lesson: 0, completed: [] };
  }
}

function readLearnedLetters() {
  try {
    const saved = JSON.parse(localStorage.getItem(ALPHABET_STORAGE_KEY) || "[]");
    const validLetters = new Set(ARABIC_ALPHABET.map((item) => item.letter));
    return Array.isArray(saved) ? [...new Set(saved.filter((letter) => validLetters.has(letter)))] : [];
  } catch {
    return [];
  }
}

function speakSystemArabic(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const arabicVoice = window.speechSynthesis.getVoices().find((voice) => /^ar/i.test(voice.lang));
  utterance.lang = arabicVoice?.lang || "ar-SA";
  utterance.rate = 0.78;
  if (arabicVoice) utterance.voice = arabicVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function speakGoogleArabic(text) {
  const audioUrl = URL.createObjectURL(await getGoogleTtsAudio(text, "ar-XA"));
  const audio = new Audio(audioUrl);
  const release = () => URL.revokeObjectURL(audioUrl);
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  await audio.play();
}

export default function ArabicGrammar() {
  const saved = useMemo(readProgress, []);
  const [section, setSection] = useState(() => {
    const storedSection = localStorage.getItem(SECTION_STORAGE_KEY);
    return VALID_SECTIONS.includes(storedSection) ? storedSection : "grammar";
  });
  const [lessonIndex, setLessonIndex] = useState(saved.lesson);
  const [completed, setCompleted] = useState(saved.completed);
  const [learnedLetters, setLearnedLetters] = useState(readLearnedLetters);
  const [positionFilter, setPositionFilter] = useState("all");
  const [voiceMode, setVoiceMode] = useState(() => localStorage.getItem("arabic-grammar-voice") || "system");
  const [gameMode, setGameMode] = useState("grammar");
  const [alphabetGameType, setAlphabetGameType] = useState("names");
  const [gameQuestions, setGameQuestions] = useState(buildGameQuestions);
  const [gameIndex, setGameIndex] = useState(0);
  const [gameAnswer, setGameAnswer] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameStreak, setGameStreak] = useState(0);
  const [gameBestStreak, setGameBestStreak] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const lesson = LESSONS[lessonIndex];
  const gameQuestion = gameQuestions[gameIndex];
  const progress = Math.round((completed.length / LESSONS.length) * 100);
  const visiblePositionLetters = ARABIC_ALPHABET.filter((item) => {
    if (positionFilter === "connecting") return !NON_CONNECTING_LETTERS.has(item.letter);
    if (positionFilter === "non-connecting") return NON_CONNECTING_LETTERS.has(item.letter);
    return true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lesson: lessonIndex, completed }));
  }, [completed, lessonIndex]);

  useEffect(() => {
    localStorage.setItem(SECTION_STORAGE_KEY, section);
    window.speechSynthesis?.cancel();
  }, [section]);

  useEffect(() => {
    localStorage.setItem(ALPHABET_STORAGE_KEY, JSON.stringify(learnedLetters));
  }, [learnedLetters]);

  useEffect(() => {
    localStorage.setItem("arabic-grammar-voice", voiceMode);
    window.speechSynthesis?.cancel();
  }, [voiceMode]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = (text) => {
    if (voiceMode === "google") {
      speakGoogleArabic(text).catch(() => speakSystemArabic(text));
      return;
    }
    speakSystemArabic(text);
  };

  const goToLesson = (index) => {
    window.speechSynthesis?.cancel();
    setLessonIndex(index);
  };

  const completeAndContinue = () => {
    setCompleted((current) => current.includes(lessonIndex) ? current : [...current, lessonIndex]);
    if (lessonIndex < LESSONS.length - 1) {
      goToLesson(lessonIndex + 1);
    } else if (completed.includes(lessonIndex)) {
      goToLesson(0);
    }
  };

  const toggleLetter = (letter) => {
    setLearnedLetters((current) => current.includes(letter)
      ? current.filter((item) => item !== letter)
      : [...current, letter]);
  };

  const answerGameQuestion = (answer) => {
    if (gameAnswer) return;
    const correct = answer === gameQuestion.answer;
    setGameAnswer(answer);
    if (correct) {
      setGameScore((current) => current + 1);
      setGameStreak((current) => {
        const next = current + 1;
        setGameBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setGameStreak(0);
    }
  };

  const advanceGame = () => {
    if (gameIndex === gameQuestions.length - 1) {
      setGameComplete(true);
      return;
    }
    setGameIndex((current) => current + 1);
    setGameAnswer(null);
  };

  const resetGame = (mode = gameMode, alphabetType = alphabetGameType) => {
    setGameQuestions(mode === "alphabet" ? buildAlphabetGameQuestions(alphabetType) : buildGameQuestions());
    setGameIndex(0);
    setGameAnswer(null);
    setGameScore(0);
    setGameStreak(0);
    setGameBestStreak(0);
    setGameComplete(false);
  };

  const changeGameMode = (mode) => {
    setGameMode(mode);
    resetGame(mode, alphabetGameType);
  };

  const changeAlphabetGameType = (type) => {
    setAlphabetGameType(type);
    resetGame("alphabet", type);
  };

  return (
    <div className="agr-page">
      <div className="agr-shell">
        <section className="agr-hero">
          <div>
            <span className="agr-kicker">النَّحْوُ الْعَرَبِيُّ · ARABIC GRAMMAR</span>
            <h1>Build sentences<br /><span lang="ar" dir="rtl">كَلِمَةً كَلِمَةً</span>.</h1>
            <p>Learn the patterns behind clear Modern Standard Arabic through focused lessons, fully vocalized examples, and natural audio.</p>
            <button type="button" className="agr-primary" onClick={() => { setSection("grammar"); goToLesson(completed.length < LESSONS.length ? completed.length : 0); }}>
              Continue learning <FaArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="agr-hero-art" aria-hidden="true">
            <span className="agr-orbit agr-orbit-one">فِعْل</span>
            <span className="agr-orbit agr-orbit-two">اِسْم</span>
            <div className="agr-hero-glyph">نَحْو</div>
            <small>grammar · naḥw</small>
          </div>
        </section>

        <section className="agr-progress-card" aria-label={`${completed.length} of ${LESSONS.length} lessons complete`}>
          <div>
            <span>Your Arabic grammar journey</span>
            <strong>{completed.length} of {LESSONS.length} lessons complete</strong>
          </div>
          <div className="agr-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax={LESSONS.length} aria-valuenow={completed.length}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <b>{progress}%</b>
        </section>

        <section className="agr-toolbar">
          <div className="agr-toolbar-title">
            <span><FaVolumeHigh aria-hidden="true" /></span>
            <div><strong>Reading voice</strong><small>Hear every Arabic example aloud.</small></div>
          </div>
          <div className="agr-voice-toggle">
            <button type="button" className={voiceMode === "system" ? "active" : ""} aria-pressed={voiceMode === "system"} onClick={() => setVoiceMode("system")}><FaVolumeHigh aria-hidden="true" /> System</button>
            <button type="button" className={voiceMode === "google" ? "active" : ""} aria-pressed={voiceMode === "google"} onClick={() => setVoiceMode("google")}><FcGoogle aria-hidden="true" /> Google</button>
          </div>
        </section>

        <nav className="agr-section-picker" aria-label="Arabic learning sections">
          <button type="button" className={section === "alphabet" ? "active" : ""} aria-current={section === "alphabet" ? "page" : undefined} onClick={() => setSection("alphabet")}>
            <FaFont aria-hidden="true" /><span><small>START HERE</small>Alphabet · الْحُرُوف</span>
          </button>
          <button type="button" className={section === "positions" ? "active" : ""} aria-current={section === "positions" ? "page" : undefined} onClick={() => setSection("positions")}>
            <FaLayerGroup aria-hidden="true" /><span><small>CONNECT LETTERS</small>Letter positions · أَشْكَالُ الْحُرُوف</span>
          </button>
          <button type="button" className={section === "grammar" ? "active" : ""} aria-current={section === "grammar" ? "page" : undefined} onClick={() => setSection("grammar")}>
            <FaBookOpen aria-hidden="true" /><span><small>BUILD SENTENCES</small>Grammar · النَّحْو</span>
          </button>
          <button type="button" className={section === "game" ? "active" : ""} aria-current={section === "game" ? "page" : undefined} onClick={() => setSection("game")}>
            <FaGamepad aria-hidden="true" /><span><small>TEST YOURSELF</small>Grammar game · لُعْبَة</span>
          </button>
        </nav>

        {section === "alphabet" && <main className="agr-content">
          <header className="agr-heading agr-alphabet-heading">
            <div>
              <span className="agr-kicker"><FaFont aria-hidden="true" /> الْحُرُوفُ الْعَرَبِيَّةُ · ARABIC ALPHABET</span>
              <h2>Meet the 28 Arabic letters</h2>
              <p>Arabic reads from right to left. Select a letter to mark it learned, and use the speaker to hear its example word.</p>
            </div>
            <div className="agr-alphabet-count"><strong>{learnedLetters.length}</strong><span>of 28 learned</span></div>
          </header>
          <div className="agr-alphabet-progress" role="progressbar" aria-label="Arabic letters learned" aria-valuemin="0" aria-valuemax={ARABIC_ALPHABET.length} aria-valuenow={learnedLetters.length}>
            <span style={{ width: `${Math.round((learnedLetters.length / ARABIC_ALPHABET.length) * 100)}%` }} />
          </div>
          <div className="agr-alphabet-grid">
            {ARABIC_ALPHABET.map((item, index) => {
              const learned = learnedLetters.includes(item.letter);
              return <article className={`agr-letter-card ${learned ? "learned" : ""}`} key={item.letter}>
                <div className="agr-letter-card-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <button type="button" className="agr-audio" onClick={() => speak(item.example)} aria-label={`Hear ${item.example}`}><FaVolumeHigh aria-hidden="true" /></button>
                </div>
                <button type="button" className="agr-letter-main" onClick={() => speak(item.name)} aria-label={`Hear the letter ${item.name}`}>
                  <strong lang="ar" dir="rtl">{item.letter}</strong>
                  <b lang="ar" dir="rtl">{item.name}</b>
                  <small>{item.sound}</small>
                </button>
                <div className="agr-letter-forms" lang="ar" dir="rtl"><span>Letter forms</span><strong>{item.forms.join(" · ")}</strong></div>
                <div className="agr-letter-example">
                  <strong lang="ar" dir="rtl">{item.example}</strong>
                  <span>{item.romanized} · {item.meaning}</span>
                </div>
                <button type="button" className="agr-learn-button" onClick={() => toggleLetter(item.letter)}>
                  {learned ? <><FaCheck aria-hidden="true" /> Learned</> : "Mark as learned"}
                </button>
              </article>;
            })}
          </div>
          <aside className="agr-note agr-alphabet-note"><span><FaLightbulb aria-hidden="true" /> Reading tip</span><p>Most Arabic letters connect to the letter before and after them. ا، د، ذ، ر، ز، and و connect only to the letter before them, so they create a visual break inside a word.</p></aside>
        </main>}

        {section === "positions" && <main className="agr-content">
          <header className="agr-heading">
            <div>
              <span className="agr-kicker"><FaLayerGroup aria-hidden="true" /> أَشْكَالُ الْحُرُوف · LETTER POSITIONS</span>
              <h2>See every letter in context</h2>
              <p>Arabic letters change shape according to their place in a word. Compare each letter when it stands alone or appears at the beginning, middle, or end.</p>
            </div>
          </header>
          <div className="agr-position-key" aria-label="Letter position explanation">
            <div><strong>Isolated</strong><span>stands alone</span></div>
            <div><strong>Initial</strong><span>starts a word</span></div>
            <div><strong>Medial</strong><span>sits in the middle</span></div>
            <div><strong>Final</strong><span>ends a word</span></div>
          </div>
          <div className="agr-position-toolbar">
            <div>
              <strong>Filter letters</strong>
              <span>{visiblePositionLetters.length} shown</span>
            </div>
            <div className="agr-filter-buttons" aria-label="Filter letter positions">
              <button type="button" className={positionFilter === "all" ? "active" : ""} aria-pressed={positionFilter === "all"} onClick={() => setPositionFilter("all")}>All 28</button>
              <button type="button" className={positionFilter === "connecting" ? "active" : ""} aria-pressed={positionFilter === "connecting"} onClick={() => setPositionFilter("connecting")}>Connecting</button>
              <button type="button" className={positionFilter === "non-connecting" ? "active" : ""} aria-pressed={positionFilter === "non-connecting"} onClick={() => setPositionFilter("non-connecting")}>6 non-connecting</button>
            </div>
          </div>
          <div className="agr-positions-list">
            {visiblePositionLetters.map((item) => {
              const index = ARABIC_ALPHABET.findIndex((letter) => letter.letter === item.letter);
              const learned = learnedLetters.includes(item.letter);
              return <article className={`agr-position-row ${learned ? "learned" : ""}`} key={item.letter}>
                <div className="agr-position-letter">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => speak(item.name)} aria-label={`Hear the letter ${item.name}`}>
                    <strong lang="ar" dir="rtl">{item.name}</strong>
                    <small>{item.sound}</small>
                  </button>
                  <button type="button" className="agr-position-learn" aria-pressed={learned} onClick={() => toggleLetter(item.letter)}>
                    {learned ? <><FaCheck aria-hidden="true" /> Learned</> : "Mark learned"}
                  </button>
                </div>
                <div className="agr-position-forms">
                  {item.forms.map((form, formIndex) => (
                    <div key={POSITION_LABELS[formIndex]}>
                      <span>{POSITION_LABELS[formIndex]}</span>
                      <strong lang="ar" dir="rtl">{form}</strong>
                    </div>
                  ))}
                </div>
              </article>;
            })}
          </div>
          <aside className="agr-note agr-alphabet-note"><span><FaLightbulb aria-hidden="true" /> Connection rule</span><p>Every letter has a positional form, but ا، د، ذ، ر، ز، and و cannot connect to the letter that follows them. Their isolated and initial forms therefore match, as do their medial and final forms.</p></aside>
        </main>}

        {section === "grammar" && <main className="agr-content">
          <header className="agr-heading">
            <div>
              <span className="agr-kicker"><FaBookOpen aria-hidden="true" /> GUIDED GRAMMAR PATH</span>
              <h2>Build Arabic that sounds natural</h2>
              <p>Start with noun phrases, then move through agreement, possession, verbs, negation, and everyday questions.</p>
            </div>
            <label>Choose lesson
              <select value={lessonIndex} onChange={(event) => goToLesson(Number(event.target.value))}>
                {LESSONS.map((item, index) => <option key={item.title} value={index}>{index + 1}. {item.title}</option>)}
              </select>
            </label>
          </header>

          <nav className="agr-lesson-strip" aria-label={`Grammar lesson ${lessonIndex + 1} of ${LESSONS.length}`}>
            {LESSONS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={`${index === lessonIndex ? "active" : ""} ${completed.includes(index) ? "complete" : ""}`}
                onClick={() => goToLesson(index)}
                aria-label={`Open lesson ${index + 1}: ${item.title}${completed.includes(index) ? ", complete" : ""}`}
              >
                {completed.includes(index) ? <FaCheck aria-hidden="true" /> : index + 1}
              </button>
            ))}
          </nav>

          <article className="agr-lesson-card">
            <header>
              <span className="agr-kicker"><FaLayerGroup aria-hidden="true" /> {lesson.category} · LESSON {String(lessonIndex + 1).padStart(2, "0")}</span>
              <h3>{lesson.title}</h3>
              <strong lang="ar" dir="rtl">{lesson.arTitle}</strong>
              <p>{lesson.description}</p>
            </header>
            <div className="agr-pattern"><span>Grammar pattern</span><strong>{lesson.pattern}</strong></div>
            <div className="agr-examples">
              {lesson.examples.map(([arabic, romanized, meaning], index) => (
                <div key={arabic}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <button type="button" className="agr-example-copy" onClick={() => speak(arabic)}>
                    <strong lang="ar" dir="rtl">{arabic}</strong>
                    <small>{romanized}</small>
                  </button>
                  <p>{meaning}</p>
                  <button type="button" className="agr-audio" onClick={() => speak(arabic)} aria-label={`Hear ${arabic}`}><FaVolumeHigh aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            <aside className="agr-note"><span><FaLightbulb aria-hidden="true" /> Grammar note</span><p>{lesson.note}</p></aside>
            <footer>
              <button type="button" disabled={lessonIndex === 0} onClick={() => goToLesson(lessonIndex - 1)}><FaArrowLeft /> Previous</button>
              <button type="button" className="agr-primary" onClick={completeAndContinue}>
                {lessonIndex === LESSONS.length - 1
                  ? (completed.includes(lessonIndex) ? "Review from beginning" : "Complete course")
                  : (completed.includes(lessonIndex) ? "Next lesson" : "Complete & continue")} <FaArrowRight aria-hidden="true" />
              </button>
            </footer>
          </article>
        </main>}

        {section === "game" && <main className="agr-content agr-game-content">
          <header className="agr-heading">
            <div>
              <span className="agr-kicker"><FaGamepad aria-hidden="true" /> {gameMode === "alphabet" ? "لُعْبَةُ الْحُرُوف · ALPHABET CHALLENGE" : "لُعْبَةُ النَّحْو · GRAMMAR CHALLENGE"}</span>
              <h2>{gameMode === "alphabet" ? (alphabetGameType === "positions" ? "Recognize connected letter forms" : "Name every Arabic letter") : "Choose the right meaning"}</h2>
              <p>{gameMode === "alphabet" ? (alphabetGameType === "positions" ? "Work through all 28 letters shown in randomized isolated, initial, medial, and final forms." : "Work through all 28 Arabic letters, listen when you need a hint, and choose each correct name.") : "Read or listen to each Arabic example, then select its English meaning. Each round draws from the guided grammar lessons."}</p>
            </div>
          </header>

          <div className="agr-game-mode" aria-label="Choose a game">
            <button type="button" className={gameMode === "alphabet" ? "active" : ""} aria-pressed={gameMode === "alphabet"} onClick={() => changeGameMode("alphabet")}>
              <FaFont aria-hidden="true" /><span><small>LETTERS & SOUNDS</small>Alphabet Challenge</span>
            </button>
            <button type="button" className={gameMode === "grammar" ? "active" : ""} aria-pressed={gameMode === "grammar"} onClick={() => changeGameMode("grammar")}>
              <FaBookOpen aria-hidden="true" /><span><small>SENTENCE MEANINGS</small>Grammar Challenge</span>
            </button>
          </div>

          {gameMode === "alphabet" && <div className="agr-alphabet-game-type" aria-label="Choose an alphabet challenge">
            <button type="button" className={alphabetGameType === "names" ? "active" : ""} aria-pressed={alphabetGameType === "names"} onClick={() => changeAlphabetGameType("names")}>
              Letter names <small>28 questions</small>
            </button>
            <button type="button" className={alphabetGameType === "positions" ? "active" : ""} aria-pressed={alphabetGameType === "positions"} onClick={() => changeAlphabetGameType("positions")}>
              Position forms <small>28 questions</small>
            </button>
          </div>}

          {!gameComplete ? <article className="agr-game-card">
            <div className="agr-game-stats">
              <div><span>Question</span><strong>{gameIndex + 1}/{gameQuestions.length}</strong></div>
              <div><span>Score</span><strong>{gameScore}</strong></div>
              <div><span>Streak</span><strong>{gameStreak}</strong></div>
            </div>
            <div className="agr-game-progress" role="progressbar" aria-label="Game progress" aria-valuemin="0" aria-valuemax={gameQuestions.length} aria-valuenow={gameIndex + 1}>
              <span style={{ width: `${((gameIndex + 1) / gameQuestions.length) * 100}%` }} />
            </div>
            <div className="agr-game-prompt">
              <span>{gameMode === "alphabet" ? (alphabetGameType === "positions" ? `${gameQuestion.position} form · Which letter is this?` : "Which letter is this?") : gameQuestion.lesson}</span>
              <button type="button" onClick={() => speak(gameMode === "alphabet" ? gameQuestion.example : gameQuestion.arabic)} aria-label={gameMode === "alphabet" ? `Hear example word ${gameQuestion.example}` : `Hear ${gameQuestion.arabic}`}>
                <strong className={gameMode === "alphabet" ? "agr-game-letter" : ""} lang="ar" dir="rtl">{gameMode === "alphabet" ? gameQuestion.displayForm : gameQuestion.arabic}</strong>
                <small>{gameMode === "alphabet" ? `Sound: ${gameQuestion.sound}` : gameQuestion.romanized}</small>
                <FaVolumeHigh aria-hidden="true" />
              </button>
            </div>
            <div className="agr-game-choices">
              {gameQuestion.choices.map((choice, index) => {
                const correct = choice === gameQuestion.answer;
                const selected = choice === gameAnswer;
                const state = gameAnswer ? (correct ? "correct" : (selected ? "incorrect" : "")) : "";
                return <button
                  type="button"
                  className={state}
                  key={choice}
                  onClick={() => answerGameQuestion(choice)}
                  disabled={Boolean(gameAnswer)}
                >
                  <span>{String.fromCharCode(65 + index)}</span><b lang={gameMode === "alphabet" ? "ar" : undefined} dir={gameMode === "alphabet" ? "rtl" : undefined}>{choice}</b>
                  {gameAnswer && correct && <FaCheck aria-hidden="true" />}
                </button>;
              })}
            </div>
            <div className="agr-game-feedback" aria-live="polite">
              {gameAnswer && <>
                <div>
                  <strong>{gameAnswer === gameQuestion.answer ? "Correct — well done!" : "Not quite. Here is the answer:"}</strong>
                  <span lang={gameMode === "alphabet" ? "ar" : undefined} dir={gameMode === "alphabet" ? "rtl" : undefined}>{gameQuestion.answer}</span>
                </div>
                <button type="button" className="agr-primary" onClick={advanceGame}>
                  {gameIndex === gameQuestions.length - 1 ? "See results" : "Next question"} <FaArrowRight aria-hidden="true" />
                </button>
              </>}
            </div>
          </article> : <article className="agr-game-results">
            <div className="agr-game-trophy" aria-hidden="true"><FaGamepad /></div>
            <span>CHALLENGE COMPLETE</span>
            <h3>{gameScore} out of {gameQuestions.length}</h3>
            <p>{gameMode === "alphabet"
              ? (gameScore >= 9 ? "Excellent work — you know these Arabic letters well." : gameScore >= 7 ? "Great work. Review a few letters, then try another round." : "Good practice. Visit the alphabet section, then try again.")
              : (gameScore >= 9 ? "Excellent work — your grammar recognition is strong." : gameScore >= 7 ? "Great work. A quick lesson review can take you even higher." : "Good practice. Review the lessons, then try another round.")}</p>
            <div><span>Accuracy <strong>{Math.round((gameScore / gameQuestions.length) * 100)}%</strong></span><span>Best streak <strong>{gameBestStreak}</strong></span></div>
            <button type="button" className="agr-primary" onClick={() => resetGame()}><FaRotateRight aria-hidden="true" /> Play again</button>
          </article>}
        </main>}
      </div>
    </div>
  );
}

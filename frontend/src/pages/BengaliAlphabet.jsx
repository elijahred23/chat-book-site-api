import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";
import {
  FaArrowRight,
  FaBookOpen,
  FaCheck,
  FaGamepad,
  FaLanguage,
  FaLightbulb,
  FaPenNib,
  FaPlay,
  FaPuzzlePiece,
  FaRotateRight,
  FaStop,
  FaVolumeHigh,
} from "react-icons/fa6";
import { getGoogleTtsAudio } from "../utils/googleTtsAudioCache.js";
import { BENGALI_LEARN_SECTIONS } from "../data/bengaliLearnSections.js";
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
  { id: "grammar", label: "Grammar Lessons", icon: FaBookOpen },
  { id: "words", label: "Make Words", icon: FaPuzzlePiece },
  { id: "practice", label: "Practice", icon: FaPenNib },
  { id: "games", label: "Games", icon: FaGamepad },
  { id: "translate", label: "Translate", icon: FaLanguage },
];

const GRAMMAR_LESSONS = [
  {
    title: "Pronouns and ‘to be’",
    bnTitle: "সর্বনাম ও ‘হওয়া’",
    description: "Meet আমি, তুমি, সে, আমরা and learn why Bengali often leaves out am, is, and are.",
    pattern: "pronoun + description",
    examples: [
      ["আমি ছাত্র।", "ami chatro", "I am a student."],
      ["সে ভালো।", "she bhalo", "He or she is well."],
      ["আমরা বন্ধু।", "amra bondhu", "We are friends."],
    ],
    tip: "Bengali usually does not need a present-tense word for ‘am,’ ‘is,’ or ‘are.’",
  },
  {
    title: "Basic sentence order",
    bnTitle: "বাক্যের সাধারণ ক্রম",
    description: "Build sentences in Bengali’s usual Subject–Object–Verb order.",
    pattern: "subject + object + verb",
    examples: [
      ["আমি বই পড়ি।", "ami boi poṛi", "I read a book."],
      ["সে ভাত খায়।", "she bhat khay", "He or she eats rice."],
      ["আমরা বাংলা শিখি।", "amra bangla shikhi", "We learn Bengali."],
    ],
    tip: "The action normally comes at the end: literally, ‘I book read.’",
  },
  {
    title: "Making plurals",
    bnTitle: "বহুবচন",
    description: "Use -রা for people and -গুলো or -গুলি for things.",
    pattern: "person + রা · thing + গুলো",
    examples: [
      ["ছেলেরা খেলছে।", "chhelera khelchhe", "The boys are playing."],
      ["বইগুলো নতুন।", "boigulo notun", "The books are new."],
      ["বন্ধুরা এসেছে।", "bondhura eshechhe", "The friends have come."],
    ],
    tip: "Use -রা mainly for people; -গুলো is common for objects and animals.",
  },
  {
    title: "Using classifiers",
    bnTitle: "গণনাবাচক শব্দ",
    description: "Count naturally with জন for people and টি or টা for things.",
    pattern: "number + classifier + noun",
    examples: [
      ["এক জন মানুষ", "ek jon manush", "one person"],
      ["দুইটা বই", "duita boi", "two books"],
      ["তিনটি ফুল", "tinti phul", "three flowers"],
    ],
    tip: "A classifier normally sits between the number and the noun.",
  },
  {
    title: "Present-tense verbs",
    bnTitle: "বর্তমান কালের ক্রিয়া",
    description: "See how a verb changes with the speaker and level of respect.",
    pattern: "আমি করি · তুমি করো · সে করে",
    examples: [
      ["আমি কাজ করি।", "ami kaj kori", "I work."],
      ["তুমি কী করো?", "tumi ki koro", "What do you do?"],
      ["সে রান্না করে।", "she ranna kore", "He or she cooks."],
    ],
    tip: "Learn a verb as a family of forms rather than as one unchanging word.",
  },
  {
    title: "Negatives",
    bnTitle: "না-বোধক বাক্য",
    description: "Make a statement negative by placing না after the verb.",
    pattern: "statement + না",
    examples: [
      ["আমি জানি না।", "ami jani na", "I do not know."],
      ["সে যায় না।", "she jay na", "He or she does not go."],
      ["আমরা চা খাই না।", "amra cha khai na", "We do not drink tea."],
    ],
    tip: "In most simple sentences, না follows the verb it makes negative.",
  },
  {
    title: "Asking questions",
    bnTitle: "প্রশ্ন করা",
    description: "Ask for people, things, places, times, reasons, and methods.",
    pattern: "কে · কী · কোথায় · কখন · কেন · কীভাবে",
    examples: [
      ["তুমি কোথায় থাকো?", "tumi kothay thako", "Where do you live?"],
      ["তোমার নাম কী?", "tomar nam ki", "What is your name?"],
      ["সে কখন আসবে?", "she kokhon ashbe", "When will he or she come?"],
    ],
    tip: "Keep the question word where the missing information would normally appear.",
  },
  {
    title: "Possession",
    bnTitle: "সম্বন্ধ ও অধিকার",
    description: "Use আমার, তোমার, and তার to show who owns or relates to something.",
    pattern: "owner + noun",
    examples: [
      ["আমার বই", "amar boi", "my book"],
      ["তোমার নাম", "tomar nam", "your name"],
      ["তার বাড়ি", "tar baṛi", "his or her house"],
    ],
    tip: "The owner comes before the thing: আমার বই, literally ‘my book.’",
  },
  {
    title: "Postpositions",
    bnTitle: "অনুসর্গ",
    description: "Express place and relationships with words that follow the noun.",
    pattern: "noun + postposition",
    examples: [
      ["ঘরে", "ghore", "in the house"],
      ["ঢাকা থেকে", "dhaka theke", "from Dhaka"],
      ["বন্ধুর সঙ্গে", "bondhur shonge", "with a friend"],
    ],
    tip: "English uses prepositions before nouns; Bengali commonly places these relationships after them.",
  },
  {
    title: "Politeness levels",
    bnTitle: "সম্বোধনের স্তর",
    description: "Choose তুই, তুমি, or আপনি and match the verb to the relationship.",
    pattern: "তুই করিস · তুমি করো · আপনি করেন",
    examples: [
      ["তুই কেমন আছিস?", "tui kemon achhish", "How are you? Very familiar."],
      ["তুমি কেমন আছো?", "tumi kemon achho", "How are you? Familiar."],
      ["আপনি কেমন আছেন?", "apni kemon achhen", "How are you? Respectful."],
    ],
    tip: "আপনি is the safest choice for elders, strangers, and formal situations.",
  },
];

const SHORT_VOWEL_MARKS = [
  {
    name: "আ-কার", mark: "া", sound: "a", placement: "Written after the consonant", placementBn: "ব্যঞ্জনের পরে লেখা হয়",
    base: "ক", combined: "কা", romanized: "ka", example: "কাজ", exampleSound: "kaj", meaning: "work", position: "after",
  },
  {
    name: "ই-কার",
    mark: "ি",
    sound: "i",
    placement: "Written before the consonant",
    placementBn: "ব্যঞ্জনের আগে লেখা হয়",
    base: "ক",
    combined: "কি",
    romanized: "ki",
    example: "কিন্তু",
    exampleSound: "kintu",
    meaning: "but",
    position: "before",
  },
  {
    name: "ঈ-কার", mark: "ী", sound: "ee", placement: "Written after the consonant", placementBn: "ব্যঞ্জনের পরে লেখা হয়",
    base: "ক", combined: "কী", romanized: "kee", example: "নীল", exampleSound: "nil", meaning: "blue", position: "after",
  },
  {
    name: "উ-কার",
    mark: "ু",
    sound: "u",
    placement: "Written below the consonant",
    placementBn: "ব্যঞ্জনের নিচে লেখা হয়",
    base: "ক",
    combined: "কু",
    romanized: "ku",
    example: "কুকুর",
    exampleSound: "kukur",
    meaning: "dog",
    position: "below",
  },
  {
    name: "ঊ-কার", mark: "ূ", sound: "oo", placement: "Written below the consonant", placementBn: "ব্যঞ্জনের নিচে লেখা হয়",
    base: "ক", combined: "কূ", romanized: "koo", example: "দূর", exampleSound: "dur", meaning: "far", position: "below",
  },
  {
    name: "ঋ-কার",
    mark: "ৃ",
    sound: "ri",
    placement: "Written below the consonant",
    placementBn: "ব্যঞ্জনের নিচে লেখা হয়",
    base: "ক",
    combined: "কৃ",
    romanized: "kri",
    example: "কৃষক",
    exampleSound: "krishok",
    meaning: "farmer",
    position: "below",
  },
  {
    name: "এ-কার", mark: "ে", sound: "e", placement: "Written before the consonant", placementBn: "ব্যঞ্জনের আগে লেখা হয়",
    base: "ক", combined: "কে", romanized: "ke", example: "দেশ", exampleSound: "desh", meaning: "country", position: "before",
  },
  {
    name: "ঐ-কার", mark: "ৈ", sound: "oi", placement: "Written before the consonant", placementBn: "ব্যঞ্জনের আগে লেখা হয়",
    base: "ক", combined: "কৈ", romanized: "koi", example: "বৈঠক", exampleSound: "boithok", meaning: "meeting", position: "before",
  },
  {
    name: "ও-কার", mark: "ো", sound: "o", placement: "Written around the consonant", placementBn: "ব্যঞ্জনের দুই পাশে লেখা হয়",
    base: "ক", combined: "কো", romanized: "ko", example: "গোল", exampleSound: "gol", meaning: "round", position: "around",
  },
  {
    name: "ঔ-কার", mark: "ৌ", sound: "ou", placement: "Written around the consonant", placementBn: "ব্যঞ্জনের দুই পাশে লেখা হয়",
    base: "ক", combined: "কৌ", romanized: "kou", example: "কৌশল", exampleSound: "koushol", meaning: "skill", position: "around",
  },
];

const VOWEL_MARK_CHARACTERS = SHORT_VOWEL_MARKS.map((vowel) => ({
  bn: vowel.combined,
  sound: vowel.romanized,
  example: vowel.example,
  word: vowel.exampleSound,
  meaning: vowel.meaning,
}));

const CONJUNCT_CLUSTERS = [
  { bn: "শ্র", sound: "shrô", parts: "শ + ্ + র", example: "শ্রেণি", word: "shreni", meaning: "class" },
  { bn: "ক্ষ", sound: "kh / kkh", parts: "ক + ্ + ষ", example: "শিক্ষা", word: "shikkha", meaning: "education" },
  { bn: "জ্ঞ", sound: "gg / gy", parts: "জ + ্ + ঞ", example: "জ্ঞান", word: "ggan", meaning: "knowledge" },
  { bn: "ত্র", sound: "trô", parts: "ত + ্ + র", example: "ত্রাণ", word: "tran", meaning: "relief" },
  { bn: "ন্দ", sound: "ndô", parts: "ন + ্ + দ", example: "আনন্দ", word: "anondo", meaning: "joy" },
  { bn: "ন্ধ", sound: "ndhô", parts: "ন + ্ + ধ", example: "বন্ধু", word: "bondhu", meaning: "friend" },
  { bn: "ন্ত", sound: "ntô", parts: "ন + ্ + ত", example: "শান্ত", word: "shanto", meaning: "calm" },
  { bn: "ম্প", sound: "mpô", parts: "ম + ্ + প", example: "সম্পদ", word: "shompod", meaning: "wealth" },
  { bn: "ষ্ট", sound: "shtô", parts: "ষ + ্ + ট", example: "কষ্ট", word: "koshto", meaning: "hardship" },
  { bn: "দ্ধ", sound: "ddhô", parts: "দ + ্ + ধ", example: "শ্রদ্ধা", word: "shroddha", meaning: "respect" },
  { bn: "ক্র", sound: "krô", parts: "ক + ্ + র", example: "ক্রম", word: "krom", meaning: "order" },
  { bn: "গ্র", sound: "grô", parts: "গ + ্ + র", example: "গ্রাম", word: "gram", meaning: "village" },
  { bn: "স্ব", sound: "shwô / swô", parts: "স + ্ + ব", example: "স্বপ্ন", word: "shopno", meaning: "dream" },
  { bn: "ক্ক", sound: "kkô", parts: "ক + ্ + ক", example: "এক্কা", word: "ekka", meaning: "ace / one-horse cart" },
  { bn: "ক্ত", sound: "ktô", parts: "ক + ্ + ত", example: "শক্তি", word: "shokti", meaning: "strength" },
  { bn: "গ্ধ", sound: "gdhô", parts: "গ + ্ + ধ", example: "মুগ্ধ", word: "mugdho", meaning: "fascinated" },
  { bn: "গ্ন", sound: "gnô", parts: "গ + ্ + ন", example: "অগ্নি", word: "ogni", meaning: "fire" },
  { bn: "ঙ্ক", sound: "ngkô", parts: "ঙ + ্ + ক", example: "অঙ্ক", word: "onko", meaning: "arithmetic" },
  { bn: "ঙ্খ", sound: "ngkhô", parts: "ঙ + ্ + খ", example: "শঙ্খ", word: "shongkho", meaning: "conch shell" },
  { bn: "ঙ্গ", sound: "nggô", parts: "ঙ + ্ + গ", example: "সঙ্গ", word: "shongo", meaning: "company" },
  { bn: "ঙ্ঘ", sound: "ngghô", parts: "ঙ + ্ + ঘ", example: "সংঘ", word: "shongho", meaning: "association" },
  { bn: "চ্চ", sound: "cchô", parts: "চ + ্ + চ", example: "উচ্চ", word: "uchcho", meaning: "high" },
  { bn: "চ্ছ", sound: "chchhô", parts: "চ + ্ + ছ", example: "ইচ্ছা", word: "ichchha", meaning: "wish" },
  { bn: "জ্জ", sound: "jjô", parts: "জ + ্ + জ", example: "লজ্জা", word: "lojja", meaning: "shame" },
  { bn: "ঞ্চ", sound: "nchô", parts: "ঞ + ্ + চ", example: "অঞ্চল", word: "onchol", meaning: "region" },
  { bn: "ঞ্জ", sound: "njô", parts: "ঞ + ্ + জ", example: "অঞ্জলি", word: "onjoli", meaning: "offering" },
  { bn: "ণ্ট", sound: "ntô", parts: "ণ + ্ + ট", example: "ঘণ্টা", word: "ghonta", meaning: "bell / hour" },
  { bn: "ণ্ড", sound: "ndô", parts: "ণ + ্ + ড", example: "পণ্ডিত", word: "pondit", meaning: "scholar" },
  { bn: "ত্ত", sound: "ttô", parts: "ত + ্ + ত", example: "উত্তর", word: "uttor", meaning: "answer / north" },
  { bn: "ত্থ", sound: "tthô", parts: "ত + ্ + থ", example: "উত্থান", word: "utthan", meaning: "rise" },
  { bn: "ত্ম", sound: "tmô", parts: "ত + ্ + ম", example: "আত্মা", word: "atma", meaning: "soul" },
  { bn: "থ্য", sound: "thyô", parts: "থ + ্ + য", example: "তথ্য", word: "toththo", meaning: "information" },
  { bn: "দ্ব", sound: "dwô", parts: "দ + ্ + ব", example: "দ্বার", word: "dwar", meaning: "door" },
  { bn: "দ্ম", sound: "dmô", parts: "দ + ্ + ম", example: "পদ্ম", word: "poddo", meaning: "lotus" },
  { bn: "দ্য", sound: "dyô", parts: "দ + ্ + য", example: "বিদ্যা", word: "bidya", meaning: "knowledge" },
  { bn: "ধ্ব", sound: "dhwô", parts: "ধ + ্ + ব", example: "ধ্বনি", word: "dhoni", meaning: "sound" },
  { bn: "ন্ড", sound: "ndô", parts: "ন + ্ + ড", example: "ঠান্ডা", word: "thanda", meaning: "cold" },
  { bn: "ন্ন", sound: "nnô", parts: "ন + ্ + ন", example: "অন্ন", word: "onno", meaning: "food / rice" },
  { bn: "ন্ম", sound: "nmô", parts: "ন + ্ + ম", example: "জন্ম", word: "jonmo", meaning: "birth" },
  { bn: "প্ত", sound: "ptô", parts: "প + ্ + ত", example: "সপ্ত", word: "shopto", meaning: "seven" },
  { bn: "প্ন", sound: "pnô", parts: "প + ্ + ন", example: "স্বপ্ন", word: "shopno", meaning: "dream" },
  { bn: "প্র", sound: "prô", parts: "প + ্ + র", example: "প্রশ্ন", word: "proshno", meaning: "question" },
  { bn: "প্ল", sound: "plô", parts: "প + ্ + ল", example: "প্লাবন", word: "plabon", meaning: "flood" },
  { bn: "ব্দ", sound: "bdô", parts: "ব + ্ + দ", example: "শব্দ", word: "shobdo", meaning: "word / sound" },
  { bn: "ব্ধ", sound: "bdhô", parts: "ব + ্ + ধ", example: "লব্ধ", word: "lobdho", meaning: "obtained" },
  { bn: "ব্র", sound: "brô", parts: "ব + ্ + র", example: "ব্রত", word: "broto", meaning: "vow" },
  { bn: "ভ্র", sound: "bhrô", parts: "ভ + ্ + র", example: "ভ্রমণ", word: "bhromon", meaning: "travel" },
  { bn: "ম্ম", sound: "mmô", parts: "ম + ্ + ম", example: "সম্মান", word: "shomman", meaning: "respect" },
  { bn: "ম্ব", sound: "mbô", parts: "ম + ্ + ব", example: "লম্বা", word: "lomba", meaning: "tall" },
  { bn: "র্থ", sound: "rthô", parts: "র + ্ + থ", example: "অর্থ", word: "ortho", meaning: "meaning / money" },
  { bn: "র্ধ", sound: "rdhô", parts: "র + ্ + ধ", example: "অর্ধ", word: "ordho", meaning: "half" },
  { bn: "ল্প", sound: "lpô", parts: "ল + ্ + প", example: "গল্প", word: "golpo", meaning: "story" },
  { bn: "শ্চ", sound: "shchô", parts: "শ + ্ + চ", example: "আশ্চর্য", word: "ashchorjo", meaning: "surprise" },
  { bn: "শ্ন", sound: "shnô", parts: "শ + ্ + ন", example: "প্রশ্ন", word: "proshno", meaning: "question" },
  { bn: "শ্ব", sound: "shwô", parts: "শ + ্ + ব", example: "বিশ্ব", word: "bishsho", meaning: "world" },
  { bn: "স্ক", sound: "skô", parts: "স + ্ + ক", example: "স্কুল", word: "skul", meaning: "school" },
  { bn: "স্ত", sound: "stô", parts: "স + ্ + ত", example: "ব্যস্ত", word: "byasto", meaning: "busy" },
  { bn: "স্থ", sound: "sthô", parts: "স + ্ + থ", example: "স্থান", word: "sthan", meaning: "place" },
  { bn: "স্ন", sound: "snô", parts: "স + ্ + ন", example: "স্নেহ", word: "sneho", meaning: "affection" },
  { bn: "স্প", sound: "spô", parts: "স + ্ + প", example: "স্পষ্ট", word: "sposhto", meaning: "clear" },
  { bn: "স্ম", sound: "smô", parts: "স + ্ + ম", example: "স্মৃতি", word: "smriti", meaning: "memory" },
  { bn: "হ্ন", sound: "hnô", parts: "হ + ্ + ন", example: "চিহ্ন", word: "chihno", meaning: "mark / sign" },
  { bn: "হ্ম", sound: "hmô", parts: "হ + ্ + ম", example: "ব্রহ্ম", word: "brohmo", meaning: "Brahman" },
  { bn: "ন্ত্র", sound: "ntrô", parts: "ন + ্ + ত + ্ + র", example: "মন্ত্র", word: "montro", meaning: "mantra" },
  { bn: "ন্দ্র", sound: "ndrô", parts: "ন + ্ + দ + ্ + র", example: "চন্দ্র", word: "chondro", meaning: "moon" },
  { bn: "ম্প্র", sound: "mprô", parts: "ম + ্ + প + ্ + র", example: "সম্প্রতি", word: "shomproti", meaning: "recently" },
  { bn: "স্ত্র", sound: "strô", parts: "স + ্ + ত + ্ + র", example: "অস্ত্র", word: "ostro", meaning: "weapon" },
  { bn: "ত্ত্ব", sound: "ttwô", parts: "ত + ্ + ত + ্ + ব", example: "তত্ত্ব", word: "totto", meaning: "theory" },
  { bn: "ঙ্ক্ষ", sound: "ngkkhô", parts: "ঙ + ্ + ক + ্ + ষ", example: "আকাঙ্ক্ষা", word: "akankkha", meaning: "aspiration" },
  { bn: "ষ্ক্র", sound: "shkrô", parts: "ষ + ্ + ক + ্ + র", example: "নিষ্ক্রিয়", word: "nishkriyo", meaning: "inactive" },
  { bn: "জ্জ্ব", sound: "jjwô", parts: "জ + ্ + জ + ্ + ব", example: "উজ্জ্বল", word: "ujjol", meaning: "bright" },
];

const CONJUNCT_BEGINNER = new Set(["শ্র", "ক্ষ", "জ্ঞ", "ত্র", "ন্দ", "ন্ধ", "ন্ত", "ম্প", "ষ্ট", "দ্ধ", "ক্র", "গ্র", "স্ব", "ক্ত", "প্র"]);
const CONJUNCT_COMMON = new Set(["গ্ন", "ঙ্ক", "ঙ্খ", "ঙ্গ", "চ্চ", "চ্ছ", "জ্জ", "ঞ্চ", "ঞ্জ", "ণ্ট", "ণ্ড", "ত্ত", "ত্ম", "থ্য", "দ্ব", "দ্ম", "দ্য", "ধ্ব", "ন্ড", "ন্ন", "ন্ম", "প্ন", "ব্দ", "ব্র", "ভ্র", "ম্ম", "ম্ব", "র্থ", "ল্প", "শ্চ", "শ্ন", "শ্ব", "স্ক", "স্ত", "স্থ", "স্ন", "স্প", "স্ম"]);
const CONJUNCT_RARE = new Set(["হ্ম", "ঙ্ক্ষ", "ষ্ক্র", "জ্জ্ব"]);

function conjunctLevel(conjunct) {
  if (CONJUNCT_BEGINNER.has(conjunct)) return "beginner";
  if (CONJUNCT_COMMON.has(conjunct)) return "common";
  if (CONJUNCT_RARE.has(conjunct)) return "rare";
  return "advanced";
}

// This curriculum also powers the matching Class 1–12 Bengali Tutor lessons.
// eslint-disable-next-line react-refresh/only-export-components
export const WORD_LEVELS = [
  { classNumber: 1, focus: "Two-part everyday words", words: [
    { word: "আম", pieces: ["আ", "ম"], sound: "am", meaning: "mango", hint: "A sweet summer fruit" },
    { word: "বই", pieces: ["ব", "ই"], sound: "boi", meaning: "book", hint: "You read this" },
    { word: "ফুল", pieces: ["ফু", "ল"], sound: "phul", meaning: "flower", hint: "It blooms in a garden" },
    { word: "জল", pieces: ["জ", "ল"], sound: "jol", meaning: "water", hint: "You drink this when thirsty" },
    { word: "ফল", pieces: ["ফ", "ল"], sound: "phol", meaning: "fruit", hint: "A sweet food that grows on plants" },
    { word: "ঘর", pieces: ["ঘ", "র"], sound: "ghor", meaning: "room", hint: "A space inside a house" },
    { word: "হাত", pieces: ["হা", "ত"], sound: "hat", meaning: "hand", hint: "You hold things with it" },
    { word: "পা", pieces: ["প", "া"], sound: "pa", meaning: "foot", hint: "You stand on it" },
    { word: "চোখ", pieces: ["চো", "খ"], sound: "chokh", meaning: "eye", hint: "You see with it" },
    { word: "কান", pieces: ["কা", "ন"], sound: "kan", meaning: "ear", hint: "You hear with it" },
    { word: "নাক", pieces: ["না", "ক"], sound: "nak", meaning: "nose", hint: "You smell with it" },
    { word: "মুখ", pieces: ["মু", "খ"], sound: "mukh", meaning: "mouth", hint: "You speak and eat with it" },
    { word: "লাল", pieces: ["লা", "ল"], sound: "lal", meaning: "red", hint: "The color of a ripe tomato" },
    { word: "নীল", pieces: ["নী", "ল"], sound: "nil", meaning: "blue", hint: "The color of a clear sky" },
    { word: "সাদা", pieces: ["সা", "দা"], sound: "shada", meaning: "white", hint: "The color of fresh snow" },
    { word: "কালো", pieces: ["কা", "লো"], sound: "kalo", meaning: "black", hint: "The darkest color" },
    { word: "এক", pieces: ["এ", "ক"], sound: "ek", meaning: "one", hint: "The first counting number" },
    { word: "দুই", pieces: ["দু", "ই"], sound: "dui", meaning: "two", hint: "One plus one" },
    { word: "তিন", pieces: ["তি", "ন"], sound: "tin", meaning: "three", hint: "The number after two" },
    { word: "চার", pieces: ["চা", "র"], sound: "char", meaning: "four", hint: "The number after three" },
    { word: "পাঁচ", pieces: ["পাঁ", "চ"], sound: "pach", meaning: "five", hint: "The number of fingers on one hand" },
    { word: "দিন", pieces: ["দি", "ন"], sound: "din", meaning: "day", hint: "The time when the sun is up" },
    { word: "রাত", pieces: ["রা", "ত"], sound: "rat", meaning: "night", hint: "The dark time when we sleep" },
    { word: "চাঁদ", pieces: ["চাঁ", "দ"], sound: "chad", meaning: "moon", hint: "It shines in the night sky" },
    { word: "তারা", pieces: ["তা", "রা"], sound: "tara", meaning: "star", hint: "A tiny light in the night sky" },
    { word: "গাছ", pieces: ["গা", "ছ"], sound: "gachh", meaning: "tree", hint: "A tall plant with a trunk" },
    { word: "পাতা", pieces: ["পা", "তা"], sound: "pata", meaning: "leaf", hint: "A green part of a plant" },
    { word: "দুধ", pieces: ["দু", "ধ"], sound: "dudh", meaning: "milk", hint: "A white drink" },
    { word: "ভাত", pieces: ["ভা", "ত"], sound: "bhat", meaning: "rice", hint: "A common cooked grain" },
  ] },
  { classNumber: 2, focus: "Familiar people and animals", words: [
    { word: "মা", pieces: ["ম", "া"], sound: "ma", meaning: "mother", hint: "A parent" },
    { word: "বাবা", pieces: ["বা", "বা"], sound: "baba", meaning: "father", hint: "A parent" },
    { word: "পাখি", pieces: ["পা", "খি"], sound: "pakhi", meaning: "bird", hint: "It has wings and feathers" },
    { word: "মাছ", pieces: ["মা", "ছ"], sound: "machh", meaning: "fish", hint: "It swims in water" },
    { word: "বিড়াল", pieces: ["বি", "ড়া", "ল"], sound: "biṛal", meaning: "cat", hint: "A small pet that says meow" },
    { word: "ছাগল", pieces: ["ছা", "গ", "ল"], sound: "chhagol", meaning: "goat", hint: "A farm animal with horns" },
    { word: "দাদা", pieces: ["দা", "দা"], sound: "dada", meaning: "older brother", hint: "A male sibling who is older than you" },
    { word: "দাদি", pieces: ["দা", "দি"], sound: "dadi", meaning: "paternal grandmother", hint: "Your father's mother" },
    { word: "নানা", pieces: ["না", "না"], sound: "nana", meaning: "maternal grandfather", hint: "Your mother's father" },
    { word: "নানি", pieces: ["না", "নি"], sound: "nani", meaning: "maternal grandmother", hint: "Your mother's mother" },
    { word: "ভাই", pieces: ["ভা", "ই"], sound: "bhai", meaning: "brother", hint: "A male sibling" },
    { word: "বোন", pieces: ["বো", "ন"], sound: "bon", meaning: "sister", hint: "A female sibling" },
    { word: "শিশু", pieces: ["শি", "শু"], sound: "shishu", meaning: "child", hint: "A very young person" },
    { word: "ছেলে", pieces: ["ছে", "লে"], sound: "chhele", meaning: "boy", hint: "A young male person" },
    { word: "মেয়ে", pieces: ["মে", "য়ে"], sound: "meye", meaning: "girl", hint: "A young female person" },
    { word: "বন্ধু", pieces: ["ব", "ন্ধু"], sound: "bondhu", meaning: "friend", hint: "Someone you enjoy spending time with" },
    { word: "গরু", pieces: ["গ", "রু"], sound: "goru", meaning: "cow", hint: "A farm animal that gives milk" },
    { word: "ঘোড়া", pieces: ["ঘো", "ড়া"], sound: "ghoṛa", meaning: "horse", hint: "A large animal people can ride" },
    { word: "হাঁস", pieces: ["হাঁ", "স"], sound: "hash", meaning: "duck", hint: "A bird that swims and quacks" },
    { word: "মুরগি", pieces: ["মু", "র", "গি"], sound: "murgi", meaning: "chicken", hint: "A farm bird that lays eggs" },
    { word: "বাঘ", pieces: ["বা", "ঘ"], sound: "bagh", meaning: "tiger", hint: "A large striped wild cat" },
    { word: "সিংহ", pieces: ["সিং", "হ"], sound: "shingho", meaning: "lion", hint: "A large wild cat with a mane" },
    { word: "হাতি", pieces: ["হা", "তি"], sound: "hati", meaning: "elephant", hint: "A huge animal with a trunk" },
    { word: "বানর", pieces: ["বা", "ন", "র"], sound: "banor", meaning: "monkey", hint: "An animal that climbs and swings" },
    { word: "খরগোশ", pieces: ["খ", "র", "গো", "শ"], sound: "khorgosh", meaning: "rabbit", hint: "A small animal with long ears" },
    { word: "কচ্ছপ", pieces: ["ক", "চ্ছ", "প"], sound: "kochchhop", meaning: "turtle", hint: "A slow animal with a hard shell" },
    { word: "সাপ", pieces: ["সা", "প"], sound: "shap", meaning: "snake", hint: "A long animal with no legs" },
    { word: "ব্যাঙ", pieces: ["ব্যা", "ঙ"], sound: "byang", meaning: "frog", hint: "A small animal that jumps near water" },
    { word: "মৌমাছি", pieces: ["মৌ", "মা", "ছি"], sound: "moumachi", meaning: "bee", hint: "A small insect that makes honey" },
    { word: "প্রজাপতি", pieces: ["প্র", "জা", "প", "তি"], sound: "projapoti", meaning: "butterfly", hint: "A colorful insect with wide wings" },
  ] },
  { classNumber: 3, focus: "Three-part school words", words: [
    { word: "কলম", pieces: ["ক", "ল", "ম"], sound: "kolom", meaning: "pen", hint: "You write with this" },
    { word: "খাতা", pieces: ["খা", "তা"], sound: "khata", meaning: "notebook", hint: "You write lessons in it" },
    { word: "বিদ্যালয়", pieces: ["বি", "দ্যা", "লয়"], sound: "bidyaloy", meaning: "school", hint: "A place where students learn" },
    { word: "শিক্ষক", pieces: ["শি", "ক্ষ", "ক"], sound: "shikkhok", meaning: "teacher", hint: "A person who helps students learn" },
    { word: "পেন্সিল", pieces: ["পে", "ন্সি", "ল"], sound: "pensil", meaning: "pencil", hint: "You can write and erase with this" },
    { word: "শ্রেণি", pieces: ["শ্রে", "ণি"], sound: "shreni", meaning: "class", hint: "A group of students learning together" },
    { word: "ব্যাগ", pieces: ["ব্যা", "গ"], sound: "byag", meaning: "bag", hint: "You carry school supplies in it" },
    { word: "ডেস্ক", pieces: ["ডে", "স্ক"], sound: "desk", meaning: "desk", hint: "A table used for schoolwork" },
    { word: "বেঞ্চ", pieces: ["বে", "ঞ্চ"], sound: "bench", meaning: "bench", hint: "A long seat for several students" },
    { word: "বোর্ড", pieces: ["বো", "র্ড"], sound: "bord", meaning: "board", hint: "The teacher writes on it" },
    { word: "চক", pieces: ["চ", "ক"], sound: "chok", meaning: "chalk", hint: "A small stick used to write on a board" },
    { word: "রাবার", pieces: ["রা", "বা", "র"], sound: "rabar", meaning: "eraser", hint: "It removes pencil marks" },
    { word: "স্কেল", pieces: ["স্কে", "ল"], sound: "skel", meaning: "ruler", hint: "It measures length and draws straight lines" },
    { word: "কাগজ", pieces: ["কা", "গ", "জ"], sound: "kagoj", meaning: "paper", hint: "You write or draw on it" },
    { word: "মানচিত্র", pieces: ["মা", "ন", "চি", "ত্র"], sound: "manchitro", meaning: "map", hint: "It shows where places are" },
    { word: "ঘণ্টা", pieces: ["ঘ", "ণ্টা"], sound: "ghonta", meaning: "bell", hint: "It rings when a class begins or ends" },
    { word: "পাঠ", pieces: ["পা", "ঠ"], sound: "path", meaning: "lesson", hint: "Something a teacher helps you learn" },
    { word: "পড়া", pieces: ["প", "ড়া"], sound: "poṛa", meaning: "reading", hint: "Looking at words and understanding them" },
    { word: "লেখা", pieces: ["লে", "খা"], sound: "lekha", meaning: "writing", hint: "Making words with a pen or pencil" },
    { word: "অঙ্ক", pieces: ["অ", "ঙ্ক"], sound: "onko", meaning: "arithmetic", hint: "Working with numbers" },
    { word: "ছবি", pieces: ["ছ", "বি"], sound: "chhobi", meaning: "picture", hint: "An image you can draw or view" },
    { word: "রং", pieces: ["র", "ং"], sound: "rong", meaning: "color", hint: "Red, blue, and green are examples" },
    { word: "গল্প", pieces: ["গ", "ল্প"], sound: "golpo", meaning: "story", hint: "A tale about people or events" },
    { word: "কবিতা", pieces: ["ক", "বি", "তা"], sound: "kobita", meaning: "poem", hint: "Writing arranged with rhythm and imagery" },
    { word: "পরীক্ষা", pieces: ["প", "রী", "ক্ষা"], sound: "porikkha", meaning: "exam", hint: "It checks what a student has learned" },
    { word: "ছুটি", pieces: ["ছু", "টি"], sound: "chhuti", meaning: "holiday", hint: "A day when school is closed" },
    { word: "মাঠ", pieces: ["মা", "ঠ"], sound: "math", meaning: "field", hint: "An open place for games and sports" },
    { word: "গ্রন্থাগার", pieces: ["গ্র", "ন্থা", "গা", "র"], sound: "gronthagar", meaning: "library", hint: "A place where many books are kept" },
    { word: "কম্পিউটার", pieces: ["ক", "ম্পি", "উ", "টা", "র"], sound: "kompiutar", meaning: "computer", hint: "An electronic machine used to learn and work" },
    { word: "বিষয়", pieces: ["বি", "ষ", "য়"], sound: "bishoy", meaning: "subject", hint: "A branch of knowledge studied at school" },
  ] },
  { classNumber: 4, focus: "Vowel marks inside words", words: [
    { word: "কুকুর", pieces: ["কু", "কু", "র"], sound: "kukur", meaning: "dog", hint: "A loyal pet" },
    { word: "কৃষক", pieces: ["কৃ", "ষ", "ক"], sound: "krishok", meaning: "farmer", hint: "Someone who grows crops" },
    { word: "নদী", pieces: ["ন", "দী"], sound: "nodi", meaning: "river", hint: "Water flowing toward the sea" },
    { word: "গাড়ি", pieces: ["গা", "ড়ি"], sound: "gaṛi", meaning: "car", hint: "A vehicle driven on roads" },
    { word: "চেয়ার", pieces: ["চে", "য়া", "র"], sound: "cheyar", meaning: "chair", hint: "You sit on it" },
    { word: "ময়ূর", pieces: ["ম", "য়ূ", "র"], sound: "moyur", meaning: "peacock", hint: "A bird with a colorful tail" },
    { word: "চাবি", pieces: ["চা", "বি"], sound: "chabi", meaning: "key", hint: "It opens a lock" },
    { word: "বাড়ি", pieces: ["বা", "ড়ি"], sound: "baṛi", meaning: "house", hint: "A place where a family lives" },
    { word: "দাদি", pieces: ["দা", "দি"], sound: "dadi", meaning: "paternal grandmother", hint: "Your father's mother" },
    { word: "হরিণ", pieces: ["হ", "রি", "ণ"], sound: "horin", meaning: "deer", hint: "A graceful animal with slender legs" },
    { word: "শিশু", pieces: ["শি", "শু"], sound: "shishu", meaning: "child", hint: "A very young person" },
    { word: "জুতা", pieces: ["জু", "তা"], sound: "juta", meaning: "shoe", hint: "You wear it on your foot" },
    { word: "পুতুল", pieces: ["পু", "তু", "ল"], sound: "putul", meaning: "doll", hint: "A toy shaped like a person" },
    { word: "সূর্য", pieces: ["সূ", "র্য"], sound: "shurjo", meaning: "sun", hint: "It gives Earth light and warmth" },
    { word: "ভূত", pieces: ["ভূ", "ত"], sound: "bhut", meaning: "ghost", hint: "A spirit in a spooky story" },
    { word: "ঋতু", pieces: ["ঋ", "তু"], sound: "ritu", meaning: "season", hint: "A division of the year based on weather" },
    { word: "ঘৃণা", pieces: ["ঘৃ", "ণা"], sound: "ghrina", meaning: "hatred", hint: "A very strong feeling of dislike" },
    { word: "মৃগ", pieces: ["মৃ", "গ"], sound: "mrig", meaning: "deer", hint: "A literary word for a deer" },
    { word: "দেশ", pieces: ["দে", "শ"], sound: "desh", meaning: "country", hint: "A nation and its land" },
    { word: "মেঘ", pieces: ["মে", "ঘ"], sound: "megh", meaning: "cloud", hint: "A white or gray shape in the sky" },
    { word: "খেলা", pieces: ["খে", "লা"], sound: "khela", meaning: "game", hint: "An activity played for fun" },
    { word: "বৈঠক", pieces: ["বৈ", "ঠ", "ক"], sound: "boithok", meaning: "meeting", hint: "People gathering to discuss something" },
    { word: "সৈনিক", pieces: ["সৈ", "নি", "ক"], sound: "shoinik", meaning: "soldier", hint: "A member of an army" },
    { word: "নৌকা", pieces: ["নৌ", "কা"], sound: "nouka", meaning: "boat", hint: "A small vessel that travels on water" },
    { word: "মৌচাক", pieces: ["মৌ", "চা", "ক"], sound: "mouchak", meaning: "beehive", hint: "The home where bees make honey" },
    { word: "গোল", pieces: ["গো", "ল"], sound: "gol", meaning: "round", hint: "Shaped like a circle" },
    { word: "দোলনা", pieces: ["দো", "ল", "না"], sound: "dolna", meaning: "swing", hint: "A hanging seat that moves back and forth" },
    { word: "কৌশল", pieces: ["কৌ", "শ", "ল"], sound: "koushol", meaning: "skill", hint: "An ability learned through practice" },
    { word: "ভোর", pieces: ["ভো", "র"], sound: "bhor", meaning: "dawn", hint: "The first light of morning" },
    { word: "রোদ", pieces: ["রো", "দ"], sound: "rod", meaning: "sunshine", hint: "Bright light coming from the sun" },
  ] },
  { classNumber: 5, focus: "Longer descriptive words", words: [
    { word: "সুন্দর", pieces: ["সু", "ন্দ", "র"], sound: "shundor", meaning: "beautiful", hint: "Lovely to see" },
    { word: "সাহসী", pieces: ["সা", "হ", "সী"], sound: "shahoshi", meaning: "brave", hint: "Not afraid to face danger" },
    { word: "পরিষ্কার", pieces: ["প", "রি", "ষ্কার"], sound: "porishkar", meaning: "clean", hint: "Not dirty" },
    { word: "আনন্দিত", pieces: ["আ", "ন", "ন্দি", "ত"], sound: "anondito", meaning: "delighted", hint: "Feeling very happy" },
    { word: "মিষ্টি", pieces: ["মি", "ষ্টি"], sound: "mishti", meaning: "sweet", hint: "The taste of sugar" },
    { word: "শক্তিশালী", pieces: ["শ", "ক্তি", "শা", "লী"], sound: "shoktishali", meaning: "powerful", hint: "Having great strength" },
    { word: "ভালো", pieces: ["ভা", "লো"], sound: "bhalo", meaning: "good", hint: "Pleasant, positive, or of high quality" },
    { word: "খারাপ", pieces: ["খা", "রা", "প"], sound: "kharap", meaning: "bad", hint: "Not good or unpleasant" },
    { word: "বড়", pieces: ["ব", "ড়"], sound: "boṛo", meaning: "big", hint: "Large in size" },
    { word: "ছোট", pieces: ["ছো", "ট"], sound: "chhoto", meaning: "small", hint: "Little in size" },
    { word: "লম্বা", pieces: ["ল", "ম্বা"], sound: "lomba", meaning: "tall", hint: "Having greater than average height" },
    { word: "খাটো", pieces: ["খা", "টো"], sound: "khato", meaning: "short", hint: "Having less than average height" },
    { word: "নতুন", pieces: ["ন", "তু", "ন"], sound: "notun", meaning: "new", hint: "Recently made or obtained" },
    { word: "পুরোনো", pieces: ["পু", "রো", "নো"], sound: "purono", meaning: "old", hint: "Having existed for a long time" },
    { word: "গরম", pieces: ["গ", "র", "ম"], sound: "gorom", meaning: "hot", hint: "Having a high temperature" },
    { word: "ঠান্ডা", pieces: ["ঠা", "ন্ডা"], sound: "thanda", meaning: "cold", hint: "Having a low temperature" },
    { word: "নরম", pieces: ["ন", "র", "ম"], sound: "norom", meaning: "soft", hint: "Easy to press or gentle to touch" },
    { word: "কঠিন", pieces: ["ক", "ঠি", "ন"], sound: "kothin", meaning: "hard", hint: "Firm or difficult to do" },
    { word: "দ্রুত", pieces: ["দ্রু", "ত"], sound: "druto", meaning: "fast", hint: "Moving or happening quickly" },
    { word: "ধীর", pieces: ["ধী", "র"], sound: "dhir", meaning: "slow", hint: "Moving without much speed" },
    { word: "সুখী", pieces: ["সু", "খী"], sound: "shukhi", meaning: "happy", hint: "Feeling pleased and content" },
    { word: "দুঃখী", pieces: ["দুঃ", "খী"], sound: "dukkhi", meaning: "sad", hint: "Feeling unhappy or sorrowful" },
    { word: "রাগী", pieces: ["রা", "গী"], sound: "ragi", meaning: "angry", hint: "Feeling or showing strong annoyance" },
    { word: "শান্ত", pieces: ["শা", "ন্ত"], sound: "shanto", meaning: "calm", hint: "Peaceful and not excited" },
    { word: "বুদ্ধিমান", pieces: ["বু", "দ্ধি", "মা", "ন"], sound: "buddhiman", meaning: "intelligent", hint: "Able to learn and understand quickly" },
    { word: "সৎ", pieces: ["স", "ৎ"], sound: "shot", meaning: "honest", hint: "Truthful and fair" },
    { word: "দয়ালু", pieces: ["দ", "য়া", "লু"], sound: "doyalu", meaning: "kind", hint: "Caring and helpful toward others" },
    { word: "অলস", pieces: ["অ", "ল", "স"], sound: "olosh", meaning: "lazy", hint: "Not willing to work or be active" },
    { word: "সক্রিয়", pieces: ["স", "ক্রি", "য়"], sound: "shokriyo", meaning: "active", hint: "Busy, energetic, and involved" },
    { word: "রঙিন", pieces: ["র", "ঙি", "ন"], sound: "rongin", meaning: "colorful", hint: "Full of bright or varied colors" },
  ] },
  { classNumber: 6, focus: "Conjunct consonants", words: [
    { word: "বন্ধু", pieces: ["ব", "ন্ধু"], sound: "bondhu", meaning: "friend", hint: "Someone you trust and like" },
    { word: "স্বপ্ন", pieces: ["স্ব", "প্ন"], sound: "shopno", meaning: "dream", hint: "A story seen while sleeping" },
    { word: "প্রশ্ন", pieces: ["প্র", "শ্ন"], sound: "proshno", meaning: "question", hint: "Something asked for an answer" },
    { word: "রক্ত", pieces: ["র", "ক্ত"], sound: "rokto", meaning: "blood", hint: "The red liquid flowing through the body" },
    { word: "শক্তি", pieces: ["শ", "ক্তি"], sound: "shokti", meaning: "energy", hint: "The power needed to do work" },
    { word: "শ্রদ্ধা", pieces: ["শ্র", "দ্ধা"], sound: "shroddha", meaning: "reverence", hint: "Deep respect for someone" },
    { word: "ভক্ত", pieces: ["ভ", "ক্ত"], sound: "bhokto", meaning: "devotee", hint: "A person deeply devoted to a faith or figure" },
    { word: "মুক্ত", pieces: ["মু", "ক্ত"], sound: "mukto", meaning: "free", hint: "Not confined or controlled" },
    { word: "যুক্ত", pieces: ["যু", "ক্ত"], sound: "jukto", meaning: "connected", hint: "Joined or linked together" },
    { word: "শব্দ", pieces: ["শ", "ব্দ"], sound: "shobdo", meaning: "word", hint: "A unit of language with meaning" },
    { word: "অগ্নি", pieces: ["অ", "গ্নি"], sound: "ogni", meaning: "fire", hint: "Flame, heat, and light from burning" },
    { word: "চন্দ্র", pieces: ["চ", "ন্দ্র"], sound: "chondro", meaning: "moon", hint: "A literary word for Earth's natural satellite" },
    { word: "মন্ত্র", pieces: ["ম", "ন্ত্র"], sound: "montro", meaning: "mantra", hint: "A sacred phrase repeated in prayer" },
    { word: "তন্ত্র", pieces: ["ত", "ন্ত্র"], sound: "tontro", meaning: "system", hint: "A connected set of parts or methods" },
    { word: "যন্ত্র", pieces: ["য", "ন্ত্র"], sound: "jontro", meaning: "machine", hint: "A device that performs work" },
    { word: "কেন্দ্র", pieces: ["কে", "ন্দ্র"], sound: "kendro", meaning: "center", hint: "The middle point of something" },
    { word: "গ্রাম", pieces: ["গ্রা", "ম"], sound: "gram", meaning: "village", hint: "A small community in the countryside" },
    { word: "ক্রম", pieces: ["ক্র", "ম"], sound: "krom", meaning: "order", hint: "A sequence or arranged position" },
    { word: "ক্লাস", pieces: ["ক্লা", "স"], sound: "klas", meaning: "class", hint: "A lesson or group of students" },
    { word: "প্লাবন", pieces: ["প্লা", "ব", "ন"], sound: "plabon", meaning: "flood", hint: "Water covering normally dry land" },
    { word: "ব্রত", pieces: ["ব্র", "ত"], sound: "broto", meaning: "vow", hint: "A solemn promise or observance" },
    { word: "ত্রাণ", pieces: ["ত্রা", "ণ"], sound: "tran", meaning: "relief", hint: "Help given after a disaster" },
    { word: "দৃষ্টি", pieces: ["দৃ", "ষ্টি"], sound: "drishti", meaning: "vision", hint: "The ability to see or a way of viewing things" },
    { word: "সৃষ্টি", pieces: ["সৃ", "ষ্টি"], sound: "srishti", meaning: "creation", hint: "Something made or brought into existence" },
    { word: "কষ্ট", pieces: ["ক", "ষ্ট"], sound: "koshto", meaning: "hardship", hint: "Pain, difficulty, or suffering" },
    { word: "স্পষ্ট", pieces: ["স্প", "ষ্ট"], sound: "sposhto", meaning: "clear", hint: "Easy to see or understand" },
    { word: "স্মৃতি", pieces: ["স্মৃ", "তি"], sound: "smriti", meaning: "memory", hint: "Something remembered from the past" },
    { word: "সম্পদ", pieces: ["স", "ম্প", "দ"], sound: "shompod", meaning: "wealth", hint: "Valuable possessions or resources" },
    { word: "অন্তর", pieces: ["অ", "ন্ত", "র"], sound: "ontor", meaning: "inner heart", hint: "The inside or deepest feelings" },
    { word: "গন্ধ", pieces: ["গ", "ন্ধ"], sound: "gondho", meaning: "smell", hint: "Something detected by the nose" },
  ] },
  { classNumber: 7, focus: "Ideas and feelings", words: [
    { word: "আনন্দ", pieces: ["আ", "ন", "ন্দ"], sound: "anondo", meaning: "joy", hint: "A feeling of great happiness" },
    { word: "সম্মান", pieces: ["স", "ম্মা", "ন"], sound: "shomman", meaning: "respect", hint: "Honoring someone" },
    { word: "বিশ্বাস", pieces: ["বি", "শ্বা", "স"], sound: "bishshash", meaning: "trust", hint: "Confidence that something is true" },
    { word: "আশা", pieces: ["আ", "শা"], sound: "asha", meaning: "hope", hint: "A wish that something good will happen" },
    { word: "ভয়", pieces: ["ভ", "য়"], sound: "bhoy", meaning: "fear", hint: "The feeling of being afraid" },
    { word: "কৌতূহল", pieces: ["কৌ", "তূ", "হ", "ল"], sound: "koutuhol", meaning: "curiosity", hint: "A strong desire to learn or know" },
    { word: "ভালোবাসা", pieces: ["ভা", "লো", "বা", "সা"], sound: "bhalobasha", meaning: "love", hint: "Deep care and affection for someone" },
    { word: "স্নেহ", pieces: ["স্নে", "হ"], sound: "sneho", meaning: "affection", hint: "A gentle feeling of fondness and care" },
    { word: "বন্ধুত্ব", pieces: ["ব", "ন্ধু", "ত্ব"], sound: "bondhutto", meaning: "friendship", hint: "The relationship shared by friends" },
    { word: "শান্তি", pieces: ["শা", "ন্তি"], sound: "shanti", meaning: "peace", hint: "A state without conflict or disturbance" },
    { word: "রাগ", pieces: ["রা", "গ"], sound: "rag", meaning: "anger", hint: "A strong feeling of annoyance" },
    { word: "দুঃখ", pieces: ["দুঃ", "খ"], sound: "dukkho", meaning: "sadness", hint: "The feeling of being unhappy" },
    { word: "সুখ", pieces: ["সু", "খ"], sound: "shukh", meaning: "happiness", hint: "A state of pleasure and contentment" },
    { word: "বিস্ময়", pieces: ["বি", "স্ম", "য়"], sound: "bishshoy", meaning: "surprise", hint: "A feeling caused by something unexpected" },
    { word: "লজ্জা", pieces: ["ল", "জ্জা"], sound: "lojja", meaning: "shame", hint: "Embarrassment about something wrong or awkward" },
    { word: "গর্ব", pieces: ["গ", "র্ব"], sound: "gorbo", meaning: "pride", hint: "Satisfaction in an achievement or identity" },
    { word: "ধৈর্য", pieces: ["ধৈ", "র্য"], sound: "dhoirjo", meaning: "patience", hint: "The ability to wait without becoming upset" },
    { word: "সাহস", pieces: ["সা", "হ", "স"], sound: "shahosh", meaning: "courage", hint: "Strength to face fear or difficulty" },
    { word: "দয়া", pieces: ["দ", "য়া"], sound: "doya", meaning: "kindness", hint: "Care and concern shown toward others" },
    { word: "ক্ষমা", pieces: ["ক্ষ", "মা"], sound: "khoma", meaning: "forgiveness", hint: "Letting go of anger after being hurt" },
    { word: "দুশ্চিন্তা", pieces: ["দু", "শ্চি", "ন্তা"], sound: "dushchinta", meaning: "worry", hint: "Troubled thoughts about possible problems" },
    { word: "ইচ্ছা", pieces: ["ই", "চ্ছা"], sound: "ichchha", meaning: "desire", hint: "A strong wish for something" },
    { word: "স্বাধীনতা", pieces: ["স্বা", "ধী", "ন", "তা"], sound: "shadhinota", meaning: "freedom", hint: "The condition of being able to choose and act" },
    { word: "সত্য", pieces: ["স", "ত্য"], sound: "shotto", meaning: "truth", hint: "Something that agrees with fact or reality" },
    { word: "মিথ্যা", pieces: ["মি", "থ্যা"], sound: "miththa", meaning: "falsehood", hint: "A statement that is not true" },
    { word: "জ্ঞান", pieces: ["জ্ঞা", "ন"], sound: "ggan", meaning: "knowledge", hint: "Understanding gained through learning" },
    { word: "প্রজ্ঞা", pieces: ["প্র", "জ্ঞা"], sound: "progga", meaning: "wisdom", hint: "Good judgment based on knowledge and experience" },
    { word: "চিন্তা", pieces: ["চি", "ন্তা"], sound: "chinta", meaning: "thought", hint: "An idea formed in the mind" },
    { word: "কল্পনা", pieces: ["ক", "ল্প", "না"], sound: "kolpona", meaning: "imagination", hint: "The ability to form new pictures and ideas in the mind" },
    { word: "কৃতজ্ঞতা", pieces: ["কৃ", "ত", "জ্ঞ", "তা"], sound: "kritoggota", meaning: "gratitude", hint: "Thankfulness for kindness or help" },
  ] },
  { classNumber: 8, focus: "Academic vocabulary", words: [
    { word: "বিজ্ঞান", pieces: ["বি", "জ্ঞা", "ন"], sound: "biggan", meaning: "science", hint: "The study of the natural world" },
    { word: "ইতিহাস", pieces: ["ই", "তি", "হা", "স"], sound: "itihash", meaning: "history", hint: "The study of the past" },
    { word: "ভূগোল", pieces: ["ভূ", "গো", "ল"], sound: "bhugol", meaning: "geography", hint: "The study of places and Earth" },
    { word: "গণিত", pieces: ["গ", "ণি", "ত"], sound: "gonit", meaning: "mathematics", hint: "The study of numbers and quantities" },
    { word: "সাহিত্য", pieces: ["সা", "হি", "ত্য"], sound: "shahitto", meaning: "literature", hint: "Written artistic works and stories" },
    { word: "অর্থনীতি", pieces: ["অ", "র্থ", "নী", "তি"], sound: "orthoniti", meaning: "economics", hint: "The study of money, trade, and resources" },
    { word: "পদার্থবিজ্ঞান", pieces: ["প", "দা", "র্থ", "বি", "জ্ঞা", "ন"], sound: "podarthobiggan", meaning: "physics", hint: "The science of matter, energy, force, and motion" },
    { word: "রসায়ন", pieces: ["র", "সা", "য়", "ন"], sound: "roshayon", meaning: "chemistry", hint: "The science of substances and how they change" },
    { word: "জীববিজ্ঞান", pieces: ["জী", "ব", "বি", "জ্ঞা", "ন"], sound: "jibobiggan", meaning: "biology", hint: "The scientific study of living things" },
    { word: "জ্যোতির্বিজ্ঞান", pieces: ["জ্যো", "তি", "র্বি", "জ্ঞা", "ন"], sound: "jyotirbiggan", meaning: "astronomy", hint: "The study of stars, planets, and space" },
    { word: "ভাষা", pieces: ["ভা", "ষা"], sound: "bhasha", meaning: "language", hint: "A system people use to communicate" },
    { word: "ব্যাকরণ", pieces: ["ব্যা", "ক", "র", "ণ"], sound: "byakoron", meaning: "grammar", hint: "The rules for forming words and sentences" },
    { word: "সমাজবিজ্ঞান", pieces: ["স", "মা", "জ", "বি", "জ্ঞা", "ন"], sound: "shomajbiggan", meaning: "sociology", hint: "The study of society and social relationships" },
    { word: "পৌরনীতি", pieces: ["পৌ", "র", "নী", "তি"], sound: "pouroniti", meaning: "civics", hint: "The study of citizens, government, and public life" },
    { word: "পরিসংখ্যান", pieces: ["প", "রি", "সং", "খ্যা", "ন"], sound: "porishongkhyan", meaning: "statistics", hint: "The collection and analysis of numerical data" },
    { word: "জ্যামিতি", pieces: ["জ্যা", "মি", "তি"], sound: "jyamiti", meaning: "geometry", hint: "The mathematics of shapes, lines, and space" },
    { word: "বীজগণিত", pieces: ["বী", "জ", "গ", "ণি", "ত"], sound: "bijgonit", meaning: "algebra", hint: "Mathematics that uses symbols for unknown values" },
    { word: "প্রযুক্তি", pieces: ["প্র", "যু", "ক্তি"], sound: "projukti", meaning: "technology", hint: "Practical tools and systems made using knowledge" },
    { word: "গবেষণা", pieces: ["গ", "বে", "ষ", "ণা"], sound: "gobeshona", meaning: "research", hint: "Careful study to discover new information" },
    { word: "পরীক্ষণ", pieces: ["প", "রী", "ক্ষ", "ণ"], sound: "porikkhon", meaning: "experiment", hint: "A test performed to investigate an idea" },
    { word: "অনুমান", pieces: ["অ", "নু", "মা", "ন"], sound: "onuman", meaning: "hypothesis", hint: "A proposed explanation that can be tested" },
    { word: "তত্ত্ব", pieces: ["ত", "ত্ত্ব"], sound: "totto", meaning: "theory", hint: "A system of ideas explaining something" },
    { word: "তথ্য", pieces: ["ত", "থ্য"], sound: "toththo", meaning: "information", hint: "Facts or details learned about something" },
    { word: "উপাত্ত", pieces: ["উ", "পা", "ত্ত"], sound: "upatto", meaning: "data", hint: "Facts and measurements collected for study" },
    { word: "বিশ্লেষণ", pieces: ["বি", "শ্লে", "ষ", "ণ"], sound: "bishleshon", meaning: "analysis", hint: "Detailed examination of parts and relationships" },
    { word: "শিক্ষা", pieces: ["শি", "ক্ষা"], sound: "shikkha", meaning: "education", hint: "The process of teaching and learning" },
    { word: "বিশ্ববিদ্যালয়", pieces: ["বি", "শ্ব", "বি", "দ্যা", "লয়"], sound: "bishshobidyaloy", meaning: "university", hint: "An institution for advanced study and degrees" },
    { word: "অভিধান", pieces: ["অ", "ভি", "ধা", "ন"], sound: "obhidhan", meaning: "dictionary", hint: "A book that explains words and meanings" },
    { word: "বিশ্বকোষ", pieces: ["বি", "শ্ব", "কো", "ষ"], sound: "bishshokosh", meaning: "encyclopedia", hint: "A reference work covering many subjects" },
    { word: "গবেষণাগার", pieces: ["গ", "বে", "ষ", "ণা", "গা", "র"], sound: "gobeshonagar", meaning: "laboratory", hint: "A place equipped for scientific research" },
  ] },
  { classNumber: 9, focus: "Formal and compound words", words: [
    { word: "স্বাধীনতা", pieces: ["স্বা", "ধী", "ন", "তা"], sound: "shadhinota", meaning: "independence", hint: "Freedom from control" },
    { word: "পরিবেশ", pieces: ["প", "রি", "বে", "শ"], sound: "poribesh", meaning: "environment", hint: "The natural world around us" },
    { word: "দায়িত্ব", pieces: ["দা", "য়ি", "ত্ব"], sound: "dayitto", meaning: "responsibility", hint: "A duty you are expected to fulfill" },
    { word: "নাগরিক", pieces: ["না", "গ", "রি", "ক"], sound: "nagorik", meaning: "citizen", hint: "A legal member of a country" },
    { word: "যোগাযোগ", pieces: ["যো", "গা", "যো", "গ"], sound: "jogajog", meaning: "communication", hint: "Sharing information with others" },
    { word: "প্রযুক্তি", pieces: ["প্র", "যু", "ক্তি"], sound: "projukti", meaning: "technology", hint: "Tools and systems created from science" },
    { word: "সমাজ", pieces: ["স", "মা", "জ"], sound: "shomaj", meaning: "society", hint: "People living together in an organized community" },
    { word: "সরকার", pieces: ["স", "র", "কা", "র"], sound: "shorkar", meaning: "government", hint: "The group that governs a country or region" },
    { word: "সংবিধান", pieces: ["সং", "বি", "ধা", "ন"], sound: "shongbidhan", meaning: "constitution", hint: "The fundamental laws of a country" },
    { word: "আইন", pieces: ["আ", "ই", "ন"], sound: "ain", meaning: "law", hint: "An official rule enforced by a country" },
    { word: "অধিকার", pieces: ["অ", "ধি", "কা", "র"], sound: "odhikar", meaning: "right", hint: "A legal or moral freedom a person possesses" },
    { word: "কর্তব্য", pieces: ["ক", "র্ত", "ব্য"], sound: "kortobbo", meaning: "duty", hint: "Something a person is responsible for doing" },
    { word: "নির্বাচন", pieces: ["নি", "র্বা", "চ", "ন"], sound: "nirbachon", meaning: "election", hint: "A public vote used to choose leaders" },
    { word: "সংসদ", pieces: ["সং", "স", "দ"], sound: "shongshod", meaning: "parliament", hint: "A national body that debates and makes laws" },
    { word: "প্রশাসন", pieces: ["প্র", "শা", "স", "ন"], sound: "proshashon", meaning: "administration", hint: "The management of an organization or government" },
    { word: "ন্যায়বিচার", pieces: ["ন্যা", "য়", "বি", "চা", "র"], sound: "nyaybichar", meaning: "justice", hint: "Fair treatment under rules and law" },
    { word: "সমতা", pieces: ["স", "ম", "তা"], sound: "shomota", meaning: "equality", hint: "The state of having equal rights and opportunities" },
    { word: "উন্নয়ন", pieces: ["উ", "ন্ন", "য়", "ন"], sound: "unnoyon", meaning: "development", hint: "Growth or progress toward a better condition" },
    { word: "অর্থনীতি", pieces: ["অ", "র্থ", "নী", "তি"], sound: "orthoniti", meaning: "economy", hint: "The system of production, trade, and money" },
    { word: "শিল্প", pieces: ["শি", "ল্প"], sound: "shilpo", meaning: "industry", hint: "Economic activity that makes goods or services" },
    { word: "কৃষি", pieces: ["কৃ", "ষি"], sound: "krishi", meaning: "agriculture", hint: "Growing crops and raising animals for food" },
    { word: "জনসংখ্যা", pieces: ["জ", "ন", "সং", "খ্যা"], sound: "jonoshongkhya", meaning: "population", hint: "The number of people living in a place" },
    { word: "দূষণ", pieces: ["দূ", "ষ", "ণ"], sound: "dushon", meaning: "pollution", hint: "Harmful contamination of air, water, or land" },
    { word: "সংরক্ষণ", pieces: ["সং", "র", "ক্ষ", "ণ"], sound: "shongrokkhon", meaning: "conservation", hint: "Protection and careful use of natural resources" },
    { word: "জলবায়ু", pieces: ["জ", "ল", "বা", "য়ু"], sound: "jolobayu", meaning: "climate", hint: "Long-term weather patterns in a region" },
    { word: "দুর্যোগ", pieces: ["দু", "র্যো", "গ"], sound: "durjog", meaning: "disaster", hint: "An event causing widespread damage or hardship" },
    { word: "স্বাস্থ্য", pieces: ["স্বা", "স্থ্য"], sound: "shastho", meaning: "health", hint: "The condition of the body and mind" },
    { word: "শিক্ষা", pieces: ["শি", "ক্ষা"], sound: "shikkha", meaning: "education", hint: "The process of teaching and learning" },
    { word: "পরিবহন", pieces: ["প", "রি", "ব", "হ", "ন"], sound: "poribohon", meaning: "transportation", hint: "Moving people or goods between places" },
    { word: "অবকাঠামো", pieces: ["অ", "ব", "কা", "ঠা", "মো"], sound: "obokathamo", meaning: "infrastructure", hint: "Basic systems such as roads, power, and water" },
  ] },
  { classNumber: 10, focus: "Abstract concepts", words: [
    { word: "গণতন্ত্র", pieces: ["গ", "ণ", "ত", "ন্ত্র"], sound: "gonotontro", meaning: "democracy", hint: "Government chosen by the people" },
    { word: "মানবতা", pieces: ["মা", "ন", "ব", "তা"], sound: "manobota", meaning: "humanity", hint: "Compassion for humankind" },
    { word: "সংস্কৃতি", pieces: ["সং", "স্কৃ", "তি"], sound: "shongskriti", meaning: "culture", hint: "Shared traditions, arts, and customs" },
    { word: "সাম্য", pieces: ["সা", "ম্য"], sound: "shammo", meaning: "equality", hint: "The state of being equal" },
    { word: "ন্যায়বিচার", pieces: ["ন্যা", "য়", "বি", "চা", "র"], sound: "nyaybichar", meaning: "justice", hint: "Fair treatment under rules or law" },
    { word: "ঐতিহ্য", pieces: ["ঐ", "তি", "হ্য"], sound: "oitijjho", meaning: "heritage", hint: "Traditions passed down through generations" },
    { word: "স্বাধীনতা", pieces: ["স্বা", "ধী", "ন", "তা"], sound: "shadhinota", meaning: "liberty", hint: "Freedom to live and act without oppression" },
    { word: "ভ্রাতৃত্ব", pieces: ["ভ্রা", "তৃ", "ত্ব"], sound: "bhratritto", meaning: "fraternity", hint: "A spirit of unity and fellowship" },
    { word: "নৈতিকতা", pieces: ["নৈ", "তি", "ক", "তা"], sound: "noitikota", meaning: "morality", hint: "Principles that distinguish right from wrong" },
    { word: "নীতিশাস্ত্র", pieces: ["নী", "তি", "শা", "স্ত্র"], sound: "nitishastro", meaning: "ethics", hint: "The study of moral principles" },
    { word: "মতাদর্শ", pieces: ["ম", "তা", "দ", "র্শ"], sound: "motadorsho", meaning: "ideology", hint: "A system of political or social beliefs" },
    { word: "দর্শন", pieces: ["দ", "র্শ", "ন"], sound: "dorshon", meaning: "philosophy", hint: "The study of knowledge, reality, and existence" },
    { word: "চেতনা", pieces: ["চে", "ত", "না"], sound: "chetona", meaning: "consciousness", hint: "Awareness of oneself and the world" },
    { word: "পরিচয়", pieces: ["প", "রি", "চ", "য়"], sound: "porichoy", meaning: "identity", hint: "The qualities that define a person or group" },
    { word: "বৈচিত্র্য", pieces: ["বৈ", "চি", "ত্র্য"], sound: "boichitro", meaning: "diversity", hint: "The presence of many different forms or kinds" },
    { word: "ঐক্য", pieces: ["ঐ", "ক্য"], sound: "oikko", meaning: "unity", hint: "The state of being joined together" },
    { word: "সহিষ্ণুতা", pieces: ["স", "হি", "ষ্ণু", "তা"], sound: "shohishnuta", meaning: "tolerance", hint: "Acceptance of differences and disagreement" },
    { word: "ধর্মনিরপেক্ষতা", pieces: ["ধ", "র্ম", "নি", "র", "পে", "ক্ষ", "তা"], sound: "dhormoniropekkhota", meaning: "secularism", hint: "Separation of religion from state authority" },
    { word: "জাতীয়তাবাদ", pieces: ["জা", "তী", "য়", "তা", "বা", "দ"], sound: "jatiyotabad", meaning: "nationalism", hint: "Strong identification with one's nation" },
    { word: "সার্বভৌমত্ব", pieces: ["সা", "র্ব", "ভৌ", "ম", "ত্ব"], sound: "sharbobhoumotto", meaning: "sovereignty", hint: "A state's authority to govern itself" },
    { word: "অধিকার", pieces: ["অ", "ধি", "কা", "র"], sound: "odhikar", meaning: "rights", hint: "Freedoms protected by law or morality" },
    { word: "দায়বদ্ধতা", pieces: ["দা", "য়", "ব", "দ্ধ", "তা"], sound: "dayoboddhota", meaning: "accountability", hint: "Being responsible for decisions and actions" },
    { word: "অগ্রগতি", pieces: ["অ", "গ্র", "গ", "তি"], sound: "ogrogoti", meaning: "progress", hint: "Movement toward improvement or advancement" },
    { word: "সভ্যতা", pieces: ["স", "ভ্য", "তা"], sound: "shobbhota", meaning: "civilization", hint: "An advanced organized human society" },
    { word: "কল্যাণ", pieces: ["ক", "ল্যা", "ণ"], sound: "kollyan", meaning: "welfare", hint: "Health, happiness, and well-being" },
    { word: "আধুনিকতা", pieces: ["আ", "ধু", "নি", "ক", "তা"], sound: "adhunikota", meaning: "modernity", hint: "The condition of being modern" },
    { word: "যুক্তিবাদ", pieces: ["যু", "ক্তি", "বা", "দ"], sound: "juktibad", meaning: "rationalism", hint: "Reliance on reason as a source of knowledge" },
    { word: "সৃজনশীলতা", pieces: ["সৃ", "জ", "ন", "শী", "ল", "তা"], sound: "srijonshilota", meaning: "creativity", hint: "The power to make original ideas or work" },
    { word: "মতপ্রকাশ", pieces: ["ম", "ত", "প্র", "কা", "শ"], sound: "motoprokash", meaning: "expression", hint: "Communicating one's thoughts and opinions" },
    { word: "সহাবস্থান", pieces: ["স", "হা", "ব", "স্থা", "ন"], sound: "shohabosthan", meaning: "coexistence", hint: "Living together peacefully despite differences" },
  ] },
  { classNumber: 11, focus: "Advanced literary vocabulary", words: [
    { word: "সৃজনশীলতা", pieces: ["সৃ", "জ", "ন", "শী", "ল", "তা"], sound: "srijonshilota", meaning: "creativity", hint: "The ability to produce original ideas" },
    { word: "আত্মবিশ্বাস", pieces: ["আত্ম", "বি", "শ্বা", "স"], sound: "attobishshash", meaning: "self-confidence", hint: "Belief in your own ability" },
    { word: "সহানুভূতি", pieces: ["স", "হা", "নু", "ভূ", "তি"], sound: "shohanubhuti", meaning: "empathy", hint: "Understanding another person's feelings" },
    { word: "মননশীলতা", pieces: ["ম", "ন", "ন", "শী", "ল", "তা"], sound: "mononshilota", meaning: "thoughtfulness", hint: "Careful and considerate thinking" },
    { word: "আত্মমর্যাদা", pieces: ["আত্ম", "ম", "র্যা", "দা"], sound: "attomorjada", meaning: "self-respect", hint: "A sense of your own worth" },
    { word: "সহমর্মিতা", pieces: ["স", "হ", "ম", "র্মি", "তা"], sound: "shohomormita", meaning: "compassion", hint: "Concern for another person's suffering" },
    { word: "নন্দনতত্ত্ব", pieces: ["ন", "ন্দ", "ন", "ত", "ত্ত্ব"], sound: "nondonototto", meaning: "aesthetics", hint: "The study of beauty and artistic taste" },
    { word: "রূপক", pieces: ["রূ", "প", "ক"], sound: "rupok", meaning: "metaphor", hint: "A comparison stated without using like or as" },
    { word: "উপমা", pieces: ["উ", "প", "মা"], sound: "upoma", meaning: "simile", hint: "A comparison that commonly uses like or as" },
    { word: "প্রতীকবাদ", pieces: ["প্র", "তী", "ক", "বা", "দ"], sound: "protikbad", meaning: "symbolism", hint: "Using symbols to represent deeper ideas" },
    { word: "কল্পনাশক্তি", pieces: ["ক", "ল্প", "না", "শ", "ক্তি"], sound: "kolponashokti", meaning: "imagination", hint: "The ability to create ideas and images mentally" },
    { word: "দৃষ্টিভঙ্গি", pieces: ["দৃ", "ষ্টি", "ভ", "ঙ্গি"], sound: "drishtibhongi", meaning: "perspective", hint: "A particular way of viewing something" },
    { word: "ব্যাখ্যা", pieces: ["ব্যা", "খ্যা"], sound: "byakhya", meaning: "interpretation", hint: "An explanation of meaning" },
    { word: "সমালোচনা", pieces: ["স", "মা", "লো", "চ", "না"], sound: "shomalochona", meaning: "criticism", hint: "Careful judgment of a work's qualities" },
    { word: "আখ্যান", pieces: ["আ", "খ্যা", "ন"], sound: "akhyan", meaning: "narrative", hint: "A structured account of connected events" },
    { word: "নায়ক", pieces: ["না", "য়", "ক"], sound: "nayok", meaning: "protagonist", hint: "The leading character in a story" },
    { word: "চরিত্র", pieces: ["চ", "রি", "ত্র"], sound: "choritro", meaning: "character", hint: "A person represented in a literary work" },
    { word: "সংলাপ", pieces: ["সং", "লা", "প"], sound: "shonglap", meaning: "dialogue", hint: "Conversation between characters" },
    { word: "কাব্য", pieces: ["কা", "ব্য"], sound: "kabbo", meaning: "poetry", hint: "Literary writing shaped by rhythm and imagery" },
    { word: "গদ্য", pieces: ["গ", "দ্য"], sound: "goddo", meaning: "prose", hint: "Ordinary written language without poetic meter" },
    { word: "নাটক", pieces: ["না", "ট", "ক"], sound: "natok", meaning: "drama", hint: "A story written to be performed" },
    { word: "উপন্যাস", pieces: ["উ", "প", "ন্যা", "স"], sound: "uponnash", meaning: "novel", hint: "A long work of fictional prose" },
    { word: "প্রবন্ধ", pieces: ["প্র", "ব", "ন্ধ"], sound: "probondho", meaning: "essay", hint: "A focused piece of nonfiction writing" },
    { word: "অলংকার", pieces: ["অ", "লং", "কা", "র"], sound: "olongkar", meaning: "rhetorical device", hint: "A language technique used for expressive effect" },
    { word: "চেতনাবোধ", pieces: ["চে", "ত", "না", "বো", "ধ"], sound: "chetonabodh", meaning: "awareness", hint: "Conscious understanding of an idea or condition" },
    { word: "আত্মবিশ্লেষণ", pieces: ["আত্ম", "বি", "শ্লে", "ষ", "ণ"], sound: "attobishleshon", meaning: "introspection", hint: "Examination of one's own thoughts and feelings" },
    { word: "ব্যক্তিস্বাতন্ত্র্য", pieces: ["ব্য", "ক্তি", "স্বা", "ত", "ন্ত্র্য"], sound: "bektishatontro", meaning: "individuality", hint: "Qualities that distinguish one person from others" },
    { word: "মানবতাবাদ", pieces: ["মা", "ন", "ব", "তা", "বা", "দ"], sound: "manobotabad", meaning: "humanism", hint: "A philosophy centered on human value and agency" },
    { word: "অস্তিত্ববাদ", pieces: ["অ", "স্তি", "ত্ব", "বা", "দ"], sound: "ostittobad", meaning: "existentialism", hint: "A philosophy of freedom, choice, and existence" },
    { word: "রোমান্টিকতাবাদ", pieces: ["রো", "মা", "ন্টি", "ক", "তা", "বা", "দ"], sound: "romantikotabad", meaning: "romanticism", hint: "A movement emphasizing emotion and imagination" },
  ] },
  { classNumber: 12, focus: "Complex academic concepts", words: [
    { word: "জীববৈচিত্র্য", pieces: ["জী", "ব", "বৈ", "চি", "ত্র্য"], sound: "jiboboichitro", meaning: "biodiversity", hint: "The variety of living things in nature" },
    { word: "বিশ্বায়ন", pieces: ["বি", "শ্বা", "য়", "ন"], sound: "bishshayon", meaning: "globalization", hint: "Increasing connection across the world" },
    { word: "সাংবিধানিক", pieces: ["সাং", "বি", "ধা", "নি", "ক"], sound: "shangbidhanik", meaning: "constitutional", hint: "Related to a country's fundamental laws" },
    { word: "জলবায়ু", pieces: ["জ", "ল", "বা", "য়ু"], sound: "jolobayu", meaning: "climate", hint: "Long-term weather patterns in a region" },
    { word: "রাষ্ট্রবিজ্ঞান", pieces: ["রা", "ষ্ট্র", "বি", "জ্ঞা", "ন"], sound: "rashtrobiggan", meaning: "political science", hint: "The study of government and political systems" },
    { word: "বহুসংস্কৃতিবাদ", pieces: ["ব", "হু", "সং", "স্কৃ", "তি", "বা", "দ"], sound: "bohushongskritibad", meaning: "multiculturalism", hint: "Many cultures existing together in society" },
    { word: "বাস্তুতন্ত্র", pieces: ["বা", "স্তু", "ত", "ন্ত্র"], sound: "bastutontro", meaning: "ecosystem", hint: "Living things interacting with their environment" },
    { word: "সালোকসংশ্লেষণ", pieces: ["সা", "লো", "ক", "সং", "শ্লে", "ষ", "ণ"], sound: "salokshongshleshon", meaning: "photosynthesis", hint: "The process plants use to make food from light" },
    { word: "উত্তরাধিকার", pieces: ["উ", "ত্ত", "রা", "ধি", "কা", "র"], sound: "uttoradhikar", meaning: "inheritance", hint: "Traits or property passed to later generations" },
    { word: "বিবর্তন", pieces: ["বি", "ব", "র্ত", "ন"], sound: "biborton", meaning: "evolution", hint: "Biological change across generations" },
    { word: "আপেক্ষিকতা", pieces: ["আ", "পে", "ক্ষি", "ক", "তা"], sound: "apekkhikota", meaning: "relativity", hint: "A theory relating space, time, matter, and gravity" },
    { word: "অ্যালগরিদম", pieces: ["অ্যা", "ল", "গ", "রি", "দ", "ম"], sound: "algorithm", meaning: "algorithm", hint: "A defined sequence of steps for solving a problem" },
    { word: "সংকেতায়ন", pieces: ["সং", "কে", "তা", "য়", "ন"], sound: "shongketayon", meaning: "encryption", hint: "Converting information into a protected code" },
    { word: "কূটনীতি", pieces: ["কূ", "ট", "নী", "তি"], sound: "kutniti", meaning: "diplomacy", hint: "Managing relations and negotiations between states" },
    { word: "ভূরাজনীতি", pieces: ["ভূ", "রা", "জ", "নী", "তি"], sound: "bhurajniti", meaning: "geopolitics", hint: "How geography influences international politics" },
    { word: "জননীতি", pieces: ["জ", "ন", "নী", "তি"], sound: "jononiti", meaning: "public policy", hint: "Government principles and plans for public issues" },
    { word: "আইনশাস্ত্র", pieces: ["আ", "ই", "ন", "শা", "স্ত্র"], sound: "ainshastro", meaning: "jurisprudence", hint: "The theory and philosophy of law" },
    { word: "নৃবিজ্ঞান", pieces: ["নৃ", "বি", "জ্ঞা", "ন"], sound: "nribiggan", meaning: "anthropology", hint: "The study of humans and cultures" },
    { word: "প্রত্নতত্ত্ব", pieces: ["প্র", "ত্ন", "ত", "ত্ত্ব"], sound: "protnototto", meaning: "archaeology", hint: "The study of past societies through material remains" },
    { word: "ভাষাবিজ্ঞান", pieces: ["ভা", "ষা", "বি", "জ্ঞা", "ন"], sound: "bhashabiggan", meaning: "linguistics", hint: "The scientific study of language" },
    { word: "জ্ঞানতত্ত্ব", pieces: ["জ্ঞা", "ন", "ত", "ত্ত্ব"], sound: "gganototto", meaning: "epistemology", hint: "The philosophical study of knowledge" },
    { word: "মনোবিজ্ঞান", pieces: ["ম", "নো", "বি", "জ্ঞা", "ন"], sound: "monobiggan", meaning: "psychology", hint: "The scientific study of mind and behavior" },
    { word: "উদ্যোক্তৃত্ব", pieces: ["উ", "দ্যো", "ক্তৃ", "ত্ব"], sound: "uddyoktritto", meaning: "entrepreneurship", hint: "Creating and managing a new venture" },
    { word: "উদ্ভাবন", pieces: ["উ", "দ্ভা", "ব", "ন"], sound: "udbhabon", meaning: "innovation", hint: "Introducing a useful new idea or method" },
    { word: "নবায়নযোগ্য", pieces: ["ন", "বা", "য়", "ন", "যো", "গ্য"], sound: "nobayonjoggo", meaning: "renewable", hint: "Able to be naturally restored or replaced" },
    { word: "অভিবাসন", pieces: ["অ", "ভি", "বা", "স", "ন"], sound: "obhibashon", meaning: "migration", hint: "Movement to a new place to live" },
    { word: "নগরায়ণ", pieces: ["ন", "গ", "রা", "য়", "ণ"], sound: "nogorayon", meaning: "urbanization", hint: "The growth of cities and urban populations" },
    { word: "বিকেন্দ্রীকরণ", pieces: ["বি", "কে", "ন্দ্রী", "ক", "র", "ণ"], sound: "bikendrikoron", meaning: "decentralization", hint: "Distributing authority away from one central body" },
    { word: "জবাবদিহিতা", pieces: ["জ", "বা", "ব", "দি", "হি", "তা"], sound: "jobabdihita", meaning: "accountability", hint: "The obligation to explain actions and accept responsibility" },
    { word: "সুশাসন", pieces: ["সু", "শা", "স", "ন"], sound: "shushashon", meaning: "good governance", hint: "Effective, fair, and accountable public leadership" },
  ] },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const makeWordOrder = (words) => shuffle(words.map((_, index) => index));

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
      title={status === "error" ? "Google speech was unavailable. Try again." : "Play sound once"}
    >
      {voiceMode === "google" ? <FcGoogle aria-hidden="true" /> : <FaVolumeHigh aria-hidden="true" />}
    </button>
  );
}

function CharacterCard({ character, learned, onLearn, voiceMode, isLooping, onLoop }) {
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
      <div className="alpha-character-actions">
        <button
          className={`alpha-card-loop ${isLooping ? "is-playing" : ""}`}
          type="button"
          onClick={onLoop}
          aria-label={isLooping ? `Stop looping ${character.bn}` : `Loop ${character.bn} continuously`}
          title={isLooping ? "Stop character loop" : "Loop character continuously"}
        >
          {isLooping ? <FaStop aria-hidden="true" /> : <FaRotateRight aria-hidden="true" />}
        </button>
        <button className="alpha-learn-button" type="button" onClick={onLearn}>
          {learned ? <><FaCheck /> Learned</> : "Mark as learned"}
        </button>
      </div>
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
  isLooping: PropTypes.bool.isRequired,
  onLoop: PropTypes.func.isRequired,
};

function VowelMarksSection({ voiceMode }) {
  return (
    <section className="alpha-vowel-marks">
      <div className="alpha-vowel-rule">
        <span>ব্যঞ্জন</span><strong>consonant</strong><b>+</b><span>কার</span><strong>vowel mark</strong><b>=</b><span>নতুন ধ্বনি</span><strong>new sound</strong>
      </div>
      <div className="alpha-vowel-grid">
        {SHORT_VOWEL_MARKS.map((vowel) => (
          <article className="alpha-vowel-card" key={vowel.name}>
            <div className="alpha-vowel-card-top">
              <div><span className="alpha-kicker">{vowel.position.toUpperCase()} THE CONSONANT</span><h3>{vowel.name} <small>( {vowel.mark} )</small></h3></div>
              <AudioButton text={vowel.combined} label={`Hear ${vowel.combined}`} voiceMode={voiceMode} />
            </div>
            <p>{vowel.placement}</p><small className="alpha-placement-bn">{vowel.placementBn}</small>
            <button className="alpha-vowel-equation" type="button" onClick={() => voiceMode === "google" ? speakGoogleBengali(vowel.combined).catch((error) => console.error("Google Bengali speech error:", error)) : speakBengali(vowel.combined)} aria-label={`Hear ${vowel.combined}, ${vowel.romanized}`}>
              <span>{vowel.base}</span><b>+</b><span className="is-mark">{vowel.mark}</span><b>=</b><span className="is-result">{vowel.combined}</span>
            </button>
            <div className="alpha-vowel-pronunciation"><strong>{vowel.combined}</strong><span>{vowel.romanized}</span><em>sound: {vowel.sound}</em></div>
            <div className="alpha-vowel-example"><div><span>Example word</span><strong>{vowel.example}</strong><small>{vowel.exampleSound} · {vowel.meaning}</small></div><AudioButton text={vowel.example} label={`Hear ${vowel.example}`} voiceMode={voiceMode} /></div>
          </article>
        ))}
      </div>
      <div className="alpha-tip"><span>Remember</span>The <strong>ই-কার (ি)</strong> appears visually before the consonant, but you pronounce the consonant first: <strong>ক + ি = কি (ki)</strong>.</div>
    </section>
  );
}

VowelMarksSection.propTypes = { voiceMode: PropTypes.oneOf(["system", "google"]).isRequired };

function ConjunctSection({ voiceMode }) {
  const [level, setLevel] = useState("beginner");
  const [search, setSearch] = useState("");
  const filteredConjuncts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return CONJUNCT_CLUSTERS.filter((cluster) => {
      const matchesLevel = level === "all" || conjunctLevel(cluster.bn) === level;
      const matchesSearch = !query || [cluster.bn, cluster.parts, cluster.example, cluster.word, cluster.meaning]
        .some((value) => value.toLocaleLowerCase().includes(query));
      return matchesLevel && matchesSearch;
    });
  }, [level, search]);

  return (
    <section className="alpha-conjunct-section">
      <div className="alpha-conjunct-controls">
        <label>Search conjuncts or words<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try শ্র, শিক্ষা, or knowledge" /></label>
        <label>Difficulty<select value={level} onChange={(event) => setLevel(event.target.value)}><option value="beginner">Beginner</option><option value="common">Common</option><option value="advanced">Advanced</option><option value="rare">Rare</option><option value="all">All conjuncts</option></select></label>
        <span>{filteredConjuncts.length} of {CONJUNCT_CLUSTERS.length}</span>
      </div>
      <div className="alpha-conjunct-grid">
        {filteredConjuncts.map((cluster) => (
          <article className="alpha-conjunct-card" key={cluster.bn}>
            <div className="alpha-conjunct-top"><strong lang="bn">{cluster.bn}</strong><AudioButton text={cluster.bn} label={`Hear ${cluster.bn}`} voiceMode={voiceMode} /></div>
            <span className="alpha-conjunct-level">{conjunctLevel(cluster.bn)}</span>
            <span className="alpha-conjunct-sound">{cluster.sound}</span>
            <div className="alpha-conjunct-parts" lang="bn">{cluster.parts}</div>
            <div className="alpha-vowel-example"><div><span>Example word</span><strong>{cluster.example}</strong><small>{cluster.word} · {cluster.meaning}</small></div><AudioButton text={cluster.example} label={`Hear ${cluster.example}`} voiceMode={voiceMode} /></div>
          </article>
        ))}
        {!filteredConjuncts.length && <div className="alpha-conjunct-empty">No conjuncts match this search and difficulty.</div>}
      </div>
      <div className="alpha-tip"><span>How conjuncts work</span>A <strong>যুক্তবর্ণ (juktoborno)</strong> forms when a hasanta joins two or more consonants. The written shape and spoken sound can change, so learn each cluster through a familiar word.</div>
    </section>
  );
}

ConjunctSection.propTypes = { voiceMode: PropTypes.oneOf(["system", "google"]).isRequired };

function LearnTopicSection({ section, voiceMode }) {
  return (
    <section className={`alpha-topic-section ${section.id === "reading-practice" ? "is-reading" : ""}`}>
      <div className="alpha-topic-grid">
        {section.items.map((item) => (
          <article className="alpha-topic-card" key={`${section.id}-${item.title}`}>
            <div className="alpha-topic-top">
              <strong lang="bn">{item.bn}</strong>
              <AudioButton text={item.example || item.bn} label={`Hear ${item.example || item.bn}`} voiceMode={voiceMode} />
            </div>
            <span className="alpha-topic-sound">{item.sound}</span>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
            <div className="alpha-topic-example">
              <span>Example</span>
              <strong lang="bn">{item.example}</strong>
              <small>{item.meaning}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="alpha-tip"><span>Practice tip</span>{section.tip}</div>
    </section>
  );
}

LearnTopicSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tip: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      bn: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      sound: PropTypes.string.isRequired,
      example: PropTypes.string.isRequired,
      meaning: PropTypes.string.isRequired,
      note: PropTypes.string.isRequired,
    })).isRequired,
  }).isRequired,
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
  const [gameMode, setGameMode] = useState("sound");
  const [wordClass, setWordClass] = useState(1);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordOrder, setWordOrder] = useState(() => makeWordOrder(WORD_LEVELS[0].words));
  const [wordPieces, setWordPieces] = useState([]);
  const [wordResult, setWordResult] = useState("");
  const [showWordHint, setShowWordHint] = useState(false);
  const [lessonId, setLessonId] = useState(1);
  const [grammarLessonIndex, setGrammarLessonIndex] = useState(0);
  const [translateText, setTranslateText] = useState("");
  const [voiceMode, setVoiceMode] = useState(() => localStorage.getItem("bangla-alphabet-voice") || "system");
  const [isLooping, setIsLooping] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);
  const [loopCharacter, setLoopCharacter] = useState("");
  const activeLearnSection = BENGALI_LEARN_SECTIONS.find((section) => section.id === group);
  const characters = useMemo(() => group === "vowels"
    ? VOWELS
    : group === "consonants"
      ? CONSONANTS
      : group === "vowel-marks"
        ? VOWEL_MARK_CHARACTERS
        : group === "conjuncts"
          ? CONJUNCT_CLUSTERS
          : [], [group]);
  const playbackCharacters = useMemo(
    () => loopCharacter ? characters.filter((character) => character.bn === loopCharacter) : characters,
    [characters, loopCharacter],
  );

  useEffect(() => {
    localStorage.setItem("bangla-alphabet-progress", JSON.stringify(learned));
  }, [learned]);

  useEffect(() => {
    localStorage.setItem("bangla-alphabet-voice", voiceMode);
    window.speechSynthesis?.cancel();
  }, [voiceMode]);

  useEffect(() => {
    if (!isLooping) return undefined;

    let cancelled = false;
    let activeAudio;
    let pauseTimer;

    const wait = (duration) => new Promise((resolve) => {
      pauseTimer = window.setTimeout(resolve, duration);
    });

    const playSystemVoice = (text) => new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "bn-BD";
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });

    const playGoogleVoice = async (text) => {
      const audioUrl = URL.createObjectURL(await getGoogleTtsAudio(text, "bn-IN"));
      await new Promise((resolve) => {
        activeAudio = new Audio(audioUrl);
        const finish = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudio = undefined;
          resolve();
        };
        activeAudio.addEventListener("ended", finish, { once: true });
        activeAudio.addEventListener("error", finish, { once: true });
        activeAudio.play().catch(finish);
      });
    };

    const runLoop = async () => {
      let index = loopIndex;
      while (!cancelled) {
        setLoopIndex(index);
        try {
          if (voiceMode === "google") {
            await playGoogleVoice(playbackCharacters[index].bn);
          } else {
            await playSystemVoice(playbackCharacters[index].bn);
          }
        } catch (error) {
          console.error("Bengali character loop error:", error);
        }
        if (cancelled) return;
        await wait(550);
        index = (index + 1) % playbackCharacters.length;
      }
    };

    runLoop();
    return () => {
      cancelled = true;
      window.clearTimeout(pauseTimer);
      window.speechSynthesis?.cancel();
      activeAudio?.pause();
    };
  }, [isLooping, loopIndex, playbackCharacters, voiceMode]);

  useEffect(() => {
    setIsLooping(false);
    setLoopIndex(0);
    setLoopCharacter("");
  }, [group]);

  const progress = Math.round((learned.length / allCharacters.length) * 100);
  const activeLesson = LESSONS.find((lesson) => lesson.id === lessonId);
  const activeGrammarLesson = GRAMMAR_LESSONS[grammarLessonIndex];
  const activeSection = TABS.find((section) => section.id === tab);
  const ActiveSectionIcon = activeSection.icon;
  const activeWordLevel = WORD_LEVELS[wordClass - 1];
  const activeWordSet = activeWordLevel.words;
  const activeWord = activeWordSet[wordOrder[wordIndex] ?? wordIndex];
  const availablePieces = useMemo(
    () => shuffle([
      ...activeWord.pieces,
      ...activeWordSet[wordOrder[(wordIndex + 1) % activeWordSet.length] ?? ((wordIndex + 1) % activeWordSet.length)].pieces
        .filter((piece) => !activeWord.pieces.includes(piece))
        .slice(0, 2),
    ]),
    [activeWord, activeWordSet, wordIndex, wordOrder],
  );

  function toggleLearned(character) {
    setLearned((current) => current.includes(character)
      ? current.filter((item) => item !== character)
      : [...current, character]);
  }

  function chooseAnswer(choice) {
    if (answer) return;
    setAnswer(choice);
    const correct = choice === (gameMode === "sound" ? quiz.target.sound : quiz.target.meaning);
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

  function resetWord(nextIndex = wordIndex) {
    setWordIndex(nextIndex);
    setWordPieces([]);
    setWordResult("");
    setShowWordHint(false);
  }

  function changeWordClass(nextClass) {
    const nextWords = WORD_LEVELS[nextClass - 1].words;
    setWordClass(nextClass);
    setWordOrder(makeWordOrder(nextWords));
    setWordIndex(0);
    setWordPieces([]);
    setWordResult("");
    setShowWordHint(false);
  }

  function nextRandomWord() {
    if (wordIndex < activeWordSet.length - 1) {
      resetWord(wordIndex + 1);
      return;
    }

    const nextOrder = makeWordOrder(activeWordSet);
    const previousWordIndex = wordOrder[wordIndex];
    if (nextOrder.length > 1 && nextOrder[0] === previousWordIndex) {
      [nextOrder[0], nextOrder[1]] = [nextOrder[1], nextOrder[0]];
    }
    setWordOrder(nextOrder);
    resetWord(0);
  }

  function checkWord() {
    const isCorrect = wordPieces.join("") === activeWord.word;
    setWordResult(isCorrect ? "correct" : "wrong");
    if (!isCorrect) return;
    if (voiceMode === "google") {
      speakGoogleBengali(activeWord.word).catch((error) => console.error("Google Bengali speech error:", error));
    } else {
      speakBengali(activeWord.word);
    }
  }

  return (
    <div className="alpha-page">
      <div className="alpha-shell">
        <section className="alpha-hero">
          <div className="alpha-hero-copy">
            <span className="alpha-kicker">বাংলা ব্যাকরণ · BENGALI GRAMMAR</span>
            <h1>Build your Bengali,<br /><span>অক্ষর থেকে শব্দ</span>.</h1>
            <p>Learn characters, join them into useful words, and grow your grammar through playful challenges.</p>
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
              <span>Your Bengali grammar journey</span>
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

        <nav className="alpha-section-picker" aria-label="Bengali grammar sections">
          <div>
            <span className="alpha-section-picker-icon"><ActiveSectionIcon aria-hidden="true" /></span>
            <label htmlFor="alpha-section-select"><small>CHOOSE A SECTION</small><strong>{activeSection.label}</strong></label>
          </div>
          <select id="alpha-section-select" value={tab} onChange={(event) => setTab(event.target.value)}>
            {TABS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </nav>

        {tab === "learn" && (
          <main className="alpha-content">
            <div className="alpha-section-heading">
              <div>
                <span className="alpha-kicker">{activeLearnSection ? `${activeLearnSection.bnTitle} · GUIDED TOPIC` : group === "vowel-marks" ? "কারচিহ্ন · ALL VOWEL MARKS" : group === "conjuncts" ? "যুক্তবর্ণ · CONJUNCTS" : "CHARACTER LIBRARY"}</span>
                <h2>{activeLearnSection?.title || (group === "vowel-marks" ? "Marks that change a consonant" : group === "conjuncts" ? "Meet the joined consonants" : "Meet the Bangla characters")}</h2>
                <p>{activeLearnSection?.description || (group === "vowel-marks" ? "Learn all ten dependent vowel signs, where they appear, and how they sound inside words." : group === "conjuncts" ? "See how consonants join through a hasanta and learn the cluster through a familiar word." : "Tap the speaker to hear a letter. Use each example word to remember its sound.")}</p>
              </div>
              <div className="alpha-learn-controls">
                <div className="alpha-segmented">
                  <button className={group === "vowels" ? "active" : ""} type="button" onClick={() => setGroup("vowels")}>Vowels · স্বরবর্ণ</button>
                  <button className={group === "consonants" ? "active" : ""} type="button" onClick={() => setGroup("consonants")}>Consonants · ব্যঞ্জনবর্ণ</button>
                  <button className={group === "vowel-marks" ? "active" : ""} type="button" onClick={() => setGroup("vowel-marks")}>Vowel sounds · কার</button>
                  <button className={group === "conjuncts" ? "active" : ""} type="button" onClick={() => setGroup("conjuncts")}>Conjuncts · যুক্তবর্ণ</button>
                </div>
                <label className="alpha-learn-topic-select">
                  <span>More lessons · আরও পাঠ</span>
                  <select value={activeLearnSection?.id || ""} onChange={(event) => event.target.value && setGroup(event.target.value)}>
                    <option value="" disabled>Choose a guided topic</option>
                    {BENGALI_LEARN_SECTIONS.map((section, index) => <option key={section.id} value={section.id}>{index + 2}. {section.title} · {section.bnTitle}</option>)}
                  </select>
                </label>
                {!activeLearnSection && <button
                  className={`alpha-loop-button ${isLooping ? "is-playing" : ""}`}
                  type="button"
                  onClick={() => {
                    setLoopCharacter("");
                    setLoopIndex(0);
                    setIsLooping((current) => loopCharacter ? true : !current);
                  }}
                >
                  {isLooping && !loopCharacter ? <><FaStop /> Stop loop</> : <><FaRotateRight /> Loop {group}</>}
                </button>}
              </div>
            </div>
            {isLooping && playbackCharacters.length > 0 && (
              <div className="alpha-now-playing" role="status">
                <span className="alpha-now-playing-bars" aria-hidden="true"><i /><i /><i /></span>
                <span>Now playing</span>
                <strong lang="bn">{playbackCharacters[loopIndex].bn}</strong>
                <small>{playbackCharacters[loopIndex].sound} · repeats continuously</small>
              </div>
            )}
            {(group === "vowels" || group === "consonants") && <div className="alpha-character-grid">
              {characters.map((character) => (
                <CharacterCard
                  key={character.bn}
                  character={character}
                  learned={learned.includes(character.bn)}
                  onLearn={() => toggleLearned(character.bn)}
                  voiceMode={voiceMode}
                  isLooping={isLooping && loopCharacter === character.bn}
                  onLoop={() => {
                    const stoppingCurrent = isLooping && loopCharacter === character.bn;
                    setLoopIndex(0);
                    setLoopCharacter(stoppingCurrent ? "" : character.bn);
                    setIsLooping(!stoppingCurrent);
                  }}
                />
              ))}
            </div>}
            {group === "vowel-marks" && <VowelMarksSection voiceMode={voiceMode} />}
            {group === "conjuncts" && <ConjunctSection voiceMode={voiceMode} />}
            {activeLearnSection && <LearnTopicSection section={activeLearnSection} voiceMode={voiceMode} />}
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

        {tab === "grammar" && (
          <main className="alpha-content alpha-grammar-lessons">
            <div className="alpha-section-heading">
              <div>
                <span className="alpha-kicker">ব্যাকরণ পাঠ · GRAMMAR PATH</span>
                <h2>Build sentences that sound natural</h2>
                <p>Move from pronouns and word order to questions, verb forms, and respectful everyday speech.</p>
              </div>
              <label className="alpha-lesson-select">Lesson
                <select value={grammarLessonIndex} onChange={(event) => setGrammarLessonIndex(Number(event.target.value))}>
                  {GRAMMAR_LESSONS.map((lesson, index) => <option key={lesson.title} value={index}>{index + 1}. {lesson.title}</option>)}
                </select>
              </label>
            </div>
            <div className="alpha-grammar-progress" aria-label={`Grammar lesson ${grammarLessonIndex + 1} of ${GRAMMAR_LESSONS.length}`}>
              {GRAMMAR_LESSONS.map((lesson, index) => <button key={lesson.title} type="button" className={index === grammarLessonIndex ? "active" : ""} onClick={() => setGrammarLessonIndex(index)} aria-label={`Open lesson ${index + 1}: ${lesson.title}`}>{index + 1}</button>)}
            </div>
            <article className="alpha-grammar-card">
              <header>
                <span className="alpha-kicker">LESSON {String(grammarLessonIndex + 1).padStart(2, "0")}</span>
                <h3>{activeGrammarLesson.title}</h3>
                <strong lang="bn">{activeGrammarLesson.bnTitle}</strong>
                <p>{activeGrammarLesson.description}</p>
              </header>
              <div className="alpha-grammar-pattern"><span>Sentence pattern</span><strong>{activeGrammarLesson.pattern}</strong></div>
              <div className="alpha-grammar-examples">
                {activeGrammarLesson.examples.map(([bengali, romanized, meaning], index) => (
                  <div key={bengali}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <button type="button" onClick={() => voiceMode === "google" ? speakGoogleBengali(bengali).catch((error) => console.error("Google Bengali speech error:", error)) : speakBengali(bengali)}>
                      <strong lang="bn">{bengali}</strong><small>{romanized}</small>
                    </button>
                    <p>{meaning}</p>
                    <AudioButton text={bengali} label={`Hear ${bengali}`} voiceMode={voiceMode} />
                  </div>
                ))}
              </div>
              <div className="alpha-tip"><span>Grammar note</span>{activeGrammarLesson.tip}</div>
              <div className="alpha-grammar-actions">
                <button type="button" disabled={grammarLessonIndex === 0} onClick={() => setGrammarLessonIndex((current) => current - 1)}>Previous</button>
                <button className="alpha-primary-button" type="button" onClick={() => setGrammarLessonIndex((current) => (current + 1) % GRAMMAR_LESSONS.length)}>Next lesson <FaArrowRight /></button>
              </div>
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

        {tab === "words" && (
          <main className="alpha-content alpha-word-workshop">
            <div className="alpha-section-heading">
              <div>
                <span className="alpha-kicker">শব্দ গঠন · WORD WORKSHOP</span>
                <h2>Make a Bengali word</h2>
                <p>Tap the sound blocks in the right order. Watch each small part become a word you can use.</p>
              </div>
              <label className="alpha-word-class-select">Difficulty level
                <select value={wordClass} onChange={(event) => changeWordClass(Number(event.target.value))}>
                  {WORD_LEVELS.map((level) => <option key={level.classNumber} value={level.classNumber}>Class {level.classNumber}</option>)}
                </select>
              </label>
            </div>
            <div className="alpha-word-level-bar">
              <div><span>CLASS {wordClass}</span><strong>{activeWordLevel.focus}</strong></div>
              <span className="alpha-challenge-count">Word {wordIndex + 1} of {activeWordSet.length}</span>
            </div>
            <section className="alpha-word-board">
              <div className="alpha-word-clue">
                <span className="alpha-kicker">YOUR CLUE</span>
                <strong>{activeWord.meaning}</strong>
                <small>{activeWord.sound}</small>
                <button type="button" onClick={() => setShowWordHint((current) => !current)}>
                  <FaLightbulb /> {showWordHint ? activeWord.hint : "Show a hint"}
                </button>
              </div>
              <div className="alpha-word-play">
                <div className={`alpha-word-slots ${wordResult}`} aria-label="Your word">
                  {wordPieces.length ? wordPieces.map((piece, index) => (
                    <button type="button" key={`${piece}-${index}`} onClick={() => { setWordPieces((current) => current.filter((_, itemIndex) => itemIndex !== index)); setWordResult(""); }}>
                      {piece}
                    </button>
                  )) : <span>এখানে অক্ষর বসাও · build here</span>}
                </div>
                <div className="alpha-word-bank" aria-label="Available word pieces">
                  {availablePieces.map((piece, index) => (
                    <button type="button" key={`${piece}-${index}`} onClick={() => { setWordPieces((current) => [...current, piece]); setWordResult(""); }}>{piece}</button>
                  ))}
                </div>
                {wordResult && <div className={`alpha-word-feedback ${wordResult}`} role="status">{wordResult === "correct" ? `দারুণ! ${activeWord.word} means ${activeWord.meaning}.` : "Almost! Tap a block above to remove it and try again."}</div>}
                <div className="alpha-word-actions">
                  <button type="button" onClick={() => resetWord()}><FaRotateRight /> Clear</button>
                  <button className="alpha-primary-button" type="button" onClick={wordResult === "correct" ? nextRandomWord : checkWord} disabled={!wordPieces.length}>
                    {wordResult === "correct" ? <>Next word <FaArrowRight /></> : <>Check word <FaCheck /></>}
                  </button>
                </div>
              </div>
            </section>
          </main>
        )}

        {tab === "games" && (
          <main className="alpha-content alpha-game-layout">
            <section className="alpha-game-card">
              <div className="alpha-game-switcher" aria-label="Choose a game">
                <button type="button" className={gameMode === "sound" ? "active" : ""} onClick={() => { setGameMode("sound"); nextQuestion(); }}>Sound match</button>
                <button type="button" className={gameMode === "meaning" ? "active" : ""} onClick={() => { setGameMode("meaning"); nextQuestion(); }}>Word meaning</button>
              </div>
              <span className="alpha-kicker">{gameMode === "sound" ? "SOUND MATCH" : "MEANING MATCH"}</span>
              <h2>{gameMode === "sound" ? "Which sound matches?" : "What does this word mean?"}</h2>
              <p>{gameMode === "sound" ? "Choose the Romanized sound for this character." : "Read the example word and choose its English meaning."}</p>
              <div className="alpha-game-glyph">{quiz.target.bn}</div>
              {gameMode === "meaning" && <strong className="alpha-game-word">{quiz.target.example}</strong>}
              <AudioButton text={quiz.target.bn} label={`Hear ${quiz.target.bn}`} voiceMode={voiceMode} />
              <div className="alpha-game-options">
                {(gameMode === "sound" ? quiz.options : quiz.meanings).map((option) => {
                  const correctAnswer = gameMode === "sound" ? quiz.target.sound : quiz.target.meaning;
                  const isCorrect = answer && option === correctAnswer;
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
                  <span>{answer === (gameMode === "sound" ? quiz.target.sound : quiz.target.meaning) ? "শাবাশ! Great work." : `The answer is ${gameMode === "sound" ? quiz.target.sound : quiz.target.meaning}.`}</span>
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
  const meaningDistractors = shuffle(items.filter((item) => item.meaning !== target.meaning)).slice(0, 3);
  return {
    target,
    options: shuffle([target, ...distractors]).map((item) => item.sound),
    meanings: shuffle([target, ...meaningDistractors]).map((item) => item.meaning),
  };
}

const GLOSSES = {
  "আমি": "I", "আমরা": "we", "আমার": "my", "আমাদের": "our", "আমাকে": "me", "তুমি": "you (familiar)",
  "তোমরা": "you all", "তোমার": "your", "আপনি": "you (polite)", "আপনারা": "you all (polite)", "সে": "he / she",
  "তিনি": "he / she (respectful)", "তারা": "they", "এটা": "this", "এটি": "this", "ওটা": "that", "এই": "this",
  "ওই": "that", "কে": "who", "কি": "what / question marker", "কোথায়": "where", "কোথা": "where",
  "এক": "one", "একটি": "one / a", "একজন": "one person", "দুই": "two", "তিনজন": "three people", "চারটি": "four",
  "পাঁচটি": "five", "ছয়জন": "six people", "সাত": "seven", "আটটায়": "at eight", "নয়টায়": "at nine",
  "দশ": "ten", "দশটা": "ten o'clock", "এগারোজন": "eleven people", "বারো": "twelve", "শূন্য": "zero",
  "আজ": "today", "কাল": "tomorrow / yesterday", "এখন": "now", "এখনো": "still", "এখানে": "here", "সেখানে": "there",
  "সকাল": "morning", "সকালে": "in the morning", "দুপুরে": "at noon", "রাত": "night", "রাতে": "at night",
  "প্রতিদিন": "every day", "সবসময়": "always", "কখনো": "sometimes / ever", "কখনোই": "ever", "আবার": "again",
  "খুব": "very", "অনেক": "very / many", "বেশ": "quite", "দ্রুত": "quickly", "ধীরে": "slowly", "সময়মতো": "on time",
  "এবং": "and", "আর": "and / also", "অথবা": "or", "কিন্তু": "but", "কারণ": "because", "তাই": "so",
  "যদি": "if", "তবে": "then", "যদিও": "although", "যখন": "when", "যতক্ষণ": "as long as", "নইলে": "otherwise",
  "উপরে": "on / above", "নিচে": "under / below", "সামনে": "in front of", "পিছনে": "behind", "পাশে": "beside",
  "কাছে": "near / with", "থেকে": "from", "পর্যন্ত": "until", "জন্য": "for", "সঙ্গে": "with", "ছাড়া": "without",
  "মধ্যে": "inside / among", "দিয়ে": "through / with", "টেবিলে": "on the table", "টেবিলের": "of the table",
  "বাড়ি": "house / home", "বাড়িতে": "at home", "বাড়ির": "of the house", "বাড়িটি": "the house", "স্কুল": "school",
  "স্কুলে": "to school", "স্কুলটি": "the school", "বই": "book", "বইটি": "the book", "বন্ধু": "friend",
  "বন্ধুর": "friend's", "পরিবার": "family", "পানি": "water", "খাবার": "food", "খাবারটি": "the food", "সময়": "time",
  "দিন": "day", "রাস্তা": "road", "শহর": "city", "চা": "tea", "কফি": "coffee", "মা": "mother", "বাবা": "father",
  "মানুষটি": "the person", "কলম": "pen", "ব্যাগ": "bag", "ব্যাগটি": "the bag", "ছবি": "picture", "গান": "song / music",
  "ভাত": "rice", "ফল": "fruit", "আকাশ": "sky", "জানালা": "window", "বৃষ্টি": "rain", "আবহাওয়া": "weather",
  "ভালো": "good", "খারাপ": "bad", "বড়": "big", "ছোট": "small", "নতুন": "new", "পুরোনো": "old",
  "সুন্দর": "beautiful", "সহজ": "easy", "কঠিন": "difficult", "গরম": "hot", "ঠান্ডা": "cold", "লাল": "red",
  "ব্যস্ত": "busy", "ক্লান্ত": "tired", "প্রিয়": "favorite", "প্রস্তুত": "ready", "খোলা": "open",
  "অপেক্ষা": "wait", "আম": "mango", "উপহারটি": "the gift", "একসঙ্গে": "together", "এলে": "if (you) come",
  "কথা": "speech / words", "কাজ": "work", "কাজটি": "the task", "কাপ": "cup", "কেমন": "how",
  "ক্লাসে": "in the class", "খেলোয়াড়": "player", "গাড়িটি": "the car", "ঘরে": "in the room", "চলো": "let us go",
  "চিঠি": "letter", "চেষ্টা": "try", "ছাত্র": "student", "ঝুড়িতে": "in the basket", "ডাক্তার": "doctor",
  "ঢাকা": "Dhaka", "ঢাকায়": "in / to Dhaka", "দরজায়": "at the door", "দলে": "on the team", "দেরি": "late",
  "দোকান": "shop", "দোকানটি": "the shop", "নিতে": "to take", "পছন্দ": "like / preference", "প্রশ্নটি": "the question",
  "বছরে": "in a year", "বাংলা": "Bengali", "বাংলায়": "in Bengali", "বাক্সের": "of the box", "বাগানটি": "the garden",
  "বাসটি": "the bus", "বিড়ালটি": "the cat", "ব্যায়াম": "exercise", "ভুলের": "of mistakes", "মাস": "month",
  "মিথ্যা": "lie / falsehood", "মিনিট": "minute", "রাহিম": "Rahim", "শিক্ষক": "teacher", "শুরু": "start",
  "শেষ": "finished / end", "সংখ্যা": "number", "সপ্তাহে": "in a week", "স্টেশনে": "to the station",
  "আছি": "am", "আছে": "is / has", "আছেন": "are (respectful)", "থাকি": "live / stay", "থাকে": "lives / stays",
  "থাকব": "will stay", "হয়": "is / happens", "হতে": "to become", "হবে": "will be", "হচ্ছে": "is happening",
  "করি": "do", "করব": "will do", "করে": "does", "করুন": "please do", "যাই": "go", "যায়": "goes",
  "যাব": "will go", "যাচ্ছি": "am going", "যাচ্ছ": "are going", "আসে": "comes", "আসি": "come", "আসব": "will come",
  "এসেছি": "have come", "এসেছেন": "have come (respectful)", "খাই": "eat", "খেতে": "to eat", "দেখি": "see",
  "বলি": "say", "বলুন": "please say", "বলেন": "says (respectful)", "শুনি": "listen", "পড়ি": "read",
  "লেখে": "writes", "নিই": "take", "দেন": "gives", "পারি": "can", "পারো": "can (familiar)", "চাই": "want",
  "শিখছি": "am learning", "হাঁটে": "walks", "বাঁচতে": "to live", "কিনেছি": "bought", "রাখা": "placed",
  "দয়া": "kindness / please", "না": "not", "নয়": "is not", "নেই": "does not have"
};

const cleanTokens = (value) => String(value || "").trim().split(/\s+/).map((token) => token.replace(/[।,?!]/g, "")).filter(Boolean);

export const buildPhraseWords = (phrase) => {
  if (Array.isArray(phrase?.words) && phrase.words.length) return phrase.words;
  const bengali = cleanTokens(phrase?.bn);
  const pronunciation = cleanTokens(phrase?.pronunciation);
  return bengali.map((bn, index) => ({
    bn,
    pronunciation: pronunciation[index] || bn,
    en: GLOSSES[bn] || `part of “${phrase.en}”`,
  }));
};

export const withPhraseWords = (lesson) => ({
  ...lesson,
  phrases: (lesson?.phrases || []).map((phrase) => ({ ...phrase, words: buildPhraseWords(phrase) })),
});

export const phraseBreakdownItems = (lesson) => (lesson?.phrases || []).map((phrase) => ({
  ...phrase,
  words: buildPhraseWords(phrase),
}));

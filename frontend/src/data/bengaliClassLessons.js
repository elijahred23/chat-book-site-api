import { WORD_LEVELS } from "../pages/BengaliAlphabet.jsx";
import { BENGALI_CLASS_ONE_LESSON } from "./bengaliClassOneLesson.js";
import { BENGALI_CLASS_TWO_LESSON } from "./bengaliClassTwoLesson.js";
import { BENGALI_CLASS_THREE_LESSON } from "./bengaliClassThreeLesson.js";
import { BENGALI_CLASS_FOUR_LESSON } from "./bengaliClassFourLesson.js";

const CLASS_PHRASES = {
  1: [
    ["এটা একটি আম।", "eta ekti am", "This is a mango."],
    ["আমার একটি বই আছে।", "amar ekti boi achhe", "I have a book."],
    ["ফুলটি লাল।", "phulti lal", "The flower is red."],
    ["আমি জল খাই।", "ami jol khai", "I drink water."],
    ["ঘরে আলো আছে।", "ghore alo achhe", "There is light in the room."],
    ["আমার দুই হাত।", "amar dui hat", "I have two hands."],
    ["আজ দিনটি সুন্দর।", "aj dinti shundor", "Today is a beautiful day."],
    ["রাতে চাঁদ ওঠে।", "rate chad othe", "The moon rises at night."],
  ],
  2: [
    ["আমার মা বাড়িতে আছেন।", "amar ma baṛite achhen", "My mother is at home."],
    ["বাবা কাজ করেন।", "baba kaj koren", "Father works."],
    ["আমার এক ভাই ও এক বোন আছে।", "amar ek bhai o ek bon achhe", "I have one brother and one sister."],
    ["বিড়াল দুধ খায়।", "biṛal dudh khay", "The cat drinks milk."],
    ["পাখি আকাশে ওড়ে।", "pakhi akashe oṛe", "The bird flies in the sky."],
    ["গরু মাঠে ঘাস খায়।", "goru mathe ghash khay", "The cow eats grass in the field."],
    ["বাঘ বনে থাকে।", "bagh bone thake", "The tiger lives in the forest."],
    ["প্রজাপতি ফুলে বসে।", "projapoti phule boshe", "The butterfly sits on a flower."],
  ],
  3: [
    ["আমি বিদ্যালয়ে যাই।", "ami bidyaloye jai", "I go to school."],
    ["শিক্ষক পাঠ পড়ান।", "shikkhok path poṛan", "The teacher teaches the lesson."],
    ["আমি খাতায় লিখি।", "ami khatay likhi", "I write in the notebook."],
    ["পেন্সিলটি ব্যাগে আছে।", "pensilti byage achhe", "The pencil is in the bag."],
    ["বোর্ডে একটি মানচিত্র আছে।", "borde ekti manchitro achhe", "There is a map on the board."],
    ["আমরা গ্রন্থাগারে বই পড়ি।", "amra gronthagare boi poṛi", "We read books in the library."],
    ["আগামীকাল গণিত পরীক্ষা।", "agamikal gonit porikkha", "The mathematics exam is tomorrow."],
    ["ছুটির পরে আমরা মাঠে খেলি।", "chhutir pore amra mathe kheli", "We play in the field after school."],
  ],
  4: [
    ["চাবি দিয়ে দরজা খোলো।", "chabi diye dorja kholo", "Open the door with the key."],
    ["কুকুরটি বাড়ির সামনে আছে।", "kukurti baṛir shamne achhe", "The dog is in front of the house."],
    ["কৃষক নদীর পাশে কাজ করেন।", "krishok nodir pashe kaj koren", "The farmer works beside the river."],
    ["সূর্য সকালে ওঠে।", "shurjo shokale othe", "The sun rises in the morning."],
    ["মেঘ দেখে নৌকা ফিরল।", "megh dekhe nouka phirlo", "The boat returned after seeing the clouds."],
    ["শিশুটি দোলনায় খেলছে।", "shishuti dolnay khelchhe", "The child is playing on the swing."],
    ["ময়ূরটি খুব সুন্দর।", "moyurti khub shundor", "The peacock is very beautiful."],
    ["ভোরের রোদ ভালো লাগে।", "bhorer rod bhalo lage", "The morning sunshine feels pleasant."],
  ],
  5: [
    ["নতুন বইটি খুব সুন্দর।", "notun boiti khub shundor", "The new book is very beautiful."],
    ["গরম চা ধীরে খাও।", "gorom cha dhire khao", "Drink the hot tea slowly."],
    ["আজ পানি খুব ঠান্ডা।", "aj pani khub thanda", "The water is very cold today."],
    ["ছেলেটি সাহসী ও সৎ।", "chheleti shahoshi o shot", "The boy is brave and honest."],
    ["মেয়েটি বুদ্ধিমান ও দয়ালু।", "meyeti buddhiman o doyalu", "The girl is intelligent and kind."],
    ["ছোট পাখিটি দ্রুত ওড়ে।", "chhoto pakhiti druto oṛe", "The small bird flies quickly."],
    ["পুরোনো কাপড়টি নরম।", "purono kapoṛti norom", "The old cloth is soft."],
    ["রঙিন ঘরটি পরিষ্কার।", "rongin ghorti porishkar", "The colorful room is clean."],
  ],
  6: [
    ["বন্ধুর প্রশ্নটি স্পষ্ট।", "bondhur proshnoti sposhto", "The friend's question is clear."],
    ["স্বপ্ন মনে রাখা কঠিন।", "shopno mone rakha kothin", "Remembering dreams is difficult."],
    ["শক্তি দিয়ে যন্ত্রটি চালাও।", "shokti diye jontroti chalao", "Run the machine with power."],
    ["কেন্দ্র থেকে ত্রাণ এসেছে।", "kendro theke tran eshechhe", "Relief has arrived from the center."],
    ["ফুলের গন্ধ আমার স্মৃতিতে আছে।", "phuler gondho amar smritite achhe", "The flower's scent remains in my memory."],
    ["সৃষ্টির মধ্যে আনন্দ আছে।", "srishtir moddhe anondo achhe", "There is joy in creation."],
    ["গ্রামের মানুষ কষ্ট করে।", "gramer manush koshto kore", "Village people work hard."],
    ["জ্ঞান মানুষের বড় সম্পদ।", "ggan manusher boṛo shompod", "Knowledge is a person's great wealth."],
  ],
  7: [
    ["বন্ধুত্ব বিশ্বাসের ওপর দাঁড়ায়।", "bondhutto bishshasher upor daṛay", "Friendship stands on trust."],
    ["ভালোবাসা ও স্নেহ মানুষকে কাছে আনে।", "bhalobasha o sneho manushke kachhe ane", "Love and affection bring people closer."],
    ["ভয়ের সময় সাহস দরকার।", "bhoyer shomoy shahosh dorkar", "Courage is needed during fear."],
    ["রাগের বদলে ক্ষমা বেছে নাও।", "rager bodole khoma bechhe nao", "Choose forgiveness instead of anger."],
    ["কৌতূহল থেকে জ্ঞান জন্মায়।", "koutuhol theke ggan jonmay", "Knowledge grows from curiosity."],
    ["ধৈর্য ও আশা আমাদের শক্তি দেয়।", "dhoirjo o asha amader shokti dey", "Patience and hope give us strength."],
    ["সত্য বললে সম্মান বাড়ে।", "shotto bolle shomman baṛe", "Speaking the truth increases respect."],
    ["কৃতজ্ঞতা সুখ বাড়ায়।", "kritoggota shukh baṛay", "Gratitude increases happiness."],
  ],
  8: [
    ["বিজ্ঞান প্রকৃতিকে বুঝতে সাহায্য করে।", "biggan prokritike bujhte shahajjo kore", "Science helps us understand nature."],
    ["গণিতে উপাত্ত বিশ্লেষণ করা হয়।", "gonite upatto bishleshon kora hoy", "Data is analyzed in mathematics."],
    ["জীববিজ্ঞান জীবের গঠন শেখায়।", "jibobiggan jiber gothon shekhay", "Biology teaches the structure of living things."],
    ["ইতিহাস থেকে আমরা অতীত জানি।", "itihash theke amra otit jani", "We learn about the past from history."],
    ["ব্যাকরণ ভাষার নিয়ম বোঝায়।", "byakoron bhashar niyom bojhay", "Grammar explains the rules of language."],
    ["গবেষণাগারে পরীক্ষণ চলছে।", "gobeshonagare porikkhon cholchhe", "An experiment is underway in the laboratory."],
    ["অভিধানে শব্দের অর্থ পাওয়া যায়।", "obhidane shobder ortho paoa jay", "Word meanings can be found in a dictionary."],
    ["বিশ্ববিদ্যালয়ে উচ্চশিক্ষা দেওয়া হয়।", "bishshobidyaloye uchchoshikkha deoa hoy", "Higher education is provided at a university."],
  ],
  9: [
    ["সংবিধান নাগরিকের অধিকার রক্ষা করে।", "shongbidhan nagoriker odhikar rokkha kore", "The constitution protects citizens' rights."],
    ["নির্বাচনে নাগরিকরা ভোট দেন।", "nirbachone nagorikra vote den", "Citizens vote in an election."],
    ["সংসদে নতুন আইন নিয়ে আলোচনা হয়।", "shongshode notun ain niye alochona hoy", "New laws are discussed in parliament."],
    ["উন্নয়নের জন্য ভালো শিক্ষা দরকার।", "unnoyoner jonno bhalo shikkha dorkar", "Good education is needed for development."],
    ["কৃষি দেশের অর্থনীতিতে গুরুত্বপূর্ণ।", "krishi desher orthonitite guruttopurno", "Agriculture is important to the country's economy."],
    ["দূষণ পরিবেশ ও স্বাস্থ্যের ক্ষতি করে।", "dushon poribesh o shasther khoti kore", "Pollution harms the environment and health."],
    ["দুর্যোগের সময় যোগাযোগ জরুরি।", "durjoger shomoy jogajog joruri", "Communication is essential during a disaster."],
    ["অবকাঠামো পরিবহন সহজ করে।", "obokathamo poribohon shohoj kore", "Infrastructure makes transportation easier."],
  ],
  10: [
    ["গণতন্ত্রে মতপ্রকাশের স্বাধীনতা গুরুত্বপূর্ণ।", "gonotontre motoprokasher shadhinota guruttopurno", "Freedom of expression is important in a democracy."],
    ["সাম্য ও ন্যায়বিচার মানবতার ভিত্তি।", "shammo o nyaybichar manobotar bhitti", "Equality and justice are foundations of humanity."],
    ["বৈচিত্র্যের মধ্যেও ঐক্য সম্ভব।", "boichitrer moddheo oikko shombhob", "Unity is possible within diversity."],
    ["সহিষ্ণুতা শান্তিপূর্ণ সহাবস্থান গড়ে।", "shohishnuta shantipurno shohabosthan goṛe", "Tolerance builds peaceful coexistence."],
    ["নৈতিকতা আমাদের সিদ্ধান্তকে পথ দেখায়।", "noitikota amader shiddhantoke poth dekhay", "Morality guides our decisions."],
    ["সার্বভৌমত্ব একটি রাষ্ট্রের মৌলিক অধিকার।", "sharbobhoumotto ekti rashtorer moulik odhikar", "Sovereignty is a fundamental right of a state."],
    ["যুক্তিবাদ চিন্তায় স্পষ্টতা আনে।", "juktibad chintay sposhtota ane", "Rationalism brings clarity to thought."],
    ["সংস্কৃতি ও ঐতিহ্য পরিচয় গড়ে।", "shongskriti o oitijjho porichoy goṛe", "Culture and heritage shape identity."],
  ],
  11: [
    ["রূপক কবিতার অর্থ গভীর করে।", "rupok kobitar ortho gobhir kore", "Metaphor deepens the meaning of poetry."],
    ["উপমা দুটি বিষয়ের তুলনা করে।", "upoma duti bishoyer tulona kore", "A simile compares two things."],
    ["উপন্যাসের নায়ক একটি জটিল চরিত্র।", "uponnasher nayok ekti jotil choritro", "The novel's protagonist is a complex character."],
    ["সংলাপ আখ্যানকে জীবন্ত করে।", "shonglap akhyanke jibonto kore", "Dialogue makes a narrative vivid."],
    ["সমালোচনায় ভিন্ন দৃষ্টিভঙ্গি থাকতে পারে।", "shomalochonay bhinno drishtibhongi thakte pare", "Criticism can contain different perspectives."],
    ["প্রতীকবাদ কল্পনাশক্তিকে জাগিয়ে তোলে।", "protikbad kolponashoktike jagiye tole", "Symbolism awakens the imagination."],
    ["আত্মবিশ্লেষণ ব্যক্তিস্বাতন্ত্র্য বুঝতে সাহায্য করে।", "attobishleshon bektishatontro bujhte shahajjo kore", "Introspection helps us understand individuality."],
    ["সাহিত্যে মানবতাবাদ মানুষের মর্যাদা তুলে ধরে।", "shahitte manobotabad manusher morjada tule dhore", "Humanism in literature highlights human dignity."],
  ],
  12: [
    ["জীববৈচিত্র্য একটি সুস্থ বাস্তুতন্ত্র রক্ষা করে।", "jiboboichitro ekti shustho bastutontro rokkha kore", "Biodiversity supports a healthy ecosystem."],
    ["সালোকসংশ্লেষণে উদ্ভিদ খাদ্য তৈরি করে।", "salokshongshleshoney udbhid khaddo toiri kore", "Plants make food through photosynthesis."],
    ["অ্যালগরিদম ধাপে ধাপে সমস্যা সমাধান করে।", "algorithm dhape dhape shomoshsha shomadhan kore", "An algorithm solves a problem step by step."],
    ["সংকেতায়ন ডিজিটাল তথ্য সুরক্ষিত রাখে।", "shongketayon digital toththo shurokkhito rakhe", "Encryption keeps digital information secure."],
    ["ভূরাজনীতি আন্তর্জাতিক সম্পর্ককে প্রভাবিত করে।", "bhurajniti antorjatik shomporkoke probhabito kore", "Geopolitics influences international relations."],
    ["ভাষাবিজ্ঞান ভাষার গঠন বিশ্লেষণ করে।", "bhashabiggan bhashar gothon bishleshon kore", "Linguistics analyzes the structure of language."],
    ["নগরায়ণের সঙ্গে অবকাঠামোর চাহিদা বাড়ে।", "nogorayoner shonge obokathambor chahida baṛe", "Urbanization increases demand for infrastructure."],
    ["সুশাসনে জবাবদিহিতা ও বিকেন্দ্রীকরণ গুরুত্বপূর্ণ।", "shushashone jobabdihita o bikendrikoron guruttopurno", "Accountability and decentralization matter in good governance."],
  ],
};

const LEVEL_NAMES = {
  1: "First words and tiny sentences",
  2: "Family, people, and animals",
  3: "School life and learning",
  4: "Vowel marks in useful words",
  5: "Descriptions and opposites",
  6: "Conjunct consonants in context",
  7: "Feelings, values, and ideas",
  8: "Academic subjects and study",
  9: "Citizenship and public life",
  10: "Abstract civic and philosophical ideas",
  11: "Literature, interpretation, and criticism",
  12: "Advanced academic and analytical language",
};

const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const selectBalanced = (reviewItems, previewItems, total, getKey) => {
  const review = uniqueBy(reviewItems, getKey);
  const preview = uniqueBy(previewItems, getKey);
  if (!review.length) return preview.slice(0, total);
  if (!preview.length) return review.slice(0, total);

  const half = Math.floor(total / 2);
  const selected = uniqueBy([...review.slice(0, half), ...preview.slice(0, total - half)], getKey);
  const selectedKeys = new Set(selected.map(getKey));
  const remaining = uniqueBy([...review, ...preview], getKey).filter((item) => !selectedKeys.has(getKey(item)));
  return [...selected, ...remaining].slice(0, total);
};

export const BENGALI_CLASS_LESSONS = WORD_LEVELS.map((level, levelIndex) => {
  if (level.classNumber === 1) return BENGALI_CLASS_ONE_LESSON;
  if (level.classNumber === 2) return BENGALI_CLASS_TWO_LESSON;
  if (level.classNumber === 3) return BENGALI_CLASS_THREE_LESSON;
  if (level.classNumber === 4) return BENGALI_CLASS_FOUR_LESSON;
  const coreCategory = `class-${level.classNumber}-core`;
  const extensionCategory = `class-${level.classNumber}-review-extension`;
  const reviewLevels = WORD_LEVELS.slice(0, levelIndex).reverse();
  const previewLevels = WORD_LEVELS.slice(levelIndex + 1);
  const coreWordKeys = new Set(level.words.map((word) => word.word));
  const extensionWords = selectBalanced(
    reviewLevels.flatMap((item) => item.words).filter((word) => !coreWordKeys.has(word.word)),
    previewLevels.flatMap((item) => item.words).filter((word) => !coreWordKeys.has(word.word)),
    45,
    (word) => word.word,
  );
  const extensionPhrases = selectBalanced(
    reviewLevels.flatMap((item) => CLASS_PHRASES[item.classNumber]),
    previewLevels.flatMap((item) => CLASS_PHRASES[item.classNumber]),
    22,
    ([bn]) => bn,
  );
  const coreVocab = level.words.map((word) => ({
    bn: word.word,
    pronunciation: word.sound,
    en: word.meaning,
    category: coreCategory,
  }));
  const reviewVocab = extensionWords.map((word) => ({
    bn: word.word,
    pronunciation: word.sound,
    en: word.meaning,
    category: extensionCategory,
  }));
  const corePhrases = CLASS_PHRASES[level.classNumber].map(([bn, pronunciation, en]) => ({
    bn,
    pronunciation,
    en,
    context: `Class ${level.classNumber} core sentence practice`,
    category: coreCategory,
  }));
  const reviewPhrases = extensionPhrases.map(([bn, pronunciation, en]) => ({
    bn,
    pronunciation,
    en,
    context: `Class ${level.classNumber} review and extension practice`,
    category: extensionCategory,
  }));

  return {
    id: `class-${level.classNumber}`,
    title: `Bengali Class ${level.classNumber}: ${LEVEL_NAMES[level.classNumber]}`,
    topic: `Class ${String(level.classNumber).padStart(2, "0")} · ${LEVEL_NAMES[level.classNumber]}`,
    summary: `A complete Class ${level.classNumber} lesson with ${coreVocab.length} core words, ${reviewVocab.length} review and extension words, and ${corePhrases.length + reviewPhrases.length} practical phrases.`,
    level: `Class ${level.classNumber}`,
    focus: level.focus,
    vocab: [...coreVocab, ...reviewVocab],
    phrases: [...corePhrases, ...reviewPhrases],
    practice: [
      {
        type: "Recall",
        prompt: `Read fifteen core words and ten review words aloud, then cover the English meanings and recall them.`,
        answer: "Check each response against the Vocabulary list and repeat missed words in Word Loop.",
      },
      {
        type: "Sentence building",
        prompt: "Choose three core phrases and three extension phrases, then replace one word in each to make a new Bengali sentence.",
        answer: "Keep the original sentence order, then play the Bengali audio to compare pronunciation.",
      },
    ],
    notes: [
      `The 30 core words match the Class ${level.classNumber} Make Words collection; 45 nearby-level words provide deeper spaced review and a broader preview.`,
      "The 30 phrases combine focused class practice with balanced spiral review from neighboring levels.",
      "Use Word Loop for pronunciation repetition and Games for active recall.",
    ],
  };
});

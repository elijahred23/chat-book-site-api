const category = (name, bengali, english) => {
  const words = bengali.split(", ");
  const meanings = english.split(", ");
  return words.map((bn, index) => ({
    bn,
    en: meanings[index],
    category: `Class 1 · ${name}`,
  }));
};

const vocabulary = [
  ...category("Very common words", "আমি, তুমি, সে, আমরা, তোমরা, তারা, এটা, ওটা, এই, ওই, এখানে, সেখানে, কে, কী, কোথায়, কখন, কেন, কেমন, কত, হ্যাঁ, না, আছে, নেই, হবে, ছিল, খুব, একটু, আবার, এখন, আজ, কাল, আগে, পরে", "I, you, he/she, we, you all, they, this, that, this one, that one, here, there, who, what, where, when, why, how, how many, yes, no, exists/has, does not exist, will be, was, very, a little, again, now, today, tomorrow, before, after"),
  ...category("Family", "মা, বাবা, ভাই, বোন, দাদা, দাদি, নানা, নানি, চাচা, চাচি, মামা, মামি, খালা, খালু, পরিবার, শিশু, ছেলে, মেয়ে, মানুষ, বন্ধু", "mother, father, brother, sister, elder brother, paternal grandmother, maternal grandfather, maternal grandmother, paternal uncle, paternal aunt, maternal uncle, maternal aunt, maternal aunt, maternal uncle by marriage, family, child, boy, girl, person, friend"),
  ...category("Body", "মাথা, চুল, মুখ, চোখ, কান, নাক, ঠোঁট, মুখ, দাঁত, জিহ্বা, গলা, ঘাড়, কাঁধ, বুক, পেট, পিঠ, হাত, আঙুল, পা, হাঁটু, পায়ের আঙুল", "head, hair, face, eye, ear, nose, lip, mouth, tooth, tongue, throat, neck, shoulder, chest, stomach, back, hand, finger, foot, knee, toe"),
  ...category("Home", "বাড়ি, ঘর, দরজা, জানালা, ছাদ, দেয়াল, মেঝে, সিঁড়ি, বারান্দা, রান্নাঘর, বাথরুম, বিছানা, বালিশ, চাদর, টেবিল, চেয়ার, আলমারি, আয়না, বাতি, পাখা, ঘড়ি, চাবি", "house, room, door, window, roof, wall, floor, stairs, balcony, kitchen, bathroom, bed, pillow, sheet, table, chair, cupboard, mirror, light, fan, clock, key"),
  ...category("School", "স্কুল, শ্রেণি, শিক্ষক, শিক্ষিকা, ছাত্র, ছাত্রী, বই, খাতা, কলম, পেন্সিল, রাবার, ব্যাগ, কাগজ, বোর্ড, চক, বেঞ্চ, পরীক্ষা, পড়া, লেখা, অঙ্ক, প্রশ্ন, উত্তর, ছুটি", "school, class, male teacher, female teacher, male student, female student, book, notebook, pen, pencil, eraser, bag, paper, board, chalk, bench, exam, reading, writing, mathematics, question, answer, holiday"),
  ...category("Food and drink", "ভাত, রুটি, ডাল, মাছ, মাংস, ডিম, দুধ, পানি, চা, জুস, ফল, সবজি, আলু, টমেটো, পেঁয়াজ, লবণ, চিনি, তেল, মধু, বিস্কুট, কেক, মিষ্টি", "rice, flatbread, lentils, fish, meat, egg, milk, water, tea, juice, fruit, vegetable, potato, tomato, onion, salt, sugar, oil, honey, biscuit, cake, sweet"),
  ...category("Fruit", "আম, কলা, আপেল, কমলা, আঙুর, পেয়ারা, লিচু, তরমুজ, নারকেল, কাঁঠাল, আনারস, পেঁপে, লেবু", "mango, banana, apple, orange, grape, guava, lychee, watermelon, coconut, jackfruit, pineapple, papaya, lemon"),
  ...category("Animals", "কুকুর, বিড়াল, গরু, ছাগল, ঘোড়া, বাঘ, সিংহ, হাতি, বানর, হরিণ, ভালুক, শিয়াল, খরগোশ, ইঁদুর, সাপ, মাছ, ব্যাঙ", "dog, cat, cow, goat, horse, tiger, lion, elephant, monkey, deer, bear, fox, rabbit, mouse, snake, fish, frog"),
  ...category("Birds and insects", "পাখি, কাক, কবুতর, চড়ুই, হাঁস, মুরগি, মোরগ, ঈগল, পেঁচা, প্রজাপতি, মৌমাছি, পিঁপড়া, মশা, মাছি", "bird, crow, pigeon, sparrow, duck, hen, rooster, eagle, owl, butterfly, bee, ant, mosquito, fly"),
  ...category("Nature", "আকাশ, সূর্য, চাঁদ, তারা, মেঘ, বৃষ্টি, বাতাস, ঝড়, নদী, পুকুর, সাগর, পাহাড়, মাঠ, মাটি, বালি, গাছ, ফুল, পাতা, ঘাস, বন", "sky, sun, moon, star, cloud, rain, wind, storm, river, pond, sea, mountain, field, soil, sand, tree, flower, leaf, grass, forest"),
  ...category("Colors", "লাল, নীল, সবুজ, হলুদ, কালো, সাদা, গোলাপি, কমলা, বাদামি, বেগুনি, ধূসর", "red, blue, green, yellow, black, white, pink, orange, brown, purple, gray"),
  ...category("Numbers", "এক, দুই, তিন, চার, পাঁচ, ছয়, সাত, আট, নয়, দশ, এগারো, বারো, তেরো, চৌদ্দ, পনেরো, ষোলো, সতেরো, আঠারো, উনিশ, বিশ", "one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty"),
  ...category("Time", "সকাল, দুপুর, বিকেল, সন্ধ্যা, রাত, দিন, সপ্তাহ, মাস, বছর, আজ, কাল, গতকাল, আগামীকাল, এখন, পরে, আগে, তাড়াতাড়ি, দেরি", "morning, noon, afternoon, evening, night, day, week, month, year, today, tomorrow, yesterday, tomorrow, now, later, before, early, late"),
  ...category("Days of the week", "শনিবার, রবিবার, সোমবার, মঙ্গলবার, বুধবার, বৃহস্পতিবার, শুক্রবার", "Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday"),
  ...category("Places", "বাড়ি, স্কুল, দোকান, বাজার, রাস্তা, পার্ক, মাঠ, হাসপাতাল, গ্রাম, শহর, দেশ, মসজিদ, বাগান, নদী, পুকুর", "house, school, shop, market, road, park, field, hospital, village, city, country, mosque, garden, river, pond"),
  ...category("Transportation", "গাড়ি, বাস, ট্রেন, রিকশা, সাইকেল, মোটরসাইকেল, নৌকা, জাহাজ, বিমান, চাকা, রাস্তা", "car, bus, train, rickshaw, bicycle, motorcycle, boat, ship, airplane, wheel, road"),
  ...category("Clothing", "জামা, প্যান্ট, শার্ট, জুতা, মোজা, টুপি, পোশাক, চশমা, ছাতা", "clothes, pants, shirt, shoes, socks, hat, clothing, glasses, umbrella"),
  ...category("Toys and games", "বল, ব্যাট, পুতুল, ঘুড়ি, খেলনা, খেলা, দৌড়, ফুটবল, ক্রিকেট, লুকোচুরি", "ball, bat, doll, kite, toy, game, running, football, cricket, hide-and-seek"),
  ...category("Common verbs", "করা, যাওয়া, আসা, খাওয়া, পান করা, দেখা, শোনা, বলা, পড়া, লেখা, শেখা, জানা, বোঝা, বসা, দাঁড়ানো, হাঁটা, দৌড়ানো, খেলা, ঘুমানো, জাগা, হাসা, কাঁদা, দেওয়া, নেওয়া, রাখা, ধরা, খোলা, বন্ধ করা, বানানো, আঁকা, গাওয়া, নাচা, চাওয়া, পাওয়া, কেনা, ডাকা, ওঠা, নামা, ফেরা, পড়ে যাওয়া", "to do, to go, to come, to eat, to drink, to see, to hear, to say, to read, to write, to learn, to know, to understand, to sit, to stand, to walk, to run, to play, to sleep, to wake, to laugh, to cry, to give, to take, to keep, to hold, to open, to close, to make, to draw, to sing, to dance, to want, to get, to buy, to call, to rise, to descend, to return, to fall down"),
  ...category("Describing words", "বড়, ছোট, লম্বা, খাটো, মোটা, পাতলা, ভালো, খারাপ, সুন্দর, পরিষ্কার, নোংরা, নতুন, পুরোনো, গরম, ঠান্ডা, মিষ্টি, টক, নরম, শক্ত, ভারী, হালকা, দ্রুত, ধীর, কাছে, দূরে, সহজ, কঠিন, খালি, ভরা", "big, small, tall, short, fat, thin, good, bad, beautiful, clean, dirty, new, old, hot, cold, sweet, sour, soft, hard, heavy, light, fast, slow, near, far, easy, difficult, empty, full"),
  ...category("Feelings", "খুশি, দুঃখ, রাগ, ভয়, ভালোবাসা, আনন্দ, কষ্ট, ক্ষুধা, তৃষ্ণা, ক্লান্ত", "happy, sadness, anger, fear, love, joy, pain, hunger, thirst, tired"),
  ...category("Position words", "উপরে, নিচে, সামনে, পিছনে, পাশে, ভিতরে, বাইরে, কাছে, দূরে, ডানে, বামে, মাঝে", "above, below, in front, behind, beside, inside, outside, near, far, right, left, between"),
  ...category("Question words", "কে, কী, কোথায়, কখন, কেন, কেমন, কোন, কত, কার", "who, what, where, when, why, how, which, how many, whose"),
  ...category("Useful small words", "আর, কিন্তু, তাই, যদি, তবে, কারণ, অথবা, সঙ্গে, জন্য, থেকে, পর্যন্ত, দিকে, মধ্যে, উপর, নিচে", "and/more, but, therefore, if, then, because, or, with, for, from, until, toward, among, on, under"),
];

const phraseGroup = (name, items) => items.map(([bn, en]) => ({
  bn,
  en,
  context: name,
  category: `Class 1 · ${name}`,
}));

const phrases = [
  ...phraseGroup("Introductions and conversation", [
    ["আমার নাম ___।", "My name is ___."], ["তোমার নাম কী?", "What is your name?"], ["তুমি কেমন আছ?", "How are you?"], ["আমি ভালো আছি।", "I am well."], ["তুমি কোথায় থাকো?", "Where do you live?"], ["আমি এখানে থাকি।", "I live here."], ["এটা কী?", "What is this?"], ["ওটা কী?", "What is that?"], ["এটা আমার।", "This is mine."], ["ওটা তোমার।", "That is yours."], ["আমি জানি।", "I know."], ["আমি জানি না।", "I do not know."], ["আমি বুঝেছি।", "I understood."], ["আমি বুঝিনি।", "I did not understand."], ["আবার বলো।", "Say it again."], ["ধীরে বলো।", "Speak slowly."],
  ]),
  ...phraseGroup("Polite phrases", [["ধন্যবাদ।", "Thank you."], ["দয়া করে।", "Please."], ["মাফ করবেন।", "Excuse me."], ["কোনো সমস্যা নেই।", "No problem."], ["স্বাগতম।", "Welcome."], ["শুভ সকাল।", "Good morning."], ["শুভ রাত্রি।", "Good night."], ["বিদায়।", "Goodbye."], ["আবার দেখা হবে।", "See you again."]]),
  ...phraseGroup("At school", [["আমি স্কুলে যাই।", "I go to school."], ["আমি বই পড়ি।", "I read a book."], ["আমি খাতায় লিখি।", "I write in my notebook."], ["এটা আমার বই।", "This is my book."], ["ওটা আমার ব্যাগ।", "That is my bag."], ["আমার একটি পেন্সিল আছে।", "I have a pencil."], ["শিক্ষক পড়াচ্ছেন।", "The teacher is teaching."], ["আমি উত্তর জানি।", "I know the answer."], ["আমি উত্তর জানি না।", "I do not know the answer."], ["আমি কি বসতে পারি?", "May I sit?"], ["আমি কি যেতে পারি?", "May I go?"], ["আমাকে সাহায্য করুন।", "Please help me."], ["আমি বুঝতে পারছি না।", "I do not understand."]]),
  ...phraseGroup("At home", [["আমি বাড়িতে আছি।", "I am at home."], ["মা রান্না করছেন।", "Mother is cooking."], ["বাবা বাড়িতে আছেন।", "Father is at home."], ["আমি ঘুমাতে যাচ্ছি।", "I am going to sleep."], ["দরজা খোলো।", "Open the door."], ["দরজা বন্ধ করো।", "Close the door."], ["বাতি জ্বালাও।", "Turn on the light."], ["বাতি বন্ধ করো।", "Turn off the light."], ["এখানে এসো।", "Come here."], ["ওখানে যাও।", "Go there."], ["আমার পাশে বসো।", "Sit beside me."]]),
  ...phraseGroup("Food and drink", [["আমার ক্ষুধা লেগেছে।", "I am hungry."], ["আমার তৃষ্ণা পেয়েছে।", "I am thirsty."], ["আমি ভাত খাই।", "I eat rice."], ["আমি পানি পান করি।", "I drink water."], ["আমি আম খেতে ভালোবাসি।", "I love to eat mangoes."], ["এটা খুব মিষ্টি।", "This is very sweet."], ["এটা খুব গরম।", "This is very hot."], ["এটা ঠান্ডা।", "This is cold."], ["আমাকে একটু পানি দাও।", "Give me a little water."], ["আর একটু দাও।", "Give me a little more."], ["আমার আর লাগবে না।", "I do not need any more."]]),
  ...phraseGroup("Play and activities", [["চলো খেলি।", "Let us play."], ["আমি বল নিয়ে খেলি।", "I play with a ball."], ["বলটি আমাকে দাও।", "Give me the ball."], ["বলটি ধরো।", "Catch the ball."], ["এখানে দাঁড়াও।", "Stand here."], ["আমার সঙ্গে এসো।", "Come with me."], ["চলো বাইরে যাই।", "Let us go outside."], ["আমি দৌড়াতে পারি।", "I can run."], ["আমি সাইকেল চালাতে পারি।", "I can ride a bicycle."], ["আমি ছবি আঁকতে পারি।", "I can draw a picture."]]),
  ...phraseGroup("Expressing feelings", [["আমি খুশি।", "I am happy."], ["আমার মন খারাপ।", "I feel sad."], ["আমার ভয় লাগছে।", "I am afraid."], ["আমার রাগ হয়েছে।", "I am angry."], ["আমি ক্লান্ত।", "I am tired."], ["আমি ভালো আছি।", "I am well."], ["আমার ব্যথা করছে।", "It hurts."], ["চিন্তা করো না।", "Do not worry."], ["আমি তোমাকে ভালোবাসি।", "I love you."]]),
  ...phraseGroup("Questions and answers", [["তুমি কী করছ?", "What are you doing?"], ["আমি খেলছি।", "I am playing."], ["তুমি কোথায় যাচ্ছ?", "Where are you going?"], ["আমি স্কুলে যাচ্ছি।", "I am going to school."], ["তুমি কী খাচ্ছ?", "What are you eating?"], ["আমি ভাত খাচ্ছি।", "I am eating rice."], ["কে এসেছে?", "Who has come?"], ["মা এসেছেন।", "Mother has come."], ["এটা কার?", "Whose is this?"], ["এটা আমার।", "This is mine."], ["তুমি কি যাবে?", "Will you go?"], ["হ্যাঁ, আমি যাব।", "Yes, I will go."], ["না, আমি যাব না।", "No, I will not go."]]),
  ...phraseGroup("Position", [["বইটি টেবিলের উপর আছে।", "The book is on the table."], ["বলটি টেবিলের নিচে আছে।", "The ball is under the table."], ["বিড়ালটি ঘরের ভিতরে আছে।", "The cat is inside the room."], ["কুকুরটি বাইরে আছে।", "The dog is outside."], ["আমি তোমার পাশে আছি।", "I am beside you."], ["স্কুলটি বাড়ির কাছে।", "The school is near the house."], ["গাছটি বাড়ির সামনে।", "The tree is in front of the house."]]),
  ...phraseGroup("Numbers and quantities", [["আমার একটি বই আছে।", "I have one book."], ["আমার দুটি পেন্সিল আছে।", "I have two pencils."], ["তিনটি পাখি আছে।", "There are three birds."], ["আমাকে একটি দাও।", "Give me one."], ["কতগুলো আছে?", "How many are there?"], ["এখানে অনেক ফুল আছে।", "There are many flowers here."], ["এখানে অল্প পানি আছে।", "There is a little water here."]]),
  ...phraseGroup("Easy reading", [["এটি একটি আম।", "This is a mango."], ["আমটি হলুদ।", "The mango is yellow."], ["আমটি মিষ্টি।", "The mango is sweet."], ["এটি একটি লাল বল।", "This is a red ball."], ["বলটি বড়।", "The ball is big."], ["রিমা বল নিয়ে খেলে।", "Rima plays with a ball."], ["একটি বিড়াল আছে।", "There is a cat."], ["বিড়ালটি ছোট।", "The cat is small."], ["বিড়ালটি দুধ খায়।", "The cat drinks milk."], ["আকাশ নীল।", "The sky is blue."], ["সূর্য ওঠে।", "The sun rises."], ["পাখি আকাশে ওড়ে।", "A bird flies in the sky."], ["গাছে সবুজ পাতা আছে।", "The tree has green leaves."], ["ফুলটি সুন্দর।", "The flower is beautiful."], ["বৃষ্টি পড়ছে।", "It is raining."], ["আমি ছাতা নিই।", "I take an umbrella."], ["আজ খুব গরম।", "Today is very hot."], ["রাতে চাঁদ ওঠে।", "The moon rises at night."], ["আমি রাতে ঘুমাই।", "I sleep at night."], ["সকালে আমি স্কুলে যাই।", "I go to school in the morning."]]),
  ...phraseGroup("Short instructions", [["এসো।", "Come."], ["যাও।", "Go."], ["বসো।", "Sit."], ["দাঁড়াও।", "Stand."], ["দেখো।", "Look."], ["শোনো।", "Listen."], ["বলো।", "Speak."], ["পড়ো।", "Read."], ["লেখো।", "Write."], ["খাও।", "Eat."], ["পানি খাও।", "Drink water."], ["ধরো।", "Hold it."], ["ছাড়ো।", "Let go."], ["খোলো।", "Open it."], ["বন্ধ করো।", "Close it."], ["অপেক্ষা করো।", "Wait."], ["আবার করো।", "Do it again."], ["এখানে রাখো।", "Put it here."], ["ওখানে রাখো।", "Put it there."], ["আমার সঙ্গে এসো।", "Come with me."], ["সাবধানে যাও।", "Go carefully."]]),
  ...phraseGroup("Important opposites", [["বড় — ছোট", "big — small"], ["লম্বা — খাটো", "tall — short"], ["ভালো — খারাপ", "good — bad"], ["দিন — রাত", "day — night"], ["সকাল — সন্ধ্যা", "morning — evening"], ["আলো — অন্ধকার", "light — darkness"], ["গরম — ঠান্ডা", "hot — cold"], ["নতুন — পুরোনো", "new — old"], ["উপরে — নিচে", "above — below"], ["সামনে — পিছনে", "in front — behind"], ["ভিতরে — বাইরে", "inside — outside"], ["কাছে — দূরে", "near — far"], ["ডান — বাম", "right — left"], ["দ্রুত — ধীর", "fast — slow"], ["হাসি — কান্না", "laughter — crying"], ["আসা — যাওয়া", "coming — going"], ["খোলা — বন্ধ", "open — closed"], ["ভরা — খালি", "full — empty"], ["শুরু — শেষ", "start — finish"], ["হ্যাঁ — না", "yes — no"]]),
  ...phraseGroup("আমি + কাজ", [["আমি খাই।", "I eat."], ["আমি খেলি।", "I play."], ["আমি পড়ি।", "I read."], ["আমি লিখি।", "I write."], ["আমি যাই।", "I go."], ["আমি ঘুমাই।", "I sleep."]]),
  ...phraseGroup("সে + কাজ", [["সে খায়।", "He or she eats."], ["সে খেলে।", "He or she plays."], ["সে পড়ে।", "He or she reads."], ["সে লেখে।", "He or she writes."], ["সে যায়।", "He or she goes."], ["সে ঘুমায়।", "He or she sleeps."]]),
  ...phraseGroup("এটি + বস্তু", [["এটি একটি বই।", "This is a book."], ["এটি একটি ফুল।", "This is a flower."], ["এটি একটি গাছ।", "This is a tree."], ["এটি একটি বল।", "This is a ball."]]),
  ...phraseGroup("আমার + বস্তু", [["আমার বই।", "My book."], ["আমার খাতা।", "My notebook."], ["আমার বাড়ি।", "My house."], ["আমার মা।", "My mother."], ["আমার বন্ধু।", "My friend."]]),
  ...phraseGroup("কোথায় + প্রশ্ন", [["মা কোথায়?", "Where is mother?"], ["বই কোথায়?", "Where is the book?"], ["বল কোথায়?", "Where is the ball?"], ["তুমি কোথায়?", "Where are you?"]]),
  ...phraseGroup("কী + প্রশ্ন", [["এটা কী?", "What is this?"], ["তুমি কী করছ?", "What are you doing?"], ["তুমি কী খাচ্ছ?", "What are you eating?"], ["তুমি কী পড়ছ?", "What are you reading?"]]),
  ...phraseGroup("কে + প্রশ্ন", [["এটা কে?", "Who is this?"], ["কে এসেছে?", "Who has come?"], ["কে খেলছে?", "Who is playing?"], ["কে ডাকছে?", "Who is calling?"]]),
];

export const BENGALI_CLASS_ONE_LESSON = {
  id: "class-1",
  title: "Bengali Class 1: First words and useful phrases",
  topic: "Class 01 · First words and useful phrases",
  summary: `A complete beginner lesson with ${vocabulary.length} categorized vocabulary entries and ${phrases.length} useful phrases, sentences, questions, instructions, and patterns.`,
  level: "Class 1",
  focus: "Everyday vocabulary, short sentences, questions, instructions, opposites, and foundational sentence patterns",
  vocab: vocabulary,
  phrases,
  practice: [
    { type: "Daily words", prompt: "Choose one vocabulary category. Read each Bengali word aloud, then recall its English meaning.", answer: "Use Word Loop and the audio controls to repeat words you miss." },
    { type: "Sentence patterns", prompt: "Practice one আমি, সে, এটি, আমার, কোথায়, কী, or কে pattern and replace one word to make a new sentence.", answer: "Keep the pattern unchanged and choose a word from the vocabulary list." },
    { type: "Real conversation", prompt: "Choose five useful phrases and say them in a short conversation with a partner.", answer: "Listen to each Bengali sentence before repeating it." },
  ],
  notes: [
    "Work through one category at a time; this lesson is designed as a complete Class 1 reference, not a single sitting.",
    "Repeated words and phrases are intentionally retained when they teach a second category or sentence pattern.",
    "Use Games for recognition practice and Word Loop for listening and repetition.",
  ],
};

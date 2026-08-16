import { BENGALI_CLASS_EIGHT_LESSON } from "./bengaliClassEightLesson.js";

const meanings={ব্যাখ্যামূলক:"explanatory",সমালোচনামূলক:"critical",প্রাসঙ্গিকতা:"relevance",বৈধতা:"validity",কাঠামো:"structure",তাৎপর্য:"significance",পরিণতি:"consequence",দাবি:"claim",প্রতিদাবি:"counterclaim",অবস্থান:"position",জরিপ:"survey",সাক্ষাৎকার:"interview",গবেষণাপত্র:"research paper",বাচ্য:"voice","সক্রিয় বাচ্য":"active voice",কর্মবাচ্য:"passive voice",শব্দার্থ:"word meaning",ব্যুৎপত্তি:"etymology",গদ্য:"prose",পদ্য:"verse",বর্ণনাকারী:"narrator",উপভাব:"supporting theme",ভাষাশৈলী:"literary style",শব্দচয়ন:"word choice","অন্তর্নিহিত অর্থ":"implicit meaning",প্রতিনিধিত্ব:"representation","সামাজিক ন্যায়":"social justice",জবাবদিহি:"accountability","সামাজিক পরিবর্তন":"social change","সামাজিক মূল্যবোধ":"social values","ঐতিহাসিক প্রেক্ষাপট":"historical context",উপনিবেশবাদ:"colonialism",সাম্রাজ্যবাদ:"imperialism","ঐতিহাসিক উৎস":"historical source","প্রাথমিক উৎস":"primary source","দ্বিতীয়িক উৎস":"secondary source",কৃষি:"agriculture","নদী অববাহিকা":"river basin",ভূমিক্ষয়:"land erosion",মরুকরণ:"desertification","ভূমি ব্যবহার":"land use","ভূ-অবস্থান":"geographical location",পরিবহন:"transportation","অর্থনৈতিক অঞ্চল":"economic region","গ্রিনহাউস গ্যাস":"greenhouse gas","প্রাকৃতিক দুর্যোগ":"natural disaster","সম্পদ ব্যবস্থাপনা":"resource management","পরিবেশগত প্রভাব":"environmental impact",পরিবেশনীতি:"environmental policy","বৈজ্ঞানিক পদ্ধতি":"scientific method","স্বাধীন চলক":"independent variable","নির্ভরশীল চলক":"dependent variable","নিয়ন্ত্রিত চলক":"controlled variable",ত্রুটি:"error",নির্ভুলতা:"precision",যথার্থতা:"accuracy",মডেল:"model",পুনরাবৃত্তি:"replication","শক্তি রূপান্তর":"energy transformation",কোষঝিল্লি:"cell membrane",নিউক্লিয়াস:"nucleus",হরমোন:"hormone",জিন:"gene",ক্রোমোজোম:"chromosome","প্রাকৃতিক নির্বাচন":"natural selection",বেগ:"velocity",ত্বরণ:"acceleration",ভর:"mass",ওজন:"weight",কাজ:"work",ক্ষমতা:"power",তাপমাত্রা:"temperature",প্রতিফলন:"reflection",প্রতিসরণ:"refraction",কম্পন:"vibration","বৈদ্যুতিক প্রবাহ":"electric current",ভোল্টেজ:"voltage","চৌম্বক ক্ষেত্র":"magnetic field",মৌল:"element",মিশ্রণ:"mixture",আয়ন:"ion","রাসায়নিক বন্ধন":"chemical bond",বিক্রিয়ক:"reactant",উৎপাদ:"product",অম্ল:"acid",ক্ষার:"base",লবণ:"salt",দ্রবণ:"solution",দ্রাবক:"solvent",দ্রব:"solute",ঘনত্ব:"concentration",ডেটাবেস:"database",স্বয়ংক্রিয়তা:"automation","বিভ্রান্তিকর তথ্য":"disinformation","অনলাইন নিরাপত্তা":"online safety","তথ্যের উৎস":"information source",ভোগ:"consumption",মুদ্রাস্ফীতি:"inflation",ঋণ:"debt",দারিদ্র্য:"poverty","অর্থনৈতিক প্রবৃদ্ধি":"economic growth","অর্থনৈতিক বৈষম্য":"economic inequality",আত্মসন্দেহ:"self-doubt",প্রেরণা:"motivation",তৃপ্তি:"contentment",অসন্তোষ:"dissatisfaction",দৃঢ়তা:"resilience",অসহায়ত্ব:"helplessness",পরিণত:"mature",আবেগপ্রবণ:"emotional",নীতিবান:"ethical","ব্যাখ্যা নির্ণয় করা":"to determine an interpretation","ব্যাখ্যা পুনর্গঠন করা":"to reconstruct an interpretation","পর্যালোচনা করা":"to review","ব্যাখ্যার সীমাবদ্ধতা চিহ্নিত করা":"to identify limitations of an interpretation","নিয়ন্ত্রণ করা":"to control","সংস্কার করা":"to reform","সমন্বয় করা":"to coordinate","আলোচনায় অংশ নেওয়া":"to participate in discussion","যুক্তিসঙ্গত করা":"to justify",যৌক্তিক:"logical",বিশ্বাসযোগ্য:"credible",অবিশ্বাস্য:"not credible",সুসংগত:"coherent",অসংগত:"incoherent",টেকসই:"sustainable",দীর্ঘমেয়াদি:"long-term",স্বল্পমেয়াদি:"short-term",নগণ্য:"negligible",বিতর্কিত:"controversial",উপরন্তু:"moreover",বরং:"rather",সুতরাং:"therefore",পরিশেষে:"finally"};
const known=Object.fromEntries(BENGALI_CLASS_EIGHT_LESSON.vocab.map(({bn,en})=>[bn,en]));
const category=(name,text)=>text.split(", ").map(bn=>({bn,en:meanings[bn]||known[bn]||`Class 9 term: ${bn}`,category:`Class 9 · ${name}`}));
const advanced=[
...category("Advanced academic words","ব্যাখ্যামূলক, সমালোচনামূলক, প্রাসঙ্গিকতা, বৈধতা, কাঠামো, তাৎপর্য, পরিণতি, দাবি, প্রতিদাবি, অবস্থান"),
...category("Education and research","জরিপ, সাক্ষাৎকার, গবেষণাপত্র"),
...category("Grammar and language","বাচ্য, সক্রিয় বাচ্য, কর্মবাচ্য, শব্দার্থ, ব্যুৎপত্তি"),
...category("Literary analysis","গদ্য, পদ্য, বর্ণনাকারী, উপভাব, ভাষাশৈলী, শব্দচয়ন, অন্তর্নিহিত অর্থ"),
...category("Civics and history","প্রতিনিধিত্ব, সামাজিক ন্যায়, জবাবদিহি, সামাজিক পরিবর্তন, সামাজিক মূল্যবোধ, ঐতিহাসিক প্রেক্ষাপট, উপনিবেশবাদ, সাম্রাজ্যবাদ, ঐতিহাসিক উৎস, প্রাথমিক উৎস, দ্বিতীয়িক উৎস"),
...category("Geography and environment","কৃষি, নদী অববাহিকা, ভূমিক্ষয়, মরুকরণ, ভূমি ব্যবহার, ভূ-অবস্থান, পরিবহন, অর্থনৈতিক অঞ্চল, গ্রিনহাউস গ্যাস, প্রাকৃতিক দুর্যোগ, সম্পদ ব্যবস্থাপনা, পরিবেশগত প্রভাব, পরিবেশনীতি"),
...category("Scientific method","বৈজ্ঞানিক পদ্ধতি, স্বাধীন চলক, নির্ভরশীল চলক, নিয়ন্ত্রিত চলক, ত্রুটি, নির্ভুলতা, যথার্থতা, মডেল, পুনরাবৃত্তি, শক্তি রূপান্তর"),
...category("Biology","কোষঝিল্লি, নিউক্লিয়াস, হরমোন, জিন, ক্রোমোজোম, প্রাকৃতিক নির্বাচন"),
...category("Physics","বেগ, ত্বরণ, ভর, ওজন, কাজ, ক্ষমতা, তাপমাত্রা, প্রতিফলন, প্রতিসরণ, কম্পন, বৈদ্যুতিক প্রবাহ, ভোল্টেজ, চৌম্বক ক্ষেত্র"),
...category("Chemistry","মৌল, মিশ্রণ, আয়ন, রাসায়নিক বন্ধন, বিক্রিয়ক, উৎপাদ, অম্ল, ক্ষার, লবণ, দ্রবণ, দ্রাবক, দ্রব, ঘনত্ব"),
...category("Digital literacy","ডেটাবেস, স্বয়ংক্রিয়তা, বিভ্রান্তিকর তথ্য, অনলাইন নিরাপত্তা, তথ্যের উৎস"),
...category("Economics","ভোগ, মুদ্রাস্ফীতি, ঋণ, দারিদ্র্য, অর্থনৈতিক প্রবৃদ্ধি, অর্থনৈতিক বৈষম্য"),
...category("Feelings and character","আত্মসন্দেহ, প্রেরণা, তৃপ্তি, অসন্তোষ, দৃঢ়তা, অসহায়ত্ব, পরিণত, আবেগপ্রবণ, নীতিবান"),
...category("Advanced verbs","ব্যাখ্যা নির্ণয় করা, ব্যাখ্যা পুনর্গঠন করা, পর্যালোচনা করা, ব্যাখ্যার সীমাবদ্ধতা চিহ্নিত করা, নিয়ন্ত্রণ করা, সংস্কার করা, সমন্বয় করা, আলোচনায় অংশ নেওয়া, যুক্তিসঙ্গত করা"),
...category("Analytical adjectives and connectors","যৌক্তিক, বিশ্বাসযোগ্য, অবিশ্বাস্য, সুসংগত, অসংগত, টেকসই, দীর্ঘমেয়াদি, স্বল্পমেয়াদি, নগণ্য, বিতর্কিত, উপরন্তু, বরং, সুতরাং, পরিশেষে")];
const seen=new Set();const vocabulary=[...BENGALI_CLASS_EIGHT_LESSON.vocab.map(item=>({...item,category:item.category.replace("Class 8","Class 9 · spiral review")})),...advanced].filter(item=>{if(seen.has(item.bn))return false;seen.add(item.bn);return true});
const group=(name,text)=>text.trim().split("\n").filter(Boolean).map((bn,i)=>({bn,en:`${name} practice ${i+1}`,context:name,category:`Class 9 · ${name}`}));
const phrases=[
...group("Claims and counterclaims",`আমার মতে বিষয়টি একপাক্ষিকভাবে বিচার করা উচিত নয়।
আমার দৃষ্টিতে উভয় পক্ষের যুক্তি বিবেচনা করা প্রয়োজন।
আমি মূল দাবির সঙ্গে একমত হলেও এর কিছু সীমাবদ্ধতা রয়েছে।
প্রমাণের ভিত্তিতে আমি ভিন্ন সিদ্ধান্তে পৌঁছেছি।
আমার মূল দাবি হলো প্রযুক্তির ব্যবহার নিয়ন্ত্রণের পরিবর্তে দায়িত্বশীল ব্যবহার শেখানো উচিত।
বিপরীত পক্ষ যুক্তি দিতে পারে যে এই পরিকল্পনা অতিরিক্ত ব্যয়বহুল।
এই উদ্বেগ সম্পূর্ণ অযৌক্তিক নয়।
প্রতিদাবি বিবেচনা করলে মূল যুক্তিটি আরও শক্তিশালী করা যায়।`),
...group("Evidence and sources",`প্রমাণটি সরাসরি দাবিটিকে সমর্থন করে।
তবে নমুনার আকার ছোট হওয়ায় ফলাফল সাধারণীকরণ করা কঠিন।
তথ্যটি নির্ভরযোগ্য উৎস থেকে এসেছে, তাই এর বিশ্বাসযোগ্যতা তুলনামূলক বেশি।
পরিসংখ্যানের পদ্ধতি না জানলে তার নির্ভুলতা বিচার করা কঠিন।
লেখকের যোগ্যতা ও দক্ষতা বিবেচনা করা দরকার।
উৎসটির কোনো রাজনৈতিক বা বাণিজ্যিক স্বার্থ আছে কি না দেখতে হবে।
অন্য নির্ভরযোগ্য উৎসের সঙ্গে তথ্যটি মিলিয়ে দেখা দরকার।`),
...group("Bias and literary analysis",`লেখকের শব্দচয়নে স্পষ্ট পক্ষপাত দেখা যায়।
কিছু আবেগপূর্ণ শব্দ পাঠককে একটি নির্দিষ্ট সিদ্ধান্তের দিকে ঠেলে দিতে পারে।
তথ্য বাছাইয়ের মাধ্যমেও পক্ষপাত প্রকাশ পেতে পারে।
চরিত্রটির বাহ্যিক আচরণ ও অভ্যন্তরীণ দ্বন্দ্বের মধ্যে পার্থক্য রয়েছে।
লেখক অন্ধকারের চিত্রকল্প ব্যবহার করে ভয়ের আবহ তৈরি করেছেন।
এই প্রতীকটি স্বাধীনতার ধারণাকে উপস্থাপন করতে পারে।
চরিত্রটির সিদ্ধান্ত কাহিনির মোড় ঘুরিয়ে দেয়।`),
...group("Causation and limitations",`দুটি ঘটনা একই সময়ে ঘটলেই একটি অন্যটির কারণ প্রমাণিত হয় না।
দুটি বিষয়ের মধ্যে সম্পর্ক থাকতে পারে, কিন্তু সেই সম্পর্কের পেছনে অন্য কারণও থাকতে পারে।
কারণ প্রমাণ করতে আরও নিয়ন্ত্রিত প্রমাণ প্রয়োজন।
এই ব্যাখ্যাটি সম্ভব, কিন্তু এটি একমাত্র ব্যাখ্যা নয়।
পর্যাপ্ত তথ্য না থাকায় নিশ্চিত সিদ্ধান্তে পৌঁছানো যায় না।
আরও প্রমাণ পাওয়া গেলে ব্যাখ্যাটি পরিবর্তিত হতে পারে।`),
...group("Advanced analysis",`একটি শক্তিশালী যুক্তি শুধু প্রমাণের পরিমাণের ওপর নয়, প্রমাণের গুণমান ও প্রাসঙ্গিকতার ওপরও নির্ভর করে।
তথ্য নির্বাচন করার সময় লেখক সচেতন বা অচেতনভাবে পক্ষপাত দেখাতে পারেন।
একটি ঘটনার সঙ্গে আরেকটি ঘটনার সম্পর্ক থাকলেও সরাসরি কারণ প্রমাণের জন্য অতিরিক্ত তথ্য প্রয়োজন।
কোনো সামাজিক সমস্যা বিশ্লেষণ করার সময় ব্যক্তিগত আচরণের পাশাপাশি বৃহত্তর কাঠামোগত কারণও বিবেচনা করা উচিত।
সাহিত্যে একটি প্রতীক একাধিক অর্থ বহন করতে পারে এবং তার ব্যাখ্যা প্রেক্ষাপটের ওপর নির্ভর করে।`),
...group("AI and education passage",`কৃত্রিম বুদ্ধিমত্তা শিক্ষাক্ষেত্রে নতুন সুযোগ তৈরি করছে। শিক্ষার্থীরা এর সাহায্যে ব্যাখ্যা পেতে, অনুশীলন তৈরি করতে এবং দ্রুত তথ্য সংগ্রহ করতে পারে। তবে নিজের চিন্তার পরিবর্তে সম্পূর্ণভাবে প্রযুক্তির ওপর নির্ভর করলে বিশ্লেষণ ও সমস্যা সমাধানের দক্ষতা দুর্বল হতে পারে। কৃত্রিম বুদ্ধিমত্তা সব সময় সঠিক তথ্যও দেয় না। তাই এটিকে উত্তর দেওয়ার যন্ত্র হিসেবে নয়, শেখার সহায়ক মাধ্যম হিসেবে ব্যবহার করা বেশি কার্যকর।`),
...group("Urbanization passage",`নগরায়ণ অর্থনৈতিক উন্নয়নের সঙ্গে ঘনিষ্ঠভাবে সম্পর্কিত। শহরে কর্মসংস্থান, শিক্ষা এবং চিকিৎসার সুযোগ বেশি থাকায় মানুষ গ্রাম থেকে শহরে আসে। অর্থনৈতিক কার্যক্রম বাড়লেও আবাসন সংকট, যানজট, দূষণ ও অবকাঠামোর ওপর চাপ সৃষ্টি হতে পারে। তাই পরিকল্পিত নগর উন্নয়নের মাধ্যমে নেতিবাচক প্রভাব কমানো প্রয়োজন।`),
...group("Evidence-based opinion passage",`মানুষের নিজের মতামত থাকা স্বাভাবিক, কিন্তু সব মতামত সমানভাবে শক্তিশালী নয়। নির্ভরযোগ্য তথ্য, যুক্তি ও উদাহরণ থাকলে মত বেশি গ্রহণযোগ্য হয়। নতুন প্রমাণ পাওয়া গেলে পুরোনো মত পরিবর্তন করা দুর্বলতা নয়; বরং এটি যুক্তিবাদী চিন্তার পরিচয়।`),
...group("Story analysis",`একটি বিদ্যালয় ফল উন্নত করতে প্রতিদিন অতিরিক্ত এক ঘণ্টা ক্লাস নিল। ছয় সপ্তাহ পরে কিছু ফল উন্নত হলেও অনুপস্থিতি ও ক্লান্তি বেড়ে গেল। মায়া প্রস্তাব দিল কোন বিষয়গুলোতে সমস্যা হচ্ছে তা আগে নির্ধারণ করা হোক। তথ্য বিশ্লেষণে নির্দিষ্ট কয়েকটি অধ্যায় শনাক্ত করে সহায়তা সেশন চালু করা হলো। পরে ফল উন্নত হলো এবং অনুপস্থিতিও কমল।
১. বিদ্যালয়ের প্রথম পরিকল্পনা কী ছিল?
২. পরিকল্পনার ইতিবাচক ও নেতিবাচক ফল কী হয়েছিল?
৩. মায়ার প্রস্তাব আগের পরিকল্পনা থেকে কীভাবে আলাদা ছিল?
৪. বিদ্যালয়ের প্রথম পরিকল্পনার একটি দুর্বল অনুমান চিহ্নিত করো।
৫. গল্পটির মূলভাব কী?`),
...group("Research reasoning",`দাবি: ছোট শ্রেণি শিক্ষার্থীদের শেখার জন্য উপকারী হতে পারে।
প্রমাণ: ছোট শ্রেণিতে শিক্ষক প্রতিটি শিক্ষার্থীকে তুলনামূলকভাবে বেশি সময় দিতে পারেন।
বিশ্লেষণ: ব্যক্তিগত সহায়তা শিক্ষার্থীর ভুল দ্রুত শনাক্ত ও সংশোধন করতে সাহায্য করতে পারে।
সীমাবদ্ধতা: শুধু শ্রেণির আকার কমালেই ফল উন্নত হবে এমন নিশ্চয়তা নেই।
বই পড়া ও ভালো ফলের মধ্যে সম্পর্ক থাকতে পারে, তবে পরিবারের সহায়তা, বিদ্যালয়ের মান ও আগ্রহের মতো অন্য কারণও ফলকে প্রভাবিত করতে পারে।`),
...group("Argument writing",`বিদ্যালয়ে কৃত্রিম বুদ্ধিমত্তার ব্যবহার সম্পূর্ণ নিষিদ্ধ না করে নিয়ন্ত্রিতভাবে অনুমোদন করা উচিত।
এটি কঠিন ধারণা বুঝতে ও দ্রুত প্রতিক্রিয়া পেতে সাহায্য করতে পারে।
তবে নিজের কাজ না করে সরাসরি উত্তর তৈরি করলে শেখার উদ্দেশ্য ব্যাহত হবে।
তাই ব্যবহার শেখানো, উৎস যাচাই করা এবং গ্রহণযোগ্য কাজের স্পষ্ট নিয়ম তৈরি করা উচিত।
প্রতিদাবি ন্যায্যভাবে উপস্থাপন করে প্রমাণের ভিত্তিতে তার সীমাবদ্ধতা খণ্ডন করতে হবে।`),
...group("End-of-Class 9 skills",`মূল দাবি, প্রমাণ, অন্তর্নিহিত অর্থ, দৃষ্টিভঙ্গি, পক্ষপাত ও প্রেক্ষাপট বিশ্লেষণ করতে পারা উচিত।
প্রমাণ প্রাসঙ্গিক, নির্ভরযোগ্য, যথেষ্ট এবং বিশ্বাসযোগ্য কি না বিচার করতে পারা উচিত।
সহসম্পর্ক ও কারণের মধ্যে পার্থক্য বুঝতে পারা উচিত।
যুক্তির গোপন অনুমান ও সীমাবদ্ধতা শনাক্ত করতে পারা উচিত।
প্রতীক, রূপক, চিত্রকল্প, সুর, দৃষ্টিকোণ ও চরিত্রের বিকাশ বিশ্লেষণ করতে পারা উচিত।
থিসিস, দাবি, প্রমাণ, বিশ্লেষণ, প্রতিদাবি, খণ্ডন ও উপসংহার ব্যবহার করে প্রবন্ধ লিখতে পারা উচিত।`)];
export const BENGALI_CLASS_NINE_LESSON={id:"class-9",title:"Bengali Class 9: Validity, counterclaims, and disciplinary analysis",topic:"Class 09 · Validity, counterclaims, and disciplinary analysis",summary:`A complete Class 9 curriculum with ${vocabulary.length} vocabulary entries and ${phrases.length} sentences, questions, and passages.`,level:"Class 9",focus:"Research validity, claims and counterclaims, correlation and causation, literary interpretation, disciplinary vocabulary, and evidence-based argument",vocab:vocabulary,phrases,practice:[{type:"Validity",prompt:"Evaluate a study's method, variables, evidence, sample, accuracy, and limitations.",answer:"Explain what conclusions the evidence supports and what cannot be generalized."},{type:"Counterclaim",prompt:"Present the strongest opposing claim fairly and refute it with relevant evidence.",answer:"Acknowledge legitimate concerns before explaining the counterclaim's limitations."},{type:"Synthesis",prompt:"Compare multiple sources and build a qualified conclusion.",answer:"State agreements, conflicts, source quality, and remaining uncertainty."}],notes:["Class 8 vocabulary is retained as spiral review and extended with Class 9 disciplinary terms.","Distinguish correlation from causation and identify hidden assumptions.","Revise conclusions when stronger evidence becomes available."]};

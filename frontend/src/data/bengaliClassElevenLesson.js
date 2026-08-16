import { BENGALI_CLASS_TEN_LESSON } from "./bengaliClassTenLesson.js";

const meanings={প্রতিপাদ্য:"central thesis",যুক্তিক্রম:"chain of reasoning",পূর্বধারণা:"presupposition","ব্যাখ্যামূলক কাঠামো":"interpretive framework","ধারণাগত সম্পর্ক":"conceptual relationship","গবেষণা পদ্ধতি":"research methodology","গুণগত তথ্য":"qualitative data","পরিমাণগত তথ্য":"quantitative data","পদ্ধতিগত সীমাবদ্ধতা":"methodological limitation","গবেষণার ফলাফল":"research findings",পুনরুৎপাদনযোগ্যতা:"reproducibility",নিরপেক্ষতা:"objectivity",বাক্যতত্ত্ব:"syntax",শব্দতত্ত্ব:"lexicology",ধ্বনিতত্ত্ব:"phonetics",রূপতত্ত্ব:"morphology",ভাবসম্প্রসারণ:"idea expansion",সারমর্ম:"gist","পারিভাষিক শব্দ":"technical term","প্রমিত ভাষা":"standard language","আঞ্চলিক ভাষা":"regional language",রীতিভেদ:"register variation","কাহিনির গঠন":"narrative structure",অন্তর্দ্বন্দ্ব:"internal conflict",বহির্দ্বন্দ্ব:"external conflict",ট্র্যাজেডি:"tragedy",কৌতুক:"comedy",নাটকীয়তা:"dramatic quality",বর্ণনাভঙ্গি:"narrative mode",কথক:"narrator","অবিশ্বস্ত কথক":"unreliable narrator",অস্তিত্ব:"existence",বাস্তবতা:"reality",নৈতিকতা:"ethics","স্বাধীন ইচ্ছা":"free will",চেতনা:"consciousness",পরিচয়:"identity",যুক্তিবাদ:"rationalism",অভিজ্ঞতাবাদ:"empiricism",মানবতাবাদ:"humanism",ব্যক্তিস্বাধীনতা:"individual liberty","সামাজিক দায়িত্ব":"social responsibility","নৈতিক দ্বন্দ্ব":"ethical dilemma","সামাজিক কাঠামো":"social structure",শ্রেণি:"class",মর্যাদা:"status","সামাজিক বৈষম্য":"social inequality","সামাজিক গতিশীলতা":"social mobility",সামাজিকীকরণ:"socialization","লিঙ্গভিত্তিক ভূমিকা":"gender role","নাগরিক সমাজ":"civil society","ক্ষমতার সম্পর্ক":"power relations",অন্তর্ভুক্তি:"inclusion",প্রান্তিকতা:"marginalization",সার্বভৌমত্ব:"sovereignty","রাজনৈতিক দল":"political party","মৌলিক অধিকার":"fundamental rights","ক্ষমতার বিভাজন":"separation of powers","মতপ্রকাশের স্বাধীনতা":"freedom of expression","রাজনৈতিক বৈধতা":"political legitimacy","রাষ্ট্রীয় প্রতিষ্ঠান":"state institution","সামাজিক আন্দোলন":"social movement","ক্ষমতার রূপান্তর":"transformation of power","অর্থনৈতিক পরিবর্তন":"economic change","ঐতিহাসিক ব্যাখ্যা":"historical interpretation","ঐতিহাসিক স্মৃতি":"historical memory",সূত্রসমালোচনা:"source criticism",প্রতিযোগিতা:"competition",মুদ্রানীতি:"monetary policy",রাজস্বনীতি:"fiscal policy","জাতীয় আয়":"national income","বাজার ব্যর্থতা":"market failure",বহিঃপ্রভাব:"externality","সুযোগ ব্যয়":"opportunity cost",প্রণোদনা:"incentive","পরিবেশগত ঝুঁকি":"environmental risk","পরিবেশগত ন্যায়":"environmental justice",জলসংকট:"water crisis","নিয়ন্ত্রণ দল":"control group","পরিসংখ্যানগত সম্পর্ক":"statistical relationship",সহসম্পর্ক:"correlation","ত্রুটির সীমা":"margin of error","বৈজ্ঞানিক ঐকমত্য":"scientific consensus","মেশিন লার্নিং":"machine learning","প্রশিক্ষণ ডেটা":"training data","ডিজিটাল পরিচয়":"digital identity",নজরদারি:"surveillance","ডিজিটাল নৈতিকতা":"digital ethics","প্রযুক্তিগত বৈষম্য":"technological inequality","অ্যালগরিদমিক সিদ্ধান্ত":"algorithmic decision",সংবাদ:"news",সম্পাদকীয়:"editorial",গৌণ:"secondary",প্রচারণা:"propaganda","তথ্য নির্বাচন":"information selection","সম্পাদকীয় অবস্থান":"editorial position","উৎসের বিশ্বাসযোগ্যতা":"source credibility","স্বার্থের সংঘাত":"conflict of interest",আচরণ:"behavior",স্মৃতি:"memory",উপলব্ধি:"perception",ব্যক্তিত্ব:"personality",আবেগ:"emotion",আত্মপরিচয়:"self-identity","সামাজিক প্রভাব":"social influence","দলগত আচরণ":"group behavior","সিদ্ধান্ত গ্রহণ":"decision-making","নিশ্চিতকরণ পক্ষপাত":"confirmation bias","মানসিক স্থিতিস্থাপকতা":"psychological resilience","পাল্টা উদাহরণ":"counterexample",ব্যতিক্রম:"exception","যৌক্তিক অসংগতি":"logical inconsistency","অন্তর্নিহিত অনুমান":"implicit assumption","বিকল্প ব্যাখ্যা":"alternative explanation","প্রমাণের ভার":"burden of proof",খণ্ডনযোগ্যতা:"falsifiability",একইসঙ্গে:"simultaneously",পক্ষান্তরে:"on the other hand",ফলত:"consequently",উল্লেখযোগ্যভাবে:"notably",বস্তুনিষ্ঠ:"objective",ব্যক্তিনিষ্ঠ:"subjective",প্রকাশ্য:"explicit",নির্ভরশীল:"dependent",কেন্দ্রীভূত:"centralized",বিকেন্দ্রীভূত:"decentralized",সামঞ্জস্য:"consistency",অসামঞ্জস্য:"inconsistency",বর্জন:"exclusion",কাঠামোগত:"structural"};
const known=Object.fromEntries(BENGALI_CLASS_TEN_LESSON.vocab.map(({bn,en})=>[bn,en]));
const category=(name,text)=>text.split(", ").map(bn=>({bn,en:meanings[bn]||known[bn]||`Class 11 term: ${bn}`,category:`Class 11 · ${name}`}));
const advanced=[
...category("Higher academic words","প্রতিপাদ্য, যুক্তিক্রম, পূর্বধারণা, ব্যাখ্যামূলক কাঠামো, ধারণাগত সম্পর্ক"),
...category("Research and academic writing","গবেষণা পদ্ধতি, গুণগত তথ্য, পরিমাণগত তথ্য, পদ্ধতিগত সীমাবদ্ধতা, গবেষণার ফলাফল, পুনরুৎপাদনযোগ্যতা, নিরপেক্ষতা"),
...category("Advanced Bengali language","বাক্যতত্ত্ব, শব্দতত্ত্ব, ধ্বনিতত্ত্ব, রূপতত্ত্ব, ভাবসম্প্রসারণ, সারমর্ম, পারিভাষিক শব্দ, প্রমিত ভাষা, আঞ্চলিক ভাষা, রীতিভেদ"),
...category("Advanced literary analysis","কাহিনির গঠন, অন্তর্দ্বন্দ্ব, বহির্দ্বন্দ্ব, ট্র্যাজেডি, কৌতুক, নাটকীয়তা, বর্ণনাভঙ্গি, কথক, অবিশ্বস্ত কথক"),
...category("Philosophy","অস্তিত্ব, বাস্তবতা, নৈতিকতা, স্বাধীন ইচ্ছা, চেতনা, পরিচয়, যুক্তিবাদ, অভিজ্ঞতাবাদ, মানবতাবাদ, ব্যক্তিস্বাধীনতা, সামাজিক দায়িত্ব, নৈতিক দ্বন্দ্ব"),
...category("Sociology","সামাজিক কাঠামো, শ্রেণি, মর্যাদা, সামাজিক বৈষম্য, সামাজিক গতিশীলতা, সামাজিকীকরণ, লিঙ্গভিত্তিক ভূমিকা, নাগরিক সমাজ, ক্ষমতার সম্পর্ক, অন্তর্ভুক্তি, প্রান্তিকতা"),
...category("Political science","সার্বভৌমত্ব, রাজনৈতিক দল, মৌলিক অধিকার, ক্ষমতার বিভাজন, মতপ্রকাশের স্বাধীনতা, রাজনৈতিক বৈধতা, রাষ্ট্রীয় প্রতিষ্ঠান"),
...category("History and source criticism","সামাজিক আন্দোলন, ক্ষমতার রূপান্তর, অর্থনৈতিক পরিবর্তন, ঐতিহাসিক ব্যাখ্যা, ঐতিহাসিক স্মৃতি, সূত্রসমালোচনা"),
...category("Economics","প্রতিযোগিতা, মুদ্রানীতি, রাজস্বনীতি, জাতীয় আয়, বাজার ব্যর্থতা, বহিঃপ্রভাব, সুযোগ ব্যয়, প্রণোদনা"),
...category("Environment","পরিবেশগত ঝুঁকি, পরিবেশগত ন্যায়, জলসংকট"),
...category("Scientific reasoning","নিয়ন্ত্রণ দল, পরিসংখ্যানগত সম্পর্ক, সহসম্পর্ক, ত্রুটির সীমা, বৈজ্ঞানিক ঐকমত্য"),
...category("AI and technology","মেশিন লার্নিং, প্রশিক্ষণ ডেটা, ডিজিটাল পরিচয়, নজরদারি, ডিজিটাল নৈতিকতা, প্রযুক্তিগত বৈষম্য, অ্যালগরিদমিক সিদ্ধান্ত"),
...category("Media literacy","সংবাদ, সম্পাদকীয়, গৌণ, প্রচারণা, তথ্য নির্বাচন, সম্পাদকীয় অবস্থান, উৎসের বিশ্বাসযোগ্যতা, স্বার্থের সংঘাত"),
...category("Psychology","আচরণ, স্মৃতি, উপলব্ধি, ব্যক্তিত্ব, আবেগ, আত্মপরিচয়, সামাজিক প্রভাব, দলগত আচরণ, সিদ্ধান্ত গ্রহণ, নিশ্চিতকরণ পক্ষপাত, মানসিক স্থিতিস্থাপকতা"),
...category("Logic and critical thinking","পাল্টা উদাহরণ, ব্যতিক্রম, যৌক্তিক অসংগতি, অন্তর্নিহিত অনুমান, বিকল্প ব্যাখ্যা, প্রমাণের ভার, খণ্ডনযোগ্যতা"),
...category("Advanced connectors and contrasts","একইসঙ্গে, পক্ষান্তরে, ফলত, উল্লেখযোগ্যভাবে, বস্তুনিষ্ঠ, ব্যক্তিনিষ্ঠ, প্রকাশ্য, নির্ভরশীল, কেন্দ্রীভূত, বিকেন্দ্রীভূত, সামঞ্জস্য, অসামঞ্জস্য, বর্জন, কাঠামোগত")];
const seen=new Set();const vocabulary=[...BENGALI_CLASS_TEN_LESSON.vocab.map(item=>({...item,category:item.category.replace(/^Class 10[^·]*/,"Class 11 · spiral review")})),...advanced].filter(item=>{if(seen.has(item.bn))return false;seen.add(item.bn);return true});
const group=(name,text)=>text.trim().split("\n").filter(Boolean).map((bn,i)=>({bn,en:`${name} practice ${i+1}`,context:name,category:`Class 11 · ${name}`}));
const phrases=[
...group("Literary criticism",`লেখকের ভাষাশৈলী পাঠকের অনুভূতিকে নির্দিষ্ট দিকে পরিচালিত করে।
চরিত্রটির সিদ্ধান্ত তার অভ্যন্তরীণ দ্বন্দ্বের ফল।
কাহিনির পটভূমি শুধু ঘটনাস্থল নয়, প্রতিপাদ্য গঠনেরও একটি গুরুত্বপূর্ণ উপাদান।
প্রতীকটির অর্থ পুরো সাহিত্যকর্মের প্রেক্ষাপটে বিবেচনা করা উচিত।
এই অংশে লেখক ব্যক্তিগত অভিজ্ঞতার মাধ্যমে বৃহত্তর সামাজিক বাস্তবতা তুলে ধরেছেন।
কথকের দৃষ্টিভঙ্গি সীমিত হওয়ায় পাঠক সব তথ্য সরাসরি জানতে পারে না।`),
...group("Historical and economic analysis",`কোনো ঐতিহাসিক উৎসকে তার সময়কাল ও উদ্দেশ্যের বাইরে বিচার করা উচিত নয়।
প্রাথমিক উৎস গুরুত্বপূর্ণ হলেও তা স্বয়ংক্রিয়ভাবে নিরপেক্ষ নয়।
ঐতিহাসিক পরিবর্তনের পেছনে রাজনৈতিক, অর্থনৈতিক ও সামাজিক কারণ একসঙ্গে কাজ করতে পারে।
পরবর্তী ফলাফল দেখে অতীতের সিদ্ধান্তকে অনিবার্য বলে ধরে নেওয়া ঠিক নয়।
কোনো নীতির শুধু সরাসরি খরচ নয়, সুযোগ ব্যয়ও বিবেচনা করা দরকার।
অর্থনৈতিক প্রবৃদ্ধি ঘটলেও তার সুফল সমানভাবে বিতরণ নাও হতে পারে।
একটি নীতির অনিচ্ছাকৃত পার্শ্বপ্রতিক্রিয়াও বিশ্লেষণ করা উচিত।`),
...group("Scientific reasoning",`ফলাফল অনুমানের সঙ্গে সামঞ্জস্যপূর্ণ হলেও তা অনুমানকে চূড়ান্তভাবে প্রমাণ করে না।
একটি গবেষণার ফল পুনরাবৃত্তি করা গেলে তার বিশ্বাসযোগ্যতা বাড়ে।
সহসম্পর্ক কারণের ইঙ্গিত দিতে পারে, কিন্তু কারণ প্রমাণ করে না।
নিয়ন্ত্রণ দল না থাকলে পরিবর্তনের প্রকৃত কারণ নির্ধারণ কঠিন হতে পারে।
নমুনা প্রতিনিধিত্বশীল না হলে ফলাফল সাধারণীকরণ করা উচিত নয়।`),
...group("Source evaluation",`উৎসটির লেখক কে?
লেখকের সংশ্লিষ্ট বিষয়ে দক্ষতা কতটা?
প্রকাশক কে?
তথ্য সংগ্রহের পদ্ধতি কী?
কোন প্রমাণ ব্যবহার করা হয়েছে?
বিপরীত প্রমাণ উপস্থাপন করা হয়েছে কি?
উৎসটির আর্থিক, রাজনৈতিক বা ব্যক্তিগত স্বার্থ আছে কি?
একই তথ্য অন্য স্বাধীন উৎসে পাওয়া যায় কি?`),
...group("Critical analysis",`প্রথমে বিষয়টির ধারণাগত কাঠামো স্পষ্ট করা দরকার।
এই প্রশ্নের উত্তর দেওয়ার আগে প্রাসঙ্গিক প্রেক্ষাপট বিবেচনা করা জরুরি।
বিষয়টিকে একটি মাত্র কারণ দিয়ে ব্যাখ্যা করা যথেষ্ট নয়।
উপস্থিত প্রমাণের ভিত্তিতে বলা যায় যে...
প্রাথমিকভাবে এই সিদ্ধান্ত যুক্তিসঙ্গত মনে হলেও আরও তথ্য প্রয়োজন।
এটিকে নিশ্চিত কারণ না বলে একটি সম্ভাব্য ব্যাখ্যা বলা অধিক যথাযথ।`),
...group("Evidence and counterclaims",`এই প্রমাণটি দাবিটির সঙ্গে সম্পর্কিত, কারণ...
প্রমাণ ও দাবির মধ্যে সম্পর্ক স্পষ্টভাবে ব্যাখ্যা করা জরুরি।
প্রমাণটি প্রাসঙ্গিক হলেও যথেষ্ট নয়।
অন্য সম্ভাব্য কারণগুলো নিয়ন্ত্রণ করা হয়নি।
ফলাফলটি সহসম্পর্ক দেখায়, সরাসরি কারণ নয়।
বিপরীত অবস্থানের সবচেয়ে শক্তিশালী যুক্তি হলো...
প্রতিদাবিটি মূল সমস্যার একটি বাস্তব দিক তুলে ধরে।
তবে এই যুক্তি একটি গুরুত্বপূর্ণ বিষয় উপেক্ষা করে।`),
...group("Comparison and synthesis",`প্রথম ব্যাখ্যাটি ব্যক্তিগত কারণকে গুরুত্ব দেয়, আর দ্বিতীয়টি কাঠামোগত কারণকে।
দুটি ব্যাখ্যাই কিছু প্রমাণের সঙ্গে সামঞ্জস্যপূর্ণ।
সম্ভবত দুটি কারণই একসঙ্গে কাজ করেছে।
বিভিন্ন উৎস একত্রে বিবেচনা করলে একটি জটিল চিত্র পাওয়া যায়।
দুটি দৃষ্টিভঙ্গি পরস্পরবিরোধী না হয়ে পরিপূরকও হতে পারে।
সব তথ্য মিলিয়ে দেখা যায় যে সমস্যাটি বহুমাত্রিক।`),
...group("Ethical analysis",`একটি সিদ্ধান্ত আইনসম্মত হলেই তা নৈতিকভাবে সঠিক হয় না।
ব্যক্তিগত স্বাধীনতা ও সামাজিক কল্যাণের মধ্যে ভারসাম্য প্রয়োজন।
একটি নীতির সুবিধা কারা পায় এবং ক্ষতি কারা বহন করে তা বিবেচনা করা উচিত।
নৈতিক সিদ্ধান্তে উদ্দেশ্য ও ফলাফল উভয়ই গুরুত্বপূর্ণ হতে পারে।`),
...group("Literary interpretation",`এই প্রতীকটি বিচ্ছিন্নতার ধারণাকে প্রতিনিধিত্ব করতে পারে।
লেখক প্রকৃতির বর্ণনাকে চরিত্রটির মানসিক অবস্থার প্রতিফলন হিসেবে ব্যবহার করেছেন।
পুনরাবৃত্ত শব্দটি স্মৃতি ও অনুতাপের অনুভূতি জোরালো করে।
কথকের সীমিত দৃষ্টিভঙ্গি পাঠকের জ্ঞানকে ইচ্ছাকৃতভাবে সীমাবদ্ধ রাখে।
শেষ দৃশ্যটি পুরো কাহিনির প্রতিপাদ্যকে নতুন অর্থ দেয়।`),
...group("Advanced sentences",`কোনো যুক্তির উপসংহার সত্য হতে পারে, কিন্তু তার যুক্তিক্রম দুর্বল হতে পারে।
বস্তুনিষ্ঠতার চেষ্টা জরুরি, তবে গবেষকের নিজের পূর্বধারণা সম্পূর্ণভাবে দূর করা সব সময় সম্ভব নয়।
একটি ঐতিহাসিক ঘটনার ব্যাখ্যা কোন উৎসকে গুরুত্ব দেওয়া হচ্ছে তার ওপরও নির্ভর করে।
একটি পরিসংখ্যানগত সম্পর্ক বাস্তবে গুরুত্বপূর্ণ কি না তা শুধু সংখ্যাগত তাৎপর্য দিয়ে নির্ধারণ করা যায় না।
সাহিত্যিক ব্যাখ্যা একাধিক হতে পারে, তবে পাঠ্যপ্রমাণের সঙ্গে সামঞ্জস্য থাকা দরকার।`),
...group("Freedom of expression passage",`মতপ্রকাশের স্বাধীনতা গণতান্ত্রিক সমাজের গুরুত্বপূর্ণ ভিত্তি। তবে সরাসরি সহিংসতার আহ্বান, মানহানি বা ইচ্ছাকৃত ক্ষতিকর মিথ্যা তথ্যের ক্ষেত্রে সীমা নিয়ে বিতর্ক রয়েছে। তাই প্রশ্ন শুধু স্বাধীনতা থাকা উচিত কি না নয়, বরং কোন সীমা ন্যায্য এবং সেই সীমা কে নির্ধারণ করবে।`),
...group("Growth and inequality passage",`অর্থনৈতিক প্রবৃদ্ধি একটি দেশের মোট সম্পদ বাড়াতে পারে, কিন্তু সম্পদ কীভাবে বিতরণ হচ্ছে তা আলাদা প্রশ্ন। সুফল ছোট গোষ্ঠীর কাছে গেলে জাতীয় আয় বাড়লেও বৈষম্য বাড়তে পারে। তাই অর্থনীতির আকারের পাশাপাশি মানুষের বাস্তব জীবনমানও মূল্যায়ন করা জরুরি।`),
...group("AI and work passage",`কৃত্রিম বুদ্ধিমত্তা কিছু কাজ স্বয়ংক্রিয় করতে পারে এবং নতুন কাজও সৃষ্টি করতে পারে। শুধু কত চাকরি হারাবে তা নয়, কোন দক্ষতার চাহিদা বাড়বে সেটিও গুরুত্বপূর্ণ। নতুন দক্ষতা শেখার সুযোগ না থাকলে প্রযুক্তিগত পরিবর্তন বৈষম্য বাড়াতে পারে।`),
...group("Literary symbol sample",`এক তরুণ তার বাবার অচল পুরোনো ঘড়ি বহন করে। গুরুত্বপূর্ণ সিদ্ধান্তের আগে সে ঘড়িটি খুলে দেখে এবং পরে বাক্সে রেখে দেয়। অচল ঘড়িটি অতীতের সঙ্গে আবেগগত বন্ধনের প্রতীক; সেটি রেখে দেওয়া অতীতকে অস্বীকার নয়, বরং তার প্রভাব থেকে স্বাধীন হওয়ার ইঙ্গিত।`),
...group("Research analysis",`যারা প্রতিদিন এক ঘণ্টা পড়ে তাদের গড় ফল বেশি—এটি সহসম্পর্ক, সরাসরি কারণের প্রমাণ নয়।
পরিবার, শিক্ষক, পূর্বের ফলাফল ও শিক্ষার্থীর আগ্রহের মতো কারণ বিবেচনা করা দরকার।
কারণ প্রমাণের জন্য তুলনামূলক ও নিয়ন্ত্রিত গবেষণা প্রয়োজন।
বিদ্যালয়ের ঘোষণায় একটি সীমিত পর্যবেক্ষণ থেকে অতিরিক্ত সাধারণীকরণ রয়েছে।`),
...group("Ethical dilemma",`একজন রোগীর ব্যয়বহুল চিকিৎসা এবং বহু রোগীর মৌলিক চিকিৎসার মধ্যে সীমিত সম্পদ কীভাবে বণ্টন করা উচিত?
ব্যক্তিগত রোগীর অধিকার, সমান সুযোগ, সম্ভাব্য ফলাফল এবং সিদ্ধান্ত গ্রহণের বৈধ ক্ষমতা—সবগুলো মূল্যবোধ বিবেচনা করা দরকার।`),
...group("Formal essay structure",`ভূমিকায় প্রেক্ষাপট, মূল বিতর্ক ও স্পষ্ট থিসিস দাও।
মূল অনুচ্ছেদে দাবি, প্রমাণ, বিশ্লেষণ ও তাৎপর্য ব্যাখ্যা করো।
বিপরীত অবস্থানের শক্তিশালী রূপ ন্যায্যভাবে উপস্থাপন করো।
প্রতিদাবির শক্তি স্বীকার করে তার সীমাবদ্ধতা বিশ্লেষণ করো।
বিভিন্ন উৎস ও যুক্তি সংশ্লেষণ করে সূক্ষ্ম সিদ্ধান্ত তৈরি করো।
উপসংহারে থিসিসের তাৎপর্য, সীমাবদ্ধতা ও বৃহত্তর প্রভাব দাও।`),
...group("End-of-Class 11 skills",`থিসিস, প্রতিপাদ্য, যুক্তি, প্রমাণ, পূর্বধারণা, অন্তর্নিহিত অর্থ, সীমাবদ্ধতা ও প্রেক্ষাপট বিশ্লেষণ করতে পারা উচিত।
নির্ভরযোগ্যতা, বৈধতা, প্রাসঙ্গিকতা, প্রতিনিধিত্বশীলতা ও পর্যাপ্ততা আলাদাভাবে বিচার করতে পারা উচিত।
সহসম্পর্ক, কারণ, বিকল্প ব্যাখ্যা ও বিভ্রান্তিকারী চলকের পার্থক্য বুঝতে পারা উচিত।
বিভিন্ন উৎস সংশ্লেষণ করে সূক্ষ্ম ও শর্তসাপেক্ষ উপসংহার তৈরি করতে পারা উচিত।
বর্ণনাকারীর বিশ্বাসযোগ্যতা, অন্তর্দ্বন্দ্ব, ভাষাশৈলী, ঐতিহাসিক প্রেক্ষাপট ও বহুবিধ ব্যাখ্যা বিশ্লেষণ করতে পারা উচিত।
নৈতিক প্রশ্নে মূল্যবোধের সংঘাত এবং প্রতিটি অবস্থানের শক্তি ও দুর্বলতা ব্যাখ্যা করতে পারা উচিত।`)];
export const BENGALI_CLASS_ELEVEN_LESSON={id:"class-11",title:"Bengali Class 11: Methodology, interpretation, and conditional synthesis",topic:"Class 11 · Methodology, interpretation, and conditional synthesis",summary:`A complete Class 11 curriculum with ${vocabulary.length} vocabulary entries and ${phrases.length} sentences, questions, and passages.`,level:"Class 11",focus:"Research methodology, reproducibility, source criticism, philosophy, sociology, ethics, narrator reliability, and nuanced synthesis",vocab:vocabulary,phrases,practice:[{type:"Methodology",prompt:"Evaluate qualitative and quantitative methods, sampling, controls, bias, reproducibility, and generalizability.",answer:"Explain which inferences are warranted and which require more evidence."},{type:"Interpretation",prompt:"Develop competing literary or historical interpretations and test each against the evidence.",answer:"Address narrator or source limitations and contextual assumptions."},{type:"Ethical synthesis",prompt:"Analyze a dilemma involving conflicting rights, outcomes, duties, and distributions.",answer:"Represent each value fairly and form a conditional, evidence-aware conclusion."}],notes:["Class 10 vocabulary is retained as spiral review and extended with Class 11 disciplinary concepts.","Separate source neutrality from source usefulness and accuracy.","Prefer nuanced conclusions that state evidence, conditions, and uncertainty."]};

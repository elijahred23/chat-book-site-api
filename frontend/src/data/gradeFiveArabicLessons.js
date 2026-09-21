const items = (rows, category, context) => rows.map(([ar, pronunciation, en]) => ({ ar, pronunciation, en, category, ...(context ? { context } : {}) }));
const lesson = ({ id, title, summary, topic, focus, vocab, phrases, notes = [] }) => ({
  id, title, summary, level: "Class 5", topic, focus, vocab: items(vocab, topic),
  phrases: items(phrases, topic, `Use this sentence while practicing ${topic.toLowerCase()}.`), practice: [],
  notes: ["Read for the overall meaning first. Then identify tense, connectors, reasons, and supporting details.", ...notes],
});

export const GRADE_FIVE_ARABIC_LESSONS = [
  lesson({
    id: "class-5-conversation", title: "Explain What You Mean", summary: "Discuss experiences and plans, express uncertainty, and request clearer explanations.", topic: "Everyday Conversation", focus: "natural follow-up and clarification",
    vocab: [["مُزْدَحِم", "muzdaḥim", "busy"], ["أُقَرِّرُ", "uqarriru", "I decide"], ["مُتَأَكِّد", "mutaʾakkid", "sure"], ["أَقْصِدُ", "aqṣidu", "I mean"], ["تَقْلَقْ", "taqlaq", "worry"]],
    phrases: [
      ["كَيْفَ كَانَ يَوْمُكَ؟", "kayfa kāna yawmuka?", "How was your day?"], ["كَانَ يَوْمِي مُزْدَحِمًا", "kāna yawmī muzdahiman", "My day was busy"],
      ["مَاذَا فَعَلْتَ بَعْدَ الْمَدْرَسَةِ؟", "mādhā faʿalta baʿda al-madrasah?", "What did you do after school?"], ["ذَهَبْتُ إِلَى الْبَيْتِ وَاسْتَرَحْتُ", "dhahabtu ilā al-bayti wastaraḥtu", "I went home and rested"],
      ["مَاذَا سَتَفْعَلُ فِي عُطْلَةِ نِهَايَةِ الْأُسْبُوعِ؟", "mādhā satafʿalu fī ʿuṭlati nihāyati al-usbūʿ?", "What will you do this weekend?"], ["لَمْ أُقَرِّرْ بَعْدُ", "lam uqarrir baʿdu", "I haven’t decided yet"],
      ["أَعْتَقِدُ أَنَّكَ عَلَى حَقٍّ", "aʿtaqidu annaka ʿalā ḥaqqin", "I think you’re right"], ["لَسْتُ مُتَأَكِّدًا", "lastu mutaʾakkidan", "I’m not sure"],
      ["مَاذَا تَعْنِي بِذَلِكَ؟", "mādhā taʿnī bidhālika?", "What do you mean by that?"], ["هَلْ يُمْكِنُكَ أَنْ تَشْرَحَ ذَلِكَ؟", "hal yumkinuka an tashraḥa dhālika?", "Can you explain that?"],
      ["أَفْهَمُ مَا تَقُولُ", "afhamu mā taqūlu", "I understand what you’re saying"], ["هَذَا مَا كُنْتُ أَقْصِدُهُ", "hādhā mā kuntu aqṣiduhu", "That’s what I meant"],
      ["لَا تَقْلَقْ", "lā taqlaq", "Don’t worry"], ["كُلُّ شَيْءٍ سَيَكُونُ بِخَيْرٍ", "kullu shayʾin sayakūnu bikhayrin", "Everything will be fine"],
    ],
  }),
  lesson({
    id: "class-5-learning-reading", title: "Learning and Reading Strategies", summary: "Reflect on progress, learn from mistakes, and infer meaning from context.", topic: "Education and Reading", focus: "academic strategies and reflection",
    vocab: [["تَدْرِيب", "tadrīb", "practice"], ["سِيَاق", "siyāq", "context"], ["فِكْرَة رَئِيسِيَّة", "fikrah raʾīsiyyah", "main idea"], ["مَعْنَى", "maʿnā", "meaning"], ["خَطَأ", "khaṭaʾ", "mistake"]],
    phrases: [
      ["أَتَعَلَّمُ أَشْيَاءَ جَدِيدَةً كُلَّ يَوْمٍ", "ataʿallamu ashyāʾan jadīdatan kulla yawmin", "I learn new things every day"], ["أُحَاوِلُ أَنْ أُحَسِّنَ قِرَاءَتِي", "uḥāwilu an uḥassina qirāʾatī", "I try to improve my reading"],
      ["أَحْتَاجُ إِلَى مَزِيدٍ مِنَ التَّدْرِيبِ", "aḥtāju ilā mazīdin mina at-tadrīb", "I need more practice"], ["أَصْبَحَ الدَّرْسُ أَصْعَبَ بَعْدَ ذَلِكَ", "aṣbaḥa ad-darsu aṣʿaba baʿda dhālika", "The lesson became harder after that"],
      ["شَرَحَ الْمُعَلِّمُ الْفِكْرَةَ بِوُضُوحٍ", "sharaḥa al-muʿallimu al-fikrata biwuḍūḥin", "The teacher explained the idea clearly"], ["عَمِلْنَا فِي مَجْمُوعَاتٍ صَغِيرَةٍ", "ʿamilnā fī majmūʿātin ṣaghīrah", "We worked in small groups"],
      ["نَاقَشْنَا الْمَوْضُوعَ فِي الْفَصْلِ", "nāqashnā al-mawḍūʿa fī al-faṣl", "We discussed the topic in class"], ["تَعَلَّمْتُ مِنْ خَطَئِي", "taʿallamtu min khaṭaʾī", "I learned from my mistake"],
      ["أَحْيَانًا أَجِدُ كَلِمَاتٍ لَا أَعْرِفُهَا", "aḥyānan ajidu kalimātin lā aʿrifuhā", "Sometimes I find words I don’t know"], ["أَبْحَثُ عَنْ مَعْنَى الْكَلِمَةِ", "abḥathu ʿan maʿnā al-kalimah", "I look for the meaning of the word"],
      ["أُحَاوِلُ أَنْ أَفْهَمَ الْمَعْنَى مِنَ السِّيَاقِ", "uḥāwilu an afhama al-maʿnā mina as-siyāq", "I try to understand the meaning from context"], ["أَسْتَطِيعُ أَنْ أَفْهَمَ الْفِكْرَةَ الرَّئِيسِيَّةَ", "astaṭīʿu an afhama al-fikrata ar-raʾīsiyyah", "I can understand the main idea"],
    ],
  }),
  lesson({
    id: "class-5-family-friends", title: "Family, Friends, and Cooperation", summary: "Discuss shared responsibilities, respect, disagreement, and reconciliation.", topic: "Relationships", focus: "cooperation and problem-solving",
    vocab: [["مَسْؤُولِيَّات", "masʾūliyyāt", "responsibilities"], ["نَتَعَاوَنُ", "nataʿāwanu", "we cooperate"], ["مُقَرَّب", "muqarrab", "close"], ["نَحْتَرِمُ", "naḥtarimu", "we respect"], ["اعْتَذَرْتُ", "iʿtadhartu", "I apologized"]],
    phrases: [
      ["نَتَحَدَّثُ عَمَّا حَدَثَ خِلَالَ الْيَوْمِ", "nataḥaddathu ʿammā ḥadatha khilāla al-yawm", "We talk about what happened during the day"], ["لِكُلِّ شَخْصٍ مَسْؤُولِيَّاتٌ فِي الْبَيْتِ", "likulli shakhsin masʾūliyyātun fī al-bayt", "Everyone has responsibilities at home"],
      ["أَخِي مَسْؤُولٌ عَنْ إِطْعَامِ الْقِطَّةِ", "akhī masʾūlun ʿan iṭʿāmi al-qiṭṭah", "My brother is responsible for feeding the cat"], ["نَتَعَاوَنُ لِإِنْجَازِ الْأَعْمَالِ", "nataʿāwanu liʾinjāzi al-aʿmāl", "We cooperate to finish the chores"],
      ["بَعْدَ أَنْ نُنْهِيَ عَمَلَنَا، نَسْتَرِيحُ", "baʿda an nunhiya ʿamalanā, nastarīḥu", "After we finish our work, we rest"], ["لَدَيَّ صَدِيقٌ مُقَرَّبٌ", "ladayya ṣadīqun muqarrabun", "I have a close friend"],
      ["نُسَاعِدُ بَعْضَنَا بَعْضًا", "nusāʿidu baʿḍanā baʿḍan", "We help each other"], ["الصَّدِيقُ الْجَيِّدُ يَقُولُ الْحَقَّ", "aṣ-ṣadīqu al-jayyidu yaqūlu al-ḥaqqa", "A good friend tells the truth"],
      ["يَجِبُ أَنْ نَحْتَرِمَ بَعْضَنَا بَعْضًا", "yajibu an naḥtarima baʿḍanā baʿḍan", "We should respect each other"], ["اخْتَلَفْنَا، وَلَكِنَّنَا حَلَلْنَا الْمُشْكِلَةَ", "ikhtalafnā, walākinnanā ḥalalnā al-mushkilah", "We disagreed, but we solved the problem"],
      ["اعْتَذَرْتُ لِصَدِيقِي", "iʿtadhartu liṣadīqī", "I apologized to my friend"],
    ],
  }),
  lesson({
    id: "class-5-environment-science", title: "Environment, Animals, and Science", summary: "Explain needs, habitats, conservation, and simple scientific facts.", topic: "Environment and Science", focus: "cause, effect, and obligation",
    vocab: [["بِيئَة", "bīʾah", "environment"], ["تَلَوُّث", "talawwuth", "pollution"], ["إِعَادَةُ التَّدْوِير", "iʿādatu at-tadwīr", "recycling"], ["خَيَاشِيم", "khayāshīm", "gills"], ["أُكْسِجِين", "uksijīn", "oxygen"]],
    phrases: [
      ["الْبِيئَةُ مُهِمَّةٌ لِجَمِيعِ الْكَائِنَاتِ الْحَيَّةِ", "al-bīʾatu muhimmatun lijamīʿi al-kāʾināti al-ḥayyah", "The environment is important for all living things"], ["يَجِبُ أَنْ نَحْمِيَ الْبِيئَةَ", "yajibu an naḥmiya al-bīʾah", "We should protect the environment"],
      ["تَحْتَاجُ النَّبَاتَاتُ إِلَى ضَوْءِ الشَّمْسِ", "taḥtāju an-nabātātu ilā ḍawʾi ash-shams", "Plants need sunlight"], ["تُنْتِجُ الْأَشْجَارُ الْأُكْسِجِينَ", "tuntiju al-ashjāru al-uksijīn", "Trees produce oxygen"],
      ["يَجِبُ أَلَّا نُهْدِرَ الْمَاءَ", "yajibu allā nuhdira al-māʾ", "We should not waste water"], ["يُمْكِنُنَا إِعَادَةُ تَدْوِيرِ بَعْضِ الْمَوَادِّ", "yumkinunā iʿādatu tadwīri baʿḍi al-mawādd", "We can recycle some materials"],
      ["التَّلَوُّثُ يُؤَثِّرُ فِي الْبِيئَةِ", "at-talawwuthu yuʾaththiru fī al-bīʾah", "Pollution affects the environment"], ["تَعِيشُ الْحَيَوَانَاتُ فِي بِيئَاتٍ مُخْتَلِفَةٍ", "taʿīshu al-ḥayawānātu fī bīʾātin mukhtalifah", "Animals live in different environments"],
      ["لَا تَسْتَطِيعُ كُلُّ الطُّيُورِ أَنْ تَطِيرَ", "lā tastaṭīʿu kullu aṭ-ṭuyūri an taṭīra", "Not all birds can fly"], ["يَسْتَخْدِمُ السَّمَكُ الْخَيَاشِيمَ لِلتَّنَفُّسِ", "yastakhdimu as-samaku al-khayāshīma lit-tanaffus", "Fish use gills to breathe"],
      ["الْفِيلُ مِنْ أَكْبَرِ الْحَيَوَانَاتِ الْبَرِّيَّةِ", "al-fīlu min akbari al-ḥayawānāti al-barriyyah", "The elephant is one of the largest land animals"],
    ],
  }),
  lesson({
    id: "class-5-travel-shopping", title: "Travel, Shopping, and Money", summary: "Describe a trip and make thoughtful choices about prices and saving.", topic: "Travel and Money", focus: "past experiences and financial decisions",
    vocab: [["زِيَارَة", "ziyārah", "visit"], ["اسْتَغْرَقَتْ", "istaghraqat", "took (time)"], ["صُوَر", "ṣuwar", "pictures"], ["أُوَفِّرُ", "uwaffiru", "I save"], ["أُنْفِقُ", "unfiqu", "I spend"]],
    phrases: [
      ["سَافَرْتُ مَعَ عَائِلَتِي فِي الصَّيْفِ", "sāfartu maʿa ʿāʾilatī fī aṣ-ṣayf", "I traveled with my family in summer"], ["كَانَتْ هَذِهِ أَوَّلَ زِيَارَةٍ لِي", "kānat hādhihi awwala ziyāratin lī", "This was my first visit"],
      ["اسْتَغْرَقَتِ الرِّحْلَةُ ثَلَاثَ سَاعَاتٍ", "istaghraqat ar-riḥlatu thalātha sāʿāt", "The trip took three hours"], ["زُرْنَا الْكَثِيرَ مِنَ الْأَمَاكِنِ", "zurnā al-kathīra mina al-amākin", "We visited many places"],
      ["الْتَقَطْنَا الْكَثِيرَ مِنَ الصُّوَرِ", "iltaqaṭnā al-kathīra mina aṣ-ṣuwar", "We took many pictures"], ["أَتَمَنَّى أَنْ أَزُورَهَا مَرَّةً أُخْرَى", "atamannā an azūrahā marratan ukhrā", "I hope to visit it again"],
      ["هَذَا أَغْلَى مِمَّا تَوَقَّعْتُ", "hādhā aghlā mimmā tawaqqaʿtu", "This is more expensive than I expected"], ["هَلْ لَدَيْكُمْ شَيْءٌ أَرْخَصُ؟", "hal ladaykum shayʾun arkhaṣu?", "Do you have something cheaper?"],
      ["لَيْسَ لَدَيَّ مَا يَكْفِي مِنَ الْمَالِ", "laysa ladayya mā yakfī mina al-māl", "I don’t have enough money"], ["أُحَاوِلُ أَنْ أُوَفِّرَ بَعْضَ الْمَالِ", "uḥāwilu an uwaffira baʿḍa al-māl", "I try to save some money"],
      ["قَرَّرْتُ أَلَّا أَشْتَرِيَهُ", "qarartu allā ashtariyahu", "I decided not to buy it"],
    ],
  }),
  lesson({
    id: "class-5-feelings-opinions", title: "Feelings, Opinions, and Reasons", summary: "Describe emotional causes and support an opinion with examples and results.", topic: "Feelings and Opinions", focus: "reasoned explanations",
    vocab: [["مُتَوَتِّر", "mutawattir", "nervous"], ["رَاحَة", "rāḥah", "relief"], ["فَخْر", "fakhr", "pride"], ["نَتِيجَةً لِذَلِكَ", "natījatan lidhālika", "as a result"], ["عَلَى سَبِيلِ الْمِثَالِ", "ʿalā sabīli al-mithāl", "for example"]],
    phrases: [
      ["أَشْعُرُ بِالسَّعَادَةِ عِنْدَمَا أَكُونُ مَعَ عَائِلَتِي", "ashʿuru bis-saʿādati ʿindamā akūnu maʿa ʿāʾilatī", "I feel happy when I am with my family"], ["شَعَرْتُ بِالْحُزْنِ عِنْدَمَا سَمِعْتُ الْخَبَرَ", "shaʿartu bil-ḥuzni ʿindamā samiʿtu al-khabar", "I felt sad when I heard the news"],
      ["كُنْتُ مُتَوَتِّرًا قَبْلَ الِاخْتِبَارِ", "kuntu mutawattiran qabla al-ikhtibār", "I was nervous before the test"], ["شَعَرْتُ بِالرَّاحَةِ بَعْدَ الِاخْتِبَارِ", "shaʿartu bir-rāḥati baʿda al-ikhtibār", "I felt relieved after the test"],
      ["أَشْعُرُ بِالْفَخْرِ عِنْدَمَا أَنْجَحُ", "ashʿuru bil-fakhri ʿindamā anjaḥu", "I feel proud when I succeed"], ["مِنَ الطَّبِيعِيِّ أَنْ نَشْعُرَ بِالْخَوْفِ أَحْيَانًا", "mina aṭ-ṭabīʿiyyi an nashʿura bil-khawfi aḥyānan", "It is natural to feel afraid sometimes"],
      ["فِي رَأْيِي، الْقِرَاءَةُ مُهِمَّةٌ لِأَنَّهَا تُسَاعِدُنَا عَلَى تَعَلُّمِ أَشْيَاءَ جَدِيدَةٍ", "fī raʾyī, al-qirāʾatu muhimmatun liʾannahā tusāʿidunā ʿalā taʿallumi ashyāʾin jadīdah", "In my opinion, reading is important because it helps us learn new things"],
      ["أَعْتَقِدُ أَنَّ مُسَاعَدَةَ الْآخَرِينَ شَيْءٌ مُهِمٌّ", "aʿtaqidu anna musāʿadata al-ākharīna shayʾun muhimmun", "I think helping others is important"],
    ],
  }),
  lesson({
    id: "class-5-powerful-patterns", title: "Connect and Explain", summary: "Build conditional, temporal, unfinished, and importance statements.", topic: "Sentence Patterns", focus: "if, when, before, after, and not yet",
    vocab: [["إِذَا", "idhā", "if"], ["مَعَ أَنَّ", "maʿa anna", "although"], ["بِسَبَبِ", "bisababi", "because of"], ["فِي الْبِدَايَةِ", "fī al-bidāyah", "in the beginning"], ["فِي النِّهَايَةِ", "fī an-nihāyah", "in the end"]],
    phrases: [
      ["إِذَا دَرَسْتَ جَيِّدًا، فَسَتَتَعَلَّمُ أَكْثَرَ", "idhā darasta jayyidan, fasatataʿallamu akthara", "If you study well, you will learn more"], ["عِنْدَمَا أَعُودُ إِلَى الْبَيْتِ، أَبْدَأُ وَاجِبِي", "ʿindamā aʿūdu ilā al-bayti, abdaʾu wājibī", "When I return home, I start my homework"],
      ["قَبْلَ أَنْ أَنَامَ، أَقْرَأُ كِتَابًا", "qabla an anāma, aqraʾu kitāban", "Before I sleep, I read a book"], ["بَعْدَ أَنْ أُنْهِيَ وَاجِبِي، أَلْعَبُ", "baʿda an unhiya wājibī, alʿabu", "After I finish my homework, I play"],
      ["لَمْ أُنْهِ وَاجِبِي بَعْدُ", "lam unhi wājibī baʿdu", "I haven’t finished my homework yet"], ["مِنَ الْمُهِمِّ أَنْ نَحْتَرِمَ الْآخَرِينَ", "mina al-muhimmi an naḥtarima al-ākharīn", "It is important to respect others"],
    ],
  }),
  lesson({
    id: "class-5-verb-families", title: "Build Verb Families", summary: "Recognize related present, past, and future forms instead of isolated words.", topic: "Verb Families", focus: "tense transformation",
    vocab: [["أَذْهَبُ / ذَهَبْتُ / سَأَذْهَبُ", "adhhabu / dhahabtu / saʾadhhabu", "go / went / will go"], ["أَقْرَأُ / قَرَأْتُ / سَأَقْرَأُ", "aqraʾu / qaraʾtu / saʾaqraʾu", "read / read / will read"], ["أَتَعَلَّمُ / تَعَلَّمْتُ / سَأَتَعَلَّمُ", "ataʿallamu / taʿallamtu / saʾataʿallamu", "learn / learned / will learn"], ["أُسَاعِدُ / سَاعَدْتُ / سَأُسَاعِدُ", "usāʿidu / sāʿadtu / saʾusāʿidu", "help / helped / will help"]],
    phrases: [
      ["أَذْهَبُ إِلَى الْمَدْرَسَةِ", "adhhabu ilā al-madrasati", "I go to school"], ["ذَهَبْتُ إِلَى الْمَدْرَسَةِ", "dhahabtu ilā al-madrasati", "I went to school"], ["سَأَذْهَبُ إِلَى الْمَدْرَسَةِ", "saʾadhhabu ilā al-madrasati", "I will go to school"],
      ["أَتَعَلَّمُ شَيْئًا جَدِيدًا", "ataʿallamu shayʾan jadīdan", "I learn something new"], ["تَعَلَّمْتُ شَيْئًا جَدِيدًا", "taʿallamtu shayʾan jadīdan", "I learned something new"], ["سَأَتَعَلَّمُ شَيْئًا جَدِيدًا", "saʾataʿallamu shayʾan jadīdan", "I will learn something new"],
      ["أُسَاعِدُ أَخِي", "usāʿidu akhī", "I help my brother"], ["سَاعَدْتُ أَخِي", "sāʿadtu akhī", "I helped my brother"], ["سَأُسَاعِدُ أَخِي", "saʾusāʿidu akhī", "I will help my brother"],
    ],
  }),
  lesson({
    id: "class-5-reading-new-student", title: "Reading: The New Student", summary: "Read a ten-sentence story about empathy, friendship, and a first day at school.", topic: "Connected Reading", focus: "narrative comprehension and inference",
    vocab: [["انْتَقَلَ", "intaqala", "moved"], ["خَجُول", "khajūl", "shy"], ["رَحَّبَ", "raḥḥaba", "welcomed"], ["دَعَوْتُهُ", "daʿawtuhu", "I invited him"], ["اِكْتَشَفْنَا", "iktashafnā", "we discovered"]],
    phrases: [
      ["فِي صَبَاحِ يَوْمِ الْأَحَدِ، وَصَلَ طَالِبٌ جَدِيدٌ إِلَى مَدْرَسَتِنَا.", "fī ṣabāḥi yawmi al-aḥadi, waṣala ṭālibun jadīdun ilā madrasatinā", "On Sunday morning, a new student arrived at our school."],
      ["كَانَ اسْمُهُ عُمَرَ، وَكَانَ قَدِ انْتَقَلَ مَعَ عَائِلَتِهِ مِنْ مَدِينَةٍ أُخْرَى.", "kāna ismuhu ʿUmara, wa kāna qad intaqala maʿa ʿāʾilatihi min madīnatin ukhrā", "His name was Omar, and he had moved with his family from another city."],
      ["عِنْدَمَا دَخَلَ الْفَصْلَ، بَدَا خَجُولًا وَمُتَوَتِّرًا قَلِيلًا.", "ʿindamā dakhala al-faṣla, badā khajūlan wa mutawattiran qalīlan", "When he entered the classroom, he seemed shy and a little nervous."],
      ["رَحَّبَ بِهِ الْمُعَلِّمُ وَطَلَبَ مِنْهُ أَنْ يُعَرِّفَ بِنَفْسِهِ.", "raḥḥaba bihi al-muʿallimu wa ṭalaba minhu an yuʿarrifa binafsihi", "The teacher welcomed him and asked him to introduce himself."],
      ["بَعْدَ ذَلِكَ، جَلَسَ عُمَرُ بِجَانِبِي.", "baʿda dhālika, jalasa ʿUmaru bijānibī", "After that, Omar sat beside me."],
      ["فِي وَقْتِ الِاسْتِرَاحَةِ، دَعَوْتُهُ لِيَلْعَبَ مَعِي وَمَعَ أَصْدِقَائِي.", "fī waqti al-istirāḥati, daʿawtuhu liyalʿaba maʿī wa maʿa aṣdiqāʾī", "During break time, I invited him to play with me and my friends."],
      ["فِي الْبِدَايَةِ، كَانَ هَادِئًا، وَلَكِنَّهُ بَدَأَ يَتَحَدَّثُ مَعَنَا بَعْدَ قَلِيلٍ.", "fī al-bidāyati, kāna hādiʾan, walākinnahu badaʾa yataḥaddathu maʿanā baʿda qalīlin", "At first, he was quiet, but after a while he began talking with us."],
      ["اِكْتَشَفْنَا أَنَّنَا نُحِبُّ كُرَةَ الْقَدَمِ وَالْقِرَاءَةَ.", "iktashafnā annanā nuḥibbu kurata al-qadami wal-qirāʾata", "We discovered that we both like soccer and reading."],
      ["فِي نِهَايَةِ الْيَوْمِ، أَخْبَرَنِي عُمَرُ أَنَّهُ أَصْبَحَ يَشْعُرُ بِرَاحَةٍ أَكْبَرَ.", "fī nihāyati al-yawmi, akhbaranī ʿUmaru annahu aṣbaḥa yashʿuru birāḥatin akbara", "At the end of the day, Omar told me that he had begun to feel more comfortable."],
      ["شَعَرْتُ بِالسَّعَادَةِ لِأَنِّي سَاعَدْتُهُ فِي يَوْمِهِ الْأَوَّلِ.", "shaʿartu bis-saʿādati liʾannī sāʿadtuhu fī yawmihi al-awwali", "I felt happy because I helped him on his first day."],
    ],
    notes: ["After reading, summarize the story without translating every word and explain why Omar felt better."],
  }),
];

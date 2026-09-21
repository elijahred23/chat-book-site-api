const buildItems = (rows, category, context) => rows.map(([ar, pronunciation, en]) => ({ ar, pronunciation, en, category, ...(context ? { context } : {}) }));
const buildLesson = ({ id, title, summary, topic, focus, vocab, phrases, notes = [] }) => ({
  id, title, summary, level: "Grade 4", topic, focus,
  vocab: buildItems(vocab, topic),
  phrases: buildItems(phrases, topic, `Use this sentence while practicing ${topic.toLowerCase()}.`),
  practice: [],
  notes: ["Read aloud, identify connectors and verb tense, then answer or restate the idea in a new sentence.", ...notes],
});

export const GRADE_FOUR_ARABIC_LESSONS = [
  buildLesson({
    id: "grade-4-conversation", title: "Everyday Conversation", summary: "Discuss yesterday and tomorrow, request help, and repair misunderstandings.", topic: "Conversation", focus: "past and future follow-up questions",
    vocab: [["إِجَابَة", "ijābah", "answer"], ["لَحْظَة", "laḥẓah", "moment"], ["مُمْتِع", "mumtiʿ", "fun"], ["بِالطَّبْعِ", "biṭ-ṭabʿi", "of course"], ["بِكَثِيرٍ", "bikathīrin", "by much"]],
    phrases: [
      ["كَيْفَ كَانَ يَوْمُكَ؟", "kayfa kāna yawmuka?", "How was your day?"], ["كَانَ يَوْمِي جَمِيلًا", "kāna yawmī jamīlan", "My day was nice"],
      ["مَاذَا فَعَلْتَ الْيَوْمَ؟", "mādhā faʿalta al-yawm?", "What did you do today?"], ["مَاذَا سَتَفْعَلُ غَدًا؟", "mādhā satafʿalu ghadan?", "What will you do tomorrow?"],
      ["أَيْنَ كُنْتَ أَمْسِ؟", "ayna kunta amsi?", "Where were you yesterday?"], ["مَاذَا تُرِيدُ أَنْ تَفْعَلَ؟", "mādhā turīdu an tafʿala?", "What do you want to do?"],
      ["هَلْ تَسْتَطِيعُ مُسَاعَدَتِي؟", "hal tastaṭīʿu musāʿadatī?", "Can you help me?"], ["بِالطَّبْعِ، سَأُسَاعِدُكَ", "biṭ-ṭabʿi, saʾusāʿiduka", "Of course, I will help you"],
      ["لَمْ أَفْهَمْ مَا قُلْتَ", "lam afham mā qulta", "I didn’t understand what you said"], ["هَلْ يُمْكِنُكَ أَنْ تُعِيدَ ذَلِكَ؟", "hal yumkinuka an tuʿīda dhālika?", "Can you repeat that?"],
      ["اِنْتَظِرْ لَحْظَةً، مِنْ فَضْلِكَ", "intaẓir laḥẓatan, min faḍlika", "Wait a moment, please"], ["هَذَا أَفْضَلُ بِكَثِيرٍ", "hādhā afḍalu bikathīr", "This is much better"],
    ],
  }),
  buildLesson({
    id: "grade-4-school", title: "Growing as a Student", summary: "Describe study habits, mistakes, tests, subjects, and learning strategies.", topic: "School", focus: "reflection, obligation, and comparison",
    vocab: [["مَلَاحِظَات", "malāḥaẓāt", "notes"], ["مَادَّة", "māddah", "subject"], ["عُلُوم", "ʿulūm", "science"], ["رِيَاضِيَّات", "riyāḍiyyāt", "mathematics"], ["صَحِيح", "ṣaḥīḥ", "correct"]],
    phrases: [
      ["أَبْدَأُ دِرَاسَتِي فِي الصَّبَاحِ", "abdaʾu dirāsatī fī aṣ-ṣabāḥ", "I begin my studies in the morning"], ["أَجْلِسُ بِجَانِبِ صَدِيقِي", "ajlisu bijānibi ṣadīqī", "I sit beside my friend"],
      ["أَكْتُبُ الْمَلَاحِظَاتِ فِي دَفْتَرِي", "aktubu al-malāḥaẓāti fī daftarī", "I write notes in my notebook"], ["أَقْرَأُ قِصَّةً قَصِيرَةً", "aqraʾu qiṣṣatan qaṣīrah", "I read a short story"],
      ["أَسْأَلُ عِنْدَمَا لَا أَفْهَمُ", "asʾalu ʿindamā lā afhamu", "I ask when I don’t understand"], ["أَجَبْتُ عَنِ السُّؤَالِ بِشَكْلٍ صَحِيحٍ", "ajabtu ʿani as-suʾāli bishaklin ṣaḥīḥ", "I answered the question correctly"],
      ["أَخْطَأْتُ فِي الْإِجَابَةِ", "akhṭaʾtu fī al-ijābah", "I made a mistake in the answer"], ["سَأُحَاوِلُ مَرَّةً أُخْرَى", "saʾuḥāwilu marratan ukhrā", "I will try again"],
      ["يَجِبُ أَنْ أَدْرُسَ لِلِاخْتِبَارِ", "yajibu an adrusa lil-ikhtibār", "I must study for the test"], ["أَكْمَلْتُ وَاجِبِي الْمَنْزِلِيَّ", "akmaltu wājibī al-manziliyy", "I finished my homework"],
      ["مَادَّتِي الْمُفَضَّلَةُ هِيَ الْعُلُومُ", "māddatī al-mufaḍḍalah hiya al-ʿulūm", "My favorite subject is science"], ["الرِّيَاضِيَّاتُ أَصْعَبُ مِنَ الْعُلُومِ", "ar-riyāḍiyyātu aṣʿabu mina al-ʿulūm", "Math is harder than science"],
      ["الْقِرَاءَةُ تُسَاعِدُنِي عَلَى التَّعَلُّمِ", "al-qirāʾatu tusāʿidunī ʿalā at-taʿallum", "Reading helps me learn"],
    ],
  }),
  buildLesson({
    id: "grade-4-responsibilities", title: "Responsibilities at Home", summary: "Talk about chores, organization, care, and what must be done first.", topic: "Home Responsibilities", focus: "routine duties and obligation",
    vocab: [["صُحُون", "ṣuḥūn", "dishes"], ["خِزَانَة", "khizānah", "closet"], ["رَفّ", "raff", "shelf"], ["نَافِذَة", "nāfidhah", "window"], ["أَوَّلًا", "awwalan", "first"]],
    phrases: [
      ["أُرَتِّبُ سَرِيرِي كُلَّ صَبَاحٍ", "urattibu sarīrī kulla ṣabāḥ", "I make my bed every morning"], ["أُنَظِّفُ غُرْفَتِي كُلَّ أُسْبُوعٍ", "unaẓẓifu ghurfatī kulla usbūʿ", "I clean my room every week"],
      ["أُسَاعِدُ وَالِدَيَّ فِي الْبَيْتِ", "usāʿidu wālidayya fī al-bayt", "I help my parents at home"], ["أَغْسِلُ الصُّحُونَ بَعْدَ الْعَشَاءِ", "aghsilu aṣ-ṣuḥūna baʿda al-ʿashāʾ", "I wash the dishes after dinner"],
      ["أَضَعُ مَلَابِسِي فِي الْخِزَانَةِ", "aḍaʿu malābisī fī al-khizānah", "I put my clothes in the closet"], ["أَضَعُ كُتُبِي عَلَى الرَّفِّ", "aḍaʿu kutubī ʿalā ar-raff", "I put my books on the shelf"],
      ["أَفْتَحُ النَّافِذَةَ فِي الصَّبَاحِ", "aftaḥu an-nāfidhata fī aṣ-ṣabāḥ", "I open the window in the morning"], ["أُغْلِقُ الْبَابَ قَبْلَ أَنْ أَنَامَ", "ughliqu al-bāba qabla an anāma", "I close the door before I sleep"],
      ["أُطْعِمُ الْقِطَّةَ كُلَّ يَوْمٍ", "uṭʿimu al-qiṭṭata kulla yawm", "I feed the cat every day"], ["يَجِبُ أَنْ أُنْهِيَ عَمَلِي أَوَّلًا", "yajibu an unhiya ʿamalī awwalan", "I must finish my work first"],
    ],
  }),
  buildLesson({
    id: "grade-4-routine", title: "A Timed Daily Routine", summary: "Sequence a full day using clock times and transition words.", topic: "Daily Routine", focus: "time and sequence",
    vocab: [["السَّابِعَة", "as-sābiʿah", "seven o’clock"], ["الثَّامِنَة", "ath-thāminah", "eight o’clock"], ["أَغَادِرُ", "ughādiru", "I leave"], ["أَسْتَرِيحُ", "astarīḥu", "I rest"], ["بَعْدَ ذَلِكَ", "baʿda dhālika", "after that"]],
    phrases: [
      ["أَسْتَيْقِظُ فِي السَّاعَةِ السَّابِعَةِ", "astayqiẓu fī as-sāʿati as-sābiʿah", "I wake up at seven"], ["أَغْسِلُ وَجْهِي وَأُنَظِّفُ أَسْنَانِي", "aghsilu wajhī wa unaẓẓifu asnānī", "I wash my face and brush my teeth"],
      ["أَرْتَدِي مَلَابِسِي بَعْدَ الْفَطُورِ", "artadī malābisī baʿda al-fuṭūr", "I get dressed after breakfast"], ["أَغَادِرُ الْبَيْتَ فِي الثَّامِنَةِ", "ughādiru al-bayta fī ath-thāminah", "I leave home at eight"],
      ["أَعُودُ إِلَى الْبَيْتِ بَعْدَ الظُّهْرِ", "aʿūdu ilā al-bayti baʿda aẓ-ẓuhr", "I return home in the afternoon"], ["أَسْتَرِيحُ قَلِيلًا بَعْدَ الْمَدْرَسَةِ", "astarīḥu qalīlan baʿda al-madrasah", "I rest a little after school"],
      ["ثُمَّ أَبْدَأُ وَاجِبِي", "thumma abdaʾu wājibī", "Then I start my homework"], ["بَعْدَ ذَلِكَ أَلْعَبُ مَعَ أَصْدِقَائِي", "baʿda dhālika alʿabu maʿa aṣdiqāʾī", "After that I play with my friends"],
      ["أَتَنَاوَلُ الْعَشَاءَ مَعَ عَائِلَتِي", "atanāwalu al-ʿashāʾa maʿa ʿāʾilatī", "I eat dinner with my family"], ["أَقْرَأُ قَبْلَ أَنْ أَنَامَ", "aqraʾu qabla an anāma", "I read before I sleep"],
    ],
  }),
  buildLesson({
    id: "grade-4-food-weather", title: "Healthy Food and Weather", summary: "Express preferences and predictions using reasons and comparisons.", topic: "Food and Weather", focus: "preferences, predictions, and comparisons",
    vocab: [["صِحِّي", "ṣiḥḥī", "healthy"], ["مَالِح", "māliḥ", "salty"], ["أَعْتَقِدُ", "aʿtaqidu", "I think"], ["دَافِئ", "dāfiʾ", "warm"], ["أَبْرَدُ", "abradu", "colder"]],
    phrases: [
      ["مَا طَعَامُكَ الْمُفَضَّلُ؟", "mā ṭaʿāmuka al-mufaḍḍalu?", "What is your favorite food?"], ["طَعَامِي الْمُفَضَّلُ هُوَ الْأَرُزُّ", "ṭaʿāmī al-mufaḍḍalu huwa al-aruzz", "My favorite food is rice"],
      ["أُفَضِّلُ الْفَاكِهَةَ عَلَى الْحَلْوَى", "ufaḍḍilu al-fākihata ʿalā al-ḥalwā", "I prefer fruit to sweets"], ["أُحَاوِلُ أَنْ آكُلَ طَعَامًا صِحِّيًّا", "uḥāwilu an ākula ṭaʿāman ṣiḥḥiyyan", "I try to eat healthy food"],
      ["أَشْرَبُ الْكَثِيرَ مِنَ الْمَاءِ", "ashrabu al-kathīra mina al-māʾ", "I drink plenty of water"], ["هَذَا الطَّعَامُ مَالِحٌ", "hādhā aṭ-ṭaʿāmu māliḥun", "This food is salty"],
      ["لَا أُرِيدُ الْمَزِيدَ، شُكْرًا", "lā urīdu al-mazīda, shukran", "I don’t want any more, thank you"], ["هَلْ يُمْكِنُنِي الْحُصُولُ عَلَى بَعْضِ الْمَاءِ؟", "hal yumkinunī al-ḥuṣūlu ʿalā baʿḍi al-māʾ?", "Can I have some water?"],
      ["أَعْتَقِدُ أَنَّهُ سَيُمْطِرُ", "aʿtaqidu annahu sayumṭiru", "I think it will rain"], ["هَطَلَ الْمَطَرُ أَمْسِ", "haṭala al-maṭaru amsi", "It rained yesterday"],
      ["الطَّقْسُ أَبْرَدُ مِنْ أَمْسِ", "aṭ-ṭaqsu abradu min amsi", "The weather is colder than yesterday"], ["سَيَكُونُ الْجَوُّ دَافِئًا غَدًا", "sayakūnu al-jawwu dāfiʾan ghadan", "The weather will be warm tomorrow"],
    ],
  }),
  buildLesson({
    id: "grade-4-town", title: "Finding Places Around Town", summary: "Ask for nearby places and follow multi-step directions.", topic: "Places Around Town", focus: "relative location and directions",
    vocab: [["مَكْتَبَة", "maktabah", "library"], ["مُسْتَشْفَى", "mustashfā", "hospital"], ["بَنْك", "bank", "bank"], ["بَيْنَ", "bayna", "between"], ["مُسْتَقِيمًا", "mustaqīman", "straight"]],
    phrases: [
      ["أَيْنَ أَقْرَبُ مَتْجَرٍ؟", "ayna aqrabu matjarin?", "Where is the nearest store?"], ["الْمَكْتَبَةُ قَرِيبَةٌ مِنْ هُنَا", "al-maktabatu qarībatun min hunā", "The library is near here"],
      ["الْمُسْتَشْفَى بَعِيدٌ عَنِ الْمَدْرَسَةِ", "al-mustashfā baʿīdun ʿani al-madrasah", "The hospital is far from the school"], ["الْحَدِيقَةُ خَلْفَ الْمَكْتَبَةِ", "al-ḥadīqatu khalfa al-maktabah", "The park is behind the library"],
      ["الْمَطْعَمُ بِجَانِبِ الْمَتْجَرِ", "al-maṭʿamu bijānibi al-matjar", "The restaurant is beside the store"], ["الْبَنْكُ بَيْنَ الْمَتْجَرِ وَالْمَطْعَمِ", "al-banku bayna al-matjari wal-maṭʿam", "The bank is between the store and restaurant"],
      ["كَيْفَ أَصِلُ إِلَى الْمَكْتَبَةِ؟", "kayfa aṣilu ilā al-maktabah?", "How do I get to the library?"], ["اِمْشِ مُسْتَقِيمًا", "imshi mustaqīman", "Walk straight"],
      ["اِنْعَطِفْ يَمِينًا", "inʿaṭif yamīnan", "Turn right"], ["اِنْعَطِفْ يَسَارًا", "inʿaṭif yasāran", "Turn left"],
    ],
  }),
  buildLesson({
    id: "grade-4-hobbies-opinions", title: "Hobbies, Feelings, and Opinions", summary: "Explain interests, emotions, preferences, agreement, and disagreement.", topic: "Hobbies and Opinions", focus: "reasons and personal viewpoints",
    vocab: [["هِوَايَة", "hiwāyah", "hobby"], ["وَقْتُ الْفَرَاغ", "waqtu al-farāgh", "free time"], ["قَلَق", "qalaq", "worry"], ["مُتَحَمِّس", "mutaḥammis", "excited"], ["رَأْي", "raʾy", "opinion"]],
    phrases: [
      ["مَاذَا تَفْعَلُ فِي وَقْتِ فَرَاغِكَ؟", "mādhā tafʿalu fī waqti farāghika?", "What do you do in your free time?"], ["أُحِبُّ قِرَاءَةَ الْقِصَصِ", "uḥibbu qirāʾata al-qiṣaṣ", "I like reading stories"],
      ["أَسْتَمْتِعُ بِلَعِبِ كُرَةِ الْقَدَمِ", "astamtiʿu bilaʿibi kurati al-qadam", "I enjoy playing soccer"], ["أَتَدَرَّبُ ثَلَاثَ مَرَّاتٍ فِي الْأُسْبُوعِ", "atadarrabu thalātha marrātin fī al-usbūʿ", "I practice three times a week"],
      ["أُحِبُّ الرَّسْمَ لِأَنَّهُ مُمْتِعٌ", "uḥibbu ar-rasma liʾannahu mumtiʿun", "I like drawing because it is fun"], ["أُرِيدُ أَنْ أَتَعَلَّمَ هِوَايَةً جَدِيدَةً", "urīdu an ataʿallama hiwāyatan jadīdah", "I want to learn a new hobby"],
      ["أَشْعُرُ بِالْقَلَقِ قَلِيلًا", "ashʿuru bil-qalaqi qalīlan", "I feel a little worried"], ["أَنَا مُتَحَمِّسٌ لِلرِّحْلَةِ", "anā mutaḥammisun lir-riḥlah", "I am excited about the trip"],
      ["فِي رَأْيِي، هَذِهِ فِكْرَةٌ جَيِّدَةٌ", "fī raʾyī, hādhihi fikratun jayyidah", "In my opinion, this is a good idea"], ["أَعْتَقِدُ أَنَّ الْقِرَاءَةَ مُهِمَّةٌ", "aʿtaqidu anna al-qirāʾata muhimmatun", "I think reading is important"],
      ["أُوَافِقُ عَلَى هَذِهِ الْفِكْرَةِ", "uwāfiqu ʿalā hādhihi al-fikrah", "I agree with this idea"], ["لَا أُوَافِقُ لِأَنَّ لَدَيَّ رَأْيًا مُخْتَلِفًا", "lā uwāfiqu liʾanna ladayya raʾyan mukhtalifan", "I disagree because I have a different opinion"],
    ],
  }),
  buildLesson({
    id: "grade-4-tense-review", title: "Past, Present, and Future", summary: "Make common verb changes automatic across three time frames.", topic: "Verb Tenses", focus: "present, past, and future families",
    vocab: [["أَذْهَبُ", "adhhabu", "I go"], ["ذَهَبْتُ", "dhahabtu", "I went"], ["سَأَذْهَبُ", "saʾadhhabu", "I will go"], ["أَقْرَأُ", "aqraʾu", "I read"], ["قَرَأْتُ", "qaraʾtu", "I read (past)"]],
    phrases: [
      ["ذَهَبْتُ إِلَى الْمَدْرَسَةِ", "dhahabtu ilā al-madrasati", "I went to school"], ["قَرَأْتُ كِتَابًا", "qaraʾtu kitāban", "I read a book"], ["كَتَبْتُ رِسَالَةً", "katabtu risālatan", "I wrote a letter"],
      ["تَعَلَّمْتُ شَيْئًا جَدِيدًا", "taʿallamtu shayʾan jadīdan", "I learned something new"], ["سَاعَدْتُ أَخِي", "sāʿadtu akhī", "I helped my brother"], ["اسْتَيْقَظْتُ مُبَكِّرًا", "istayqaẓtu mubakkiran", "I woke up early"],
      ["سَأَذْهَبُ إِلَى الْمَدْرَسَةِ", "saʾadhhabu ilā al-madrasati", "I will go to school"], ["سَأَقْرَأُ كِتَابًا", "saʾaqraʾu kitāban", "I will read a book"], ["سَأَكْتُبُ رِسَالَةً", "saʾaktubu risālatan", "I will write a letter"],
      ["سَأُسَاعِدُ أَخِي", "saʾusāʿidu akhī", "I will help my brother"], ["سَأَزُورُ جَدَّتِي", "saʾazūru jaddatī", "I will visit my grandmother"], ["سَنَعُودُ فِي الْمَسَاءِ", "sanaʿūdu fī al-masāʾ", "We will return in the evening"],
    ],
    notes: ["Compare أَذْهَبُ / ذَهَبْتُ / سَأَذْهَبُ and repeat with أَقْرَأُ, أَكْتُبُ, and أَلْعَبُ."],
  }),
  buildLesson({
    id: "grade-4-connectors-patterns", title: "Build a Paragraph", summary: "Use transitions, opinions, obligation, ability, and preference patterns.", topic: "Connectors and Patterns", focus: "joining and organizing ideas",
    vocab: [["أَوَّلًا", "awwalan", "first"], ["ثَانِيًا", "thāniyan", "second"], ["أَخِيرًا", "akhīran", "finally"], ["بَيْنَمَا", "baynamā", "while"], ["مَعَ ذَلِكَ", "maʿa dhālika", "however"], ["فِي النِّهَايَةِ", "fī an-nihāyah", "in the end"]],
    phrases: [
      ["أَعْتَقِدُ أَنَّ هَذَا الْكِتَابَ مُفِيدٌ", "aʿtaqidu anna hādhā al-kitāba mufīdun", "I think this book is useful"], ["فِي رَأْيِي، التَّعَلُّمُ مُهِمٌّ", "fī raʾyī, at-taʿallumu muhimmun", "In my opinion, learning is important"],
      ["يَجِبُ أَنْ أُنْهِيَ وَاجِبِي", "yajibu an unhiya wājibī", "I must finish my homework"], ["يُمْكِنُنِي أَنْ أَقْرَأَ هَذَا الْكِتَابَ", "yumkinunī an aqraʾa hādhā al-kitāba", "I can read this book"],
      ["لَا أَسْتَطِيعُ أَنْ أَذْهَبَ الْيَوْمَ", "lā astaṭīʿu an adh-haba al-yawm", "I cannot go today"], ["أُفَضِّلُ الْقِرَاءَةَ عَلَى الْكِتَابَةِ", "ufaḍḍilu al-qirāʾata ʿalā al-kitābah", "I prefer reading to writing"],
      ["عِنْدَمَا أَعُودُ إِلَى الْبَيْتِ، أَبْدَأُ وَاجِبِي", "ʿindamā aʿūdu ilā al-bayti, abdaʾu wājibī", "When I return home, I start my homework"],
    ],
  }),
  buildLesson({
    id: "grade-4-reading-park-trip", title: "Reading: A Trip to the Park", summary: "Read an eight-sentence paragraph using reasons, sequence, simultaneous actions, and reflection.", topic: "Connected Reading", focus: "paragraph-level narration",
    vocab: [["قَرَّرَتْ", "qarrarat", "decided"], ["جَمَعْنَا", "jamaʿnā", "we gathered"], ["وَصَلْنَا", "waṣalnā", "we arrived"], ["بَيْنَمَا", "baynamā", "while"], ["قَضَيْنَا", "qaḍaynā", "we spent"]],
    phrases: [
      ["فِي صَبَاحِ يَوْمِ السَّبْتِ، اسْتَيْقَظْتُ مُبَكِّرًا لِأَنَّ عَائِلَتِي قَرَّرَتْ أَنْ تَذْهَبَ إِلَى الْحَدِيقَةِ.", "fī ṣabāḥi yawmi as-sabti, istayqaẓtu mubakkiran liʾanna ʿāʾilatī qarrarat an tadhhaba ilā al-ḥadīqati", "On Saturday morning, I woke up early because my family decided to go to the park."],
      ["تَنَاوَلْنَا الْفَطُورَ، ثُمَّ جَمَعْنَا الطَّعَامَ وَالْمَاءَ لِلرِّحْلَةِ.", "tanāwalnā al-fuṭūra, thumma jamaʿnā aṭ-ṭaʿāma wal-māʾa lir-riḥlati", "We ate breakfast, then gathered food and water for the trip."],
      ["عِنْدَمَا وَصَلْنَا إِلَى الْحَدِيقَةِ، كَانَ الطَّقْسُ جَمِيلًا وَالشَّمْسُ سَاطِعَةً.", "ʿindamā waṣalnā ilā al-ḥadīqati, kāna aṭ-ṭaqsu jamīlan wash-shamsu sāṭiʿatan", "When we arrived at the park, the weather was beautiful and the sun was shining."],
      ["رَأَيْنَا الْكَثِيرَ مِنَ الْأَشْجَارِ وَالطُّيُورِ وَالْأَزْهَارِ.", "raʾaynā al-kathīra mina al-ashjāri waṭ-ṭuyūri wal-azhāri", "We saw many trees, birds, and flowers."],
      ["لَعِبْتُ مَعَ أَخِي بِالْكُرَةِ بَيْنَمَا كَانَ وَالِدَايَ يَجْلِسَانِ تَحْتَ شَجَرَةٍ.", "laʿibtu maʿa akhī bil-kurati baynamā kāna wālidayya yajlisāni taḥta shajaratin", "I played ball with my brother while my parents were sitting under a tree."],
      ["بَعْدَ ذَلِكَ، جَلَسْنَا مَعًا وَتَنَاوَلْنَا الْغَدَاءَ.", "baʿda dhālika, jalasnā maʿan wa tanāwalnā al-ghadāʾa", "After that, we sat together and ate lunch."],
      ["فِي الْمَسَاءِ، عُدْنَا إِلَى الْبَيْتِ.", "fī al-masāʾi, ʿudnā ilā al-bayti", "In the evening, we returned home."],
      ["كُنْتُ مُتْعَبًا، وَلَكِنِّي كُنْتُ سَعِيدًا لِأَنَّنَا قَضَيْنَا وَقْتًا جَمِيلًا مَعًا.", "kuntu mutʿaban, walākinnī kuntu saʿīdan liʾannanā qaḍaynā waqtan jamīlan maʿan", "I was tired, but I was happy because we had spent a nice time together."],
    ],
    notes: ["Read the cards in order as one paragraph and identify because, then, when, while, after that, and but."],
  }),
];

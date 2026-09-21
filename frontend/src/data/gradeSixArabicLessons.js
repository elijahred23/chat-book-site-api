const rows = (data, category, context) => data.map(([ar, pronunciation, en]) => ({ ar, pronunciation, en, category, ...(context ? { context } : {}) }));
const make = ({ id, title, summary, topic, focus, vocab, phrases, notes = [] }) => ({
  id, title, summary, level: "Class 6", topic, focus, vocab: rows(vocab, topic),
  phrases: rows(phrases, topic, `Use this sentence while practicing ${topic.toLowerCase()}.`), practice: [],
  notes: ["Focus on the relationship between ideas: claim, reason, contrast, example, result, and conclusion.", ...notes],
});

export const GRADE_SIX_ARABIC_LESSONS = [
  make({
    id: "class-6-conversation", title: "Clarify and Reflect", summary: "Discuss events and plans while expressing possibility, doubt, and understanding.", topic: "Everyday Conversation", focus: "reflection and clarification",
    vocab: [["غَيْرُ عَادِيّ", "ghayru ʿādiyy", "unusual"], ["أُخَطِّطُ", "ukhaṭṭiṭu", "I plan"], ["مُمْكِن", "mumkin", "possible"], ["أُوَضِّحُ", "uwaḍḍiḥu", "I clarify"], ["الْأَمْر", "al-amr", "the matter"]],
    phrases: [
      ["كَيْفَ كَانَ يَوْمُكَ فِي الْمَدْرَسَةِ؟", "kayfa kāna yawmuka fī al-madrasah?", "How was your day at school?"], ["كَانَ يَوْمًا طَوِيلًا وَلَكِنَّهُ كَانَ مُمْتِعًا", "kāna yawman ṭawīlan walākinnahu kāna mumtiʿan", "It was a long day, but it was enjoyable"],
      ["مَاذَا حَدَثَ أَمْسِ؟", "mādhā ḥadatha amsi?", "What happened yesterday?"], ["لَمْ يَحْدُثْ شَيْءٌ غَيْرُ عَادِيٍّ", "lam yaḥduth shayʾun ghayru ʿādiyyin", "Nothing unusual happened"],
      ["مَاذَا تُخَطِّطُ أَنْ تَفْعَلَ غَدًا؟", "mādhā tukhaṭṭiṭu an tafʿala ghadan?", "What are you planning to do tomorrow?"], ["سَأُفَكِّرُ فِي الْأَمْرِ", "saʾufakkiru fī al-amr", "I will think about it"],
      ["أَعْتَقِدُ أَنَّ هَذَا مُمْكِنٌ", "aʿtaqidu anna hādhā mumkinun", "I think this is possible"], ["لَا أَعْتَقِدُ أَنَّ هَذَا صَحِيحٌ", "lā aʿtaqidu anna hādhā ṣaḥīḥun", "I don’t think this is correct"],
      ["هَلْ يُمْكِنُكَ أَنْ تُوَضِّحَ ذَلِكَ؟", "hal yumkinuka an tuwaḍḍiḥa dhālika?", "Can you clarify that?"], ["الآنَ فَهِمْتُ", "al-āna fahimtu", "Now I understand"],
      ["هَذَا مَا كُنْتُ أُفَكِّرُ فِيهِ", "hādhā mā kuntu ufakkiru fīhi", "That’s what I was thinking about"], ["لَدَيَّ سُؤَالٌ آخَرُ", "ladayya suʾālun ākharu", "I have another question"],
    ],
  }),
  make({
    id: "class-6-school", title: "Analyze Your Learning", summary: "Compare answers, identify mistakes, collaborate, and evaluate results.", topic: "School and Learning", focus: "analysis and self-correction",
    vocab: [["بِالتَّفْصِيل", "bit-tafṣīl", "in detail"], ["أَثْنَاء", "athnāʾ", "during"], ["قَارَنْتُ", "qārantu", "I compared"], ["ارْتَكَبْتُ", "irtakabtu", "I committed"], ["نَتِيجَة", "natījah", "result"]],
    phrases: [
      ["أَصْبَحَتِ الدُّرُوسُ أَكْثَرَ صُعُوبَةً", "aṣbaḥati ad-durūsu akthara ṣuʿūbatan", "The lessons have become more difficult"], ["شَرَحَ الْمُعَلِّمُ الْمَوْضُوعَ بِالتَّفْصِيلِ", "sharaḥa al-muʿallimu al-mawḍūʿa bit-tafṣīl", "The teacher explained the topic in detail"],
      ["أَخَذْتُ مُلَاحَظَاتٍ أَثْنَاءَ الدَّرْسِ", "akhadhtu mulāḥaẓātin athnāʾa ad-dars", "I took notes during the lesson"], ["طَلَبَ مِنَّا الْمُعَلِّمُ أَنْ نَعْمَلَ فِي مَجْمُوعَاتٍ", "ṭalaba minnā al-muʿallimu an naʿmala fī majmūʿāt", "The teacher asked us to work in groups"],
      ["نَاقَشْنَا أَفْكَارَنَا مَعًا", "nāqashnā afkāranā maʿan", "We discussed our ideas together"], ["قَارَنْتُ إِجَابَتِي بِإِجَابَةِ صَدِيقِي", "qārantu ijābatī bi-ijābati ṣadīqī", "I compared my answer with my friend’s answer"],
      ["اكْتَشَفْتُ أَنَّنِي ارْتَكَبْتُ خَطَأً", "iktashaftu annanī irtakabtu khaṭaʾan", "I discovered that I made a mistake"], ["صَحَّحْتُ الْخَطَأَ بَعْدَ ذَلِكَ", "ṣaḥḥaḥtu al-khaṭaʾa baʿda dhālika", "I corrected the mistake afterward"],
      ["كَانَ الِاخْتِبَارُ أَسْهَلَ مِمَّا تَوَقَّعْتُ", "kāna al-ikhtibāru as-hala mimmā tawaqqaʿtu", "The test was easier than I expected"], ["أَتَمَنَّى أَنْ أَحْصُلَ عَلَى نَتِيجَةٍ جَيِّدَةٍ", "atamannā an aḥṣula ʿalā natījatin jayyidah", "I hope to get a good result"],
    ],
  }),
  make({
    id: "class-6-reading-writing", title: "Read, Summarize, and Write", summary: "Find main ideas and evidence, summarize, draft, and revise a paragraph.", topic: "Reading and Writing", focus: "paragraph comprehension and composition",
    vocab: [["تَفَاصِيل", "tafāṣīl", "details"], ["أُلَخِّصُ", "ulakhkhiṣu", "I summarize"], ["فِقْرَة", "fiqrah", "paragraph"], ["أُرَاجِعُ", "urājiʿu", "I review"], ["إِمْلَائِيّ", "imlāʾiyy", "spelling-related"]],
    phrases: [
      ["أَقْرَأُ النَّصَّ بِعِنَايَةٍ", "aqraʾu an-naṣṣa biʿināyatin", "I read the text carefully"], ["أُحَدِّدُ الْفِكْرَةَ الرَّئِيسِيَّةَ", "uḥaddidu al-fikrata ar-raʾīsiyyah", "I identify the main idea"],
      ["أَبْحَثُ عَنِ التَّفَاصِيلِ الْمُهِمَّةِ", "abḥathu ʿani at-tafāṣīli al-muhimmah", "I look for important details"], ["أَسْتَخْدِمُ السِّيَاقَ لِفَهْمِ الْكَلِمَاتِ الْجَدِيدَةِ", "astakhdimu as-siyāqa lifahmi al-kalimāti al-jadīdah", "I use context to understand new words"],
      ["أَلَخِّصُ النَّصَّ بِكَلِمَاتِي", "ulakhkhiṣu an-naṣṣa bikalimātī", "I summarize the text in my own words"], ["أَكْتُبُ فِقْرَةً عَنِ الْمَوْضُوعِ", "aktubu fiqratan ʿani al-mawḍūʿ", "I write a paragraph about the topic"],
      ["أَبْدَأُ الْفِقْرَةَ بِفِكْرَةٍ رَئِيسِيَّةٍ", "abdaʾu al-fiqrata bifikratin raʾīsiyyah", "I begin the paragraph with a main idea"], ["أُضِيفُ تَفَاصِيلَ لِشَرْحِ فِكْرَتِي", "uḍīfu tafāṣīla lisharḥi fikratī", "I add details to explain my idea"],
      ["أُرَاجِعُ مَا كَتَبْتُ", "urājiʿu mā katabtu", "I review what I wrote"], ["أُصَحِّحُ الْأَخْطَاءَ الْإِمْلَائِيَّةَ", "uṣaḥḥiḥu al-akhṭāʾa al-imlāʾiyyah", "I correct spelling mistakes"],
    ],
  }),
  make({
    id: "class-6-thinking-friendship", title: "Points of View and Relationships", summary: "Compare perspectives and solve disagreements with trust and calm discussion.", topic: "Thinking and Relationships", focus: "balanced opinions and conflict resolution",
    vocab: [["وَجْهَةُ نَظَر", "wijhatu naẓar", "point of view"], ["مَوْقِف", "mawqif", "situation"], ["ثِقَة", "thiqah", "trust"], ["مَشَاعِر", "mashāʿir", "feelings"], ["بِهُدُوء", "bihudūʾ", "calmly"]],
    phrases: [
      ["أَعْتَقِدُ أَنَّ هُنَاكَ أَكْثَرَ مِنْ حَلٍّ", "aʿtaqidu anna hunāka akthara min ḥallin", "I think there is more than one solution"], ["لَدَيَّ وَجْهَةُ نَظَرٍ مُخْتَلِفَةٌ", "ladayya wijhatu naẓarin mukhtalifah", "I have a different point of view"],
      ["يُمْكِنُنَا النَّظَرُ إِلَى الْمُشْكِلَةِ بِطَرِيقَةٍ أُخْرَى", "yumkinunā an-naẓaru ilā al-mushkilati biṭarīqatin ukhrā", "We can look at the problem another way"], ["مِنْ نَاحِيَةٍ أُخْرَى، هُنَاكَ مُشْكِلَةٌ", "min nāḥiyatin ukhrā, hunāka mushkilah", "On the other hand, there is a problem"],
      ["يَعْتَمِدُ ذَلِكَ عَلَى الْمَوْقِفِ", "yaʿtamidu dhālika ʿalā al-mawqif", "That depends on the situation"], ["الصَّدَاقَةُ تَحْتَاجُ إِلَى الثِّقَةِ", "aṣ-ṣadāqatu taḥtāju ilā ath-thiqah", "Friendship requires trust"],
      ["يَجِبُ أَنْ نَحْتَرِمَ مَشَاعِرَ الْآخَرِينَ", "yajibu an naḥtarima mashāʿira al-ākharīn", "We should respect other people’s feelings"], ["حَاوَلْنَا أَنْ نَفْهَمَ بَعْضَنَا بَعْضًا", "ḥāwalnā an nafhama baʿḍanā baʿḍan", "We tried to understand each other"],
      ["تَحَدَّثْنَا عَنِ الْمُشْكِلَةِ بِهُدُوءٍ", "taḥaddathnā ʿani al-mushkilati bihudūʾ", "We talked about the problem calmly"], ["فِي النِّهَايَةِ، وَجَدْنَا حَلًّا", "fī an-nihāyah, wajadnā ḥallan", "In the end, we found a solution"],
    ],
  }),
  make({
    id: "class-6-environment-science", title: "Environment and Scientific Ideas", summary: "Explain environmental choices, natural systems, and simple experiments.", topic: "Environment and Science", focus: "cause, evidence, and consequence",
    vocab: [["نُفَايَات", "nufāyāt", "waste"], ["جُسَيْمَات", "jusaymāt", "particles"], ["جَاذِبِيَّة", "jādhibiyyah", "gravity"], ["تَجْرِبَة", "tajribah", "experiment"], ["مُسْتَقْبَل", "mustaqbal", "future"]],
    phrases: [
      ["حِمَايَةُ الْبِيئَةِ مَسْؤُولِيَّةُ الْجَمِيعِ", "ḥimāyatu al-bīʾati masʾūliyyatu al-jamīʿ", "Protecting the environment is everyone’s responsibility"], ["يُمْكِنُنَا تَقْلِيلُ كَمِّيَّةِ النُّفَايَاتِ", "yumkinunā taqlīlu kammiyyati an-nufāyāt", "We can reduce the amount of waste"],
      ["إِعَادَةُ التَّدْوِيرِ تُسَاعِدُ عَلَى حِمَايَةِ الْبِيئَةِ", "iʿādatu at-tadwīri tusāʿidu ʿalā ḥimāyati al-bīʾah", "Recycling helps protect the environment"], ["إِذَا حَافَظْنَا عَلَى الطَّبِيعَةِ، فَسَنَحْمِي مُسْتَقْبَلَنَا", "idhā ḥāfaẓnā ʿalā aṭ-ṭabīʿah, fasanaḥmī mustaqbalanā", "If we protect nature, we will protect our future"],
      ["الْعِلْمُ يُسَاعِدُنَا عَلَى فَهْمِ الْعَالَمِ", "al-ʿilmu yusāʿidunā ʿalā fahmi al-ʿālam", "Science helps us understand the world"], ["تَتَكَوَّنُ الْمَادَّةُ مِنْ جُسَيْمَاتٍ صَغِيرَةٍ", "tatakawwanu al-māddatu min jusaymātin ṣaghīrah", "Matter consists of small particles"],
      ["تَسْتَخْدِمُ النَّبَاتَاتُ ضَوْءَ الشَّمْسِ لِصُنْعِ غِذَائِهَا", "tastakhdimu an-nabātātu ḍawʾa ash-shamsi liṣunʿi ghidhāʾihā", "Plants use sunlight to make their food"], ["تَدُورُ الْأَرْضُ حَوْلَ الشَّمْسِ", "tadūru al-arḍu ḥawla ash-shams", "Earth revolves around the sun"],
      ["تَجْذِبُ الْجَاذِبِيَّةُ الْأَجْسَامَ نَحْوَ الْأَرْضِ", "tajdhibu al-jādhibiyyatu al-ajsāma naḥwa al-arḍ", "Gravity pulls objects toward Earth"], ["يُمْكِنُنَا اخْتِبَارُ الْفِكْرَةِ بِإِجْرَاءِ تَجْرِبَةٍ", "yumkinunā ikhtibāru al-fikrati bi-ijrāʾi tajribah", "We can test the idea by conducting an experiment"],
    ],
  }),
  make({
    id: "class-6-geography-technology", title: "Geography and Technology", summary: "Discuss climate, maps, information, communication, and responsible screen use.", topic: "Geography and Technology", focus: "informational language",
    vocab: [["قَارَّات", "qārrāt", "continents"], ["مُنَاخ", "munākh", "climate"], ["خَرِيطَة", "kharīṭah", "map"], ["حَاسُوب", "ḥāsūb", "computer"], ["شَاشَة", "shāshah", "screen"]],
    phrases: [
      ["الْعَالَمُ مُقَسَّمٌ إِلَى قَارَّاتٍ", "al-ʿālamu muqassamun ilā qārrāt", "The world is divided into continents"], ["تَخْتَلِفُ الْمُنَاخَاتُ مِنْ مَكَانٍ إِلَى آخَرَ", "takhtalifu al-munākhātu min makānin ilā ākhar", "Climates differ from place to place"],
      ["تُسَاعِدُنَا الْخَرِيطَةُ عَلَى مَعْرِفَةِ الْأَمَاكِنِ", "tusāʿidunā al-kharīṭatu ʿalā maʿrifati al-amākin", "A map helps us identify places"], ["تَقَعُ الْمَدِينَةُ بِالْقُرْبِ مِنَ النَّهْرِ", "taqaʿu al-madīnatu bil-qurbi mina an-nahr", "The city is located near the river"],
      ["أَسْتَخْدِمُ الْحَاسُوبَ لِلدِّرَاسَةِ", "astakhdimu al-ḥāsūba lid-dirāsah", "I use the computer for studying"], ["يُمْكِنُنَا الْبَحْثُ عَنِ الْمَعْلُومَاتِ عَلَى الْإِنْتَرْنِتِ", "yumkinunā al-baḥthu ʿani al-maʿlūmāti ʿalā al-internet", "We can search for information on the internet"],
      ["يَجِبُ أَنْ نَسْتَخْدِمَ الْإِنْتَرْنِتَ بِمَسْؤُولِيَّةٍ", "yajibu an nastakhdima al-interneta bimasʾūliyyah", "We should use the internet responsibly"], ["لَا يَنْبَغِي أَنْ نَقْضِيَ كُلَّ وَقْتِنَا أَمَامَ الشَّاشَةِ", "lā yanbaghī an naqḍiya kulla waqtinā amāma ash-shāshah", "We should not spend all our time in front of a screen"],
    ],
  }),
  make({
    id: "class-6-language-patterns", title: "Advanced Connections and Verb Families", summary: "Use contrast, hypothetical conditions, paired emphasis, and expanded tense families.", topic: "Language Patterns", focus: "complex connections and tense control",
    vocab: [["عَلَى الرَّغْمِ مِنْ", "ʿalā ar-raghmi min", "despite / although"], ["كُلَّمَا", "kullamā", "whenever / the more"], ["إِلَّا إِذَا", "illā idhā", "unless"], ["فِي الْمُقَابِلِ", "fī al-muqābil", "in contrast"], ["بِالْإِضَافَةِ إِلَى ذَلِكَ", "bil-iḍāfati ilā dhālika", "in addition"]],
    phrases: [
      ["عَلَى الرَّغْمِ مِنْ أَنَّ الطَّقْسَ كَانَ بَارِدًا، ذَهَبْنَا إِلَى الْحَدِيقَةِ", "ʿalā ar-raghmi min anna aṭ-ṭaqsa kāna bāridan, dhahabnā ilā al-ḥadīqah", "Although the weather was cold, we went to the park"],
      ["كُلَّمَا قَرَأْتُ أَكْثَرَ، تَعَلَّمْتُ أَكْثَرَ", "kullamā qaraʾtu akthara, taʿallamtu akthara", "The more I read, the more I learned"],
      ["لَوْ كَانَ لَدَيَّ وَقْتٌ أَكْثَرُ، لَقَرَأْتُ كُتُبًا أَكْثَرَ", "law kāna ladayya waqtun aktharu, laqaraʾtu kutuban akthara", "If I had more time, I would read more books"],
      ["الْقِرَاءَةُ لَيْسَتْ مُمْتِعَةً فَقَطْ، بَلْ هِيَ مُفِيدَةٌ أَيْضًا", "al-qirāʾatu laysat mumtiʿatan faqaṭ, bal hiya mufīdatun ayḍan", "Reading is not only enjoyable, but also useful"],
      ["كُلُّ مَا أَعْرِفُهُ هُوَ أَنَّنَا سَنَذْهَبُ غَدًا", "kullu mā aʿrifuhu huwa annanā sanadhhabu ghadan", "All I know is that we will go tomorrow"],
      ["أُفَكِّرُ / فَكَّرْتُ / سَأُفَكِّرُ", "ufakkiru / fakkartu / saʾufakkiru", "I think / thought / will think"], ["أُخَطِّطُ / خَطَّطْتُ / سَأُخَطِّطُ", "ukhaṭṭiṭu / khaṭṭaṭtu / saʾukhaṭṭiṭu", "I plan / planned / will plan"],
      ["أُنَاقِشُ / نَاقَشْتُ / سَأُنَاقِشُ", "unāqishu / nāqashtu / saʾunāqishu", "I discuss / discussed / will discuss"], ["أُقَرِّرُ / قَرَّرْتُ / سَأُقَرِّرُ", "uqarriru / qarartu / saʾuqarriru", "I decide / decided / will decide"],
    ],
  }),
  make({
    id: "class-6-reading-importance", title: "Reading: The Importance of Reading", summary: "Read an informational paragraph organized around a claim, benefits, challenge, and conclusion.", topic: "Connected Reading", focus: "main idea and supporting evidence",
    vocab: [["مَهَارَات", "mahārāt", "skills"], ["ثَقَافَات", "thaqāfāt", "cultures"], ["بِانْتِظَام", "bintiẓām", "regularly"], ["صَفَحَات", "ṣafaḥāt", "pages"], ["مُرُورُ الْوَقْت", "murūru al-waqt", "passage of time"]],
    phrases: [
      ["تُعَدُّ الْقِرَاءَةُ مِنْ أَهَمِّ الْمَهَارَاتِ الَّتِي يَتَعَلَّمُهَا الْإِنْسَانُ.", "tuʿaddu al-qirāʾatu min ahammi al-mahārāti allatī yataʿallamuhā al-insānu", "Reading is considered one of the most important skills a person learns."],
      ["فَهِيَ لَا تُسَاعِدُنَا عَلَى التَّعَلُّمِ فَقَطْ، بَلْ تُسَاعِدُنَا أَيْضًا عَلَى فَهْمِ الْعَالَمِ مِنْ حَوْلِنَا.", "fahiya lā tusāʿidunā ʿalā at-taʿallumi faqaṭ, bal tusāʿidunā ayḍan ʿalā fahmi al-ʿālami min ḥawlinā", "It not only helps us learn, but also helps us understand the world around us."],
      ["عِنْدَمَا نَقْرَأُ كِتَابًا، نَتَعَرَّفُ عَلَى أَفْكَارٍ وَمَعْلُومَاتٍ جَدِيدَةٍ.", "ʿindamā naqraʾu kitāban, nataʿarrafu ʿalā afkārin wa maʿlūmātin jadīdatin", "When we read a book, we encounter new ideas and information."],
      ["كَمَا يُمْكِنُنَا أَنْ نَتَعَلَّمَ عَنْ أَمَاكِنَ وَثَقَافَاتٍ لَمْ نَرَهَا مِنْ قَبْلُ.", "kamā yumkinunā an nataʿallama ʿan amākina wa thaqāfātin lam narahā min qablu", "We can also learn about places and cultures that we have never seen before."],
      ["فِي الْبِدَايَةِ، قَدْ يَكُونُ قِرَاءَةُ نَصٍّ طَوِيلٍ أَمْرًا صَعْبًا.", "fī al-bidāyati, qad yakūnu qirāʾatu naṣṣin ṭawīlin amran ṣaʿban", "At first, reading a long text may be difficult."],
      ["وَلَكِنْ كُلَّمَا قَرَأْنَا أَكْثَرَ، أَصْبَحَتِ الْقِرَاءَةُ أَسْهَلَ.", "walākin kullamā qaraʾnā akthara, aṣbaḥati al-qirāʾatu as-hala", "But the more we read, the easier reading becomes."],
      ["لِهَذَا السَّبَبِ، مِنَ الْمُهِمِّ أَنْ نَقْرَأَ بِانْتِظَامٍ.", "lihādhā as-sababi, mina al-muhimmi an naqraʾa bintiẓāmin", "For this reason, it is important to read regularly."],
      ["حَتَّى قِرَاءَةُ بَضْعِ صَفَحَاتٍ كُلَّ يَوْمٍ يُمْكِنُ أَنْ تُحَسِّنَ مَهَارَاتِنَا مَعَ مُرُورِ الْوَقْتِ.", "ḥattā qirāʾatu baḍʿi ṣafaḥātin kulla yawmin yumkinu an tuḥassina mahārātinā maʿa murūri al-waqti", "Even reading a few pages every day can improve our skills over time."],
    ],
    notes: ["State the main claim, list two supporting benefits, identify the challenge, and explain the conclusion."],
  }),
];

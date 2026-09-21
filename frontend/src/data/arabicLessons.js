import prayerWordsActions from "../arabic_lessons/prayer-words-actions.json";
import alFatihah from "../arabic_lessons/al-fatihah.json";
import afterPrayerRemembrance from "../arabic_lessons/after-prayer-remembrance.json";
import fiveDailyPrayerNames from "../arabic_lessons/five-daily-prayer-names.json";
import fajrPrayerRecitation from "../arabic_lessons/fajr-prayer-recitation.json";
import dhuhrPrayerRecitation from "../arabic_lessons/dhuhr-prayer-recitation.json";
import asrPrayerRecitation from "../arabic_lessons/asr-prayer-recitation.json";
import maghribPrayerRecitation from "../arabic_lessons/maghrib-prayer-recitation.json";
import ishaPrayerRecitation from "../arabic_lessons/isha-prayer-recitation.json";
import { GRADE_ONE_ARABIC_LESSONS } from "./gradeOneArabicLessons.js";
import { GRADE_TWO_ARABIC_LESSONS } from "./gradeTwoArabicLessons.js";
import { GRADE_THREE_ARABIC_LESSONS } from "./gradeThreeArabicLessons.js";
import { GRADE_FOUR_ARABIC_LESSONS } from "./gradeFourArabicLessons.js";
import { GRADE_FIVE_ARABIC_LESSONS } from "./gradeFiveArabicLessons.js";
import { GRADE_SIX_ARABIC_LESSONS } from "./gradeSixArabicLessons.js";

export const ARABIC_LESSONS = [...GRADE_ONE_ARABIC_LESSONS, ...GRADE_TWO_ARABIC_LESSONS, ...GRADE_THREE_ARABIC_LESSONS, ...GRADE_FOUR_ARABIC_LESSONS, ...GRADE_FIVE_ARABIC_LESSONS, ...GRADE_SIX_ARABIC_LESSONS, fajrPrayerRecitation, dhuhrPrayerRecitation, asrPrayerRecitation, maghribPrayerRecitation, ishaPrayerRecitation, fiveDailyPrayerNames, prayerWordsActions, alFatihah, afterPrayerRemembrance];

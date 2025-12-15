
import { WordEntry, UserPreferences } from "../types";
import { STAGES } from "../constants";

const STORAGE_PREFIX = 'fast_ingles_lesson_v1_';
const PROGRESS_PREFIX = 'fast_ingles_progress_v1_';
const PREFS_KEY = 'fast_ingles_prefs_v1';

export const storageService = {
  /**
   * Saves a lesson to local storage
   */
  saveLesson: (dayId: number, data: WordEntry[]) => {
    try {
      const key = `${STORAGE_PREFIX}${dayId}`;
      localStorage.setItem(key, JSON.stringify(data));
      // Save timestamp if needed later
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    } catch (e) {
      console.error("Failed to save lesson to local storage", e);
    }
  },

  /**
   * Retrieves a lesson from local storage
   */
  getLesson: (dayId: number): WordEntry[] | null => {
    try {
      const key = `${STORAGE_PREFIX}${dayId}`;
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as WordEntry[];
      }
      return null;
    } catch (e) {
      console.error("Failed to load lesson from local storage", e);
      return null;
    }
  },

  /**
   * Update a specific word in a lesson (Admin Feature)
   */
  updateWordInLesson: (dayId: number, wordIndex: number, updatedEntry: WordEntry) => {
    const lesson = storageService.getLesson(dayId);
    if (lesson && lesson[wordIndex]) {
      lesson[wordIndex] = updatedEntry;
      storageService.saveLesson(dayId, lesson);
      return true;
    }
    return false;
  },

  /**
   * Retrieves ALL verbs from all cached lessons
   */
  getAllCachedLessons: (): { dayId: number, words: WordEntry[] }[] => {
    const allData: { dayId: number, words: WordEntry[] }[] = [];
    // Iterate over all stage IDs from STAGES constant instead of hardcoded limit
    for (const stage of STAGES) {
      const lesson = storageService.getLesson(stage.id);
      if (lesson && lesson.length > 0) {
        allData.push({ dayId: stage.id, words: lesson });
      }
    }
    return allData;
  },

  /**
   * Checks if a lesson exists
   */
  hasLesson: (dayId: number): boolean => {
    return !!localStorage.getItem(`${STORAGE_PREFIX}${dayId}`);
  },

  /**
   * Saves the current index progress for a specific day
   */
  saveProgress: (dayId: number, index: number) => {
    try {
      const key = `${PROGRESS_PREFIX}${dayId}`;
      localStorage.setItem(key, index.toString());
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  },

  /**
   * Gets the last saved index for a specific day
   */
  getProgress: (dayId: number): number => {
    try {
      const key = `${PROGRESS_PREFIX}${dayId}`;
      const item = localStorage.getItem(key);
      return item ? parseInt(item, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  /**
   * Calculates overall stats
   */
  getOverallStats: () => {
    let totalLearned = 0;
    const totalVerbs = STAGES.reduce((acc, curr) => acc + curr.wordCount, 0);
    const dayBreakdown: { id: number, learned: number }[] = [];

    for (const stage of STAGES) {
      const learned = storageService.getProgress(stage.id);
      totalLearned += learned;
      dayBreakdown.push({ id: stage.id, learned });
    }

    return {
      totalLearned,
      totalVerbs,
      percentage: totalVerbs > 0 ? Math.round((totalLearned / totalVerbs) * 100) : 0,
      dayBreakdown
    };
  },

  getAdminGlobalStats: () => {
    // 1. Calculate Content Stats
    const allLessons = storageService.getAllCachedLessons();
    const generatedStages = allLessons.length;
    const totalWordsGenerated = allLessons.reduce((acc, l) => acc + l.words.length, 0);
    const totalAvailableStages = STAGES.length;

    return {
      generatedStages,
      totalWordsGenerated,
      totalAvailableStages,
      storageUsage: JSON.stringify(localStorage).length
    };
  },

  /**
   * Save User Preferences
   */
  savePreferences: (prefs: UserPreferences) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  /**
   * Get User Preferences
   */
  getPreferences: (): UserPreferences => {
    const str = localStorage.getItem(PREFS_KEY);
    if (str) {
      try {
        const parsed = JSON.parse(str);
        // Default settings if not set
        if (!parsed.visualizationSeconds) parsed.visualizationSeconds = 20;
        if (!parsed.speechRate) parsed.speechRate = 0.9;
        if (!parsed.verbRepetitions) parsed.verbRepetitions = 1;
        if (parsed.darkMode === undefined) parsed.darkMode = true; // Default to dark
        return parsed;
      } catch { }
    }
    return { darkMode: true, preferredVoiceURI: null, visualizationSeconds: 20, speechRate: 0.9, verbRepetitions: 1 };
  },

  /**
   * Clears all app data
   */
  clearAllData: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX) || key.startsWith(PROGRESS_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};

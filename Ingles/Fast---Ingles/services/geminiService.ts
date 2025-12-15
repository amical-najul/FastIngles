
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WordEntry, DayTopic } from "../types";
import { storageService } from "./storageService";
import { STAGES } from "../constants";

// Initialize Gemini Client directly in browser
// Note: Use VITE_ prefix for environment variables in Vite client-side code
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const parseGeminiResponse = (text: string): WordEntry[] => {
    const lines = text.trim().split('\n');
    const entries: WordEntry[] = [];
    for (const line of lines) {
        const cleanLine = line.replace(/^[\d\-\.\*]+\s+/, '').trim();
        if (!cleanLine) continue;

        const parts = cleanLine.split('|');
        if (parts.length >= 9) {
            entries.push({
                word: parts[0].trim(),
                pronunciation: parts[1].trim(),
                translation: parts[2].trim(),
                sentences: [parts[3].trim(), parts[4].trim(), parts[5].trim(), parts[6].trim(), parts[7].trim()],
                mnemonic: parts[8].trim()
            });
        }
    }
    return entries;
};

export const generateDailyLesson = async (dayId: number, topic: string): Promise<WordEntry[]> => {
    try {
        // 1. Check Local Storage first
        const cachedData = storageService.getLesson(dayId);
        if (cachedData && cachedData.length > 0) {
            console.log(`Loaded Stage ${dayId} from local browser cache.`);
            return cachedData;
        }

        console.log(`Generating Stage ${dayId} with Client-Side AI...`);

        // Find stage config to get word count and category
        const stageConfig = STAGES.find(s => s.id === dayId);
        const wordCount = stageConfig ? stageConfig.wordCount : 50;
        const category = stageConfig ? stageConfig.category : 'verbs';

        // Check if it's an irregular verb topic
        const isIrregular = topic.toLowerCase().includes("irregular");
        const irregularInstruction = isIrregular
            ? "IMPORTANT: For the 'Word' column, you MUST provide the 3 forms separated by slash: Base / Past / Participle (e.g., 'Go / Went / Gone')."
            : "";

        // Adjust prompt based on category
        let partOfSpeechInstruction = "";
        if (category === 'adjectives') partOfSpeechInstruction = "Focus on ADJECTIVES (Adjetivos).";
        if (category === 'nouns') partOfSpeechInstruction = "Focus on NOUNS (Sustantivos).";
        if (category === 'adverbs') partOfSpeechInstruction = "Focus on ADVERBS (Adverbios).";
        if (category === 'verbs') partOfSpeechInstruction = "Focus on VERBS (Verbos).";

        const prompt = `
    Task: Generate exactly ${wordCount} English words based on this specific concept/topic: "${topic}".
    CRITICAL: ${partOfSpeechInstruction}
    Method: Ramón Campayo / Fast-Ingles (Word, Pronunciation, Translation, 5 Sentences, Mnemonic).
    
    ${irregularInstruction}

    OUTPUT FORMAT:
    Return ONLY a list using the pipe character (|) as separator. NO Markdown, NO JSON, NO Headers.
    Format per line (9 columns):
    Word|Pronunciation|Translation|Sentence1|Sentence2|Sentence3|Sentence4|Sentence5|Mnemonic

    Examples:
    (Verb): To Run|Ran|Correr|I run fast.|He runs home.|...|Imagina una RANA ("Run") que CORRE muy rápido.
    (Adj):  Big|Big|Grande|The house is big.|...|...|Imagina un BIG-ote ("Big") muy GRANDE.
    (Noun): House|Haus|Casa|My house is red.|...|...|Imagina a Dr. HOUSE ("House") en tu CASA.

    Ensure:
    1. Exactly ${wordCount} lines.
    2. Exactly 5 sentences per word.
    3. Mnemonic must be in Spanish.
    4. Sentences should be simple and use the target word clearly.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("No text response from AI");

        const data = parseGeminiResponse(text);

        if (data && data.length > 0) {
            storageService.saveLesson(dayId, data);
            return data;
        } else {
            throw new Error("AI returned empty list or invalid format");
        }

    } catch (error) {
        console.error("Error generating lesson client-side:", error);
        throw error;
    }
};

/**
 * Generates replacements for specific words, avoiding duplicates.
 */
export const generateReplacements = async (topic: string, currentWords: string[], count: number): Promise<WordEntry[]> => {
    try {
        const isIrregular = topic.toLowerCase().includes("irregular");
        const irregularInstruction = isIrregular
            ? "IMPORTANT: For the 'Word' column, you MUST provide the 3 forms separated by slash."
            : "";

        const prompt = `
        Task: Generate exactly ${count} NEW English words for topic: "${topic}".
        CRITICAL: Do NOT use any of these words: ${currentWords.slice(0, 50).join(', ')}.
        Method: Ramón Campayo (Word, Pronunciation, Translation, 5 Sentences, Mnemonic).
        ${irregularInstruction}
        
        OUTPUT FORMAT:
        Pipe (|) separated list. No Headers.
        Word|Pronunciation|Translation|Sentence1|Sentence2|Sentence3|Sentence4|Sentence5|Mnemonic
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("No response");
        return parseGeminiResponse(text);
    } catch (e) {
        console.error("Error generating replacements", e);
        throw e;
    }
};

/**
 * Uses Browser Speech Synthesis directly.
 */
export const generateSpeech = async (text: string, isEnglish: boolean = true): Promise<string> => {
    return "BROWSER_TTS_FALLBACK::" + JSON.stringify({
        text,
        lang: isEnglish ? 'en-US' : 'es-ES'
    });
};

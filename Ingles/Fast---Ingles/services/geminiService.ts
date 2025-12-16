
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WordEntry, DayTopic } from "../types";
import { storageService } from "./storageService";
import { apiService } from "./apiService";
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
    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 30000; // 30 seconds

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Check Backend API (Database) - ONLY source of data for users
            const dbLesson = await apiService.getLesson(dayId);

            if (dbLesson && dbLesson.content && dbLesson.content.length > 0) {
                console.log(`Loaded Stage ${dayId} from Backend Database.`);
                return dbLesson.content;
            }

            // No data found in database
            throw new Error("NO_DATA");

        } catch (error: any) {
            console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

            if (error.message === "NO_DATA") {
                // No data exists - don't retry, just fail
                throw new Error(
                    "Este nivel aún no está disponible. " +
                    "El administrador debe generar el contenido primero. " +
                    "Contacte a soporte: support@fast-ingles.com"
                );
            }

            // Connection error - retry after delay
            if (attempt < MAX_RETRIES) {
                console.log(`Reintentando en ${RETRY_DELAY_MS / 1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
                // All retries exhausted
                throw new Error(
                    "Problemas de conexión con el servidor. " +
                    "Por favor verifica tu conexión a internet. " +
                    "Si el problema persiste, contacte a soporte: support@fast-ingles.com"
                );
            }
        }
    }

    // Should never reach here, but TypeScript needs it
    throw new Error("Error inesperado. Contacte a soporte.");
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

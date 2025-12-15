import axios from 'axios';
import { WordEntry } from '../types';


const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token interceptor if needed
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const apiService = {
    /**
     * Generate a preview of the lesson using AI.
     * Does NOT save to database.
     */
    previewLesson: async (
        topic: string,
        category: string,
        wordCount: number = 50,
        provider: string = 'gemini'
    ): Promise<WordEntry[]> => {
        try {
            const response = await api.post<WordEntry[]>('/lessons/preview', {
                topic,
                category,
                word_count: wordCount,
                provider
            });
            return response.data;
        } catch (error) {
            console.error('Error generating preview:', error);
            throw error;
        }
    },

    /**
     * Save the approved lesson content to the database.
     * Triggers audio generation in background.
     */
    saveLesson: async (
        dayId: number,
        content: WordEntry[],
        topic: string,
        category: string,
        skipBackgroundAudio: boolean = false
    ) => {
        try {
            // Append query param to skip background task if requested
            const url = `/lessons/${dayId}${skipBackgroundAudio ? '?generate_audio=false' : ''}`;
            const response = await api.put(url, {
                content,
                topic,
                category
            });
            return response.data;
        } catch (error) {
            console.error(`Error saving lesson ${dayId}:`, error);
            throw error;
        }
    },

    /**
     * Generate audio for a single word synchronously.
     * Used for frontend-controlled progress bars.
     */
    generateAudioSingle: async (
        word: string,
        category: string,
        level: number
    ) => {
        try {
            const response = await api.post('/lessons/generate-audio-single', {
                word,
                category,
                level,
                lang: 'en-US'
            });
            return response.data; // { status: "generated" | "skipped", key: "..." }
        } catch (error) {
            console.error(`Error generating audio for ${word}:`, error);
            throw error;
        }
    },

    /**
     * Get lesson from database.
     */
    getLesson: async (dayId: number) => {
        try {
            const response = await api.get(`/lessons/${dayId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Get TTS audio URL from backend.
     * Returns a presigned URL or direct stream URL.
     */
    getTTSUrl: async (text: string, lang: string = 'en-US'): Promise<string> => {
        try {
            const response = await api.post('/tts/speak', {
                text,
                language: lang,
                provider: 'browser' // Default to browser for now, can switch to 'gemini'
            });
            return response.data.url;
        } catch (error) {
            console.error('Error getting TTS:', error);
            // Fallback for UI to handle
            return `BROWSER_TTS::${text}::${lang}`;
        }
    }
};

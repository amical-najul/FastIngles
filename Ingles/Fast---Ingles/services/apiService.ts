
import axios from 'axios';
import { WordEntry, User } from '../types';
import { auth } from '../firebaseConfig';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject Firebase ID Token
api.interceptors.request.use(async (config) => {
    if (auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error("Error getting Firebase token:", error);
        }
    }
    return config;
});

export const apiService = {
    // ========== AUTH API METHODS (Firebase Integration) ==========

    /**
     * Sync user with backend (JIT Provisioning).
     * Calls /auth/me to verify token and create user if missing.
     */
    syncUserWithBackend: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    /**
     * Update user profile in backend.
     */
    updateUserProfile: async (updates: { displayName?: string, photoURL?: string }): Promise<User> => {
        // Mapping Firebase fields to Backend User Model fields if necessary
        // Backend expects { name: ..., photo_url: ... } typically.
        const payload: any = {};
        if (updates.displayName) payload.name = updates.displayName;
        if (updates.photoURL) payload.photo_url = updates.photoURL;

        const response = await api.put('/auth/me', payload); // Assuming /auth/me can handle PUT
        return response.data;
    },

    // ========== CONTENT METHODS ==========

    previewLesson: async (
        topic: string,
        category: string,
        wordCount: number = 50,
        provider: string = 'gemini'
    ): Promise<WordEntry[]> => {
        const response = await api.post<WordEntry[]>('/lessons/preview', {
            topic,
            category,
            word_count: wordCount,
            provider
        });
        return response.data;
    },

    saveLesson: async (
        dayId: number,
        content: WordEntry[],
        topic: string,
        category: string,
        skipBackgroundAudio: boolean = false
    ) => {
        const url = `/lessons/${dayId}${skipBackgroundAudio ? '?generate_audio=false' : ''}`;
        const response = await api.put(url, {
            content,
            topic,
            category
        });
        return response.data;
    },

    generateAudioSingle: async (
        word: string,
        category: string,
        level: number
    ) => {
        const response = await api.post('/lessons/generate-audio-single', {
            word,
            category,
            level,
            lang: 'en-US'
        });
        return response.data;
    },

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

    getLessonSection: async (dayId: number, sectionId: number) => {
        try {
            const response = await api.get(`/lessons/${dayId}/section/${sectionId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    getTTSUrl: async (text: string, lang: string = 'en-US'): Promise<string> => {
        try {
            const response = await api.post('/tts/speak', {
                text,
                language: lang,
                provider: 'browser'
            });
            return response.data.url;
        } catch (error) {
            console.error('Error getting TTS:', error);
            return `BROWSER_TTS::${text}::${lang}`;
        }
    },

    // ========== ADMIN USER MANAGEMENT API ==========

    adminGetAllUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    adminCreateUser: async (userData: any) => {
        const response = await api.post('/admin/users', userData);
        return response.data;
    },

    adminUpdateUser: async (userId: number, updates: any) => {
        const response = await api.put(`/admin/users/${userId}`, updates);
        return response.data;
    },

    adminDeleteUser: async (userId: number) => {
        await api.delete(`/admin/users/${userId}`);
        return true;
    }
};

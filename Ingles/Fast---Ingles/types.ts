
export interface WordEntry {
  word: string;
  pronunciation: string;
  translation: string;
  sentences: string[];
  mnemonic: string; // The "Asociación inverosímil"
}

export type CategoryType = 'verbs' | 'adjectives' | 'nouns' | 'adverbs';

export interface DayTopic {
  id: number;
  title: string;
  description: string;
  icon: string;
  phase: string; // e.g., "Fase 1: Los Cimientos"
  level: string; // e.g., "A1"
  category: CategoryType; // Added category
  wordCount: number; // Added specific word count per level
}

export enum AppState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  LOADING = 'LOADING',
  PLAYER = 'PLAYER',
  PROGRESS = 'PROGRESS',
  SETTINGS = 'SETTINGS',
  PRACTICE_SELECTION = 'PRACTICE_SELECTION',
  // Admin States
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_EDITOR = 'ADMIN_EDITOR',
  ERROR = 'ERROR'
}

export interface AudioCache {
  [key: string]: string; // map key (word_type) to objectURL
}

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
  status?: UserStatus; // Added status
}

export interface UserPreferences {
  darkMode: boolean;
  preferredVoiceURI: string | null;
  visualizationSeconds?: number;
  speechRate?: number;
  verbRepetitions?: number;
}

// AI Provider Configuration Types
export type AIProviderType = 'gemini' | 'claude' | 'chatgpt' | 'deepseek';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
}

export interface AIConfig {
  currentProvider: AIProviderType;
  providers: {
    gemini: { apiKey: string; model: string };
    claude: { apiKey: string; model: string };
    chatgpt: { apiKey: string; model: string };
    deepseek: { apiKey: string; model: string };
  };
}

// Default AI models per provider
export const AI_MODELS: Record<AIProviderType, string[]> = {
  gemini: [
    // Gemini 3 - Vanguardia (más inteligentes)
    'gemini-3-pro',              // Modelo insignia con modo "Thinking"
    'gemini-3-pro-image',        // Especializado en generación/edición de imágenes
    'gemini-3-deep-think',       // Razonamiento profundo y planificación
    // Gemini 2.5 - Estándar y Rendimiento
    'gemini-2.5-pro',            // Alta capacidad, ventana de contexto masiva
    'gemini-2.5-flash',          // Respuestas rápidas, baja latencia (predeterminado)
    'gemini-2.5-flash-lite',     // Versión ligera y económica
    'gemini-2.5-flash-live',     // Interacciones de voz/video en tiempo real
    // Gemini 1.5 - Legacy
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ],
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  chatgpt: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-coder']
};


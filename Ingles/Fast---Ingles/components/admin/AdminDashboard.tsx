import React, { useState, useEffect } from 'react';
import { User, WordEntry, CategoryType } from '../../types';
import { STAGES } from '../../constants';
// import { Button } from '../ui/Button'; // Removed as we use custom buttons here
// import { storageService } from '../../services/storageService'; // Replaced by apiService
import { apiService } from '../../services/apiService';
import { AdminUsers } from './AdminUsers';
import { AdminStats } from './AdminStats';
import { AdminSettings } from './AdminSettings';
import { AdminSystemCheck } from './AdminSystemCheck';

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
    onSwitchToApp: () => void;
}

type AdminView = 'content' | 'users' | 'stats' | 'settings' | 'diagnosis';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onSwitchToApp }) => {
    // Navigation State
    const [currentView, setCurrentView] = useState<AdminView>('content');

    // Content Management State
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('verbs');
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [generatedContent, setGeneratedContent] = useState<WordEntry[]>([]);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    // Audio Generation Progress States
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentProcessingWord, setCurrentProcessingWord] = useState('');

    const categories: { id: CategoryType, label: string, icon: string }[] = [
        { id: 'verbs', label: 'Verbos', icon: '⚡' },
        { id: 'adjectives', label: 'Adjetivos', icon: '🎨' },
        { id: 'nouns', label: 'Sustantivos', icon: '📦' },
        { id: 'adverbs', label: 'Adverbios', icon: '🚀' },
    ];

    const filteredStages = STAGES.filter(s => s.category === selectedCategory);

    // --- API & LOGIC ---

    // Load data when level selection changes
    useEffect(() => {
        if (selectedLevelId) {
            fetchLessonData(selectedLevelId);
        } else {
            setGeneratedContent([]);
        }
    }, [selectedLevelId]);

    const fetchLessonData = async (dayId: number) => {
        setIsLoading(true);
        try {
            const lesson = await apiService.getLesson(dayId);
            if (lesson && lesson.content) {
                // Ensure content is strictly WordEntry[]
                const typedContent = lesson.content as unknown as WordEntry[];
                setGeneratedContent(typedContent);
            } else {
                setGeneratedContent([]);
            }
        } catch (error) {
            console.log("No data found or error fetching:", error);
            setGeneratedContent([]);
        } finally {
            setIsLoading(false);
        }
    };

    // GENERATE PREVIEW (No save)
    const handleGenerateContent = async () => {
        if (!selectedLevelId) return;

        setIsGenerating(true);
        try {
            const stage = STAGES.find(s => s.id === selectedLevelId);
            const topic = stage?.title || `Level ${selectedLevelId}`;
            const category = categories.find(c => c.id === selectedCategory)?.id || 'verbs';

            // Call Backend Preview Endpoint (Restored to 50 for production)
            const data = await apiService.previewLesson(topic, category, 50);

            // Update state with preview data (not saved yet)
            setGeneratedContent(data);

            // Optional: Notification
            // alert("Contenido generado (Vista Previa). Revisa y haz clic en Guardar.");
        } catch (error) {
            console.error("Error generating preview:", error);
            setSaveMessage({ type: 'error', text: 'Error generando contenido. Ver consola.' });
            setTimeout(() => setSaveMessage(null), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveContent = async () => {
        if (!selectedLevelId || !generatedContent || generatedContent.length === 0) return;

        setIsSaving(true);
        setAudioProgress(0);
        setSaveMessage({ type: 'info', text: 'Guardando lección en BD...' });

        try {
            const stage = STAGES.find(s => s.id === selectedLevelId);
            const topic = stage?.title || `Level ${selectedLevelId}`;
            const category = categories.find(c => c.id === selectedCategory)?.id || 'verbs';

            // 1. Save to Database (skip background audio)
            await apiService.saveLesson(selectedLevelId, generatedContent, topic, category, true);

            // 2. Interactive Audio Generation
            setSaveMessage({ type: 'info', text: 'Generando audios...' });
            const total = generatedContent.length;
            let completed = 0;
            let failures: string[] = [];

            for (const item of generatedContent) {
                setCurrentProcessingWord(item.word);

                try {
                    await apiService.generateAudioSingle(item.word, category, selectedLevelId);
                } catch (e) {
                    console.warn(`Failed to generate audio for ${item.word}`, e);
                    failures.push(item.word);
                }

                completed++;
                setAudioProgress(Math.round((completed / total) * 100));
            }

            // 3. Final Status
            setCurrentProcessingWord('');

            if (failures.length === 0) {
                setSaveMessage({ type: 'success', text: `✅ ¡Lección guardada! ${total} audios generados correctamente.` });
            } else {
                setSaveMessage({ type: 'error', text: `¡Lección guardada con ${failures.length} errores de audio!` });
            }

            // Clear message after 5 seconds
            setTimeout(() => setSaveMessage(null), 5000);

            // Refresh view to ensure sync
            await fetchLessonData(selectedLevelId);

        } catch (error) {
            console.error("Error saving lesson:", error);
            setSaveMessage({ type: 'error', text: 'Error guardando lección.' });
            setTimeout(() => setSaveMessage(null), 5000);
        } finally {
            setIsSaving(false);
            setAudioProgress(0);
            setCurrentProcessingWord('');
        }
    };

    const handlePlayAudio = async (word: string) => {
        try {
            const url = await apiService.getTTSUrl(word);
            if (url.startsWith('BROWSER_TTS::')) {
                // Fallback to browser TTS
                const text = url.split('::')[1];
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            } else {
                // Play from URL (MinIO)
                const audio = new Audio(url);
                audio.play();
            }
        } catch (error) {
            console.error("Error playing audio:", error);
            setSaveMessage({ type: 'error', text: 'Error reproduciendo audio' });
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-row">

            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-white mb-8">
                        <div className="bg-emerald-600 p-1.5 rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <h1 className="font-bold text-lg leading-tight">Fast-Ingles<br /><span className="text-xs font-normal opacity-50">Admin Panel</span></h1>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setCurrentView('content')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'content' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Panel Principal
                        </button>

                        {/* SYSTEM CHECK - NEW */}
                        <button
                            onClick={() => setCurrentView('diagnosis')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'diagnosis' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            System Check
                        </button>

                        <button
                            onClick={() => setCurrentView('users')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Usuarios
                        </button>

                        <button
                            onClick={() => setCurrentView('stats')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'stats' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Estadísticas
                        </button>

                        <button
                            onClick={() => setCurrentView('settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'hover:bg-slate-800'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Configuración
                        </button>

                        <div className="h-px bg-slate-800 my-4"></div>

                        <button onClick={onSwitchToApp} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Ver como Usuario
                        </button>

                        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Cerrar Sesión
                        </button>
                    </nav>
                </div>
                <div className="mt-auto p-6">
                    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm text-white font-bold truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">Administrador</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto h-screen relative bg-slate-50">

                {/* VIEW: USER MANAGEMENT */}
                {currentView === 'users' && (
                    <div className="p-8">
                        <AdminUsers />
                    </div>
                )}

                {/* VIEW: STATS */}
                {currentView === 'stats' && (
                    <AdminStats />
                )}

                {/* VIEW: SETTINGS */}
                {currentView === 'settings' && (
                    <AdminSettings />
                )}

                {/* VIEW: SYSTEM CHECK */}
                {currentView === 'diagnosis' && (
                    <AdminSystemCheck />
                )}

                {/* VIEW: CONTENT MANAGEMENT */}
                {currentView === 'content' && (
                    <div className="flex h-full">
                        {/* Secondary Sidebar for Levels */}
                        <div className="w-64 border-r border-slate-200 bg-white overflow-y-auto shrink-0 pb-20 h-full flex flex-col">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Categoría</h3>
                                <div className="grid grid-cols-4 gap-1">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setSelectedCategory(cat.id); setSelectedLevelId(null); }}
                                            className={`p-2 rounded flex flex-col items-center justify-center text-xs transition ${selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'}`}
                                            title={cat.label}
                                        >
                                            <span className="text-lg leading-none mb-1">{cat.icon}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                    {categories.find(c => c.id === selectedCategory)?.label}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="space-y-1">
                                    {filteredStages.map(lvl => (
                                        <button
                                            key={lvl.id}
                                            onClick={() => setSelectedLevelId(lvl.id)}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${selectedLevelId === lvl.id ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span>Nivel {lvl.id}: {lvl.title}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-normal truncate">{lvl.wordCount} words</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            {selectedLevelId ? (
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">
                                                Nivel {selectedLevelId}: {STAGES.find(s => s.id === selectedLevelId)?.title}
                                            </h2>
                                            <p className="text-slate-500">
                                                {STAGES.find(s => s.id === selectedLevelId)?.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                                                {generatedContent.length} items
                                            </span>

                                            {generatedContent.length > 0 && (
                                                <button
                                                    onClick={handleSaveContent}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                            Guardando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                                            Guardar
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* INLINE STATUS MESSAGE */}
                                    {saveMessage && (
                                        <div className={`mb-6 p-4 rounded-lg font-bold text-center ${saveMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                                            saveMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                                                'bg-blue-50 border border-blue-200 text-blue-700'
                                            }`}>
                                            {saveMessage.text}
                                        </div>
                                    )}

                                    {/* AUDIO GENERATION PROGRESS BAR */}
                                    {isSaving && audioProgress > 0 && (
                                        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-700">
                                                    Generando audios...
                                                </span>
                                                <span className="text-sm font-bold text-blue-600">
                                                    {audioProgress}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${audioProgress}%` }}
                                                ></div>
                                            </div>
                                            {currentProcessingWord && (
                                                <p className="text-xs text-slate-500 mt-2 text-center">
                                                    Procesando: <strong>{currentProcessingWord}</strong>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {isLoading ? (
                                        <div className="p-12 text-center text-slate-500">
                                            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            Cargando contenido...
                                        </div>
                                    ) : generatedContent.length > 0 ? (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                                                            <th className="p-4 font-bold">Word</th>
                                                            <th className="p-4 font-bold">Pronunciation</th>
                                                            <th className="p-4 font-bold">Audio</th>
                                                            <th className="p-4 font-bold">Translation</th>
                                                            <th className="p-4 font-bold">Mnemonic</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {generatedContent.map((word, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                                <td className="p-4 font-bold text-slate-800">{word.word}</td>
                                                                <td className="p-4 text-slate-600 font-mono text-xs">{word.pronunciation}</td>
                                                                <td className="p-4">
                                                                    <button
                                                                        onClick={() => handlePlayAudio(word.word)}
                                                                        className="p-2 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
                                                                        title="Escuchar Pronunciación"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                                    </button>
                                                                </td>
                                                                <td className="p-4 text-slate-600">{word.translation}</td>
                                                                <td className="p-4 text-slate-500 text-sm italic">{word.mnemonic}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                                <span className="text-3xl">🤖</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">Contenido Vacío</h3>
                                            <p className="text-slate-500 mb-6 max-w-sm">
                                                Genera contenido automáticamente con IA. Podrás revisarlo antes de guardar.
                                            </p>
                                            <button
                                                onClick={handleGenerateContent}
                                                disabled={isGenerating}
                                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                        Generando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                        Generar Clase (50 Palabras)
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    <p>Selecciona un nivel del menú lateral para gestionar su contenido.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

import React, { useState } from 'react';
import { WordEntry } from '../../types';
import { apiService } from '../../services/apiService';

export const AdminSystemCheck: React.FC = () => {
    // Steps: 1=Generate, 2=Save, 3=Verify
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Data State
    const [testContent, setTestContent] = useState<WordEntry[]>([]);
    const [verifiedContent, setVerifiedContent] = useState<WordEntry[]>([]);

    // Interactive State
    const [progress, setProgress] = useState(0);
    const [currentWord, setCurrentWord] = useState('');
    const [failures, setFailures] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Loading States
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // TEST CONFIG
    const TEST_ID = 9999;
    const TEST_TOPIC = "System Diagnosis";
    const TEST_CATEGORY = "verbs";
    const TEST_COUNT = 5;

    // STEP 1: GENERATE
    const handleSimulateGeneration = async () => {
        setIsGenerating(true);
        try {
            // Force randomness by appending timestamp to topic
            const uniqueTopic = `${TEST_TOPIC} [${new Date().toISOString()}]`;
            const data = await apiService.previewLesson(uniqueTopic, TEST_CATEGORY, TEST_COUNT);
            setTestContent(data);
            setStep(2); // Move to next step
        } catch (error) {
            console.error("Diagnosis Error (Gen):", error);
            setErrorMessage("Fallo en Generación AI. Ver consola.");
        } finally {
            setIsGenerating(false);
        }
    };

    // STEP 2: INTERACTIVE SAVE & GENERATE
    const handleSaveTest = async () => {
        setIsSaving(true);
        setProgress(0);
        setFailures([]);
        setStatusMessage('Guardando estructura en BD...');

        try {
            // 1. Save Structure Only (skip background audio)
            // Note: We use TEST_ID (9999) as dayId.
            // We pass true to skipBackgroundAudio.
            await apiService.saveLesson(TEST_ID, testContent, TEST_TOPIC, TEST_CATEGORY, true);

            // 2. Interactive Audio Generation Loop
            let completed = 0;
            const total = testContent.length;

            for (const item of testContent) {
                setCurrentWord(item.word);
                let retries = 0;
                let success = false;

                while (retries < 5 && !success) {
                    try {
                        const attemptLabel = retries > 0 ? `(Reintento ${retries}/5)` : '';
                        setStatusMessage(`Procesando: ${item.word} ${attemptLabel}`);

                        // Call Single Audio Generation
                        await apiService.generateAudioSingle(item.word, TEST_CATEGORY, TEST_ID);
                        success = true;
                    } catch (e) {
                        retries++;
                        console.warn(`Retry ${retries} for ${item.word}`, e);
                        await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
                    }
                }

                if (!success) {
                    setFailures(prev => [...prev, item.word]);
                }

                completed++;
                setProgress(Math.round((completed / total) * 100));
            }

            // Check if any failures occurred during the loop
            // Note: failures state may not be updated yet, track locally
            const localFailures = testContent.filter(item => !successForWord(item.word));

            if (localFailures.length === 0) {
                setSuccessMessage("✅ ¡Proceso completado! Verificando resultados...");
                setTimeout(() => {
                    setSuccessMessage('');
                    setStep(3);
                }, 1500);
            } else {
                setErrorMessage(`Proceso finalizado con errores en ${failures.length} audios.`);
            }

        } catch (error) {
            console.error("Diagnosis Error (Save):", error);
            setErrorMessage("Error crítico iniciando el proceso. Ver consola.");
        } finally {
            setIsSaving(false);
            setStatusMessage('');
            setCurrentWord('');
        }
    };

    // Helper to check success inside the loop 
    // (Actual logic inside loop handles this, we rely on setFailures for UI)
    const successForWord = (word: string) => !failures.includes(word);

    // STEP 3: VERIFY (READ TEST)
    const handleVerifyFiles = async () => {
        setIsLoadingDetails(true);
        try {
            const lesson = await apiService.getLesson(TEST_ID);
            if (lesson && lesson.content) {
                setVerifiedContent(lesson.content as unknown as WordEntry[]);
            }
        } catch (error) {
            console.error("Diagnosis Error (Read):", error);
            setErrorMessage("Fallo leyendo datos de prueba. Ver consola.");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handlePlayAudio = async (word: string) => {
        try {
            const url = await apiService.getTTSUrl(word);
            console.log(`Playing audio for ${word} from: ${url}`);

            if (url.startsWith('BROWSER_TTS::')) {
                setErrorMessage(`⚠️ Fallback: Audio no encontrado en MinIO para '${word}'.`);
                setTimeout(() => setErrorMessage(''), 3000);
                const text = url.split('::')[1];
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            } else {
                const audio = new Audio(url);
                await audio.play();
                // Visual feedback could be added here
            }
        } catch (error) {
            console.error("Audio Playback Error:", error);
            setErrorMessage("Error reproduciendo audio.");
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-emerald-600">🛠️</span> System Check & Diagnosis
                </h2>
                <p className="text-slate-500">
                    Asistente para validar la conexión Frontend ↔ Backend ↔ IA ↔ MinIO.
                    Usa el ID reservado <strong>#{TEST_ID}</strong>.
                </p>
            </div>

            {/* INLINE MESSAGES */}
            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-bold text-center">
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-bold text-center">
                    {errorMessage}
                </div>
            )}

            {/* PROGRESS STEPS */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>

                {/* STEP 1 INDICATOR */}
                <div className={`flex flex-col items-center gap-2 bg-slate-50 px-4 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        {step > 1 ? '✓' : '1'}
                    </div>
                    <span className="text-xs font-bold uppercase text-slate-600">Generación AI</span>
                </div>

                {/* STEP 2 INDICATOR */}
                <div className={`flex flex-col items-center gap-2 bg-slate-50 px-4 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        {step > 2 ? '✓' : '2'}
                    </div>
                    <span className="text-xs font-bold uppercase text-slate-600">Escritura BD</span>
                </div>

                {/* STEP 3 INDICATOR */}
                <div className={`flex flex-col items-center gap-2 bg-slate-50 px-4 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${verifiedContent.length > 0 ? 'bg-emerald-500 text-white' : step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        3
                    </div>
                    <span className="text-xs font-bold uppercase text-slate-600">Lectura Audio</span>
                </div>
            </div>

            {/* ACTION AREA */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">

                {/* STEP 1 VIEW */}
                {step === 1 && (
                    <div className="text-center">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Paso 1: Simular Generación AI</h3>
                            <p className="text-slate-500">Solicitar 5 verbos a Gemini para verificar conexión IA.</p>
                        </div>
                        <button
                            onClick={handleSimulateGeneration}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 mx-auto"
                        >
                            {isGenerating ? 'Conectando con IA...' : '⚡ Iniciar Simulación'}
                        </button>
                    </div>
                )}

                {/* STEP 2 VIEW */}
                {step === 2 && (
                    <div className="text-center">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Paso 2: Generación Interactiva</h3>
                            <p className="text-slate-500">Se generarán los audios uno por uno con validación.</p>
                        </div>

                        {/* PREVIEW */}
                        {!isSaving && failures.length === 0 && (
                            <div className="bg-slate-50 p-4 rounded-lg mb-6 max-w-md mx-auto text-left text-xs font-mono border border-slate-200">
                                <p className="text-slate-400 mb-2">Payload Preview:</p>
                                {testContent.map(w => (
                                    <div key={w.word} className="text-slate-600">• {w.word}</div>
                                ))}
                            </div>
                        )}

                        {/* PROGRESS BAR */}
                        {isSaving && (
                            <div className="max-w-md mx-auto mb-8">
                                <p className="text-sm font-bold text-blue-600 mb-2">{statusMessage}</p>
                                <div className="w-full bg-slate-200 rounded-full h-4 mb-2 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-right text-slate-400">{progress}% Completado</p>
                            </div>
                        )}

                        {/* FAILURES LIST */}
                        {!isSaving && failures.length > 0 && (
                            <div className="mb-8 border border-red-200 bg-red-50 rounded-lg p-4 max-w-md mx-auto">
                                <h4 className="text-red-700 font-bold mb-2 flex items-center gap-2">
                                    <span>⚠️</span> Errores de Subida ({failures.length})
                                </h4>
                                <ul className="text-sm text-red-600 list-disc list-inside mb-4">
                                    {failures.map(f => <li key={f}>{f}</li>)}
                                </ul>
                                <button
                                    onClick={handleSaveTest}
                                    className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-200 font-bold"
                                >
                                    🔁 Reintentar Proceso Completo
                                </button>
                            </div>
                        )}

                        {!isSaving && failures.length === 0 && (
                            <button
                                onClick={handleSaveTest}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 mx-auto"
                            >
                                💾 Iniciar Guardado Seguro
                            </button>
                        )}
                    </div>
                )}

                {/* STEP 3 VIEW */}
                {step === 3 && (
                    <div>
                        <div className="text-center mb-8">
                            <h3 className="text-lg font-bold text-slate-800">Paso 3: Verificación Interactiva</h3>
                            <p className="text-slate-500 mb-4">Recuperar datos y probar reproducción de audio.</p>

                            <button
                                onClick={handleVerifyFiles}
                                disabled={isLoadingDetails}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm"
                            >
                                {isLoadingDetails ? 'Actualizando...' : '🔄 Refrescar Lista'}
                            </button>
                        </div>

                        {verifiedContent.length > 0 ? (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-3">Word</th>
                                            <th className="p-3">Audio Check</th>
                                            <th className="p-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {verifiedContent.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-700">{item.word}</td>
                                                <td className="p-3">
                                                    <button
                                                        onClick={() => handlePlayAudio(item.word)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors text-sm font-bold"
                                                    >
                                                        <span>🔊 Play</span>
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Readable
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8 italic">
                                Haz clic en "Refrescar Lista" para cargar los resultados.
                            </div>
                        )}

                        {/* COMPLETE BUTTON */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
                            <button
                                onClick={() => {
                                    setIsComplete(true);
                                    setSuccessMessage('✅ Diagnóstico completado exitosamente');
                                    setTimeout(() => {
                                        setStep(1);
                                        setTestContent([]);
                                        setVerifiedContent([]);
                                        setIsComplete(false);
                                        setSuccessMessage('');
                                        setProgress(0);
                                        setFailures([]);
                                    }, 2000);
                                }}
                                disabled={verifiedContent.length === 0}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ✅ Finalizar Diagnóstico
                            </button>
                            <button
                                onClick={() => { setStep(1); setTestContent([]); setVerifiedContent([]); setSuccessMessage(''); setErrorMessage(''); setProgress(0); setFailures([]); }}
                                className="text-slate-400 hover:text-slate-600 text-sm underline"
                            >
                                Reiniciar Prueba
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

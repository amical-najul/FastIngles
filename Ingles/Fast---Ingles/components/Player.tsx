
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordEntry, CategoryType } from '../types';
import { generateSpeech } from '../services/geminiService';
import { Button } from './ui/Button';
import { storageService } from '../services/storageService';

// Helper to get category label in Spanish
const getCategoryLabel = (category: CategoryType): string => {
    const labels: Record<CategoryType, string> = {
        'verbs': 'verbos',
        'adjectives': 'adjetivos',
        'nouns': 'sustantivos',
        'adverbs': 'adverbios'
    };
    return labels[category] || 'palabras';
};

interface PlayerProps {
    words: WordEntry[];
    topic: string;
    dayId: number;
    initialIndex: number;
    darkMode: boolean;
    category?: CategoryType; // NEW: Category for dynamic labels
    onExit: () => void;
}

// Helper to clean mnemonic for better pronunciation (fixes spelling out inside parens)
const cleanMnemonicForTTS = (text: string) => {
    if (!text) return "";
    return text.replace(/\((.*?)\)/g, (match, content) => {
        // Remove hyphens and convert to lowercase: (Slii-p) -> (sliip)
        return `(${content.replace(/-/g, '').toLowerCase()})`;
    });
};

// Internal Quiz Component
const RoundQuiz = ({ words, onComplete, darkMode }: { words: WordEntry[], onComplete: () => void, darkMode: boolean }) => {
    const [questionIdx, setQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Generate 3 random questions from the provided words
    const questions = useRef<{ target: WordEntry, options: string[] }[]>([]);

    useEffect(() => {
        // Init questions
        const shuffled = [...words].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3); // Pick 3 random verbs to test

        questions.current = selected.map(target => {
            // Generate 2 distractors
            const distractors = words
                .filter(w => w.word !== target.word)
                .sort(() => 0.5 - Math.random())
                .slice(0, 2)
                .map(w => w.word);

            const options = [...distractors, target.word].sort(() => 0.5 - Math.random());
            return { target, options };
        });
    }, []);

    const handleAnswer = (selectedWord: string) => {
        const currentQ = questions.current[questionIdx];
        const isCorrect = selectedWord === currentQ.target.word;

        setSelectedOption(selectedWord);
        if (isCorrect) setScore(s => s + 1);
        setLastAnswerCorrect(isCorrect);

        setTimeout(() => {
            setLastAnswerCorrect(null);
            setSelectedOption(null);
            if (questionIdx < 2) {
                setQuestionIdx(prev => prev + 1);
            } else {
                setShowResult(true);
            }
        }, 1500); // 1.5s delay to show feedback
    };

    if (questions.current.length === 0) return null;

    const bgClass = darkMode ? "bg-slate-900" : "bg-slate-50";
    const textPrimary = darkMode ? "text-white" : "text-slate-900";

    if (showResult) {
        return (
            <div className={`absolute inset - 0 ${bgClass} z - 50 flex flex - col items - center justify - center p - 6 text - center animate -in fade -in `}>
                <div className="mb-6">
                    {score === 3 ? (
                        <span className="text-6xl">🏆</span>
                    ) : score >= 1 ? (
                        <span className="text-6xl">👏</span>
                    ) : (
                        <span className="text-6xl">😅</span>
                    )}
                </div>
                <h3 className={`text - 2xl font - bold ${textPrimary} mb - 2`}>Ronda Completada</h3>
                <p className="text-slate-400 mb-6">Acertaste {score} de 3</p>
                <Button onClick={onComplete} variant="primary" className="w-full max-w-xs">
                    Continuar Curso
                </Button>
            </div>
        );
    }

    const currentQ = questions.current[questionIdx];

    return (
        <div className={`absolute inset - 0 ${bgClass} z - 50 flex flex - col items - center justify - center p - 6 animate -in slide -in -from - right`}>
            <h3 className="text-emerald-500 font-bold tracking-widest uppercase mb-8 text-sm">
                Quiz Rápido ({questionIdx + 1}/3)
            </h3>

            <div className="mb-10 text-center">
                <p className="text-slate-500 text-sm mb-2">¿Cómo se dice?</p>
                <h2 className={`text - 3xl font - black ${textPrimary} `}>{currentQ.target.translation}</h2>
            </div>

            <div className="grid gap-4 w-full max-w-sm">
                {currentQ.options.map((opt, i) => {
                    let btnClass = darkMode
                        ? "bg-slate-800 text-white hover:bg-slate-700"
                        : "bg-white text-slate-900 shadow-sm border border-slate-200 hover:border-emerald-500";

                    if (lastAnswerCorrect !== null) {
                        if (opt === currentQ.target.word) {
                            // Correct answer is always Green
                            btnClass = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105 border-transparent";
                        } else if (opt === selectedOption && !lastAnswerCorrect) {
                            // Selected wrong answer is Red
                            btnClass = "bg-red-600 text-white shadow-lg shadow-red-600/20 border-transparent";
                        } else {
                            // Others dimmed
                            btnClass = darkMode ? "bg-slate-800 text-slate-500 opacity-50" : "bg-slate-100 text-slate-400 opacity-50";
                        }
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt)}
                            disabled={lastAnswerCorrect !== null}
                            className={`p - 4 rounded - xl font - bold text - lg transition - all duration - 300 ${btnClass} active: scale - 95`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {lastAnswerCorrect === true && (
                <div className="absolute bottom-10 text-emerald-500 font-bold animate-bounce">¡Correcto!</div>
            )}
            {lastAnswerCorrect === false && (
                <div className="absolute bottom-10 text-red-500 font-bold animate-pulse">¡Incorrecto!</div>
            )}
        </div>
    );
};

export const Player: React.FC<PlayerProps> = ({ words, topic, dayId, initialIndex, darkMode, category = 'verbs', onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);

    const [waitingForNext, setWaitingForNext] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Quiz State
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizWords, setQuizWords] = useState<WordEntry[]>([]);

    // Audio Playback State
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentAudioUrl = useRef<string | null>(null);
    const isComponentMounted = useRef(true);
    const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
    const ttsWatchdog = useRef<number | null>(null);

    // Sequence Control
    const sequenceIdRef = useRef<number>(0);
    // Track where we are in the sequence (0 = Word, 1 = Translation, 2+ = Sentences)
    const seqIndexRef = useRef<number>(0);
    const audioCache = useRef<Map<string, Promise<string>>>(new Map());

    // User Prefs
    const prefs = storageService.getPreferences();
    const visualizationTime = prefs.visualizationSeconds || 20;

    const currentWord = words[currentIndex];

    // Helper to identify Quiz Checkpoints - Now DYNAMIC based on word count
    const getQuizRange = (index: number) => {
        const totalWords = words.length;
        // Calculate checkpoint positions at ~30%, 60%, and 100% of total
        const checkpoint1 = Math.floor(totalWords * 0.3) - 1; // ~30%
        const checkpoint2 = Math.floor(totalWords * 0.6) - 1; // ~60%
        const checkpoint3 = totalWords - 1; // 100% (last word)

        // Checkpoint 1: Evaluates words 0 to checkpoint1+1
        if (index === checkpoint1) return { start: 0, end: checkpoint1 + 1 };
        // Checkpoint 2: Evaluates words from checkpoint1+1 to checkpoint2+1
        if (index === checkpoint2) return { start: checkpoint1 + 1, end: checkpoint2 + 1 };
        // Checkpoint 3: Evaluates words from checkpoint2+1 to end
        if (index === checkpoint3) return { start: checkpoint2 + 1, end: totalWords };

        return null;
    };

    useEffect(() => {
        isComponentMounted.current = true;
        return () => {
            isComponentMounted.current = false;
            stopAllAudio();
            audioCache.current.forEach(async (promise) => {
                try {
                    const url = await promise;
                    if (url && !url.startsWith("BROWSER")) URL.revokeObjectURL(url);
                } catch (e) { }
            });
            if (currentAudioUrl.current && !currentAudioUrl.current.startsWith("BROWSER")) {
                URL.revokeObjectURL(currentAudioUrl.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isCompleted && !showQuiz) {
            storageService.saveProgress(dayId, currentIndex);
        }
    }, [currentIndex, dayId, isCompleted, showQuiz]);

    const stopAllAudio = () => {
        // Clear watchdog
        if (ttsWatchdog.current) {
            clearTimeout(ttsWatchdog.current);
            ttsWatchdog.current = null;
        }
        // Cancel Browser TTS
        window.speechSynthesis.cancel();
        currentUtterance.current = null;

        // Pause HTML Audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleBrowserSpeech = (text: string, lang: string, onEnd: () => void) => {
        if (!isComponentMounted.current) return;

        // Safety cancel previous
        window.speechSynthesis.cancel();
        if (ttsWatchdog.current) clearTimeout(ttsWatchdog.current);

        // Ensure voices are loaded (Chrome quirk)
        const voices = window.speechSynthesis.getVoices();

        let voice = null;

        if (lang.startsWith('en')) {
            if (prefs.preferredVoiceURI) {
                voice = voices.find(v => v.voiceURI === prefs.preferredVoiceURI);
            }
            if (!voice) {
                voice = voices.find(v => v.lang.startsWith('en'));
            }
        } else {
            voice = voices.find(v => v.lang.startsWith('es'));
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (voice) utterance.voice = voice;
        utterance.lang = lang;

        // Set speed
        utterance.rate = prefs.speechRate || 0.9;

        // Fix for Chrome Garbage Collection Bug: Keep a ref to the utterance
        currentUtterance.current = utterance;

        // Safety Watchdog: If onend doesn't fire within expected time + buffer, force next
        // Estimation: 10 chars approx 1 second + 3 seconds buffer
        const estimatedDuration = (text.length / 10) * 1000 + 3000;

        ttsWatchdog.current = window.setTimeout(() => {
            console.warn("TTS Watchdog triggered: Audio took too long or hung.");
            if (isComponentMounted.current) {
                onEnd();
            }
        }, Math.max(3000, estimatedDuration));

        utterance.onend = () => {
            if (ttsWatchdog.current) clearTimeout(ttsWatchdog.current);
            currentUtterance.current = null;
            if (isComponentMounted.current) onEnd();
        };

        utterance.onerror = (e) => {
            if (ttsWatchdog.current) clearTimeout(ttsWatchdog.current);
            currentUtterance.current = null;

            // Filter out expected interruption errors
            if (e.error === 'interrupted' || e.error === 'canceled') {
                return;
            }

            console.error("Browser TTS error:", e);
            // Don't block progress on error
            if (isComponentMounted.current) onEnd();
        };

        window.speechSynthesis.speak(utterance);
    };

    const triggerQuiz = (range: { start: number, end: number }) => {
        const roundWords = words.slice(range.start, range.end);
        setQuizWords(roundWords);
        setShowQuiz(true);
        setLoadingAudio(false);
    };

    const handleNext = useCallback(() => {
        stopAllAudio();
        sequenceIdRef.current += 1;
        seqIndexRef.current = 0; // Reset sequence part

        setWaitingForNext(false);
        setSecondsLeft(0);
        setIsTimerPaused(false);
        setLoadingAudio(false);

        // Check for Quiz Trigger (Manual Skip)
        const quizRange = getQuizRange(currentIndex);
        if (quizRange && !showQuiz) {
            triggerQuiz(quizRange);
            return;
        }

        if (currentIndex < words.length - 1) {
            setCurrentIndex(p => p + 1);
        } else {
            setIsPlaying(false);
            setIsCompleted(true);
            storageService.saveProgress(dayId, 0);
        }
    }, [currentIndex, words, dayId, showQuiz]);

    const handleQuizComplete = () => {
        setShowQuiz(false);
        // Move to next word after quiz
        if (currentIndex < words.length - 1) {
            setCurrentIndex(p => p + 1);
        } else {
            // If the quiz was at the very end (index 49), finish
            setIsPlaying(false);
            setIsCompleted(true);
            storageService.saveProgress(dayId, 0);
        }
    };

    const handlePrev = () => {
        stopAllAudio();
        sequenceIdRef.current += 1;
        seqIndexRef.current = 0; // Reset sequence part
        setIsPlaying(false);
        setWaitingForNext(false);
        setIsTimerPaused(false);
        setSecondsLeft(0);
        if (currentIndex > 0) setCurrentIndex(p => p - 1);
    };

    const handleRestartSection = () => {
        stopAllAudio();
        sequenceIdRef.current += 1;
        seqIndexRef.current = 0;
        setIsCompleted(false);
        setCurrentIndex(0);
        setIsPlaying(false);
        setWaitingForNext(false);
        setSecondsLeft(0);
        storageService.saveProgress(dayId, 0);
    };

    const handleReplayCurrent = () => {
        stopAllAudio();
        // Don't increment sequenceId, we stay on same word
        seqIndexRef.current = 0; // Force restart from word audio
        setWaitingForNext(false);
        setSecondsLeft(0);
        setIsTimerPaused(false);
        setIsPlaying(true); // Resume playback
    };

    // Timer Effect
    useEffect(() => {
        let timer: number;
        if (waitingForNext && isPlaying && secondsLeft > 0 && !isTimerPaused && !showQuiz) {
            timer = window.setTimeout(() => {
                setSecondsLeft(prev => prev - 1);
            }, 1000);
        } else if (waitingForNext && isPlaying && secondsLeft === 0 && !isTimerPaused && !showQuiz) {
            handleNext();
        }
        return () => window.clearTimeout(timer);
    }, [waitingForNext, isPlaying, secondsLeft, isTimerPaused, handleNext, showQuiz]);

    const getAudio = useCallback((text: string, isEnglish: boolean) => {
        const key = `${isEnglish ? 'EN' : 'ES'}:${text} `;
        if (audioCache.current.has(key)) return audioCache.current.get(key)!;
        const generateSpeechFunc = async () => {
            return "BROWSER_TTS_FALLBACK::" + JSON.stringify({
                text,
                lang: isEnglish ? 'en-US' : 'es-ES'
            });
        };
        const promise = generateSpeechFunc();
        audioCache.current.set(key, promise);
        return promise;
    }, []);

    const playSequence = useCallback(async () => {
        const mySeqId = sequenceIdRef.current;
        if (!currentWord || !isPlaying || waitingForNext || isCompleted || showQuiz) return;

        setLoadingAudio(true);

        // Construct the verb repetition part
        const repetitions = prefs.verbRepetitions || 1;
        const verbSequence = Array.from({ length: repetitions }).map(() => ({
            text: currentWord.word,
            isEnglish: true
        }));

        const sequence = [
            ...verbSequence,
            { text: currentWord.translation, isEnglish: false },
            ...currentWord.sentences.map(s => ({ text: s, isEnglish: true })),
            { text: `Asociación: ${cleanMnemonicForTTS(currentWord.mnemonic)} `, isEnglish: false }
        ];

        // Resume from where we left off (seqIndexRef)
        let seqIndex = seqIndexRef.current;

        const playNextPart = async () => {
            if (sequenceIdRef.current !== mySeqId) return;
            if (!isPlaying || !isComponentMounted.current || showQuiz) {
                setLoadingAudio(false);
                return;
            }

            if (seqIndex >= sequence.length) {
                // Sequence Finished

                // AUTOMATIC QUIZ TRIGGER: Check if this index is a checkpoint
                const quizRange = getQuizRange(currentIndex);
                if (quizRange) {
                    triggerQuiz(quizRange);
                    return; // Stop here, do not go to visualization
                }

                // Normal Flow: Go to Visualization Timer
                setLoadingAudio(false);
                setWaitingForNext(true);
                setIsTimerPaused(false);
                setSecondsLeft(visualizationTime);
                return;
            }

            const part = sequence[seqIndex];

            // Prefetch next part
            if (seqIndex + 1 < sequence.length) {
                const nextPart = sequence[seqIndex + 1];
                getAudio(nextPart.text, nextPart.isEnglish).catch(() => { });
            }

            try {
                const audioResponse = await getAudio(part.text, part.isEnglish);

                if (sequenceIdRef.current !== mySeqId) return;
                if (!isComponentMounted.current || !isPlaying) return;

                const onPartEnd = () => {
                    if (sequenceIdRef.current !== mySeqId) return;
                    seqIndex++;
                    // Update the ref so if we pause now, we resume from next part
                    seqIndexRef.current = seqIndex;
                    setTimeout(playNextPart, 50);
                };

                if (audioResponse.startsWith("BROWSER_TTS_FALLBACK::")) {
                    const data = JSON.parse(audioResponse.split("::")[1]);
                    handleBrowserSpeech(data.text, data.lang, onPartEnd);
                    setLoadingAudio(false);
                } else {
                    // Future backend audio logic would go here
                }
            } catch (e) {
                console.error("Playback error loop", e);
                if (sequenceIdRef.current === mySeqId) {
                    // If error, try to skip to next part to avoid hanging
                    seqIndex++;
                    seqIndexRef.current = seqIndex;
                    playNextPart();
                }
            }
        };
        playNextPart();
    }, [currentWord, isPlaying, waitingForNext, getAudio, isCompleted, showQuiz, visualizationTime, prefs.preferredVoiceURI, prefs.verbRepetitions, currentIndex]);

    useEffect(() => {
        if (isPlaying && !waitingForNext && !isCompleted && !showQuiz) {
            playSequence();
        } else if (!isPlaying) {
            stopAllAudio();
        }
    }, [isPlaying, currentIndex, playSequence, waitingForNext, isCompleted, showQuiz]);

    const togglePlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
            stopAllAudio();
            // Do NOT reset waitingForNext or TimerPaused to keep state valid on resume
        } else {
            // Do NOT increment sequenceId here, we want to resume
            setIsPlaying(true);
        }
    };

    const toggleTimerPause = () => setIsTimerPaused(prev => !prev);

    if (isCompleted) {
        return (
            <div className={`fixed inset - 0 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} flex flex - col items - center justify - center p - 8 z - 50 animate -in fade -in duration - 500`}>
                <div className={`${darkMode ? 'bg-slate-800 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-xl'} p - 8 rounded - 3xl border text - center max - w - sm w - full`}>
                    <h2 className={`text - 3xl font - black ${darkMode ? 'text-white' : 'text-slate-900'} mb - 2`}>¡Nivel Completado!</h2>
                    <p className="text-slate-400 mb-8">Has dominado los {words.length} {getCategoryLabel(category ?? 'verbs' as CategoryType)}.</p>
                    <div className="space-y-4">
                        <Button variant="primary" fullWidth onClick={handleRestartSection} className="py-4 text-lg">Volver a estudiar</Button>
                        <Button variant="ghost" fullWidth onClick={onExit} className="py-4 text-slate-400 hover:text-emerald-500 hover:bg-slate-100">Volver al Inicio</Button>
                    </div>
                </div>
            </div>
        );
    }

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-slate-50';
    const textPrimary = darkMode ? 'text-white' : 'text-slate-900';
    const textMuted = darkMode ? 'text-slate-300' : 'text-slate-600';
    const cardBg = darkMode ? 'bg-slate-800/80 border-yellow-500/20' : 'bg-white border-yellow-500/30 shadow-md';
    const sentenceBg = darkMode ? 'bg-slate-800/40 border-slate-700/30' : 'bg-white/60 border-slate-200/50';

    return (
        <div className={`fixed inset - 0 ${bgClass} flex flex - col items - center justify - between p - 6 overflow - hidden`}>
            {showQuiz && <RoundQuiz words={quizWords} onComplete={handleQuizComplete} darkMode={darkMode} />}

            <audio ref={audioRef} className="hidden" playsInline />

            {/* Header */}
            <div className="w-full flex justify-between items-center mt-4">
                <button onClick={onExit} className="text-slate-400 hover:text-emerald-500 z-20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-xs font-bold tracking-widest text-emerald-500 uppercase z-20">
                    {topic} • {currentIndex + 1}/{words.length}
                </div>
                <div className="w-6"></div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-4 text-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">

                {waitingForNext && (
                    <div className={`absolute inset - 0 z - 10 flex flex - col items - center justify - center rounded - 2xl backdrop - blur - sm animate -in fade -in p - 6 ${darkMode ? 'bg-slate-900/95' : 'bg-slate-50/95'} `}>
                        <p className="text-emerald-500 font-bold tracking-widest uppercase mb-4 animate-pulse">
                            {isTimerPaused ? "Pausado" : "Visualiza la asociación"}
                        </p>
                        <div className={`text - 8xl font - black font - mono mb - 6 transition - opacity ${isTimerPaused ? "opacity-50" : "opacity-100"} ${textPrimary} `}>
                            {secondsLeft}
                        </div>
                        <div className="px-4 space-y-4 mb-6">
                            <p className={`italic text - lg leading - relaxed ${textMuted} `}>"{currentWord.mnemonic}"</p>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={toggleTimerPause} className="px-6 py-3 rounded-full bg-slate-700 text-white">{isTimerPaused ? "Continuar" : "Pausar"}</button>
                            <button onClick={handleNext} className="px-6 py-3 rounded-full border border-slate-700 text-slate-400">Saltar</button>
                        </div>
                    </div>
                )}

                <div className="space-y-1 shrink-0">
                    <h2 className={`text - 4xl md: text - 5xl font - black tracking - tight ${textPrimary} `}>{currentWord.word}</h2>
                    <p className="text-lg text-emerald-500 font-mono">/{currentWord.pronunciation}/</p>
                    <p className={`text - xl font - medium ${textMuted} `}>{currentWord.translation}</p>
                </div>

                <div className={`${cardBg} p - 4 rounded - 2xl border backdrop - blur - sm w - full shrink - 0`}>
                    <p className={`text - base leading - relaxed font - serif italic ${darkMode ? 'text-slate-200' : 'text-slate-700'} `}>"{currentWord.mnemonic}"</p>
                </div>

                <div className="space-y-2 w-full text-left overflow-y-auto max-h-[30vh] pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {currentWord.sentences.map((sent, i) => (
                        <div key={i} className={`flex gap - 3 items - start p - 3 rounded - lg border ${sentenceBg} `}>
                            <span className="text-emerald-600 font-bold text-xs mt-0.5">{i + 1}</span>
                            <p className={`text - sm leading - snug ${textMuted} `}>{sent}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md mb-8 z-20 shrink-0 mt-4">
                <div className={`w - full h - 1.5 rounded - full mb - 6 overflow - hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'} `}>
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / words.length) * 100}% ` }} />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-full w-16 h-16 p-0">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Button>

                    <Button
                        variant="primary"
                        onClick={waitingForNext ? handleReplayCurrent : togglePlay}
                        className={`rounded - full w - 20 h - 20 p - 0 shadow - emerald - 500 / 40 transition - all ${loadingAudio ? 'scale-105' : ''} `}
                    >
                        {loadingAudio ? (
                            <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : isPlaying ? (
                            waitingForNext ? (
                                <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                                </svg>
                            ) : (
                                <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                            )
                        ) : (
                            <svg className="w-10 h-10 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </Button>

                    <Button variant="secondary" onClick={handleNext} className="rounded-full w-16 h-16 p-0">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Button>
                </div>
            </div>
        </div>
    );
};



import React, { useState, useEffect } from 'react';
import { WordEntry } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './ui/Button';

interface PracticeSelectionScreenProps {
  onBack: () => void;
  onStartPractice: (selectedWords: WordEntry[]) => void;
  darkMode: boolean;
}

export const PracticeSelectionScreen: React.FC<PracticeSelectionScreenProps> = ({ onBack, onStartPractice, darkMode }) => {
  const [availableData, setAvailableData] = useState<{ dayId: number, words: WordEntry[] }[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const data = storageService.getAllCachedLessons();
    setAvailableData(data);
  }, []);

  const toggleWord = (word: string) => {
    const newSet = new Set(selectedWords);
    if (newSet.has(word)) {
      newSet.delete(word);
    } else {
      newSet.add(word);
    }
    setSelectedWords(newSet);
  };

  const toggleDay = (dayWords: WordEntry[]) => {
    const newSet = new Set(selectedWords);
    const allSelected = dayWords.every(w => selectedWords.has(w.word));

    if (allSelected) {
        dayWords.forEach(w => newSet.delete(w.word));
    } else {
        dayWords.forEach(w => newSet.add(w.word));
    }
    setSelectedWords(newSet);
  };

  const handleStart = () => {
    // Flatten data to find the full objects for selected words
    const allWords = availableData.flatMap(d => d.words);
    const practiceList = allWords.filter(w => selectedWords.has(w.word));
    
    // Shuffle
    const shuffled = practiceList.sort(() => 0.5 - Math.random());
    onStartPractice(shuffled);
  };

  const handleSelectRandom = (count: number) => {
    const allWords = availableData.flatMap(d => d.words);
    const shuffled = [...allWords].sort(() => 0.5 - Math.random()).slice(0, count);
    const newSet = new Set(shuffled.map(w => w.word));
    setSelectedWords(newSet);
  };

  const filteredData = availableData.map(group => ({
      ...group,
      words: group.words.filter(w => 
          w.word.toLowerCase().includes(filterText.toLowerCase()) || 
          w.translation.toLowerCase().includes(filterText.toLowerCase())
      )
  })).filter(group => group.words.length > 0);

  const totalSelected = selectedWords.size;
  const bgClass = darkMode ? 'bg-slate-900' : 'bg-slate-50';

  if (availableData.length === 0) {
      return (
        <div className={`min-h-screen ${bgClass} p-6 flex flex-col items-center justify-center text-center`}>
            <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'} p-8 rounded-3xl border max-w-sm`}>
                <span className="text-4xl mb-4 block">📭</span>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-2`}>No hay verbos disponibles</h2>
                <p className="text-slate-400 mb-6">Debes completar o iniciar al menos un Nivel en el Dashboard para tener material de práctica.</p>
                <Button onClick={onBack} fullWidth>Volver al Dashboard</Button>
            </div>
        </div>
      );
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b sticky top-0 z-20 ${darkMode ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'}`}>
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className={`p-2 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Modo Práctica</h1>
                <div className="w-9"></div>
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => handleSelectRandom(10)} className={`flex-1 text-xs py-2 rounded-lg border hover:bg-emerald-900 transition-colors ${darkMode ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    🎲 10 al Azar
                </button>
                <button onClick={() => handleSelectRandom(20)} className={`flex-1 text-xs py-2 rounded-lg border hover:bg-emerald-900 transition-colors ${darkMode ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    🎲 20 al Azar
                </button>
                <button onClick={() => setSelectedWords(new Set())} className={`px-4 text-xs py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                    Limpiar
                </button>
            </div>

            <input 
                type="text" 
                placeholder="Buscar verbo..." 
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className={`w-full rounded-xl px-4 py-2 outline-none text-sm border focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
        </div>

        {/* List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6 pb-24">
            {filteredData.map(group => (
                <div key={group.dayId} className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-emerald-500 font-bold text-xs uppercase tracking-wider">Nivel {group.dayId}</h3>
                        <button 
                            onClick={() => toggleDay(group.words)}
                            className="text-xs text-slate-500 hover:text-emerald-500"
                        >
                            {group.words.every(w => selectedWords.has(w.word)) ? 'Deseleccionar Nivel' : 'Seleccionar Nivel'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {group.words.map(word => {
                            const isSelected = selectedWords.has(word.word);
                            return (
                                <button
                                    key={word.word}
                                    onClick={() => toggleWord(word.word)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        isSelected 
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' 
                                        : `${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:shadow-md'}`
                                    }`}
                                >
                                    <div className={`font-bold text-sm ${!isSelected && !darkMode ? 'text-slate-800' : ''}`}>{word.word}</div>
                                    <div className={`text-xs ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>{word.translation}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {/* Floating Action Button */}
        <div className={`fixed bottom-0 left-0 w-full p-4 border-t ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur`}>
            <Button 
                onClick={handleStart} 
                disabled={totalSelected === 0} 
                fullWidth 
                className="shadow-xl"
            >
                {totalSelected === 0 ? 'Selecciona verbos' : `Practicar ${totalSelected} Verbos ▶`}
            </Button>
        </div>
    </div>
  );
};



import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { Button } from './ui/Button';

interface ProgressScreenProps {
  onBack: () => void;
  darkMode: boolean;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ onBack, darkMode }) => {
  const [stats, setStats] = useState(storageService.getOverallStats());

  useEffect(() => {
    setStats(storageService.getOverallStats());
  }, []);

  // Calculate SVG Circle parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  const getLevel = (pct: number) => {
    if (pct < 10) return "Novato";
    if (pct < 30) return "Aprendiz";
    if (pct < 60) return "Intermedio";
    if (pct < 90) return "Avanzado";
    return "Maestro";
  };

  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const bgCard = darkMode ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200 shadow-sm";

  return (
    <div className={`min-h-screen p-6 flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className={`p-2 rounded-full border ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-white border-slate-700' : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200 shadow-sm'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Mi Progreso</h1>
      </div>

      {/* Hero Chart */}
      <div className={`${bgCard} rounded-3xl p-8 mb-6 border relative overflow-hidden flex flex-col items-center animate-in fade-in zoom-in duration-300`}>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
         
         <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="80" cy="80" r={radius}
                    stroke="currentColor" strokeWidth="12" fill="transparent"
                    className={darkMode ? "text-slate-700" : "text-slate-100"}
                />
                <circle
                    cx="80" cy="80" r={radius}
                    stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${textPrimary}`}>{stats.percentage}%</span>
            </div>
         </div>
         
         <div className="text-center">
            <p className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-1">Nivel Actual</p>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                {getLevel(stats.percentage)}
            </h2>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`${bgCard} p-4 rounded-2xl border`}>
            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Verbos Aprendidos</p>
            <p className={`text-3xl font-black ${textPrimary}`}>{stats.totalLearned} <span className="text-sm text-slate-500 font-normal">/ 350</span></p>
        </div>
        <div className={`${bgCard} p-4 rounded-2xl border`}>
            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Días Iniciados</p>
            <p className={`text-3xl font-black ${textPrimary}`}>
                {stats.dayBreakdown.filter(d => d.learned > 0).length} <span className="text-sm text-slate-500 font-normal">/ 7</span>
            </p>
        </div>
      </div>

      {/* Breakdown per Day */}
      <div className="flex-1 overflow-y-auto pb-4">
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
            Detalle por Día
        </h3>
        <div className="space-y-3">
            {stats.dayBreakdown.map((day) => {
                const dayPct = Math.min(100, Math.round((day.learned / 50) * 100));
                return (
                    <div key={day.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/30' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Día {day.id}</span>
                            <span className="text-xs font-mono text-emerald-500">{day.learned}/50 Verbos</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${dayPct === 100 ? 'bg-emerald-400' : 'bg-emerald-600'}`}
                                style={{ width: `${dayPct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

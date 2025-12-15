
import React, { useState } from 'react';
import { User, CategoryType } from '../types';
import { APP_VERSION, STAGES } from '../constants';

interface DashboardProps {
  user: User;
  darkMode: boolean;
  onSelectDay: (id: number, topic: string) => void;
  onLogout: () => void;
  onViewProgress: () => void;
  onOpenSettings: () => void;
  onOpenPractice: () => void;
  onSwitchToAdmin?: () => void; // Optional: Only available if user is admin
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  darkMode, 
  onSelectDay, 
  onLogout, 
  onViewProgress, 
  onOpenSettings, 
  onOpenPractice, 
  onSwitchToAdmin 
}) => {
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('verbs');

  const getPhaseColor = (phase: string) => {
    if (phase.includes("Fase 1")) return "text-emerald-500";
    if (phase.includes("Fase 2")) return "text-cyan-500";
    if (phase.includes("Fase 3")) return "text-blue-500";
    if (phase.includes("Fase 4")) return "text-purple-500";
    return "text-amber-500";
  };

  const getLevelBadgeColor = (level: string) => {
    // Adjusted for better visibility in light/dark
    if (level === "A1") return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
    if (level === "A2") return "bg-teal-500/20 text-teal-600 border-teal-500/30";
    if (level === "B1") return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    if (level === "B2") return "bg-violet-500/20 text-violet-600 border-violet-500/30";
    if (level === "C1") return "bg-fuchsia-500/20 text-fuchsia-600 border-fuchsia-500/30";
    return "bg-amber-500/20 text-amber-600 border-amber-500/30";
  };

  const cardClass = darkMode 
    ? "bg-slate-800 border-slate-700/50 hover:border-emerald-500/50" 
    : "bg-white border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md";
    
  const textPrimary = darkMode ? "text-slate-100" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-500";

  const categories: {id: CategoryType, label: string, icon: string}[] = [
      { id: 'verbs', label: 'Verbos', icon: '⚡' },
      { id: 'adjectives', label: 'Adjetivos', icon: '🎨' },
      { id: 'nouns', label: 'Sustantivos', icon: '📦' },
      { id: 'adverbs', label: 'Adverbios', icon: '🚀' },
  ];

  const filteredStages = STAGES.filter(stage => stage.category === selectedCategory);

  return (
    <div className="p-6 pb-20">
      <header className="mb-6 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={onOpenSettings}
                className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} p-1.5 rounded-xl border hover:border-emerald-500 transition-colors`}
            >
                {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Settings" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-slate-400">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                )}
            </button>
            <div>
                <h1 className={`text-2xl font-bold leading-none ${textPrimary}`}>
                Hola, <span className="text-emerald-500">{user.name}</span>
                </h1>
                <p className={`${textSecondary} text-sm mt-1`}>
                Mapa de Ruta: {filteredStages.length} Niveles Disponibles
                </p>
            </div>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
             {onSwitchToAdmin && (
                 <button onClick={onSwitchToAdmin} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold p-2 rounded-xl transition border border-emerald-500/30 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Panel Admin
                </button>
             )}
             <button onClick={onViewProgress} className="flex flex-col items-center justify-center gap-1 text-[10px] text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 p-2 rounded-xl transition font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progreso
            </button>
            <button onClick={onOpenPractice} className="flex flex-col items-center justify-center gap-1 text-[10px] text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 p-2 rounded-xl transition font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Práctica
            </button>
            <button onClick={onLogout} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold p-2 rounded-xl transition border ${darkMode ? 'text-slate-300 border-slate-700 hover:bg-slate-800' : 'text-slate-500 border-slate-300 hover:bg-slate-100 hover:text-slate-900'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Salir
            </button>
        </div>
      </header>

      {/* CATEGORY TABS */}
      <div className={`flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-none`}>
          {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                    : `${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`
                }`}
              >
                  <span>{cat.icon}</span>
                  {cat.label}
              </button>
          ))}
      </div>

      {/* LEVELS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStages.map((stage) => (
          <div 
            key={stage.id}
            onClick={() => onSelectDay(stage.id, stage.description)}
            className={`group p-5 rounded-2xl border transition-all cursor-pointer active:scale-98 relative overflow-hidden flex flex-col justify-between h-full ${cardClass}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-6xl grayscale">{stage.icon}</span>
            </div>
            
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getPhaseColor(stage.phase)}`}>
                        {stage.phase}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeColor(stage.level)}`}>
                        {stage.level}
                    </span>
                </div>

                <div className="flex items-center gap-4 mb-2 relative z-10">
                    <span className="text-3xl filter drop-shadow-md">{stage.icon}</span>
                    <div>
                        <h3 className={`text-lg font-bold leading-tight ${textPrimary}`}>{stage.title}</h3>
                        <p className={`text-[10px] ${textSecondary}`}>{stage.wordCount} Palabras</p>
                    </div>
                </div>
                
                <p className={`text-sm line-clamp-2 mb-4 h-10 ${textSecondary}`}>{stage.description}</p>
            </div>

            <div className="flex justify-end">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors shadow-sm group-hover:bg-emerald-600 group-hover:text-white ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-400'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-8 p-4 rounded-xl border text-xs ${darkMode ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
        <p>💡 <strong>Método J.L.:</strong> Cada nivel tiene 5 Rondas. Al terminar una ronda, harás un Quiz rápido para asegurar el aprendizaje.</p>
      </div>

      <div className="mt-4 text-center space-y-2">
         <p className="text-[10px] text-slate-500 font-mono">
             v{APP_VERSION}
         </p>
      </div>
    </div>
  );
};

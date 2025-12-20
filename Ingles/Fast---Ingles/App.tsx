
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { Player } from './components/Player';
import { ProgressScreen } from './components/ProgressScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PracticeSelectionScreen } from './components/PracticeSelectionScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen';
import { VerifyEmailScreen } from './components/auth/VerifyEmailScreen';

import { AppState, WordEntry, User, CategoryType } from './types';
import { generateDailyLesson } from './services/geminiService';
import { storageService } from './services/storageService';
import { STAGES } from './constants';

// Helper to get category label in Spanish for loading messages
const getCategoryLabel = (category: CategoryType): string => {
  const labels: Record<CategoryType, string> = {
    'verbs': 'verbos',
    'adjectives': 'adjetivos',
    'nouns': 'sustantivos',
    'adverbs': 'adverbios'
  };
  return labels[category] || 'palabras';
};

const AppContent: React.FC = () => {
  const { user, dbUser, loading, logout } = useAuth();

  // Auth View State
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // App State
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('user');
  const [darkMode, setDarkMode] = useState(true);

  // Learning State
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [currentDayId, setCurrentDayId] = useState<number>(0);
  const [lessonData, setLessonData] = useState<WordEntry[]>([]);
  const [initialPlayerIndex, setInitialPlayerIndex] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('verbs');
  const [currentWordCount, setCurrentWordCount] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  // Initial Config Load
  useEffect(() => {
    const prefs = storageService.getPreferences();
    setDarkMode(prefs.darkMode);
  }, []);

  // Role Sync
  useEffect(() => {
    if (dbUser?.role === 'admin') {
      setViewMode('admin');
      setAppState(AppState.ADMIN_DASHBOARD);
    } else if (dbUser) {
      setViewMode('user');
      setAppState(AppState.DASHBOARD);
    }
  }, [dbUser?.role]); // Only re-run if role changes

  // --- HANDLERS ---

  const handleLogout = async () => {
    await logout();
    setAppState(AppState.AUTH); // Not strictly needed as user becomes null
  };

  const handleSelectDay = async (dayId: number, topic: string) => {
    const stageConfig = STAGES.find(s => s.id === dayId);
    const category = stageConfig?.category || 'verbs';
    const wordCount = stageConfig?.wordCount || 50;

    setCurrentTopic(topic);
    setCurrentDayId(dayId);
    setCurrentCategory(category);
    setCurrentWordCount(wordCount);
    setAppState(AppState.LOADING);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 100)); // UI Breath
      const savedIndex = storageService.getProgress(dayId);
      setInitialPlayerIndex(savedIndex);

      const data = await generateDailyLesson(dayId, topic);
      if (data.length === 0) throw new Error("Recibimos una lista vacía.");
      setLessonData(data);
      setAppState(AppState.PLAYER);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No pudimos cargar la lección. Por favor intenta de nuevo.");
      setAppState(AppState.ERROR);
    }
  };

  const handleStartPractice = (selectedWords: WordEntry[]) => {
    setLessonData(selectedWords);
    setCurrentTopic("Práctica Personalizada");
    setCurrentDayId(0);
    setInitialPlayerIndex(0);
    setAppState(AppState.PLAYER);
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Not Authenticated -> Show Auth Screens
  if (!user) {
    if (authView === 'register') return <RegisterScreen onSwitchToLogin={() => setAuthView('login')} />;
    if (authView === 'forgot') return <ForgotPasswordScreen onBack={() => setAuthView('login')} />;
    return <LoginScreen onSwitchToRegister={() => setAuthView('register')} onForgotPassword={() => setAuthView('forgot')} />;
  }

  // 2. Authenticated but Email NOT Verified -> Show Verify Screen
  if (!user.emailVerified) {
    return <VerifyEmailScreen />;
  }

  // 3. Authenticated & Verified & DB User Loaded (or waiting for it) -> Show App
  // If dbUser is still null (JIT pending), we might want to show loading or let it flow (dbUser might be null if JIT fails).
  // Let's assume layout handles null dbUser gracefully or we wait.
  if (!dbUser && !loading) {
    // Fallback if DB sync failed on a verified user
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error de Sincronización</h2>
          <p className="text-slate-500 mb-4">No pudimos conectar con tu perfil.</p>
          <p className="text-slate-400 text-sm mb-6">Revisa tu conexión a internet e intenta de nuevo.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Admin View
  if (viewMode === 'admin' && dbUser?.role === 'admin') {
    return (
      <AdminDashboard
        user={dbUser}
        onLogout={handleLogout}
        onSwitchToApp={() => { setViewMode('user'); setAppState(AppState.DASHBOARD); }}
      />
    );
  }

  // 5. User View
  const bgClass = darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 ${bgClass}`}>
      {appState === AppState.DASHBOARD && dbUser && (
        <Dashboard
          user={dbUser}
          darkMode={darkMode}
          onSelectDay={handleSelectDay}
          onLogout={handleLogout}
          onViewProgress={() => setAppState(AppState.PROGRESS)}
          onOpenSettings={() => setAppState(AppState.SETTINGS)}
          onOpenPractice={() => setAppState(AppState.PRACTICE_SELECTION)}
          onSwitchToAdmin={dbUser.role === 'admin' ? () => { setViewMode('admin'); setAppState(AppState.ADMIN_DASHBOARD); } : undefined}
        />
      )}

      {appState === AppState.PROGRESS && (
        <ProgressScreen darkMode={darkMode} onBack={() => setAppState(AppState.DASHBOARD)} />
      )}

      {appState === AppState.SETTINGS && dbUser && (
        <SettingsScreen
          user={dbUser}
          darkMode={darkMode}
          onBack={() => setAppState(AppState.DASHBOARD)}
          onUpdateUser={(u) => { /* Optimistic update handled in context usually, but here we can just wait for re-render */ }}
          onToggleDarkMode={(isDark) => {
            setDarkMode(isDark);
            const prefs = storageService.getPreferences();
            prefs.darkMode = isDark;
            storageService.savePreferences(prefs);
          }}
        />
      )}

      {appState === AppState.PRACTICE_SELECTION && (
        <PracticeSelectionScreen
          darkMode={darkMode}
          onBack={() => setAppState(AppState.DASHBOARD)}
          onStartPractice={handleStartPractice}
        />
      )}

      {appState === AppState.LOADING && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-50">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Creando tu clase de {getCategoryLabel(currentCategory)}...</h2>
        </div>
      )}

      {appState === AppState.PLAYER && (
        <Player
          words={lessonData}
          topic={currentTopic}
          dayId={currentDayId}
          initialIndex={initialPlayerIndex}
          darkMode={darkMode}
          category={currentCategory}
          onExit={() => { setAppState(AppState.DASHBOARD); setLessonData([]); }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Player } from './components/Player';
import { AuthScreen } from './components/AuthScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PracticeSelectionScreen } from './components/PracticeSelectionScreen';
import { AdminDashboard } from './components/admin/AdminDashboard'; // Import Admin Interface
import { AppState, WordEntry, User, CategoryType, DayTopic } from './types';
import { generateDailyLesson } from './services/geminiService';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // New State to toggle views for Admins ('admin' | 'user')
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('user');

  // New Dark Mode State
  const [darkMode, setDarkMode] = useState(true);

  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [currentDayId, setCurrentDayId] = useState<number>(0);
  const [lessonData, setLessonData] = useState<WordEntry[]>([]);
  const [initialPlayerIndex, setInitialPlayerIndex] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('verbs');
  const [currentWordCount, setCurrentWordCount] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  // Check for session and prefs on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      initializeViewMode(user);
    } else {
      setAppState(AppState.AUTH);
    }
    const prefs = storageService.getPreferences();
    setDarkMode(prefs.darkMode);
  }, []);

  // Set initial view based on role
  const initializeViewMode = (user: User) => {
    if (user.role === 'admin') {
      setViewMode('admin');
      setAppState(AppState.ADMIN_DASHBOARD);
    } else {
      setViewMode('user');
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    initializeViewMode(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAppState(AppState.AUTH);
    setLessonData([]);
    setCurrentDayId(0);
    setViewMode('user');
  };

  const handleSelectDay = async (dayId: number, topic: string) => {
    // Find the stage config to get category and wordCount
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
      await new Promise(r => setTimeout(r, 100));

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
    // Use 0 or -1 for dayId to indicate this is not a trackable daily lesson
    setCurrentDayId(0);
    setInitialPlayerIndex(0);
    setAppState(AppState.PLAYER);
  };

  const handleExitPlayer = () => {
    setAppState(AppState.DASHBOARD);
    setLessonData([]);
    setCurrentDayId(0);
  };

  const handleViewProgress = () => {
    setAppState(AppState.PROGRESS);
  };

  const handleOpenSettings = () => {
    setAppState(AppState.SETTINGS);
  };

  const handleOpenPractice = () => {
    setAppState(AppState.PRACTICE_SELECTION);
  };

  const handleRetry = () => {
    handleSelectDay(currentDayId, currentTopic);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleUpdateDarkMode = (isDark: boolean) => {
    setDarkMode(isDark);
    const prefs = storageService.getPreferences();
    prefs.darkMode = isDark;
    storageService.savePreferences(prefs);
  };

  // --- VIEW SWITCHING LOGIC ---
  const switchToAppView = () => {
    setViewMode('user');
    setAppState(AppState.DASHBOARD);
  };

  const switchToAdminView = () => {
    setViewMode('admin');
    setAppState(AppState.ADMIN_DASHBOARD);
  };

  // --- RENDER ---

  if (appState === AppState.AUTH) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // --- ADMIN INTERFACE RENDER ---
  // Only render AdminDashboard if user is admin AND viewMode is 'admin'
  if (currentUser?.role === 'admin' && viewMode === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={handleLogout}
        onSwitchToApp={switchToAppView}
      />
    );
  }

  // --- CONSUMER INTERFACE (User Layout) ---
  // Renders if user is standard OR if admin switched to 'user' mode

  // Define base classes based on Dark Mode
  const bgClass = darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 ${bgClass}`}>
      {appState === AppState.DASHBOARD && currentUser && (
        <Dashboard
          user={currentUser}
          darkMode={darkMode}
          onSelectDay={handleSelectDay}
          onLogout={handleLogout}
          onViewProgress={handleViewProgress}
          onOpenSettings={handleOpenSettings}
          onOpenPractice={handleOpenPractice}
          onSwitchToAdmin={currentUser.role === 'admin' ? switchToAdminView : undefined}
        />
      )}

      {appState === AppState.PROGRESS && (
        <ProgressScreen darkMode={darkMode} onBack={() => setAppState(AppState.DASHBOARD)} />
      )}

      {appState === AppState.SETTINGS && currentUser && (
        <SettingsScreen
          user={currentUser}
          darkMode={darkMode}
          onBack={() => setAppState(AppState.DASHBOARD)}
          onUpdateUser={handleUpdateUser}
          onToggleDarkMode={handleUpdateDarkMode}
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
          <p className="text-slate-400 text-sm max-w-xs animate-pulse">
            Generando {currentWordCount} {getCategoryLabel(currentCategory)}, frases y asociaciones. <br />
            Esto solo ocurrirá una vez. Las próximas visitas serán instantáneas.
          </p>
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
          onExit={handleExitPlayer}
        />
      )}

      {appState === AppState.ERROR && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-50">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ops, hubo un problema</h2>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            {error}
          </p>
          <div className="flex gap-4">
            <button onClick={() => setAppState(AppState.DASHBOARD)} className="px-6 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition">
              Volver
            </button>
            <button onClick={handleRetry} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition">
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

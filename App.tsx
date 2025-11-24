import React, { Component, useState, useEffect, type ReactNode, type ErrorInfo } from 'react';
import { OnboardingData, AchievementID, MicroCourse } from './types';
import { OnboardingScreen } from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-4 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">اوپس! مشکلی پیش آمد.</h1>
            <p className="mb-4">متاسفانه برنامه با خطا مواجه شد.</p>
            <button onClick={() => window.location.reload()} className="bg-white text-red-900 px-4 py-2 rounded font-bold">
              تلاش مجدد
            </button>
            <pre className="mt-4 text-xs opacity-50 text-left bg-black/30 p-2 rounded overflow-auto max-w-sm">
                {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DEFAULT_COURSES: MicroCourse[] = [
    {
        id: 'course-physics',
        title: 'فیزیک کوانتوم',
        goal: 'درک جهان هستی، از حرکت تا کوانتوم',
        days: Array.from({length: 10}, (_, i) => ({
            day: i+1,
            focus: 'مکانیک و انرژی',
            lesson: `درس ${i+1}: قوانین نیوتن و حرکت`,
            challenge: 'یک آزمایش ساده طراحی کنید.',
            reflection: 'چگونه فیزیک در زندگی روزمره دیده می‌شود؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        chatHistory: [],
        quizzes: []
    },
    {
        id: 'course-chemistry',
        title: 'شیمی آلی',
        goal: 'کشف اسرار ماده و واکنش‌ها',
        days: Array.from({length: 10}, (_, i) => ({
            day: i+1,
            focus: 'ساختار اتم',
            lesson: `درس ${i+1}: جدول تناوبی و پیوندها`,
            challenge: 'یک واکنش شیمیایی در خانه پیدا کنید.',
            reflection: 'جهان بدون شیمی چگونه بود؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        chatHistory: [],
        quizzes: []
    },
    {
        id: 'course-biology',
        title: 'زیست‌شناسی (تجربی)',
        goal: 'سفر به درون سلول و حیات',
        days: Array.from({length: 10}, (_, i) => ({
            day: i+1,
            focus: 'سلول و DNA',
            lesson: `درس ${i+1}: شگفتی‌های بدن انسان`,
            challenge: 'ضربان قلب خود را در حالات مختلف اندازه بگیرید.',
            reflection: 'حیات چیست؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        chatHistory: [],
        quizzes: []
    },
    {
        id: 'course-english',
        title: 'زبان انگلیسی (پیشرفته)',
        goal: 'مکالمه روان و گرامر کاربردی',
        days: Array.from({length: 14}, (_, i) => ({
            day: i+1,
            focus: 'Fluency',
            lesson: 'Daily Conversation & Idioms',
            challenge: 'Speak for 2 minutes about your day.',
            reflection: 'How confident do you feel?',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        chatHistory: [],
        quizzes: []
    },
    {
        id: 'course-french',
        title: 'زبان فرانسه (مقدماتی)',
        goal: 'یادگیری زبان عشق و هنر',
        days: Array.from({length: 14}, (_, i) => ({
            day: i+1,
            focus: 'Les Bases',
            lesson: 'Salutations et Présentations',
            challenge: 'Présentez-vous en français.',
            reflection: 'Qu\'est-ce qui est difficile?',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        chatHistory: [],
        quizzes: []
    },
    {
        id: 'course-persian-lit',
        title: 'ادبیات فارسی',
        goal: 'سفر در دنیای شعر و حکمت پارسی',
        days: Array.from({length: 7}, (_, i) => ({
            day: i+1,
            focus: 'مقدمات',
            lesson: 'درس اول: آشنایی با سعدی و گلستان',
            challenge: 'یک حکایت کوتاه بخوانید.',
            reflection: 'چه پندی گرفتید؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        chatHistory: [],
        quizzes: []
    }
];

const MainApp: React.FC = () => {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementID[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('benvis_user_data');
    if (stored) {
      try {
        const parsed: OnboardingData = JSON.parse(stored);
        
        // --- Data Migration: Ensure all new fields exist ---
        
        if (!parsed.achievements) parsed.achievements = [];
        if (!parsed.books) parsed.books = [];
        if (!parsed.shopInventory) parsed.shopInventory = [];
        if (!parsed.microCourses) parsed.microCourses = [];
        if (!parsed.socialCircles) parsed.socialCircles = [];
        if (!parsed.transactions) parsed.transactions = [];
        if (!parsed.budgets) parsed.budgets = [];
        if (!parsed.financialAccounts) parsed.financialAccounts = [];
        
        if (!parsed.transactionCategories) {
            parsed.transactionCategories = [
                { id: 'cat-food', name: 'غذا و خوراک', type: 'expense' },
                { id: 'cat-transport', name: 'حمل و نقل', type: 'expense' },
                { id: 'cat-bills', name: 'قبوض', type: 'expense' },
                { id: 'cat-shopping', name: 'خرید', type: 'expense' },
                { id: 'cat-entertainment', name: 'تفریح', type: 'expense' },
                { id: 'cat-health', name: 'سلامت', type: 'expense' },
                { id: 'cat-salary', name: 'حقوق', type: 'income' },
                { id: 'cat-freelance', name: 'فریلنس', type: 'income' },
                { id: 'cat-investment', name: 'سرمایه‌گذاری', type: 'income' },
            ];
        }
        
        if (!parsed.incomeAnalysis) parsed.incomeAnalysis = undefined;
        if (!parsed.calendarEvents) parsed.calendarEvents = [];
        
        // Ensure theme structure is correct - Set default to oceanic_deep
        if (!parsed.theme) parsed.theme = { name: 'oceanic_deep', animations: { enabled: true } };
        if (!parsed.theme.animations) parsed.theme.animations = { enabled: true };
        
        // Ensure audio settings exist
        if (!parsed.audioSettings) {
            parsed.audioSettings = {
                voice: 'Kore',
                speed: 'normal',
                volume: 1,
                soundEffects: true,
                bookSounds: { pageTurn: true, ambientMusic: false, sfx: true }
            };
        }

        // Add default courses if none exist or migrate old ones
        if (!parsed.microCourses || parsed.microCourses.length === 0) {
            parsed.microCourses = DEFAULT_COURSES;
        } else {
            // Ensure existing courses have new fields
            parsed.microCourses = parsed.microCourses.map(c => ({
                ...c,
                chatHistory: c.chatHistory || [],
                quizzes: c.quizzes || [],
                pdfSource: c.pdfSource || undefined
            }));
            
            // Check if new default courses are missing and add them
            const existingIds = new Set(parsed.microCourses.map(c => c.id));
            const missingDefaults = DEFAULT_COURSES.filter(dc => !existingIds.has(dc.id));
            if (missingDefaults.length > 0) {
                parsed.microCourses = [...parsed.microCourses, ...missingDefaults];
            }
        }

        setUserData(parsed);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setLoading(false);
  }, []);

  const updateUserData = (newData: OnboardingData) => {
    // Level Up Logic
    const currentLevel = newData.level || 1;
    const nextLevelXp = currentLevel * 100;
    
    if (newData.xp >= nextLevelXp) {
      const newLevel = currentLevel + 1;
      newData.level = newLevel;
      setLevelUpInfo({ newLevel });
      
      // Play sound if allowed
      if (newData.audioSettings?.soundEffects !== false) {
          const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
          audio.play().catch(() => {});
      }
    }

    setUserData(newData);
    localStorage.setItem('benvis_user_data', JSON.stringify(newData));
  };

  const addXp = (amount: number) => {
    if (!userData) return;
    updateUserData({ ...userData, xp: (userData.xp || 0) + amount });
  };

  // Determine background color based on settings
  const getThemeColor = () => {
      if (!userData) return '#0c4a6e'; // Default deep blue (oceanic)
      if (userData.theme.name === 'custom' && userData.theme.customColor) {
          return userData.theme.customColor;
      }
      
      // Preset Theme Colors Mapping
      switch(userData.theme.name) {
          case 'benvis_classic': return '#240046'; // Deep Violet
          case 'oceanic_deep': return '#0c4a6e'; // Deep Blue
          case 'forest_whisper': return '#064e3b'; // Deep Emerald
          case 'sunset_bliss': return '#881337'; // Deep Rose
          case 'crimson_night': return '#450a0a'; // Deep Red
          case 'royal_gold': return '#422006'; // Deep Amber
          default: return '#0c4a6e';
      }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">در حال بارگذاری...</div>;

  if (!userData) {
    return <OnboardingScreen onComplete={(data) => {
        // Add default courses on fresh start
      data.microCourses = DEFAULT_COURSES;
      setUserData(data);
      localStorage.setItem('benvis_user_data', JSON.stringify(data));
    }} />;
  }

  const themeColor = getThemeColor();

  return (
    <div className="min-h-screen bg-[#000000] text-white font-[Vazirmatn] relative overflow-hidden selection:bg-violet-500/30">
      {/* Global Styles for Themes & Animations */}
      <style>{`
        :root {
          --bg-color: #000000;
          --theme-glow: ${themeColor}; 
        }
        
        body {
            background-color: #000000;
            overscroll-behavior: none;
        }
      `}</style>

      {/* 
         DYNAMIC BREATHING BACKGROUND 
         The main color pulse in the center/top
      */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Main "Breath" Pulse */}
          <div 
            className="absolute top-[-30%] left-0 right-0 h-[90vh] rounded-full opacity-40 blur-[120px] animate-breathe"
            style={{ background: `radial-gradient(circle, var(--theme-glow) 0%, transparent 70%)` }}
          ></div>
          
          {/* Secondary weaker pulse for depth */}
          <div 
             className="absolute bottom-[-40%] left-[10%] right-[10%] h-[60vh] rounded-full opacity-20 blur-[100px] animate-breathe"
             style={{ 
                 background: `radial-gradient(circle, var(--theme-glow) 0%, transparent 70%)`,
                 animationDelay: '4s', 
                 animationDirection: 'reverse'
             }}
          ></div>
      </div>
      
      <div data-theme={userData.theme.name} className="relative z-10">
        <DashboardScreen 
          userData={userData} 
          onUpdateUserData={updateUserData}
          addXp={addXp}
          levelUpInfo={levelUpInfo}
          onLevelUpSeen={() => setLevelUpInfo(null)}
          newAchievements={newAchievements}
          onAchievementsSeen={() => setNewAchievements([])}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
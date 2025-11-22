
import React, { useState, useEffect, type ReactNode, type ErrorInfo } from 'react';
import { OnboardingData, AchievementID, AudioSettings } from './types';
import { OnboardingScreen } from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import { saveBookData } from './storage';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

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
        // Migration for new fields
        if (!parsed.achievements) parsed.achievements = [];
        if (!parsed.books) parsed.books = [];
        if (!parsed.shopInventory) parsed.shopInventory = [];
        if (!parsed.microCourses) parsed.microCourses = [];
        if (!parsed.socialCircles) parsed.socialCircles = [];
        if (!parsed.transactions) parsed.transactions = [];
        if (!parsed.budgets) parsed.budgets = [];
        if (!parsed.financialAccounts) parsed.financialAccounts = [];
        if (!parsed.transactionCategories) parsed.transactionCategories = [
            { id: 'cat-food', name: 'غذا و خوراک', type: 'expense' },
            { id: 'cat-transport', name: 'حمل و نقل', type: 'expense' },
            { id: 'cat-shopping', name: 'خرید', type: 'expense' },
            { id: 'cat-entertainment', name: 'تفریح', type: 'expense' },
            { id: 'cat-bills', name: 'قبوض', type: 'expense' },
            { id: 'cat-health', name: 'سلامت', type: 'expense' },
            { id: 'cat-salary', name: 'حقوق', type: 'income' },
            { id: 'cat-freelance', name: 'پروژه', type: 'income' },
        ];
        if (!parsed.audioSettings) {
            parsed.audioSettings = {
                voice: 'Kore',
                speed: 'normal',
                volume: 1,
                soundEffects: true,
                bookSounds: {
                    pageTurn: true,
                    ambientMusic: false,
                    sfx: true
                }
            };
        }
        
        setUserData(parsed);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setLoading(false);
  }, []);

  const handleUpdateUserData = (newData: OnboardingData) => {
    // Check for Level Up
    const oldLevel = userData?.level || 1;
    const newLevel = Math.floor(newData.xp / 100) + 1;
    
    if (newLevel > oldLevel) {
        setLevelUpInfo({ newLevel });
        newData.level = newLevel;
    }

    // Sync Book Data to IndexedDB if needed (for large content)
    newData.books.forEach(book => {
        if (book.contentSource && book.contentSource.length > 50000) {
             // Offload to IndexedDB
             saveBookData(book.id, { contentSource: book.contentSource, pdfSource: book.pdfSource });
             // Clear from local storage copy to save space
             book.contentSource = undefined; 
             book.pdfSource = undefined; 
             book.hasExternalContent = true;
        }
    });

    setUserData(newData);
    localStorage.setItem('benvis_user_data', JSON.stringify(newData));
  };

  const addXp = (amount: number) => {
      if (userData) {
          handleUpdateUserData({ ...userData, xp: (userData.xp || 0) + amount });
      }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">در حال بارگذاری...</div>;

  if (!userData) {
    return (
        <OnboardingScreen onComplete={(data) => {
            const initialData: OnboardingData = {
                ...data,
                // Ensure audioSettings are present on fresh install
                audioSettings: {
                    voice: 'Kore',
                    speed: 'normal',
                    volume: 1,
                    soundEffects: true,
                    bookSounds: { pageTurn: true, ambientMusic: false, sfx: true }
                },
                transactionCategories: [
                    { id: 'cat-food', name: 'غذا و خوراک', type: 'expense' },
                    { id: 'cat-transport', name: 'حمل و نقل', type: 'expense' },
                    { id: 'cat-shopping', name: 'خرید', type: 'expense' },
                    { id: 'cat-salary', name: 'حقوق', type: 'income' },
                ],
                financialAccounts: [
                    { id: 'acc-cash', name: 'پول نقد', type: 'cash', balance: 0 },
                    { id: 'acc-card', name: 'کارت بانکی', type: 'card', balance: 0 }
                ]
            };
            setUserData(initialData);
            localStorage.setItem('benvis_user_data', JSON.stringify(initialData));
        }} />
    );
  }

  return (
    <ErrorBoundary>
        <DashboardScreen 
            userData={userData} 
            onUpdateUserData={handleUpdateUserData} 
            addXp={addXp}
            levelUpInfo={levelUpInfo}
            onLevelUpSeen={() => setLevelUpInfo(null)}
            newAchievements={newAchievements}
            onAchievementsSeen={() => setNewAchievements([])}
        />
    </ErrorBoundary>
  );
};

export default MainApp;

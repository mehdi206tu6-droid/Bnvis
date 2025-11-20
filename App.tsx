
import React, { useState, useEffect, Component, type ReactNode } from 'react';
import { OnboardingData, AchievementID, Book } from './types';
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

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    if(window.confirm("آیا مطمئن هستید؟ تمام اطلاعات شما پاک خواهد شد.")) {
        localStorage.clear();
        window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-red-400 p-4 text-center" dir="rtl">
           <h1 className="text-xl font-bold mb-2">اوه! مشکلی پیش آمد.</h1>
           <p className="mb-6 text-sm text-slate-400 max-w-md">
             متاسفانه برنامه با خطا مواجه شد.
             <br/>
             <span className="text-xs opacity-70 mt-2 block ltr text-left bg-black/20 p-2 rounded overflow-auto max-h-24">{this.state.error?.message}</span>
           </p>
           <div className="flex gap-4">
             <button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors">
               تلاش مجدد
             </button>
             <button onClick={this.handleReset} className="bg-red-900/50 border border-red-800 hover:bg-red-900 text-white px-6 py-2 rounded-lg transition-colors">
               پاک‌سازی داده‌ها و شروع دوباره
             </button>
           </div>
        </div>
      );
    }

    return this.props.children || null;
  }
}

const PRESET_BOOKS: Book[] = [
    {
        id: 'book-atomic',
        title: 'عادت‌های اتمی',
        author: 'جیمز کلیر',
        totalChapters: 20,
        currentChapter: 4,
        summary: 'روشی آسان و اثبات‌شده برای ایجاد عادت‌های خوب و شکستن عادت‌های بد. تغییرات کوچک، نتایج بزرگ.',
        aiPersona: 'You are the book Atomic Habits. Teach the user about the 1% rule and habit stacking.',
        status: 'reading',
        coverColor: '#f59e0b', // Amber
        genre: 'توسعه فردی',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-write-happen',
        title: 'بنویس تا اتفاق بیفتد',
        author: 'هنریت کلاوسر',
        totalChapters: 15,
        currentChapter: 2,
        summary: 'چگونه با مکتوب کردن آرزوها و اهداف، اولین قدم را برای دستیابی به آن‌ها برداریم.',
        aiPersona: 'You are the book Write It Down, Make It Happen. Encourage the user to write their goals clearly.',
        status: 'reading',
        coverColor: '#8b5cf6', // Violet
        genre: 'موفقیت',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-deep-work',
        title: 'کار عمیق',
        author: 'کال نیوپورت',
        totalChapters: 12,
        currentChapter: 0,
        summary: 'قوانینی برای موفقیت متمرکز در دنیای حواس‌پرتی. چگونه در زمان کمتر، کار بیشتری انجام دهیم.',
        aiPersona: 'You are the book Deep Work. Advocate for focus blocks and eliminating distractions.',
        status: 'wishlist',
        coverColor: '#eab308', // Yellow
        genre: 'بهره‌وری',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-tiny-habits',
        title: 'خرده‌عادت‌ها',
        author: 'بی‌جی‌ فاگ',
        totalChapters: 18,
        currentChapter: 0,
        summary: 'قدرت تغییرات کوچک که همه چیز را تغییر می‌دهد. تمرکز بر رفتارهای کوچک و جشن گرفتن پیروزی‌ها.',
        aiPersona: 'You are the book Tiny Habits. Teach the ABC of habits: Anchor, Behavior, Celebration.',
        status: 'wishlist',
        coverColor: '#10b981', // Emerald
        genre: 'روانشناسی',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-bullet-journal',
        title: 'بولت ژورنال',
        author: 'رایدر کارول',
        totalChapters: 10,
        currentChapter: 0,
        summary: 'روش بولت ژورنال: پیگیری گذشته، ساماندهی حال، طراحی آینده.',
        aiPersona: 'You are the Bullet Journal Method. Help the user organize their chaotic mind using lists and logs.',
        status: 'wishlist',
        coverColor: '#3b82f6', // Blue
        genre: 'برنامه‌ریزی',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-compound-effect',
        title: 'اثر مرکب',
        author: 'دارن هاردی',
        totalChapters: 6,
        currentChapter: 0,
        summary: 'آغاز جهشی در زندگی، موفقیت و درآمد. راز موفقیت در ثبات قدم و انتخاب‌های کوچک است.',
        aiPersona: 'You are The Compound Effect. Remind the user that small, consistent actions yield huge results over time.',
        status: 'wishlist',
        coverColor: '#ef4444', // Red
        genre: 'موفقیت',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-essentialism',
        title: 'اصل‌گرایی',
        author: 'گرگ مک‌کیون',
        totalChapters: 14,
        currentChapter: 0,
        summary: 'چگونه انجام کارهای کمتر اما بهتر را یاد بگیریم. هنرِ مقدسِ "نه" گفتن.',
        aiPersona: 'You are Essentialism. Teach the disciplined pursuit of less.',
        status: 'wishlist',
        coverColor: '#6366f1', // Indigo
        genre: 'مدیریت زمان',
        lastReadDate: new Date().toISOString()
    },
    {
        id: 'book-5am-club',
        title: 'باشگاه پنج صبحی‌ها',
        author: 'رابین شارما',
        totalChapters: 17,
        currentChapter: 0,
        summary: 'سحرخیز باشید تا رستگار شوید. فرمول ۲۰/۲۰/۲۰ برای شروع یک روز طوفانی.',
        aiPersona: 'You are The 5 AM Club. Motivate the user to own their morning and elevate their life.',
        status: 'wishlist',
        coverColor: '#f97316', // Orange
        genre: 'توسعه فردی',
        lastReadDate: new Date().toISOString()
    }
];

const App: React.FC = () => {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementID[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const storedData = localStorage.getItem('benvis_user_data');
      let userDataFromStorage: any = null;
      
      try {
          if (storedData && storedData !== "undefined" && storedData !== "null") {
             userDataFromStorage = JSON.parse(storedData);
          }
      } catch (e) {
          console.error("Corrupt local storage data found. Resetting...", e);
          userDataFromStorage = null;
      }

      if (userDataFromStorage && typeof userDataFromStorage === 'object' && !Array.isArray(userDataFromStorage)) {
        
        // 0. Critical Field Check
        if (!userDataFromStorage.fullName || typeof userDataFromStorage.fullName !== 'string') {
            console.warn("Invalid user data structure. Resetting.");
            userDataFromStorage = null;
        } else {
            // 1. Sanitize Arrays
            const arrayFields = ['goals', 'tasks', 'timeBlocks', 'shopInventory', 'socialCircles', 'microCourses', 'calendarEvents', 'transactions', 'budgets', 'financialAccounts', 'transactionCategories', 'habits', 'achievements'];
            arrayFields.forEach(field => {
                if (!userDataFromStorage[field] || !Array.isArray(userDataFromStorage[field])) {
                    userDataFromStorage[field] = [];
                }
            });

            // 1.5 Inject Preset Books if empty
            if (!userDataFromStorage.books || !Array.isArray(userDataFromStorage.books) || userDataFromStorage.books.length === 0) {
                userDataFromStorage.books = PRESET_BOOKS;
            }

            // 2. Goal Sanitation
            userDataFromStorage.goals = userDataFromStorage.goals.filter((g: any) => g && typeof g === 'object');
            userDataFromStorage.goals.forEach((goal: any) => {
                if (!goal.id) goal.id = `goal-${Math.random().toString(36).substr(2, 9)}`;
                if (!goal.progressHistory || !Array.isArray(goal.progressHistory)) goal.progressHistory = [];
                // Ensure numerical values are numbers
                goal.progress = typeof goal.progress === 'number' ? goal.progress : 0;
            });
            
            // 3. Defaults & Number Sanitation
            userDataFromStorage.xp = typeof userDataFromStorage.xp === 'number' && !isNaN(userDataFromStorage.xp) ? userDataFromStorage.xp : 0;
            userDataFromStorage.level = typeof userDataFromStorage.level === 'number' && !isNaN(userDataFromStorage.level) ? userDataFromStorage.level : 1;

            // 3.5 Deep Sanitize Notifications
            const defaultNotifications = {
                tasks: { enabled: true, timing: '1h', sound: 'default' },
                reminders: { enabled: true, timing: '1d', sound: 'default' },
                daily_report: { enabled: false, time: '09:00', sound: 'default' },
                budget_alerts: { enabled: true, timing: '1h', sound: 'default' },
                low_balance_warnings: { enabled: true, timing: '1h', sound: 'default' },
            };

            if (!userDataFromStorage.notifications || typeof userDataFromStorage.notifications !== 'object') {
                userDataFromStorage.notifications = defaultNotifications;
            } else {
                // Ensure all sub-objects exist by merging with defaults
                userDataFromStorage.notifications = {
                    ...defaultNotifications,
                    ...userDataFromStorage.notifications,
                    tasks: { ...defaultNotifications.tasks, ...(userDataFromStorage.notifications.tasks || {}) },
                    reminders: { ...defaultNotifications.reminders, ...(userDataFromStorage.notifications.reminders || {}) },
                    daily_report: { ...defaultNotifications.daily_report, ...(userDataFromStorage.notifications.daily_report || {}) },
                    budget_alerts: { ...defaultNotifications.budget_alerts, ...(userDataFromStorage.notifications.budget_alerts || {}) },
                    low_balance_warnings: { ...defaultNotifications.low_balance_warnings, ...(userDataFromStorage.notifications.low_balance_warnings || {}) },
                };
            }
            
            // 4. Theme
            if (!userDataFromStorage.theme || typeof userDataFromStorage.theme !== 'object') {
                userDataFromStorage.theme = { name: 'benvis_classic' };
            }
            if (!userDataFromStorage.theme.name) {
                userDataFromStorage.theme.name = 'benvis_classic';
            }
        }
      } else {
          // If data is invalid type, treat as new user
          userDataFromStorage = null;
      }
      
      setUserData(userDataFromStorage);
    } catch (error: any) {
      console.error("Critical App Error:", error);
      // Reset state to allow recovery
      setUserData(null);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userData) return;
    const themeName = userData.theme?.name || 'benvis_classic';
    document.documentElement.setAttribute('data-theme-name', themeName);
    
    if (themeName === 'custom' && userData.theme?.customColor) {
        document.documentElement.style.setProperty('--color-primary-500', userData.theme.customColor);
    } else {
        document.documentElement.style.removeProperty('--color-primary-500');
    }

    if (userData.theme?.animations?.enabled === false) {
        document.body.classList.add('animations-disabled');
    } else {
        document.body.classList.remove('animations-disabled');
    }
  }, [userData?.theme]);
  
  const handleUpdateUserData = (data: OnboardingData) => {
    try {
        // Ensure books are preserved or initialized if somehow lost in update
        if (!data.books || data.books.length === 0) {
            data.books = PRESET_BOOKS;
        }
        localStorage.setItem('benvis_user_data', JSON.stringify(data));
        setUserData(data);
    } catch (e) {
        console.error("Failed to save data", e);
        alert("خطا در ذخیره‌سازی اطلاعات.");
    }
  };

  const addXp = (amount: number) => {
    if (!userData) return;
    const newXp = (userData.xp || 0) + amount;
    const currentLevel = userData.level || 1;
    
    const updatedData = { ...userData, xp: newXp };
    
    const nextLevelXp = currentLevel * 100;
    if (newXp >= nextLevelXp) {
         setLevelUpInfo({ newLevel: currentLevel + 1 });
         const updatedLevelData = { ...updatedData, level: currentLevel + 1 };
         handleUpdateUserData(updatedLevelData);
    } else {
         handleUpdateUserData(updatedData);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#020617] text-white">در حال بارگذاری...</div>;
  
  if (error) return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-red-400 p-4 text-center">
          <p className="mb-4 font-bold text-lg">خطایی در بارگذاری برنامه رخ داد.</p>
          <p className="mb-6 text-sm text-slate-400 max-w-md">{error}</p>
          <div className="flex gap-4">
            <button onClick={() => window.location.reload()} className="bg-slate-700 px-6 py-2 rounded-lg text-white hover:bg-slate-600">تلاش مجدد</button>
             <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-900/50 border border-red-800 px-6 py-2 rounded-lg text-white hover:bg-red-900">ریست کامل</button>
          </div>
      </div>
  );

  return (
    <ErrorBoundary>
        {userData ? (
            <DashboardScreen 
                userData={userData} 
                onUpdateUserData={handleUpdateUserData} 
                addXp={addXp}
                levelUpInfo={levelUpInfo}
                onLevelUpSeen={() => setLevelUpInfo(null)}
                newAchievements={newAchievements}
                onAchievementsSeen={() => setNewAchievements([])}
            />
        ) : (
            <OnboardingScreen onComplete={(data) => handleUpdateUserData(data)} />
        )}
    </ErrorBoundary>
  );
};

export default App;

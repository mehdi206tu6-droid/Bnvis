
import React, { useState, useEffect } from 'react';
import { OnboardingData, AchievementID, UserGoal, CalendarEvent, Transaction, StandaloneTask } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    TargetIcon, MoonIcon, CalendarIcon, FinanceIcon, 
    SparklesIcon, CogIcon, TrophyIcon,
    Squares2X2Icon, ChartPieIcon, UserCircleIcon,
    AcademicCapIcon, MicrophoneIcon,
    BookOpenIcon,
    QueueListIcon,
    HealthIcon,
    ShoppingBagIcon,
    HeartIcon,
    UserIcon,
    SunIcon,
    SnakeIcon,
    CloudIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    HabitsIcon,
    BoltIcon,
    EyeIcon,
    CheckCircleIcon,
    PencilIcon
} from './icons';

// Import Views
import GoalsView from './GoalsView';
import QuietZoneView from './QuietZoneView';
import CalendarView from './CalendarView';
import { FinancialView } from './FinancialView';
import SmartAssistantView from './SmartAssistantView';
import SettingsView from './SettingsView';
import WomenHealthView from './WomenHealthView';
import SocialCirclesView from './SocialCirclesView';
import MicroCourseView from './MicroCourseView';
import XpShopView from './XpShopView';
import WeeklyReviewView from './WeeklyReviewView';
import { NightRoutineView } from './NightRoutineView';
import EisenhowerMatrixView from './EisenhowerMatrixView';
import TimeBlockingView from './TimeBlockingView';
import LifeWheelView from './LifeWheelView';
import BooksView from './BooksView';
import HealthWellnessView from './HealthWellnessView';
import HabitTrackerView from './HabitTrackerView';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface DashboardScreenProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose?: () => void;
    addXp: (amount: number) => void;
    levelUpInfo: { newLevel: number } | null;
    onLevelUpSeen: () => void;
    newAchievements: AchievementID[];
    onAchievementsSeen: () => void;
}

type ViewState = 
    'dashboard' | 'goals' | 'focus' | 'calendar' | 'finance' | 
    'assistant' | 'settings' | 'womenHealth' | 'social' | 
    'shop' | 'microCourse' | 'review' | 'nightRoutine' | 
    'eisenhower' | 'timeBlocking' | 'lifeWheel' | 'books' | 'healthWellness' | 'habits';

// Examples for the typewriter effect
const EXAMPLES = [
    "جلسه فردا ساعت ۱۰",
    "خرید شیر و نان",
    "هدف جدید ورزش",
    "هزینه ۵۰ تومن اسنپ",
    "حالم خوب نیست"
];

const ReadingWidget: React.FC<{ userData: OnboardingData, onClick: () => void }> = ({ userData, onClick }) => {
    const readingBooks = (userData.books || []).filter(b => b.status === 'reading');
    
    // Carousel Logic
    const [index, setIndex] = useState(0);
    
    // Reset index if readingBooks changes length or becomes empty
    useEffect(() => {
        if (index >= readingBooks.length && readingBooks.length > 0) {
            setIndex(0);
        }
    }, [readingBooks.length]);

    if (readingBooks.length === 0) {
        return <GridItem icon={BookOpenIcon} label="کتاب‌باز" color="text-yellow-400" glow="shadow-yellow-500/50" onClick={onClick} />;
    }

    const book = readingBooks[index];
    
    const nextBook = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((i) => (i + 1) % readingBooks.length);
    }

    const prevBook = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((i) => (i - 1 + readingBooks.length) % readingBooks.length);
    }

    return (
        <div onClick={onClick} className="relative col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-[1.8rem] p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/60 transition-all group overflow-hidden shadow-lg">
             {/* Cover */}
             <div className={`w-16 h-24 rounded-lg bg-gradient-to-br ${book?.coverColor || 'from-slate-700 to-slate-900'} flex-shrink-0 flex items-center justify-center shadow-md border border-white/5 relative overflow-hidden`}>
                {book?.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 mix-blend-overlay"></div>
                        <span className="text-2xl z-10 filter drop-shadow-lg">{book?.uiHint?.icon || '📘'}</span>
                    </>
                )}
             </div>
             
             {/* Info */}
             <div className="flex-grow min-w-0 py-1">
                 <h4 className="font-bold text-white truncate text-sm mb-0.5">{book?.title}</h4>
                 <p className="text-xs text-slate-400 truncate mb-3">{book?.author}</p>
                 
                 {/* Progress */}
                 <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden mb-1">
                     <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${book?.totalPages ? ((book.currentPage||0)/book.totalPages)*100 : 0}%` }}></div>
                 </div>
                 <p className="text-[10px] text-slate-500 text-right font-mono">{book?.currentPage} / {book?.totalPages}</p>
             </div>

             {readingBooks.length > 1 && (
                 <div className="flex flex-col justify-center gap-1 absolute right-2 top-0 bottom-0">
                     <button onClick={prevBook} className="p-1 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-colors z-10">
                         <ChevronRightIcon className="w-3 h-3 -rotate-90"/>
                     </button>
                     <button onClick={nextBook} className="p-1 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-colors z-10">
                         <ChevronLeftIcon className="w-3 h-3 -rotate-90"/>
                     </button>
                 </div>
             )}
        </div>
    )
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    userData, onUpdateUserData, addXp, levelUpInfo, onLevelUpSeen, newAchievements, onAchievementsSeen 
}) => {
    const [activeView, setActiveView] = useState<ViewState>('dashboard');
    const [commandInput, setCommandInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
    
    // Typewriter Effect State
    const [typewriterText, setTypewriterText] = useState('');
    const [exampleIndex, setExampleIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentExample = EXAMPLES[exampleIndex];
        let typingSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentExample.length) {
            // Finished typing, pause before deleting
            typingSpeed = 2000; 
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting, move to next example
            setIsDeleting(false);
            setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
            return;
        }

        const timeout = setTimeout(() => {
            if (!isDeleting && charIndex === currentExample.length) {
                setIsDeleting(true);
            } else if (isDeleting) {
                setCharIndex((prev) => prev - 1);
            } else {
                setCharIndex((prev) => prev + 1);
            }
        }, typingSpeed);

        setTypewriterText(currentExample.substring(0, charIndex));

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, exampleIndex]);

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("مرورگر شما از قابلیت تبدیل گفتار به نوشتار پشتیبانی نمی‌کند.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'fa-IR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCommandInput(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.start();
    };

    const handleCommandSubmit = async () => {
        if (!commandInput.trim()) return;
        setIsProcessing(true);
        setSuccessFeedback(null);
        
        // Improved Fallback Parser
        const fallbackParse = (text: string) => {
            const lower = text.toLowerCase();
            
            // Calendar Keywords - High Priority
            if (
                lower.includes('جلسه') || lower.includes('قرار') || lower.includes('رویداد') || 
                lower.includes('فردا') || lower.includes('امروز') || lower.includes('یادآوری') || 
                lower.includes('یادم') || lower.includes('تقویم') || lower.includes('ساعت') ||
                lower.includes('دکتر') || lower.includes('تولد')
            ) {
                 return { intent: 'add_event', data: { title: text } };
            }
            
            // Goals
            if (lower.includes('هدف') || lower.includes('goal')) return { intent: 'create_goal', data: { title: text.replace(/هدف/g, '').trim() } };
            
            // Transactions
            if (lower.includes('بخر') || lower.includes('خرید') || lower.includes('هزینه') || lower.includes('تومان') || lower.includes('خرج')) return { intent: 'add_transaction', data: { title: text, amount: 0, type: 'expense' } };
            
            // Chat
            if (lower.includes('چت') || lower.includes('سوال') || lower.includes('کمک') || lower.includes('دستیار')) return { intent: 'chat', data: {} };
            
            // Default Task
            return { intent: 'add_task', data: { title: text } };
        };

        let result;
        
        try {
            const prompt = `
                Parse Persian input: "${commandInput}" to JSON.
                Intents: "create_goal", "add_task", "add_transaction", "add_event", "chat".
                Rules: 
                - "یادآوری", "جلسه", "قرار", "یادم بنداز", "فردا", "امروز", "ساعت" -> add_event.
                - "هدف" -> create_goal.
                - "خرید", "تومان" -> add_transaction.
                
                JSON Schema: { "intent": string, "data": { "title": string, "amount"?: number, "type"?: "income"|"expense", "date"?: "YYYY-MM-DD", "time"?: "HH:mm" } }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            result = JSON.parse(response.text.trim());
        } catch (error) {
            console.warn("AI parsing failed, using fallback", error);
            result = fallbackParse(commandInput);
        }

        try {
            switch(result.intent) {
                case 'create_goal': {
                    const newGoal: UserGoal = {
                        id: `goal-${Date.now()}`,
                        title: result.data.title || commandInput,
                        type: 'simple',
                        icon: 'Target',
                        progress: 0,
                        progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: 0 }]
                    };
                    onUpdateUserData({ ...userData, goals: [...(userData.goals || []), newGoal] });
                    setSuccessFeedback('هدف جدید ساخته شد');
                    break;
                }
                case 'add_task': {
                    const newTask: StandaloneTask = {
                        id: `task-${Date.now()}`,
                        title: result.data.title || commandInput,
                        urgent: false,
                        important: false,
                        completed: false
                    };
                    onUpdateUserData({ ...userData, tasks: [...(userData.tasks || []), newTask] });
                    setSuccessFeedback('تسک اضافه شد');
                    break;
                }
                case 'add_transaction': {
                    const newTx: Transaction = {
                        id: `tx-${Date.now()}`,
                        type: result.data.type || 'expense',
                        amount: result.data.amount || 0,
                        description: result.data.title || commandInput,
                        date: result.data.date || new Date().toISOString().split('T')[0],
                        categoryId: userData.transactionCategories?.[0]?.id || 'default',
                        accountId: userData.financialAccounts?.[0]?.id || 'default'
                    };
                    onUpdateUserData({ ...userData, transactions: [...(userData.transactions || []), newTx] });
                    setSuccessFeedback('تراکنش ثبت شد');
                    break;
                }
                case 'add_event': {
                     const newEvent: CalendarEvent = {
                        id: `evt-${Date.now()}`,
                        date: result.data.date || new Date().toISOString().split('T')[0],
                        time: result.data.time,
                        text: result.data.title || commandInput
                    };
                    onUpdateUserData({ ...userData, calendarEvents: [...(userData.calendarEvents || []), newEvent] });
                    setSuccessFeedback('در تقویم ثبت شد');
                    break;
                }
                case 'chat':
                    setActiveView('assistant');
                    break;
                default: {
                     const defaultTask: StandaloneTask = {
                        id: `task-${Date.now()}`,
                        title: commandInput,
                        urgent: false, important: false, completed: false
                    };
                    onUpdateUserData({ ...userData, tasks: [...(userData.tasks || []), defaultTask] });
                    setSuccessFeedback('تسک اضافه شد');
                }
            }
            setCommandInput('');
            setTimeout(() => setSuccessFeedback(null), 3000);
        } catch (e) {
            console.error("Error applying command", e);
            alert("خطا در ذخیره اطلاعات.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Dynamic Time & Greeting Logic ---
    const getTimeContext = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { 
            phase: 'morning', 
            text: 'صبح بخیر', 
            gradient: 'from-sky-400 via-rose-300 to-amber-200', 
            shadow: 'shadow-orange-500/40',
            iconColor: 'text-yellow-100',
            weatherIcon: SunIcon,
            weatherLabel: 'صاف',
            weatherColor: 'text-yellow-400'
        };
        if (hour >= 12 && hour < 17) return { 
            phase: 'noon', 
            text: 'ظهر بخیر', 
            gradient: 'from-blue-500 via-sky-400 to-cyan-300', 
            shadow: 'shadow-sky-500/40',
            iconColor: 'text-yellow-300',
            weatherIcon: SunIcon,
            weatherLabel: 'آفتابی',
            weatherColor: 'text-orange-400'
        };
        if (hour >= 17 && hour < 20) return { 
            phase: 'afternoon', 
            text: 'عصر بخیر', 
            gradient: 'from-indigo-600 via-purple-500 to-pink-500', 
            shadow: 'shadow-pink-500/40',
            iconColor: 'text-pink-200',
            weatherIcon: CloudIcon, // Simulating partly cloudy/sunset
            weatherLabel: 'نیمه‌ابری',
            weatherColor: 'text-pink-300'
        };
        return { 
            phase: 'night', 
            text: 'شب بخیر', 
            gradient: 'from-slate-900 via-indigo-950 to-black', 
            shadow: 'shadow-indigo-500/30',
            iconColor: 'text-slate-200',
            weatherIcon: MoonIcon,
            weatherLabel: 'مهتابی',
            weatherColor: 'text-blue-200'
        };
    };

    const getPersianDate = () => {
        const now = new Date();
        const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(now);
        const dayNumber = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(now);
        const monthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(now);
        return { dayName, dayNumber, monthName };
    };

    const { dayName, dayNumber, monthName } = getPersianDate();
    const timeContext = getTimeContext();

    // --- Notification Counters (Badges) ---
    const getGoalCount = () => (userData.goals || []).filter(g => g.progress < 100).length;
    const getTaskCount = () => (userData.tasks || []).filter(t => !t.completed).length;
    
    // --- Render Main Dashboard ---
    const renderDashboard = () => {
        return (
            <div className="space-y-6 animate-fadeIn pb-32 px-5 pt-6">
                
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                    {/* Left: Profile/XP -> Opens Shop */}
                    <button onClick={() => setActiveView('shop')} className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-yellow-400 shadow-lg border border-white/10 hover:scale-105 transition-transform">
                        <UserIcon className="w-5 h-5" />
                    </button>

                    {/* Center: Title */}
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">Benvis</h1>
                    </div>

                    {/* Right: Settings */}
                    <button onClick={() => setActiveView('settings')} className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-slate-300 hover:text-white shadow-lg border border-white/10 hover:scale-105 transition-transform">
                        <CogIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/* HERO CARDS */}
                <div className="grid grid-cols-2 gap-4 mb-6 h-44">
                    
                    {/* 1. Greeting Card */}
                    <div 
                        className={`relative rounded-[2.5rem] p-6 overflow-hidden shadow-2xl flex flex-col justify-between bg-gradient-to-br ${timeContext.gradient} ${timeContext.shadow} group transition-all duration-700 hover:scale-[1.02]`}
                    >
                        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/30 rounded-full blur-[40px]"></div>
                        
                        <div className="relative z-10 flex justify-end">
                            {timeContext.phase === 'morning' && <SunIcon className={`w-12 h-12 ${timeContext.iconColor} drop-shadow-lg opacity-90`} />}
                            {timeContext.phase === 'noon' && <SunIcon className={`w-14 h-14 ${timeContext.iconColor} animate-pulse-slow drop-shadow-[0_0_15px_rgba(255,255,0,0.6)]`} />}
                            {timeContext.phase === 'afternoon' && (
                                <div className="relative">
                                    <SunIcon className="w-12 h-12 text-orange-100 opacity-80 translate-y-2" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/50 to-transparent rounded-full blur-sm"></div>
                                </div>
                            )}
                            {timeContext.phase === 'night' && <MoonIcon className={`w-10 h-10 ${timeContext.iconColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />}
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white drop-shadow-md mb-1 leading-tight">{timeContext.text}</h2>
                            <p className="text-sm font-medium text-white/90 truncate">{userData.fullName || 'کاربر عزیز'}</p>
                        </div>
                    </div>

                    {/* 2. Date & Weather Card - OPENS CALENDAR */}
                    <button 
                        onClick={() => setActiveView('calendar')}
                        className="relative rounded-[2.5rem] p-6 overflow-hidden shadow-2xl flex flex-col justify-between bg-[#1c1c1e]/80 backdrop-blur-3xl border border-white/10 hover:bg-[#2c2c2e]/80 transition-all duration-300 hover:scale-[1.02] text-right group"
                    >
                        <div className="flex justify-between items-start w-full">
                             <div className="flex flex-col items-center">
                                <timeContext.weatherIcon className={`w-6 h-6 ${timeContext.weatherColor} mb-1`} />
                                <span className="text-[10px] font-bold text-slate-400">{timeContext.weatherLabel}</span>
                             </div>
                             <span className="text-slate-400 text-xs font-bold bg-white/5 px-3 py-1 rounded-full">{dayName}</span>
                        </div>

                        <div className="flex flex-col items-end mt-2">
                            <span className="text-6xl font-black text-white tracking-tighter leading-none group-hover:scale-110 transition-transform origin-bottom-left">{dayNumber}</span>
                            <span className="text-lg font-medium text-slate-400 mt-1 mr-1">{monthName}</span>
                        </div>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group z-20">
                    <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 shadow-lg transition-colors focus-within:bg-white/15 focus-within:border-white/20">
                        <div className="flex items-center gap-3 flex-grow">
                            <button onClick={handleVoiceInput} className={`transition-all p-2 rounded-xl hover:bg-white/10 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-white'}`}>
                                <MicrophoneIcon className="w-5 h-5" />
                            </button>
                            <input 
                                type="text" 
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                                placeholder={successFeedback ? successFeedback : `بنویس... (مثلا: ${typewriterText})`}
                                className={`bg-transparent text-white placeholder-slate-500 outline-none text-base w-full font-medium transition-all duration-300 ${successFeedback ? 'text-green-400' : ''}`}
                                disabled={isProcessing}
                            />
                        </div>
                        {isProcessing ? (
                            <SparklesIcon className="w-5 h-5 text-violet-500 animate-spin" />
                        ) : (
                            <SparklesIcon className={`w-6 h-6 ${commandInput ? 'text-white animate-pulse' : 'text-slate-600'}`} />
                        )}
                    </div>
                </div>

                {/* Main Grid - 4x3 Layout (12 Items) */}
                <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                    {/* Row 1: Goals, Focus, Reading (Span 2) */}
                    <GridItem icon={TargetIcon} label="اهداف" color="text-blue-400" glow="shadow-blue-500/50" onClick={() => setActiveView('goals')} badge={getGoalCount()} />
                    <GridItem icon={MoonIcon} label="تمرکز" color="text-violet-400" glow="shadow-violet-500/50" onClick={() => setActiveView('focus')} />
                    <ReadingWidget userData={userData} onClick={() => setActiveView('books')} />
                    
                    {/* Row 2: Assistant (Reverted to Standard), Finance, Eisenhower */}
                    <GridItem icon={SparklesIcon} label="دستیار هوشمند" color="text-fuchsia-400" glow="shadow-fuchsia-500/50" onClick={() => setActiveView('assistant')} />
                    <GridItem icon={FinanceIcon} label="مالی" color="text-green-400" glow="shadow-green-500/50" onClick={() => setActiveView('finance')} />
                    <GridItem icon={Squares2X2Icon} label="اولویت" color="text-amber-400" glow="shadow-amber-500/50" onClick={() => setActiveView('eisenhower')} />
                    
                    {/* Row 3: Time, LifeWheel, Habits, Social */}
                    <GridItem icon={QueueListIcon} label="زمان" color="text-cyan-400" glow="shadow-cyan-500/50" onClick={() => setActiveView('timeBlocking')} badge={getTaskCount()} />
                    <GridItem icon={ChartPieIcon} label="چرخ" color="text-pink-400" glow="shadow-pink-500/50" onClick={() => setActiveView('lifeWheel')} />
                    <GridItem icon={HabitsIcon} label="عادت‌ها" color="text-emerald-400" glow="shadow-emerald-500/50" onClick={() => setActiveView('habits')} />
                    <GridItem icon={UserCircleIcon} label="حلقه‌ها" color="text-lime-400" glow="shadow-lime-500/50" onClick={() => setActiveView('social')} />
                    
                    {/* Row 4: Health, School */}
                    <GridItem icon={SnakeIcon} label="کلینیک" color="text-teal-400" glow="shadow-teal-500/50" onClick={() => setActiveView('healthWellness')} />
                    <GridItem icon={AcademicCapIcon} label="مکتب‌خونه" color="text-indigo-400" glow="shadow-indigo-500/50" onClick={() => setActiveView('microCourse')} />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-transparent text-slate-200 font-[Vazirmatn] relative overflow-hidden selection:bg-violet-500/30">
             
             {levelUpInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fadeIn" onClick={onLevelUpSeen}>
                    <div className="text-center animate-bounce-in bg-[#1e293b] p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden max-w-sm w-full mx-4">
                         <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none"></div>
                         <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-badge-pop">
                            <TrophyIcon className="w-16 h-16 text-white drop-shadow-md" />
                         </div>
                         <h2 className="text-5xl font-black text-white mb-2 tracking-tight">تبریک!</h2>
                         <p className="text-xl text-yellow-300 font-medium">شما به سطح {levelUpInfo.newLevel} رسیدید</p>
                         <p className="text-slate-400 mt-8 text-sm opacity-80 animate-pulse">برای ادامه ضربه بزنید</p>
                    </div>
                </div>
            )}

            {/* Main View Rendering */}
            <div className="h-screen overflow-y-auto scrollbar-hide relative z-10">
                {activeView === 'dashboard' && renderDashboard()}
                {activeView === 'goals' && <GoalsView userData={userData} onUpdateUserData={onUpdateUserData} addXp={addXp} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'focus' && <QuietZoneView goals={userData.goals || []} onUpdateGoals={(g) => onUpdateUserData({...userData, goals: g})} onClose={() => setActiveView('dashboard')} addXp={addXp} />}
                {activeView === 'calendar' && <CalendarView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'finance' && <FinancialView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'assistant' && <SmartAssistantView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'settings' && (
                     <div className="p-4 pb-24 bg-black min-h-screen">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setActiveView('dashboard')} className="flex items-center text-slate-400 hover:text-white transition-colors bg-[#1c1c1e] px-4 py-2 rounded-2xl border border-white/5">
                                <span className="mr-2 font-bold">بازگشت</span>
                            </button>
                            <h2 className="text-xl font-black text-white">تنظیمات</h2>
                        </div>
                        <SettingsView userData={userData} onUpdateUserData={onUpdateUserData} />
                     </div>
                )}
                {activeView === 'womenHealth' && <WomenHealthView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'social' && <SocialCirclesView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'microCourse' && <MicroCourseView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'shop' && <XpShopView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'review' && <WeeklyReviewView userData={userData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'nightRoutine' && <NightRoutineView userData={userData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'eisenhower' && <EisenhowerMatrixView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'timeBlocking' && <TimeBlockingView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'lifeWheel' && <LifeWheelView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'books' && <BooksView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} addXp={addXp} />}
                {activeView === 'healthWellness' && <HealthWellnessView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'habits' && <HabitTrackerView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} addXp={addXp} />}
            </div>
        </div>
    );
};

const GridItem: React.FC<{ icon: React.FC<{className?: string}>, label: string, color: string, glow: string, onClick: () => void, badge?: number }> = ({ icon: Icon, label, color, glow, onClick, badge }) => (
    <button 
        onClick={onClick} 
        className="flex flex-col items-center justify-center gap-2.5 group relative"
    >
        <div className={`
            w-full aspect-square rounded-[1.8rem] bg-[#1c1c1e]/60 backdrop-blur-xl border border-white/10
            flex items-center justify-center 
            transition-all duration-300 
            active:scale-95 hover:bg-[#2c2c2e]/80 hover:border-white/20 hover:scale-105
            relative overflow-hidden shadow-lg
        `}>
            <Icon className={`w-7 h-7 ${color} drop-shadow-[0_0_10px_rgba(251,255,255,0.2)] transition-all duration-300 group-hover:scale-110`} />
            
            {/* Notification Badge */}
            {badge && badge > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-red-400 animate-bounce-in">
                    {badge > 9 ? '9+' : badge}
                </div>
            )}
        </div>
        <span className="text-xs font-bold text-slate-500 group-hover:text-white transition-colors">{label}</span>
    </button>
);

export default DashboardScreen;

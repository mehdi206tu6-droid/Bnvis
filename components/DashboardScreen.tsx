
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { OnboardingData, UserGoal, Achievement, AchievementID, Habit, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, GratitudeEntry, Note, CalendarEvent, FocusSession, Transaction, TransactionType } from '../types';
import { 
    TargetIcon, HabitsIcon, CogIcon, FinanceIcon, SparklesIcon,
    HealthIcon, EducationIcon, WaterDropIcon, ReadingIcon, 
    WalkingIcon, MeditationIcon, UserCircleIcon, DocumentChartBarIcon, 
    MoonIcon, StarIcon, TrophyIcon, LevelUpIcon, SunIcon, CloudIcon, MinusCircleIcon, FlameIcon, LeafIcon,
    customHabitIcons, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
    CloudRainIcon, JourneyIcon, BriefcaseIcon, MoneyIcon, FlagIcon, BoltIcon,
    goalIcons, MicrophoneIcon, StopIcon, BenvisLogoIcon, ArrowUturnLeftIcon, DocumentTextIcon, ClipboardIcon, LightBulbIcon, Squares2X2Icon, QueueListIcon, ChartPieIcon, ShoppingBagIcon
} from './icons';
import { GoogleGenAI, Type } from "@google/genai";
import GoalsView from './GoalsView';
import SmartAssistantView from './SmartAssistantView';
import WeeklyReviewView from './WeeklyReviewView';
import QuietZoneView from './QuietZoneView';
import StatsSummaryWidget from './StatsSummaryWidget';
import SettingsView from './SettingsView';
import FinancialWidget from './FinancialWidget';
import WomenHealthView from './WomenHealthView';
import CalendarView from './CalendarView';
import { FinancialView } from './FinancialView';
import DailyPromptWidget from './DailyPromptWidget';
import { NightRoutineView } from './NightRoutineView';
import PredictiveAlertsWidget from './PredictiveAlertsWidget';
import EnergyPredictionWidget from './EnergyPredictionWidget';
import DailyBriefingWidget from './DailyBriefingWidget';
import MoodWeatherWidget from './MoodWeatherWidget';
import FinancialInsightsWidget from './FinancialInsightsWidget';
import EisenhowerMatrixView from './EisenhowerMatrixView';
import TimeBlockingView from './TimeBlockingView';
import LifeWheelView from './LifeWheelView';
import XpShopView from './XpShopView';

type View = 'dashboard' | 'goals' | 'finance' | 'settings' | 'assistant';

interface DashboardScreenProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    addXp: (amount: number) => void;
    levelUpInfo: { newLevel: number } | null;
    onLevelUpSeen: () => void;
    newAchievements: AchievementID[];
    onAchievementsSeen: () => void;
}

const ALL_ACHIEVEMENTS: Record<AchievementID, Achievement> = {
    'first_goal_completed': { id: 'first_goal_completed', title: "اولین قدم", description: "اولین هدف خود را کامل کردید!", icon: TrophyIcon },
    'level_5': { id: 'level_5', title: "استاد سطح ۵", description: "به سطح ۵ رسیدید!", icon: LevelUpIcon },
    '10_day_streak': { id: '10_day_streak', title: "استریک آتشین", description: "یک عادت را ۱۰ روز متوالی انجام دادید!", icon: StarIcon }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const goalStyleMap: { [key: string]: { color: string } } = {
    'Finance': { color: 'text-yellow-400' },
    'Health': { color: 'text-red-400' },
    'Education': { color: 'text-blue-400' },
    'Habits': { color: 'text-green-400' },
    'Trophy': { color: 'text-yellow-400'},
    'Flag': { color: 'text-indigo-400'},
    'Briefcase': { color: 'text-amber-400'},
    'Money': { color: 'text-lime-400'},
    'Walking': { color: 'text-sky-400'},
    'Journey': { color: 'text-purple-400'},
    'Target': { color: 'text-gray-300'},
};


const habitOptionsMap: { [key: string]: React.FC<{className?: string}> } = {
    "نوشیدن آب": WaterDropIcon,
    "مطالعه": ReadingIcon,
    "ورزش": WalkingIcon,
    "مدیتیشن": MeditationIcon,
};

// Redesigned to look like the search bar in the image
const BenvisWidget: React.FC<{
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}> = ({ userData, onUpdateUserData }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [confirmation, setConfirmation] = useState<{ message: string; type: 'success' | 'error'; onUndo?: () => void } | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const prevUserDataRef = useRef<OnboardingData | null>(null);
    const confirmationTimeoutRef = useRef<number | null>(null);

    // Using the placeholders from the image inspiration
    const placeholders = [
        "جستجو کنید...",
        "بنویس تا اتفاق بیفتد...",
        "قرار فردا ساعت ۵...",
    ];
    const [placeholder, setPlaceholder] = useState(placeholders[0]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholder(prev => {
                const currentIndex = placeholders.indexOf(prev);
                return placeholders[(currentIndex + 1) % placeholders.length];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'fa-IR';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsRecording(false);
            };
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                 // Visual feedback for error could be added here
                setIsRecording(false);
            };
            recognition.onend = () => {
                setIsRecording(false);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error("Start recording error", e);
            }
        }
    };

    const showConfirmation = (message: string, type: 'success' | 'error' = 'success', onUndo?: () => void) => {
        if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
        setConfirmation({ message, type, onUndo });
        confirmationTimeoutRef.current = window.setTimeout(() => {
            setConfirmation(null);
            prevUserDataRef.current = null;
        }, 5000);
    };
    
    const handleUndo = () => {
        if (prevUserDataRef.current) {
            onUpdateUserData(prevUserDataRef.current);
        }
        setConfirmation(null);
        prevUserDataRef.current = null;
        if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
    };


    const handleSave = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setConfirmation(null);
        
        const { transactionCategories = [] } = userData;
        const expenseCategories = transactionCategories.filter(c => c.type === 'expense').map(c => c.name).join(', ');
        const incomeCategories = transactionCategories.filter(c => c.type === 'income').map(c => c.name).join(', ');
        const todayDate = new Date().toISOString().split('T')[0];
        
        const processUpdate = (updatedData: OnboardingData, successMessage: string) => {
            prevUserDataRef.current = userData;
            onUpdateUserData(updatedData);
            showConfirmation(successMessage, 'success', handleUndo);
        };

        const prompt = `
            You are an intelligent input router for a life management app called "Benvis". Your task is to analyze the user's Persian text and classify it.
            Categories: 'gratitude', 'note', 'goal', 'habit', 'calendar_event', 'financial_transaction'.
            
            User input: "${input}"
            Today: ${todayDate}
            Expense Cats: [${expenseCategories}]
            Income Cats: [${incomeCategories}]

            Respond ONLY with a valid JSON object matching the schema: { category, content, details: { date, time, icon, amount, type, category } }.
        `;
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                content: { type: Type.STRING },
                details: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING, nullable: true },
                        time: { type: Type.STRING, nullable: true },
                        icon: { type: Type.STRING, nullable: true },
                        amount: { type: Type.INTEGER, nullable: true },
                        type: { type: Type.STRING, nullable: true },
                        category: { type: Type.STRING, nullable: true }
                    },
                    nullable: true,
                }
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema }
            });

            const result = JSON.parse(response.text.trim());

             switch (result.category) {
                case 'gratitude': {
                    const storageKey = 'benvis_gratitude_journal';
                    const stored = localStorage.getItem(storageKey);
                    const items: GratitudeEntry[] = stored ? JSON.parse(stored) : [];
                    const newItem: GratitudeEntry = { id: new Date().toISOString(), content: result.content, createdAt: new Date().toISOString() };
                    localStorage.setItem(storageKey, JSON.stringify([newItem, ...items]));
                    showConfirmation('شکرگزاری ثبت شد');
                    break;
                }
                case 'note': {
                    const storageKey = 'benvis_journal';
                    const stored = localStorage.getItem(storageKey);
                    const items: Note[] = stored ? JSON.parse(stored) : [];
                    const newItem: Note = { id: new Date().toISOString(), content: result.content, createdAt: new Date().toISOString() };
                    localStorage.setItem(storageKey, JSON.stringify([newItem, ...items]));
                    showConfirmation('یادداشت ذخیره شد');
                    break;
                }
                case 'goal': {
                    const newGoal: UserGoal = {
                        id: `goal-${Date.now()}`,
                        type: 'simple',
                        title: result.content,
                        icon: result.details?.icon && goalIcons[result.details.icon] ? result.details.icon : 'Target',
                        progress: 0,
                        linkedHabits: [],
                    };
                    processUpdate({ ...userData, goals: [...userData.goals, newGoal] }, 'هدف جدید ساخته شد');
                    break;
                }
                case 'habit': {
                    const newHabit: Habit = { name: result.content, type: 'good' };
                    processUpdate({ ...userData, habits: [...userData.habits, newHabit] }, 'عادت جدید اضافه شد');
                    break;
                }
                case 'calendar_event': {
                    const newEvent: CalendarEvent = {
                        id: new Date().toISOString(),
                        date: result.details?.date || todayDate,
                        time: result.details?.time,
                        text: result.content
                    };
                    processUpdate({ ...userData, calendarEvents: [...(userData.calendarEvents || []), newEvent] }, 'رویداد به تقویم اضافه شد');
                    break;
                }
                case 'financial_transaction': {
                    const { amount, type, category: categoryName } = result.details || {};
                    if (typeof amount !== 'number' || !type) {
                        showConfirmation('اطلاعات مالی ناقص است', 'error');
                        break;
                    }
                    const category = userData.transactionCategories?.find(c => c.name === categoryName && c.type === type);
                    const fallbackCategory = userData.transactionCategories?.find(c => c.type === type);
                    const defaultCashAccountId = 'default-cash';

                    const newTransaction: Transaction = {
                        id: `tx-${Date.now()}`,
                        type: type as TransactionType,
                        amount: amount,
                        description: result.content,
                        date: todayDate,
                        categoryId: category ? category.id : (fallbackCategory ? fallbackCategory.id : ''),
                        accountId: defaultCashAccountId,
                    };
                    
                    const updatedAccounts = userData.financialAccounts?.map(acc => {
                        if (acc.id === newTransaction.accountId) {
                            const newBalance = type === 'income' ? Number(acc.balance) + amount : Number(acc.balance) - amount;
                            return { ...acc, balance: newBalance };
                        }
                        return acc;
                    });

                    processUpdate({ 
                        ...userData, 
                        transactions: [...(userData.transactions || []), newTransaction],
                        financialAccounts: updatedAccounts,
                    }, 'تراکنش ثبت شد');
                    break;
                }
                default:
                    showConfirmation('متوجه نشدم', 'error');
            }
            setInput('');
        } catch (error: any) {
            console.error("Error:", error);
            showConfirmation('خطا در پردازش', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full z-20">
            <div className={`flex items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-4 py-2.5 transition-all duration-300 ${isRecording ? 'ring-2 ring-red-500/50' : 'focus-within:ring-2 focus-within:ring-[var(--color-primary-500)]/50'}`}>
                 <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder={placeholder}
                    className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-full ml-3 text-right"
                    disabled={isLoading}
                />
                 <button onClick={toggleRecording} className={`p-1.5 rounded-full transition-colors ml-2 ${isRecording ? 'text-red-400 animate-pulse' : 'text-gray-400 hover:text-white'}`}>
                    {isRecording ? <StopIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
                </button>
            </div>
             {/* Floating Action Button for Send if there is input */}
             {input.trim() && !isLoading && (
                <button onClick={handleSave} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--color-primary-600)] rounded-full text-white shadow-lg animate-bounce-in hover:bg-[var(--color-primary-500)]">
                    <ArrowUturnLeftIcon className="w-4 h-4 transform rotate-180" />
                </button>
            )}
             {confirmation && (
                <div className={`absolute top-full mt-2 right-0 left-0 mx-auto w-max px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce-in flex items-center gap-2 z-50 ${confirmation.type === 'success' ? 'bg-green-500/20 text-green-300 backdrop-blur-md border border-green-500/30' : 'bg-red-500/20 text-red-300 backdrop-blur-md border border-red-500/30'}`}>
                    <span>{confirmation.message}</span>
                    {confirmation.onUndo && <button onClick={handleUndo} className="underline opacity-80 hover:opacity-100">بازگشت</button>}
                </div>
            )}
        </div>
    );
};

// Central Circular Hub Widget
const CentralHubWidget: React.FC<{ 
    onOpen: () => void;
    weather: { temp: number; condition: string } | null;
    level: number;
    xp: number;
}> = ({ onOpen, weather, level, xp }) => {
    const [jalaliDate, setJalaliDate] = useState<{day: string, month: string, year: string}>({day: '', month: '', year: ''});

    useEffect(() => {
        const d = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' });
        const parts = formatter.formatToParts(d);
        setJalaliDate({
            day: parts.find(p => p.type === 'day')?.value || '',
            month: parts.find(p => p.type === 'month')?.value || '',
            year: parts.find(p => p.type === 'year')?.value || ''
        });
    }, []);

    // Calculate progress to next level for ring
    let totalXpForPreviousLevels = 0;
    for (let i = 1; i < level; i++) totalXpForPreviousLevels += i * 100;
    const xpInCurrentLevel = xp - totalXpForPreviousLevels;
    const xpRequired = level * 100;
    const percent = Math.min(100, (xpInCurrentLevel / xpRequired) * 100);
    const strokeDashoffset = 440 - (440 * percent) / 100; // 2 * PI * 70 roughly 440

    return (
        <div onClick={onOpen} className="cursor-pointer relative flex flex-col items-center justify-center w-full aspect-square max-h-[300px] mx-auto group">
            {/* Glowing Backdrop */}
            <div className="absolute inset-0 bg-[var(--color-primary-500)] opacity-10 blur-[50px] rounded-full group-hover:opacity-20 transition-opacity duration-500"></div>
            
            {/* SVG Ring */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                    <circle cx="50%" cy="50%" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                    <circle 
                        cx="50%" 
                        cy="50%" 
                        r="70" 
                        stroke="url(#gradient)" 
                        strokeWidth="12" 
                        fill="none" 
                        strokeDasharray="440" 
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#d8b4fe" />
                        </linearGradient>
                    </defs>
                </svg>
                
                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                    <span className="text-gray-400 text-sm tracking-widest uppercase mb-1">{jalaliDate.month} {jalaliDate.year}</span>
                    <h2 className="text-6xl font-bold text-white drop-shadow-md">{jalaliDate.day}</h2>
                    {weather && (
                         <div className="flex items-center gap-1 mt-2 text-sm text-gray-300 bg-white/5 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5">
                            <SunIcon className="w-4 h-4 text-yellow-300" />
                            <span>{weather.temp}°</span>
                         </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 text-center">
                 <p className="text-[var(--color-primary-300)] font-bold text-sm tracking-wide">سطح {level}</p>
            </div>
        </div>
    );
};

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; title?: React.ReactNode }> = ({ children, className = "", onClick, title }) => (
    <div onClick={onClick} className={`glass-card p-5 relative overflow-hidden ${onClick ? 'glass-card-hover cursor-pointer' : ''} ${className}`}>
        {title && <div className="mb-3 font-bold text-gray-200">{title}</div>}
        {children}
    </div>
);


// Minimal Habit Tracker for dashboard
const QuickHabitTracker: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void, addXp: (amount: number) => void }> = ({ userData, onUpdateUserData, addXp }) => {
    const [completedHabits, setCompletedHabits] = useState<Record<string, boolean>>({});
    const today = new Date().toISOString().split('T')[0];
    
    useEffect(() => {
        const stored = localStorage.getItem(`benvis_habits_${today}`);
        if (stored) setCompletedHabits(JSON.parse(stored));
    }, [today]);

    const toggleHabit = (habit: Habit) => {
        const newState = !completedHabits[habit.name];
        const newCompletions = { ...completedHabits, [habit.name]: newState };
        setCompletedHabits(newCompletions);
        localStorage.setItem(`benvis_habits_${today}`, JSON.stringify(newCompletions));
        
        if(habit.type === 'good') addXp(newState ? 10 : -10);
    };

    return (
        <div className="space-y-3">
            {userData.habits.slice(0, 3).map(habit => {
                const isDone = !!completedHabits[habit.name];
                return (
                    <div key={habit.name} onClick={() => toggleHabit(habit)} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full transition-colors ${isDone ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-700 group-hover:bg-gray-600'}`}></div>
                            <span className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{habit.name}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                             {isDone && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}


const BottomNav: React.FC<{ activeView: View; setActiveView: (view: View) => void }> = ({ activeView, setActiveView }) => {
    const navItems: { view: View; icon: React.FC<{ className?: string }>; label: string }[] = [
        { view: 'settings', icon: CogIcon, label: 'تنظیمات' },
        { view: 'goals', icon: TargetIcon, label: 'اهداف' },
        { view: 'dashboard', icon: BenvisLogoIcon, label: 'خانه' },
        { view: 'finance', icon: FinanceIcon, label: 'مالی' },
        { view: 'assistant', icon: SparklesIcon, label: 'دستیار' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
            <div className="glass-card px-2 py-2 flex items-center gap-1 rounded-full shadow-2xl border-white/10 bg-[#0F0B1A]/80 backdrop-blur-xl">
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                            activeView === item.view 
                                ? 'bg-[var(--color-primary-600)] text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] transform -translate-y-2' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon className={`w-6 h-6 ${activeView === item.view ? 'animate-pulse' : ''}`} />
                        {activeView === item.view && <span className="absolute -bottom-8 text-[10px] font-bold text-[var(--color-primary-300)] whitespace-nowrap opacity-0 animate-fadeIn">{item.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

const LevelUpModal: React.FC<{ newLevel: number, onSeen: () => void }> = ({ newLevel, onSeen }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop" onClick={onSeen}>
        <div className="glass-card p-8 text-center flex flex-col items-center animate-bounce-in max-w-xs w-full border-[var(--color-primary-500)] neon-border">
            <LevelUpIcon className="w-20 h-20 text-[var(--color-primary-400)] mb-4 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            <h2 className="text-3xl font-bold text-white">تبریک!</h2>
            <p className="text-lg text-gray-300 mt-2">شما به سطح <span className="text-[var(--color-primary-400)] font-bold text-xl">{newLevel}</span> رسیدید!</p>
            <button onClick={onSeen} className="mt-6 w-full py-2 bg-[var(--color-primary-600)] rounded-full font-bold text-white hover:bg-[var(--color-primary-500)] transition-colors shadow-lg">ادامه</button>
        </div>
    </div>
);

const AchievementModal: React.FC<{ achievement: Achievement, onSeen: () => void }> = ({ achievement, onSeen }) => {
    const Icon = achievement.icon;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop" onClick={onSeen}>
             <div className="glass-card p-8 text-center flex flex-col items-center animate-bounce-in max-w-xs w-full border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Icon className="w-20 h-20 text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                <h2 className="text-2xl font-bold text-yellow-300">دست‌آورد جدید!</h2>
                <p className="text-lg font-bold mt-2 text-white">{achievement.title}</p>
                <p className="text-sm text-gray-300 mt-1">{achievement.description}</p>
                <button onClick={onSeen} className="mt-6 w-full py-2 bg-yellow-600 rounded-full font-bold text-white hover:bg-yellow-500 transition-colors shadow-lg">عالیه!</button>
            </div>
        </div>
    );
};

// Main Dashboard Screen
const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    userData, onUpdateUserData, addXp, levelUpInfo, onLevelUpSeen, newAchievements, onAchievementsSeen,
}) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isQuietZoneOpen, setIsQuietZoneOpen] = useState(false);
    const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
    const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false);
    const [isFinancialViewOpen, setIsFinancialViewOpen] = useState(false);
    const [isNightRoutineOpen, setIsNightRoutineOpen] = useState(false);
    const [isEisenhowerOpen, setIsEisenhowerOpen] = useState(false);
    const [isTimeBlockingOpen, setIsTimeBlockingOpen] = useState(false);
    const [isLifeWheelOpen, setIsLifeWheelOpen] = useState(false);
    const [isXpShopOpen, setIsXpShopOpen] = useState(false);
    const [isWomenHealthOpen, setIsWomenHealthOpen] = useState(false);
    
    const [currentAchievement, setCurrentAchievement] = useState<AchievementID | null>(null);
    const [assistantState, setAssistantState] = useState<{ initialTab: string, initialJournalText: string }>({ initialTab: 'chat', initialJournalText: '' });
    
    // Data states
    const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
    const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
    const [predictiveAlert, setPredictiveAlert] = useState<{title: string, message: string} | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const cacheKey = `benvis_dash_v2_${todayStr}`;
            const cached = localStorage.getItem(cacheKey);
            if(cached) {
                const data = JSON.parse(cached);
                setWeather(data.weather);
                setDailyBriefing(data.dailyBriefing);
                return;
            }

             // Mock data for visual
            setWeather({ temp: 24, condition: 'Clear' });
            
        } catch (e) { console.error(e) }
    }, []);

    useEffect(() => { 
        fetchDashboardData(); 
        // Simple predictive alert logic based on user data
        if (userData.goals.filter(g => g.progress < 20).length > 3) {
            setPredictiveAlert({
                title: 'ترافیک اهداف',
                message: 'تعداد اهداف فعال با پیشرفت کم زیاد است. پیشنهاد می‌کنیم روی ۳ هدف اصلی تمرکز کنید.'
            });
        }
    }, [fetchDashboardData, userData.goals]);
    
    useEffect(() => { if (newAchievements.length > 0 && !currentAchievement) setCurrentAchievement(newAchievements[0]); }, [newAchievements, currentAchievement]);

    const handleAchievementSeen = () => {
        const remaining = newAchievements.slice(1);
        onAchievementsSeen();
        setCurrentAchievement(remaining[0] || null);
    };
    
    const renderView = () => {
        switch (activeView) {
            case 'goals': return <GoalsView userData={userData} onUpdateUserData={onUpdateUserData} addXp={addXp} />;
            case 'finance': return null; // Handled via modal effect
            case 'settings': return <SettingsView userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'assistant': return <SmartAssistantView userData={userData} onUpdateUserData={onUpdateUserData} initialTab={assistantState.initialTab} initialJournalText={assistantState.initialJournalText} />;
            default: return null;
        }
    };
    
    useEffect(() => {
        if (activeView === 'finance') {
            setIsFinancialViewOpen(true);
            setActiveView('dashboard');
        }
    }, [activeView]);

    return (
        <div className="min-h-screen bg-[#020005] text-gray-100 pb-24 relative overflow-x-hidden font-sans">
             {/* Background Ambient Glows */}
             <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[var(--color-primary-900)] rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900 rounded-full blur-[100px] opacity-30"></div>
             </div>

            {levelUpInfo && <LevelUpModal newLevel={levelUpInfo.newLevel} onSeen={onLevelUpSeen} />}
            {currentAchievement && ALL_ACHIEVEMENTS[currentAchievement] && <AchievementModal achievement={ALL_ACHIEVEMENTS[currentAchievement]} onSeen={handleAchievementSeen} />}

            <div className="relative z-10 p-6 flex flex-col gap-6 max-w-md mx-auto">
                
                {activeView !== 'dashboard' ? (
                     <div className="pb-4">{renderView()}</div>
                ) : (
                    <>
                        {/* Header / Command Center */}
                        <header className="flex flex-col gap-4">
                            <div className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary-600)] to-blue-500 p-0.5 cursor-pointer" onClick={() => setIsXpShopOpen(true)}>
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                            <UserCircleIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-lg">سلام، {userData.fullName.split(' ')[0]}</h1>
                                        <button onClick={() => setIsXpShopOpen(true)} className="text-xs text-yellow-400 flex items-center gap-1">
                                             <StarIcon className="w-3 h-3" />
                                             {userData.xp} XP
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     {userData.gender === 'female' && (
                                         <button onClick={() => setIsWomenHealthOpen(true)} className="p-2 rounded-full bg-pink-500/20 hover:bg-pink-500/30 transition-colors" title="سلامت زنان">
                                            <HealthIcon className="w-6 h-6 text-pink-400" />
                                         </button>
                                     )}
                                     <button onClick={() => setIsLifeWheelOpen(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors" title="چرخ زندگی">
                                        <ChartPieIcon className="w-6 h-6 text-pink-300" />
                                    </button>
                                    <button onClick={() => setIsEisenhowerOpen(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors" title="اولویت‌بندی (آیزنهاور)">
                                        <Squares2X2Icon className="w-6 h-6 text-violet-300" />
                                    </button>
                                    <button onClick={() => setIsTimeBlockingOpen(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors" title="برنامه‌ریزی روزانه">
                                        <QueueListIcon className="w-6 h-6 text-blue-300" />
                                    </button>
                                    <button onClick={() => setIsWeeklyReviewOpen(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors" title="مرور هفتگی">
                                        <ClipboardIcon className="w-6 h-6 text-green-300" />
                                    </button>
                                    <button onClick={() => setIsNightRoutineOpen(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors" title="روتین شبانه">
                                        <MoonIcon className="w-6 h-6 text-[var(--color-primary-300)]" />
                                    </button>
                                </div>
                            </div>
                            <BenvisWidget userData={userData} onUpdateUserData={onUpdateUserData} />
                        </header>

                        {/* Central Hub */}
                        <div className="my-4">
                            <CentralHubWidget onOpen={() => setIsCalendarViewOpen(true)} weather={weather} level={userData.level} xp={userData.xp} />
                        </div>

                        {/* Dashboard Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Daily Stats / Tasks */}
                            <GlassCard className="col-span-1 min-h-[140px]" title={<div className="flex items-center gap-2"><TargetIcon className="w-4 h-4 text-blue-400"/> اهداف</div>}>
                                <div className="text-3xl font-bold text-white">{userData.goals.filter(g => g.progress < 100).length}</div>
                                <p className="text-xs text-gray-400 mt-1">فعال</p>
                                <div className="mt-3 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-2/3 rounded-full"></div>
                                </div>
                            </GlassCard>

                             {/* Habits - Quick View */}
                             <GlassCard className="col-span-1 min-h-[140px]" title={<div className="flex items-center gap-2"><HabitsIcon className="w-4 h-4 text-green-400"/> عادت‌ها</div>}>
                                 <QuickHabitTracker userData={userData} onUpdateUserData={onUpdateUserData} addXp={addXp} />
                             </GlassCard>

                            {/* Financial - Mini */}
                            <GlassCard onClick={() => setIsFinancialViewOpen(true)} className="col-span-2 sm:col-span-1 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400">موجودی کل</p>
                                    <p className="text-lg font-bold text-white mt-1">
                                        {new Intl.NumberFormat('fa-IR').format((userData.financialAccounts || []).reduce((sum, a) => sum + Number(a.balance), 0))}
                                    </p>
                                </div>
                                <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                                    <FinanceIcon className="w-6 h-6" />
                                </div>
                            </GlassCard>

                             {/* Focus Mode CTA */}
                            <GlassCard onClick={() => setIsQuietZoneOpen(true)} className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[var(--color-primary-900)]/50 to-blue-900/20 border-blue-500/30 group">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-blue-200">شروع تمرکز</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
                                        <MoonIcon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </GlassCard>
                            
                            {/* AI Insights Area */}
                            <div className="col-span-2 space-y-4">
                                <PredictiveAlertsWidget alert={predictiveAlert} isLoading={false} onToggleMode={(isOn) => onUpdateUserData({...userData, isLowFrictionMode: isOn})} />
                                {dailyBriefing && <DailyBriefingWidget briefing={dailyBriefing} isLoading={false} onRefresh={fetchDashboardData} />}
                                <MoodWeatherWidget />
                                <FinancialInsightsWidget userData={userData} />
                            </div>

                        </div>
                    </>
                )}
            </div>

            <BottomNav activeView={activeView} setActiveView={setActiveView} />

            {/* Modals */}
            {isQuietZoneOpen && <QuietZoneView goals={userData.goals} onUpdateGoals={(goals) => onUpdateUserData({...userData, goals})} onClose={() => setIsQuietZoneOpen(false)} addXp={addXp} />}
            {isWeeklyReviewOpen && <WeeklyReviewView userData={userData} onClose={() => setIsWeeklyReviewOpen(false)} />}
            {isCalendarViewOpen && <CalendarView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsCalendarViewOpen(false)} />}
            {isFinancialViewOpen && <FinancialView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsFinancialViewOpen(false)} />}
            {isNightRoutineOpen && <NightRoutineView userData={userData} onClose={() => setIsNightRoutineOpen(false)} />}
            {isEisenhowerOpen && <EisenhowerMatrixView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsEisenhowerOpen(false)} />}
            {isTimeBlockingOpen && <TimeBlockingView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsTimeBlockingOpen(false)} />}
            {isLifeWheelOpen && <LifeWheelView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsLifeWheelOpen(false)} />}
            {isXpShopOpen && <XpShopView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsXpShopOpen(false)} />}
            {isWomenHealthOpen && <WomenHealthView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsWomenHealthOpen(false)} />}
        </div>
    );
};

export default DashboardScreen;

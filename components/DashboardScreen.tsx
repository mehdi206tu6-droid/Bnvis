import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { OnboardingData, UserGoal, Achievement, AchievementID, Habit, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, GratitudeEntry, Note, CalendarEvent, FocusSession, Transaction, TransactionType } from '../types';
import { 
    TargetIcon, HabitsIcon, CogIcon, FinanceIcon, SparklesIcon,
    HealthIcon, EducationIcon, WaterDropIcon, ReadingIcon, 
    WalkingIcon, MeditationIcon, UserCircleIcon, DocumentChartBarIcon, 
    MoonIcon, StarIcon, TrophyIcon, LevelUpIcon, SunIcon, CloudIcon, MinusCircleIcon, FlameIcon, LeafIcon,
    customHabitIcons, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
    CloudRainIcon, JourneyIcon, BriefcaseIcon, MoneyIcon, FlagIcon, BoltIcon,
    goalIcons, MicrophoneIcon, StopIcon, BenvisLogoIcon, ArrowUturnLeftIcon, DocumentTextIcon
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
// FIX: Changed to a named import as FinancialView does not have a default export.
import { FinancialView } from './FinancialView';
import DailyPromptWidget from './DailyPromptWidget';
// Fix: Changed to named import as NightRoutineView does not have a default export.
import { NightRoutineView } from './NightRoutineView';
import PredictiveAlertsWidget from './PredictiveAlertsWidget';
import EnergyPredictionWidget from './EnergyPredictionWidget';
import DailyBriefingWidget from './DailyBriefingWidget';
import MoodWeatherWidget from './MoodWeatherWidget';
import FinancialInsightsWidget from './FinancialInsightsWidget';

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

    const placeholders = [
        "بنویس تا اتفاق بیفتد...",
        "قهوه و کیک با دوستم ۳۵ هزار تومان",
        "قرار ملاقات با دکتر فردا ساعت ۴ بعد از ظهر",
        "ایده برای کتاب جدیدم: یک داستان علمی تخیلی",
        "هدف جدید: دویدن ۵ کیلومتر زیر ۳۰ دقیقه",
        "امروز شکرگزارم برای حمایت خانواده‌ام",
        "یادآوری: تمدید اشتراک نرم‌افزار",
        "درآمد پروژه طراحی لوگو: ۱ میلیون و ۵۰۰ هزار تومان",
    ];
    const [placeholder, setPlaceholder] = useState(placeholders[0]);
    
    // Use an animation class for placeholder changes
    const placeholderRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const interval = setInterval(() => {
            if (placeholderRef.current) {
                placeholderRef.current.classList.add('animate-placeholder');
            }
            setTimeout(() => {
                 setPlaceholder(prev => {
                    const currentIndex = placeholders.indexOf(prev);
                    return placeholders[(currentIndex + 1) % placeholders.length];
                });
                if (placeholderRef.current) {
                    placeholderRef.current.classList.remove('animate-placeholder');
                }
            }, 1500);
        }, 3000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                showConfirmation('خطا در تشخیص گفتار', 'error');
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
            setInput('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const showConfirmation = (message: string, type: 'success' | 'error' = 'success', onUndo?: () => void) => {
        if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
        }
        setConfirmation({ message, type, onUndo });
        confirmationTimeoutRef.current = window.setTimeout(() => {
            setConfirmation(null);
            prevUserDataRef.current = null; // Clear undo history after timeout
        }, 5000); // 5 second window for undo
    };
    
    const handleUndo = () => {
        if (prevUserDataRef.current) {
            onUpdateUserData(prevUserDataRef.current);
        }
        setConfirmation(null);
        prevUserDataRef.current = null;
        if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
        }
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
            You are an intelligent input router for a life management app called "Benvis". Your task is to analyze the user's Persian text and classify it into one of the following categories: 'gratitude', 'note', 'goal', 'habit', 'calendar_event', 'financial_transaction'.
            - 'gratitude': Any text expressing thankfulness or appreciation.
            - 'note': A general reminder, idea, or thought to be saved.
            - 'goal': A long-term ambition or a specific objective with a clear outcome.
            - 'habit': A recurring action the user wants to perform daily.
            - 'calendar_event': An appointment or task with a specific date and/or time.
            - 'financial_transaction': Any mention of spending or receiving money (e.g., "خریدم", "گرفتم", "هزینه", "درآمد", "تومان", "ریال").

            After classifying, extract the key information.
            - For 'calendar_event', you MUST extract the date (in YYYY-MM-DD format) and time (in HH:mm format). Use today's date, ${todayDate}, as a reference for terms like "tomorrow", "tonight", "next week", etc.
            - For 'goal', suggest a relevant icon from this list: [${Object.keys(goalIcons).join(', ')}].
            - For 'financial_transaction', you MUST extract the 'amount' (as a number), 'type' ('income' or 'expense'), and suggest a 'category' from the provided lists. The 'content' should be the description of the transaction.
                - Available expense categories: [${expenseCategories || 'N/A'}]
                - Available income categories: [${incomeCategories || 'N/A'}]
            - The main text content should be cleaned up and placed in the 'content' field.

            User input: "${input}"

            Respond ONLY with a valid JSON object matching the schema.
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
                    showConfirmation('مورد شکرگزاری شما ثبت شد!');
                    break;
                }
                case 'note': {
                    const storageKey = 'benvis_journal';
                    const stored = localStorage.getItem(storageKey);
                    const items: Note[] = stored ? JSON.parse(stored) : [];
                    const newItem: Note = { id: new Date().toISOString(), content: result.content, createdAt: new Date().toISOString() };
                    localStorage.setItem(storageKey, JSON.stringify([newItem, ...items]));
                    showConfirmation('یادداشت شما ذخیره شد!');
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
                    processUpdate({ ...userData, goals: [...userData.goals, newGoal] }, 'هدف جدید شما ساخته شد!');
                    break;
                }
                case 'habit': {
                    const newHabit: Habit = {
                        name: result.content,
                        type: 'good',
                    };
                    processUpdate({ ...userData, habits: [...userData.habits, newHabit] }, 'عادت جدید شما اضافه شد!');
                    break;
                }
                case 'calendar_event': {
                    const newEvent: CalendarEvent = {
                        id: new Date().toISOString(),
                        date: result.details?.date || todayDate,
                        time: result.details?.time,
                        text: result.content
                    };
                    processUpdate({ ...userData, calendarEvents: [...(userData.calendarEvents || []), newEvent] }, 'رویداد به تقویم اضافه شد!');
                    break;
                }
                case 'financial_transaction': {
                    const { amount, type, category: categoryName } = result.details || {};
                    if (typeof amount !== 'number' || !type) {
                        showConfirmation('اطلاعات تراکنش مالی ناقص است.', 'error');
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
                    }, 'تراکنش مالی ثبت شد!');
                    break;
                }
                default:
                    showConfirmation('دسته بندی ورودی شما مشخص نشد. لطفا واضح تر بنویسید.', 'error');
            }
            setInput('');
        } catch (error: any) {
            console.error("Error processing input:", error);
            const errorString = JSON.stringify(error);
            if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes('"code":429')) {
                showConfirmation('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.', 'error');
            } else {
                showConfirmation('خطا در پردازش ورودی شما. لطفا دوباره تلاش کنید.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-4 bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-3 space-y-2">
            <div className="relative">
                <textarea
                    ref={placeholderRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    className={`w-full bg-slate-800/50 border border-slate-700 rounded-[var(--radius-md)] p-3 pr-12 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none transition-opacity duration-300`}
                    disabled={isLoading}
                />
                 <button onClick={toggleRecording} className={`absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500/50 text-red-300 animate-pulse' : 'text-slate-400 hover:text-white'}`}>
                    {isRecording ? <StopIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
                </button>
            </div>
            <button onClick={handleSave} disabled={isLoading || !input.trim()} className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold rounded-[var(--radius-md)] hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-violet-800/40 disabled:bg-slate-600 disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed">
                {isLoading ? (
                    <>
                        <SparklesIcon className="w-5 h-5 animate-pulse" />
                        <span>در حال پردازش...</span>
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        <span>ذخیره هوشمند</span>
                    </>
                )}
            </button>
            {confirmation && (
                <div className={`text-center text-sm font-semibold p-2 rounded-md flex items-center justify-between gap-2 ${confirmation.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    <span>{confirmation.message}</span>
                    {confirmation.onUndo && (
                        <button onClick={handleUndo} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black/20 hover:bg-black/40">
                            <ArrowUturnLeftIcon className="w-4 h-4"/>
                            <span>بازگشت</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};


const TodaysPrioritiesWidget: React.FC<{ priorities: string[] | null; isLoading: boolean }> = ({ priorities, isLoading }) => {
    if (isLoading) {
        return (
             <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 col-span-2 animate-pulse">
                <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-5 bg-slate-800 rounded w-full"></div>
                    <div className="h-5 bg-slate-800 rounded w-5/6"></div>
                    <div className="h-5 bg-slate-800 rounded w-3/4"></div>
                </div>
            </div>
        )
    }

    if (!priorities || priorities.length === 0) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-lg border border-violet-800/80 rounded-[var(--radius-card)] p-4 col-span-2">
                 <h3 className="font-bold mb-3 flex items-center gap-2 text-lg"><SparklesIcon className="w-6 h-6 text-violet-400" /> اولویت‌های اصلی امروز</h3>
                 <p className="text-slate-400 text-sm">اولویت‌های امروز مشخص نشد. می‌توانید از اهداف خود شروع کنید.</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-900/60 backdrop-blur-lg border border-violet-800/80 rounded-[var(--radius-card)] p-4 col-span-2">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-lg"><SparklesIcon className="w-6 h-6 text-violet-400" /> اولویت‌های اصلی امروز</h3>
            <ul className="space-y-2">
                {priorities.map((p, i) => (
                    <li key={i} className="flex items-center gap-3 bg-slate-800/70 p-3 rounded-[var(--radius-md)]">
                        <div className="w-5 h-5 rounded-full border-2 border-violet-500 flex-shrink-0"></div>
                        <span className="text-slate-200">{p}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
};


const WeatherAndCalendarWidget: React.FC<{ 
    onOpen: () => void;
    weather: { temp: number; condition: string } | null;
    isLoading: boolean;
    weatherError: string | null;
}> = ({ onOpen, weather, isLoading, weatherError }) => {
    const [jalaliDate, setJalaliDate] = useState('');

    const getWeatherIcon = (condition: string) => {
        const lowerCaseCondition = condition.toLowerCase();
        if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) {
            return <SunIcon className="w-8 h-8 text-yellow-300" />;
        }
        if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('drizzle')) {
            return <CloudRainIcon className="w-8 h-8 text-blue-300" />;
        }
        if (lowerCaseCondition.includes('cloud')) {
            return <CloudIcon className="w-8 h-8 text-slate-300" />;
        }
        return <CloudIcon className="w-8 h-8 text-slate-300" />;
    };

    useEffect(() => {
        const jalaliFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
        setJalaliDate(jalaliFormatter.format(new Date()));
    }, []);

    const content = () => {
        if (isLoading) {
            return <div className="h-full w-full bg-slate-800 rounded-[var(--radius-card)] animate-pulse"></div>;
        }
        if (weatherError && !weather) {
            return <p className="text-sm text-red-300">{weatherError}</p>;
        }
        return (
            <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {weather ? getWeatherIcon(weather.condition) : <CloudIcon className="w-8 h-8 text-slate-300" />}
                        <div>
                            {weather ? <p className="font-bold text-2xl">{weather.temp}°C</p> : <p className="text-sm text-slate-400">آب و هوا نامشخص</p>}
                            <p className="font-semibold text-slate-300">{jalaliDate}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <button onClick={onOpen} className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 min-h-[120px] text-right hover:bg-slate-800/80 transition-colors">
            {content()}
        </button>
    );
};

const HabitTrackerSkeleton: React.FC = () => (
    <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full flex items-center p-3 rounded-[var(--radius-md)] bg-slate-800/70">
                    <div className="w-5 h-5 ml-3 rounded bg-slate-700"></div>
                    <div className="h-5 bg-slate-700 rounded flex-grow"></div>
                    <div className="w-6 h-6 rounded-full ml-2 bg-slate-700"></div>
                </div>
            ))}
        </div>
    </div>
);

const HabitTrackerWidget: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void, addXp: (amount: number) => void }> = ({ userData, onUpdateUserData, addXp }) => {
    const [completedHabits, setCompletedHabits] = useState<Record<string, boolean>>({});
    const [streaks, setStreaks] = useState<Record<string, number>>({});
    const [streaksEndingYesterday, setStreaksEndingYesterday] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [justCompletedHabit, setJustCompletedHabit] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `benvis_habits_${today}`;
    const XP_PER_HABIT = 10;
    const { habits } = userData;
    
    useEffect(() => {
        setLoading(true);
        try {
            const storedCompletions = localStorage.getItem(storageKey);
            const initialCompletions = storedCompletions ? JSON.parse(storedCompletions) : {};
            setCompletedHabits(initialCompletions);
            calculateStreaks(habits, initialCompletions);
            calculateYesterdayStreaks(habits);
        } catch (error) {
            console.error("Failed to load habit data", error);
        } finally {
            setTimeout(() => setLoading(false), 300);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, habits]);

    const calculateYesterdayStreaks = (currentHabits: Habit[]) => {
        const today = new Date();
        const yesterdayStreaks: Record<string, number> = {};
        for (const habit of currentHabits) {
            let streak = 0;
            for (let i = 1; i < 365; i++) { // Start from yesterday
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateString = d.toISOString().split('T')[0];
                const prevStorageKey = `benvis_habits_${dateString}`;
                const storedData = localStorage.getItem(prevStorageKey);
                let isSuccessYesterday;
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    isSuccessYesterday = habit.type === 'good' ? parsedData[habit.name] : !parsedData[habit.name];
                } else {
                    isSuccessYesterday = habit.type === 'bad';
                }

                if (isSuccessYesterday) {
                    streak++;
                } else {
                    break;
                }
            }
            yesterdayStreaks[habit.name] = streak;
        }
        setStreaksEndingYesterday(yesterdayStreaks);
    };


    const calculateStreaks = (currentHabits: Habit[], dayCompletions: Record<string, boolean>) => {
        const today = new Date();
        const newStreaks: Record<string, number> = {};
        for (const habit of currentHabits) {
            let currentStreak = 0;
            const isSuccessToday = habit.type === 'good' ? dayCompletions[habit.name] : !dayCompletions[habit.name];
            if (isSuccessToday) {
                currentStreak = 1;
                for (let i = 1; i < 365; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const dateString = d.toISOString().split('T')[0];
                    const prevStorageKey = `benvis_habits_${dateString}`;
                    const storedData = localStorage.getItem(prevStorageKey);
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        const isSuccessYesterday = habit.type === 'good' ? parsedData[habit.name] : !parsedData[habit.name];
                        if (isSuccessYesterday) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    } else {
                        if (habit.type === 'good') break; // Good habit not done breaks streak
                        // For bad habit, no entry means success
                        currentStreak++;
                    }
                }
            }
            newStreaks[habit.name] = currentStreak;
        }
        setStreaks(newStreaks);
    };

    const toggleHabit = (habit: Habit) => {
        const wasCompleted = !!completedHabits[habit.name];
        const isCompleting = !wasCompleted;
        
        const newCompletions = { ...completedHabits, [habit.name]: isCompleting };
        setCompletedHabits(newCompletions);
        localStorage.setItem(storageKey, JSON.stringify(newCompletions));

        if (habit.type === 'good') {
            if (isCompleting) {
                addXp(XP_PER_HABIT);
                setJustCompletedHabit(habit.name);
                setTimeout(() => setJustCompletedHabit(null), 1000); // Animation duration
            } else {
                addXp(-XP_PER_HABIT);
            }
        } else { // Bad habit
            addXp(isCompleting ? -XP_PER_HABIT : XP_PER_HABIT); // Lose XP for failure, gain back for correcting
        }
        
        calculateStreaks(habits, newCompletions);

        let updatedData = { ...userData };
        if (isCompleting && habit.type === 'good') {
            const updatedGoals = userData.goals.map(goal => {
                if (goal.linkedHabits?.includes(habit.name)) {
                    const progressToAdd = 5; // Add 5% for each habit completion
                    const newProgress = Math.min(100, goal.progress + progressToAdd);
                    
                    const newHistory = [...(goal.progressHistory || [])];
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayHistory = newHistory.find(h => h.date === todayStr);
                    if (todayHistory) {
                        todayHistory.progress = newProgress;
                    } else {
                        newHistory.push({ date: todayStr, progress: newProgress });
                    }
                    return { ...goal, progress: newProgress, progressHistory: newHistory };
                }
                return goal;
            });
            updatedData = { ...updatedData, goals: updatedGoals };
        }

        onUpdateUserData(updatedData);
    };
    
    if (habits.length === 0) return null;
    
    if (loading) return <HabitTrackerSkeleton />;

    return (
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 col-span-2">
            <h3 className="font-bold mb-3">پیگیری عادت‌های امروز</h3>
            <div className="space-y-2">
                {habits.map(habit => {
                    const Icon = customHabitIcons[habit.icon || ''] || habitOptionsMap[habit.name] || (habit.type === 'good' ? HabitsIcon : MinusCircleIcon);
                    const isCompleted = !!completedHabits[habit.name];
                    const streakCount = streaks[habit.name] || 0;
                    const yesterdayStreak = streaksEndingYesterday[habit.name] || 0;
                    const isAtRisk = yesterdayStreak > 0 && !isCompleted;
                    
                    const isGoodHabit = habit.type === 'good';
                    const isSuccess = isGoodHabit ? isCompleted : !isCompleted;
                    
                    const iconStyle = { color: habit.color || (isGoodHabit ? '#d1d5db' : '#fca5a5') };

                    return (
                        <button key={habit.name} onClick={() => toggleHabit(habit)} className={`w-full flex items-center p-3 rounded-[var(--radius-md)] text-right transition-all duration-200 ease-in-out hover:-translate-y-1 active:scale-95 ${isSuccess ? (isGoodHabit ? 'bg-green-500/10' : 'bg-slate-800/70 hover:bg-slate-700') : (isGoodHabit ? 'bg-slate-800/70 hover:bg-slate-700' : 'bg-red-500/10')} ${isAtRisk && isGoodHabit ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-orange-500/70 animate-pulse' : ''} ${justCompletedHabit === habit.name ? 'animate-celebrate' : ''}`}>
                            <Icon style={iconStyle} className="w-5 h-5 ml-3 flex-shrink-0" />
                            <span className={`flex-grow ${isSuccess && isGoodHabit ? 'line-through text-slate-500' : ''}`}>{habit.name}</span>
                            {isGoodHabit && (streakCount > 0 || isAtRisk) && (
                                <div className="flex items-center gap-1 text-xs font-bold text-orange-400 mr-2">
                                    <span>{streakCount > 0 ? streakCount : yesterdayStreak}</span>
                                    <FlameIcon className="w-4 h-4" />
                                </div>
                            )}
                            <div className={`w-6 h-6 rounded-[var(--radius-full)] flex items-center justify-center border-2 transition-all duration-200 transform ${isCompleted ? (isGoodHabit ? 'bg-green-500 border-green-400 scale-110' : 'bg-red-500 border-red-400') : 'border-slate-500'}`}>
                                {isCompleted && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const GoalsWidget: React.FC<{ goals: UserGoal[] }> = ({ goals }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    useEffect(() => {
        if (currentIndex >= goals.length) {
            setCurrentIndex(0);
        }
    }, [goals, currentIndex]);

    const nextGoal = () => {
        if (goals.length > 0) {
            setCurrentIndex(prev => (prev + 1) % goals.length);
        }
    };

    const prevGoal = () => {
        if (goals.length > 0) {
            setCurrentIndex(prev => (prev - 1 + goals.length) % goals.length);
        }
    };

    if (goals.length === 0) return null;
    
    const goal = goals[currentIndex];
    const Icon = goalIcons[goal.icon] || TargetIcon;
    const style = goalStyleMap[goal.icon] || goalStyleMap['Target'];

    return (
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
                <h3 className="font-bold">اهداف اصلی</h3>
                {goals.length > 1 && (
                    <div className="flex items-center gap-2">
                        <button onClick={prevGoal} className="p-1 rounded-full bg-slate-800/50 hover:bg-slate-700"><ChevronRightIcon className="w-4 h-4" /></button>
                        <button onClick={nextGoal} className="p-1 rounded-full bg-slate-800/50 hover:bg-slate-700"><ChevronLeftIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1 text-sm">
                    <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${style.color}`}/>
                        <span className="font-semibold">{goal.title}</span>
                        {goal.type === 'journey' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">سفر</span>}
                    </div>
                    <span className="font-bold text-slate-300">{goal.progress}%</span>
                 </div>
                 <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full progress-bar-fill" style={{ width: `${goal.progress}%` }}></div>
                 </div>
            </div>
             <div className="flex justify-center items-center gap-2 mt-2">
                {goals.map((_, index) => (
                    <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-violet-500' : 'bg-slate-600 hover:bg-slate-500'}`}></button>
                ))}
            </div>
        </div>
    );
};

const WomenHealthWidget: React.FC<{ onOpen: () => void, userData: OnboardingData }> = ({ onOpen, userData }) => {
    const { cycles, cycleLength, periodLength } = userData.womenHealth;

    const getStatus = () => {
        if (!cycles || cycles.length === 0) {
            return { title: "ردیابی چرخه", subtitle: "برای شروع، دوره خود را ثبت کنید." };
        }
        const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        const lastCycle = sortedCycles[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(lastCycle.startDate);
        
        const dayOfCycle = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

        if (dayOfCycle <= 0) {
            return { title: "ردیابی چرخه", subtitle: "تاریخ شروع دوره معتبر نیست." };
        }

        const currentPeriodLength = lastCycle.endDate 
            ? Math.floor((new Date(lastCycle.endDate).getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1 
            : periodLength;

        if (dayOfCycle <= currentPeriodLength) {
             return { title: `روز ${dayOfCycle} پریود`, subtitle: "مراقب خودت باش." };
        }

        const ovulationDay = cycleLength - 14;
        const fertileStart = ovulationDay - 5;
        const fertileEnd = ovulationDay + 1;

        if (dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd) {
             return { title: `روز ${dayOfCycle} از چرخه`, subtitle: "پنجره باروری فعال است." };
        }
        
        const pmsStart = cycleLength - 7;
        if(dayOfCycle >= pmsStart) {
            return { title: `روز ${dayOfCycle} از چرخه`, subtitle: "روزهای احتمالی PMS." };
        }

        const predictedNextStart = new Date(startDate);
        predictedNextStart.setDate(startDate.getDate() + cycleLength);
        const daysUntilNext = Math.ceil((predictedNextStart.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilNext > 0) {
            return { title: `روز ${dayOfCycle} از چرخه`, subtitle: `${daysUntilNext} روز تا پریود بعدی` };
        }

        return { title: `روز ${dayOfCycle} از چرخه`, subtitle: "دوره جدید را ثبت کنید." };
    };

    const { title, subtitle } = getStatus();

    return (
        <button onClick={onOpen} className="w-full h-full p-4 rounded-[var(--radius-card)] bg-rose-950/60 backdrop-blur-lg border border-rose-800 text-right hover:bg-rose-900/80 transition-colors flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><HealthIcon className="w-6 h-6 text-rose-300" /> {title}</h3>
                <p className="text-sm text-rose-300/80 mt-1">{subtitle}</p>
            </div>
        </button>
    );
};


const BottomNav: React.FC<{ activeView: View; setActiveView: (view: View) => void }> = ({ activeView, setActiveView }) => {
    const navItems: { view: View; icon: React.FC<{ className?: string }>; label: string }[] = [
        { view: 'settings', icon: CogIcon, label: 'تنظیمات' },
        { view: 'goals', icon: TargetIcon, label: 'اهداف' },
        { view: 'dashboard', icon: BenvisLogoIcon, label: 'بنویس' },
        { view: 'finance', icon: FinanceIcon, label: 'مالی' },
        { view: 'assistant', icon: SparklesIcon, label: 'دستیار' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 p-2 z-40">
            <div className="flex justify-around items-center">
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-16 h-16 ${
                            activeView === item.view ? 'text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <item.icon className="w-6 h-6 mb-1"/>
                        <span className={`text-xs ${item.view === 'dashboard' ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const LevelUpModal: React.FC<{ newLevel: number, onSeen: () => void }> = ({ newLevel, onSeen }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop" onClick={onSeen}>
        <div className="bg-slate-900/80 backdrop-blur-lg border border-violet-500 rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center animate-bounce-in">
            <LevelUpIcon className="w-16 h-16 text-violet-400 mb-4" />
            <h2 className="text-3xl font-bold">تبریک!</h2>
            <p className="text-lg text-slate-300 mt-2">شما به سطح <span className="text-violet-400 font-bold">{newLevel}</span> رسیدید!</p>
            <button onClick={onSeen} className="mt-6 bg-violet-600 px-6 py-2 rounded-lg font-semibold">ادامه</button>
        </div>
    </div>
);

const AchievementModal: React.FC<{ achievement: Achievement, onSeen: () => void }> = ({ achievement, onSeen }) => {
    const Icon = achievement.icon;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop" onClick={onSeen}>
            <div className="bg-slate-900/80 backdrop-blur-lg border border-yellow-500 rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center animate-bounce-in">
                <Icon className="w-16 h-16 text-yellow-400 mb-4" />
                <h2 className="text-2xl font-bold text-yellow-300">دست‌آورد جدید!</h2>
                <p className="text-lg font-bold mt-2">{achievement.title}</p>
                <p className="text-sm text-slate-300">{achievement.description}</p>
                <button onClick={onSeen} className="mt-6 bg-yellow-600 px-6 py-2 rounded-lg font-semibold">عالیه!</button>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    userData,
    onUpdateUserData,
    addXp,
    levelUpInfo,
    onLevelUpSeen,
    newAchievements,
    onAchievementsSeen,
}) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isQuietZoneOpen, setIsQuietZoneOpen] = useState(false);
    const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
    const [isWomenHealthOpen, setIsWomenHealthOpen] = useState(false);
    const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false);
    const [isFinancialViewOpen, setIsFinancialViewOpen] = useState(false);
    const [isNightRoutineOpen, setIsNightRoutineOpen] = useState(false);
    const [currentAchievement, setCurrentAchievement] = useState<AchievementID | null>(null);
    const [assistantState, setAssistantState] = useState<{ initialTab: string, initialJournalText: string }>({ initialTab: 'chat', initialJournalText: '' });
    const [greeting, setGreeting] = useState('سلام');
    const [jalaliDate, setJalaliDate] = useState('');


    // --- NEW GRANULAR AI DATA STATE ---
    const [priorities, setPriorities] = useState<string[] | null>(null);
    const [isPrioritiesLoading, setIsPrioritiesLoading] = useState(true);

    const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);

    const [dailyPrompt, setDailyPrompt] = useState<string | null>(null);
    const [isDailyPromptLoading, setIsDailyPromptLoading] = useState(true);
    
    const [predictiveAlert, setPredictiveAlert] = useState<{ title: string; message: string } | null>(null);
    const [isPredictiveAlertLoading, setIsPredictiveAlertLoading] = useState(true);

    const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
    const [isDailyBriefingLoading, setIsDailyBriefingLoading] = useState(true);
    
    const [aiDataError, setAiDataError] = useState<string | null>(null); // For a general error banner

    const { isLowFrictionMode = false } = userData;
    
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('صبح بخیر');
        else if (hour < 18) setGreeting('عصر بخیر');
        else setGreeting('شب بخیر');

        setJalaliDate(new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full' }).format(new Date()));
    }, []);
    
    const { level, xp } = userData;
    const levelProgressPercentage = useMemo(() => {
        let totalXpForPreviousLevels = 0;
        for (let i = 1; i < level; i++) {
            totalXpForPreviousLevels += i * 100;
        }
        const xpInCurrentLevel = xp - totalXpForPreviousLevels;
        const xpRequiredForCurrentLevel = level * 100;
        return xpRequiredForCurrentLevel > 0 
            ? Math.min(100, (xpInCurrentLevel / xpRequiredForCurrentLevel) * 100) 
            : 0;
    }, [level, xp]);

    const handleUpdateLowFrictionMode = (isOn: boolean) => {
        onUpdateUserData({ ...userData, isLowFrictionMode: isOn });
    };

    // --- DECOUPLED AI DATA FETCHING ---
    const fetchWithCache = useCallback(async <T,>(key: string, fetchFn: () => Promise<T>, forceRefresh = false): Promise<T | null> => {
        const todayStr = new Date().toISOString().split('T')[0];
        const cacheKey = `benvis_${key}_${todayStr}`;
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
            } catch (e) { console.warn(`Failed to read ${key} cache`, e); }
        }
        try {
            const result = await fetchFn();
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
        } catch (error) {
            console.error(`Failed to fetch ${key}:`, error);
            throw error;
        }
    }, []);

    const handleError = (error: any): string => {
        const errorString = JSON.stringify(error);
        if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("429")) {
            return "محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.";
        }
        return "خطا در دریافت برخی اطلاعات هوشمند.";
    };

    // New unified fetch function
    const fetchDashboardData = useCallback(async (currentData: OnboardingData, forceRefresh = false) => {
        setIsPrioritiesLoading(true);
        setIsWeatherLoading(true);
        setIsDailyPromptLoading(true);
        setIsPredictiveAlertLoading(true);
        setIsDailyBriefingLoading(true);
        setAiDataError(null);

        let location: { lat: number; lon: number } | null = null;
        let localWeatherError: string | null = null;
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
            location = { lat: position.coords.latitude, lon: position.coords.longitude };
        } catch (e) {
            localWeatherError = "مکان‌یابی برای دریافت آب و هوا فعال نیست.";
            setWeatherError(localWeatherError);
        }

        try {
            const result = await fetchWithCache('dashboard_data', async () => {
                const { goals, habits, calendarEvents = [] } = currentData;
                const goalsInfo = goals.filter(g => g.progress < 100).map(g => `- "${g.title}" (Progress: ${g.progress}%)`).join('\n') || 'No active goals.';
                const habitsInfo = habits.map(h => `- "${h.name}"`).join('\n') || 'No habits to track.';
                const todayStr = new Date().toISOString().split('T')[0];
                const todayEvents = calendarEvents.filter(e => e.date === todayStr).map(e => `- ${e.time || ''}: ${e.text}`).join('\n') || 'No events scheduled.';
                const upcomingGoals = goals.filter(g => g.targetDate && g.targetDate >= todayStr && g.progress < 100).map(g => `- '${g.title}' is at ${g.progress}%`).join('\n') || 'No goals with upcoming deadlines.';
                
                const prompt = `
                    You are the Benvis AI dashboard generator. Based on the user's data and location, generate all the necessary data for the dashboard in a single JSON response.

                    User Context:
                    - Active Goals: ${goalsInfo}
                    - Habits to Track: ${habitsInfo}
                    - Today's Calendar: ${todayEvents}
                    - Upcoming Goals: ${upcomingGoals}
                    - Location: ${location ? `Latitude ${location.lat}, Longitude ${location.lon}` : 'Not provided.'}

                    Generate the following data points:
                    1.  **priorities**: An array of 3 most impactful priority strings for today.
                    2.  **weather**: A simple weather report object { "temp": number, "condition": "string" }. If location is not provided, return null for this field.
                    3.  **dailyPrompt**: A single, unique, insightful journal prompt string.
                    4.  **predictiveAlert**: An object { "title": "string", "message": "string" } predicting a potential productivity blocker for today.
                    5.  **dailyBriefing**: A concise, motivational daily briefing string in Markdown format.

                    Respond ONLY with a valid JSON object matching the schema. All text must be in Persian.
                `;

                const dashboardDataSchema = {
                    type: Type.OBJECT,
                    properties: {
                        priorities: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                        weather: {
                            type: Type.OBJECT,
                            properties: { temp: { type: Type.NUMBER }, condition: { type: Type.STRING } },
                            nullable: true
                        },
                        dailyPrompt: { type: Type.STRING, nullable: true },
                        predictiveAlert: {
                            type: Type.OBJECT,
                            properties: { title: { type: Type.STRING }, message: { type: Type.STRING } },
                            nullable: true
                        },
                        dailyBriefing: { type: Type.STRING, nullable: true }
                    }
                };
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: dashboardDataSchema }
                });

                return JSON.parse(response.text.trim());
            }, forceRefresh);

            if (result) {
                setPriorities(result.priorities || null);
                setWeather(result.weather || null);
                setDailyPrompt(result.dailyPrompt || null);
                setPredictiveAlert(result.predictiveAlert || null);
                setDailyBriefing(result.dailyBriefing || null);
                if (!result.weather && localWeatherError) {
                    setWeatherError(localWeatherError);
                } else {
                    setWeatherError(null);
                }
            }
        } catch (error) {
            setAiDataError(handleError(error));
        } finally {
            setIsPrioritiesLoading(false);
            setIsWeatherLoading(false);
            setIsDailyPromptLoading(false);
            setIsPredictiveAlertLoading(false);
            setIsDailyBriefingLoading(false);
        }
    }, [fetchWithCache]);
    
    useEffect(() => {
        fetchDashboardData(userData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDailyPromptClick = (prompt: string) => {
        setAssistantState({ initialTab: 'journal', initialJournalText: prompt });
        setActiveView('assistant');
    };

    useEffect(() => {
        if (newAchievements.length > 0 && !currentAchievement) {
            setCurrentAchievement(newAchievements[0]);
        }
    }, [newAchievements, currentAchievement]);
    
    const handleAchievementSeen = () => {
        const remaining = newAchievements.slice(1);
        onAchievementsSeen(); // Clear from parent
        setCurrentAchievement(remaining[0] || null);
    };

    useEffect(() => {
        if (activeView === 'finance') {
            setIsFinancialViewOpen(true);
            // After opening the modal, we don't want to be on a blank 'finance' view.
            // Let's return to the dashboard view so the modal appears over it.
            setActiveView('dashboard');
        }
    }, [activeView]);

    const renderView = () => {
        switch (activeView) {
            case 'goals':
                return <GoalsView userData={userData} onUpdateUserData={onUpdateUserData} addXp={addXp} />;
            case 'finance':
                 // This case is now safe, it just returns null. The side effect is handled in useEffect.
                return null;
            case 'settings':
                return <SettingsView userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'assistant':
                return <SmartAssistantView userData={userData} onUpdateUserData={onUpdateUserData} initialTab={assistantState.initialTab} initialJournalText={assistantState.initialJournalText} />;
            default:
                return null;
        }
    };
    
    return (
        <div className={`p-4 pb-24 min-h-screen relative ${isLowFrictionMode ? 'low-friction-mode' : ''}`}>
            {levelUpInfo && <LevelUpModal newLevel={levelUpInfo.newLevel} onSeen={onLevelUpSeen} />}
            {currentAchievement && ALL_ACHIEVEMENTS[currentAchievement] && (
                <AchievementModal achievement={ALL_ACHIEVEMENTS[currentAchievement]} onSeen={handleAchievementSeen} />
            )}

            {activeView !== 'dashboard' ? (
                <div className="pb-4">{renderView()}</div>
            ) : (
                <>
                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">{greeting}, {userData.fullName.split(' ')[0]}</h1>
                            <p className="text-slate-400 text-sm">{jalaliDate}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setIsWeeklyReviewOpen(true)} className="p-3 bg-slate-800/60 border border-slate-700 rounded-full hover:bg-slate-800" title="مرور هفتگی">
                                <DocumentChartBarIcon className="w-6 h-6"/>
                            </button>
                             <button onClick={() => setIsQuietZoneOpen(true)} className="p-3 bg-slate-800/60 border border-slate-700 rounded-full hover:bg-slate-800" title="حالت تمرکز">
                                <MoonIcon className="w-6 h-6"/>
                            </button>
                             <button onClick={() => setIsNightRoutineOpen(true)} className="p-3 bg-slate-800/60 border border-slate-700 rounded-full hover:bg-slate-800" title="روتین شبانه">
                                <StarIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </header>
                    <BenvisWidget userData={userData} onUpdateUserData={onUpdateUserData} />
                    
                    {aiDataError && (
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-300 text-center">
                            {aiDataError}
                        </div>
                    )}
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <DailyBriefingWidget briefing={dailyBriefing} isLoading={isDailyBriefingLoading} onRefresh={() => fetchDashboardData(userData, true)} />
                        {!isLowFrictionMode && <StatsSummaryWidget userData={userData} />}
                        {!isLowFrictionMode && <TodaysPrioritiesWidget priorities={priorities} isLoading={isPrioritiesLoading} />}
                        {!isLowFrictionMode && <HabitTrackerWidget userData={userData} onUpdateUserData={onUpdateUserData} addXp={addXp} />}
                        {!isLowFrictionMode && <GoalsWidget goals={userData.goals.filter(g => g.progress < 100)} />}
                        {!isLowFrictionMode && <WeatherAndCalendarWidget onOpen={() => setIsCalendarViewOpen(true)} weather={weather} isLoading={isWeatherLoading} weatherError={weatherError} />}
                        {!isLowFrictionMode && <DailyPromptWidget prompt={dailyPrompt} isLoading={isDailyPromptLoading} onRefresh={() => fetchDashboardData(userData, true)} onPromptClick={handleDailyPromptClick} />}
                        {!isLowFrictionMode && userData.gender === 'female' && <WomenHealthWidget onOpen={() => setIsWomenHealthOpen(true)} userData={userData} />}
                        {!isLowFrictionMode && <FinancialWidget userData={userData} onOpen={() => setIsFinancialViewOpen(true)} />}
                        {!isLowFrictionMode && <MoodWeatherWidget />}
                        {!isLowFrictionMode && <EnergyPredictionWidget userData={userData} />}
                        {!isLowFrictionMode && <PredictiveAlertsWidget alert={predictiveAlert} isLoading={isPredictiveAlertLoading} onToggleMode={handleUpdateLowFrictionMode} />}
                        {!isLowFrictionMode && <FinancialInsightsWidget userData={userData} />}
                    </div>
                </>
            )}

            {isQuietZoneOpen && <QuietZoneView goals={userData.goals} onUpdateGoals={(goals) => onUpdateUserData({...userData, goals})} onClose={() => setIsQuietZoneOpen(false)} addXp={addXp} />}
            {isWeeklyReviewOpen && <WeeklyReviewView userData={userData} onClose={() => setIsWeeklyReviewOpen(false)} />}
            {isWomenHealthOpen && <WomenHealthView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsWomenHealthOpen(false)} />}
            {isCalendarViewOpen && <CalendarView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsCalendarViewOpen(false)} />}
            {isFinancialViewOpen && <FinancialView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsFinancialViewOpen(false)} />}
            {isNightRoutineOpen && <NightRoutineView userData={userData} onClose={() => setIsNightRoutineOpen(false)} />}

            <BottomNav activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
};

export default DashboardScreen;
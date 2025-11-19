
import React, { useState, useEffect } from 'react';
import { OnboardingData, AchievementID, UserGoal, CalendarEvent, Transaction, StandaloneTask } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    TargetIcon, MoonIcon, CalendarIcon, FinanceIcon, 
    SparklesIcon, CogIcon, TrophyIcon,
    ArrowLeftIcon, goalIcons, QueueListIcon,
    Squares2X2Icon, ChartPieIcon, UserCircleIcon, ArrowUpIcon,
    LevelUpIcon, HealthIcon, AcademicCapIcon, MicrophoneIcon,
    MagnifyingGlassIcon, CheckCircleIcon, PlusIcon, SunIcon, BenvisLogoIcon
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

// Import Widgets
import StatsSummaryWidget from './StatsSummaryWidget';
import MoodWeatherWidget from './MoodWeatherWidget';
import EnergyPredictionWidget from './EnergyPredictionWidget';
import DailyBriefingWidget from './DailyBriefingWidget';
import DailyPromptWidget from './DailyPromptWidget';
import FinancialWidget from './FinancialWidget';
import SmartNotificationWidget from './SmartNotificationWidget';
import PredictiveAlertsWidget from './PredictiveAlertsWidget';
import HabitReschedulerWidget from './HabitReschedulerWidget';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface DashboardScreenProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
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
    'eisenhower' | 'timeBlocking' | 'lifeWheel';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    userData, onUpdateUserData, addXp, levelUpInfo, onLevelUpSeen, newAchievements, onAchievementsSeen 
}) => {
    const [activeView, setActiveView] = useState<ViewState>('dashboard');
    const [commandInput, setCommandInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [briefing, setBriefing] = useState<string | null>(null);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [dailyPrompt, setDailyPrompt] = useState<string | null>(null);
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

    // Helper to load briefing manually to save quota
    const loadBriefing = async () => {
        setIsBriefingLoading(true);
        try {
            const now = new Date();
            const hour = now.getHours();
            let timeContext = "Morning";
            if (hour >= 12 && hour < 17) timeContext = "Afternoon";
            if (hour >= 17) timeContext = "Evening";

            const pendingTasks = (userData.tasks || []).filter(t => !t.completed).map(t => t.title).join(', ');
            const todayEvents = (userData.calendarEvents || []).filter(e => e.date === now.toISOString().split('T')[0]).map(e => `${e.time || ''} ${e.text}`).join(', ');
            const activeGoals = (userData.goals || []).filter(g => g.progress < 100).slice(0, 3).map(g => g.title).join(', ');

            const prompt = `
                Generate a very short, encouraging ${timeContext} briefing in Persian.
                Context: Tasks: ${pendingTasks || "None"}, Events: ${todayEvents || "None"}, Goals: ${activeGoals}.
                Max 40 words.
            `;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setBriefing(response.text.trim());
        } catch (e) {
            console.error("Briefing error", e);
            // Fallback briefing on error
            setBriefing("امروز فرصتی عالی برای پیشرفت است. روی اهداف اصلی خود تمرکز کنید."); 
        } finally {
            setIsBriefingLoading(false);
        }
    };

    const loadPrompt = async () => {
        setIsPromptLoading(true);
        try {
            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: "Generate one short, unique journaling prompt in Persian for self-reflection." 
            });
            setDailyPrompt(response.text.trim());
        } catch(e) {
            console.error(e);
            setDailyPrompt("امروز چه چیزی به تو انرژی داد؟"); // Fallback
        } finally {
            setIsPromptLoading(false);
        }
    };

    // Initial load - Use timeout to not block render, and maybe skip to save quota if needed
    useEffect(() => {
        // Optional: Uncomment to auto-load, or leave for user to click refresh
        // setTimeout(() => { loadBriefing(); loadPrompt(); }, 1000); 
    }, []); 

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("مرورگر شما از قابلیت تبدیل گفتار به نوشتار پشتیبانی نمی‌کند.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
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

    // Fallback parser when AI fails
    const fallbackParse = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('هدف') || lower.includes('goal')) return { intent: 'create_goal', data: { title: text.replace(/هدف/g, '').trim() } };
        if (lower.includes('بخر') || lower.includes('خرید') || lower.includes('هزینه') || lower.includes('تومان') || lower.includes('خرج')) return { intent: 'add_transaction', data: { title: text, amount: 0, type: 'expense' } };
        if (lower.includes('جلسه') || lower.includes('قرار') || lower.includes('رویداد') || lower.includes('فردا') || lower.includes('امروز')) return { intent: 'add_event', data: { title: text } };
        if (lower.includes('چت') || lower.includes('سوال') || lower.includes('کمک')) return { intent: 'chat', data: {} };
        return { intent: 'add_task', data: { title: text } };
    };

    const handleCommandSubmit = async () => {
        if (!commandInput.trim()) return;
        setIsProcessing(true);
        setSuccessFeedback(null);
        
        let result;
        
        try {
            const prompt = `
                Parse Persian input: "${commandInput}" to JSON.
                Intents: "create_goal", "add_task", "add_transaction", "add_event", "chat".
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
                    setSuccessFeedback('رویداد ثبت شد');
                    break;
                }
                case 'chat':
                    setActiveView('assistant');
                    break;
                default: {
                    // Default to task if intent is weird
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return "شب بخیر";
        if (hour < 12) return "صبح بخیر";
        if (hour < 18) return "ظهر بخیر";
        return "عصر بخیر";
    };

    const renderDashboard = () => {
        const activeGoalsCount = (userData.goals || []).filter(g => g.progress < 100).length;
        const pendingTasksCount = (userData.tasks || []).filter(t => !t.completed).length;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEventsCount = (userData.calendarEvents || []).filter(e => e.date === todayStr).length;
        const todayTransactionsCount = (userData.transactions || []).filter(t => t.date === todayStr).length;

        // iOS Style Tiles
        const tiles = [
            { id: 'goals', label: 'اهداف', icon: TargetIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', count: activeGoalsCount },
            { id: 'focus', label: 'تمرکز', icon: MoonIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', count: pendingTasksCount },
            { id: 'calendar', label: 'تقویم', icon: CalendarIcon, color: 'text-red-400', bg: 'bg-red-500/10', count: todayEventsCount }, // Apple Calendar red
            { id: 'finance', label: 'مالی', icon: FinanceIcon, color: 'text-green-400', bg: 'bg-green-500/10', count: todayTransactionsCount },
            { id: 'assistant', label: 'دستیار', icon: SparklesIcon, color: 'text-purple-400', bg: 'bg-purple-500/10', count: 0 },
            { id: 'eisenhower', label: 'اولویت', icon: Squares2X2Icon, color: 'text-orange-400', bg: 'bg-orange-500/10', count: pendingTasksCount },
            { id: 'timeBlocking', label: 'زمان', icon: QueueListIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10', count: 0 },
            { id: 'lifeWheel', label: 'چرخ', icon: ChartPieIcon, color: 'text-pink-400', bg: 'bg-pink-500/10', count: 0 },
        ];

        if (userData.gender === 'female') {
            tiles.push({ id: 'womenHealth', label: 'چرخه', icon: HealthIcon, color: 'text-rose-400', bg: 'bg-rose-500/10', count: 0 });
        }
        tiles.push({ id: 'social', label: 'حلقه‌ها', icon: UserCircleIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10', count: 0 });
        tiles.push({ id: 'microCourse', label: 'دوره', icon: AcademicCapIcon, color: 'text-teal-400', bg: 'bg-teal-500/10', count: 0 });
        tiles.push({ id: 'shop', label: 'جایزه', icon: TrophyIcon, color: 'text-amber-400', bg: 'bg-amber-500/10', count: 0 });

        const today = new Date();
        const dayNum = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(today);
        const monthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(today);
        const dayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(today);

        const TileButton: React.FC<{ item: any }> = ({ item }) => (
            <button 
                onClick={() => setActiveView(item.id as ViewState)}
                className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl backdrop-blur-md border border-white/5 transition-all duration-300 aspect-square ${item.bg} hover:bg-white/10 active:scale-95`}
            >
                <div className="relative">
                    <item.icon className={`w-8 h-8 mb-2 transition-transform group-hover:scale-110 ${item.color}`} />
                    {item.count > 0 && (
                        <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm border border-[#020617] animate-badge-pop z-10">
                            {item.count}
                        </span>
                    )}
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">{item.label}</span>
            </button>
        );

        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 18;

        return (
            <div className="space-y-6 animate-fadeIn pb-24">
                {/* Apple-Style Dynamic Header */}
                <div className="pt-2 px-1">
                     {/* Top Row: Settings & Logo */}
                     <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={() => setActiveView('settings')} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-xl transition-colors shadow-lg">
                            <CogIcon className="w-6 h-6 text-slate-200" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-tight text-white">Benvis</span>
                            <BenvisLogoIcon className="w-8 h-8" />
                        </div>
                     </div>

                     {/* Hero Cards: Date & Weather - Apple Style Glow */}
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Date Card */}
                        <div className="bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] aspect-square flex flex-col items-center justify-center text-center shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                             {/* Glass Shine Effect */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                             <div className="relative z-10 flex flex-col items-center">
                                 <span className="text-sm font-bold text-[#ff3b30] uppercase tracking-widest mb-0.5 drop-shadow-sm">{dayName}</span>
                                 <span className="text-[5.5rem] font-medium text-white tracking-tighter leading-none drop-shadow-2xl">{dayNum}</span>
                                 <span className="text-lg text-slate-400 mt-1 font-medium">{monthName}</span>
                             </div>
                        </div>

                        {/* Greeting/Weather Card */}
                        <div className={`backdrop-blur-3xl border border-white/10 rounded-[2.5rem] aspect-square flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-all duration-500
                             ${isNight 
                                ? 'bg-gradient-to-b from-[#2e1065] to-[#0f172a] shadow-[0_0_40px_-5px_rgba(99,102,241,0.4)] border-indigo-500/20' 
                                : 'bg-gradient-to-b from-[#fbbf24] to-[#ea580c] shadow-[0_0_40px_-5px_rgba(251,146,60,0.5)] border-orange-400/30'
                             }`}>
                             
                             {/* Ambient Glow Orb */}
                             <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-full blur-3xl opacity-40 animate-pulse ${isNight ? 'bg-indigo-500' : 'bg-yellow-300'}`}></div>

                             <div className="relative z-10 flex flex-col items-center">
                                 {isNight ? (
                                    <MoonIcon className="w-16 h-16 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] mb-3" />
                                 ) : (
                                    <SunIcon className="w-16 h-16 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] mb-3" />
                                 )}
                                 <span className="text-xl font-bold text-white drop-shadow-md whitespace-nowrap">{getGreeting()}</span>
                                 <span className="text-xs text-white/80 mt-1 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 max-w-[120px] truncate">
                                     {userData.fullName}
                                 </span>
                             </div>
                        </div>
                     </div>

                     {/* Spotlight Search Input */}
                     <div className="relative z-20 group mx-1">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30 rounded-2xl blur opacity-30 group-focus-within:opacity-70 transition duration-500"></div>
                        <div className="relative flex items-center bg-[#1c1c1e]/90 backdrop-blur-xl rounded-2xl border border-white/10 px-4 py-4 shadow-2xl transition-all">
                            <MagnifyingGlassIcon className="w-6 h-6 text-slate-400 ml-3" />
                            <input 
                                type="text" 
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                                placeholder={successFeedback ? "" : "از بنویس بخواهید (مثلا: جلسه فردا)"}
                                className="flex-grow bg-transparent text-white placeholder-slate-500 outline-none text-lg font-normal"
                                disabled={isProcessing}
                            />
                            {successFeedback && (
                                <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none backdrop-blur-md rounded-2xl bg-black/40">
                                    <div className="flex items-center gap-2 text-green-400 text-sm font-bold animate-bounce-in">
                                        <CheckCircleIcon className="w-5 h-5"/>
                                        {successFeedback}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 border-r border-white/10 pr-3 mr-1">
                                <button 
                                    onClick={handleVoiceInput}
                                    className={`transition-all ${isListening ? 'text-red-500 animate-pulse scale-110' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                                {commandInput.trim() && (
                                    <button 
                                        onClick={handleCommandSubmit}
                                        disabled={isProcessing}
                                        className="bg-blue-600 text-white p-1.5 rounded-full animate-fadeIn"
                                    >
                                        <ArrowUpIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                     </div>
                </div>

                {/* App Grid */}
                <div className="grid grid-cols-4 gap-4 px-2 mt-6">
                    {tiles.map(item => <TileButton key={item.id} item={item} />)}
                </div>

                {/* Widgets - Lazy Loaded to prevent 429 */}
                <div className="space-y-4 px-1 mt-4">
                     {/* Summary Row */}
                     <StatsSummaryWidget userData={userData} />

                    <div className="grid grid-cols-2 gap-4">
                        <DailyBriefingWidget briefing={briefing} isLoading={isBriefingLoading} onRefresh={loadBriefing} />
                        <MoodWeatherWidget />
                        <EnergyPredictionWidget userData={userData} />
                        <FinancialWidget userData={userData} onOpen={() => setActiveView('finance')} />
                        <DailyPromptWidget prompt={dailyPrompt} isLoading={isPromptLoading} onRefresh={loadPrompt} onPromptClick={() => setActiveView('assistant')} />
                        <SmartNotificationWidget userData={userData} />
                        <HabitReschedulerWidget userData={userData} onUpdateUserData={onUpdateUserData} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#000000] text-slate-200 p-4 md:p-6 max-w-4xl mx-auto relative font-[Vazirmatn]">
             {levelUpInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fadeIn" onClick={onLevelUpSeen}>
                    <div className="text-center animate-bounce-in bg-[#1c1c1e] p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none"></div>
                         <LevelUpIcon className="w-32 h-32 text-yellow-400 mx-auto mb-6 filter drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
                         <h2 className="text-5xl font-black text-white mb-2 tracking-tight">تبریک!</h2>
                         <p className="text-2xl text-yellow-300 font-medium">سطح {levelUpInfo.newLevel}</p>
                         <p className="text-slate-400 mt-8 text-sm opacity-80">برای ادامه ضربه بزنید</p>
                    </div>
                </div>
            )}

            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'goals' && <GoalsView userData={userData} onUpdateUserData={onUpdateUserData} addXp={addXp} />}
            {activeView === 'focus' && <QuietZoneView goals={userData.goals || []} onUpdateGoals={(g) => onUpdateUserData({...userData, goals: g})} onClose={() => setActiveView('dashboard')} addXp={addXp} />}
            {activeView === 'calendar' && <CalendarView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
            {activeView === 'finance' && <FinancialView userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setActiveView('dashboard')} />}
            {activeView === 'assistant' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                         <button onClick={() => setActiveView('dashboard')} className="flex items-center text-slate-400 hover:text-white transition-colors">
                            <ArrowLeftIcon className="w-6 h-6 mr-2" /> بازگشت
                        </button>
                        <h2 className="font-bold text-lg">دستیار هوشمند</h2>
                    </div>
                    <SmartAssistantView userData={userData} onUpdateUserData={onUpdateUserData} />
                </div>
            )}
            {activeView === 'settings' && (
                 <div className="pb-20">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setActiveView('dashboard')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeftIcon className="w-6 h-6" /></button>
                        <h2 className="text-xl font-bold">تنظیمات</h2>
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
        </div>
    );
};

export default DashboardScreen;

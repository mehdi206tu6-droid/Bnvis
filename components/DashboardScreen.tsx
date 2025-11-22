
import React, { useState } from 'react';
import { OnboardingData, AchievementID, UserGoal, CalendarEvent, Transaction, StandaloneTask } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    TargetIcon, MoonIcon, CalendarIcon, FinanceIcon, 
    SparklesIcon, CogIcon, TrophyIcon,
    Squares2X2Icon, ChartPieIcon, UserCircleIcon,
    AcademicCapIcon, MicrophoneIcon,
    MagnifyingGlassIcon, BookOpenIcon,
    QueueListIcon, CheckCircleIcon,
    HealthIcon,
    ShoppingBagIcon,
    HeartIcon
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
    'eisenhower' | 'timeBlocking' | 'lifeWheel' | 'books' | 'healthWellness';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    userData, onUpdateUserData, addXp, levelUpInfo, onLevelUpSeen, newAchievements, onAchievementsSeen 
}) => {
    const [activeView, setActiveView] = useState<ViewState>('dashboard');
    const [commandInput, setCommandInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return "شب بخیر";
        if (hour < 12) return "صبح بخیر";
        if (hour < 18) return "ظهر بخیر";
        return "عصر بخیر";
    };

    const getPersianDate = () => {
        const now = new Date();
        const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(now);
        const dayNumber = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(now);
        const monthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(now);
        return { dayName, dayNumber, monthName };
    };

    const { dayName, dayNumber, monthName } = getPersianDate();

    // --- Notification Counters (Badges) ---
    const getGoalCount = () => (userData.goals || []).filter(g => g.progress < 100).length;
    const getEventCount = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        return (userData.calendarEvents || []).filter(e => e.date >= todayStr).length;
    };
    const getTaskCount = () => (userData.tasks || []).filter(t => !t.completed).length;
    const getBookCount = () => (userData.books || []).filter(b => b.status === 'reading').length;

    // --- Render Main Dashboard ---
    const renderDashboard = () => {
        return (
            <div className="space-y-6 animate-fadeIn pb-32 px-5 pt-8">
                
                {/* Header Row */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2">
                       <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                           <span className="text-white font-bold text-sm">+</span>
                       </div>
                       <span className="font-black text-white tracking-tight text-lg">Benvis</span>
                    </div>
                    <button onClick={() => setActiveView('settings')} className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300 hover:text-white border border-white/10 hover:bg-white/10 transition-all">
                        <CogIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Cards Row */}
                <div className="grid grid-cols-2 gap-4 h-44">
                    {/* Greeting Card */}
                    <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-[2rem] p-5 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-2xl shadow-indigo-900/30 group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-3 p-3 bg-white/10 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-500">
                                <MoonIcon className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">{getGreeting()}</h2>
                            <p className="text-indigo-100 text-sm mt-1 font-medium opacity-90">{userData.fullName || 'دوست من'}</p>
                        </div>
                    </div>

                    {/* Date Card */}
                    <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] p-5 flex flex-col justify-center items-center text-center shadow-lg border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-tr-full"></div>
                        
                        <span className="text-rose-500 font-bold text-xl mb-[-8px] drop-shadow-sm">{dayName}</span>
                        <span className="text-[5.5rem] font-black text-white leading-none my-0 tracking-tighter scale-110 group-hover:scale-125 transition-transform duration-500">{dayNumber}</span>
                        <span className="text-slate-400 font-bold text-lg mt-[-5px]">{monthName}</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group z-20">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
                    <div className="relative flex items-center bg-[#0f172a] rounded-2xl px-4 py-4 border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3 flex-grow">
                            <button onClick={handleVoiceInput} className={`transition-all p-2 rounded-xl hover:bg-white/5 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-white'}`}>
                                <MicrophoneIcon className="w-5 h-5" />
                            </button>
                            <input 
                                type="text" 
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                                placeholder={successFeedback ? successFeedback : "بنویس... (مثلا: حالم خوب نیست، جلسه فردا)"}
                                className={`bg-transparent text-white placeholder-slate-500 outline-none text-base w-full font-medium ${successFeedback ? 'text-green-400' : ''}`}
                                disabled={isProcessing}
                            />
                        </div>
                        {isProcessing ? <SparklesIcon className="w-5 h-5 text-violet-500 animate-spin" /> : <MagnifyingGlassIcon className="w-6 h-6 text-slate-500" />}
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                    <GridItem icon={FinanceIcon} label="مالی" color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" onClick={() => setActiveView('finance')} />
                    <GridItem icon={CalendarIcon} label="تقویم" color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" onClick={() => setActiveView('calendar')} badge={getEventCount()} />
                    <GridItem icon={MoonIcon} label="تمرکز" color="text-violet-400" bg="bg-violet-500/10" border="border-violet-500/20" onClick={() => setActiveView('focus')} />
                    <GridItem icon={TargetIcon} label="اهداف" color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" onClick={() => setActiveView('goals')} badge={getGoalCount()} />
                    
                    <GridItem icon={QueueListIcon} label="زمان" color="text-teal-400" bg="bg-teal-500/10" border="border-teal-500/20" onClick={() => setActiveView('timeBlocking')} badge={getTaskCount()} />
                    <GridItem icon={Squares2X2Icon} label="اولویت" color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" onClick={() => setActiveView('eisenhower')} />
                    <GridItem icon={SparklesIcon} label="دستیار" color="text-fuchsia-400" bg="bg-fuchsia-500/10" border="border-fuchsia-500/20" onClick={() => setActiveView('assistant')} />
                    <GridItem icon={BookOpenIcon} label="کتاب‌باز" color="text-yellow-400" bg="bg-yellow-500/10" border="border-yellow-500/20" onClick={() => setActiveView('books')} badge={getBookCount()} />
                    
                    <GridItem icon={HeartIcon} label="کلینیک" color="text-teal-300" bg="bg-teal-500/10" border="border-teal-500/20" onClick={() => setActiveView('healthWellness')} />
                    <GridItem icon={UserCircleIcon} label="حلقه‌ها" color="text-lime-400" bg="bg-lime-500/10" border="border-lime-500/20" onClick={() => setActiveView('social')} />
                    <GridItem icon={HealthIcon} label="چرخه" color="text-rose-400" bg="bg-rose-500/10" border="border-rose-500/20" onClick={() => setActiveView('womenHealth')} />
                    <GridItem icon={ChartPieIcon} label="چرخ" color="text-pink-400" bg="bg-pink-500/10" border="border-pink-500/20" onClick={() => setActiveView('lifeWheel')} />

                    <div className="col-start-1">
                         <GridItem icon={AcademicCapIcon} label="دوره" color="text-cyan-400" bg="bg-cyan-500/10" border="border-cyan-500/20" onClick={() => setActiveView('microCourse')} />
                    </div>
                    <div className="col-start-4">
                         <GridItem icon={ShoppingBagIcon} label="جایزه" color="text-yellow-300" bg="bg-yellow-500/10" border="border-yellow-500/20" onClick={() => setActiveView('shop')} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-[Vazirmatn] relative overflow-hidden selection:bg-violet-500/30">
             {/* Background Ambient Glows */}
             <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

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
                     <div className="p-4 pb-24">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setActiveView('dashboard')} className="flex items-center text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
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
            </div>
        </div>
    );
};

const GridItem: React.FC<{ icon: React.FC<{className?: string}>, label: string, color: string, bg: string, border?: string, onClick: () => void, badge?: number }> = ({ icon: Icon, label, color, bg, border, onClick, badge }) => (
    <button 
        onClick={onClick} 
        className="flex flex-col items-center justify-center gap-2.5 group relative"
    >
        <div className={`
            w-full aspect-square rounded-[1.5rem] ${bg} ${border ? border : 'border-white/5'} border 
            flex items-center justify-center 
            transition-all duration-300 
            active:scale-95 hover:bg-opacity-40 hover:scale-105 hover:shadow-lg hover:shadow-white/5
            relative overflow-hidden
        `}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Icon className={`w-8 h-8 ${color} drop-shadow-md transition-transform duration-300 group-hover:scale-110`} />
            
            {/* Notification Badge */}
            {badge && badge > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-red-400 animate-bounce-in">
                    {badge > 9 ? '9+' : badge}
                </div>
            )}
        </div>
        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </button>
);

export default DashboardScreen;

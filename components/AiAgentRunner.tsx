import React, { useState, useEffect } from 'react';
import { Agent, OnboardingData, Note, CalendarEvent } from '../types';
import { GoogleGenAI } from '@google/genai';
import { 
    SparklesIcon, ChevronRightIcon, CalendarIcon, PencilIcon, MoonIcon, HabitsIcon,
    ClockIcon, TargetIcon, FinanceIcon, ReceiptPercentIcon, BoltIcon, BriefcaseIcon,
    FaceSmileIcon, UserIcon, BrainIcon, DocumentTextIcon, ChartBarIcon, LockOpenIcon, LockClosedIcon, ClipboardIcon,
    MagnifyingGlassIcon
} from './icons';

interface AiAgentRunnerProps {
    agent: Agent;
    onBack: () => void;
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fieldMetadata: Record<string, { label: string; description: string; icon: React.FC<any> }> = {
    date: { label: 'تاریخ تحلیل', description: 'تاریخی که هوش مصنوعی برای تحلیل در نظر می‌گیرد.', icon: CalendarIcon },
    journalText: { label: 'یادداشت‌های امروز', description: 'محتوای یادداشت‌های شما از امروز به طور خودکار وارد شده است.', icon: PencilIcon },
    sleepHours: { label: 'ساعات خواب', description: 'تعداد ساعاتی که شب گذشته خوابیده‌اید.', icon: MoonIcon },
    habitCompletions: { label: 'وضعیت عادت‌ها', description: 'لیست عادت‌هایی که امروز انجام داده‌اید یا نداده‌اید.', icon: HabitsIcon },
    activitiesSummary: { label: 'خلاصه فعالیت‌ها', description: 'رویدادهای ثبت شده در تقوim شما برای امروز.', icon: ClockIcon },
    activeGoals: { label: 'اهداف فعال', description: 'اهدافی که هنوز در حال تلاش برای رسیدن به آن‌ها هستید.', icon: TargetIcon },
    transactions: { label: 'تراکنش‌های مالی اخیر', description: 'لیست تراکنش‌های مالی شما در ۶۰ روز گذشته.', icon: FinanceIcon },
    budgets: { label: 'بودجه‌ها', description: 'بودجه‌های ماهانه تعریف شده برای دسته‌بندی‌های مختلف.', icon: ReceiptPercentIcon },
    energyEstimate: { label: 'سطح انرژی تخمینی', description: 'سطح انرژی خود را برای امروز انتخاب کنید.', icon: BoltIcon },
    workload: { label: 'حجم کاری', description: 'حجم کاری امروز خود را انتخاب کنید.', icon: BriefcaseIcon },
    mood: { label: 'وضعیت خلقی', description: 'وضعیت خلقی فعلی خود را انتخاب کنید.', icon: FaceSmileIcon },
    goals: { label: 'تمام اهداف شما', description: 'لیست کامل اهداف فعال و تکمیل شده شما.', icon: TargetIcon },
    habits: { label: 'تمام عادت‌های شما', description: 'لیست کامل عادت‌های خوب و بدی که دنبال می‌کنید.', icon: HabitsIcon },
    stressLevel: { label: 'سطح استرس', description: 'سطح استرس خود را از ۰ تا ۱۰ مشخص کنید.', icon: BrainIcon },
    text: { label: 'متن ورودی', description: 'متنی که می‌خواهید توسط هوش مصنوعی تحلیل شود را وارد کنید.', icon: DocumentTextIcon },
    pastMonthSummary: { label: 'خلاصه ماه گذشته', description: 'خلاصه‌ای از پیشرفت اهداف و رویدادهای مهم ماه گذشته.', icon: ChartBarIcon },
    selectedIdentity: { label: 'هویت انتخابی', description: 'هویتی که می‌خواهید بسازید را مشخص کنید (مثلا: نویسنده، ورزشکار).', icon: UserIcon },
    target_behavior: { label: 'رفتار هدف', description: 'رفتار نهایی که می‌خواهید به آن برسید را توصیف کنید.', icon: TargetIcon },
    current_habits: { label: 'عادت‌های فعلی', description: 'عادت‌هایی که در حال حاضر دارید و به این هدف مرتبط هستند.', icon: HabitsIcon },
    blockers: { label: 'موانع', description: 'موانع و مشکلاتی که برای رسیدن به این هدف با آن‌ها روبرو هستید.', icon: DocumentTextIcon },
    primary_issue: { label: 'مسئله اصلی', description: 'مشکل یا چالشی که می‌خواهید روی آن کار کنید.', icon: BrainIcon },
    preferred_time: { label: 'زمان ترجیحی (دقیقه)', description: 'مدت زمانی که می‌خواهید برای این روتین صرف کنید.', icon: ClockIcon },
};

const ResultSkeleton: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        <h3 className="font-semibold text-slate-300">خروجی</h3>
        <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4 ml-4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2 ml-4"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3 ml-4"></div>
        </div>
    </div>
);

const ResultDisplay: React.FC<{ jsonString: string }> = ({ jsonString }) => {
    const [copied, setCopied] = useState(false);
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch {
        return <pre className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 text-sm text-red-400 overflow-x-auto"><code>خطا در نمایش خروجی.</code></pre>;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderJson = (data: any): React.ReactNode => {
        if (typeof data !== 'object' || data === null) {
            const isString = typeof data === 'string';
            const textToShow = JSON.stringify(data);
            return <span className={isString ? 'text-green-300' : 'text-amber-300'}>{isString ? `"${data}"` : textToShow}</span>;
        }

        if (Array.isArray(data)) {
            if (data.length === 0) return <span className="text-slate-500">[]</span>;
            return (
                <ul className="pl-4 border-l border-slate-600/50 space-y-1">
                    {data.map((item, index) => <li key={index} className="flex gap-2 items-start"><span className="text-slate-500 flex-shrink-0">{index}:</span> {renderJson(item)}</li>)}
                </ul>
            );
        }

        if (Object.keys(data).length === 0) return <span className="text-slate-500">{}</span>;
        return (
            <ul className="pl-4 border-l border-slate-600/50 space-y-1">
                {Object.entries(data).map(([key, value]) => (
                    <li key={key} className="flex gap-2 items-start">
                        <span className="text-violet-300 font-semibold flex-shrink-0">{`"${key}"`}:</span>
                        <div className="flex-grow">{renderJson(value)}</div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-slate-300">خروجی</h3>
            <div className="relative w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 overflow-x-auto">
                <button onClick={handleCopy} className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500">
                    <ClipboardIcon className="w-4 h-4" />
                    <span>{copied ? 'کپی شد!' : 'کپی'}</span>
                </button>
                {renderJson(data)}
            </div>
        </div>
    );
};

const GpsResultDisplay: React.FC<{ result: any; userData: OnboardingData; onUpdateUserData: (data: OnboardingData) => void }> = ({ result, userData, onUpdateUserData }) => {
    const [isAdded, setIsAdded] = useState(false);

    const handleAddPlanToCalendar = () => {
        const newEvents: CalendarEvent[] = [];
        if (result.plan && Array.isArray(result.plan)) {
            result.plan.forEach((section: any) => {
                if (section.tasks && Array.isArray(section.tasks)) {
                    section.tasks.forEach((task: any) => {
                        const newEvent: CalendarEvent = {
                            id: `agent-event-${Date.now()}-${Math.random()}`,
                            date: result.date,
                            time: task.start,
                            text: `[${section.section}] ${task.title}`
                        };
                        newEvents.push(newEvent);
                    });
                }
            });
        }
        
        if (newEvents.length > 0) {
            onUpdateUserData({
                ...userData,
                calendarEvents: [...(userData.calendarEvents || []), ...newEvents]
            });
            setIsAdded(true);
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-violet-300">برنامه پیشنهادی برای امروز</h3>
            {result.rationale && <p className="text-sm text-slate-400 italic">"{result.rationale}"</p>}
            <div className="space-y-3 bg-slate-800/70 p-4 rounded-lg">
                {result.plan.map((section: any, index: number) => (
                    <div key={index}>
                        <h4 className="font-bold text-slate-300">{section.section}</h4>
                        <div className="mt-2 space-y-2 border-r-2 border-slate-600 pr-4">
                            {section.tasks.map((task: any, tIndex: number) => (
                                <div key={tIndex} className="relative bg-slate-900/50 p-3 rounded-md">
                                     <div className="absolute right-[-9px] top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-600 rounded-full border-2 border-slate-800"></div>
                                    <p className="font-semibold">{task.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                        <span><ClockIcon className="w-4 h-4 inline-block ml-1"/>{task.durationMin} دقیقه</span>
                                        <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded">{task.start}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleAddPlanToCalendar}
                disabled={isAdded}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 rounded-lg font-semibold hover:bg-green-600 disabled:bg-green-800/50 disabled:text-green-500 transition-colors"
            >
                <CalendarIcon className="w-5 h-5" />
                <span>{isAdded ? 'به تقویم اضافه شد!' : 'افزودن برنامه به تقویم'}</span>
            </button>
        </div>
    );
};

const HabitDoctorResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg text-violet-300 mb-2">تشخیص پزشک عادت</h3>
                <blockquote className="border-r-4 border-violet-500 pr-4 italic text-slate-300 bg-slate-800/50 p-3 rounded-r-lg">
                    {result.diagnosis}
                </blockquote>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><MagnifyingGlassIcon className="w-5 h-5 text-slate-400"/>علت‌های ریشه‌ای احتمالی</h4>
                <ul className="space-y-2 list-disc list-inside text-slate-300">
                    {result.rootCauses.map((cause: string, index: number) => (
                        <li key={index}>{cause}</li>
                    ))}
                </ul>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><ClipboardIcon className="w-5 h-5 text-slate-400"/>برنامه اصلاحی ۷ روزه</h4>
                <div className="space-y-3">
                    {result.microPlan.map((dayPlan: any, index: number) => (
                        <div key={index} className="bg-slate-700/60 p-3 rounded-md">
                            <p className="font-bold text-slate-200">روز {dayPlan.day}: <span className="font-normal">{dayPlan.task}</span></p>
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                <span><ClockIcon className="w-3 h-3 inline-block ml-1"/>{dayPlan.durationMin} دقیقه</span>
                                <span><span className="font-semibold">محرک:</span> {dayPlan.trigger}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SkillBuilderResultDisplay: React.FC<{ result: any }> = ({ result }) => (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-violet-300">{result.courseTitle}</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {result.days.map((day: any, index: number) => (
                <div key={index} className="bg-slate-800/70 p-4 rounded-lg border-l-4 border-slate-600">
                    <p className="font-bold">روز {day.day}: {day.focus}</p>
                    <p className="text-sm text-slate-300 mt-2">{day.lesson}</p>
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 text-xs">
                        <p><span className="font-semibold text-slate-400">چالش: </span>{day.challenge}</p>
                        <p><span className="font-semibold text-slate-400">سوال تأمل: </span>{day.reflection}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CalmSosResultDisplay: React.FC<{ result: any }> = ({ result }) => (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-violet-300">تمرین آرام‌سازی فوری</h3>
        <div className="p-4 bg-slate-800/70 rounded-lg">
            <h4 className="font-semibold text-slate-300 mb-2">{result.title}</h4>
            <ul className="space-y-2 list-decimal list-inside text-slate-300">
                {result.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                ))}
            </ul>
        </div>
        <div className="p-4 bg-slate-800/70 rounded-lg">
            <h4 className="font-semibold text-slate-300 mb-2">قدم عملی بعدی</h4>
            <p className="text-slate-200">{result.actionStep}</p>
        </div>
        <div className="p-4 bg-violet-800/50 rounded-lg">
            <h4 className="font-semibold text-violet-300 mb-2">پیام حمایتی</h4>
            <p className="text-violet-200">"{result.supportMessage}"</p>
        </div>
    </div>
);

const PrivacyAdvisorResultDisplay: React.FC<{ result: any }> = ({ result }) => (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-violet-300">طرح پیشنهادی امنیت داده</h3>
        <div className="p-4 bg-slate-800/70 rounded-lg">
            <h4 className="font-semibold text-slate-300 mb-2">روش رمزنگاری</h4>
            <p className="text-slate-300">{result.encryptionMethod}</p>
        </div>
        <div className="p-4 bg-slate-800/70 rounded-lg">
            <h4 className="font-semibold text-slate-300 mb-2">مدیریت کلید</h4>
            <p className="text-slate-300">{result.keyManagement}</p>
        </div>
        <div className="p-4 bg-slate-800/70 rounded-lg">
            <h4 className="font-semibold text-slate-300 mb-2">استراتژی پشتیبان‌گیری</h4>
            <p className="text-slate-300">{result.backupPlan}</p>
        </div>
        <div className="p-4 bg-red-800/30 rounded-lg">
            <h4 className="font-semibold text-red-300 mb-2">تحلیل ریسک‌ها</h4>
            <ul className="space-y-2 list-disc list-inside text-red-300/90">
                {result.riskNotes.map((note: string, index: number) => <li key={index}>{note}</li>)}
            </ul>
        </div>
    </div>
);

const FinancialAutopilotResultDisplay: React.FC<{ result: any }> = ({ result }) => (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-violet-300">قوانین خودکار پیشنهادی</h3>
        {result.rules.map((rule: any, index: number) => (
            <div key={index} className="bg-slate-800/70 p-4 rounded-lg">
                <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">IF</span>
                    <span className="text-slate-300">{rule.if}</span>
                </div>
                <div className="my-2 pl-6">
                    <span className="text-2xl text-slate-500">↳</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">THEN</span>
                    <span className="text-slate-300">{rule.then}</span>
                </div>
                <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-700/50">
                    <span className="font-semibold">دلیل: </span>{rule.reason}
                </p>
            </div>
        ))}
    </div>
);

const ExpensePredictorResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    const riskMap = {
        low: { label: 'کم', color: 'text-green-400' },
        medium: { label: 'متوسط', color: 'text-yellow-400' },
        high: { label: 'زیاد', color: 'text-red-400' },
    };
    const riskInfo = riskMap[result.riskLevel as keyof typeof riskMap] || { label: result.riskLevel, color: 'text-white' };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-violet-300">پیش‌بینی ریسک نقدینگی</h3>
            <div className="p-4 bg-slate-800/70 rounded-lg text-center">
                <p className="text-sm text-slate-400">سطح ریسک</p>
                <p className={`text-3xl font-bold ${riskInfo.color}`}>{riskInfo.label}</p>
                <p className="text-sm text-slate-300 mt-2">{result.riskReason}</p>
            </div>
            <div className="p-4 bg-slate-800/70 rounded-lg">
                <h4 className="font-semibold text-slate-300 mb-2">اقدامات پیشگیرانه پیشنهادی</h4>
                <ul className="space-y-2 list-decimal list-inside text-slate-300">
                    {result.actions.map((action: string, index: number) => (
                        <li key={index}>{action}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const CognitiveHabitDesignerResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    const { plan, fallback_plan, rollout_schedule } = result;

    if (!plan || !fallback_plan || !rollout_schedule) {
        return <p className="text-red-400">خروجی نامعتبر دریافت شد.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg text-violet-300 mb-2">پشتهٔ میکروعادت پیشنهادی</h3>
                <div className="space-y-4">
                    {plan.map((step: any, index: number) => (
                        <div key={index} className="bg-slate-800/70 p-4 rounded-lg border-l-4 border-slate-600">
                            <p className="font-bold text-slate-200">مرحله {step.step}: {step.name}</p>
                            <div className="mt-3 space-y-2 text-sm">
                                <p><span className="font-semibold text-slate-400">محرک: </span>{step.trigger}</p>
                                <p><span className="font-semibold text-slate-400">رفتار دقیق: </span>{step.behavior}</p>
                                <p><span className="font-semibold text-slate-400">آماده‌سازی نشانه: </span>{step.cue_setup}</p>
                                <p><span className="font-semibold text-slate-400">معیار اندازه‌گیری: </span>{step.metric}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-slate-800/70 rounded-lg">
                <h4 className="font-semibold text-slate-300 mb-2">برنامه جایگزین (برای روزهای از دست رفته)</h4>
                <p className="text-sm text-slate-300">{fallback_plan}</p>
            </div>

            <div className="p-4 bg-slate-800/70 rounded-lg">
                <h4 className="font-semibold text-slate-300 mb-2">برنامه شروع هفتگی</h4>
                <ul className="space-y-2 list-disc list-inside text-slate-300 text-sm">
                    {rollout_schedule.map((day: any, index: number) => (
                        <li key={index}><span className="font-bold">{day.day}:</span> {day.focus}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const AiAgentRunner: React.FC<AiAgentRunnerProps> = ({ agent, onBack, userData, onUpdateUserData }) => {
    const [inputData, setInputData] = useState<Record<string, any>>({});
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
    const [editableFields, setEditableFields] = useState<Record<string, boolean>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);


    useEffect(() => {
        const generateInitialState = () => {
            const initialState: Record<string, any> = {};
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
    
            const getLocalStorageJSON = (key: string, fallback: any = []) => {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : fallback;
                } catch {
                    return fallback;
                }
            };
    
            for (const key in agent.inputSchema) {
                const defaultValue = agent.inputSchema[key];
                let dynamicValue: any = null;
    
                switch(key) {
                    case 'date':
                        dynamicValue = todayStr;
                        break;
                    case 'journalText':
                        const notes: Note[] = getLocalStorageJSON('benvis_journal');
                        dynamicValue = notes.filter(n => n.createdAt.startsWith(todayStr)).map(n => n.content).join('\n\n');
                        break;
                    case 'habitCompletions':
                        const habitsToday = getLocalStorageJSON(`benvis_habits_${todayStr}`, {});
                        dynamicValue = Object.entries(habitsToday).map(([id, done]) => ({ habitId: id, done }));
                        break;
                    case 'activitiesSummary':
                        const todayEvents = (userData.calendarEvents || []).filter(e => e.date === todayStr);
                        dynamicValue = todayEvents.map(e => `${e.time || ''} - ${e.text}`).join('; ');
                        break;
                    case 'activeGoals':
                        dynamicValue = (userData.goals || []).filter(g => g.progress < 100).map(g => ({ id: g.id, title: g.title, progress: g.progress / 100 }));
                        break;
                    case 'transactions': {
                        const twoMonthsAgo = new Date();
                        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
                        dynamicValue = (userData.transactions || [])
                            .filter(t => new Date(t.date) >= twoMonthsAgo)
                            .map(({ id, date, amount, categoryId, accountId, type }) => {
                                const category = userData.transactionCategories?.find(c => c.id === categoryId)?.name || 'Unknown';
                                return { id, date, amount, category, type, account: accountId };
                            });
                        break;
                    }
                    case 'budgets': {
                        const budgetObj: Record<string, number> = {};
                        (userData.budgets || []).forEach(b => {
                            const catName = userData.transactionCategories?.find(c => c.id === b.categoryId)?.name;
                            if (catName) budgetObj[catName] = b.amount;
                        });
                        dynamicValue = budgetObj;
                        break;
                    }
                    case 'journalEntries': {
                        const allNotes: Note[] = getLocalStorageJSON('benvis_journal');
                        dynamicValue = allNotes.slice(0, 15).map(n => ({ date: n.createdAt.split('T')[0], text: n.content, tags: [] }));
                        break;
                    }
                    case 'goals':
                        dynamicValue = userData.goals || [];
                        break;
                    case 'habits':
                        dynamicValue = userData.habits || [];
                        break;
                    case 'pastMonthSummary': {
                        const lastMonth = new Date();
                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                        const lastMonthGoals = (userData.goals || []).filter(g => new Date(g.targetDate || 0) > lastMonth);
                        dynamicValue = {
                            goalsProgress: lastMonthGoals.map(g => ({ id: g.id, progress: g.progress })),
                            majorEvents: (userData.calendarEvents || []).filter(e => new Date(e.date) > lastMonth).slice(0, 5).map(e => e.text),
                            timeUse: "Time use not tracked, assume focus on goals."
                        };
                        break;
                    }
                }
                
                const useDynamicValue = dynamicValue !== null && (
                    (typeof dynamicValue !== 'object') ||
                    (Array.isArray(dynamicValue) && dynamicValue.length > 0) ||
                    (!Array.isArray(dynamicValue) && Object.keys(dynamicValue).length > 0)
                );
    
                const valueToSet = useDynamicValue ? dynamicValue : defaultValue;
    
                if (typeof valueToSet === 'object' && valueToSet !== null) {
                    initialState[key] = JSON.stringify(valueToSet, null, 2);
                } else {
                    initialState[key] = valueToSet;
                }
            }
            return initialState;
        };
        setInputData(generateInitialState());
        setEditableFields({});
    }, [agent, userData]);

    const handleFieldChange = (key: string, value: any) => {
        setInputData(prev => ({ ...prev, [key]: value }));
        if (jsonErrors[key]) {
            setJsonErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };
    
    const toggleEditable = (key: string) => {
        setEditableFields(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setJsonErrors({});

        let finalInputPayload: Record<string, any> = {};
        let hasError = false;

        for (const key in agent.inputSchema) {
            const originalValue = agent.inputSchema[key];
            const currentValue = inputData[key];
            const valueType = Array.isArray(originalValue) ? 'array' : typeof originalValue;

            if (valueType === 'object' || valueType === 'array') {
                try {
                    finalInputPayload[key] = typeof currentValue === 'string' ? JSON.parse(currentValue) : currentValue;
                } catch (e) {
                    setJsonErrors(prev => ({ ...prev, [key]: 'ساختار JSON وارد شده نامعتبر است.' }));
                    hasError = true;
                }
            } else if (valueType === 'number') {
                const num = Number(currentValue);
                if (isNaN(num)) {
                    setJsonErrors(prev => ({ ...prev, [key]: 'لطفا یک عدد معتبر وارد کنید.' }));
                    hasError = true;
                } else {
                    finalInputPayload[key] = num;
                }
            } else {
                finalInputPayload[key] = currentValue;
            }
        }

        if (hasError) {
            setIsLoading(false);
            return;
        }

        const finalInput = JSON.stringify(finalInputPayload);
        const finalPrompt = agent.systemPrompt.replace('{userInput}', finalInput);

        try {
            const response = await ai.models.generateContent({
                model: agent.model,
                contents: finalPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: agent.responseSchema,
                },
            });
            setResult(JSON.stringify(JSON.parse(response.text), null, 2));
        } catch (err: any) {
            console.error(`Error running agent ${agent.id}:`, err);
            const errorString = JSON.stringify(err);
            if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes('"code":429')) {
                setError("محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.");
            } else {
                 setError('خطا در اجرای ابزار. لطفا ورودی خود را بررسی کرده و دوباره تلاش کنید.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderField = (key: string, value: any) => {
        const valueType = Array.isArray(value) ? 'array' : typeof value;
        const metadata = fieldMetadata[key] || { label: key, description: 'داده‌های ورودی برای این بخش.', icon: SparklesIcon };
        const Icon = metadata.icon;
        
        const specialSelects: Record<string, string[]> = {
            difficulty: ['easy', 'medium', 'hard'],
            ambition: ['maintain', 'grow', 'transform'],
            energyProfile: ['earlyBird', 'nightOwl', 'flexible'],
            energyEstimate: ['low', 'medium', 'high'],
            workload: ['low', 'medium', 'high'],
            mood: ['cloudy', 'calm', 'stormy', 'sunny'],
            timeOfDay: ['morning', 'afternoon', 'evening'],
        };

        const renderInput = () => {
            if (key in specialSelects) {
                return (
                    <select 
                        value={inputData[key]} 
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                        {specialSelects[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            }
    
            switch (valueType) {
                case 'string':
                    return <input type="text" value={inputData[key] || ''} onChange={(e) => handleFieldChange(key, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />;
                case 'number':
                    return <input type="number" value={inputData[key] || 0} onChange={(e) => handleFieldChange(key, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />;
                case 'boolean':
                    return <input type="checkbox" checked={inputData[key] || false} onChange={(e) => handleFieldChange(key, e.target.checked)} className="w-5 h-5 rounded text-violet-500 bg-slate-700 border-slate-600 focus:ring-violet-500" />;
                case 'object':
                case 'array':
                    const isEditable = !!editableFields[key];
                    return (
                        <div className="relative">
                            <textarea
                                value={inputData[key] || ''}
                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                readOnly={!isEditable}
                                rows={8}
                                className={`w-full bg-slate-900/50 border rounded-md p-3 font-mono text-sm text-slate-200 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-colors ${isEditable ? 'border-violet-500' : 'border-slate-600 cursor-default'}`}
                                placeholder="داده‌های پیچیده در فرمت JSON"
                            />
                            <button onClick={() => toggleEditable(key)} className={`absolute top-2 left-2 flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full transition-colors ${isEditable ? 'bg-violet-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                                {isEditable ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                                <span>{isEditable ? 'قفل کردن' : 'ویرایش'}</span>
                            </button>
                             {jsonErrors[key] && <p className="text-red-400 text-xs mt-1">{jsonErrors[key]}</p>}
                        </div>
                    );
                default:
                    return <p className="text-sm text-yellow-400">نوع ورودی پشتیبانی نشده: {valueType}</p>;
            }
        };

        return (
            <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-lg)] p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-1.5 bg-slate-700 rounded-md mt-1 flex-shrink-0">
                        <Icon className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                        <label className="block font-bold text-slate-100">{metadata.label}</label>
                        <p className="text-xs text-slate-400">{metadata.description}</p>
                    </div>
                </div>
                {renderInput()}
            </div>
        )
    };

    const renderResult = () => {
        if (!result) return null;

        const customDisplays: Record<string, React.FC<any>> = {
            'life-gps': GpsResultDisplay,
            'habit-doctor': HabitDoctorResultDisplay,
            'skill-builder': SkillBuilderResultDisplay,
            'calm-sos': CalmSosResultDisplay,
            'privacy-advisor': PrivacyAdvisorResultDisplay,
            'financial-autopilot': FinancialAutopilotResultDisplay,
            'expense-predictor': ExpensePredictorResultDisplay,
            'cognitive-habit-designer': CognitiveHabitDesignerResultDisplay,
        };

        const CustomDisplay = customDisplays[agent.id];
        
        if (CustomDisplay) {
            return <CustomDisplay result={JSON.parse(result)} userData={userData} onUpdateUserData={onUpdateUserData} />;
        }
        
        return <ResultDisplay jsonString={result} />;
    };

    return (
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-6">
            <button onClick={onBack} className="flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300">
                <ChevronRightIcon className="w-5 h-5" />
                <span>بازگشت به لیست ابزارها</span>
            </button>
            <div className="flex items-center gap-4">
                <agent.icon className="w-10 h-10 text-violet-400 flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-bold">{agent.title}</h2>
                    <p className="text-sm text-slate-400">{agent.description}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div onClick={() => setShowAdvanced(!showAdvanced)} className="cursor-pointer flex justify-between items-center text-slate-300 hover:text-white">
                    <h3 className="font-semibold">ورودی‌ها (پر شده با اطلاعات شما)</h3>
                    <span className="text-xs font-semibold">{showAdvanced ? 'مخفی کردن' : 'نمایش ورودی پیشرفته'}</span>
                </div>
                {showAdvanced && (
                    <div className="space-y-4 border-t border-slate-700 pt-4">
                        {Object.entries(agent.inputSchema).map(([key, value]) => renderField(key, value))}
                    </div>
                )}
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-700 rounded-lg font-semibold hover:bg-violet-800 disabled:bg-slate-600 transition-colors"
            >
                <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                <span>{isLoading ? 'در حال پردازش...' : 'اجرا کن'}</span>
            </button>
            
            <div className="space-y-4">
                {isLoading && <ResultSkeleton />}
                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-800 rounded-md text-red-300 text-sm">
                        {error}
                    </div>
                )}
                {result && !isLoading && renderResult()}
            </div>
        </div>
    );
};

export default AiAgentRunner;
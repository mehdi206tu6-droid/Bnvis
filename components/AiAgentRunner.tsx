
import React, { useState, useEffect } from 'react';
import { Agent, OnboardingData, Note, CalendarEvent } from '../types';
import { GoogleGenAI } from '@google/genai';
import { 
    SparklesIcon, ChevronRightIcon, CalendarIcon, PencilIcon, MoonIcon, HabitsIcon,
    ClockIcon, TargetIcon, FinanceIcon, ReceiptPercentIcon, BoltIcon, BriefcaseIcon,
    FaceSmileIcon, UserIcon, BrainIcon, DocumentTextIcon, ChartBarIcon, LockOpenIcon, LockClosedIcon, ClipboardIcon,
    MagnifyingGlassIcon, BookOpenIcon, SpeakerWaveIcon, LeafIcon, SunIcon, StarIcon
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
    monthlyIncome: { label: 'درآمد ماهانه', description: 'مجموع درآمد ماهانه شما.', icon: FinanceIcon },
    savingsGoal: { label: 'هدف پس‌انداز', description: 'مبلغی که می‌خواهید هر ماه پس‌انداز کنید.', icon: TargetIcon },
    difficulty: { label: 'سطح دشواری', description: 'میزان سختی چالش را انتخاب کنید.', icon: ChartBarIcon },
    type: { label: 'نوع چالش', description: 'نوع فعالیت مورد نظر خود را انتخاب کنید.', icon: TargetIcon },
    message: { label: 'پیام ورودی', description: 'پیامی که می‌خواهید به دستور تبدیل شود.', icon: DocumentTextIcon },
    experimentGoal: { label: 'هدف آزمایش', description: 'هدفی که می‌خواهید برای آن آزمایش طراحی کنید.', icon: TargetIcon },
    top3Habits: { label: '۳ عادت برتر', description: 'سه عادت مهمی که می‌خواهید در خود تقویت کنید.', icon: HabitsIcon },
    whyTheyMatter: { label: 'چرا مهم هستند', description: 'دلیل اهمیت این عادت‌ها در زندگی شما.', icon: TargetIcon },
    journalEntriesLast30Days: { label: 'ژورنال‌های ۳۰ روز اخیر', description: 'خاطرات و یادداشت‌های ماه گذشته شما.', icon: BookOpenIcon },
    available_minutes_morning: { label: 'زمان صبحگاهی (دقیقه)', description: 'زمانی که صبح‌ها می‌توانید اختصاص دهید.', icon: ClockIcon },
    priority: { label: 'اولویت', description: 'تمرکز اصلی روتین (انرژی، تمرکز، آرامش).', icon: StarIcon },
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

const RealWorldChallengerResultDisplay: React.FC<{ result: any, userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void }> = ({ result, userData, onUpdateUserData }) => {
    const [completed, setCompleted] = useState(false);

    const handleComplete = () => {
        // Award XP
        const reward = Number(result.xpReward) || 50;
        onUpdateUserData({ ...userData, xp: userData.xp + reward });
        setCompleted(true);
        alert(`تبریک! شما ${reward} امتیاز کسب کردید.`);
    };

    return (
        <div className="space-y-6">
            <div className="relative bg-gradient-to-br from-orange-600 to-red-700 rounded-xl p-6 text-white overflow-hidden shadow-lg">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                 <h3 className="text-2xl font-bold mb-2 relative z-10">{result.title}</h3>
                 <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        {result.xpReward} XP
                    </span>
                    <span className="bg-black/30 px-3 py-1 rounded-full text-sm border border-white/20">
                        {result.proofMethod}
                    </span>
                 </div>
                 
                 <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10 relative z-10">
                    <h4 className="font-bold mb-2 text-orange-100">الزامات چالش:</h4>
                    <ul className="space-y-2">
                        {result.requirements.map((req: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-1 w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0"></span>
                                {req}
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h4 className="font-bold text-slate-300 mb-2">اثبات انجام کار</h4>
                <p className="text-xs text-slate-400 mb-4">لطفاً مدرک انجام چالش (عکس یا موقعیت مکانی) را در اینجا آپلود کنید تا امتیاز را دریافت کنید.</p>
                
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:bg-slate-700/30 transition-colors cursor-pointer">
                    <span className="text-slate-400 text-sm">برای آپلود عکس کلیک کنید</span>
                </div>
                
                <button 
                    onClick={handleComplete}
                    disabled={completed}
                    className="w-full mt-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {completed ? 'دریافت شد!' : 'ثبت و دریافت جایزه'}
                </button>
            </div>
        </div>
    );
};

const QuickCommandResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(result.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-violet-300">فرمان سریع ایجاد شد</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">کد زیر را کپی کرده و در دستگاه دیگر اجرا کنید:</p>
                <div className="flex items-center gap-2 bg-black/30 p-3 rounded-md font-mono text-green-400 break-all">
                    {result.command}
                </div>
                <button 
                    onClick={handleCopy}
                    className="mt-3 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <ClipboardIcon className="w-4 h-4"/>
                    {copied ? 'کپی شد!' : 'کپی کردن دستور'}
                </button>
            </div>
            <p className="text-sm text-slate-400 italic">{result.description}</p>
        </div>
    );
};

const BehavioralLabResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="bg-slate-800/70 border-l-4 border-violet-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-lg text-white mb-2">فرضیه آزمایش</h3>
                <p className="text-slate-300 italic">"{result.hypothesis}"</p>
            </div>

            <div className="space-y-3">
                <h4 className="font-bold text-slate-300 flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> برنامه روزانه</h4>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                    {result.days.map((day: any, index: number) => (
                        <div key={index} className="bg-slate-800/50 p-3 rounded-lg flex gap-3">
                            <span className="font-bold text-violet-400 whitespace-nowrap">روز {day.day}:</span>
                            <span className="text-slate-200 text-sm">{day.instruction}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-300 mb-3 flex items-center gap-2"><ChartBarIcon className="w-5 h-5"/> متریک‌های پیگیری</h4>
                <ul className="space-y-2">
                    {result.metrics.map((metric: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {metric}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const HabitManifestoResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-yellow-400" />
                    مانیفست شخصی شما
                </h3>
                <p className="text-lg leading-relaxed text-slate-200 italic text-center font-serif relative z-10">
                    "{result.manifestoText}"
                </p>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl"></div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h4 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <ClipboardIcon className="w-5 h-5 text-blue-400" />
                    نقشه راه عملی
                </h4>
                <ul className="space-y-3">
                    {result.actionPlan.map((step: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                {index + 1}
                            </span>
                            <span className="text-slate-300 text-sm">{step}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const NarrativeJournalerResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="bg-[#F5F5F0] text-slate-900 p-8 rounded-r-lg rounded-l-sm shadow-lg border-r-4 border-slate-300 relative font-serif overflow-hidden">
                 <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"></div>
                 <h3 className="text-2xl font-bold mb-4 text-center border-b-2 border-slate-300 pb-2 text-slate-800">داستان ۳۰ روز گذشته من</h3>
                 <div className="whitespace-pre-wrap text-lg leading-relaxed text-justify">
                     {result.storyText}
                 </div>
                 <div className="mt-6 pt-4 border-t border-slate-300 text-center text-sm text-slate-500 italic">
                     پایان فصل
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <h4 className="font-bold text-violet-300 mb-3 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5"/>
                        درس‌های کلیدی
                    </h4>
                    <ul className="space-y-2">
                        {result.keyLessons.map((lesson: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-violet-500 mt-1">•</span>
                                {lesson}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <h4 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
                        <FaceSmileIcon className="w-5 h-5"/>
                        پیشنهاد تصویرسازی
                    </h4>
                     <ul className="space-y-2">
                        {result.visualsSuggested.map((visual: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-blue-500 mt-1">•</span>
                                {visual}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const SomaticChakraResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <LeafIcon className="w-5 h-5 text-green-400" />
                    روتین کامل چاکراها
                </h3>
                <div className="space-y-4">
                    {result.fullRoutine.map((item: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg border border-slate-600/50" style={{ borderLeft: `4px solid ${item.color || '#ccc'}` }}>
                            <h4 className="font-bold text-slate-200 mb-1">{item.chakra}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <p className="text-slate-400"><span className="text-slate-300 font-semibold">تنفس:</span> {item.breath}</p>
                                <p className="text-slate-400"><span className="text-slate-300 font-semibold">حرکت:</span> {item.movement}</p>
                                <p className="text-slate-400"><span className="text-slate-300 font-semibold">مانترا:</span> {item.mantra}</p>
                                <p className="text-slate-400"><span className="text-slate-300 font-semibold">متریک:</span> {item.metric}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                    <BoltIcon className="w-5 h-5" />
                    نسخه سریع (۷ دقیقه)
                </h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{result.quickVersion}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <h4 className="font-bold text-violet-300 mb-2 flex items-center gap-2">
                    <SpeakerWaveIcon className="w-5 h-5" />
                    متن صوتی هدایت‌گر
                </h4>
                <div className="bg-black/20 p-3 rounded-lg text-sm text-slate-300 italic whitespace-pre-wrap">
                    {result.ttsScript}
                </div>
            </div>
        </div>
    );
};

const MorningRitualResultDisplay: React.FC<{ result: any }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-orange-500/30 p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                    <SunIcon className="w-8 h-8 text-yellow-400" />
                    {result.routineName}
                </h3>
                
                <div className="space-y-4 relative z-10">
                     {result.steps.map((step: any, index: number) => (
                         <div key={index} className="flex gap-4 items-start">
                             <div className="flex flex-col items-center gap-1 mt-1">
                                 <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                 {index < result.steps.length - 1 && <div className="w-0.5 h-full bg-orange-500/30 min-h-[20px]"></div>}
                             </div>
                             <div className="bg-black/20 rounded-lg p-3 flex-grow">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="font-bold text-orange-200">{step.action}</span>
                                     <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">{step.time}</span>
                                 </div>
                                 <p className="text-sm text-slate-300">{step.details}</p>
                             </div>
                         </div>
                     ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                     <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <BoltIcon className="w-5 h-5" />
                        نسخه سریع (۵ دقیقه‌ای)
                    </h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{result.quickVersion}</p>
                </div>
                 <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                     <h4 className="font-bold text-violet-300 mb-2 flex items-center gap-2">
                        <SpeakerWaveIcon className="w-5 h-5" />
                        راهنمای صوتی (متن)
                    </h4>
                    <div className="bg-black/20 p-3 rounded-lg text-sm text-slate-300 italic whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {result.ttsScript}
                    </div>
                </div>
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
                    case 'journalEntriesLast30Days': {
                        const allNotes: Note[] = getLocalStorageJSON('benvis_journal');
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        dynamicValue = allNotes
                            .filter(n => new Date(n.createdAt) >= thirtyDaysAgo)
                            .map(n => ({ date: n.createdAt.split('T')[0], text: n.content }));
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
                    case 'dataTypes':
                        dynamicValue = ["journals", "finance", "health", "goals"];
                        break;
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
            type: ['fitness', 'social', 'eco', 'creative'],
            priority: ['energy', 'focus', 'calm'],
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
            'real-world-challenger': RealWorldChallengerResultDisplay,
            'quick-commander': QuickCommandResultDisplay,
            'behavioral-lab': BehavioralLabResultDisplay,
            'habit-manifesto-creator': HabitManifestoResultDisplay,
            'narrative-journaler': NarrativeJournalerResultDisplay,
            'somatic-chakra-guide': SomaticChakraResultDisplay,
            'morning-ritual-designer': MorningRitualResultDisplay,
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

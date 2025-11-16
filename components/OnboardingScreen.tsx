
import React, { useState, useEffect } from 'react';
import { OnboardingData, NotificationType, NotificationTiming, DailyReportSetting, NotificationSetting, Habit } from '../types';
import { 
    WavingHandIcon, UserIcon, TargetIcon, MoneyIcon, BellIcon, CalendarIcon, CheckCircleIcon,
    HealthIcon, FinanceIcon, EducationIcon, HabitsIcon, BatteryIcon, WifiIcon, 
    WaterDropIcon, ReadingIcon, WalkingIcon, MeditationIcon, SunIcon, CloudIcon, PlusIcon, TrashIcon
} from './icons';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
}

const TOTAL_STEPS = 7;

type OnboardingState = Omit<OnboardingData, 'theme' | 'habits' | 'womenHealth' | 'financialAccounts' | 'budgets' | 'transactions' | 'transactionCategories' | 'incomeAnalysis' | 'calendarEvents'> & {
  habits: string[];
};


export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingState>({
    fullName: '',
    age: '',
    role: '',
    gender: 'prefer_not_to_say',
    selectedGoals: [],
    habits: [],
    notifications: {
      tasks: { enabled: true, timing: '1h' },
      reminders: { enabled: false, timing: '1d' },
      daily_report: { enabled: false, time: '09:00' },
    },
    goals: [],
    xp: 0,
    level: 1,
    achievements: [],
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const updateData = (update: Partial<OnboardingState>) => {
    setData(prev => ({ ...prev, ...update }));
  };

  const handleComplete = () => {
    const finalData: OnboardingData = {
        ...data,
        habits: data.habits.map(name => ({ name, type: name.includes('نکردن') ? 'bad' : 'good' })),
        theme: { color: 'blue', shape: 'sharp' },
        womenHealth: { cycleLength: 28, periodLength: 5, cycles: [] }
    };
    onComplete(finalData);
  };

  const STEPS = [
    { title: "خوش‌آمدگویی", component: <WelcomeStep /> },
    { title: "شناسایی کاربر", component: <IdentityStep data={data} setData={updateData} /> },
    { title: "جنسیت", component: <GenderStep data={data} setData={updateData} /> },
    { title: "انتخاب اهداف", component: <GoalsStep data={data} setData={updateData} /> },
    { title: "عادت‌های روزانه", component: <HabitsStep data={data} setData={updateData} /> },
    { title: "اعلان‌ها", component: <NotificationsStep data={data} setData={updateData} /> },
    { title: "تکمیل", component: <CompleteStep data={data} /> }
  ];

  const currentStep = STEPS[step];
  
  return (
    <div className="min-h-screen bg-transparent flex flex-col p-4 text-slate-200 overflow-y-auto">
        <header className="flex justify-between items-center text-xs font-medium text-slate-400 px-2">
            <div>9:41</div>
            <div className="flex items-center gap-1.5">
                <WifiIcon className="w-4 h-4" />
                <BatteryIcon className="w-5 h-5" />
            </div>
        </header>

        <div className="px-2 mt-6">
            <div className="text-slate-400 text-sm mb-2">{`مرحله ${step + 1} از ${TOTAL_STEPS}`}</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div 
                    className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                ></div>
            </div>
        </div>

        <main className="flex-grow flex flex-col mt-4">
            {currentStep.component}
        </main>

        <footer className="mt-8 flex items-center gap-4">
            {step > 0 && step < TOTAL_STEPS - 1 && (
                <button
                    onClick={prevStep}
                    className="flex-1 py-3 bg-slate-800/60 border border-slate-700 text-white font-bold rounded-[var(--radius-lg)]"
                >
                    قبلی
                </button>
            )}
            <button
                onClick={step === TOTAL_STEPS - 1 ? handleComplete : nextStep}
                disabled={(step === 1 && !data.fullName.trim())}
                className="flex-grow py-3 bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold rounded-[var(--radius-lg)] w-full hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-violet-800/40 disabled:bg-slate-600 disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed"
            >
                {step === TOTAL_STEPS - 1 ? 'شروع میکنم' : (step === 0 ? 'بزن بریم' : 'ادامه')}
            </button>
        </footer>
    </div>
  );
};

const StepCard: React.FC<{title: string; tag?: string, children: React.ReactNode}> = ({title, tag, children}) => (
    <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-6 flex flex-col items-center text-center w-full flex-grow">
        {tag && <div className="text-xs font-bold text-green-400 bg-green-900/50 px-3 py-1 rounded-full mb-4 self-start">{tag}</div>}
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {children}
    </div>
);


const WelcomeStep = () => (
    <div className="flex flex-col items-center justify-center text-center flex-grow">
        <div className="w-32 h-32 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-violet-800/60">
            <WavingHandIcon className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">به بنویس خوش آمدید</h1>
        <p className="text-slate-400">Life OS شما برای مدیریت هوشمند زندگی</p>
    </div>
);

interface StepProps {
    data: OnboardingState;
    setData: (update: Partial<OnboardingState>) => void;
}

const IdentityStep: React.FC<StepProps> = ({ data, setData }) => (
    <StepCard title="شما را با چه نامی صدا بزنیم؟">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 mt-4">
            <UserIcon className="w-12 h-12 text-slate-500" />
        </div>
        <p className="text-slate-400 mb-6">لطفا نام کامل خود را وارد کنید.</p>
        <div className="w-full text-right">
            <input 
                type="text" 
                placeholder="نام و نام خانوادگی" 
                value={data.fullName}
                onChange={e => setData({ fullName: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
        </div>
    </StepCard>
);

const GenderStep: React.FC<StepProps> = ({ data, setData }) => {
    const genders: { key: OnboardingData['gender']; label: string }[] = [
        { key: 'female', label: 'زن' },
        { key: 'male', label: 'مرد' },
        { key: 'other', label: 'سایر' },
        { key: 'prefer_not_to_say', label: 'ترجیح می‌دهم نگویم' },
    ];

    return (
        <StepCard title="جنسیت خود را مشخص کنید" tag="Personalization">
            <p className="text-slate-400 mb-6">این به ما کمک می‌کند تا تجربه شما را شخصی‌سازی کنیم.</p>
            <div className="grid grid-cols-2 gap-4 w-full">
                {genders.map(gender => {
                    const isSelected = data.gender === gender.key;
                    return (
                        <button key={gender.key} onClick={() => setData({ gender: gender.key })}
                            className={`p-4 rounded-[var(--radius-md)] border-2 transition-all duration-200 flex flex-col items-center ${
                                isSelected ? 'bg-violet-900/50 border-violet-500 ring-2 ring-violet-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <span className="font-bold">{gender.label}</span>
                        </button>
                    )
                })}
            </div>
        </StepCard>
    );
};

const goalOptions = [
    { name: 'مالی', desc: 'پیشرفت در کار', icon: FinanceIcon, color: 'text-yellow-400' },
    { name: 'سلامتی', desc: 'زندگی سالم', icon: HealthIcon, color: 'text-red-400' },
    { name: 'آموزش', desc: 'یادگیری مهارت', icon: EducationIcon, color: 'text-blue-400' },
    { name: 'عادت‌ها', desc: 'ساختن عادت خوب', icon: HabitsIcon, color: 'text-green-400' }
];

const GoalsStep: React.FC<StepProps> = ({ data, setData }) => {
    const toggleGoal = (goalName: string) => {
        const newGoals = data.selectedGoals.includes(goalName)
            ? data.selectedGoals.filter(g => g !== goalName)
            : [...data.selectedGoals, goalName];
        setData({ selectedGoals: newGoals });
    };

    return (
        <StepCard title="اهداف خود را انتخاب کنید" tag="Goals">
            <p className="text-slate-400 mb-6">چه چیزی برای شما مهم است؟</p>
            <div className="grid grid-cols-2 gap-4 w-full">
                {goalOptions.map(goal => {
                    const isSelected = data.selectedGoals.includes(goal.name);
                    return (
                        <button key={goal.name} onClick={() => toggleGoal(goal.name)}
                            className={`p-4 rounded-[var(--radius-md)] border-2 transition-all duration-200 flex flex-col items-center ${
                                isSelected ? 'bg-violet-900/50 border-violet-500 ring-2 ring-violet-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <goal.icon className={`w-10 h-10 mb-2 ${goal.color}`} />
                            <span className="font-bold">{goal.name}</span>
                            <span className="text-xs text-slate-400">{goal.desc}</span>
                        </button>
                    )
                })}
            </div>
        </StepCard>
    );
};

const habitOptions = [
    { name: "نوشیدن آب", icon: WaterDropIcon },
    { name: "مطالعه", icon: ReadingIcon },
    { name: "ورزش", icon: WalkingIcon },
    { name: "مدیتیشن", icon: MeditationIcon },
];

const HabitsStep: React.FC<StepProps> = ({ data, setData }) => {
    
    const toggleHabit = (habitName: string) => {
        const newHabits = data.habits.includes(habitName)
            ? data.habits.filter(h => h !== habitName)
            : [...data.habits, habitName];
        setData({ habits: newHabits });
    };

    return (
        <StepCard title="عادت‌های مثبت بسازید" tag="Habits">
             <p className="text-slate-400 mb-6">کدام عادت‌ها را می‌خواهید دنبال کنید؟</p>
             <div className="w-full space-y-3">
                {habitOptions.map(habit => {
                    const isSelected = data.habits.includes(habit.name);
                    return (
                        <button key={habit.name} onClick={() => toggleHabit(habit.name)}
                            className={`w-full p-4 rounded-[var(--radius-md)] border-2 flex items-center text-right transition-all ${
                                isSelected ? 'bg-violet-900/50 border-violet-500' : 'bg-slate-800/50 border-slate-700'
                            }`}
                        >
                            <div className={`p-2 rounded-md mr-4 ${isSelected ? 'bg-white/20' : 'bg-slate-700'}`}>
                                <habit.icon className="w-6 h-6 text-white"/>
                            </div>
                            <span className="flex-grow font-semibold">{habit.name}</span>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${
                                isSelected ? 'bg-violet-500 border-violet-400' : 'border-slate-500'
                            }`}>
                                {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </button>
                    )
                })}
             </div>
        </StepCard>
    );
};

const timingOptions: { value: NotificationTiming; label: string }[] = [
    { value: '1h', label: '۱ ساعت قبل' },
    { value: '6h', label: '۶ ساعت قبل' },
    { value: '1d', label: 'روز قبل' },
];

const NotificationsStep: React.FC<StepProps> = ({ data, setData }) => {
    const handleSettingChange = (key: NotificationType, value: Partial<NotificationSetting> | Partial<DailyReportSetting>) => {
        setData({
            notifications: {
                ...data.notifications,
                [key]: { ...data.notifications[key], ...value },
            },
        });
    };

    return (
        <StepCard title="تنظیم اعلان‌ها" tag="Notifications">
             <p className="text-slate-400 mb-6">نوع اعلان‌هایی که می‌خواهید دریافت کنید را مشخص کنید.</p>
             <div className="w-full space-y-4 text-right">
                {/* Tasks */}
                <div className="w-full p-4 rounded-[var(--radius-md)] bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex-grow">
                            <div className="font-bold">یادآوری وظایف</div>
                            <div className="text-sm text-slate-400">قبل از سررسید کارها</div>
                        </div>
                        <button onClick={() => handleSettingChange('tasks', { enabled: !data.notifications.tasks.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${data.notifications.tasks.enabled ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                    {data.notifications.tasks.enabled && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <label className="text-sm text-slate-400">زمان هشدار</label>
                            <select value={data.notifications.tasks.timing} onChange={(e) => handleSettingChange('tasks', { timing: e.target.value as NotificationTiming })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none">
                                {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Reminders */}
                <div className="w-full p-4 rounded-[var(--radius-md)] bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex-grow">
                            <div className="font-bold">گزارش مالی</div>
                            <div className="text-sm text-slate-400">خلاصه هزینه‌های هفتگی</div>
                        </div>
                        <button onClick={() => handleSettingChange('reminders', { enabled: !data.notifications.reminders.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${data.notifications.reminders.enabled ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                    {data.notifications.reminders.enabled && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <label className="text-sm text-slate-400">زمان هشدار</label>
                            <select value={data.notifications.reminders.timing} onChange={(e) => handleSettingChange('reminders', { timing: e.target.value as NotificationTiming })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none">
                                {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Daily Report */}
                <div className="w-full p-4 rounded-[var(--radius-md)] bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex-grow">
                            <div className="font-bold">انگیزه روزانه</div>
                            <div className="text-sm text-slate-400">پیام‌های پیشنهادی</div>
                        </div>
                        <button onClick={() => handleSettingChange('daily_report', { enabled: !data.notifications.daily_report.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${data.notifications.daily_report.enabled ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                    {data.notifications.daily_report.enabled && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <label className="text-sm text-slate-400">زمان دریافت</label>
                            <input type="time" value={data.notifications.daily_report.time} onChange={(e) => handleSettingChange('daily_report', { time: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"/>
                        </div>
                    )}
                </div>
             </div>
        </StepCard>
    );
};

const CompleteStep: React.FC<Pick<StepProps, 'data'>> = ({ data }) => (
    <StepCard title="همه چیز آماده است!">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mt-4 ring-4 ring-green-500/30">
            <CheckCircleIcon className="w-16 h-16 text-green-400" />
        </div>
        <p className="text-slate-400 mb-6">ما براساس پاسخ‌های شما، یک فضای کاری شخصی‌سازی شده آماده کردیم.</p>
        <div className="w-full bg-slate-800/50 rounded-[var(--radius-md)] p-4 text-right">
            <div className="flex items-center">
                 <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mr-4">
                    <UserIcon className="w-6 h-6 text-slate-300" />
                 </div>
                 <div>
                    <div className="font-bold text-lg">{data.fullName || 'کاربر جدید'}</div>
                    <div className="text-sm text-slate-400">{data.role || 'نقش تعریف نشده'}</div>
                 </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="text-slate-400">اهداف: </span>
                    <span className="font-semibold">{data.selectedGoals.length} مورد</span>
                </div>
                 <div>
                    <span className="text-slate-400">عادت‌ها: </span>
                    <span className="font-semibold">{data.habits.length} مورد</span>
                </div>
            </div>
        </div>
    </StepCard>
);


import React, { useState } from 'react';
import { OnboardingData, NotificationType } from '../types';
import { 
    WavingHandIcon, UserIcon, TargetIcon, MoneyIcon, BellIcon, CalendarIcon, CheckCircleIcon,
    HealthIcon, FinanceIcon, EducationIcon, HabitsIcon, BatteryIcon, WifiIcon, 
    WaterDropIcon, ReadingIcon, WalkingIcon, MeditationIcon
} from './icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 8;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    age: '',
    role: '',
    selectedGoals: [],
    habits: [],
    budget: '',
    notifications: {
      tasks: true,
      reminders: false,
      daily_report: false,
    },
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const updateData = (update: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...update }));
  };

  const STEPS = [
    { title: "خوش‌آمدگویی", component: <WelcomeStep /> },
    { title: "شناسایی کاربر", component: <IdentityStep data={data} setData={updateData} /> },
    { title: "انتخاب اهداف", component: <GoalsStep data={data} setData={updateData} /> },
    { title: "عادت‌های روزانه", component: <HabitsStep data={data} setData={updateData} /> },
    { title: "تنظیمات مالی", component: <FinanceStep data={data} setData={updateData} /> },
    { title: "اعلان‌ها", component: <NotificationsStep data={data} setData={updateData} /> },
    { title: "اتصال تقویم", component: <CalendarStep /> },
    { title: "تکمیل", component: <CompleteStep data={data} /> }
  ];

  const currentStep = STEPS[step];
  
  return (
    <div className="min-h-screen bg-[#0F0B1A] flex flex-col p-4 text-white overflow-y-auto">
        <header className="flex justify-between items-center text-sm font-bold px-2">
            <div>9:41</div>
            <div className="flex items-center gap-1.5">
                <WifiIcon className="w-4 h-4" />
                <BatteryIcon className="w-5 h-5" />
            </div>
        </header>

        <div className="px-2 mt-6">
            <div className="text-gray-400 text-sm mb-2">{`مرحله ${step + 1} از ${TOTAL_STEPS}`}</div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
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
                    className="flex-1 py-3 bg-gray-700/50 text-white font-bold rounded-xl"
                >
                    قبلی
                </button>
            )}
            <button
                onClick={step === TOTAL_STEPS - 1 ? onComplete : nextStep}
                className="flex-grow py-3 bg-purple-600 text-white font-bold rounded-xl w-full hover:bg-purple-700 transition-colors"
            >
                {step === TOTAL_STEPS - 1 ? 'شروع میکنم' : (step === 0 ? 'بزن بریم' : 'ادامه')}
            </button>
        </footer>
    </div>
  );
};

const StepCard: React.FC<{title: string; tag?: string, children: React.ReactNode}> = ({title, tag, children}) => (
    <div className="bg-gray-800/50 border border-gray-700/80 rounded-2xl p-6 flex flex-col items-center text-center w-full flex-grow">
        {tag && <div className="text-xs font-bold text-green-400 bg-green-900/50 px-3 py-1 rounded-full mb-4 self-start">{tag}</div>}
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {children}
    </div>
);


const WelcomeStep = () => (
    <div className="flex flex-col items-center justify-center text-center flex-grow">
        <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mb-8">
            <WavingHandIcon className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">به بنویس خوش آمدید</h1>
        <p className="text-gray-400">Life OS شما برای مدیریت هوشمند زندگی</p>
    </div>
);

interface StepProps {
    data: OnboardingData;
    setData: (update: Partial<OnboardingData>) => void;
}

const IdentityStep: React.FC<StepProps> = ({ data, setData }) => (
    <StepCard title="بیایید بیشتر آشنا شویم">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6 mt-4">
            <UserIcon className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-400 mb-6">اطلاعات اولیه خود را وارد کنید</p>
        <div className="w-full space-y-4 text-right">
            <input 
                type="text" 
                placeholder="نام و نام خانوادگی" 
                value={data.fullName}
                onChange={e => setData({ fullName: e.target.value })}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="شغل" 
                    value={data.role}
                    onChange={e => setData({ role: e.target.value })}
                    className="w-2/3 bg-gray-900/80 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <input 
                    type="number" 
                    placeholder="سن" 
                    value={data.age}
                    onChange={e => setData({ age: e.target.value })}
                    className="w-1/3 bg-gray-900/80 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
            </div>
        </div>
    </StepCard>
);

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
            <p className="text-gray-400 mb-6">چه چیزی برای شما مهم است؟</p>
            <div className="grid grid-cols-2 gap-4 w-full">
                {goalOptions.map(goal => {
                    const isSelected = data.selectedGoals.includes(goal.name);
                    return (
                        <button key={goal.name} onClick={() => toggleGoal(goal.name)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center ${
                                isSelected ? 'bg-purple-600 border-purple-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                            }`}
                        >
                            <goal.icon className={`w-10 h-10 mb-2 ${goal.color}`} />
                            <span className="font-bold">{goal.name}</span>
                            <span className="text-xs text-gray-400">{goal.desc}</span>
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
             <p className="text-gray-400 mb-6">کدام عادت‌ها را می‌خواهید دنبال کنید؟</p>
             <div className="w-full space-y-3">
                {habitOptions.map(habit => {
                    const isSelected = data.habits.includes(habit.name);
                    return (
                        <button key={habit.name} onClick={() => toggleHabit(habit.name)}
                            className={`w-full p-4 rounded-lg border-2 flex items-center text-right transition-all ${
                                isSelected ? 'bg-purple-600 border-purple-500' : 'bg-gray-700/50 border-gray-600'
                            }`}
                        >
                            <div className={`p-2 rounded-md mr-4 ${isSelected ? 'bg-white/20' : 'bg-gray-600'}`}>
                                <habit.icon className="w-6 h-6 text-white"/>
                            </div>
                            <span className="flex-grow font-semibold">{habit.name}</span>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${
                                isSelected ? 'bg-purple-500 border-purple-400' : 'border-gray-500'
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

const FinanceStep: React.FC<StepProps> = ({ data, setData }) => (
    <StepCard title="مدیریت مالی" tag="Finance">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6 mt-4">
            <MoneyIcon className="w-12 h-12 text-yellow-400" />
        </div>
        <p className="text-gray-400 mb-6">بودجه ماهانه (اختیاری)</p>
        <div className="w-full">
            <input 
                type="number" 
                placeholder="بودجه ماهانه (تومان)" 
                value={data.budget}
                onChange={e => setData({ budget: e.target.value })}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg p-3 text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
        </div>
        <div className="w-full bg-gray-700/50 rounded-lg p-4 mt-6 text-right">
            <h3 className="font-bold mb-2">دسته‌بندی هزینه‌ها</h3>
            <div className="text-sm space-y-2">
                <div className="flex justify-between"><span>مسکن</span><span>۴۰٪</span></div>
                <div className="flex justify-between"><span>غذا</span><span>۲۵٪</span></div>
                <div className="flex justify-between"><span>حمل و نقل</span><span>۱۵٪</span></div>
                <div className="flex justify-between"><span>سرگرمی</span><span>۲۰٪</span></div>
            </div>
        </div>
    </StepCard>
);

const notificationOptions: { key: NotificationType, title: string, desc: string }[] = [
    { key: 'tasks', title: 'یادآوری وظایف', desc: 'قبل از سررسید کارها' },
    { key: 'reminders', title: 'گزارش مالی', desc: 'خلاصه هزینه‌های هفتگی' },
    { key: 'daily_report', title: 'انگیزه روزانه', desc: 'پیام‌های پیشنهادی' },
];

const NotificationsStep: React.FC<StepProps> = ({ data, setData }) => {
    const toggleNotification = (key: NotificationType) => {
        setData({
            notifications: {
                ...data.notifications,
                [key]: !data.notifications[key],
            },
        });
    };

    return (
        <StepCard title="تنظیم اعلان‌ها" tag="Notifications">
             <p className="text-gray-400 mb-6">نوع اعلان‌هایی که می‌خواهید دریافت کنید را مشخص کنید.</p>
             <div className="w-full space-y-3 text-right">
                {notificationOptions.map(opt => (
                    <div key={opt.key} onClick={() => toggleNotification(opt.key)}
                        className="w-full p-4 rounded-lg bg-gray-700/50 border-2 border-gray-600 flex items-center cursor-pointer"
                    >
                         <div className="p-2 rounded-md mr-4 bg-gray-600">
                            <BellIcon className="w-6 h-6 text-yellow-400"/>
                        </div>
                        <div className="flex-grow">
                            <div className="font-bold">{opt.title}</div>
                            <div className="text-sm text-gray-400">{opt.desc}</div>
                        </div>
                        <div className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${data.notifications[opt.key] ? 'bg-purple-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full"></div>
                        </div>
                    </div>
                ))}
             </div>
        </StepCard>
    );
};

const CalendarStep = () => (
    <StepCard title="اتصال تقویم" tag="Calendar">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6 mt-4">
            <CalendarIcon className="w-12 h-12 text-blue-400" />
        </div>
        <p className="text-gray-400 mb-6">برای مدیریت بهتر رویدادها، تقویم خود را متصل کنید.</p>
        <div className="w-full space-y-3">
            <button className="w-full p-4 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center text-right hover:bg-gray-700">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-6 h-6 mr-4" alt="Google Calendar"/>
                <span className="flex-grow font-semibold">اتصال Google Calendar</span>
            </button>
            <button className="w-full p-4 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center text-right hover:bg-gray-700">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/Outlook_Icon.svg" className="w-6 h-6 mr-4" alt="Outlook"/>
                <span className="flex-grow font-semibold">اتصال Outlook</span>
            </button>
        </div>
    </StepCard>
);

const CompleteStep: React.FC<Pick<StepProps, 'data'>> = ({ data }) => (
    <StepCard title="همه چیز آماده است!">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mt-4 ring-4 ring-green-500/30">
            <CheckCircleIcon className="w-16 h-16 text-green-400" />
        </div>
        <p className="text-gray-400 mb-6">ما براساس پاسخ‌های شما، یک فضای کاری شخصی‌سازی شده آماده کردیم.</p>
        <div className="w-full bg-gray-700/50 rounded-lg p-4 text-right">
            <div className="flex items-center">
                 <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mr-4">
                    <UserIcon className="w-6 h-6 text-gray-300" />
                 </div>
                 <div>
                    <div className="font-bold text-lg">{data.fullName || 'کاربر جدید'}</div>
                    <div className="text-sm text-gray-400">{data.role || 'نقش تعریف نشده'}</div>
                 </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="text-gray-400">اهداف: </span>
                    <span className="font-semibold">{data.selectedGoals.length} مورد</span>
                </div>
                 <div>
                    <span className="text-gray-400">عادت‌ها: </span>
                    <span className="font-semibold">{data.habits.length} مورد</span>
                </div>
            </div>
        </div>
    </StepCard>
);

export default OnboardingScreen;


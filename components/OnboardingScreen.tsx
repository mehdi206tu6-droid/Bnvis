
import React, { useState, useEffect } from 'react';
import { OnboardingData, NotificationType, NotificationTiming, DailyReportSetting, NotificationSetting, Habit, ThemeName, UserGoal } from '../types';
import { 
    WavingHandIcon, UserIcon, TargetIcon, MoneyIcon, BellIcon, CalendarIcon, CheckCircleIcon,
    HealthIcon, FinanceIcon, EducationIcon, HabitsIcon, BatteryIcon, WifiIcon, 
    WaterDropIcon, ReadingIcon, WalkingIcon, MeditationIcon, SunIcon, CloudIcon, PlusIcon, TrashIcon,
    BriefcaseIcon, SparklesIcon, MoonIcon, BoltIcon
} from './icons';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
}

const TOTAL_STEPS = 8;

// Temporary state for onboarding flow
type OnboardingState = Omit<OnboardingData, 'theme' | 'habits' | 'financialAccounts' | 'budgets' | 'transactions' | 'transactionCategories' | 'incomeAnalysis' | 'calendarEvents'> & {
  habits: string[];
  theme: ThemeName;
};

const presetGoals = [
    { id: 'goal-health', title: 'بهبود سلامتی', icon: 'Health' },
    { id: 'goal-finance', title: 'مدیریت مالی', icon: 'Finance' },
    { id: 'goal-education', title: 'یادگیری مهارت جدید', icon: 'Education' },
    { id: 'goal-habit', title: 'ساخت عادت‌های خوب', icon: 'Habits' },
    { id: 'goal-work', title: 'پیشرفت شغلی', icon: 'Briefcase' },
];

const presetHabits = [
    'نوشیدن آب', 'مطالعه', 'ورزش', 'مدیتیشن', 'خواب زود', 'برنامه‌ریزی روزانه'
];

const themes: { id: ThemeName; name: string; color: string }[] = [
    { id: 'benvis_classic', name: 'کلاسیک بنویس', color: '#a855f7' },
    { id: 'oceanic_deep', name: 'اعماق اقیانوس', color: '#3b82f6' },
    { id: 'forest_whisper', name: 'نجوای جنگل', color: '#22c55e' },
    { id: 'sunset_bliss', name: 'آرامش غروب', color: '#f43f5e' },
    { id: 'galaxy_dream', name: 'رویای کهکشانی', color: '#7c3aed' },
];

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
      tasks: { enabled: true, timing: '1h', sound: 'default' },
      reminders: { enabled: true, timing: '1d', sound: 'default' },
      daily_report: { enabled: false, time: '09:00', sound: 'default' },
      budget_alerts: { enabled: true, timing: '1h', sound: 'default' },
      low_balance_warnings: { enabled: true, timing: '1h', sound: 'default' },
    },
    goals: [],
    tasks: [],
    timeBlocks: [],
    xp: 0,
    level: 1,
    achievements: [],
    theme: 'benvis_classic',
    shopInventory: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  const finishOnboarding = () => {
      // Convert local state to full OnboardingData
      const finalHabits: Habit[] = data.habits.map(h => ({
          name: h,
          type: 'good',
          icon: h === 'نوشیدن آب' ? 'WaterDrop' : 
                h === 'مطالعه' ? 'Reading' : 
                h === 'ورزش' ? 'Walking' : 
                h === 'مدیتیشن' ? 'Meditation' : 'CheckCircle'
      }));
      
      const finalTheme = { name: data.theme, animations: { enabled: true } };
      
      // Create Goal objects from selected IDs
      const finalGoals: UserGoal[] = data.selectedGoals.map(id => {
          const preset = presetGoals.find(p => p.id === id);
          return {
              id: `goal-${Date.now()}-${id}`,
              type: 'simple',
              title: preset?.title || 'هدف جدید',
              icon: preset?.icon || 'Target',
              progress: 0,
              progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: 0 }]
          };
      });

      onComplete({
          ...data,
          habits: finalHabits,
          theme: finalTheme,
          goals: finalGoals
      });
  };

  const toggleGoal = (id: string) => {
      setData(prev => ({
          ...prev,
          selectedGoals: prev.selectedGoals.includes(id) 
            ? prev.selectedGoals.filter(g => g !== id)
            : [...prev.selectedGoals, id]
      }));
  };

  const toggleHabit = (habit: string) => {
      setData(prev => ({
          ...prev,
          habits: prev.habits.includes(habit)
            ? prev.habits.filter(h => h !== habit)
            : [...prev.habits, habit]
      }));
  };

  const updateNotification = (key: keyof typeof data.notifications, field: string, value: any) => {
      setData(prev => ({
          ...prev,
          notifications: {
              ...prev.notifications,
              [key]: { ...prev.notifications[key], [field]: value }
          }
      }));
  };

  const renderStep = () => {
      switch(step) {
          case 0: return (
              <div className="text-center space-y-6 animate-bounce-in">
                  <div className="w-24 h-24 bg-violet-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                      <WavingHandIcon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">به Benvis خوش آمدید</h1>
                    <p className="text-gray-400">سیستم عامل هوشمند برای مدیریت زندگی شما</p>
                  </div>
                  <button onClick={handleNext} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all shadow-lg">
                      شروع کنید
                  </button>
              </div>
          );
          case 1: return (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white text-center">معرفی</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-gray-400 text-sm mb-2">نام شما</label>
                          <input 
                            type="text" 
                            value={data.fullName} 
                            onChange={e => setData({...data, fullName: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            placeholder="مثلا: علی"
                          />
                      </div>
                      <div>
                          <label className="block text-gray-400 text-sm mb-2">سن (اختیاری)</label>
                          <input 
                            type="number" 
                            value={data.age} 
                            onChange={e => setData({...data, age: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            placeholder="مثلا: ۲۵"
                          />
                      </div>
                  </div>
                  <button onClick={handleNext} disabled={!data.fullName} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      ادامه
                  </button>
              </div>
          );
          case 2: return (
             <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white text-center">شغل یا نقش</h2>
                  <p className="text-center text-gray-400 text-sm">این به ما کمک می‌کند تا پیشنهادات بهتری به شما بدهیم.</p>
                  <input 
                    type="text" 
                    value={data.role} 
                    onChange={e => setData({...data, role: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="مثلا: دانشجو، برنامه‌نویس، طراح..."
                  />
                  <button onClick={handleNext} disabled={!data.role} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      ادامه
                  </button>
              </div>
          );
          case 3: return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white text-center">جنسیت</h2>
                 <p className="text-center text-gray-400 text-sm">برای فعال‌سازی ویژگی‌های سلامت مربوطه.</p>
                 <div className="grid grid-cols-2 gap-4">
                     {['male', 'female', 'other', 'prefer_not_to_say'].map(g => (
                         <button
                            key={g}
                            onClick={() => setData({...data, gender: g as any})}
                            className={`p-4 rounded-xl border transition-all ${data.gender === g ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'}`}
                         >
                             {g === 'male' ? 'آقا' : g === 'female' ? 'خانم' : g === 'other' ? 'سایر' : 'ترجیح می‌دهم نگویم'}
                         </button>
                     ))}
                 </div>
                 <button onClick={handleNext} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all">
                      ادامه
                  </button>
             </div>
         );
         case 4: return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white text-center">اهداف اصلی</h2>
                 <div className="space-y-3">
                     {presetGoals.map(goal => (
                         <button
                            key={goal.id}
                            onClick={() => toggleGoal(goal.id)}
                            className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all ${data.selectedGoals.includes(goal.id) ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'}`}
                         >
                             <div className={`p-2 rounded-full ${data.selectedGoals.includes(goal.id) ? 'bg-violet-600' : 'bg-slate-700'}`}>
                                <TargetIcon className="w-5 h-5"/>
                             </div>
                             <span className="font-semibold">{goal.title}</span>
                             {data.selectedGoals.includes(goal.id) && <CheckCircleIcon className="w-5 h-5 text-violet-400 mr-auto"/>}
                         </button>
                     ))}
                 </div>
                 <button onClick={handleNext} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all">
                      ادامه ({data.selectedGoals.length} انتخاب شده)
                  </button>
             </div>
         );
         case 5: return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white text-center">عادت‌های اولیه</h2>
                 <div className="grid grid-cols-2 gap-3">
                     {presetHabits.map(habit => (
                         <button
                            key={habit}
                            onClick={() => toggleHabit(habit)}
                            className={`p-3 rounded-xl border text-center text-sm transition-all ${data.habits.includes(habit) ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'}`}
                         >
                             {habit}
                         </button>
                     ))}
                 </div>
                 <button onClick={handleNext} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all">
                      ادامه
                  </button>
             </div>
         );
         case 6: return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white text-center">تنظیمات اعلان</h2>
                 <div className="space-y-4">
                     <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl">
                         <div>
                             <h3 className="font-bold text-white">یادآوری وظایف</h3>
                             <p className="text-xs text-gray-400">هشدار برای تسک‌های روزانه</p>
                         </div>
                         <button onClick={() => updateNotification('tasks', 'enabled', !data.notifications.tasks.enabled)} className={`w-12 h-7 rounded-full p-1 transition-all ${data.notifications.tasks.enabled ? 'bg-violet-600 justify-end flex' : 'bg-slate-600 justify-start flex'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                         </button>
                     </div>
                     <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl">
                         <div>
                             <h3 className="font-bold text-white">گزارش صبحگاهی</h3>
                             <p className="text-xs text-gray-400">خلاصه برنامه روز در ساعت ۹</p>
                         </div>
                         <button onClick={() => updateNotification('daily_report', 'enabled', !data.notifications.daily_report.enabled)} className={`w-12 h-7 rounded-full p-1 transition-all ${data.notifications.daily_report.enabled ? 'bg-violet-600 justify-end flex' : 'bg-slate-600 justify-start flex'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                         </button>
                     </div>
                     <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl">
                         <div>
                             <h3 className="font-bold text-white">هشدارهای مالی</h3>
                             <p className="text-xs text-gray-400">بودجه و موجودی کم</p>
                         </div>
                         <button onClick={() => updateNotification('budget_alerts', 'enabled', !data.notifications.budget_alerts?.enabled)} className={`w-12 h-7 rounded-full p-1 transition-all ${data.notifications.budget_alerts?.enabled ? 'bg-violet-600 justify-end flex' : 'bg-slate-600 justify-start flex'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                         </button>
                     </div>
                 </div>
                 <button onClick={handleNext} className="w-full py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-all">
                      ادامه
                  </button>
             </div>
         );
         case 7: return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white text-center">انتخاب تم</h2>
                 <div className="grid grid-cols-2 gap-4">
                     {themes.map(theme => (
                         <button
                            key={theme.id}
                            onClick={() => setData({...data, theme: theme.id})}
                            className={`p-4 rounded-xl border transition-all relative overflow-hidden ${data.theme === theme.id ? 'ring-2 ring-white' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            style={{ backgroundColor: theme.color }}
                         >
                             <span className="relative z-10 font-bold text-white text-shadow-sm">{theme.name}</span>
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                         </button>
                     ))}
                 </div>
                 <button onClick={finishOnboarding} className="w-full py-3 bg-white text-violet-900 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      پایان و ورود به برنامه
                  </button>
             </div>
         );
      }
  };

  return (
    <div className="min-h-screen bg-[#020005] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-violet-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-blue-900/20 rounded-full blur-[100px]"></div>

        <div className="w-full max-w-md relative z-10">
            {step > 0 && (
                <div className="mb-8">
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}></div>
                    </div>
                </div>
            )}
            
            {renderStep()}
            
            {step > 0 && (
                <button onClick={handleBack} className="w-full mt-4 text-gray-500 hover:text-white transition-colors text-sm">
                    بازگشت
                </button>
            )}
        </div>
    </div>
  );
};

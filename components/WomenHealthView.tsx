import React, { useState, useMemo, useEffect, useRef } from 'react';
import { OnboardingData, Cycle, Symptom, FlowIntensity, SymptomLog, Companion, WomenHealthData, NotificationSetting, NotificationType, NotificationTiming } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon, ChartBarIcon, ShareIcon, HealthIcon, CogIcon, SpeakerWaveIcon, TrashIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DATA & OPTIONS ---

const symptomOptions: { id: Symptom, label: string }[] = [
    { id: 'cramps', label: 'گرفتگی' }, { id: 'headache', label: 'سردرد' },
    { id: 'fatigue', label: 'خستگی' }, { id: 'nausea', label: 'تهوع' },
    { id: 'bloating', label: 'نفخ' }, { id: 'mood_swings', label: 'نوسان خلقی' },
];

const flowOptions: { id: FlowIntensity, label: string }[] = [
    { id: 'spotting', label: 'لکه‌بینی' }, { id: 'light', label: 'کم' },
    { id: 'medium', label: 'متوسط' }, { id: 'heavy', label: 'زیاد' },
];

const timingOptions: { value: NotificationTiming; label: string }[] = [
    { value: '1h', label: '۱ ساعت قبل' },
    { value: '6h', label: '۶ ساعت قبل' },
    { value: '1d', label: 'روز قبل' },
];

const soundOptions = [
    { value: 'default', label: 'پیش‌فرض' },
    { value: 'chime', label: 'زنگوله' },
    { value: 'melody', label: 'ملودی' },
];

// --- TAB COMPONENTS ---

const DailyTipsTab: React.FC<{ dayOfCycle: number | null, todayLog: SymptomLog | null }> = ({ dayOfCycle, todayLog }) => {
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const todayStr = new Date().toISOString().split('T')[0];

    const getCyclePhase = (day: number | null) => {
        if (day === null) return "Unknown";
        if (day <= 5) return "Menstruation";
        if (day <= 13) return "Follicular";
        if (day <= 15) return "Ovulation";
        return "Luteal";
    }

    useEffect(() => {
        const generateTip = async () => {
            if (dayOfCycle === null) return;
            
            const cachedTip = localStorage.getItem(`benvis_wh_tip_${todayStr}`);
            if (cachedTip) {
                setTip(cachedTip);
                return;
            }
            
            setIsLoading(true);
            try {
                const phase = getCyclePhase(dayOfCycle);
                const symptomsText = todayLog?.symptoms.length ? ` The user is experiencing: ${todayLog.symptoms.join(', ')}.` : '';
                const prompt = `As a women's health expert for Benvis Life OS, provide a short, actionable, and empathetic tip for today in Persian.
                - Day of cycle: ${dayOfCycle}
                - Cycle phase: ${phase}
                ${symptomsText}
                Focus on one area: nutrition, exercise, self-care, or symptom management. Keep it under 50 words. Be positive and encouraging.`;

                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const generatedTip = response?.text || "امروز به بدن خود گوش دهید و به آن استراحت و تغذیه مناسب هدیه دهید.";
                setTip(generatedTip);
                localStorage.setItem(`benvis_wh_tip_${todayStr}`, generatedTip);
            } catch (err: any) {
                console.error("Error generating tip:", err);
                const errorMessage = err?.message || '';
                if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                    setTip('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
                } else {
                    setTip("خطا در دریافت نکته روز. لطفاً بعداً تلاش کنید.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        generateTip();
    }, [dayOfCycle, todayLog, todayStr]);

    return (
        <div className="p-4">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <SparklesIcon className="w-8 h-8 text-rose-300 animate-pulse" />
                </div>
            ) : (
                <div className="bg-rose-900/40 border border-rose-700/50 rounded-[var(--radius-lg)] p-4 text-center">
                    <p className="font-semibold text-lg text-rose-200">نکته هوشمند امروز</p>
                    <p className="mt-2 text-rose-200/90">{tip}</p>
                </div>
            )}
        </div>
    );
};

const AnalyticsTab: React.FC<{ cycles: Cycle[] }> = ({ cycles }) => {
    if (cycles.length < 2) {
        return <div className="p-4 text-center text-gray-400">برای نمایش تحلیل، حداقل به ۲ چرخه ثبت‌شده نیاز است.</div>
    }
    
    const cycleLengths = useMemo(() => {
        const lengths: number[] = [];
        for (let i = 0; i < cycles.length - 1; i++) {
            const start1 = new Date(cycles[i].startDate);
            const start2 = new Date(cycles[i+1].startDate);
            const length = Math.round((start2.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24));
            lengths.push(length);
        }
        return lengths.slice(-6);
    }, [cycles]);
    
    const allLogs = useMemo(() => cycles.flatMap(c => Object.values(c.logs)), [cycles]);

    const symptomFrequency = useMemo(() => allLogs.flatMap(l => l.symptoms).reduce((acc, symptom) => {
        acc[symptom] = (acc[symptom] || 0) + 1;
        return acc;
    }, {} as Record<Symptom, number>), [allLogs]);

     const flowFrequency = useMemo(() => allLogs.map(l => l.flow).filter(Boolean).reduce((acc, flow) => {
        acc[flow!] = (acc[flow!] || 0) + 1;
        return acc;
    }, {} as Record<FlowIntensity, number>), [allLogs]);

    
    const maxSymptomFreq = Math.max(1, ...Object.values(symptomFrequency) as number[]);
    const maxFlowFreq = Math.max(1, ...Object.values(flowFrequency) as number[]);
    const avgCycleLength = cycleLengths.length > 0 ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length : 0;

    return (
        <div className="p-4 space-y-6">
            <div>
                <h4 className="font-bold mb-2">طول چرخه‌های اخیر (روز)</h4>
                 <div className="bg-gray-800/50 p-4 rounded-[var(--radius-lg)]">
                    {cycleLengths.length > 0 ? (
                        <svg width="100%" height="120" aria-labelledby="cycle-chart-title">
                            <title id="cycle-chart-title">نمودار طول چرخه</title>
                            {cycleLengths.map((len: number, i: number) => {
                                const barHeight = (len / 40) * 100;
                                const x = (i * (100 / cycleLengths.length)) + (100 / (cycleLengths.length * 2));
                                return (
                                    <g key={i} className="group">
                                        <rect x={`${x - 4}%`} y={`${100 - barHeight}%`} width="8%" height={`${barHeight}%`} fill="currentColor" className="text-rose-500/80 group-hover:text-rose-400 transition-colors" rx="2"/>
                                        <text x={`${x}%`} y="115" textAnchor="middle" fill="currentColor" className="text-xs text-gray-400 font-bold">{len}</text>
                                    </g>
                                )
                            })}
                        </svg>
                    ) : <p className="text-sm text-gray-400 text-center">اطلاعاتی برای نمایش وجود ندارد.</p>}
                     <p className="text-center text-xs text-gray-400 mt-2">میانگین: {avgCycleLength.toFixed(1)} روز</p>
                </div>
            </div>
            <div>
                <h4 className="font-bold mb-2">فراوانی علائم</h4>
                <div className="bg-gray-800/50 p-4 rounded-[var(--radius-lg)] space-y-3">
                    {symptomOptions.map(opt => {
                        const count = symptomFrequency[opt.id] || 0;
                        const width = (count / maxSymptomFreq) * 100;
                        return (
                            <div key={opt.id} className="grid grid-cols-3 items-center gap-2 text-sm group">
                                <span className="text-gray-300 text-right">{opt.label}</span>
                                <div className="col-span-2 flex items-center gap-2">
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-rose-500/80 h-2.5 rounded-full transition-all duration-300 group-hover:bg-rose-400" style={{ width: `${width}%`}}></div>
                                    </div>
                                    <span className="font-bold w-6 text-left">{count}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
             <div>
                <h4 className="font-bold mb-2">فراوانی شدت خونریزی</h4>
                <div className="bg-gray-800/50 p-4 rounded-[var(--radius-lg)] space-y-3">
                    {flowOptions.map(opt => {
                        const count = flowFrequency[opt.id] || 0;
                        const width = (count / maxFlowFreq) * 100;
                        return (
                            <div key={opt.id} className="grid grid-cols-3 items-center gap-2 text-sm group">
                                <span className="text-gray-300 text-right">{opt.label}</span>
                                <div className="col-span-2 flex items-center gap-2">
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-rose-500/80 h-2.5 rounded-full transition-all duration-300 group-hover:bg-rose-400" style={{ width: `${width}%`}}></div>
                                    </div>
                                    <span className="font-bold w-6 text-left">{count}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const SharingTab: React.FC<{
    companion: Companion | undefined;
    onSave: (companion: Companion) => void;
}> = ({ companion, onSave }) => {
    const [email, setEmail] = useState(companion?.email || '');
    const [sharePeriod, setSharePeriod] = useState(companion?.sharePeriod || false);
    const [shareFertility, setShareFertility] = useState(companion?.shareFertility || false);
    const [sharePms, setSharePms] = useState(companion?.sharePms || false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = () => {
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            alert("لطفا یک ایمیل معتبر وارد کنید.");
            return;
        }
        onSave({ email, sharePeriod, shareFertility, sharePms });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide message after 3 seconds
    };
    
    const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-[var(--radius-md)]">
        <span className="font-semibold text-gray-300">{label}</span>
        <button 
          onClick={() => onChange(!checked)} 
          className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${checked ? 'bg-rose-500' : 'bg-gray-600'}`}
        >
          <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );

    return (
        <div className="p-4 space-y-4">
            <p className="text-sm text-gray-400">با به اشتراک گذاشتن اطلاعات چرخه‌تان، به شریک زندگی خود کمک کنید تا شما را بهتر درک و حمایت کند. با ذخیره کردن، یک ایمیل دعوتنامه برای همراه شما ارسال می‌شود.</p>
            <div>
                <label className="block text-sm font-semibold mb-2 text-right">ایمیل همراه</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="w-full bg-gray-900/80 border border-gray-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-rose-500 focus:outline-none"/>
            </div>
            <div className="space-y-3">
                <h4 className="font-semibold">چه چیزهایی را به اشتراک بگذاریم؟</h4>
                <ToggleSwitch checked={sharePeriod} onChange={setSharePeriod} label="شروع دوره پریود" />
                <ToggleSwitch checked={shareFertility} onChange={setShareFertility} label="پنجره باروری و تخمک‌گذاری" />
                <ToggleSwitch checked={sharePms} onChange={setSharePms} label="هشدارهای سندروم پیش از قاعدگی (PMS)" />
            </div>
            <button onClick={handleSave} className="w-full py-3 bg-rose-600 rounded-[var(--radius-md)] font-semibold hover:bg-rose-700 transition-colors">ذخیره و ارسال دعوتنامه</button>
            {saveSuccess && (
                <div className="mt-2 p-3 bg-green-500/20 text-green-300 text-sm font-semibold rounded-md text-center">
                    تنظیمات با موفقیت ذخیره شد. دعوتنامه ارسال گردید.
                </div>
            )}
            <p className="text-xs text-gray-500 text-center mt-2">توجه: ارسال واقعی دعوتنامه و اعلان‌ها نیازمند تنظیمات سمت سرور (Cloud Functions & FCM) است که در این نسخه شبیه‌سازی شده است.</p>
        </div>
    );
};

const CycleHistoryEditor: React.FC<{
    cycles: Cycle[];
    onSave: (updatedCycles: Cycle[]) => void;
    onBack: () => void;
}> = ({ cycles, onSave, onBack }) => {
    // Sort cycles by most recent first for editing
    const [editedCycles, setEditedCycles] = useState<Cycle[]>(
        [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    );

    const handleUpdateCycle = (index: number, field: 'startDate' | 'endDate', value: string) => {
        const updated = [...editedCycles];
        updated[index] = { ...updated[index], [field]: value };
        setEditedCycles(updated);
    };

    const handleAddCycle = () => {
        const newCycle: Cycle = {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            logs: {}
        };
        setEditedCycles([newCycle, ...editedCycles]);
    };

    const handleRemoveCycle = (index: number) => {
        setEditedCycles(editedCycles.filter((_, i) => i !== index));
    };

    const handleSaveChanges = () => {
        // Basic validation
        for (const cycle of editedCycles) {
            if (!cycle.startDate || !cycle.endDate || new Date(cycle.startDate) > new Date(cycle.endDate)) {
                alert('لطفا تاریخ‌های معتبر وارد کنید. تاریخ شروع باید قبل از تاریخ پایان باشد.');
                return;
            }
        }
        onSave(editedCycles);
    };

    return (
        <div className="p-4">
            <button onClick={onBack} className="font-semibold mb-4 text-rose-300">&larr; بازگشت به تنظیمات</button>
            <h4 className="font-bold mb-4 text-lg">ویرایش تاریخچه چرخه‌ها</h4>
            <p className="text-sm text-gray-400 mb-4">با وارد کردن اطلاعات گذشته، تحلیل‌ها و پیش‌بینی‌های دقیق‌تری دریافت کنید.</p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {editedCycles.map((cycle, index) => (
                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex items-center gap-2">
                        <div className="flex-grow grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-xs text-gray-400">تاریخ شروع</label>
                                <input
                                    type="date"
                                    value={cycle.startDate}
                                    onChange={(e) => handleUpdateCycle(index, 'startDate', e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">تاریخ پایان</label>
                                <input
                                    type="date"
                                    value={cycle.endDate}
                                    onChange={(e) => handleUpdateCycle(index, 'endDate', e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-md text-sm"
                                />
                            </div>
                        </div>
                        <button onClick={() => handleRemoveCycle(index)} className="p-2 text-red-400 hover:text-red-300">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
            </div>

            <button onClick={handleAddCycle} className="w-full mt-4 py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700/50">
                افزودن چرخه جدید
            </button>

            <button onClick={handleSaveChanges} className="w-full mt-4 py-3 bg-rose-600 rounded-md font-semibold hover:bg-rose-700">
                ذخیره تغییرات
            </button>
        </div>
    );
};


const SettingsTab: React.FC<{
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}> = ({ userData, onUpdateUserData }) => {
    const { womenHealth, notifications } = userData;
    const [cycleLength, setCycleLength] = useState(womenHealth.cycleLength);
    const [periodLength, setPeriodLength] = useState(womenHealth.periodLength);
    const [settingsView, setSettingsView] = useState<'main' | 'history'>('main');
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }, []);

    const playSound = (sound: string) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

        switch (sound) {
            case 'chime':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                break;
            case 'melody':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(659, ctx.currentTime); // E5
                oscillator.frequency.linearRampToValueAtTime(783, ctx.currentTime + 0.1); // G5
                oscillator.frequency.linearRampToValueAtTime(523, ctx.currentTime + 0.2); // C5
                break;
            case 'default':
            default:
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, ctx.currentTime);
                break;
        }

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
    };

    const handleSaveLengths = () => {
        onUpdateUserData({
            ...userData,
            womenHealth: {
                ...womenHealth,
                cycleLength: cycleLength,
                periodLength: periodLength,
            }
        });
        alert("تنظیمات ذخیره شد.");
    };

    const handleNotificationChange = (key: 'womenHealth_period' | 'womenHealth_fertile', value: Partial<NotificationSetting>) => {
        onUpdateUserData({
            ...userData,
            notifications: {
                ...notifications,
                [key]: { ...notifications[key], ...value },
            },
        });
    };
    
    if (settingsView === 'history') {
        return <CycleHistoryEditor
            cycles={userData.womenHealth.cycles}
            onSave={(updatedCycles) => {
                onUpdateUserData({
                    ...userData,
                    womenHealth: { ...userData.womenHealth, cycles: updatedCycles }
                });
                setSettingsView('main');
            }}
            onBack={() => setSettingsView('main')}
        />;
    }


    return (
        <div className="p-4 space-y-6">
             <div>
                <h4 className="font-bold mb-2">تنظیمات چرخه</h4>
                <div className="p-4 bg-gray-800/50 rounded-[var(--radius-lg)] space-y-4">
                    <p className="text-sm text-gray-400">
                        با تنظیم دقیق طول چرخه و پریود، پیش‌بینی‌های تقویم را دقیق‌تر کنید.
                    </p>
                    <div>
                        <label htmlFor="cycle-length" className="block text-sm font-semibold mb-2 text-right">
                            میانگین طول چرخه (روز)
                        </label>
                        <input 
                            type="number" 
                            id="cycle-length"
                            value={cycleLength} 
                            onChange={e => setCycleLength(Number(e.target.value))} 
                            min="20" 
                            max="45"
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">معمولاً بین ۲۱ تا ۳۵ روز است.</p>
                    </div>
                    <div>
                        <label htmlFor="period-length" className="block text-sm font-semibold mb-2 text-right">
                            میانگین طول پریود (روز)
                        </label>
                        <input 
                            type="number" 
                            id="period-length"
                            value={periodLength} 
                            onChange={e => setPeriodLength(Number(e.target.value))} 
                            min="1" 
                            max="10"
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">معمولاً بین ۳ تا ۷ روز است.</p>
                    </div>
                     <button onClick={() => setSettingsView('history')} className="w-full py-2 bg-gray-700/80 rounded-[var(--radius-md)] font-semibold hover:bg-gray-700">
                        ثبت و ویرایش چرخه‌های گذشته
                    </button>
                    <button onClick={handleSaveLengths} className="w-full py-3 bg-rose-600 rounded-[var(--radius-md)] font-semibold hover:bg-rose-700">
                        ذخیره تنظیمات
                    </button>
                </div>
            </div>
            <div>
                <h4 className="font-bold mb-2">تنظیمات اعلان‌ها</h4>
                <div className="p-4 bg-gray-800/50 rounded-[var(--radius-lg)] space-y-4">
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold">هشدار شروع پریود</h4>
                                <p className="text-sm text-gray-400">اعلان قبل از شروع دوره بعدی</p>
                            </div>
                            <button onClick={() => handleNotificationChange('womenHealth_period', { enabled: !notifications.womenHealth_period?.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${notifications.womenHealth_period?.enabled ? 'bg-rose-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                                <div className="w-5 h-5 bg-white rounded-full"></div>
                            </button>
                        </div>
                        {notifications.womenHealth_period?.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-700/50">
                                <select value={notifications.womenHealth_period.timing} onChange={(e) => handleNotificationChange('womenHealth_period', { timing: e.target.value as NotificationTiming })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <div className="flex items-center gap-2">
                                    <select value={notifications.womenHealth_period.sound || 'default'} onChange={(e) => handleNotificationChange('womenHealth_period', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                        {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <button onClick={() => playSound(notifications.womenHealth_period.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold">هشدار پنجره باروری</h4>
                                <p className="text-sm text-gray-400">اعلان در زمان شروع دوره باروری</p>
                            </div>
                            <button onClick={() => handleNotificationChange('womenHealth_fertile', { enabled: !notifications.womenHealth_fertile?.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${notifications.womenHealth_fertile?.enabled ? 'bg-rose-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                                <div className="w-5 h-5 bg-white rounded-full"></div>
                            </button>
                        </div>
                         {notifications.womenHealth_fertile?.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-700/50">
                                <select value={notifications.womenHealth_fertile.timing} onChange={(e) => handleNotificationChange('womenHealth_fertile', { timing: e.target.value as NotificationTiming })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <div className="flex items-center gap-2">
                                    <select value={notifications.womenHealth_fertile.sound || 'default'} onChange={(e) => handleNotificationChange('womenHealth_fertile', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                        {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <button onClick={() => playSound(notifications.womenHealth_fertile.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- CALENDAR COMPONENTS ---

const CalendarHeader: React.FC<{
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}> = ({ currentDate, onPrevMonth, onNextMonth }) => (
    <div className="flex justify-between items-center mb-4">
        <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-gray-700">
            <ChevronRightIcon className="w-6 h-6" />
        </button>
        <h3 className="font-bold text-lg">
            {currentDate.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-700">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
    </div>
);

const DailyLogPanel: React.FC<{
    selectedDate: Date | null;
    selectedDayLog: SymptomLog | null;
    isPeriod: boolean;
    onPeriodToggle: (date: Date) => void;
    onLogChange: (log: Partial<SymptomLog>) => void;
}> = ({ selectedDate, selectedDayLog, isPeriod, onPeriodToggle, onLogChange }) => {
     if (!selectedDate || !selectedDayLog) {
        return (
            <div className="flex items-center justify-center h-full text-center text-gray-400">
                <p>یک روز را برای ثبت یا مشاهده اطلاعات انتخاب کنید.</p>
            </div>
        );
    }
    return (
        <div>
            <h4 className="font-bold mb-3">{selectedDate.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
             <button onClick={() => onPeriodToggle(selectedDate)} className={`w-full py-2 mb-4 rounded-md font-semibold text-white ${isPeriod ? 'bg-rose-700 hover:bg-rose-800' : 'bg-rose-500 hover:bg-rose-600'}`}>
                {isPeriod ? 'حذف روز پریود' : 'ثبت روز پریود'}
            </button>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-semibold">علائم</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {symptomOptions.map(opt => {
                            const isSelected = selectedDayLog.symptoms.includes(opt.id);
                            return <button key={opt.id} onClick={() => onLogChange({ symptoms: isSelected ? selectedDayLog.symptoms.filter(s => s !== opt.id) : [...selectedDayLog.symptoms, opt.id] })} className={`px-3 py-1.5 text-xs rounded-full ${isSelected ? 'bg-rose-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{opt.label}</button>
                        })}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold">شدت خونریزی</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {flowOptions.map(opt => {
                            const isSelected = selectedDayLog.flow === opt.id;
                            return <button key={opt.id} onClick={() => onLogChange({ flow: isSelected ? null : opt.id })} className={`px-3 py-1.5 text-xs rounded-full ${isSelected ? 'bg-rose-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{opt.label}</button>
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarTab: React.FC<{
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    dayInfo: Map<string, any>;
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    selectedDayLog: SymptomLog | null;
    onPeriodToggle: (date: Date) => void;
    onLogChange: (log: Partial<SymptomLog>) => void;
}> = (props) => {
    const {currentDate, setCurrentDate, dayInfo, selectedDate, setSelectedDate, selectedDayLog, onPeriodToggle, onLogChange} = props;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <CalendarHeader 
                    currentDate={currentDate} 
                    onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                />
                <div className="text-center">
                    <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2">
                        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()}).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {Array.from({length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}).map((_, day) => {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
                            const dateString = date.toISOString().split('T')[0];
                            const info = dayInfo.get(dateString);
                            
                            const isSelected = selectedDate?.toISOString().split('T')[0] === dateString;
                            
                            let dayClass = "w-9 h-9 flex items-center justify-center rounded-full transition-all text-sm relative";
                            if (info?.isPeriod) dayClass += " bg-rose-500 text-white";
                            else if (info?.isPredictedPeriod) dayClass += " bg-rose-500/30";
                            else if (info?.isFertile) dayClass += " bg-rose-500/10";
                            else dayClass += " bg-gray-800/50 hover:bg-gray-700";

                            if (isSelected) dayClass += " ring-2 ring-white";

                            return (
                                <button key={day} onClick={() => setSelectedDate(date)} className={dayClass}>
                                    {info?.isToday && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-400 rounded-full"></span>}
                                    <span>{day + 1}</span>
                                        {info?.isOvulation && <span className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full"></span>}
                                </button>
                            )
                        })}
                    </div>
                </div>
                    <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-400 space-y-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div>پریود</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/30"></div>پریود پیش‌بینی</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/10"></div>پنجره باروری</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white"></div>تخمک‌گذاری</div>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-[var(--radius-lg)]">
                <DailyLogPanel
                    selectedDate={selectedDate}
                    selectedDayLog={selectedDayLog}
                    isPeriod={!!dayInfo.get(selectedDate?.toISOString().split('T')[0] || '')?.isPeriod}
                    onPeriodToggle={onPeriodToggle}
                    onLogChange={onLogChange}
                />
            </div>
        </div>
    );
};

// --- MAIN VIEW COMPONENT ---

interface WomenHealthViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const WomenHealthView: React.FC<WomenHealthViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('calendar');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    
    const { womenHealth } = userData;
    const { cycles, cycleLength, periodLength, companion } = womenHealth;
    
    const sortedCycles = useMemo(() => [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [cycles]);

    const dayInfo = useMemo(() => {
        const infoMap = new Map<string, { isPeriod?: boolean; isPredictedPeriod?: boolean; isFertile?: boolean, isOvulation?: boolean, isPms?: boolean; isToday?: boolean }>();
        const today = new Date();
        today.setHours(0,0,0,0);
        infoMap.set(today.toISOString().split('T')[0], { isToday: true });

        // Mark logged periods
        sortedCycles.forEach(cycle => {
            const start = new Date(cycle.startDate);
            const end = new Date(cycle.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];
                infoMap.set(dateString, { ...infoMap.get(dateString), isPeriod: true });
            }
        });

        // Predict future cycles
        if (sortedCycles.length > 0) {
            const lastCycle = sortedCycles[sortedCycles.length - 1];
            let lastStart = new Date(lastCycle.startDate);
            
            for (let i = 0; i < 6; i++) {
                 const nextCycleStartDate = new Date(lastStart);
                 nextCycleStartDate.setDate(nextCycleStartDate.getDate() + ((i + 1) * cycleLength));
                
                const ovulationDay = new Date(nextCycleStartDate);
                ovulationDay.setDate(ovulationDay.getDate() - 14);

                // Fertile Window
                for(let day = -5; day <= 1; day++) {
                    const fertileDay = new Date(ovulationDay);
                    fertileDay.setDate(ovulationDay.getDate() + day);
                    const dateString = fertileDay.toISOString().split('T')[0];
                     if (!infoMap.has(dateString)) {
                        infoMap.set(dateString, { ...infoMap.get(dateString), isFertile: true });
                    }
                }
                const ovDateString = ovulationDay.toISOString().split('T')[0];
                infoMap.set(ovDateString, { ...infoMap.get(ovDateString), isOvulation: true, isFertile: true });

                // PMS Days
                for(let day=1; day <= 7; day++) {
                    const pmsDay = new Date(nextCycleStartDate);
                    pmsDay.setDate(nextCycleStartDate.getDate() - day);
                    const dateString = pmsDay.toISOString().split('T')[0];
                    if (!infoMap.has(dateString)) {
                        infoMap.set(dateString, { ...infoMap.get(dateString), isPms: true });
                    }
                }

                // Predicted Period
                for (let day = 0; day < periodLength; day++) {
                    const periodDay = new Date(nextCycleStartDate.getTime() + day * 86400000);
                    const dateString = periodDay.toISOString().split('T')[0];
                    if (!infoMap.has(dateString)) {
                        infoMap.set(dateString, { ...infoMap.get(dateString), isPredictedPeriod: true });
                    }
                }
            }
        }
        return infoMap;
    }, [sortedCycles, cycleLength, periodLength]);

    const handleLogChange = (log: Partial<SymptomLog>) => {
        if (!selectedDate) return;
        
        const dateString = selectedDate.toISOString().split('T')[0];
        let targetCycle = sortedCycles.find(c => dateString >= c.startDate && dateString <= c.endDate);

        if (!targetCycle) {
            console.warn("No active cycle found for this date. Logging is disabled.");
            return;
        }

        const updatedCycles = cycles.map(c => {
            if (c.startDate === targetCycle?.startDate) {
                const newLog = { ...(c.logs[dateString] || { symptoms: [], flow: null }), ...log };
                return { ...c, logs: { ...c.logs, [dateString]: newLog } };
            }
            return c;
        });

        onUpdateUserData({ ...userData, womenHealth: { ...womenHealth, cycles: updatedCycles } });
    };
    
    const handlePeriodToggle = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        let updatedCycles = JSON.parse(JSON.stringify(cycles)) as Cycle[];
        
        const isPeriodDay = dayInfo.get(dateStr)?.isPeriod;

        if (isPeriodDay) {
            // Day is currently a period day, so we need to remove it.
            const cycleToModify = updatedCycles.find(c => dateStr >= c.startDate && dateStr <= c.endDate)!;
            
            if (dateStr === cycleToModify.startDate && dateStr === cycleToModify.endDate) {
                updatedCycles = updatedCycles.filter(c => c.startDate !== cycleToModify.startDate);
            } else if (dateStr === cycleToModify.startDate) {
                const nextDay = new Date(date);
                nextDay.setDate(date.getDate() + 1);
                cycleToModify.startDate = nextDay.toISOString().split('T')[0];
            } else if (dateStr === cycleToModify.endDate) {
                const prevDay = new Date(date);
                prevDay.setDate(date.getDate() - 1);
                cycleToModify.endDate = prevDay.toISOString().split('T')[0];
            } else {
                const prevDay = new Date(date);
                prevDay.setDate(date.getDate() - 1);
                const nextDay = new Date(date);
                nextDay.setDate(date.getDate() + 1);
                const newCycle: Cycle = {
                    startDate: nextDay.toISOString().split('T')[0],
                    endDate: cycleToModify.endDate,
                    logs: {}
                };
                cycleToModify.endDate = prevDay.toISOString().split('T')[0];
                updatedCycles.push(newCycle);
            }
        } else {
            // Day is not a period day, so we need to add it.
            const yesterdayStr = new Date(date.getTime() - 86400000).toISOString().split('T')[0];
            const tomorrowStr = new Date(date.getTime() + 86400000).toISOString().split('T')[0];

            const cycleBefore = updatedCycles.find(c => c.endDate === yesterdayStr);
            const cycleAfter = updatedCycles.find(c => c.startDate === tomorrowStr);

            if (cycleBefore && cycleAfter) {
                cycleBefore.endDate = cycleAfter.endDate;
                updatedCycles = updatedCycles.filter(c => c.startDate !== cycleAfter.startDate);
            } else if (cycleBefore) {
                cycleBefore.endDate = dateStr;
            } else if (cycleAfter) {
                cycleAfter.startDate = dateStr;
            } else {
                updatedCycles.push({ startDate: dateStr, endDate: dateStr, logs: {} });
            }
        }
        
        onUpdateUserData({ ...userData, womenHealth: { ...womenHealth, cycles: updatedCycles } });
    };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayOfCycle = useMemo(() => {
        if (sortedCycles.length === 0) return null;
        const lastCycle = sortedCycles[sortedCycles.length-1];
        const start = new Date(lastCycle.startDate);
        return Math.floor((today.getTime() - start.getTime()) / (1000*3600*24)) + 1;
    }, [sortedCycles, today]);

    const todayLog = useMemo(() => {
        const todayStr = today.toISOString().split('T')[0];
        if (sortedCycles.length === 0) return null;
        const lastCycle = sortedCycles[sortedCycles.length-1];
        return lastCycle?.logs[todayStr] || null;
    }, [sortedCycles, today]);

    const selectedDayLog = selectedDate ? (sortedCycles.find(c => c.startDate <= selectedDate.toISOString().split('T')[0] && (c.endDate >= selectedDate.toISOString().split('T')[0]))?.logs[selectedDate.toISOString().split('T')[0]]) || { symptoms: [], flow: null } : null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-rose-800/50 rounded-[var(--radius-card)] p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-rose-200">سلامت زنان</h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="flex gap-1 bg-gray-800/50 p-1 rounded-[var(--radius-full)] mb-4 flex-shrink-0 overflow-x-auto">
                    {[
                        {id: 'calendar', label: 'تقویم', icon: HealthIcon}, 
                        {id: 'tips', label: 'نکات روز', icon: SparklesIcon},
                        {id: 'analytics', label: 'تحلیل', icon: ChartBarIcon},
                        {id: 'sharing', label: 'اشتراک', icon: ShareIcon},
                        {id: 'settings', label: 'تنظیمات', icon: CogIcon},
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-[var(--radius-full)] transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-rose-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                           <tab.icon className="w-5 h-5" />
                           <span>{tab.label}</span>
                        </button>
                    ))}
                 </div>
                
                <div className="overflow-y-auto pr-2 flex-grow">
                   {activeTab === 'calendar' && (
                        <CalendarTab
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                            dayInfo={dayInfo}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            selectedDayLog={selectedDayLog}
                            onPeriodToggle={handlePeriodToggle}
                            onLogChange={handleLogChange}
                        />
                   )}
                   {activeTab === 'tips' && <DailyTipsTab dayOfCycle={dayOfCycle} todayLog={todayLog} />}
                   {activeTab === 'analytics' && <AnalyticsTab cycles={sortedCycles} />}
                   {activeTab === 'sharing' && <SharingTab companion={companion} onSave={(newCompanion) => onUpdateUserData({...userData, womenHealth: {...womenHealth, companion: newCompanion}})} />}
                   {activeTab === 'settings' && <SettingsTab userData={userData} onUpdateUserData={onUpdateUserData} />}
                </div>
            </div>
        </div>
    );
};

export default WomenHealthView;

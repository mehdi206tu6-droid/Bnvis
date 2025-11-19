
import React, { useState } from 'react';
import { OnboardingData, WomenHealthData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    HealthIcon, ShareIcon, SparklesIcon, FaceSmileIcon, FaceFrownIcon, BoltIcon,
    FaceMehIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface WomenHealthViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const SYMPTOMS_LIST = [
    'Cramps', 'Headache', 'Bloating', 'Backache', 'Acne', 'Fatigue', 'Cravings', 'Insomnia'
];

const SYMPTOMS_TRANSLATION: Record<string, string> = {
    'Cramps': 'گرفتگی عضلات',
    'Headache': 'سردرد',
    'Bloating': 'نفخ',
    'Backache': 'کمردرد',
    'Acne': 'آکنه',
    'Fatigue': 'خستگی شدید',
    'Cravings': 'هوس غذایی',
    'Insomnia': 'بی‌خوابی'
};

const WomenHealthView: React.FC<WomenHealthViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'log' | 'partner'>('calendar');
    const [partnerTip, setPartnerTip] = useState<string | null>(null);
    const [isGeneratingTip, setIsGeneratingTip] = useState(false);
    
    // Init data if missing
    const healthData: WomenHealthData = userData.womenHealth || {
        cycleLogs: [],
        periodStarts: [],
        avgCycleLength: 28,
        partner: { enabled: false, name: '' }
    };

    // --- Helpers ---
    const getLatestPeriodStart = () => {
        if (!healthData.periodStarts.length) return null;
        return healthData.periodStarts.sort().reverse()[0];
    };

    const calculateCycleDay = () => {
        const lastStart = getLatestPeriodStart();
        if (!lastStart) return null;
        const start = new Date(lastStart);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays; // Day 1 is the start date
    };

    const getPhase = (day: number) => {
        if (day <= 5) return 'قاعدگی (Menstrual)';
        if (day <= 13) return 'فولیکولار (Follicular)';
        if (day === 14) return 'تخمک‌گذاری (Ovulation)';
        return 'لوتئال (Luteal)';
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const cycleDay = calculateCycleDay();
    const currentPhase = cycleDay ? getPhase(cycleDay) : 'نامشخص';

    // --- Handlers ---
    const handleLogPeriodStart = () => {
        const confirm = window.confirm(`آیا امروز (${new Date().toLocaleDateString('fa-IR')}) شروع دوره قاعدگی شماست؟`);
        if (confirm) {
            const updatedStarts = [...healthData.periodStarts, todayStr];
            // Filter duplicates
            const uniqueStarts = Array.from(new Set(updatedStarts));
            const newData = { ...healthData, periodStarts: uniqueStarts };
            onUpdateUserData({ ...userData, womenHealth: newData });
        }
    };

    const handleLogSymptom = (symptom: string) => {
        const currentLog = healthData.cycleLogs.find(l => l.date === todayStr) || { date: todayStr, symptoms: [] };
        const exists = currentLog.symptoms.includes(symptom);
        let newSymptoms;
        if (exists) {
            newSymptoms = currentLog.symptoms.filter(s => s !== symptom);
        } else {
            newSymptoms = [...currentLog.symptoms, symptom];
        }
        
        const updatedLogs = [
            ...healthData.cycleLogs.filter(l => l.date !== todayStr),
            { ...currentLog, symptoms: newSymptoms }
        ];
        
        onUpdateUserData({ ...userData, womenHealth: { ...healthData, cycleLogs: updatedLogs } });
    };

    const handleLogMood = (mood: any) => {
         const currentLog = healthData.cycleLogs.find(l => l.date === todayStr) || { date: todayStr, symptoms: [] };
         const updatedLogs = [
            ...healthData.cycleLogs.filter(l => l.date !== todayStr),
            { ...currentLog, mood }
        ];
        onUpdateUserData({ ...userData, womenHealth: { ...healthData, cycleLogs: updatedLogs } });
    };

    const handlePartnerConfig = (enabled: boolean, name: string) => {
         onUpdateUserData({ 
             ...userData, 
             womenHealth: { ...healthData, partner: { enabled, name } } 
        });
    };

    const generatePartnerTip = async () => {
        if (!cycleDay) {
            setPartnerTip("لطفا ابتدا تاریخ شروع دوره را ثبت کنید.");
            return;
        }
        setIsGeneratingTip(true);
        
        const todaysLog = healthData.cycleLogs.find(l => l.date === todayStr);
        const symptoms = todaysLog?.symptoms.map(s => SYMPTOMS_TRANSLATION[s]).join(', ') || 'هیچ';
        const mood = todaysLog?.mood || 'معمولی';
        
        const prompt = `
            Act as an empathetic relationship coach. The user's partner (Name: ${healthData.partner.name || 'Partner'}) wants to know how to support her today.
            Context:
            - Cycle Phase: ${currentPhase} (Day ${cycleDay})
            - Reported Symptoms: ${symptoms}
            - Mood: ${mood}
            
            Write a short, actionable, and kind message addressed to the partner in Persian. Suggest 2 specific things they can do (e.g., bring tea, offer a massage, give space).
            Keep it under 50 words.
        `;

        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setPartnerTip(response.text.trim());
        } catch (e) {
            setPartnerTip("خطا در تولید نکته هوشمند.");
        } finally {
            setIsGeneratingTip(false);
        }
    };

    const handleShare = async () => {
        if (!partnerTip) return;
        const text = `سلام ${healthData.partner.name} ❤️\nوضعیت امروز من: ${currentPhase}\n\nپیشنهاد هوشمند بنویس:\n${partnerTip}`;
        if (navigator.share) {
            await navigator.share({ text });
        } else {
            await navigator.clipboard.writeText(text);
            alert("پیام در کلیپ‌بورد کپی شد.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col overflow-hidden animate-fadeIn">
             {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                <h2 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                    <HealthIcon className="w-6 h-6"/>
                    سلامت زنان
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            {/* Tabs */}
            <div className="flex justify-around p-2 bg-slate-900 border-b border-slate-800">
                <button onClick={() => setActiveTab('calendar')} className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>تقویم و چرخه</button>
                <button onClick={() => setActiveTab('log')} className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'log' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>ثبت علائم</button>
                <button onClick={() => setActiveTab('partner')} className={`py-2 px-4 rounded-lg transition-colors ${activeTab === 'partner' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>همراه (Partner)</button>
            </div>

            <div className="flex-grow overflow-y-auto p-4">
                {activeTab === 'calendar' && (
                    <div className="space-y-6 text-center pt-10">
                        <div className="relative w-64 h-64 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent rotate-45"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                {cycleDay ? (
                                    <>
                                        <span className="text-sm text-slate-400">روز چرخه</span>
                                        <span className="text-6xl font-bold text-white">{cycleDay}</span>
                                        <span className="text-pink-400 font-semibold mt-2">{currentPhase}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-400 px-4">هنوز اطلاعاتی ثبت نشده</span>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleLogPeriodStart}
                            className="w-full py-4 bg-pink-600 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:bg-pink-500 transition-all"
                        >
                            شروع قاعدگی امروز
                        </button>
                        
                        {cycleDay && (
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-sm text-slate-300">
                                <p>پیش‌بینی قاعدگی بعدی: حدود {new Date(new Date(getLatestPeriodStart()!).getTime() + (healthData.avgCycleLength * 24 * 60 * 60 * 1000)).toLocaleDateString('fa-IR')}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'log' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-200">حس و حال امروز</h3>
                            <div className="flex justify-between bg-slate-800 p-4 rounded-xl">
                                {['happy', 'energetic', 'tired', 'anxious', 'irritable'].map(m => {
                                     const isSelected = healthData.cycleLogs.find(l => l.date === todayStr)?.mood === m;
                                     return (
                                         <button key={m} onClick={() => handleLogMood(m)} className={`flex flex-col items-center gap-2 transition-transform ${isSelected ? 'scale-125 text-pink-400' : 'text-slate-500 grayscale hover:grayscale-0'}`}>
                                             {m === 'happy' && <FaceSmileIcon className="w-8 h-8"/>}
                                             {m === 'energetic' && <BoltIcon className="w-8 h-8"/>}
                                             {m === 'tired' && <FaceFrownIcon className="w-8 h-8"/>}
                                             {m === 'anxious' && <span className="text-2xl">😰</span>}
                                             {m === 'irritable' && <span className="text-2xl">😡</span>}
                                         </button>
                                     )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-200">علائم فیزیکی</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {SYMPTOMS_LIST.map(sym => {
                                    const isSelected = healthData.cycleLogs.find(l => l.date === todayStr)?.symptoms.includes(sym);
                                    return (
                                        <button 
                                            key={sym}
                                            onClick={() => handleLogSymptom(sym)}
                                            className={`p-3 rounded-lg border text-sm font-semibold transition-all ${isSelected ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            {SYMPTOMS_TRANSLATION[sym]}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'partner' && (
                    <div className="space-y-6">
                        {!healthData.partner.enabled ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-20 h-20 bg-pink-900/30 rounded-full flex items-center justify-center mx-auto text-pink-400">
                                    <ShareIcon className="w-10 h-10"/>
                                </div>
                                <h3 className="text-xl font-bold">حالت همراه (Companion Mode)</h3>
                                <p className="text-slate-400">با فعال‌سازی این بخش، می‌توانید وضعیت و نکات مفید را با همسر یا پارتنر خود به اشتراک بگذارید.</p>
                                <div className="max-w-xs mx-auto space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="نام پارتنر شما" 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-center"
                                        onChange={(e) => handlePartnerConfig(false, e.target.value)} // Just update name in local state logic if needed, but here simplifying
                                        onBlur={(e) => handlePartnerConfig(false, e.target.value)}
                                    />
                                    <button 
                                        onClick={() => handlePartnerConfig(true, healthData.partner.name || 'همسر')}
                                        className="w-full py-3 bg-pink-600 rounded-lg font-bold text-white"
                                    >
                                        فعال‌سازی
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-gradient-to-br from-pink-900/40 to-slate-900 border border-pink-800/50 p-6 rounded-2xl text-center">
                                    <h3 className="text-lg font-bold text-pink-200 mb-1">همراه: {healthData.partner.name}</h3>
                                    <p className="text-slate-400 text-sm mb-4">وضعیت امروز برای اشتراک‌گذاری</p>
                                    
                                    <div className="bg-slate-950/50 p-4 rounded-xl mb-4 text-right">
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            {partnerTip || "برای دریافت نکته هوشمند روی دکمه زیر کلیک کنید..."}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={generatePartnerTip} 
                                            disabled={isGeneratingTip}
                                            className="flex-1 py-3 bg-slate-800 rounded-xl font-semibold text-pink-400 hover:bg-slate-700 flex items-center justify-center gap-2"
                                        >
                                            <SparklesIcon className={`w-5 h-5 ${isGeneratingTip ? 'animate-spin' : ''}`}/>
                                            {isGeneratingTip ? '...' : 'تولید نکته'}
                                        </button>
                                        <button 
                                            onClick={handleShare}
                                            disabled={!partnerTip}
                                            className="flex-1 py-3 bg-pink-600 rounded-xl font-semibold text-white hover:bg-pink-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ShareIcon className="w-5 h-5"/>
                                            ارسال
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-slate-800/50 rounded-xl">
                                    <h4 className="font-bold text-slate-300 mb-2">تنظیمات</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">وضعیت فعال</span>
                                        <button 
                                            onClick={() => handlePartnerConfig(false, healthData.partner.name)}
                                            className="text-red-400 text-sm font-semibold hover:underline"
                                        >
                                            غیرفعال‌سازی
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WomenHealthView;

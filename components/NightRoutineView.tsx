import React, { useState, useEffect } from 'react';
import { OnboardingData, GratitudeEntry, Note } from '../types';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, BookOpenIcon, PencilIcon, LightBulbIcon, MoonIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface NightRoutineViewProps {
    userData: OnboardingData;
    onClose: () => void;
}

const TOTAL_STEPS = 5;

export const NightRoutineView: React.FC<NightRoutineViewProps> = ({ userData, onClose }) => {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [daySummary, setDaySummary] = useState('');
    const [gratitude, setGratitude] = useState('');
    const [brainDump, setBrainDump] = useState('');
    const [tomorrowPlan, setTomorrowPlan] = useState('');

    useEffect(() => {
        const generateDaySummary = async () => {
            setIsLoading(true);
            const todayStr = new Date().toISOString().split('T')[0];
            const habitsKey = `benvis_habits_${todayStr}`;
            const storedHabits = localStorage.getItem(habitsKey);
            const dailyHabits = storedHabits ? JSON.parse(storedHabits) : {};
            
            const completedHabits = userData.habits.filter(h => dailyHabits[h.name]).map(h => h.name).join(', ') || 'None';
            const goalsProgress = userData.goals.map(g => `'${g.title}' is at ${g.progress}%`).join('\n');
            
            const prompt = `
                Based on the user's data from today, generate a short, one-paragraph summary of their day in a positive and reflective tone. The response must be in Persian.
                - Completed Habits: ${completedHabits}
                - Goals Progress: ${goalsProgress}
                
                Summarize their accomplishments and encourage them to reflect on their day.
            `;

            try {
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                setDaySummary(response.text);
            } catch (error: any) {
                console.error("Failed to generate day summary:", error);
                const errorString = JSON.stringify(error);
                if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("429")) {
                    setDaySummary("محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید. می‌توانید به صورت دستی روز خود را مرور کنید.");
                } else {
                    setDaySummary("امروز هم یک روز پر از تلاش و تجربه بود. به خودت برای تمام کارهایی که انجام دادی افتخار کن.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (step === 0) {
            generateDaySummary();
        }
    }, [userData, step]);
    
    const handleSaveAndClose = () => {
        // Save gratitude entry
        if (gratitude.trim()) {
            const storageKey = 'benvis_gratitude_journal';
            const stored = localStorage.getItem(storageKey);
            const items: GratitudeEntry[] = stored ? JSON.parse(stored) : [];
            const newItem: GratitudeEntry = { id: new Date().toISOString(), content: gratitude, createdAt: new Date().toISOString() };
            localStorage.setItem(storageKey, JSON.stringify([newItem, ...items]));
        }
        
        // Save brain dump as a note
        if (brainDump.trim()) {
            const storageKey = 'benvis_journal';
            const stored = localStorage.getItem(storageKey);
            const items: Note[] = stored ? JSON.parse(stored) : [];
            const newItem: Note = { id: new Date().toISOString(), content: `تخلیه ذهنی شبانه:\n${brainDump}`, createdAt: new Date().toISOString() };
            localStorage.setItem(storageKey, JSON.stringify([newItem, ...items]));
        }

        onClose();
    };

    const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const renderStepContent = () => {
        switch(step) {
            case 0: // Day Summary
                return (
                    <div className="text-center">
                        <MoonIcon className="w-12 h-12 mx-auto text-violet-400 mb-4"/>
                        <h3 className="text-xl font-bold">بستن روز</h3>
                        <p className="text-slate-400 my-2">وقتشه که روزت رو مرور کنی و برای یک خواب آرام آماده بشی.</p>
                        <div className="bg-slate-800/50 p-4 rounded-lg mt-4 text-right">
                            <h4 className="font-bold flex items-center gap-2 mb-2"><SparklesIcon className="w-5 h-5 text-violet-300"/> خلاصه هوشمند روز شما</h4>
                            {isLoading ? <p className="animate-pulse">در حال بارگذاری...</p> : <p className="text-slate-300">{daySummary}</p>}
                        </div>
                    </div>
                );
            case 1: // Gratitude
                return (
                     <div className="text-center">
                        <BookOpenIcon className="w-12 h-12 mx-auto text-violet-400 mb-4"/>
                        <h3 className="text-xl font-bold">تمرین شکرگزاری</h3>
                        <p className="text-slate-400 my-2">برای چه چیزهایی در امروز سپاسگزار هستی؟</p>
                        <textarea
                            value={gratitude}
                            onChange={(e) => setGratitude(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 mt-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            placeholder="حتی کوچکترین چیزها هم ارزشمندند..."
                        />
                    </div>
                );
            case 2: // Brain Dump
                 return (
                     <div className="text-center">
                        <PencilIcon className="w-12 h-12 mx-auto text-violet-400 mb-4"/>
                        <h3 className="text-xl font-bold">تخلیه ذهنی</h3>
                        <p className="text-slate-400 my-2">هرچیزی که در ذهنت هست رو بنویس تا با آرامش بخوابی.</p>
                        <textarea
                            value={brainDump}
                            onChange={(e) => setBrainDump(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 mt-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            placeholder="نگرانی‌ها، ایده‌ها، کارهایی که باید انجام بشن..."
                        />
                    </div>
                );
            case 3: // Plan for tomorrow
                return (
                    <div className="text-center">
                        <LightBulbIcon className="w-12 h-12 mx-auto text-violet-400 mb-4"/>
                        <h3 className="text-xl font-bold">مهم‌ترین کار فردا</h3>
                        <p className="text-slate-400 my-2">مهم‌ترین کاری که فردا می‌خوای انجام بدی چیه؟</p>
                        <input
                            type="text"
                            value={tomorrowPlan}
                            onChange={(e) => setTomorrowPlan(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 mt-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            placeholder="مثلا: تکمیل گزارش پروژه"
                        />
                    </div>
                );
            case 4: // Finish
                return (
                     <div className="text-center">
                        <MoonIcon className="w-12 h-12 mx-auto text-violet-400 mb-4"/>
                        <h3 className="text-xl font-bold">روتین شبانه کامل شد</h3>
                        <p className="text-slate-400 my-2">عالی بود! حالا برای یک خواب عمیق و آرام آماده‌ای. شب بخیر!</p>
                    </div>
                )
            default:
                return null;
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-800/50 rounded-[var(--radius-card)] p-6 w-full max-w-md flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6">
                    <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}></div>
                </div>
                
                <div className="flex-grow min-h-[250px] flex items-center justify-center">
                    {renderStepContent()}
                </div>

                <div className="mt-6 flex gap-4">
                    {step > 0 && <button onClick={prevStep} className="flex-1 py-2 bg-slate-600 rounded-md font-semibold hover:bg-slate-500">قبلی</button>}
                    {step < TOTAL_STEPS - 1 ? (
                        <button onClick={nextStep} className="flex-1 py-2 bg-violet-700 rounded-md font-semibold hover:bg-violet-800">ادامه</button>
                    ) : (
                        <button onClick={handleSaveAndClose} className="flex-1 py-2 bg-violet-700 rounded-md font-semibold hover:bg-violet-800">پایان و ذخیره</button>
                    )}
                </div>
            </div>
        </div>
    );
};
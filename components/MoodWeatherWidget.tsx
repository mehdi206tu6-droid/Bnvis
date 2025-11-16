
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Note, CalendarEvent } from '../types';
import { SunIcon, CloudIcon, BoltIcon, SparklesIcon, ArrowPathIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MoodData {
    moodLabel: 'sunny' | 'calm' | 'cloudy' | 'stormy' | 'unknown';
    moodScore: number;
    narrative: string;
    quickWins: string[];
}

const MoodWeatherWidget: React.FC = () => {
    const [moodData, setMoodData] = useState<MoodData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `benvis_mood_weather_${todayStr}`;

    const generateMoodWeather = async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);

        if (!forceRefresh) {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                setMoodData(JSON.parse(cachedData));
                setIsLoading(false);
                return;
            }
        }
        
        try {
            // 1. Gather data
            const journalStorage = localStorage.getItem('benvis_journal');
            const notes: Note[] = journalStorage ? JSON.parse(journalStorage) : [];
            const todayNotes = notes.filter(n => n.createdAt.startsWith(todayStr));
            const journalText = todayNotes.map(n => n.content).join('\n\n') || "";

            const habitsStorage = localStorage.getItem(`benvis_habits_${todayStr}`);
            const habitCompletions: Record<string, boolean> = habitsStorage ? JSON.parse(habitsStorage) : {};

            const eventsStorage = localStorage.getItem('benvis_user_data');
            const allEvents: CalendarEvent[] = eventsStorage ? JSON.parse(eventsStorage).calendarEvents || [] : [];
            const todayEvents = allEvents.filter(e => e.date === todayStr);
            const activitiesSummary = todayEvents.map(e => `${e.time || ''} - ${e.text}`).join('; ');

            // For now, sleep is null. This can be extended later.
            const sleepHours = null;

            // 2. Construct Gemini Prompt based on the system role
            const prompt = `
[ROLE=system]
تو یک تحلیلگر احساسات و مولد UI summary برای Benvis Life OS هستی. هدف: از ورودی‌های کاربر (journalText, sleepData, habitCompletions, activitySummary) وضعیت عاطفیِ روزانه را استخراج کن و آن را به زبان ساده + استراتژی فوری (۳ اقدام) تبدیل کن. خروجی باید JSON ساختاریافته مطابق schema پایین باشد. اگر داده ناقص بود، فیلد needsReview=true بگذار و حدس معقول با confidence بده.

[input]
{
  "date": "${todayStr}",
  "journalText": "${journalText.replace(/"/g, '\\"')}",
  "sleepHours": ${sleepHours},
  "habitCompletions": ${JSON.stringify(Object.entries(habitCompletions).map(([id, done]) => ({ habitId: id, done })))},
  "activitiesSummary": "${activitiesSummary.replace(/"/g, '\\"')}"
}

[rules]
- خروجی سه سطح: moodLabel (one of: sunny, calm, cloudy, stormy, unknown), moodScore (0-100), narrative (30-120 words).
- ارائه 3 Actionable quick-wins (هر کدام ≤ 10 words) و 1 long-term suggestion (≤ 25 words).
- confidence: 0.0-1.0.
- تاریخ‌ها ISO8601.

[responseSchema]
{
 "moodLabel":"string",
 "moodScore":"number",
 "narrative":"string",
 "quickWins":["string","string","string"],
 "longTerm":"string",
 "confidence":"number",
 "needsReview":"boolean"
}
`;
            
            // 3. Call Gemini API
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    moodLabel: { type: Type.STRING },
                    moodScore: { type: Type.NUMBER },
                    narrative: { type: Type.STRING },
                    quickWins: { type: Type.ARRAY, items: { type: Type.STRING } },
                    longTerm: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    needsReview: { type: Type.BOOLEAN },
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
            
            const result = JSON.parse(response.text.trim());
            setMoodData(result);
            localStorage.setItem(cacheKey, JSON.stringify(result));

        } catch (err: any) {
            console.error("Failed to generate mood weather:", err);
            const errorString = JSON.stringify(err);
            if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes('"code":429')) {
                setError("محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.");
            } else {
                setError("خطا در تحلیل وضعیت خلقی.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        generateMoodWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const moodMap = {
        sunny: { icon: SunIcon, color: 'text-yellow-300', label: 'آفتابی' },
        calm: { icon: SunIcon, color: 'text-blue-300', label: 'آرام' },
        cloudy: { icon: CloudIcon, color: 'text-slate-400', label: 'ابری' },
        stormy: { icon: BoltIcon, color: 'text-red-400', label: 'طوفانی' },
        unknown: { icon: CloudIcon, color: 'text-gray-500', label: 'نامشخص' },
    };

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 animate-pulse h-[200px]">
                <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-5 bg-slate-700 rounded w-full"></div>
                    <div className="h-5 bg-slate-700 rounded w-5/6"></div>
                    <div className="h-5 bg-slate-700 rounded w-3/4"></div>
                </div>
            </div>
        );
    }
    
    if (error && !moodData) {
         return (
            <div className="bg-red-900/40 backdrop-blur-lg border border-red-800 rounded-[var(--radius-card)] p-4 col-span-2 text-center">
                <p className="font-semibold text-red-300">خطا در دریافت آب و هوای خلقی</p>
                <p className="text-sm text-red-300/80 mt-1">{error}</p>
                <button onClick={() => generateMoodWeather(true)} className="mt-3 px-4 py-1 bg-red-800 rounded-md text-xs font-semibold">تلاش مجدد</button>
            </div>
        );
    }

    if (!moodData) return null;

    const { moodLabel, narrative, quickWins } = moodData;
    const { icon: Icon, color, label } = moodMap[moodLabel] || moodMap.unknown;
    
    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-violet-400"/>
                        آب و هوای خلقی امروز
                    </h3>
                    <div className={`font-bold text-lg flex items-center gap-2 ${color}`}>
                        <Icon className="w-6 h-6"/>
                        <span>{label}</span>
                    </div>
                </div>
                 <button onClick={() => generateMoodWeather(true)} className="text-slate-400 hover:text-white transition-colors" title="تحلیل مجدد">
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-sm text-slate-300 my-3">{narrative}</p>
            <div className="space-y-2 pt-3 border-t border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400">اقدامات سریع پیشنهادی:</h4>
                {quickWins.map((win, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-slate-700/60 p-2 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                        <span>{win}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MoodWeatherWidget;

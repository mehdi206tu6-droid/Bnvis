
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OnboardingData, FocusSession } from '../types';
import { BoltIcon, SparklesIcon, FaceSmileIcon, FaceMehIcon, FaceFrownIcon, TargetIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type EnergyLevel = 'High' | 'Medium' | 'Low';
type SleepQuality = 'poor' | 'okay' | 'great';

interface Prediction {
    level: EnergyLevel;
    advice: string;
    suggestedTask: string;
}

const EnergyPredictionWidget: React.FC<{ userData: OnboardingData }> = ({ userData }) => {
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const CACHE_KEY = `benvis_energy_prediction_${todayStr}`;

    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                setPrediction(JSON.parse(cached));
            }
        } catch (e) {
            console.error("Failed to load cached energy prediction", e);
        }
    }, [CACHE_KEY]);

    const generatePrediction = async (sleepQuality: SleepQuality) => {
        setIsLoading(true);
        setError(null);

        // --- Data Gathering ---
        const todayHabitsKey = `benvis_habits_${todayStr}`;
        const habitsToday = localStorage.getItem(todayHabitsKey) ? JSON.parse(localStorage.getItem(todayHabitsKey)!) : {};
        const completedHabits = userData.habits.filter(h => habitsToday[h.name]).map(h => h.name);
        const missedHabits = userData.habits.filter(h => !habitsToday[h.name]).map(h => h.name);

        const goalsProgress = userData.goals.map(g => `'${g.title}' at ${g.progress}%`).join(', ');

        const storedSessions = localStorage.getItem('benvis_focus_sessions');
        const allSessions: FocusSession[] = storedSessions ? JSON.parse(storedSessions) : [];
        const todaySessions = allSessions.filter(s => s.date === todayStr);
        const focusMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        
        const incompleteGoals = userData.goals.filter(g => g.progress < 100).map(g => g.title).join(', ') || 'None';

        const prompt = `
            As a wellness coach for Benvis Life OS, predict the user's energy level for tomorrow and provide advice.

            User's data from today:
            - Last night's sleep quality: ${sleepQuality}
            - Completed habits: ${completedHabits.join(', ') || 'None'}
            - Missed habits: ${missedHabits.join(', ') || 'None'}
            - Total focus time: ${focusMinutes} minutes
            - Current goals: ${goalsProgress}
            - Incomplete goals available for tasks: ${incompleteGoals}

            Task:
            1. Predict tomorrow's energy level as 'High', 'Medium', or 'Low'.
            2. Provide a short, actionable piece of advice in Persian based on the prediction and today's activities.
            3. Suggest ONE specific, simple, and actionable task for tomorrow from their incomplete goals that matches the predicted energy level (e.g., a small task for low energy, a bigger one for high energy).

            Respond ONLY with a valid JSON object matching this schema:
            {"level": "Medium", "advice": "...", "suggestedTask": "..."}
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            level: { type: Type.STRING },
                            advice: { type: Type.STRING },
                            suggestedTask: { type: Type.STRING },
                        }
                    }
                }
            });
            const newPrediction: Prediction = JSON.parse(response.text.trim());
            setPrediction(newPrediction);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newPrediction));
        } catch (err) {
            console.error("Energy prediction error:", err);
            setError("خطا در پیش‌بینی انرژی.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const levelMap: Record<EnergyLevel, { label: string; color: string; }> = {
        'High': { label: 'زیاد', color: 'text-green-400' },
        'Medium': { label: 'متوسط', color: 'text-yellow-400' },
        'Low': { label: 'کم', color: 'text-red-400' },
    };

    if (prediction) {
        const { level, advice, suggestedTask } = prediction;
        return (
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 space-y-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <BoltIcon className="w-5 h-5 text-violet-400"/>
                    پیش‌بینی انرژی فردا
                </h3>
                <div className="text-center bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-sm text-slate-400">سطح انرژی پیش‌بینی شده</p>
                    <p className={`text-2xl font-bold ${levelMap[level]?.color || 'text-white'}`}>{levelMap[level]?.label || level}</p>
                </div>
                <p className="text-sm text-slate-300 text-center">{advice}</p>
                 <div className="pt-3 border-t border-slate-700">
                    <h4 className="font-semibold text-sm text-slate-400 mb-2 flex items-center gap-2"><TargetIcon className="w-4 h-4"/> پیشنهاد برای فردا</h4>
                    <p className="text-sm text-slate-200 bg-slate-700/50 p-2 rounded-md text-center">{suggestedTask}</p>
                </div>
            </div>
        );
    }
    
    if (isLoading) {
         return (
             <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 h-40 flex flex-col items-center justify-center animate-pulse">
                <SparklesIcon className="w-8 h-8 text-violet-400 mb-2" />
                <p className="text-sm font-semibold text-slate-400">در حال تحلیل و پیش‌بینی انرژی شما...</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-violet-400"/>
                پیش‌بینی انرژی فردا
            </h3>
            <p className="text-sm text-slate-300 text-center">شب گذشته چطور خوابیدید؟</p>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="flex justify-around items-center pt-2">
                 <button onClick={() => generatePrediction('poor')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-400 transition-colors">
                    <FaceFrownIcon className="w-10 h-10" />
                    <span className="text-xs font-semibold">بد</span>
                </button>
                <button onClick={() => generatePrediction('okay')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-yellow-400 transition-colors">
                    <FaceMehIcon className="w-10 h-10" />
                    <span className="text-xs font-semibold">متوسط</span>
                </button>
                <button onClick={() => generatePrediction('great')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-green-400 transition-colors">
                    <FaceSmileIcon className="w-10 h-10" />
                    <span className="text-xs font-semibold">عالی</span>
                </button>
            </div>
        </div>
    );
};

export default EnergyPredictionWidget;

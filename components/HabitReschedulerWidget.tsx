
import React, { useState, useEffect } from 'react';
import { OnboardingData, Habit, RescheduleSuggestion, NotificationTiming } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { ArrowPathIcon, SparklesIcon, ClockIcon, CheckCircleIcon, XMarkIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface HabitReschedulerWidgetProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}

const HabitReschedulerWidget: React.FC<HabitReschedulerWidgetProps> = ({ userData, onUpdateUserData }) => {
    const [strugglingHabit, setStrugglingHabit] = useState<Habit | null>(null);
    const [suggestion, setSuggestion] = useState<RescheduleSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Identify Struggling Habit (missed last 3 days)
        const findStrugglingHabit = () => {
            const today = new Date();
            const checkDays = 3;
            
            for (const habit of userData.habits.filter(h => h.type === 'good')) {
                let missedCount = 0;
                for (let i = 1; i <= checkDays; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const stored = localStorage.getItem(`benvis_habits_${dateStr}`);
                    const completion = stored ? JSON.parse(stored)[habit.name] : false;
                    if (!completion) missedCount++;
                }

                if (missedCount === checkDays) {
                    setStrugglingHabit(habit);
                    return; // Just process one at a time to avoid overwhelming
                }
            }
        };
        
        findStrugglingHabit();
    }, [userData.habits]);

    const generateSchedule = async () => {
        if (!strugglingHabit) return;
        setIsLoading(true);
        setError(null);

        const todayStr = new Date().toISOString().split('T')[0];
        const calendarEvents = userData.calendarEvents?.filter(e => e.date === todayStr) || [];
        const calendarSummary = calendarEvents.map(e => `${e.time || 'All Day'}: ${e.text}`).join(', ');
        const currentSchedule = strugglingHabit.notification?.time || "No fixed time";

        const prompt = `
            SYSTEM:
            You are an optimization engine that reschedules habits intelligently based on user performance, calendar availability, and predicted energy.

            INPUT:
            - Habit: ${strugglingHabit.name}
            - Current Schedule: ${currentSchedule}
            - Missed Days: 3 consecutive days
            - User Calendar Today: ${calendarSummary || "Free day"}
            - Predicted Energy: Medium (Assume unless specified)
            - Preferred Hours: Morning or Evening (infer from habit type)

            OUTPUT:
            Suggest the ideal new schedule. The reason must be persuasive and in Persian.

            SCHEMA:
            {
            "recommendedTime": "string (HH:mm)",
            "reason": "string (Persian)",
            "alternatives": ["string (HH:mm)"]
            }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            recommendedTime: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });
            
            const result = JSON.parse(response.text.trim());
            setSuggestion(result);
        } catch (error: any) {
            console.error("Reschedule generation failed", error);
            const msg = error?.message || '';
            if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
                 setError("محدودیت سرویس. لطفا بعدا تلاش کنید.");
            } else {
                 setError("خطا در ارتباط با هوش مصنوعی.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = () => {
        if (!strugglingHabit || !suggestion) return;
        
        const updatedHabits = userData.habits.map(h => {
            if (h.name === strugglingHabit.name) {
                return {
                    ...h,
                    notification: {
                        enabled: true,
                        timing: '1h' as NotificationTiming, // Default reminder buffer
                        time: suggestion.recommendedTime,
                        sound: 'chime'
                    }
                };
            }
            return h;
        });

        onUpdateUserData({ ...userData, habits: updatedHabits });
        setIsHidden(true);
    };

    const handleDismiss = () => {
        setIsHidden(true);
    };

    if (!strugglingHabit || isHidden) return null;

    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
            
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <ArrowPathIcon className={`w-5 h-5 text-orange-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200">بازنگری زمان عادت</h3>
                        <p className="text-xs text-slate-400">برای عادت «{strugglingHabit.name}»</p>
                    </div>
                </div>
                <button onClick={handleDismiss} className="text-slate-500 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {!suggestion && !isLoading && !error && (
                <div className="text-center py-2">
                    <p className="text-sm text-slate-300 mb-3">این عادت در ۳ روز اخیر انجام نشده است. می‌خواهید زمان بهتری برای آن پیدا کنیم؟</p>
                    <button 
                        onClick={generateSchedule}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        تحلیل و پیشنهاد زمان جدید
                    </button>
                </div>
            )}

            {isLoading ? (
                 <div className="text-center py-4">
                    <p className="text-sm text-slate-400">در حال یافتن زمان مناسب...</p>
                 </div>
            ) : error ? (
                 <div className="text-center py-4">
                    <p className="text-sm text-red-400 mb-2">{error}</p>
                    <button onClick={generateSchedule} className="text-xs bg-slate-700 px-3 py-1 rounded hover:bg-slate-600 transition-colors">تلاش مجدد</button>
                 </div>
            ) : suggestion ? (
                <>
                    <div className="bg-slate-950/50 rounded-lg p-3 mb-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2 text-orange-300 text-sm font-semibold">
                            <SparklesIcon className="w-4 h-4" />
                            <span>پیشنهاد هوشمند: {suggestion.recommendedTime}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{suggestion.reason}</p>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleAccept} 
                            className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <ClockIcon className="w-4 h-4" />
                            تغییر ساعت به {suggestion.recommendedTime}
                        </button>
                        <button 
                            onClick={handleDismiss} 
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-bold transition-colors"
                        >
                            فعلاً نه
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default HabitReschedulerWidget;

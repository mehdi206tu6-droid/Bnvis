import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { OnboardingData, UserGoal, FocusSession } from '../types';
import { SparklesIcon } from './icons';

const FOCUS_SESSIONS_STORAGE_KEY = 'benvis_focus_sessions';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


interface WeeklyReviewViewProps {
    userData: OnboardingData;
    onClose: () => void;
}

const WeeklyReviewView: React.FC<WeeklyReviewViewProps> = ({ userData, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [reviewContent, setReviewContent] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const generateReview = async () => {
            try {
                const goals: UserGoal[] = userData.goals || [];
                const habitCompletion: Record<string, number> = {};
                userData.habits.forEach(h => habitCompletion[h.name] = 0);

                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateString = d.toISOString().split('T')[0];
                    const storageKey = `benvis_habits_${dateString}`;
                    const storedHabits = localStorage.getItem(storageKey);
                    if (storedHabits) {
                        const dailyHabits = JSON.parse(storedHabits);
                        userData.habits.forEach(habit => {
                            if (dailyHabits[habit.name]) {
                                habitCompletion[habit.name]++;
                            }
                        });
                    }
                }

                const storedSessions = localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY);
                const allSessions: FocusSession[] = storedSessions ? JSON.parse(storedSessions) : [];
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                const recentSessions = allSessions.filter(s => new Date(s.date) >= lastWeek);

                const goalsStatus = goals.length > 0
                    ? goals.map(g => `- ${g.title}: Progress ${g.progress}%`).join('\n')
                    : 'No goals set.';
                
                const habitsStatus = userData.habits.length > 0
                    ? userData.habits.map(h => `- Habit: ${h.name}, Completed: ${habitCompletion[h.name]} times`).join('\n')
                    : 'No habits tracked.';

                const focusSessionsStatus = recentSessions.length > 0
                    ? `${recentSessions.length} sessions, total ${recentSessions.reduce((sum, s) => sum + s.duration, 0)} minutes.`
                    : 'No focus sessions logged.';

                const prompt = `
                    You are a personal life coach AI for Benvis Life OS. Analyze the user's weekly data and provide a motivational, concise report in Persian. Focus on achievements, setbacks, and 3 actionable suggestions for next week.

                    User data:
                    - Goals: ${goalsStatus}
                    - Habits: ${habitsStatus}
                    - Quiet Zone sessions: ${focusSessionsStatus}

                    Structure your response:
                    1. Summary: Positive overview (1-2 sentences).
                    2. Key Wins: Bullet points of successes.
                    3. Areas for Improvement: Bullet points of weaknesses.
                    4. Next Steps: 3 specific, achievable tips.
                    5. Motivation Quote: End with an inspiring quote tailored to user's goals.

                    Keep it under 300 words. Use encouraging language. If data shows high progress, celebrate; if low, focus on growth. Output MUST be in Persian.
                `;

                const systemInstruction = "You are a friendly and encouraging life coach for the 'Benvis Life OS' app. Your role is to analyze the user's weekly data and provide a supportive, insightful, and motivating weekly review. Use a positive and encouraging tone. The output must be in Persian and formatted as Markdown.";
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                    config: {
                        systemInstruction: systemInstruction,
                    },
                });

                setReviewContent(response?.text || '');

            } catch (err: any) {
                console.error("Failed to generate weekly review:", err);
                const errorMessage = err?.message || '';
                if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                    setError('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
                } else {
                    setError("متاسفانه در تحلیل هفته شما مشکلی پیش آمد. لطفا دوباره تلاش کنید.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        generateReview();
    }, [userData]);


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-[var(--radius-card)] p-6 w-full max-w-2xl max-h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">مرور هفتگی هوشمند</h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow">
                    {isLoading ? (
                        <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                            <SparklesIcon className="w-12 h-12 text-violet-400 mx-auto animate-pulse mb-4" />
                            <p className="font-semibold text-lg">دستیار هوشمند در حال تحلیل هفته شماست...</p>
                            <p className="text-sm text-slate-400">لطفا چند لحظه صبر کنید.</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-400">{error}</div>
                    ) : (
                        <div className="whitespace-pre-wrap leading-relaxed text-right prose prose-invert prose-p:text-slate-300 prose-headings:text-white" dir="rtl">
                            {reviewContent.split('\n').map((line, i) => {
                                const trimmedLine = line.trim();
                                if (trimmedLine.startsWith('### ') || trimmedLine.startsWith('## ') || trimmedLine.startsWith('# ')) {
                                    return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-violet-300">{trimmedLine.replace(/#/g, '').trim()}</h3>;
                                }
                                if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                                    return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-violet-300">{trimmedLine.replace(/\*\*/g, '').trim()}</h3>
                                }
                                if (trimmedLine.startsWith('* ')) {
                                    return <p key={i} className="mb-2 pl-4 relative before:content-['•'] before:absolute before:right-full before:mr-2 before:text-violet-400">{trimmedLine.substring(2)}</p>;
                                }
                                return <p key={i} className="mb-2">{line}</p>;
                            })}
                        </div>
                    )}
                </div>
                 <div className="mt-6 pt-4 border-t border-slate-700 flex-shrink-0">
                    <button onClick={onClose} className="w-full py-3 bg-violet-700 rounded-[var(--radius-md)] font-semibold hover:bg-violet-800 transition-colors">
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};
export default WeeklyReviewView;

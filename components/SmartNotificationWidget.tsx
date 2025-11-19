
import React, { useState, useEffect } from 'react';
import { OnboardingData, SmartNotification } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { MapPinIcon, SparklesIcon, ClockIcon, BellIcon, ArrowPathIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SmartNotificationWidgetProps {
    userData: OnboardingData;
}

const SmartNotificationWidget: React.FC<SmartNotificationWidgetProps> = ({ userData }) => {
    const [notifications, setNotifications] = useState<SmartNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{lat: number, long: number} | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Try to get location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, long: pos.coords.longitude });
                },
                (err) => {
                    console.warn("Geolocation access denied or failed", err);
                    if (err.code === 1) setPermissionDenied(true);
                }
            );
        }
    }, []);

    const generateNotifications = async () => {
        setIsLoading(true);
        setHasGenerated(true);
        
        const timeOfDay = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const activeGoals = userData.goals.filter(g => g.progress < 100).map(g => g.title).join(', ') || 'None';
        const activeHabits = userData.habits.map(h => h.name).join(', ');
        
        const predictedEnergy = Math.floor(Math.random() * 40) + 60; 
        
        const locString = location ? `${location.lat}, ${location.long}` : "Unknown Location";

        const prompt = `
            SYSTEM:
            You are an AI that designs context-aware notifications based on time, location, weather, user habits and predicted energy.

            TASK:
            Generate 3 smart notifications tailored to the user's current context.

            INPUTS:
            - location: ${locString}
            - timeOfDay: ${timeOfDay}
            - weather: Assume typical weather for this location/time (or "Clear" if unknown).
            - predictedEnergy: ${predictedEnergy} (0–100)
            - activeGoals: ${activeGoals}
            - activeHabits: ${activeHabits}

            OUTPUT:
            Return optimized notifications that are:
            • short (max 14 words)
            • helpful
            • non-intrusive
            • perfectly contextual
            • in Persian language

            FORMAT: JSON

            SCHEMA:
            {
            "notifications": [
                {
                "message": "string",
                "reason": "string",
                "bestTimeToSend": "string"
                }
            ]
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
                            notifications: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        message: { type: Type.STRING },
                                        reason: { type: Type.STRING },
                                        bestTimeToSend: { type: Type.STRING },
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            const result = JSON.parse(response.text.trim());
            if (result.notifications) {
                setNotifications(result.notifications);
            }
        } catch (e) {
            console.error("Failed to generate smart notifications", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 col-span-2 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <BellIcon className="w-5 h-5 text-violet-400" />
                    پیشنهادات لحظه‌ای
                </h3>
                {location && (
                    <span className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded-full">
                        <MapPinIcon className="w-3 h-3" />
                        فعال
                    </span>
                )}
            </div>
            
            {!hasGenerated ? (
                <div className="text-center py-2">
                    <p className="text-xs text-slate-400 mb-3">دریافت پیشنهادات هوشمند بر اساس زمان و مکان شما</p>
                    <button 
                        onClick={generateNotifications}
                        className="w-full py-2 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/40 text-violet-300 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        دریافت پیشنهادات
                    </button>
                </div>
            ) : (
                <>
                {isLoading ? (
                     <div className="text-center py-6 text-slate-500 text-sm flex flex-col items-center gap-2">
                        <SparklesIcon className="w-6 h-6 animate-spin text-violet-500"/>
                        در حال تحلیل شرایط شما...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {notifications.length > 0 ? (
                            notifications.map((notif, idx) => (
                                <div key={idx} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-violet-500 to-transparent opacity-50"></div>
                                    <p className="font-bold text-sm text-slate-200 mb-1 leading-snug">{notif.message}</p>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-[10px] text-slate-400">{notif.reason}</span>
                                        <span className="text-[10px] font-mono text-violet-300 bg-violet-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3" />
                                            {notif.bestTimeToSend}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-4 text-slate-500 text-sm">
                                پیشنهادی یافت نشد.
                            </div>
                        )}
                         <button onClick={generateNotifications} className="col-span-3 mt-2 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1">
                            <ArrowPathIcon className="w-3 h-3"/> بروزرسانی
                        </button>
                    </div>
                )}
                </>
            )}
        </div>
    );
};

export default SmartNotificationWidget;


import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, Habit, HabitCategory } from '../types';
import { 
    CheckCircleIcon, XMarkIcon, FireIcon, ChartBarIcon, 
    PlusIcon, SparklesIcon, 
    ArrowLeftIcon, TrophyIcon
} from './icons';
import HabitReschedulerWidget from './HabitReschedulerWidget';

interface HabitTrackerViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

const CATEGORIES: { id: HabitCategory | 'all', label: string }[] = [
    { id: 'all', label: 'همه' },
    { id: 'health', label: 'سلامت' },
    { id: 'productivity', label: 'بهره‌وری' },
    { id: 'mindfulness', label: 'ذهن‌آگاهی' },
    { id: 'learning', label: 'یادگیری' },
    { id: 'finance', label: 'مالی' },
];

const HabitStatsWidget: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const totalHabits = habits.length;
    if (totalHabits === 0) return null;

    const today = new Date().toISOString().split('T')[0];
    const todayStorage = localStorage.getItem(`benvis_habits_${today}`);
    const todayCompleted = todayStorage ? Object.values(JSON.parse(todayStorage)).filter(Boolean).length : 0;
    const completionRate = Math.round((todayCompleted / totalHabits) * 100);

    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-4 text-center">
            <div>
                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="#334155" strokeWidth="4" fill="none" />
                        <circle 
                            cx="32" cy="32" r="28" 
                            stroke="#8b5cf6" strokeWidth="4" fill="none" 
                            strokeDasharray={175} 
                            strokeDashoffset={175 - (175 * completionRate) / 100} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <span className="absolute text-sm font-bold text-white">{completionRate}%</span>
                </div>
                <p className="text-xs text-slate-400">تکمیل امروز</p>
            </div>
            <div className="flex flex-col justify-center">
                <div className="text-2xl font-black text-orange-500 mb-1 flex items-center justify-center gap-1">
                    <FireIcon className="w-6 h-6 animate-pulse"/>
                    {totalStreak}
                </div>
                <p className="text-xs text-slate-400">مجموع زنجیره</p>
            </div>
            <div className="flex flex-col justify-center">
                <div className="text-2xl font-black text-emerald-400 mb-1">{habits.filter(h => h.streak > 7).length}</div>
                <p className="text-xs text-slate-400">عادت‌های پایدار</p>
            </div>
        </div>
    );
};

const HabitTrackerView: React.FC<HabitTrackerViewProps> = ({ userData, onUpdateUserData, onClose, addXp }) => {
    const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
    const [habits, setHabits] = useState<Habit[]>(userData.habits || []);
    const [showRescheduler, setShowRescheduler] = useState(false);

    // Today's date for checking
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Load completion status for last 7 days
    const getWeeklyStatus = (habitName: string) => {
        const status = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const stored = localStorage.getItem(`benvis_habits_${dStr}`);
            const isDone = stored ? JSON.parse(stored)[habitName] : false;
            status.push({ date: dStr, isDone });
        }
        return status;
    };

    const handleToggleHabit = (habitName: string) => {
        const storageKey = `benvis_habits_${todayStr}`;
        const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const wasDone = !!currentData[habitName];
        const isDone = !wasDone;

        // Update Local Storage for Today
        const newData = { ...currentData, [habitName]: isDone };
        localStorage.setItem(storageKey, JSON.stringify(newData));

        // Update User Data (Streak Logic)
        const updatedHabits = habits.map(h => {
            if (h.name === habitName) {
                let newStreak = h.streak || 0;
                let newHistory = h.history || [];

                if (isDone) {
                    // Add to history if not present
                    if (!newHistory.includes(todayStr)) newHistory = [...newHistory, todayStr];
                    
                    // Basic approach for MVP: assume toggle on increments streak
                    // Real logic would check previous day continuity
                    if (newStreak === 0 || (newHistory.includes(todayStr))) {
                         // Check if yesterday was done to increment streak properly
                         // For simplicity in this demo, we just increment if it wasn't done today
                         newStreak += 1;
                    }
                    addXp(10);
                } else {
                    // Remove from history
                    newHistory = newHistory.filter(d => d !== todayStr);
                    if (newStreak > 0) newStreak -= 1;
                    addXp(-10);
                }

                return { 
                    ...h, 
                    streak: newStreak, 
                    bestStreak: Math.max(h.bestStreak || 0, newStreak),
                    history: newHistory
                };
            }
            return h;
        });

        setHabits(updatedHabits);
        onUpdateUserData({ ...userData, habits: updatedHabits });
    };

    const filteredHabits = habits.filter(h => selectedCategory === 'all' || h.category === selectedCategory);

    return (
        <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col font-[Vazirmatn] animate-fadeIn overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex-none px-6 pt-6 pb-4 flex justify-between items-center bg-[#020617]/95 backdrop-blur-md border-b border-white/5 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-white">ردیاب عادت</h2>
                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Habit Mastery</p>
                    </div>
                </div>
                <button onClick={() => setShowRescheduler(!showRescheduler)} className={`p-2 rounded-xl transition-all ${showRescheduler ? 'bg-orange-500 text-white' : 'bg-slate-800 text-orange-400 hover:bg-slate-700'}`}>
                    <SparklesIcon className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 pb-32 scrollbar-hide">
                
                {showRescheduler && <div className="mb-6"><HabitReschedulerWidget userData={userData} onUpdateUserData={onUpdateUserData} /></div>}

                <HabitStatsWidget habits={habits} />

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Habit List */}
                <div className="space-y-3">
                    {filteredHabits.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-slate-600"/>
                            <p>هیچ عادتی در این دسته یافت نشد.</p>
                        </div>
                    ) : (
                        filteredHabits.map(habit => {
                            const weekly = getWeeklyStatus(habit.name);
                            const isCompletedToday = weekly[6].isDone; // Last element is today

                            return (
                                <div key={habit.name} className={`bg-slate-900/50 border ${isCompletedToday ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-slate-800'} p-4 rounded-2xl transition-all duration-300`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div onClick={() => handleToggleHabit(habit.name)} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ${isCompletedToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'bg-slate-800 border-2 border-slate-600 hover:border-slate-400'}`}>
                                                {isCompletedToday && <CheckCircleIcon className="w-5 h-5"/>}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-base ${isCompletedToday ? 'text-white' : 'text-slate-300'}`}>{habit.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {habit.streak > 0 && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${habit.streak > 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                                                            <FireIcon className="w-3 h-3"/> {habit.streak}
                                                        </span>
                                                    )}
                                                    {habit.bestStreak > 0 && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 bg-yellow-500/20 text-yellow-400">
                                                            <TrophyIcon className="w-3 h-3"/> {habit.bestStreak}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{habit.category || 'عمومی'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Weekly Heatmap */}
                                    <div className="flex justify-between items-center gap-1 bg-black/20 p-2 rounded-xl">
                                        {weekly.map((day, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                                                <div className={`w-full h-1.5 rounded-full transition-colors ${day.isDone ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default HabitTrackerView;

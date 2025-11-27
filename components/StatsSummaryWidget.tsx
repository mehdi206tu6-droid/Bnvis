
import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../types';
import { TargetIcon, HabitsIcon, StarIcon, CheckCircleIcon } from './icons';

const StatCard: React.FC<{ icon: React.FC<{ className?: string }>, value: string | number, label: string, color: string }> = ({ icon: Icon, value, label, color }) => (
    <div className="bg-slate-700/60 p-3 rounded-[var(--radius-md)] flex items-center gap-3">
        <div className={`p-2 rounded-md bg-slate-800/50 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <div className="font-bold text-lg text-white">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
        </div>
    </div>
);


const CircularProgress: React.FC<{ percentage: number, level: number }> = ({ percentage, level }) => {
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    
    // Safely handle NaN or Infinite percentage
    const safePercentage = (isNaN(percentage) || !isFinite(percentage)) ? 0 : Math.min(100, Math.max(0, percentage));
    const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
    
    const isComplete = safePercentage === 100;

    return (
        <div className="relative w-32 h-32 flex-shrink-0">
            <svg
                height="100%"
                width="100%"
                viewBox={`0 0 ${radius*2} ${radius*2}`}
                className="transform -rotate-90"
            >
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <circle
                    stroke="currentColor"
                    className="text-slate-800"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="url(#progressGradient)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, strokeLinecap: 'round', transition: 'stroke-dashoffset 1s ease-out' }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    filter={isComplete ? "url(#glow)" : ""}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                 {isComplete ? (
                     <div className="flex flex-col items-center animate-bounce-in">
                         <CheckCircleIcon className="w-8 h-8 text-yellow-400 mb-1" />
                         <span className="text-xs font-bold text-yellow-100">تکمیل شد</span>
                     </div>
                 ) : (
                     <>
                        <span className="text-xs text-slate-400">سطح</span>
                        <span className="font-bold text-3xl text-white">{level}</span>
                     </>
                 )}
            </div>
        </div>
    );
};

const StatsSummaryWidget: React.FC<{ userData: OnboardingData }> = ({ userData }) => {
    const [weeklyHabitsCount, setWeeklyHabitsCount] = useState(0);

    useEffect(() => {
        if (!userData || !userData.habits) return;

        let count = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            const storageKey = `benvis_habits_${dateString}`;
            try {
                const storedCompletions = localStorage.getItem(storageKey);
                if (storedCompletions) {
                    const parsed = JSON.parse(storedCompletions);
                    count += Object.values(parsed).filter(Boolean).length;
                }
            } catch (e) { /* ignore */ }
        }
        setWeeklyHabitsCount(count);
    }, [userData?.habits]);

    if (!userData) return null;

    const totalGoals = userData.goals ? userData.goals.length : 0;
    const currentLevel = userData.level || 1;
    const currentXp = userData.xp || 0;

    const xpForNextLevel = currentLevel * 100;
    const xpForCurrentLevel = Math.max(0, (currentLevel - 1) * 100);
    
    let xpProgress = 0;
    if (xpForNextLevel > xpForCurrentLevel) {
         xpProgress = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    }
    
    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-6 col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                <CircularProgress percentage={xpProgress} level={currentLevel} />
                <div className="space-y-1">
                     <p className="text-sm text-slate-400 font-mono">{currentXp} / {xpForNextLevel} XP</p>
                     <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden mt-1 relative">
                         <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}></div>
                         {xpProgress >= 100 && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                     </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
                <StatCard 
                    icon={TargetIcon} 
                    value={totalGoals} 
                    label="اهداف فعال" 
                    color="text-blue-400"
                />
                <StatCard 
                    icon={HabitsIcon} 
                    value={weeklyHabitsCount} 
                    label="عادت‌های هفته" 
                    color="text-green-400"
                />
             </div>
        </div>
    );
};

export default StatsSummaryWidget;

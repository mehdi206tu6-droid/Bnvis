
import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../types';
import { TargetIcon, HabitsIcon, StarIcon } from './icons';

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
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg
                height="100%"
                width="100%"
                viewBox={`0 0 ${radius*2} ${radius*2}`}
                className="transform -rotate-90"
            >
                <circle
                    stroke="currentColor"
                    className="text-slate-700"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="currentColor"
                    className="text-violet-500"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, strokeLinecap: 'round' }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-xs text-slate-400">سطح</span>
                 <span className="font-bold text-3xl text-white">{level}</span>
            </div>
        </div>
    );
};

const StatsSummaryWidget: React.FC<{ userData: OnboardingData }> = ({ userData }) => {
    const [weeklyHabitsCount, setWeeklyHabitsCount] = useState(0);

    useEffect(() => {
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
    }, [userData.habits]); // Recalculate if habits change

    const totalGoals = userData.goals.length;
    let totalXpForPreviousLevels = 0;
    for (let i = 1; i < userData.level; i++) {
        totalXpForPreviousLevels += i * 100;
    }
    const xpInCurrentLevel = userData.xp - totalXpForPreviousLevels;
    const xpRequiredForCurrentLevel = userData.level * 100;
    const progressPercentage = xpRequiredForCurrentLevel > 0 ? Math.min(100, (xpInCurrentLevel / xpRequiredForCurrentLevel) * 100) : 0;

    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-shrink-0">
                <CircularProgress percentage={progressPercentage} level={userData.level} />
            </div>
            <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard icon={TargetIcon} value={totalGoals} label="اهداف فعال" color="text-violet-400" />
                <StatCard icon={HabitsIcon} value={weeklyHabitsCount} label="عادت‌های این هفته" color="text-green-400" />
                <StatCard icon={StarIcon} value={userData.xp} label="کل امتیاز (XP)" color="text-yellow-400" />
            </div>
        </div>
    );
};

export default StatsSummaryWidget;

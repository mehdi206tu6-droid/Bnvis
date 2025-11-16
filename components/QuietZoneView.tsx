import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserGoal } from '../types';
import { PlayIcon, PauseIcon, ArrowPathIcon, MoonIcon } from './icons';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;
const FOCUS_SESSIONS_STORAGE_KEY = 'benvis_focus_sessions';
const XP_PER_POMODORO = 25;


interface QuietZoneViewProps {
    goals: UserGoal[];
    onUpdateGoals: (goals: UserGoal[]) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

const QuietZoneView: React.FC<QuietZoneViewProps> = ({ goals, onUpdateGoals, onClose, addXp }) => {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeRemaining, setTimeRemaining] = useState(WORK_MINUTES * 60);
    const [isActive, setIsActive] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals.length > 0 ? goals[0].id : null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
             if (timerRef.current) clearInterval(timerRef.current);
        }
    }, []);

    const playSound = () => {
        if (!audioContextRef.current) return;
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.5);
    };

    const handleSessionComplete = useCallback(() => {
        playSound();

        if (mode === 'work') {
            addXp(XP_PER_POMODORO);
            if (selectedGoalId) {
                const updatedGoals = goals.map(g => {
                    if (g.id === selectedGoalId) {
                        const newPomodorosCompleted = (g.pomodorosCompleted || 0) + 1;
                        return { ...g, pomodorosCompleted: newPomodorosCompleted };
                    }
                    return g;
                });
                onUpdateGoals(updatedGoals);
            }
            const storedSessions = localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY);
            const allSessions = storedSessions ? JSON.parse(storedSessions) : [];
            const newSession = {
                date: new Date().toISOString().split('T')[0],
                duration: WORK_MINUTES,
                goalId: selectedGoalId
            };
            allSessions.push(newSession);
            localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
            
            setMode('break');
            setTimeRemaining(BREAK_MINUTES * 60);
        } else {
            setMode('work');
            setTimeRemaining(WORK_MINUTES * 60);
        }
        setIsActive(false);
    }, [mode, addXp, selectedGoalId, goals, onUpdateGoals]);

    useEffect(() => {
        if (isActive) {
            timerRef.current = window.setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        if(timerRef.current) clearInterval(timerRef.current);
                        handleSessionComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, handleSessionComplete]);


    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsActive(false);
        setMode('work');
        setTimeRemaining(WORK_MINUTES * 60);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalDuration = mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
    const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-800/50 rounded-[var(--radius-card)] p-6 w-full max-w-md flex flex-col items-center modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center w-full mb-4">
                     <h2 className="text-xl font-bold text-blue-200 flex items-center gap-2">
                        <MoonIcon className="w-6 h-6"/>
                        منطقه سکوت
                     </h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center my-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-700"/>
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={mode === 'work' ? "text-blue-500" : "text-green-500"}
                            strokeDasharray={339.292}
                            strokeDashoffset={339.292 - (progress / 100) * 339.292}
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className="absolute text-center">
                        <div className={`text-sm font-bold uppercase ${mode === 'work' ? 'text-blue-400' : 'text-green-400'}`}>{mode === 'work' ? 'تمرکز' : 'استراحت'}</div>
                        <div className="text-6xl font-mono font-bold">{formatTime(timeRemaining)}</div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <select
                        value={selectedGoalId || ''}
                        onChange={(e) => setSelectedGoalId(e.target.value || null)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        disabled={isActive}
                    >
                        <option value="">بدون هدف</option>
                        {goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                    </select>

                    <div className="flex items-center justify-center gap-6">
                        <button onClick={resetTimer} className="p-4 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors">
                            <ArrowPathIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={toggleTimer} className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors">
                            {isActive ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10"/>}
                        </button>
                         <div className="w-16 h-16"></div> {/* Spacer */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuietZoneView;
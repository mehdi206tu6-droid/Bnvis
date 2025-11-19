


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserGoal, FocusSession } from '../types';
import { PlayIcon, PauseIcon, ArrowPathIcon, MoonIcon, SparklesIcon, CheckCircleIcon, SpeakerWaveIcon, ChartBarIcon } from './icons';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FOCUS_SESSIONS_STORAGE_KEY = 'benvis_focus_sessions';
const XP_PER_POMODORO = 25;

interface QuietZoneViewProps {
    goals: UserGoal[];
    onUpdateGoals: (goals: UserGoal[]) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

// Updated to use reliable MP3 sources
const ambientSounds = [
    { id: 'none', name: 'بی‌صدا', src: '' },
    { id: 'lofi', name: 'کافه (محیط)', src: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-444.mp3' }, 
    { id: 'rain', name: 'صدای باران', src: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
];

const SmartPomodoroModal: React.FC<{
    onApply: (config: { work: number, break: number }) => void;
    onClose: () => void;
}> = ({ onApply, onClose }) => {
    const [energy, setEnergy] = useState('medium');
    const [difficulty, setDifficulty] = useState('medium');
    const [stress, setStress] = useState('medium');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ workMinutes: number, breakMinutes: number, tip: string } | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setResult(null);
        const prompt = `You are an AI that optimizes Pomodoro session length based on energy, task difficulty, and stress.
        Inputs:
        - Energy: ${energy}
        - Task Difficulty: ${difficulty}
        - Stress Level: ${stress}
        Generate the ideal work duration, break duration, and a coaching tip.
        Respond ONLY with a valid JSON object. All text must be in Persian where applicable.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            workMinutes: { type: Type.NUMBER },
                            breakMinutes: { type: Type.NUMBER },
                            tip: { type: Type.STRING },
                        }
                    }
                }
            });
            setResult(JSON.parse(response.text.trim()));
        } catch (error) {
            console.error("Smart Pomodoro error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const RadioGroup: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: {value: string; label: string}[] }> = ({ label, value, onChange, options }) => (
        <div>
            <label className="font-semibold block mb-2 text-sm">{label}</label>
            <div className="flex gap-2 bg-slate-700/50 p-1 rounded-full">
                {options.map(opt => (
                    <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 text-xs font-semibold py-1.5 rounded-full ${value === opt.value ? 'bg-violet-500 text-white' : ''}`}>{opt.label}</button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md modal-panel" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-violet-400" /> تنظیم هوشمند جلسه</h3>
                {!result ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">به چند سوال کوتاه پاسخ دهید تا بهترین زمان‌بندی برای شما پیشنهاد شود.</p>
                        <RadioGroup label="سطح انرژی فعلی شما" value={energy} onChange={setEnergy} options={[{value: 'low', label: 'کم'}, {value: 'medium', label: 'متوسط'}, {value: 'high', label: 'زیاد'}]} />
                        <RadioGroup label="سختی کار پیش رو" value={difficulty} onChange={setDifficulty} options={[{value: 'easy', label: 'آسان'}, {value: 'medium', label: 'متوسط'}, {value: 'hard', label: 'سخت'}]} />
                        <RadioGroup label="سطح استرس شما" value={stress} onChange={setStress} options={[{value: 'low', label: 'کم'}, {value: 'medium', label: 'متوسط'}, {value: 'high', label: 'زیاد'}]} />
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4 py-2 bg-violet-700 rounded-md font-semibold disabled:bg-slate-500">
                            {isLoading ? 'در حال محاسبه...' : 'دریافت پیشنهاد'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <p className="text-sm text-slate-400">بر اساس وضعیت شما، این برنامه پیشنهاد می‌شود:</p>
                        <div className="flex justify-around items-center bg-slate-800 p-4 rounded-lg">
                            <div>
                                <p className="text-sm font-semibold">زمان تمرکز</p>
                                <p className="text-3xl font-bold text-blue-400">{result.workMinutes}</p>
                                <p className="text-xs">دقیقه</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold">زمان استراحت</p>
                                <p className="text-3xl font-bold text-green-400">{result.breakMinutes}</p>
                                <p className="text-xs">دقیقه</p>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                            <p className="font-semibold text-violet-300 text-sm">نکته مربی:</p>
                            <p className="text-sm text-slate-300 italic">"{result.tip}"</p>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button onClick={onClose} className="flex-1 py-2 bg-slate-600 rounded-md">لغو</button>
                            <button onClick={() => onApply({ work: result.workMinutes, break: result.breakMinutes })} className="flex-1 py-2 bg-violet-700 rounded-md">اعمال</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuietZoneView: React.FC<QuietZoneViewProps> = ({ goals, onUpdateGoals, onClose, addXp }) => {
    const [tab, setTab] = useState<'timer' | 'history'>('timer');
    const [workDuration, setWorkDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals.length > 0 ? goals[0].id : null);
    
    // New AI-powered state
    const [microTasks, setMicroTasks] = useState<{ text: string; completed: boolean }[]>([]);
    const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
    const [showSmartPomodoro, setShowSmartPomodoro] = useState(false);

    // Audio state
    const [ambientSound, setAmbientSound] = useState('none');
    const audioRef = useRef<HTMLAudioElement>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
             if (timerRef.current) clearInterval(timerRef.current);
        }
    }, []);

    const playSound = (type: 'complete' | 'start') => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        
        if (type === 'complete') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        } else { // start
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        }
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    };

    const handleSessionComplete = useCallback(() => {
        playSound('complete');

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
            const allSessions: FocusSession[] = storedSessions ? JSON.parse(storedSessions) : [];
            const newSession = {
                date: new Date().toISOString().split('T')[0],
                duration: workDuration,
                goalId: selectedGoalId
            };
            allSessions.push(newSession);
            localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
            
            setMode('break');
            setTimeRemaining(breakDuration * 60);
        } else {
            setMode('work');
            setTimeRemaining(workDuration * 60);
            // Optionally, re-generate tasks for the new work session
            if (selectedGoalId) {
                generateMicroTasks(selectedGoalId);
            }
        }
        setIsActive(false);
    }, [mode, addXp, selectedGoalId, goals, onUpdateGoals, workDuration, breakDuration]);

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

    // Robust Audio Playback Effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleAudioPlayback = async () => {
            try {
                if (isActive && ambientSound !== 'none') {
                    // Ensure source is set before playing
                    const soundUrl = ambientSounds.find(s => s.id === ambientSound)?.src || '';
                    if (audio.src !== soundUrl) {
                        audio.src = soundUrl;
                        audio.load();
                    }
                    
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                             if (error.name !== 'AbortError') {
                                console.warn("Audio playback error:", error);
                            }
                        });
                    }
                } else {
                    audio.pause();
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                     console.warn("Audio playback error:", error);
                }
            }
        };

        handleAudioPlayback();
        
        return () => {
            // Cleanup: Pause when component unmounts or dependencies change
            audio.pause();
        }
    }, [isActive, ambientSound]);

    const generateMicroTasks = async (goalId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        
        setIsGeneratingTasks(true);
        setMicroTasks([]);

        const prompt = `Based on the user's goal "${goal.title}", suggest 3 very small, actionable micro-tasks that can be completed within a 25-minute focus session. Respond ONLY with a valid JSON array of strings in Persian.`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            });
            const tasks: string[] = JSON.parse(response.text.trim());
            setMicroTasks(tasks.map(t => ({ text: t, completed: false })));
        } catch (error) {
            console.error("Error generating micro-tasks:", error);
        } finally {
            setIsGeneratingTasks(false);
        }
    };
    
    useEffect(() => {
        if (selectedGoalId) {
            generateMicroTasks(selectedGoalId);
        } else {
            setMicroTasks([]);
        }
    }, [selectedGoalId]);

    const toggleTimer = () => {
        if (!isActive) playSound('start');
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsActive(false);
        setMode('work');
        setTimeRemaining(workDuration * 60);
        // Stop audio on reset
        if (audioRef.current) audioRef.current.pause();
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const handleApplySmartConfig = (config: { work: number, break: number }) => {
        setWorkDuration(config.work);
        setBreakDuration(config.break);
        setMode('work');
        setTimeRemaining(config.work * 60);
        setShowSmartPomodoro(false);
        setIsActive(false); // Stop timer when applying new config
    };
    
    const getHistory = () => {
        try {
            const sessions = JSON.parse(localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY) || '[]') as FocusSession[];
            return sessions.reverse(); // Newest first
        } catch {
            return [];
        }
    };

    const totalDuration = mode === 'work' ? workDuration * 60 : breakDuration * 60;
    const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            {showSmartPomodoro && <SmartPomodoroModal onApply={handleApplySmartConfig} onClose={() => setShowSmartPomodoro(false)} />}
            <audio ref={audioRef} loop crossOrigin="anonymous" />
            <div className="w-full max-w-lg flex flex-col items-center modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center w-full mb-4">
                     <h2 className="text-xl font-bold text-blue-200 flex items-center gap-2">
                        <MoonIcon className="w-6 h-6"/>
                        مدیریت تمرکز (پومودورو)
                     </h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>
                
                <div className="flex gap-2 mb-4 bg-slate-800/50 p-1 rounded-full">
                    <button onClick={() => setTab('timer')} className={`px-4 py-1.5 rounded-full text-sm font-bold ${tab === 'timer' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>تایمر</button>
                    <button onClick={() => setTab('history')} className={`px-4 py-1.5 rounded-full text-sm font-bold ${tab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>تاریخچه</button>
                </div>

                <div className="w-full bg-slate-800/50 border border-blue-800/30 rounded-[var(--radius-card)] p-6 h-[500px] overflow-y-auto">
                    {tab === 'timer' ? (
                        <>
                            <div className="flex items-center gap-2 mb-6">
                                <select
                                    value={selectedGoalId || ''}
                                    onChange={(e) => setSelectedGoalId(e.target.value || null)}
                                    className="flex-grow bg-slate-800 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                                    disabled={isActive}
                                >
                                    <option value="">یک هدف برای تمرکز انتخاب کنید</option>
                                    {goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                                </select>
                                <button onClick={() => setShowSmartPomodoro(true)} className="p-3 bg-slate-800 border border-slate-700 rounded-[var(--radius-md)] text-violet-400 hover:bg-slate-700 transition-colors" title="تنظیم هوشمند">
                                    <SparklesIcon className="w-6 h-6"/>
                                </button>
                            </div>

                            <div className="relative w-64 h-64 flex items-center justify-center my-6 mx-auto">
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
                            
                            {mode === 'work' && (
                                <div className="space-y-3 mb-6 min-h-[120px]">
                                     <h3 className="font-semibold text-slate-300 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-violet-400"/> وظایف این جلسه:</h3>
                                     {isGeneratingTasks ? (
                                        <p className="text-sm text-slate-400 animate-pulse">هوش مصنوعی در حال ساختن وظایف...</p>
                                     ) : (
                                        microTasks.map((task, index) => (
                                             <label key={index} className="flex items-center gap-3 p-2 rounded-md bg-slate-700/50 cursor-pointer">
                                                <input type="checkbox" checked={task.completed} onChange={() => setMicroTasks(prev => prev.map((t, i) => i === index ? {...t, completed: !t.completed} : t))} className="w-5 h-5 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500"/>
                                                <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.text}</span>
                                            </label>
                                        ))
                                     )}
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-6">
                                <button onClick={resetTimer} title="ریست" className="p-4 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors">
                                    <ArrowPathIcon className="w-6 h-6"/>
                                </button>
                                <button onClick={toggleTimer} className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-800/40">
                                    {isActive ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10"/>}
                                </button>
                                 <div className="relative group">
                                    <button className="p-4 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors">
                                        <SpeakerWaveIcon className="w-6 h-6"/>
                                    </button>
                                     <div className="absolute bottom-full right-0 mb-2 w-40 bg-slate-800 border border-slate-700 rounded-md p-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                        {ambientSounds.map(sound => (
                                            <button key={sound.id} onClick={() => setAmbientSound(sound.id)} className={`w-full text-right p-2 text-sm rounded-md flex justify-between items-center ${sound.id === ambientSound ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>
                                                <span>{sound.name}</span>
                                                {sound.id === ambientSound && <CheckCircleIcon className="w-4 h-4" />}
                                            </button>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="font-bold flex items-center gap-2 mb-4"><ChartBarIcon className="w-5 h-5 text-blue-400"/> تاریخچه جلسات</h3>
                            {getHistory().length === 0 ? (
                                <p className="text-slate-400 text-center py-8">هنوز جلسه‌ای ثبت نشده است.</p>
                            ) : (
                                getHistory().map((session, i) => {
                                    const goalTitle = goals.find(g => g.id === session.goalId)?.title || 'هدف عمومی';
                                    return (
                                        <div key={i} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-sm text-slate-200">{goalTitle}</p>
                                                <p className="text-xs text-slate-400">{session.date}</p>
                                            </div>
                                            <div className="font-mono font-bold text-blue-400">{session.duration} دقیقه</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuietZoneView;

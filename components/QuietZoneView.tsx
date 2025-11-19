
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserGoal, FocusSession } from '../types';
import { PlayIcon, PauseIcon, ArrowPathIcon, MoonIcon, SparklesIcon, CheckCircleIcon, SpeakerWaveIcon, ChartBarIcon, BoltIcon, BrainIcon, BriefcaseIcon } from './icons';
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
        
        const systemPrompt = `You optimize Pomodoro session length based on energy, task difficulty, and stress.`;
        
        const userPrompt = `
        TASK:
        Generate:
        - work duration
        - break duration
        - coaching tip

        CONTEXT:
        - User Energy: ${energy}
        - Task Difficulty: ${difficulty}
        - Stress Level: ${stress}

        SCHEMA:
        {
          "workMinutes": "number",
          "breakMinutes": "number",
          "tip": "string"
        }
        Output valid JSON only. Language: Persian.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
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

    const SelectionCard: React.FC<{ 
        label: string; 
        icon: React.FC<{className?: string}>; 
        value: string; 
        onChange: (val: string) => void; 
        options: {value: string, label: string, color: string}[] 
    }> = ({ label, icon: Icon, value, onChange, options }) => (
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-slate-400"/>
                <span className="font-bold text-sm text-slate-200">{label}</span>
            </div>
            <div className="flex gap-2">
                {options.map(opt => (
                    <button 
                        key={opt.value} 
                        onClick={() => onChange(opt.value)} 
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${value === opt.value ? `${opt.color} text-white shadow-lg scale-105` : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 w-full max-w-md modal-panel relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500"></div>
                
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                    <SparklesIcon className="w-6 h-6 text-fuchsia-400" /> 
                    کالیبراسیون هوشمند
                </h3>

                {!result ? (
                    <div className="space-y-4">
                        <SelectionCard 
                            label="سطح انرژی شما" 
                            icon={BoltIcon} 
                            value={energy} 
                            onChange={setEnergy} 
                            options={[
                                {value: 'low', label: 'کم', color: 'bg-red-500'}, 
                                {value: 'medium', label: 'متوسط', color: 'bg-yellow-500'}, 
                                {value: 'high', label: 'زیاد', color: 'bg-green-500'}
                            ]} 
                        />
                        <SelectionCard 
                            label="سختی کار" 
                            icon={BriefcaseIcon} 
                            value={difficulty} 
                            onChange={setDifficulty} 
                            options={[
                                {value: 'easy', label: 'آسان', color: 'bg-blue-500'}, 
                                {value: 'medium', label: 'متوسط', color: 'bg-indigo-500'}, 
                                {value: 'hard', label: 'سخت', color: 'bg-purple-500'}
                            ]} 
                        />
                        <SelectionCard 
                            label="سطح استرس" 
                            icon={BrainIcon} 
                            value={stress} 
                            onChange={setStress} 
                            options={[
                                {value: 'low', label: 'آرام', color: 'bg-emerald-500'}, 
                                {value: 'medium', label: 'نرمال', color: 'bg-orange-500'}, 
                                {value: 'high', label: 'پرتنش', color: 'bg-rose-500'}
                            ]} 
                        />
                        
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-900/40 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:scale-100">
                            {isLoading ? 'در حال محاسبه بهترین ریتم...' : 'محاسبه برنامه بهینه'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 text-center animate-fadeIn">
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10"></div>
                            <div className="flex justify-around items-center relative z-10">
                                <div>
                                    <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">تمرکز (Work)</p>
                                    <p className="text-4xl font-black text-white">{result.workMinutes}<span className="text-lg font-medium text-slate-400 ml-1">دقیقه</span></p>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-600"></div>
                                <div>
                                    <p className="text-xs font-bold text-green-300 uppercase tracking-wider mb-1">استراحت (Break)</p>
                                    <p className="text-4xl font-black text-white">{result.breakMinutes}<span className="text-lg font-medium text-slate-400 ml-1">دقیقه</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-4 rounded-xl text-right">
                            <div className="flex items-center gap-2 mb-2 text-fuchsia-300 font-bold text-sm">
                                <SparklesIcon className="w-4 h-4"/>
                                <span>توصیه هوشمند:</span>
                            </div>
                            <p className="text-slate-200 text-sm leading-relaxed">{result.tip}</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setResult(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors">تلاش مجدد</button>
                            <button onClick={() => onApply({ work: result.workMinutes, break: result.breakMinutes })} className="flex-[2] py-3 bg-white text-violet-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                شروع با این برنامه
                            </button>
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
                                <button onClick={() => setShowSmartPomodoro(true)} className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 border border-violet-500 rounded-[var(--radius-md)] text-white hover:shadow-lg transition-all shadow-violet-900/20" title="تنظیم هوشمند">
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

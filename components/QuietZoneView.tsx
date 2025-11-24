
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserGoal } from '../types';
import { 
    PlayIcon, PauseIcon, XMarkIcon, SparklesIcon, 
    BoltIcon, CoffeeIcon, CloudIcon, FireIcon, 
    NoSymbolIcon, CheckCircleIcon, ArrowPathIcon
} from './icons';

interface QuietZoneViewProps {
    goals: UserGoal[];
    onUpdateGoals: (goals: UserGoal[]) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

const SOUNDS = [
    { id: 'none', icon: NoSymbolIcon, label: 'سکوت' },
    { id: 'rain', icon: CloudIcon, label: 'باران', src: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
    { id: 'cafe', icon: CoffeeIcon, label: 'کافه', src: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-444.mp3' },
    { id: 'fire', icon: FireIcon, label: 'آتش', src: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackles-1330.mp3' },
];

const QuietZoneView: React.FC<QuietZoneViewProps> = ({ goals, onUpdateGoals, onClose, addXp }) => {
    const [duration, setDuration] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [sessionIntent, setSessionIntent] = useState('');
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [selectedSound, setSelectedSound] = useState('none');
    
    const audioRef = useRef<HTMLAudioElement>(null);
    const timerRef = useRef<number | null>(null);

    // Audio Handler
    useEffect(() => {
        if (!audioRef.current) return;
        const sound = SOUNDS.find(s => s.id === selectedSound);
        if (isActive && sound && sound.src) {
            if (audioRef.current.src !== sound.src) {
                audioRef.current.src = sound.src;
                audioRef.current.load();
            }
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
        }
    }, [isActive, selectedSound]);

    // Timer Logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isActive, timeLeft]);

    const handleComplete = () => {
        setIsActive(false);
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
        audio.play();

        if (mode === 'focus') {
            addXp(25);
            setMode('break');
            setTimeLeft(5 * 60);
            setDuration(5);
        } else {
            setMode('focus');
            setTimeLeft(25 * 60);
            setDuration(25);
        }
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center font-[Vazirmatn] transition-colors duration-1000">
            {/* Immersive Background */}
            <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${isActive ? 'opacity-20' : 'opacity-40'}`}>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-gradient-to-b ${mode === 'focus' ? 'from-violet-900 to-indigo-900' : 'from-emerald-900 to-teal-900'} rounded-full blur-[150px] animate-pulse`}></div>
            </div>

            <audio ref={audioRef} loop crossOrigin="anonymous" />

            {/* Header controls */}
            <div className={`absolute top-6 left-6 right-6 flex justify-between items-center z-20 transition-all duration-500 ${isActive ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100'}`}>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {mode === 'focus' ? <BoltIcon className="w-5 h-5 text-violet-400"/> : <SparklesIcon className="w-5 h-5 text-emerald-400"/>}
                    {mode === 'focus' ? 'منطقه سکوت' : 'بازیابی انرژی'}
                </h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <XMarkIcon className="w-6 h-6 text-slate-400 hover:text-white"/>
                </button>
            </div>

            {/* Main Timer Display */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
                
                {/* Intent Input (Optional) */}
                {!isActive && mode === 'focus' && (
                    <div className="w-full mb-8 animate-fadeIn relative group">
                        <input 
                            type="text" 
                            value={sessionIntent}
                            onChange={(e) => setSessionIntent(e.target.value)}
                            placeholder="روی چه چیزی تمرکز می‌کنید؟"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-center text-lg text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all"
                        />
                    </div>
                )}

                {/* Visual Timer Circle */}
                <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                    {/* Glow Effect behind timer */}
                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 transition-colors duration-1000 ${mode === 'focus' ? 'bg-violet-600' : 'bg-emerald-600'} ${isActive ? 'animate-pulse' : ''}`}></div>

                    {/* SVG Ring */}
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                        <circle cx="160" cy="160" r="140" fill="transparent" stroke="#18181b" strokeWidth="8" />
                        <circle 
                            cx="160" cy="160" r="140" 
                            fill="transparent" 
                            stroke={mode === 'focus' ? '#8b5cf6' : '#10b981'} 
                            strokeWidth="8" 
                            strokeDasharray={879}
                            strokeDashoffset={879 - (progress / 100) * 879}
                            strokeLinecap="round"
                            className="transition-[stroke-dashoffset] duration-1000 ease-linear filter drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        />
                    </svg>
                    
                    {/* Digital Time */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-7xl font-mono font-black text-white tracking-tighter drop-shadow-lg">
                            {formatTime(timeLeft)}
                        </span>
                        {!isActive && (
                            <div className="flex gap-3 mt-6">
                                {[25, 45, 60].map(min => (
                                    <button 
                                        key={min}
                                        onClick={() => { setDuration(min); setTimeLeft(min*60); }} 
                                        className={`text-xs font-bold px-4 py-2 rounded-full border transition-all hover:scale-105 ${duration === min ? 'bg-white text-black border-white shadow-lg' : 'border-slate-700 text-slate-400 bg-black/40 hover:bg-black/60'}`}
                                    >
                                        {min}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-8 w-full">
                    <button 
                        onClick={toggleTimer}
                        className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl transform hover:scale-105 active:scale-95 ${isActive ? 'bg-slate-800/80 border border-slate-700 text-white' : 'bg-gradient-to-br from-white to-slate-200 text-black'}`}
                    >
                        {isActive ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10 ml-1"/>}
                    </button>

                    {/* Sound Selector */}
                    <div className={`flex gap-4 p-2 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                        {SOUNDS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSound(s.id)}
                                className={`p-3 rounded-xl transition-all ${selectedSound === s.id ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                                title={s.label}
                            >
                                <s.icon className="w-6 h-6"/>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Quit button (only when active) */}
            {isActive && (
                <button onClick={() => setIsActive(false)} className="absolute bottom-8 text-slate-500 hover:text-red-400 text-sm font-medium transition-colors px-6 py-2 rounded-full hover:bg-white/5">
                    توقف جلسه
                </button>
            )}
        </div>
    );
};

export default QuietZoneView;

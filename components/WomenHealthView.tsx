
import React, { useState, useEffect } from 'react';
import { OnboardingData, WomenHealthData, CycleLog } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    HealthIcon, ShareIcon, SparklesIcon, FaceSmileIcon, FaceFrownIcon, BoltIcon,
    FaceMehIcon, ChevronLeftIcon, ChevronRightIcon, WaterDropIcon,
    PencilIcon, TrashIcon, CalendarIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface WomenHealthViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const SYMPTOMS_LIST = [
    { id: 'Cramps', label: 'گرفتگی', icon: '⚡' },
    { id: 'Headache', label: 'سردرد', icon: '🤕' },
    { id: 'Bloating', label: 'نفخ', icon: '🎈' },
    { id: 'Backache', label: 'کمردرد', icon: '🦴' },
    { id: 'Acne', label: 'آکنه', icon: '🔴' },
    { id: 'Fatigue', label: 'خستگی', icon: '🔋' },
    { id: 'Cravings', label: 'هوس', icon: '🍫' },
    { id: 'Insomnia', label: 'بی‌خوابی', icon: '💤' }
];

const MOODS = [
    { id: 'happy', label: 'شاد', icon: <FaceSmileIcon className="w-6 h-6"/>, color: 'text-green-400' },
    { id: 'energetic', label: 'پرانرژی', icon: <BoltIcon className="w-6 h-6"/>, color: 'text-yellow-400' },
    { id: 'sensitive', label: 'حساس', icon: <span className="text-xl">🥺</span>, color: 'text-pink-300' },
    { id: 'tired', label: 'خسته', icon: <FaceMehIcon className="w-6 h-6"/>, color: 'text-slate-400' },
    { id: 'anxious', label: 'مضطرب', icon: <span className="text-xl">😰</span>, color: 'text-violet-400' },
    { id: 'irritable', label: 'عصبی', icon: <span className="text-xl">😡</span>, color: 'text-red-400' }
];

const FLOWS = [
    { id: 'spotting', label: 'لکه‌بینی', color: 'bg-pink-300' },
    { id: 'light', label: 'سبک', color: 'bg-pink-400' },
    { id: 'medium', label: 'متوسط', color: 'bg-pink-500' },
    { id: 'heavy', label: 'سنگین', color: 'bg-pink-700' },
];

const PHASE_INFO = {
    'Menstrual': { label: 'قاعدگی', description: 'زمان استراحت و بازیابی انرژی.', color: '#f43f5e', advice: 'گرم بمانید و آهن مصرف کنید.' },
    'Follicular': { label: 'فولیکولار', description: 'انرژی در حال افزایش است.', color: '#3b82f6', advice: 'زمان خوبی برای یادگیری و خلاقیت.' },
    'Ovulation': { label: 'تخمک‌گذاری', description: 'اوج انرژی و اعتماد به نفس.', color: '#10b981', advice: 'عالی برای جلسات مهم و ورزش.' },
    'Luteal': { label: 'لوتئال', description: 'انرژی کاهش می‌یابد، آرام باشید.', color: '#8b5cf6', advice: 'مراقب نوسانات خلقی باشید.' },
    'Unknown': { label: 'نامشخص', description: 'اطلاعات کافی نیست.', color: '#64748b', advice: 'چرخه خود را ثبت کنید.' }
};

// --- SVG Math Helpers ---
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

const CycleWheel: React.FC<{
    currentDay: number;
    cycleLength: number;
    selectedDay: number;
    onSelectDay: (day: number) => void;
    phase: string;
}> = ({ currentDay, cycleLength = 28, selectedDay, onSelectDay, phase }) => {
    const radius = 130;
    const strokeWidth = 20;
    const size = (radius + strokeWidth) * 2;
    const center = size / 2;
    
    // Phase Definitions (Days)
    const phases = [
        { id: 'Menstrual', start: 1, end: 5, color: '#f43f5e' }, 
        { id: 'Follicular', start: 6, end: 11, color: '#3b82f6' }, 
        { id: 'Ovulation', start: 12, end: 16, color: '#10b981' }, 
        { id: 'Luteal', start: 17, end: cycleLength, color: '#8b5cf6' }
    ];

    const days = Array.from({ length: cycleLength }, (_, i) => i + 1);
    const anglePerDay = 360 / cycleLength;

    // Get active phase color for glow effect
    const activePhaseColor = PHASE_INFO[phase as keyof typeof PHASE_INFO]?.color || '#64748b';

    return (
        <div className="relative flex justify-center items-center my-6 drop-shadow-2xl">
            {/* Glowing Backdrop */}
            <div 
                className="absolute inset-0 rounded-full opacity-20 blur-[60px] transition-colors duration-1000"
                style={{ backgroundColor: activePhaseColor }}
            ></div>

            <svg width={size} height={size} className="transform -rotate-90 z-10 overflow-visible">
                {/* Track Background */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />

                {/* Day Segments */}
                {days.map(day => {
                    const startAngle = (day - 1) * anglePerDay;
                    const endAngle = day * anglePerDay;
                    const gap = 1.5; // Gap between segments
                    
                    // Identify Phase Color
                    let color = '#334155'; 
                    const p = phases.find(ph => day >= ph.start && day <= ph.end);
                    if (p) color = p.color;
                    
                    const isSelected = day === selectedDay;
                    const isToday = day === currentDay;
                    
                    // Interactive Styles
                    const segmentStrokeWidth = isSelected ? strokeWidth + 10 : (isToday ? strokeWidth + 4 : strokeWidth);
                    const segmentOpacity = isSelected ? 1 : (selectedDay ? 0.5 : 0.8);

                    return (
                        <g key={day} onClick={() => onSelectDay(day)} className="cursor-pointer transition-all duration-300 group">
                            <path
                                d={describeArc(center, center, radius, startAngle + gap, endAngle - gap)}
                                fill="none"
                                stroke={color}
                                strokeWidth={segmentStrokeWidth}
                                strokeLinecap="round"
                                style={{ opacity: segmentOpacity, transition: 'all 0.3s ease' }}
                                className="hover:opacity-100"
                            />
                            
                            {/* Day Numbers for Key Days */}
                            {(isToday || isSelected || day === 1 || day % 5 === 0) && (
                                <text
                                    x={polarToCartesian(center, center, radius - 30, (startAngle + endAngle)/2).x}
                                    y={polarToCartesian(center, center, radius - 30, (startAngle + endAngle)/2).y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={isToday ? '#fff' : '#94a3b8'}
                                    fontSize={isToday || isSelected ? "14" : "10"}
                                    fontWeight="bold"
                                    transform={`rotate(90, ${polarToCartesian(center, center, radius - 30, (startAngle + endAngle)/2).x}, ${polarToCartesian(center, center, radius - 30, (startAngle + endAngle)/2).y})`}
                                    className="pointer-events-none transition-all"
                                >
                                    {day}
                                </text>
                            )}
                            
                            {/* Today Indicator Dot */}
                            {isToday && (
                                <circle
                                    cx={polarToCartesian(center, center, radius + 25, (startAngle + endAngle)/2).x}
                                    cy={polarToCartesian(center, center, radius + 25, (startAngle + endAngle)/2).y}
                                    r="4"
                                    fill="#fff"
                                    className="animate-pulse"
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
            
            {/* Central Info Hub */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                <div className="text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">روز چرخه</p>
                    <h2 
                        className="text-6xl font-black text-white drop-shadow-lg"
                        style={{ textShadow: `0 0 20px ${activePhaseColor}80` }}
                    >
                        {selectedDay}
                    </h2>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activePhaseColor }}></div>
                        <span className="text-sm font-bold text-slate-200">
                            {PHASE_INFO[phase as keyof typeof PHASE_INFO]?.label || phase}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WomenHealthView: React.FC<WomenHealthViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const healthData: WomenHealthData = userData.womenHealth || {
        cycleLogs: [],
        periodStarts: [],
        avgCycleLength: 28,
        partner: { enabled: false, name: '' }
    };

    // Determine current state
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Find the start of the current cycle
    const sortedStarts = [...healthData.periodStarts].sort().reverse();
    const currentCycleStart = sortedStarts.find(d => new Date(d) <= today) || todayStr;
    
    // Calculate cycle days
    const getDayDiff = (d1: string, d2: string) => Math.floor((new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 3600 * 24));
    const currentCycleDay = getDayDiff(todayStr, currentCycleStart) + 1;
    
    // Interaction State
    const [selectedCycleDay, setSelectedCycleDay] = useState(currentCycleDay);
    const [partnerTip, setPartnerTip] = useState<string | null>(null);
    const [isGeneratingTip, setIsGeneratingTip] = useState(false);
    const [viewMode, setViewMode] = useState<'wheel' | 'calendar'>('wheel');

    // Derived date from selected cycle day
    const selectedDateObj = new Date(currentCycleStart);
    selectedDateObj.setDate(selectedDateObj.getDate() + (selectedCycleDay - 1));
    const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
    const selectedLog = healthData.cycleLogs.find(l => l.date === selectedDateStr);

    // Determine Phase
    const getPhase = (day: number) => {
        if (day <= 5) return 'Menstrual';
        if (day <= 11) return 'Follicular';
        if (day <= 16) return 'Ovulation';
        return 'Luteal';
    };
    const currentPhase = getPhase(selectedCycleDay);
    const phaseInfo = PHASE_INFO[currentPhase as keyof typeof PHASE_INFO];

    // Handlers
    const updateLog = (updates: Partial<CycleLog>) => {
        let newLogs = [...healthData.cycleLogs];
        const index = newLogs.findIndex(l => l.date === selectedDateStr);
        
        if (index >= 0) {
            newLogs[index] = { ...newLogs[index], ...updates };
        } else {
            newLogs.push({ date: selectedDateStr, symptoms: [], ...updates });
        }
        onUpdateUserData({ ...userData, womenHealth: { ...healthData, cycleLogs: newLogs } });
    };

    const toggleSymptom = (symptomId: string) => {
        const current = selectedLog?.symptoms || [];
        const newSymptoms = current.includes(symptomId) 
            ? current.filter(s => s !== symptomId) 
            : [...current, symptomId];
        updateLog({ symptoms: newSymptoms });
    };

    const handlePeriodStartToggle = () => {
        const starts = healthData.periodStarts.includes(selectedDateStr)
            ? healthData.periodStarts.filter(d => d !== selectedDateStr)
            : [...healthData.periodStarts, selectedDateStr];
        onUpdateUserData({ ...userData, womenHealth: { ...healthData, periodStarts: starts } });
    };

    const generatePartnerTip = async () => {
        setIsGeneratingTip(true);
        try {
            const prompt = `Advice for partner. User is in ${currentPhase} phase (Day ${selectedCycleDay}). Symptoms: ${selectedLog?.symptoms.join(',') || 'None'}. Mood: ${selectedLog?.mood || 'Neutral'}. Provide a short, caring tip in Persian (max 20 words).`;
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setPartnerTip(res.text.trim());
        } catch {
            setPartnerTip("امروز فقط کنارش باش و بهش محبت کن ❤️");
        } finally {
            setIsGeneratingTip(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 overflow-y-auto flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center p-4 z-20 relative">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-500/20 rounded-full">
                        <HealthIcon className="w-6 h-6 text-pink-400"/>
                    </div>
                    <span className="font-bold text-lg text-white">سلامت زنان</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode(viewMode === 'wheel' ? 'calendar' : 'wheel')} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        {viewMode === 'wheel' ? <CalendarIcon className="w-5 h-5"/> : <span className="text-xs font-bold">O</span>}
                    </button>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        &times;
                    </button>
                </div>
            </div>

            {viewMode === 'wheel' ? (
                <div className="flex-grow flex flex-col items-center relative pb-24">
                    {/* Cycle Wheel */}
                    <div className="mt-4 mb-8 scale-90 sm:scale-100 transition-transform">
                        <CycleWheel 
                            currentDay={currentCycleDay} 
                            cycleLength={healthData.avgCycleLength} 
                            selectedDay={selectedCycleDay}
                            onSelectDay={setSelectedCycleDay}
                            phase={currentPhase}
                        />
                    </div>

                    {/* Phase Info Card */}
                    <div className="w-full max-w-md px-6 z-10 -mt-6">
                        <div className="glass-card bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-slate-400 text-xs mb-1">{new Date(selectedDateStr).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    <h3 className="text-xl font-bold text-white">{phaseInfo.label}</h3>
                                </div>
                                <button 
                                    onClick={handlePeriodStartToggle}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${healthData.periodStarts.includes(selectedDateStr) ? 'bg-pink-500 border-pink-500 text-white' : 'border-pink-500/50 text-pink-400 hover:bg-pink-500/10'}`}
                                >
                                    {healthData.periodStarts.includes(selectedDateStr) ? 'شروع پریود' : 'ثبت شروع'}
                                </button>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-slate-600 pl-3 mb-4">
                                {phaseInfo.advice}
                            </p>

                            {/* Quick Log Actions */}
                            <div className="space-y-4">
                                {/* Moods */}
                                <div>
                                    <p className="text-xs text-slate-500 font-bold mb-2">حس و حال امروز</p>
                                    <div className="flex justify-between bg-slate-900/50 p-2 rounded-2xl">
                                        {MOODS.map(m => (
                                            <button 
                                                key={m.id}
                                                onClick={() => updateLog({ mood: selectedLog?.mood === m.id ? undefined : m.id as any })}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedLog?.mood === m.id ? 'bg-slate-700 scale-110 shadow-lg ring-1 ring-white/20' : 'opacity-50 hover:opacity-100'}`}
                                            >
                                                {m.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Flow (Only show if period or spotting) */}
                                {(currentPhase === 'Menstrual' || selectedLog?.flow) && (
                                    <div className="animate-fadeIn">
                                        <p className="text-xs text-slate-500 font-bold mb-2">شدت خونریزی</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {FLOWS.map(f => (
                                                <button 
                                                    key={f.id}
                                                    onClick={() => updateLog({ flow: selectedLog?.flow === f.id ? undefined : f.id as any })}
                                                    className={`py-2 rounded-xl text-xs font-bold transition-all ${selectedLog?.flow === f.id ? `${f.color} text-white shadow-lg scale-105` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Symptoms */}
                                <div>
                                    <p className="text-xs text-slate-500 font-bold mb-2">علائم فیزیکی</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SYMPTOMS_LIST.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => toggleSymptom(s.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${selectedLog?.symptoms.includes(s.id) ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}
                                            >
                                                <span>{s.icon}</span> {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Partner Tip */}
                                <div className="pt-4 border-t border-slate-700/50">
                                     {partnerTip ? (
                                         <div className="bg-gradient-to-r from-pink-500/10 to-violet-500/10 p-3 rounded-xl border border-pink-500/20 text-sm text-slate-200 text-center italic">
                                             "{partnerTip}"
                                         </div>
                                     ) : (
                                         <button onClick={generatePartnerTip} disabled={isGeneratingTip} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors">
                                             <SparklesIcon className={`w-4 h-4 ${isGeneratingTip ? 'animate-spin' : ''}`}/>
                                             دریافت پیام هوشمند برای پارتنر
                                         </button>
                                     )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Calendar Placeholder (Simpler view if user prefers)
                <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500">
                    <CalendarIcon className="w-16 h-16 mb-4 opacity-20"/>
                    <p>نمای تقویم به زودی کامل می‌شود.</p>
                    <button onClick={() => setViewMode('wheel')} className="mt-4 text-pink-400 hover:text-pink-300 font-bold">بازگشت به چرخه</button>
                </div>
            )}
        </div>
    );
};

export default WomenHealthView;

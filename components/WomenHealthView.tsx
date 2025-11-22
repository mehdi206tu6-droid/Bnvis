
import React, { useState, useEffect } from 'react';
import { OnboardingData, WomenHealthData, CycleLog } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    HealthIcon, ShareIcon, SparklesIcon, FaceSmileIcon, FaceFrownIcon, BoltIcon,
    FaceMehIcon, ChevronLeftIcon, ChevronRightIcon, WaterDropIcon,
    PencilIcon, TrashIcon, CalendarIcon, XMarkIcon
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
    { id: 'happy', label: 'شاد', icon: <FaceSmileIcon className="w-6 h-6"/>, color: 'text-green-400', bg: 'bg-green-900/30 border-green-500/50' },
    { id: 'energetic', label: 'پرانرژی', icon: <BoltIcon className="w-6 h-6"/>, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-500/50' },
    { id: 'sensitive', label: 'حساس', icon: <span className="text-xl">🥺</span>, color: 'text-pink-300', bg: 'bg-pink-900/30 border-pink-500/50' },
    { id: 'tired', label: 'خسته', icon: <FaceMehIcon className="w-6 h-6"/>, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-600' },
    { id: 'anxious', label: 'مضطرب', icon: <span className="text-xl">😰</span>, color: 'text-violet-400', bg: 'bg-violet-900/30 border-violet-500/50' },
    { id: 'irritable', label: 'عصبی', icon: <span className="text-xl">😡</span>, color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/50' }
];

const FLOWS = [
    { id: 'spotting', label: 'لکه‌بینی', color: 'bg-pink-300' },
    { id: 'light', label: 'سبک', color: 'bg-pink-400' },
    { id: 'medium', label: 'متوسط', color: 'bg-pink-500' },
    { id: 'heavy', label: 'سنگین', color: 'bg-pink-700' },
];

const PHASE_INFO = {
    'Menstrual': { label: 'قاعدگی', description: 'زمان استراحت و بازیابی انرژی.', color: '#f43f5e', bg: 'bg-rose-500', advice: 'گرم بمانید و آهن مصرف کنید. استراحت کافی داشته باشید.' },
    'Follicular': { label: 'فولیکولار', description: 'انرژی در حال افزایش است.', color: '#3b82f6', bg: 'bg-blue-500', advice: 'زمان خوبی برای یادگیری، برنامه‌ریزی و خلاقیت است.' },
    'Ovulation': { label: 'تخمک‌گذاری', description: 'اوج انرژی و اعتماد به نفس.', color: '#10b981', bg: 'bg-emerald-500', advice: 'عالی برای جلسات مهم، ورزش سنگین و فعالیت‌های اجتماعی.' },
    'Luteal': { label: 'لوتئال', description: 'انرژی کاهش می‌یابد.', color: '#8b5cf6', bg: 'bg-violet-500', advice: 'کارهای سبک‌تر انجام دهید و مراقب نوسانات خلقی باشید.' },
    'Unknown': { label: 'نامشخص', description: 'اطلاعات کافی نیست.', color: '#64748b', bg: 'bg-slate-500', advice: 'چرخه خود را ثبت کنید تا پیش‌بینی دقیق‌تری داشته باشید.' }
};

// Helper to calculate phase for ANY date
const calculatePhaseForDate = (targetDateStr: string, periodStarts: string[], cycleLength: number) => {
    const targetDate = new Date(targetDateStr);
    // Sort starts descending
    const sortedStarts = [...periodStarts].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Find the most relevant start date (last one before or on targetDate)
    // Or if targetDate is in future, project from the absolute last start date
    const lastKnownStartStr = sortedStarts[0];
    if (!lastKnownStartStr) return { phase: 'Unknown', dayInCycle: 0 };

    const lastKnownStart = new Date(lastKnownStartStr);
    
    // Difference in days
    const diffTime = targetDate.getTime() - lastKnownStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
        // Target date is before the first recorded period. 
        // We could try to find an earlier start date if available, but simple logic:
        const olderStart = sortedStarts.find(d => new Date(d) <= targetDate);
        if(olderStart) {
             const diff = Math.floor((targetDate.getTime() - new Date(olderStart).getTime()) / (1000 * 3600 * 24));
             return getPhaseFromDay(diff + 1, cycleLength);
        }
        return { phase: 'Unknown', dayInCycle: 0 };
    }

    // Current cycle day (1-based)
    // If diffDays > cycleLength, we project into future cycles
    const dayInCycle = (diffDays % cycleLength) + 1;
    return getPhaseFromDay(dayInCycle, cycleLength);
};

const getPhaseFromDay = (day: number, cycleLength: number) => {
    if (day <= 5) return { phase: 'Menstrual', dayInCycle: day };
    if (day <= 11) return { phase: 'Follicular', dayInCycle: day };
    if (day <= 16) return { phase: 'Ovulation', dayInCycle: day };
    return { phase: 'Luteal', dayInCycle: day };
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
    const radius = 110;
    const strokeWidth = 18;
    const size = (radius + strokeWidth) * 2;
    const center = size / 2;
    
    const phases = [
        { id: 'Menstrual', start: 1, end: 5, color: '#f43f5e' }, 
        { id: 'Follicular', start: 6, end: 11, color: '#3b82f6' }, 
        { id: 'Ovulation', start: 12, end: 16, color: '#10b981' }, 
        { id: 'Luteal', start: 17, end: cycleLength, color: '#8b5cf6' }
    ];

    const days = Array.from({ length: cycleLength }, (_, i) => i + 1);
    const anglePerDay = 360 / cycleLength;
    const activePhaseColor = PHASE_INFO[phase as keyof typeof PHASE_INFO]?.color || '#64748b';

    return (
        <div className="relative flex justify-center items-center drop-shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 rounded-full opacity-10 blur-[80px] transition-colors duration-1000" style={{ backgroundColor: activePhaseColor }}></div>

            <svg width={size} height={size} className="transform -rotate-90 z-10 overflow-visible">
                <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
                {days.map(day => {
                    const startAngle = (day - 1) * anglePerDay;
                    const endAngle = day * anglePerDay;
                    const gap = 1.5;
                    let color = '#334155'; 
                    const p = phases.find(ph => day >= ph.start && day <= ph.end);
                    if (p) color = p.color;
                    
                    const isSelected = day === selectedDay;
                    const isToday = day === currentDay;
                    
                    return (
                        <g key={day} onClick={() => onSelectDay(day)} className="cursor-pointer transition-all duration-300 group">
                            <path
                                d={describeArc(center, center, radius, startAngle + gap, endAngle - gap)}
                                fill="none"
                                stroke={color}
                                strokeWidth={isSelected ? strokeWidth + 8 : strokeWidth}
                                strokeLinecap="round"
                                style={{ opacity: isSelected ? 1 : 0.4, transition: 'all 0.3s ease' }}
                                className="hover:opacity-80"
                            />
                            {(isToday || isSelected || day === 1 || day % 5 === 0) && (
                                <text
                                    x={polarToCartesian(center, center, radius - 25, (startAngle + endAngle)/2).x}
                                    y={polarToCartesian(center, center, radius - 25, (startAngle + endAngle)/2).y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={isToday ? '#fff' : '#64748b'}
                                    fontSize={isToday ? "12" : "9"}
                                    fontWeight="bold"
                                    transform={`rotate(90, ${polarToCartesian(center, center, radius - 25, (startAngle + endAngle)/2).x}, ${polarToCartesian(center, center, radius - 25, (startAngle + endAngle)/2).y})`}
                                    className="pointer-events-none select-none"
                                >
                                    {day}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1 opacity-60">روز</p>
                <h2 className="text-5xl font-black text-white drop-shadow-lg leading-none" style={{ textShadow: `0 0 30px ${activePhaseColor}60` }}>
                    {selectedDay}
                </h2>
            </div>
        </div>
    );
};

const CycleCalendar: React.FC<{
    periodStarts: string[];
    cycleLength: number;
    onDateSelect: (dateStr: string) => void;
    selectedDate: string;
}> = ({ periodStarts, cycleLength, onDateSelect, selectedDate }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        // Adjust for Saturday start (Persian week)
        // JS getDay(): 0=Sun, 6=Sat. 
        // We want 0=Sat, 6=Fri.
        // If 6 (Sat) -> 0. If 0 (Sun) -> 1.
        const startOffset = (firstDay + 1) % 7;
        return { days, startOffset };
    };

    const { days, startOffset } = getDaysInMonth(viewDate);
    
    const monthName = viewDate.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><ChevronRightIcon className="w-4 h-4"/></button>
                <h3 className="font-bold text-white text-lg">{monthName}</h3>
                <button onClick={handleNextMonth} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><ChevronLeftIcon className="w-4 h-4"/></button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-500">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const dateStr = date.toISOString().split('T')[0]; // Use local time correctness in real app
                    // Correction for simple ISO string which is UTC. 
                    // For visualization logic, we construct string manually to avoid timezone shift issues
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const safeDateStr = `${y}-${m}-${d}`;

                    const { phase } = calculatePhaseForDate(safeDateStr, periodStarts, cycleLength);
                    const phaseColor = PHASE_INFO[phase as keyof typeof PHASE_INFO]?.color;
                    const isSelected = safeDateStr === selectedDate;
                    const isToday = safeDateStr === new Date().toISOString().split('T')[0];

                    return (
                        <button 
                            key={day}
                            onClick={() => onDateSelect(safeDateStr)}
                            className={`
                                h-10 rounded-xl flex items-center justify-center relative font-bold text-sm transition-all
                                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:bg-white/5'}
                                ${isToday ? 'bg-slate-700' : ''}
                            `}
                        >
                            <span className="relative z-10 text-white">{day.toLocaleString('fa-IR')}</span>
                            <div className="absolute inset-1 rounded-lg opacity-40" style={{ backgroundColor: phaseColor }}></div>
                            {/* Period Start Dot */}
                            {periodStarts.includes(safeDateStr) && (
                                <div className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                            )}
                        </button>
                    );
                })}
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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // State for selected date in calendar/wheel
    const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
    const [partnerTip, setPartnerTip] = useState<string | null>(null);
    const [isGeneratingTip, setIsGeneratingTip] = useState(false);
    const [viewMode, setViewMode] = useState<'wheel' | 'calendar'>('wheel');

    // Derived Data for Selected Date
    const { phase, dayInCycle } = calculatePhaseForDate(selectedDateStr, healthData.periodStarts, healthData.avgCycleLength);
    const selectedLog = healthData.cycleLogs.find(l => l.date === selectedDateStr);
    const phaseInfo = PHASE_INFO[phase as keyof typeof PHASE_INFO];

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
        const newSymptoms = current.includes(symptomId) ? current.filter(s => s !== symptomId) : [...current, symptomId];
        updateLog({ symptoms: newSymptoms });
    };

    const handlePeriodStartToggle = () => {
        const starts = healthData.periodStarts.includes(selectedDateStr)
            ? healthData.periodStarts.filter(d => d !== selectedDateStr)
            : [...healthData.periodStarts, selectedDateStr];
        onUpdateUserData({ ...userData, womenHealth: { ...healthData, periodStarts: starts } });
    };

    const handleWheelDaySelect = (day: number) => {
        // Find the start of the cycle that covers selectedDateStr
        // This is tricky because wheel is relative to cycle day.
        // For simplicity in wheel mode, we assume we are viewing the CURRENT cycle relative to today.
        // But to make it consistent, let's just keep it visual or use today's cycle start.
        const sortedStarts = [...healthData.periodStarts].sort().reverse();
        const currentCycleStart = sortedStarts.find(d => new Date(d) <= today) || todayStr;
        const targetDate = new Date(currentCycleStart);
        targetDate.setDate(targetDate.getDate() + (day - 1));
        setSelectedDateStr(targetDate.toISOString().split('T')[0]);
    };

    const generatePartnerTip = async () => {
        setIsGeneratingTip(true);
        try {
            const prompt = `Advice for partner. User is in ${phase} phase (Day ${dayInCycle}). Symptoms: ${selectedLog?.symptoms.join(',') || 'None'}. Mood: ${selectedLog?.mood || 'Neutral'}. Provide a short, caring tip in Persian (max 20 words).`;
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setPartnerTip(res.text.trim());
        } catch {
            setPartnerTip("امروز فقط کنارش باش و بهش محبت کن ❤️");
        } finally {
            setIsGeneratingTip(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center p-4 z-20 bg-[#0f172a]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                        <HealthIcon className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-white">چرخه سلامتی</h2>
                        <p className="text-xs text-slate-400 font-medium">ردیاب هوشمند قاعدگی</p>
                    </div>
                </div>
                <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setViewMode('wheel')} className={`p-2 rounded-lg transition-all ${viewMode === 'wheel' ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}>
                        <SparklesIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}>
                        <CalendarIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-red-400 ml-1">
                        <XMarkIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Main Content Scrollable */}
            <div className="flex-grow overflow-y-auto pb-24">
                {viewMode === 'wheel' ? (
                    <div className="flex flex-col items-center pt-4">
                        <CycleWheel 
                            currentDay={calculatePhaseForDate(todayStr, healthData.periodStarts, healthData.avgCycleLength).dayInCycle} 
                            cycleLength={healthData.avgCycleLength} 
                            selectedDay={dayInCycle}
                            onSelectDay={handleWheelDaySelect}
                            phase={phase}
                        />
                        <p className="text-slate-500 text-xs mt-6 mb-2">برای تغییر روز، روی دایره ضربه بزنید</p>
                    </div>
                ) : (
                    <CycleCalendar 
                        periodStarts={healthData.periodStarts} 
                        cycleLength={healthData.avgCycleLength}
                        selectedDate={selectedDateStr}
                        onDateSelect={setSelectedDateStr}
                    />
                )}

                {/* Status Card */}
                <div className="px-4 mt-4">
                    <div className="bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-3 h-3 rounded-full ${phaseInfo.bg} shadow-[0_0_10px_currentColor]`}></span>
                                    <h3 className="text-xl font-black text-white">{phaseInfo.label}</h3>
                                </div>
                                <p className="text-sm text-slate-400">{new Date(selectedDateStr).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                            <button 
                                onClick={handlePeriodStartToggle}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg ${healthData.periodStarts.includes(selectedDateStr) ? 'bg-rose-500 text-white shadow-rose-900/40' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                {healthData.periodStarts.includes(selectedDateStr) ? 'شروع قاعدگی ✓' : 'ثبت قاعدگی'}
                            </button>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl p-4 border-l-4 border-slate-600 mb-6">
                            <p className="text-sm text-slate-300 leading-relaxed italic">"{phaseInfo.advice}"</p>
                        </div>

                        {/* Interactive Loggers */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-3 block">حس و حال</label>
                                <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {MOODS.map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => updateLog({ mood: selectedLog?.mood === m.id ? undefined : m.id as any })}
                                            className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl transition-all border ${selectedLog?.mood === m.id ? `${m.bg} scale-110 shadow-lg` : 'bg-slate-800 border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <span className="text-xl mb-1">{m.icon}</span>
                                            <span className="text-[9px] font-bold text-slate-300">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(phase === 'Menstrual' || selectedLog?.flow) && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-3 block">جریان خونریزی</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {FLOWS.map(f => (
                                            <button 
                                                key={f.id}
                                                onClick={() => updateLog({ flow: selectedLog?.flow === f.id ? undefined : f.id as any })}
                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${selectedLog?.flow === f.id ? `${f.color} text-white shadow-lg` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-3 block">علائم فیزیکی</label>
                                <div className="flex flex-wrap gap-2">
                                    {SYMPTOMS_LIST.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleSymptom(s.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${selectedLog?.symptoms.includes(s.id) ? 'bg-slate-200 text-slate-900 border-white shadow-md' : 'bg-slate-800 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                                        >
                                            <span>{s.icon}</span> {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Partner Tip Section */}
                        <div className="mt-8 pt-6 border-t border-slate-700/50">
                             {partnerTip ? (
                                 <div className="bg-gradient-to-r from-pink-500/10 to-violet-500/10 p-4 rounded-2xl border border-pink-500/20 text-center">
                                     <p className="text-xs text-pink-400 font-bold uppercase tracking-widest mb-2">پیام برای پارتنر</p>
                                     <p className="text-sm text-slate-200 italic leading-relaxed">"{partnerTip}"</p>
                                 </div>
                             ) : (
                                 <button onClick={generatePartnerTip} disabled={isGeneratingTip} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-pink-400 transition-colors">
                                     <SparklesIcon className={`w-4 h-4 ${isGeneratingTip ? 'animate-spin' : ''}`}/>
                                     دریافت راهنمایی هوشمند برای پارتنر
                                 </button>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WomenHealthView;

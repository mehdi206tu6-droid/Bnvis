
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OnboardingData, TimeBlock } from '../types';
import { 
    QueueListIcon, PlusIcon, TrashIcon, BoltIcon, 
    SparklesIcon, ArrowPathIcon, UserIcon, ClockIcon,
    XMarkIcon, CalendarIcon
} from './icons';

interface TimeBlockingViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const HOURS_START = 6; // 6 AM
const HOURS_END = 24; // Midnight
const HOURS = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => i + HOURS_START);
const PIXELS_PER_MINUTE = 2.5; // Taller blocks for better visibility/design
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

const BLOCK_TYPES = [
    { id: 'focus', label: 'تمرکز عمیق', icon: BoltIcon, color: 'from-violet-600 to-indigo-700', border: 'border-violet-400', shadow: 'shadow-violet-900/50' },
    { id: 'break', label: 'استراحت', icon: SparklesIcon, color: 'from-emerald-500 to-teal-600', border: 'border-emerald-400', shadow: 'shadow-emerald-900/50' },
    { id: 'routine', label: 'روتین', icon: ArrowPathIcon, color: 'from-blue-500 to-cyan-600', border: 'border-blue-400', shadow: 'shadow-blue-900/50' },
    { id: 'meeting', label: 'جلسه', icon: UserIcon, color: 'from-amber-500 to-orange-600', border: 'border-amber-400', shadow: 'shadow-amber-900/50' },
] as const;

const TimeBlockingView: React.FC<TimeBlockingViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const timeBlocks = userData.timeBlocks || [];
    const [newBlockTitle, setNewBlockTitle] = useState('');
    const [selectedStart, setSelectedStart] = useState('09:00');
    const [selectedEnd, setSelectedEnd] = useState('10:00');
    const [selectedType, setSelectedType] = useState<TimeBlock['type']>('focus');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentTimePercent, setCurrentTimePercent] = useState<number | null>(null);

    // Scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current) {
            const now = new Date();
            const minutes = (now.getHours() - HOURS_START) * 60 + now.getMinutes();
            const scrollPos = Math.max(0, minutes * PIXELS_PER_MINUTE - 200); // Center a bit
            scrollRef.current.scrollTop = scrollPos;
        }
    }, []);

    // Update current time line
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const currentH = now.getHours();
            const currentM = now.getMinutes();
            
            if (currentH >= HOURS_START && currentH < HOURS_END) {
                const totalMinutes = (HOURS_END - HOURS_START) * 60;
                const passedMinutes = (currentH - HOURS_START) * 60 + currentM;
                setCurrentTimePercent((passedMinutes / totalMinutes) * 100);
            } else {
                setCurrentTimePercent(null);
            }
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const summary = { focus: 0, break: 0, routine: 0, meeting: 0 };
        timeBlocks.forEach(block => {
            const start = block.startTime.split(':').map(Number);
            const end = block.endTime.split(':').map(Number);
            const duration = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
            if (block.type in summary) {
                summary[block.type as keyof typeof summary] += duration;
            }
        });
        return summary;
    }, [timeBlocks]);

    const handleAddBlock = () => {
        if (!newBlockTitle.trim()) return;
        const newBlock: TimeBlock = {
            id: `block-${Date.now()}`,
            title: newBlockTitle,
            startTime: selectedStart,
            endTime: selectedEnd,
            type: selectedType,
        };
        onUpdateUserData({ ...userData, timeBlocks: [...timeBlocks, newBlock] });
        setNewBlockTitle('');
    };

    const handleDeleteBlock = (id: string) => {
        if(confirm("آیا از حذف این بلوک زمانی مطمئن هستید؟")) {
            onUpdateUserData({ ...userData, timeBlocks: timeBlocks.filter(b => b.id !== id) });
        }
    };

    const getBlockStyle = (block: TimeBlock) => {
        const startHour = parseInt(block.startTime.split(':')[0]);
        const startMin = parseInt(block.startTime.split(':')[1]);
        const endHour = parseInt(block.endTime.split(':')[0]);
        const endMin = parseInt(block.endTime.split(':')[1]);
        
        const startMinutesTotal = (startHour - HOURS_START) * 60 + startMin;
        const durationMinutes = ((endHour * 60 + endMin) - (startHour * 60 + startMin));
        
        return {
            top: `${startMinutesTotal * PIXELS_PER_MINUTE}px`,
            height: `${Math.max(20, durationMinutes * PIXELS_PER_MINUTE)}px`, // Minimum height for visibility
        };
    };

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}س ${m > 0 ? `${m}د` : ''}`;
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 modal-backdrop overflow-hidden" onClick={onClose}>
            {/* Animated Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-violet-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="bg-slate-900/80 border border-white/10 rounded-[2rem] w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden modal-panel" onClick={e => e.stopPropagation()}>
                
                {/* Header & Stats */}
                <div className="p-6 pb-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-cyan-500/20">
                                    <ClockIcon className="w-6 h-6 text-white"/>
                                </div>
                                زمان‌بندی روزانه
                            </h2>
                            <p className="text-slate-400 text-xs mt-1 font-medium pr-1">برنامه‌ریزی برای بهره‌وری حداکثری</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all">
                            <XMarkIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        <div className="flex-shrink-0 bg-slate-800/50 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                                <BoltIcon className="w-4 h-4"/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">تمرکز</p>
                                <p className="text-sm font-bold text-white">{formatDuration(stats.focus)}</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 bg-slate-800/50 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <SparklesIcon className="w-4 h-4"/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">استراحت</p>
                                <p className="text-sm font-bold text-white">{formatDuration(stats.break)}</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 bg-slate-800/50 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                                <UserIcon className="w-4 h-4"/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">جلسات</p>
                                <p className="text-sm font-bold text-white">{formatDuration(stats.meeting)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Block Form */}
                <div className="p-4 bg-slate-800/30 border-b border-white/5">
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="عنوان فعالیت..." 
                                value={newBlockTitle} 
                                onChange={(e) => setNewBlockTitle(e.target.value)}
                                className="flex-grow bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            />
                            <button onClick={handleAddBlock} className="bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-white/10 flex items-center gap-2 whitespace-nowrap">
                                <PlusIcon className="w-4 h-4" />
                                افزودن
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                            <div className="flex bg-slate-900/80 rounded-xl p-1 border border-slate-700 shrink-0">
                                <input type="time" value={selectedStart} onChange={(e) => setSelectedStart(e.target.value)} className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none font-mono w-20 text-center"/>
                                <span className="text-slate-500 text-xs self-center">تا</span>
                                <input type="time" value={selectedEnd} onChange={(e) => setSelectedEnd(e.target.value)} className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none font-mono w-20 text-center"/>
                            </div>
                            
                            <div className="flex gap-2 shrink-0">
                                {BLOCK_TYPES.map(type => {
                                    const Icon = type.icon;
                                    const isSelected = selectedType === type.id;
                                    return (
                                        <button 
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id as any)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSelected ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg` : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                        >
                                            <Icon className="w-3.5 h-3.5"/>
                                            {type.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-grow overflow-y-auto relative bg-[#0B0F17] scrollbar-hide" ref={scrollRef}>
                    <div className="relative min-h-full" style={{ height: `${(HOURS_END - HOURS_START) * HOUR_HEIGHT}px` }}>
                        
                        {/* Grid Lines & Hours */}
                        {HOURS.map((h, i) => (
                            <div 
                                key={h} 
                                className="absolute w-full border-t border-white/[0.03] flex group hover:bg-white/[0.02] transition-colors"
                                style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                            >
                                <div className="w-16 flex-shrink-0 border-r border-white/[0.05] text-[10px] font-mono text-slate-500 pt-2 pr-3 text-right relative">
                                    {h}:00
                                    <div className="absolute right-0 top-0 w-1.5 h-[1px] bg-slate-700"></div>
                                </div>
                                <div className="flex-grow relative">
                                    {/* Half-hour line */}
                                    <div className="absolute top-1/2 w-full border-t border-white/[0.02] border-dashed"></div>
                                </div>
                            </div>
                        ))}

                        {/* Current Time Indicator */}
                        {currentTimePercent !== null && (
                            <div 
                                className="absolute left-16 right-0 border-t-2 border-red-500 z-20 shadow-[0_0_10px_rgba(239,68,68,0.6)] pointer-events-none flex items-center"
                                style={{ top: `${currentTimePercent}%` }}
                            >
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-[5px] shadow-sm"></div>
                            </div>
                        )}

                        {/* Time Blocks */}
                        <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none">
                            {timeBlocks.map(block => {
                                const style = getBlockStyle(block);
                                const typeConfig = BLOCK_TYPES.find(t => t.id === block.type) || BLOCK_TYPES[0];
                                const Icon = typeConfig.icon;

                                return (
                                    <div 
                                        key={block.id}
                                        className={`absolute left-2 right-2 sm:right-4 rounded-xl p-3 border flex flex-col justify-center pointer-events-auto group transition-all hover:scale-[1.01] hover:z-30 bg-gradient-to-br ${typeConfig.color} ${typeConfig.border} ${typeConfig.shadow}`}
                                        style={style}
                                    >
                                        <div className="flex justify-between items-start h-full overflow-hidden">
                                            <div className="flex flex-col justify-center h-full">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Icon className="w-3.5 h-3.5 text-white/90"/>
                                                    <span className="text-xs font-bold text-white shadow-sm">{block.title}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-white/70">{block.startTime} - {block.endTime}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                                                className="p-1.5 bg-black/20 hover:bg-red-500/80 text-white/70 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeBlockingView;

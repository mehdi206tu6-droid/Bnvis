
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { OnboardingData, CalendarEvent } from '../types';
import { 
    ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, 
    ClockIcon, CalendarIcon, XMarkIcon, QueueListIcon, 
    Squares2X2Icon, MapPinIcon, BriefcaseIcon, UserIcon, 
    StarIcon, HeartIcon, FireIcon, SunIcon,
    BellIcon
} from './icons';

// --- Constants & Helpers ---

const CATEGORIES = [
    { id: 'work', label: 'کاری', color: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500', glow: 'shadow-blue-500/40' },
    { id: 'personal', label: 'شخصی', color: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500', glow: 'shadow-purple-500/40' },
    { id: 'important', label: 'مهم', color: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-500', glow: 'shadow-amber-500/40' },
    { id: 'health', label: 'سلامت', color: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500', glow: 'shadow-rose-500/40' },
    { id: 'learning', label: 'آموزش', color: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-500', glow: 'shadow-emerald-500/40' },
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Persian Date Helpers
const getJalaliDateParts = (date: Date) => {
    const f = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    const parts = f.formatToParts(date);
    const dayName = parts.find(p => p.type === 'weekday')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    
    // Numeric parts for logic
    const fNum = new Intl.DateTimeFormat('en-US-u-ca-persian', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const numParts = fNum.formatToParts(date);
    const mIndex = parseInt(numParts.find(p => p.type === 'month')?.value || '1') - 1;
    const yNum = parseInt(numParts.find(p => p.type === 'year')?.value || '1400');
    const dNum = parseInt(numParts.find(p => p.type === 'day')?.value || '1');

    return { dayName, day, month, year, mIndex, yNum, dNum };
};

const getMonthMatrix = (currentDate: Date) => {
    const { mIndex, yNum } = getJalaliDateParts(currentDate);
    
    // Determine days in month (Simplified Persian Calendar Logic)
    let daysInMonth = 31;
    if (mIndex > 5) daysInMonth = 30;
    if (mIndex === 11) {
        const isLeap = (yNum % 33 === 1 || yNum % 33 === 5 || yNum % 33 === 9 || yNum % 33 === 13 || yNum % 33 === 17 || yNum % 33 === 22 || yNum % 33 === 26 || yNum % 33 === 30);
        daysInMonth = isLeap ? 30 : 29;
    }

    // Find first day of the month
    const firstDay = new Date(currentDate);
    // Backtrack to day 1
    let safety = 0;
    while(safety < 35) {
        const p = getJalaliDateParts(firstDay);
        if (p.dNum === 1) break;
        firstDay.setDate(firstDay.getDate() - 1);
        safety++;
    }

    const startDayOfWeek = (firstDay.getDay() + 1) % 7; // 0=Sat, ... 6=Fri

    return { firstDay, daysInMonth, startDayOfWeek };
};

const toPersianDigits = (num: number | string) => {
    return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

type ViewMode = 'month' | 'week' | 'agenda';

interface CalendarViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

// Extract duration from text format: "Title (60m)"
const parseEventDuration = (text: string): number => {
    const match = text.match(/\((\d+)m\)/);
    return match ? parseInt(match[1]) : 60; // Default 60 mins
};

const cleanEventTitle = (text: string) => {
    return text.replace(/^\[.*?\]\s*/, '').replace(/\(\d+m\)/, '').trim();
};

const CalendarView: React.FC<CalendarViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Add Event State
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDuration, setNewEventDuration] = useState(60);
    const [newEventCategory, setNewEventCategory] = useState('personal');

    const events = userData.calendarEvents || [];

    // --- Derived State ---
    const { month: currentMonthName, year: currentYearName } = getJalaliDateParts(currentDate);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const selectedDayEvents = events.filter(e => e.date === selectedDateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    // --- Handlers ---
    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setDate(d.getDate() - 30); // Approx
        else d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setDate(d.getDate() + 30);
        else d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const handleAddEvent = () => {
        if (!newEventTitle.trim()) return;
        
        const durationSuffix = newEventTime ? ` (${newEventDuration}m)` : '';
        const newEvent: CalendarEvent = {
            id: `evt-${Date.now()}`,
            date: selectedDate.toISOString().split('T')[0],
            text: `[${newEventCategory}] ${newEventTitle.trim()}${durationSuffix}`,
            time: newEventTime || undefined,
        };
        onUpdateUserData({ ...userData, calendarEvents: [...events, newEvent] });
        
        // Reset & Close
        setNewEventTitle('');
        setNewEventTime('');
        setNewEventDuration(60);
        setIsAddModalOpen(false);
    };

    const handleDeleteEvent = (id: string) => {
        if (confirm('آیا از حذف این رویداد اطمینان دارید؟')) {
            onUpdateUserData({ ...userData, calendarEvents: events.filter(e => e.id !== id) });
        }
    };

    const parseCategory = (text: string) => {
        const match = text.match(/^\[(.*?)\]/);
        if (match && CATEGORIES.some(c => c.id === match[1])) return CATEGORIES.find(c => c.id === match[1])!;
        return CATEGORIES[1];
    };

    // --- Renderers ---

    const renderMonthView = () => {
        const { firstDay, daysInMonth, startDayOfWeek } = getMonthMatrix(currentDate);
        
        return (
            <div className="h-full flex flex-col animate-fadeIn">
                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4 px-4">
                    {WEEK_DAYS.map((d, i) => (
                        <div key={i} className={`text-center text-xs font-bold ${i === 6 ? 'text-rose-500' : 'text-slate-500'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-y-4 px-2 flex-grow overflow-y-auto content-start pb-32">
                    {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const date = new Date(firstDay);
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDateStr;
                        const dayEvents = events.filter(e => e.date === dateStr);
                        const isFriday = (i + startDayOfWeek + 1) % 7 === 0;

                        return (
                            <div key={i} onClick={() => setSelectedDate(date)} className="flex flex-col items-center cursor-pointer relative h-14 group">
                                <div className={`
                                    w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300 border-2
                                    ${isSelected ? 'bg-violet-600 border-violet-400 text-white shadow-lg shadow-violet-600/40 scale-110 z-10' : 
                                      isToday ? 'bg-slate-800 border-violet-500/50 text-violet-400' : 
                                      'border-transparent text-slate-300 group-hover:bg-white/5'}
                                    ${!isSelected && !isToday && isFriday ? 'text-rose-400' : ''}
                                `}>
                                    {toPersianDigits(i + 1)}
                                </div>
                                
                                {/* Event Dots */}
                                <div className="flex gap-1 mt-1.5 h-1.5">
                                    {dayEvents.slice(0, 3).map((ev, idx) => (
                                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${parseCategory(ev.text).color} ring-1 ring-black`}></div>
                                    ))}
                                    {dayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-slate-500 ring-1 ring-black"></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Day Details Sheet */}
                <div className="fixed bottom-20 left-4 right-4 z-20">
                    <div className="bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] transform transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-xs font-medium">{getJalaliDateParts(selectedDate).dayName}</span>
                                <h3 className="text-white font-black text-2xl">
                                    {toPersianDigits(getJalaliDateParts(selectedDate).day)} {getJalaliDateParts(selectedDate).month}
                                </h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(true)} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-colors">
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-40 pr-1">
                            {selectedDayEvents.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-slate-600 text-sm">رویدادی ثبت نشده است</p>
                                </div>
                            ) : (
                                selectedDayEvents.map(ev => {
                                    const cat = parseCategory(ev.text);
                                    return (
                                        <div key={ev.id} className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5 group relative overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cat.color}`}></div>
                                            <div className="flex-grow pl-2">
                                                <p className="text-slate-200 text-sm font-bold">{cleanEventTitle(ev.text)}</p>
                                                {ev.time && <p className="text-slate-500 text-xs font-mono mt-0.5 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {toPersianDigits(ev.time)}</p>}
                                            </div>
                                            <button onClick={() => handleDeleteEvent(ev.id)} className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        // Calculate week start (Saturday)
        const d = new Date(currentDate);
        const dayOfWeek = (d.getDay() + 1) % 7; 
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek);
        
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            return day;
        });

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const now = new Date();
        const currentHourMinutes = now.getHours() * 60 + now.getMinutes();

        return (
            <div className="flex flex-col h-full animate-fadeIn overflow-hidden">
                {/* Week Header Strip */}
                <div className="flex justify-between items-center px-2 py-3 bg-[#020617] border-b border-white/5 z-20 shadow-md">
                    {weekDays.map((date, i) => {
                        const isSelected = date.toISOString().split('T')[0] === selectedDateStr;
                        const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                        const parts = getJalaliDateParts(date);
                        return (
                            <button 
                                key={i} 
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center justify-center w-full mx-0.5 py-2 rounded-2xl transition-all ${isSelected ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : isToday ? 'bg-slate-800 text-violet-400 border border-violet-500/30' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                <span className="text-[10px] font-medium mb-0.5 opacity-80">{parts.dayName[0]}</span>
                                <span className="text-lg font-bold font-mono">{toPersianDigits(parts.day)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Time Grid */}
                <div className="flex-grow overflow-y-auto relative bg-[#050505] p-2 no-scrollbar" ref={(el) => {
                    // Auto scroll to current time on mount
                    if (el && !el.dataset.scrolled) {
                        el.scrollTop = (currentHourMinutes * 1.5) - 100; 
                        el.dataset.scrolled = "true";
                    }
                }}>
                    {/* Current Time Line (Horizontal) */}
                    {selectedDateStr === new Date().toISOString().split('T')[0] && (
                        <div 
                            className="absolute left-14 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                            style={{ top: `${currentHourMinutes * 1.5 + 10}px` }}
                        >
                            <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        </div>
                    )}

                    {hours.map(h => (
                        <div key={h} className="flex items-start h-[90px] border-b border-white/5 relative group">
                            <div className="w-14 text-[10px] text-slate-500 -mt-2 text-center font-mono">{toPersianDigits(h)}:00</div>
                            <div className="flex-grow relative h-full border-r border-white/5 group-hover:bg-white/[0.01] transition-colors">
                                {/* Events for selected date at this hour */}
                                {selectedDayEvents.filter(ev => {
                                    if(!ev.time) return h === 0; // All day events at top (simplified)
                                    const eh = parseInt(ev.time.split(':')[0]);
                                    return eh === h;
                                }).map(ev => {
                                    const cat = parseCategory(ev.text);
                                    const mins = ev.time ? parseInt(ev.time.split(':')[1]) : 0;
                                    const duration = parseEventDuration(ev.text);
                                    
                                    const topOffset = (mins / 60) * 90;
                                    const height = (duration / 60) * 90;
                                    
                                    return (
                                        <div 
                                            key={ev.id}
                                            className={`absolute left-1 right-1 p-2 rounded-lg text-xs border-l-4 shadow-lg cursor-pointer hover:brightness-110 transition-all z-10 overflow-hidden flex flex-col justify-center ${cat.color.replace('bg-', 'bg-opacity-20 bg-')} ${cat.border} ${cat.text}`}
                                            style={{ top: `${topOffset}px`, height: `${Math.max(30, height)}px` }}
                                            onClick={() => handleDeleteEvent(ev.id)}
                                        >
                                            <p className="font-bold truncate">{cleanEventTitle(ev.text)}</p>
                                            {height > 40 && <p className="text-opacity-70 text-[10px] truncate">{toPersianDigits(ev.time || '')} - {duration} دقیقه</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <div className="h-24"></div> {/* Bottom padding for dock */}
                </div>
            </div>
        );
    };

    const renderAgendaView = () => {
        // Group events intelligently
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const grouped: Record<string, CalendarEvent[]> = {};
        
        events
            .filter(e => e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date))
            .forEach(e => {
                let label = e.date;
                if (e.date === todayStr) label = 'امروز';
                else if (e.date === tomorrowStr) label = 'فردا';
                
                if (!grouped[label]) grouped[label] = [];
                grouped[label].push(e);
            });

        return (
            <div className="h-full overflow-y-auto p-4 pb-32 animate-fadeIn space-y-8">
                {Object.keys(grouped).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <QueueListIcon className="w-10 h-10 opacity-30"/>
                        </div>
                        <p className="text-lg font-bold text-slate-400">برنامه‌ریزی خالی است</p>
                        <p className="text-sm mt-2">یک رویداد جدید اضافه کنید تا شروع کنیم.</p>
                        <button onClick={() => setIsAddModalOpen(true)} className="mt-6 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold shadow-lg shadow-violet-900/30 transition-all">
                            افزودن رویداد
                        </button>
                    </div>
                ) : (
                    Object.entries(grouped).map(([label, dayEvents]) => {
                        const isSpecial = label === 'امروز' || label === 'فردا';
                        const date = isSpecial ? (label === 'امروز' ? now : tomorrow) : new Date(label);
                        const parts = getJalaliDateParts(date);

                        return (
                            <div key={label} className="relative">
                                <div className="sticky top-0 z-10 bg-[#020617]/95 backdrop-blur-md py-2 mb-3 border-b border-white/5 flex items-baseline gap-2">
                                    <h4 className={`font-black text-2xl ${label === 'امروز' ? 'text-violet-400' : 'text-white'}`}>
                                        {label === 'امروز' || label === 'فردا' ? label : parts.dayName}
                                    </h4>
                                    <span className="text-slate-500 font-medium">
                                        {toPersianDigits(parts.day)} {parts.month}
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    {dayEvents.map(ev => {
                                        const cat = parseCategory(ev.text);
                                        const duration = parseEventDuration(ev.text);
                                        return (
                                            <div key={ev.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex gap-4 hover:bg-slate-800 transition-colors group">
                                                <div className="flex flex-col items-center justify-center min-w-[3.5rem] border-l border-slate-700/50 pl-4">
                                                    {ev.time ? (
                                                        <>
                                                            <span className="text-lg font-black text-slate-200 font-mono leading-none">{toPersianDigits(ev.time)}</span>
                                                            <span className="text-[10px] text-slate-500 mt-1 font-mono">{duration}m</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-700/50 px-2 py-1 rounded">روزانه</span>
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${cat.color} shadow-[0_0_8px_currentColor]`}></span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cat.text.replace('100', '400')}`}>{cat.label}</span>
                                                    </div>
                                                    <p className="text-white font-bold text-base leading-snug">{cleanEventTitle(ev.text)}</p>
                                                </div>
                                                <button onClick={() => handleDeleteEvent(ev.id)} className="self-center p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#020617] z-50 overflow-hidden font-[Vazirmatn] flex flex-col">
            {/* Top Bar */}
            <div className="px-6 pt-6 pb-2 flex justify-between items-center bg-[#020617]/90 backdrop-blur-sm z-20">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                        {currentMonthName} <span className="text-slate-600 font-light text-xl">{toPersianDigits(currentYearName)}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleToday} className="w-10 h-10 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex flex-col items-center justify-center border border-slate-700">
                        <span className="text-[8px] font-bold uppercase mb-0.5">امروز</span>
                        <span className="text-sm font-bold font-mono">{toPersianDigits(new Date().getDate())}</span>
                    </button>
                    <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                        <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><ChevronRightIcon className="w-4 h-4"/></button>
                        <div className="w-[1px] bg-white/10 my-1"></div>
                        <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><ChevronLeftIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative overflow-hidden">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'agenda' && renderAgendaView()}
            </div>

            {/* Floating Dock (Dynamic Island Style) */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-auto max-w-[90%]">
                <div className="flex items-center gap-1 bg-[#151518]/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/5">
                    
                    <button 
                        onClick={() => setViewMode('month')}
                        className={`relative w-14 h-12 rounded-[2rem] transition-all duration-300 flex items-center justify-center ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <CalendarIcon className={`w-6 h-6 ${viewMode === 'month' ? 'fill-current drop-shadow' : ''}`}/>
                    </button>

                    <button 
                        onClick={() => setViewMode('week')}
                        className={`relative w-14 h-12 rounded-[2rem] transition-all duration-300 flex items-center justify-center ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Squares2X2Icon className={`w-6 h-6 ${viewMode === 'week' ? 'fill-current drop-shadow' : ''}`}/>
                    </button>

                    {/* Main Action Button */}
                    <div className="px-1">
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(124,58,237,0.7)] transition-all duration-300 border-4 border-[#151518]"
                        >
                            <PlusIcon className="w-7 h-7"/>
                        </button>
                    </div>

                    <button 
                        onClick={() => setViewMode('agenda')}
                        className={`relative w-14 h-12 rounded-[2rem] transition-all duration-300 flex items-center justify-center ${viewMode === 'agenda' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <QueueListIcon className={`w-6 h-6 ${viewMode === 'agenda' ? 'fill-current drop-shadow' : ''}`}/>
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

                    <button 
                        onClick={onClose}
                        className="w-12 h-12 rounded-[2rem] text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center"
                    >
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            {/* Add Event Modal Sheet */}
            {isAddModalOpen && (
                <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center animate-fadeIn" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-[#18181b] w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl border-t sm:border border-white/10 animate-bounce-in relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Decorative Ambient Light */}
                        <div className="absolute top-[-50%] left-1/2 transform -translate-x-1/2 w-full h-full bg-gradient-to-b from-violet-600/20 to-transparent blur-[80px] pointer-events-none"></div>
                        
                        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 opacity-50"></div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-2xl font-black text-white tracking-tight">رویداد جدید</h3>
                            <div className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-white/5">
                                {getJalaliDateParts(selectedDate).dayName}، {toPersianDigits(getJalaliDateParts(selectedDate).day)} {getJalaliDateParts(selectedDate).month}
                            </div>
                        </div>
                        
                        <div className="space-y-5 relative z-10">
                            <div className="relative">
                                <input 
                                    autoFocus
                                    value={newEventTitle}
                                    onChange={e => setNewEventTitle(e.target.value)}
                                    className="w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 text-white text-lg font-bold outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-600"
                                    placeholder="عنوان رویداد..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-2xl p-3 flex items-center gap-3">
                                    <div className="p-2 bg-slate-700 rounded-xl text-slate-300">
                                        <ClockIcon className="w-5 h-5"/>
                                    </div>
                                    <div className="flex-grow">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">ساعت شروع</label>
                                        <input 
                                            type="time"
                                            value={newEventTime}
                                            onChange={e => setNewEventTime(e.target.value)}
                                            className="bg-transparent text-white text-base font-bold outline-none w-full font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-2xl p-3 flex items-center gap-3">
                                    <div className="p-2 bg-slate-700 rounded-xl text-slate-300">
                                        <ClockIcon className="w-5 h-5"/>
                                    </div>
                                    <div className="flex-grow">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">مدت (دقیقه)</label>
                                        <input 
                                            type="number"
                                            value={newEventDuration}
                                            onChange={e => setNewEventDuration(parseInt(e.target.value) || 0)}
                                            className="bg-transparent text-white text-base font-bold outline-none w-full font-mono"
                                            placeholder="60"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-3 block px-1 font-bold">دسته‌بندی و رنگ</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {CATEGORIES.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => setNewEventCategory(cat.id)}
                                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-2 min-w-[80px] ${newEventCategory === cat.id ? `${cat.color} ${cat.text} ${cat.glow} shadow-lg border-transparent scale-105` : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${newEventCategory === cat.id ? 'bg-white' : cat.color}`}></div>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleAddEvent} 
                            disabled={!newEventTitle.trim()} 
                            className="w-full mt-8 py-4 bg-white text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            ثبت در تقویم
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;

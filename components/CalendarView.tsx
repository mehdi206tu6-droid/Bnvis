import React, { useState, useMemo } from 'react';
import { OnboardingData, CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SparklesIcon, TrashIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface CalendarViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [noteInput, setNoteInput] = useState('');
    const [timeInput, setTimeInput] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const events = userData.calendarEvents || [];

    const { monthName, year, daysInMonth, firstDayOfMonth, month, yearNum } = useMemo(() => {
        const date = new Date(currentDate);
        const yearNum = date.getFullYear();
        const month = date.getMonth();
        const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(date);
        const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(date);
        
        const daysInMonth = new Date(yearNum, month + 1, 0).getDate();
        const firstDay = new Date(yearNum, month, 1).getDay();
        const firstDayOfMonth = (firstDay + 1) % 7; // Adjust for Saturday start

        return { monthName, year, daysInMonth, firstDayOfMonth, month, yearNum };
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach(event => {
            const dateKey = event.date;
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);

    const handleAddEvent = () => {
        if (!selectedDate || !noteInput.trim()) return;

        const newEvent: CalendarEvent = {
            id: new Date().toISOString(),
            date: selectedDate.toISOString().split('T')[0],
            text: noteInput.trim(),
            time: timeInput || undefined,
        };

        const updatedEvents = [...events, newEvent];
        onUpdateUserData({ ...userData, calendarEvents: updatedEvents });
        setNoteInput('');
        setTimeInput('');
    };
    
    const handleDeleteEvent = (id: string) => {
        const updatedEvents = events.filter(event => event.id !== id);
        onUpdateUserData({ ...userData, calendarEvents: updatedEvents });
    };

    const handleAnalyzeMonth = async () => {
        setIsAnalyzing(true);
        setAnalysis('');

        const eventsForMonth = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === yearNum && eventDate.getMonth() === month;
        });

        if (eventsForMonth.length === 0) {
            setAnalysis('رویدادی برای تحلیل در این ماه وجود ندارد.');
            setIsAnalyzing(false);
            return;
        }

        const formattedEvents = eventsForMonth
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(e => `${e.date} ${e.time || ''}: ${e.text}`).join('\n');
        
        const prompt = `You are a productivity assistant for the Benvis Life OS. Analyze the following calendar events for the user for the month of ${monthName} and provide a short, insightful summary in Persian. Highlight busy periods, recurring themes in their notes, and offer one actionable tip for better time management. Here are the events:\n\n${formattedEvents}`;

        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAnalysis(response.text);
        } catch (error) {
            console.error('Month analysis error:', error);
            setAnalysis('خطا در تحلیل ماه. لطفا دوباره تلاش کنید.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 rounded-[var(--radius-card)] p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">تقویم و برنامه‌ریزی</h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-y-auto pr-2 flex-grow min-h-0">
                    <div className="md:col-span-3">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setCurrentDate(new Date(yearNum, month - 1, 1))} className="p-2 rounded-full hover:bg-gray-700">
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                            <h3 className="font-bold text-lg">{monthName} {year}</h3>
                            <button onClick={() => setCurrentDate(new Date(yearNum, month + 1, 1))} className="p-2 rounded-full hover:bg-gray-700">
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                const day = dayIndex + 1;
                                const date = new Date(yearNum, month, day);
                                const dateString = date.toISOString().split('T')[0];
                                const isToday = dateString === new Date().toISOString().split('T')[0];
                                const isSelected = dateString === selectedDate?.toISOString().split('T')[0];
                                const hasEvent = eventsByDate.has(dateString);

                                let dayClass = `w-full aspect-square flex items-center justify-center rounded-[var(--radius-md)] transition-all text-sm relative cursor-pointer`;
                                if (isSelected) dayClass += ' bg-[var(--color-primary-600)] ring-2 ring-white';
                                else if (isToday) dayClass += ' bg-[var(--color-primary-800)] text-white font-bold';
                                else dayClass += ' bg-gray-800/50 hover:bg-gray-700';

                                return (
                                    <button key={day} onClick={() => setSelectedDate(date)} className={dayClass}>
                                        {day}
                                        {hasEvent && <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-green-400 rounded-full"></span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div className="p-4 bg-gray-800/50 rounded-[var(--radius-lg)]">
                             <h4 className="font-bold mb-3">{selectedDate ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(selectedDate) : 'روزی را انتخاب کنید'}</h4>
                             <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                                {selectedDate && (eventsByDate.get(selectedDate.toISOString().split('T')[0]) || []).map(event => (
                                    <div key={event.id} className="text-sm bg-gray-700/50 p-2 rounded-md flex justify-between items-center">
                                        <div>
                                            {event.time && <span className="font-mono text-xs bg-gray-600 px-1.5 py-0.5 rounded mr-2">{event.time}</span>}
                                            <span>{event.text}</span>
                                        </div>
                                        <button onClick={() => handleDeleteEvent(event.id)} className="text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {selectedDate && !eventsByDate.has(selectedDate.toISOString().split('T')[0]) && <p className="text-sm text-gray-500">یادداشتی برای این روز نیست.</p>}
                             </div>
                        </div>
                         <div className="p-4 bg-gray-800/50 rounded-[var(--radius-lg)] space-y-3">
                            <h4 className="font-bold">یادداشت/یادآور جدید</h4>
                            <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="یادداشت خود را بنویسید..." rows={3} className="w-full bg-gray-700 rounded-md p-2 focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none" />
                            <div className="flex gap-2">
                                <input type="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} className="bg-gray-700 rounded-md p-2 w-28 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"/>
                                <button onClick={handleAddEvent} disabled={!noteInput.trim()} className="flex-grow flex items-center justify-center gap-2 py-2 bg-[var(--color-primary-700)] rounded-md font-semibold hover:bg-[var(--color-primary-800)] disabled:bg-gray-600">
                                    <PlusIcon className="w-5 h-5" />
                                    افزودن
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-[var(--radius-lg)]">
                            <h4 className="font-bold mb-3">تحلیل هوشمند ماه</h4>
                             <button onClick={handleAnalyzeMonth} disabled={isAnalyzing} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-700 rounded-md font-semibold hover:bg-gray-600 disabled:bg-gray-600">
                                <SparklesIcon className="w-5 h-5 text-[var(--color-primary-400)]" />
                                <span>{isAnalyzing ? 'در حال تحلیل...' : 'تحلیل این ماه'}</span>
                            </button>
                            {analysis && <div className="mt-3 text-sm text-gray-300 whitespace-pre-wrap bg-gray-700/50 p-2 rounded-md">{analysis}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;

import React, { useState, useEffect } from 'react';
import { GratitudeEntry } from '../types';
import { TrashIcon, BookOpenIcon } from './icons';

const STORAGE_KEY = 'benvis_gratitude_journal';

const GratitudeJournal: React.FC = () => {
    const [entries, setEntries] = useState<GratitudeEntry[]>([]);
    const [currentEntry, setCurrentEntry] = useState('');

    useEffect(() => {
        try {
            const storedEntries = localStorage.getItem(STORAGE_KEY);
            if (storedEntries) {
                setEntries(JSON.parse(storedEntries));
            }
        } catch (error) {
            console.error('Failed to load gratitude entries:', error);
        }
    }, []);

    const saveEntry = () => {
        if (!currentEntry.trim()) return;
        const newEntry: GratitudeEntry = {
            id: new Date().toISOString(),
            content: currentEntry,
            createdAt: new Date().toISOString(),
        };
        const updatedEntries = [newEntry, ...entries];
        setEntries(updatedEntries);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
        setCurrentEntry('');
    };
    
    const deleteEntry = (id: string) => {
        const updatedEntries = entries.filter(entry => entry.id !== id);
        setEntries(updatedEntries);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    };

    return (
        <div className="space-y-4 p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)]">
            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpenIcon className="w-6 h-6 text-violet-400" /> دفترچه شکرگزاری</h3>
            <p className="text-sm text-slate-400">
                هر روز چند لحظه برای نوشتن چیزهایی که برایشان سپاسگزارید وقت بگذارید. این تمرین ساده می‌تواند نگاه شما به زندگی را تغییر دهد.
            </p>
            <textarea
                value={currentEntry}
                onChange={e => setCurrentEntry(e.target.value)}
                placeholder="امروز برای چه چیزهایی شکرگزار هستی؟"
                rows={5}
                className="w-full bg-slate-700/60 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
            <button onClick={saveEntry} className="w-full py-3 bg-violet-700 rounded-[var(--radius-md)] font-semibold disabled:bg-slate-500 hover:bg-violet-800" disabled={!currentEntry.trim()}>
                ثبت شکرگزاری
            </button>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {entries.map(entry => (
                    <div key={entry.id} className="bg-slate-800 p-3 rounded-[var(--radius-md)] flex justify-between items-start">
                        <div className="flex-grow">
                             <p className="whitespace-pre-wrap text-slate-300">{entry.content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                {new Date(entry.createdAt).toLocaleString('fa-IR')}
                            </p>
                        </div>
                        <button onClick={() => deleteEntry(entry.id)} className="p-1 text-slate-500 hover:text-red-400 ml-2">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GratitudeJournal;

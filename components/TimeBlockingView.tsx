
import React, { useState } from 'react';
import { OnboardingData, TimeBlock } from '../types';
import { QueueListIcon, PlusIcon, TrashIcon, BoltIcon } from './icons';

interface TimeBlockingViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

const TimeBlockingView: React.FC<TimeBlockingViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const timeBlocks = userData.timeBlocks || [];
    const [newBlockTitle, setNewBlockTitle] = useState('');
    const [selectedStart, setSelectedStart] = useState('09:00');
    const [selectedEnd, setSelectedEnd] = useState('10:00');
    const [selectedType, setSelectedType] = useState<TimeBlock['type']>('focus');

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
        onUpdateUserData({ ...userData, timeBlocks: timeBlocks.filter(b => b.id !== id) });
    };

    // Helper to position blocks on grid
    const getBlockStyle = (block: TimeBlock) => {
        const startHour = parseInt(block.startTime.split(':')[0]);
        const startMin = parseInt(block.startTime.split(':')[1]);
        const endHour = parseInt(block.endTime.split(':')[0]);
        const endMin = parseInt(block.endTime.split(':')[1]);
        
        const startMinutes = (startHour - 6) * 60 + startMin;
        const durationMinutes = ((endHour * 60 + endMin) - (startHour * 60 + startMin));
        
        return {
            top: `${startMinutes}px`,
            height: `${durationMinutes}px`,
        };
    };

    const getTypeColor = (type: TimeBlock['type']) => {
        switch (type) {
            case 'focus': return 'bg-violet-600/80 border-violet-400';
            case 'break': return 'bg-green-600/80 border-green-400';
            case 'routine': return 'bg-blue-600/80 border-blue-400';
            case 'meeting': return 'bg-yellow-600/80 border-yellow-400';
            default: return 'bg-slate-600/80';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/90 border border-slate-700 rounded-[var(--radius-card)] p-4 w-full max-w-lg h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <QueueListIcon className="w-6 h-6 text-blue-400"/>
                        زمان‌بندی روزانه
                    </h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg mb-4 space-y-3">
                    <input 
                        type="text" 
                        placeholder="عنوان فعالیت..." 
                        value={newBlockTitle} 
                        onChange={(e) => setNewBlockTitle(e.target.value)}
                        className="w-full bg-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                        <input type="time" value={selectedStart} onChange={(e) => setSelectedStart(e.target.value)} className="bg-slate-700 rounded p-2 text-sm"/>
                        <span className="self-center text-slate-400">تا</span>
                        <input type="time" value={selectedEnd} onChange={(e) => setSelectedEnd(e.target.value)} className="bg-slate-700 rounded p-2 text-sm"/>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {['focus', 'routine', 'break', 'meeting'].map(type => (
                            <button 
                                key={type} 
                                onClick={() => setSelectedType(type as any)}
                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${selectedType === type ? 'bg-slate-600 border-white' : 'border-slate-600 text-slate-400'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleAddBlock} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5" /> افزودن بلوک
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto relative bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="absolute left-0 top-0 w-12 border-r border-slate-700 h-[1080px] bg-slate-900/50">
                        {hours.map(h => (
                            <div key={h} className="h-[60px] border-b border-slate-700/30 text-[10px] text-slate-400 p-1 text-center">
                                {h}:00
                            </div>
                        ))}
                    </div>
                    <div className="absolute left-12 right-0 top-0 h-[1080px] relative">
                         {/* Grid lines */}
                         {hours.map(h => (
                            <div key={h} className="h-[60px] border-b border-slate-700/30 w-full"></div>
                        ))}
                        
                        {/* Blocks */}
                        {timeBlocks.map(block => {
                             const style = getBlockStyle(block);
                             return (
                                 <div 
                                    key={block.id} 
                                    className={`absolute left-2 right-2 rounded-md border p-2 text-xs flex justify-between items-start group overflow-hidden ${getTypeColor(block.type)}`}
                                    style={style}
                                >
                                    <div>
                                        <span className="font-bold block">{block.title}</span>
                                        <span className="opacity-75">{block.startTime} - {block.endTime}</span>
                                    </div>
                                    <button onClick={() => handleDeleteBlock(block.id)} className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                 </div>
                             )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeBlockingView;

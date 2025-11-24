
import React, { useState } from 'react';
import { OnboardingData, StandaloneTask } from '../types';
import { 
    PlusIcon, TrashIcon, CheckCircleIcon, XMarkIcon, 
    FireIcon, CalendarIcon, UserIcon, ArrowLeftIcon 
} from './icons';

interface EisenhowerMatrixViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

type QuadrantType = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

const QUADRANTS: Record<QuadrantType, { 
    label: string; 
    desc: string;
    icon: React.FC<{className?: string}>; 
    urgent: boolean; 
    important: boolean; 
    theme: string;
    border: string;
    text: string;
}> = {
    do_first: {
        label: 'انجام فوری',
        desc: 'بحرانی و مهم',
        icon: FireIcon,
        urgent: true,
        important: true,
        theme: 'bg-rose-500/10',
        border: 'border-rose-500/50',
        text: 'text-rose-400'
    },
    schedule: {
        label: 'برنامه‌ریزی',
        desc: 'اهداف بلندمدت',
        icon: CalendarIcon,
        urgent: false,
        important: true,
        theme: 'bg-blue-500/10',
        border: 'border-blue-500/50',
        text: 'text-blue-400'
    },
    delegate: {
        label: 'واگذاری',
        desc: 'وقفه‌ها و شلوغی‌ها',
        icon: UserIcon,
        urgent: true,
        important: false,
        theme: 'bg-amber-500/10',
        border: 'border-amber-500/50',
        text: 'text-amber-400'
    },
    eliminate: {
        label: 'حذف',
        desc: 'اتلاف وقت',
        icon: TrashIcon,
        urgent: false,
        important: false,
        theme: 'bg-slate-500/10',
        border: 'border-slate-500/50',
        text: 'text-slate-400'
    }
};

const EisenhowerMatrixView: React.FC<EisenhowerMatrixViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [newTask, setNewTask] = useState('');
    const [selectedQuad, setSelectedQuad] = useState<QuadrantType>('do_first');
    const tasks = userData.tasks || [];

    const handleAdd = () => {
        if (!newTask.trim()) return;
        const q = QUADRANTS[selectedQuad];
        const task: StandaloneTask = {
            id: `task-${Date.now()}`,
            title: newTask,
            urgent: q.urgent,
            important: q.important,
            completed: false
        };
        onUpdateUserData({ ...userData, tasks: [...tasks, task] });
        setNewTask('');
    };

    const toggleTask = (id: string) => {
        onUpdateUserData({
            ...userData,
            tasks: tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        });
    };

    const deleteTask = (id: string) => {
        onUpdateUserData({
            ...userData,
            tasks: tasks.filter(t => t.id !== id)
        });
    };

    const getTasks = (type: QuadrantType) => {
        const q = QUADRANTS[type];
        return tasks.filter(t => t.urgent === q.urgent && t.important === q.important);
    };

    return (
        <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col font-[Vazirmatn] animate-fadeIn">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-noise.png')] opacity-20 pointer-events-none"></div>
            
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-center relative z-10 bg-gradient-to-b from-[#050505] to-transparent">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">ماتریس فرماندهی</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-widest">Priority Command Center</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400 hover:text-white transition-colors backdrop-blur-md">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>

            {/* Matrix Grid */}
            <div className="flex-grow overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {(Object.keys(QUADRANTS) as QuadrantType[]).map((key) => {
                    const q = QUADRANTS[key];
                    const qTasks = getTasks(key);
                    
                    return (
                        <div key={key} className={`flex flex-col rounded-2xl border backdrop-blur-sm transition-all duration-300 ${q.theme} ${q.border} relative overflow-hidden group hover:shadow-lg`}>
                            {/* Corner Accent */}
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full`}></div>
                            
                            <div className="p-4 flex justify-between items-center border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-black/20 ${q.text}`}>
                                        <q.icon className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm ${q.text} drop-shadow-sm`}>{q.label}</h3>
                                        <p className="text-[10px] text-slate-400/80 font-medium">{q.desc}</p>
                                    </div>
                                </div>
                                <span className="bg-black/30 text-slate-300 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-white/5">{qTasks.length}</span>
                            </div>
                            
                            <div className="flex-grow p-3 space-y-2 min-h-[140px] overflow-y-auto custom-scrollbar">
                                {qTasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                                        <q.icon className="w-8 h-8"/>
                                        <span className="text-xs">خالی</span>
                                    </div>
                                ) : (
                                    qTasks.map(task => (
                                        <div key={task.id} className="group/task flex items-start gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                                            <button onClick={() => toggleTask(task.id)} className={`mt-0.5 flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-slate-600 hover:text-slate-400'}`}>
                                                <CheckCircleIcon className="w-5 h-5"/>
                                            </button>
                                            <span className={`flex-grow text-sm leading-relaxed transition-all ${task.completed ? 'text-slate-600 line-through decoration-slate-700' : 'text-slate-200'}`}>
                                                {task.title}
                                            </span>
                                            <button onClick={() => deleteTask(task.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover/task:opacity-100 transition-all transform scale-90 group-hover/task:scale-100">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Quick Input Bar */}
            <div className="p-4 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 relative z-20">
                <div className="max-w-3xl mx-auto flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 p-2 rounded-2xl focus-within:border-slate-500 transition-all shadow-lg">
                        <input 
                            type="text" 
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="تسک جدید را وارد کنید..." 
                            className="flex-grow bg-transparent px-4 text-white placeholder-slate-600 outline-none text-sm h-10"
                        />
                        <button 
                            onClick={handleAdd}
                            disabled={!newTask.trim()}
                            className="bg-white text-black w-10 h-10 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center justify-center shadow-md"
                        >
                            <PlusIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1">
                        {(Object.keys(QUADRANTS) as QuadrantType[]).map(key => {
                            const q = QUADRANTS[key];
                            const isSelected = selectedQuad === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedQuad(key)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 flex items-center justify-center gap-2 ${isSelected ? `bg-slate-800 text-white border-slate-600 shadow-md scale-105` : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-900'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isSelected ? q.text.replace('text-', 'bg-') : 'bg-slate-600'}`}></div>
                                    {q.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EisenhowerMatrixView;


import React, { useState } from 'react';
import { OnboardingData, StandaloneTask } from '../types';
import { PlusIcon, TrashIcon, CheckCircleIcon, Squares2X2Icon } from './icons';

interface EisenhowerMatrixViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const EisenhowerMatrixView: React.FC<EisenhowerMatrixViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const tasks = userData.tasks || [];

    const handleAddTask = (urgent: boolean, important: boolean) => {
        if (!newTaskTitle.trim()) return;
        const newTask: StandaloneTask = {
            id: `task-${Date.now()}`,
            title: newTaskTitle,
            urgent,
            important,
            completed: false
        };
        onUpdateUserData({ ...userData, tasks: [...tasks, newTask] });
        setNewTaskTitle('');
    };

    const handleToggleTask = (taskId: string) => {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        onUpdateUserData({ ...userData, tasks: updatedTasks });
    };

    const handleDeleteTask = (taskId: string) => {
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        onUpdateUserData({ ...userData, tasks: updatedTasks });
    };

    const TaskList: React.FC<{ urgent: boolean; important: boolean; title: string; color: string; action: string }> = ({ urgent, important, title, color, action }) => {
        const filteredTasks = tasks.filter(t => t.urgent === urgent && t.important === important);
        
        return (
            <div className={`bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col h-full ${color}`}>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm">{title}</h4>
                    <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-white/80">{action}</span>
                </div>
                <div className="flex-grow space-y-2 overflow-y-auto max-h-40 pr-1">
                    {filteredTasks.length === 0 && <p className="text-xs text-white/30 text-center mt-4">خالی</p>}
                    {filteredTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-slate-900/40 p-2 rounded-lg group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <button onClick={() => handleToggleTask(task.id)} className={`flex-shrink-0 w-4 h-4 rounded border ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                                     {task.completed && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                </button>
                                <span className={`text-sm truncate ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                            </div>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex gap-1">
                    <input 
                        type="text" 
                        placeholder="تسک جدید..." 
                        className="w-full bg-slate-900/50 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                                setNewTaskTitle(e.currentTarget.value);
                                handleAddTask(urgent, important);
                                e.currentTarget.value = '';
                            }
                        }}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <button onClick={() => handleAddTask(urgent, important)} className="bg-white/10 hover:bg-white/20 rounded p-1 transition-colors">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/90 border border-slate-700 rounded-[var(--radius-card)] p-4 w-full max-w-4xl h-[85vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Squares2X2Icon className="w-6 h-6 text-violet-400"/>
                        ماتریس آیزنهاور
                    </h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-grow h-full min-h-0">
                    <TaskList urgent={true} important={true} title="فوری و مهم" color="border-l-4 border-l-red-500" action="همین الان انجام بده" />
                    <TaskList urgent={false} important={true} title="مهم ولی غیرفوری" color="border-l-4 border-l-blue-500" action="برنامه‌ریزی کن" />
                    <TaskList urgent={true} important={false} title="فوری ولی غیرمهم" color="border-l-4 border-l-yellow-500" action="واگذار کن" />
                    <TaskList urgent={false} important={false} title="نه فوری، نه مهم" color="border-l-4 border-l-slate-500" action="حذف کن" />
                </div>
            </div>
        </div>
    );
};

export default EisenhowerMatrixView;

import React, { useState, useMemo } from 'react';
import { UserGoal, JourneyMilestone } from '../types';
import { goalIcons, PlusIcon, PencilIcon, TrashIcon, ShareIcon, SparklesIcon, JourneyIcon, CheckCircleIcon, TargetIcon, CalendarIcon, ClockIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const XP_PER_TASK_COMPLETION = 15;
const XP_PER_PROGRESS_POINT = 2;


const GoalFormModal: React.FC<{
    goal: UserGoal | null;
    onSave: (goal: UserGoal) => void;
    onClose: () => void;
    availableHabits: string[];
    onGenerateJourney: (prompt: string) => Promise<UserGoal>;
}> = ({ goal, onSave, onClose, availableHabits, onGenerateJourney }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [icon, setIcon] = useState(goal?.icon || 'Target');
    const [linkedHabits, setLinkedHabits] = useState(goal?.linkedHabits || []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [targetDate, setTargetDate] = useState(goal?.targetDate || '');
    const [pomodorosToComplete, setPomodorosToComplete] = useState(goal?.pomodorosToComplete || 0);

    const toggleLinkedHabit = (habitName: string) => {
        setLinkedHabits(prev =>
            prev.includes(habitName)
                ? prev.filter(h => h !== habitName)
                : [...prev, habitName]
        );
    };

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError("لطفا ابتدا یک عنوان برای هدف خود بنویسید.");
            return;
        }
        setIsGenerating(true);
        setError('');
        try {
            const newJourney = await onGenerateJourney(title);
            onSave(newJourney);
        } catch (error: any) {
            const errorMessage = error?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                setError("محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.");
            } else {
                setError("خطا در ساختن سفر. لطفا دوباره تلاش کنید.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSimple = () => {
        if (!title.trim() || !icon) return;
        onSave({
            id: goal?.id || `goal-${Date.now()}`,
            type: 'simple',
            title: title.trim(),
            icon: icon,
            progress: goal?.progress || 0,
            progressHistory: goal?.progressHistory || [{ date: new Date().toISOString().split('T')[0], progress: 0 }],
            linkedHabits: linkedHabits,
            targetDate: targetDate || undefined,
            pomodorosToComplete: pomodorosToComplete > 0 ? pomodorosToComplete : undefined,
            pomodorosCompleted: goal?.pomodorosCompleted || 0,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-[var(--radius-card)] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto modal-panel" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{goal ? 'ویرایش هدف' : 'هدف جدید بساز'}</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="عنوان هدف یا رویای شما..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                     <button onClick={handleGenerate} disabled={isGenerating || !title.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold hover:bg-violet-700 transition-colors disabled:bg-slate-600">
                        <SparklesIcon className="w-5 h-5"/>
                        {isGenerating ? 'در حال ساختن نقشه راه...' : 'ساختن سفر با هوش مصنوعی'}
                    </button>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-600"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">یا</span>
                        <div className="flex-grow border-t border-slate-600"></div>
                    </div>
                    <h3 className="text-center font-semibold text-slate-300">یک هدف ساده بسازید</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-400 block mb-1 text-right">تاریخ هدف (اختیاری)</label>
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 block mb-1 text-right">پومودورو برای تکمیل</label>
                            <input
                                type="number"
                                value={pomodorosToComplete || ''}
                                onChange={(e) => setPomodorosToComplete(Number(e.target.value))}
                                min="0"
                                placeholder="مثلا: ۱۰"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-6 gap-3 bg-slate-800/40 p-3 rounded-[var(--radius-md)]">
                        {Object.entries(goalIcons).map(([key, Icon]) => (
                            <button key={key} type="button" onClick={() => setIcon(key)} className={`p-2 rounded-md flex items-center justify-center aspect-square transition-all w-full ${icon === key ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                <Icon className="w-8 h-8 text-white" />
                            </button>
                        ))}
                    </div>
                    {availableHabits.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-slate-700">
                            <h4 className="font-semibold text-slate-300">عادت‌های مرتبط (اختیاری)</h4>
                            <p className="text-xs text-slate-400">با انجام این عادت‌ها، پیشرفت این هدف خودکار زیاد می‌شود.</p>
                             <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-800/40 p-2 rounded-md">
                                {availableHabits.map(habitName => (
                                    <label key={habitName} className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-700/50">
                                        <input
                                            type="checkbox"
                                            checked={linkedHabits.includes(habitName)}
                                            onChange={() => toggleLinkedHabit(habitName)}
                                            className="w-5 h-5 rounded text-violet-600 bg-slate-700 border-slate-600 focus:ring-violet-500"
                                        />
                                        <span>{habitName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={handleSaveSimple} className="flex-1 py-2 bg-slate-700 rounded-[var(--radius-md)] font-semibold hover:bg-slate-600 transition-colors">ذخیره هدف ساده</button>
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-600 rounded-[var(--radius-md)] font-semibold hover:bg-slate-500 transition-colors">لغو</button>
                </div>
            </div>
        </div>
    );
};

const JourneyDetailView: React.FC<{
    journey: UserGoal;
    onBack: () => void;
    onUpdateJourney: (journey: UserGoal) => void;
    addXp: (amount: number) => void;
}> = ({ journey, onBack, onUpdateJourney, addXp }) => {
    const handleTaskToggle = (milestoneId: string, taskId: string) => {
        const updatedJourney = {
            ...journey,
            milestones: (journey.milestones || []).map(ms => {
                if (ms.id === milestoneId) {
                    const wasCompleted = ms.tasks.find(t => t.id === taskId)?.completed;
                    addXp(wasCompleted ? -XP_PER_TASK_COMPLETION : XP_PER_TASK_COMPLETION);
                    return { ...ms, tasks: ms.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) };
                }
                return ms;
            }),
        };
        const totalTasks = updatedJourney.milestones?.reduce((acc, ms) => acc + ms.tasks.length, 0) || 0;
        const completedTasks = updatedJourney.milestones?.reduce((acc, ms) => acc + ms.tasks.filter(t => t.completed).length, 0) || 0;
        updatedJourney.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        onUpdateJourney(updatedJourney);
    };

    const Icon = goalIcons[journey.icon] || JourneyIcon;

    return (
        <div className="pb-24">
            <button onClick={onBack} className="font-semibold mb-4">&larr; بازگشت به لیست اهداف</button>
            <div className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-card)] p-6 mb-6">
                <div className="flex items-center gap-4 mb-3">
                    <Icon className="w-10 h-10 text-violet-400"/>
                    <div>
                        <h2 className="text-2xl font-bold">{journey.title}</h2>
                        <p className="text-slate-400">{journey.description}</p>
                    </div>
                </div>
                 <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-violet-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${journey.progress}%` }}></div>
                </div>
                <p className="text-center text-sm font-bold mt-2">{journey.progress}% کامل شده</p>
            </div>
            
            <div className="relative pl-6">
                <div className="absolute top-0 bottom-0 right-4 w-0.5 bg-slate-700"></div>
                {(journey.milestones || []).map((milestone, index) => {
                     const isMilestoneCompleted = milestone.tasks.length > 0 && milestone.tasks.every(t => t.completed);
                    return (
                        <div key={milestone.id} className="relative mb-8">
                            <div className={`absolute top-0 right-[-1px] w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1/2 ${isMilestoneCompleted ? 'bg-violet-500' : 'bg-slate-600 border-2 border-slate-800'}`}>
                                {isMilestoneCompleted && <CheckCircleIcon className="w-5 h-5 text-white"/>}
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-lg)] p-4">
                                <h3 className="font-bold text-lg text-violet-300">{`مرحله ${index + 1}: ${milestone.title}`}</h3>
                                <p className="text-sm text-slate-400 mt-1 mb-4">{milestone.description}</p>
                                <div className="space-y-2">
                                    {milestone.tasks.map(task => (
                                        <label key={task.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-slate-700/50">
                                            <input type="checkbox" checked={task.completed} onChange={() => handleTaskToggle(milestone.id, task.id)}
                                                className="w-5 h-5 rounded text-violet-600 bg-slate-700 border-slate-600 focus:ring-violet-500"/>
                                            <span className={`${task.completed ? 'line-through text-slate-500' : ''}`}>{task.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const ProgressHistoryModal: React.FC<{ goal: UserGoal; onClose: () => void }> = ({ goal, onClose }) => {
    const history = goal.progressHistory || [];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-[var(--radius-card)] p-6 w-full max-w-sm modal-panel" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">تاریخچه پیشرفت: {goal.title}</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {history.length > 0 ? (
                        [...history].reverse().map((entry, index) => (
                            <div key={index} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                                <span className="text-sm text-slate-300">{new Date(entry.date).toLocaleDateString('fa-IR')}</span>
                                <span className="font-bold text-lg text-violet-400">{entry.progress}%</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-400">تاریخچه‌ای ثبت نشده است.</p>
                    )}
                </div>
                <button onClick={onClose} className="w-full mt-4 py-2 bg-slate-600 rounded-md">بستن</button>
            </div>
        </div>
    );
};


interface GoalsViewProps {
    goals: UserGoal[];
    onUpdateGoals: (goals: UserGoal[]) => void;
    availableHabits: string[];
    addXp: (amount: number) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, onUpdateGoals, availableHabits, addXp }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<UserGoal | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'progress' | 'targetDate' | 'manual', direction: 'asc' | 'desc' }>({ key: 'manual', direction: 'asc' });
    const [historyGoal, setHistoryGoal] = useState<UserGoal | null>(null);

    const sortedGoals = useMemo(() => {
        const sortableArray = [...goals];
        if (sortConfig.key !== 'manual') {
            sortableArray.sort((a, b) => {
                if (sortConfig.key === 'progress') {
                    return a.progress - b.progress;
                }
                if (sortConfig.key === 'targetDate') {
                    if (!a.targetDate) return 1;
                    if (!b.targetDate) return -1;
                    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
                }
                return 0;
            });
            if (sortConfig.direction === 'desc') {
                sortableArray.reverse();
            }
        }
        return sortableArray;
    }, [goals, sortConfig]);


    const handleSaveGoal = (goalToSave: UserGoal) => {
        const isEditingFlow = isEditing !== null;
        const updatedGoals = isEditingFlow
            ? goals.map(g => (g.id === goalToSave.id ? goalToSave : g))
            : [...goals, goalToSave];
        onUpdateGoals(updatedGoals);
        setIsCreating(false);
        setIsEditing(null);
    };

    const handleDeleteGoal = (goalId: string) => {
        if (window.confirm("آیا از حذف این هدف/سفر مطمئن هستید؟")) {
            onUpdateGoals(goals.filter(g => g.id !== goalId));
        }
    };
    
    const handleProgressChange = (goalId: string, newProgress: number) => {
        let progressDiff = 0;
        const updatedGoals = goals.map(g => {
            if (g.id === goalId) {
                progressDiff = newProgress - g.progress;
                const newHistory = [...(g.progressHistory || [])];
                const todayStr = new Date().toISOString().split('T')[0];
                const todayHistory = newHistory.find(h => h.date === todayStr);

                if (todayHistory) {
                    todayHistory.progress = newProgress;
                } else {
                    newHistory.push({ date: todayStr, progress: newProgress });
                }
                return { ...g, progress: newProgress, progressHistory: newHistory };
            }
            return g;
        });
        onUpdateGoals(updatedGoals);

        if (progressDiff > 0) {
            addXp(progressDiff * XP_PER_PROGRESS_POINT);
        }
    };
    
    const handleShareGoal = async (goal: UserGoal) => {
        const shareText = `من در حال کار بر روی هدف «${goal.title}» در Benvis Life OS هستم و ${goal.progress}% پیشرفت داشته‌ام! #BenvisLifeOS`;
        try {
            if (navigator.share) await navigator.share({ title: 'پیشرفت هدف!', text: shareText });
            else {
                await navigator.clipboard.writeText(shareText);
                alert('پیشرفت هدف در کلیپ‌بورد کپی شد!');
            }
        } catch (err) {
            console.error('Error sharing goal:', err);
        }
    };

    const handleGenerateJourney = async (prompt: string): Promise<UserGoal> => {
        const apiPrompt = `You are an expert life coach. A user wants to achieve: "${prompt}". 
        Break this down into a structured journey with 3-5 milestones, each with 2-4 tasks. 
        Suggest a relevant icon from this list: [${Object.keys(goalIcons).join(', ')}].
        The title of the journey should be a refined, inspiring version of the user's prompt.
        Respond ONLY with a valid JSON object matching the schema. All text must be in Persian.`;
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The refined, inspiring title for the journey." },
                description: { type: Type.STRING, description: "A short, motivating description of the journey." },
                icon: { type: Type.STRING, description: `One of the suggested icons: [${Object.keys(goalIcons).join(', ')}]` },
                milestones: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "Title of the milestone." },
                            description: { type: Type.STRING, description: "Description of what this milestone entails." },
                            tasks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING, description: "A specific, actionable task." }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: apiPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
    
            const resultJson = JSON.parse(response.text.trim());
    
            const newJourneyGoal: UserGoal = {
                id: `journey-${Date.now()}`,
                type: 'journey',
                title: resultJson.title,
                description: resultJson.description,
                icon: Object.keys(goalIcons).includes(resultJson.icon) ? resultJson.icon : 'Journey',
                progress: 0,
                progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: 0 }],
                milestones: (resultJson.milestones || []).map((ms: any, i: number) => ({
                    id: `ms-${Date.now()}-${i}`,
                    title: ms.title,
                    description: ms.description,
                    tasks: (ms.tasks || []).map((task: any, ti: number) => ({
                        id: `task-${Date.now()}-${i}-${ti}`,
                        title: task.title,
                        completed: false
                    }))
                }))
            };
            return newJourneyGoal;
        } catch(e) {
            console.error("Failed to generate journey:", e);
            throw e;
        }
    };
    
    const SortButton: React.FC<{
        sortKey: 'progress' | 'targetDate' | 'manual';
        label: string;
        icon: React.FC<{ className?: string }>;
    }> = ({ sortKey, label, icon: Icon }) => {
        const isActive = sortConfig.key === sortKey;
        const direction = isActive ? sortConfig.direction : 'asc';

        const handleClick = () => {
            if (isActive) {
                setSortConfig({ key: sortKey, direction: direction === 'asc' ? 'desc' : 'asc' });
            } else {
                setSortConfig({ key: sortKey, direction: 'asc' });
            }
        };
        
        return (
            <button onClick={handleClick} className={`px-3 py-1.5 flex items-center gap-1.5 text-xs rounded-full transition-colors ${isActive ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {isActive && (direction === 'asc' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>)}
            </button>
        )
    }

    if (view === 'detail' && selectedGoal) {
        return <JourneyDetailView journey={selectedGoal} onBack={() => setView('list')} onUpdateJourney={(updated) => { onUpdateGoals(goals.map(g => g.id === updated.id ? updated : g)); setSelectedGoal(updated); }} addXp={addXp} />
    }
    
    return (
        <div className="pb-24">
            {(isCreating || isEditing) && <GoalFormModal goal={isEditing} onClose={() => {setIsCreating(false); setIsEditing(null);}} onSave={handleSaveGoal} availableHabits={availableHabits} onGenerateJourney={handleGenerateJourney} />}
            {historyGoal && <ProgressHistoryModal goal={historyGoal} onClose={() => setHistoryGoal(null)} />}
            <div className="flex justify-start items-center gap-2 mb-4">
                <span className="text-sm text-slate-400">مرتب‌سازی:</span>
                <SortButton sortKey="progress" label="پیشرفت" icon={ChartBarIcon} />
                <SortButton sortKey="targetDate" label="تاریخ هدف" icon={CalendarIcon} />
                {sortConfig.key !== 'manual' && (
                    <button onClick={() => setSortConfig({ key: 'manual', direction: 'asc' })} className="text-xs text-slate-400 hover:text-white">حذف فیلتر</button>
                )}
            </div>
            <div className="space-y-4">
                {sortedGoals.map(goal => {
                    const Icon = goalIcons[goal.icon] || TargetIcon;
                    return (
                        <div key={goal.id} className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-card)] p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Icon className="w-8 h-8 text-violet-400"/>
                                    <div>
                                        <span className="font-bold text-lg">{goal.title}</span>
                                        {goal.type === 'journey' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 mr-2">سفر</span>}
                                        {goal.description && <p className="text-sm text-slate-400">{goal.description}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setHistoryGoal(goal)} className="p-2 text-slate-400 hover:text-white" title="تاریخچه پیشرفت"><ChartBarIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setIsEditing(goal)} className="p-2 text-slate-400 hover:text-white" title="ویرایش"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleShareGoal(goal)} className="p-2 text-slate-400 hover:text-white" title="اشتراک گذاری"><ShareIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-red-500" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                             <div className="mt-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-slate-400">پیشرفت</span>
                                    <span className="text-sm font-bold text-violet-400">{goal.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-violet-500 h-2.5 rounded-full progress-bar-fill" style={{ width: `${goal.progress}%` }}></div>
                                </div>
                                {goal.type === 'simple' ? (
                                    <input type="range" min="0" max="100" value={goal.progress} onChange={(e) => handleProgressChange(goal.id, parseInt(e.target.value, 10))} className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer mt-3 accent-violet-500"/>
                                ) : (
                                    <button onClick={() => { setSelectedGoal(goal); setView('detail'); }} className="w-full mt-3 text-center py-2 bg-slate-700/80 rounded-md text-sm font-semibold hover:bg-slate-700">مشاهده جزئیات سفر</button>
                                )}
                            </div>
                             <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 border-t border-slate-700 pt-2">
                                {goal.targetDate && (
                                    <div className="flex items-center gap-1.5">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>{new Date(goal.targetDate).toLocaleDateString('fa-IR')}</span>
                                    </div>
                                )}
                                {goal.pomodorosToComplete && (
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>{goal.pomodorosCompleted || 0} / {goal.pomodorosToComplete} پومودورو</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
             <button onClick={() => setIsCreating(true)} className="w-full mt-4 py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold flex items-center justify-center gap-2 hover:bg-violet-700">
                <PlusIcon className="w-6 h-6"/>
                <span>هدف یا سفر جدید بساز</span>
            </button>
        </div>
    );
};

export default GoalsView;

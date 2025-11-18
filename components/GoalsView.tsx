import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, UserGoal, JourneyMilestone, Habit } from '../types';
import { goalIcons, PlusIcon, PencilIcon, TrashIcon, ShareIcon, SparklesIcon, JourneyIcon, CheckCircleIcon, TargetIcon, CalendarIcon, ClockIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon, FlagIcon, HabitsIcon } from './icons';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const XP_PER_TASK_COMPLETION = 15;
const XP_PER_PROGRESS_POINT = 2;


const KeywordGoalGeneratorModal: React.FC<{
    onSave: (goal: UserGoal) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [keywords, setKeywords] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!keywords.trim()) {
            setError('لطفا چند کلمه کلیدی وارد کنید.');
            return;
        }
        setIsLoading(true);
        setError('');

        const prompt = `You are a SMART goal generator for the Benvis Life OS. Based on these keywords in Persian: "${keywords}", create a single, well-defined goal. The goal must be specific, measurable (with a clear success metric), achievable, relevant, and time-bound.
        Suggest a relevant icon from this list: [${Object.keys(goalIcons).join(', ')}].
        The response must be in Persian and a valid JSON object matching this schema. The targetDate should be a reasonable future date relative to today.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING },
                targetDate: { type: Type.STRING, description: "YYYY-MM-DD format" }
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema }
            });
            const result = JSON.parse(response.text.trim());
            const newGoal: UserGoal = {
                id: `goal-ai-${Date.now()}`,
                type: 'simple',
                title: result.title,
                description: result.description,
                icon: Object.keys(goalIcons).includes(result.icon) ? result.icon : 'Target',
                progress: 0,
                targetDate: result.targetDate,
            };
            onSave(newGoal);
        } catch (e) {
            console.error("Failed to generate goal from keywords:", e);
            setError("خطا در ساختن هدف. لطفا دوباره تلاش کنید.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-[var(--radius-card)] p-6 w-full max-w-md modal-panel" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-violet-400"/> ساخت هدف با هوش مصنوعی</h2>
                <p className="text-sm text-slate-400 mb-4">چند کلمه کلیدی در مورد هدفی که در ذهن دارید بنویسید (مثلا: «یادگیری یک ساز» یا «افزایش تناسب اندام») تا هوش مصنوعی یک هدف هوشمند برای شما بسازد.</p>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="کلمات کلیدی شما..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-600 rounded-[var(--radius-md)] font-semibold hover:bg-slate-500 transition-colors">لغو</button>
                    <button onClick={handleGenerate} disabled={isLoading || !keywords.trim()} className="flex-1 py-2 bg-violet-700 rounded-[var(--radius-md)] font-semibold hover:bg-violet-800 transition-colors disabled:bg-slate-500">
                        {isLoading ? 'در حال ساخت...' : 'ساختن هدف'}
                    </button>
                </div>
            </div>
        </div>
    );
};


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
                     const totalTasks = milestone.tasks.length;
                     const completedTasks = milestone.tasks.filter(t => t.completed).length;
                     const milestoneProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                     const isMilestoneCompleted = milestoneProgress === 100;

                    return (
                        <div key={milestone.id} className="relative mb-8">
                            <div className={`absolute top-0 right-[-1px] w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1/2 ${isMilestoneCompleted ? 'bg-violet-500' : 'bg-slate-600 border-2 border-slate-800'}`}>
                                {isMilestoneCompleted && <CheckCircleIcon className="w-5 h-5 text-white"/>}
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-lg)] p-4">
                                <h3 className="font-bold text-lg text-violet-300">{`مرحله ${index + 1}: ${milestone.title}`}</h3>
                                <p className="text-sm text-slate-400 mt-1 mb-3">{milestone.description}</p>
                                 <div className="w-full bg-slate-700 rounded-full h-1.5 mb-4">
                                    <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${milestoneProgress}%` }}></div>
                                </div>
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
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    addXp: (amount: number) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ userData, onUpdateUserData, addXp }) => {
    const { goals, habits } = userData;
    const availableHabits = habits.map(h => h.name);

    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<UserGoal | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'progress' | 'targetDate' | 'manual', direction: 'asc' | 'desc' }>({ key: 'manual', direction: 'asc' });
    const [historyGoal, setHistoryGoal] = useState<UserGoal | null>(null);
    
    // New states for AI features
    const [isHabitModalOpen, setIsHabitModalOpen] = useState<UserGoal | null>(null);
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [isKeywordGeneratorOpen, setIsKeywordGeneratorOpen] = useState(false);
    const [isConvertingToJourney, setIsConvertingToJourney] = useState<string | null>(null);
    const [aiCoachModal, setAiCoachModal] = useState<UserGoal | null>(null);

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
        onUpdateUserData({ ...userData, goals: updatedGoals });
        setIsCreating(false);
        setIsEditing(null);
        setIsKeywordGeneratorOpen(false);
    };

    const handleDeleteGoal = (goalId: string) => {
        if (window.confirm("آیا از حذف این هدف/سفر مطمئن هستید؟")) {
            onUpdateUserData({ ...userData, goals: goals.filter(g => g.id !== goalId) });
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
        onUpdateUserData({ ...userData, goals: updatedGoals });

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
    
    const handleConvertToJourney = async (goalToConvert: UserGoal) => {
        setIsConvertingToJourney(goalToConvert.id);
        try {
            const newJourney = await handleGenerateJourney(goalToConvert.title);
            // Replace the simple goal with the new journey, keeping the original ID
            const updatedGoals = goals.map(g => g.id === goalToConvert.id ? { ...newJourney, id: g.id, title: g.title } : g);
            onUpdateUserData({ ...userData, goals: updatedGoals });
            setAiCoachModal(null); // Close the coach modal after conversion
        } catch (error) {
            alert("خطا در تبدیل هدف به سفر. لطفا دوباره تلاش کنید.");
        } finally {
            setIsConvertingToJourney(null);
        }
    };

    const handleAddHabits = (newHabitNames: string[], goalId: string) => {
        const existingHabitNames = habits.map(h => h.name);
        const habitsToAdd = newHabitNames
            .filter(name => !existingHabitNames.includes(name))
            .map(name => ({ name, type: 'good' } as Habit));
        
        const habitsToLink = [...newHabitNames];

        let updatedHabits = userData.habits;
        if (habitsToAdd.length > 0) {
            updatedHabits = [...habits, ...habitsToAdd];
        }

        const updatedGoals = userData.goals.map(g => {
            if (g.id === goalId) {
                const newLinkedHabits = Array.from(new Set([...(g.linkedHabits || []), ...habitsToLink]));
                return { ...g, linkedHabits: newLinkedHabits };
            }
            return g;
        });
        
        onUpdateUserData({
            ...userData,
            habits: updatedHabits,
            goals: updatedGoals
        });
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
        return <JourneyDetailView journey={selectedGoal} onBack={() => setView('list')} onUpdateJourney={(updated) => { onUpdateUserData({...userData, goals: goals.map(g => g.id === updated.id ? updated : g)}); setSelectedGoal(updated); }} addXp={addXp} />
    }
    
    return (
        <div className="pb-24">
            {(isCreating || isEditing) && <GoalFormModal goal={isEditing} onClose={() => {setIsCreating(false); setIsEditing(null);}} onSave={handleSaveGoal} availableHabits={availableHabits} onGenerateJourney={handleGenerateJourney} />}
            {historyGoal && <ProgressHistoryModal goal={historyGoal} onClose={() => setHistoryGoal(null)} />}
            {isHabitModalOpen && <HabitSuggestionModal goal={isHabitModalOpen} onAddHabits={(habits) => { handleAddHabits(habits, isHabitModalOpen.id); setIsHabitModalOpen(null); }} onClose={() => setIsHabitModalOpen(null)}/>}
            {isChallengeModalOpen && <ChallengeGeneratorModal userData={userData} onUpdateUserData={onUpdateUserData} onClose={() => setIsChallengeModalOpen(null)} />}
            {aiCoachModal && <AiCoachModal goal={aiCoachModal} onClose={() => setAiCoachModal(null)} onConvertToJourney={handleConvertToJourney} onAddHabits={handleAddHabits} isConverting={isConvertingToJourney === aiCoachModal.id} />}
            {isKeywordGeneratorOpen && <KeywordGoalGeneratorModal onSave={handleSaveGoal} onClose={() => setIsKeywordGeneratorOpen(false)} />}


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
                    const completedMilestones = goal.milestones?.filter(ms => ms.tasks.length > 0 && ms.tasks.every(t => t.completed)).length || 0;
                    const totalMilestones = goal.milestones?.length || 0;

                    return (
                        <div key={goal.id} className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-card)] p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4 flex-grow">
                                    <Icon className="w-8 h-8 text-violet-400 flex-shrink-0 mt-1"/>
                                    <div>
                                        <span className="font-bold text-lg">{goal.title}</span>
                                        {goal.type === 'journey' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 mr-2">سفر</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1 relative flex-shrink-0">
                                    <button onClick={() => setAiCoachModal(goal)} className="p-2 text-slate-400 hover:text-white" title="مربی هوشمند">
                                        <SparklesIcon className="w-5 h-5"/>
                                    </button>
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
                                {goal.type === 'journey' && totalMilestones > 0 && (
                                    <div className="flex items-center gap-1.5 font-semibold">
                                        <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                        <span>{completedMilestones} / {totalMilestones} مایلستون</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
             <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => setIsChallengeModalOpen(true)} className="w-full py-3 bg-slate-700/70 text-violet-300 rounded-[var(--radius-md)] font-semibold flex items-center justify-center gap-2 hover:bg-slate-700">
                    <FlagIcon className="w-6 h-6"/>
                    <span>ایجاد چالش</span>
                </button>
                 <button onClick={() => setIsKeywordGeneratorOpen(true)} className="w-full py-3 bg-slate-700/70 text-violet-300 rounded-[var(--radius-md)] font-semibold flex items-center justify-center gap-2 hover:bg-slate-700">
                    <SparklesIcon className="w-6 h-6"/>
                    <span>ساخت هدف با AI</span>
                </button>
                <button onClick={() => setIsCreating(true)} className="w-full py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold flex items-center justify-center gap-2 hover:bg-violet-700">
                    <PlusIcon className="w-6 h-6"/>
                    <span>هدف یا سفر جدید</span>
                </button>
            </div>
        </div>
    );
};

// --- AI MODAL COMPONENTS ---

const AiCoachModal: React.FC<{
    goal: UserGoal;
    onClose: () => void;
    onConvertToJourney: (goal: UserGoal) => void;
    onAddHabits: (habits: string[], goalId: string) => void;
    isConverting: boolean;
}> = ({ goal, onClose, onConvertToJourney, onAddHabits, isConverting }) => {
    const [analysis, setAnalysis] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const analyzeGoal = async () => {
            const history = goal.progressHistory?.slice(-5).map(h => `On ${h.date}, progress was ${h.progress}%`).join('. ') || 'No progress history.';
            const prompt = `Act as a helpful and encouraging AI goal coach. Analyze the user's goal:
            - Goal: "${goal.title}"
            - Type: ${goal.type}
            - Current Progress: ${goal.progress}%
            - Recent Progress History: ${history}
            - Linked Habits: ${goal.linkedHabits?.join(', ') || 'None'}
            
            Based on this, provide a concise analysis and actionable advice in Persian.
            - If progress seems slow or stalled, identify potential blockers.
            - Provide 2-3 concrete 'nextSteps'.
            - Suggest 2 new 'suggestedHabits' that would help.
            - Give a short, encouraging 'summary'.
            
            Respond ONLY with a valid JSON object.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedHabits: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            };
            
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: 'application/json', responseSchema }
                });
                setAnalysis(JSON.parse(response.text.trim()));
            } catch (error) {
                console.error("AI Coach error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        analyzeGoal();
    }, [goal]);
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg modal-panel" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-violet-400" /> مربی هوشمند برای «{goal.title}»</h3>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><p className="animate-pulse">در حال تحلیل...</p></div>
                ) : !analysis ? (
                    <p>خطا در تحلیل.</p>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm italic bg-slate-800/60 p-3 rounded-md text-slate-300">"{analysis.summary}"</p>
                        
                        <div>
                            <h4 className="font-semibold mb-2">قدم‌های بعدی پیشنهادی:</h4>
                            <ul className="space-y-2 list-disc list-inside text-slate-300">
                                {analysis.nextSteps.map((step: string, i: number) => <li key={i}>{step}</li>)}
                            </ul>
                        </div>

                        {analysis.suggestedHabits.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">عادت‌های پیشنهادی برای افزودن:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.suggestedHabits.map((habit: string, i: number) => <span key={i} className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">{habit}</span>)}
                                </div>
                                <button onClick={() => onAddHabits(analysis.suggestedHabits, goal.id)} className="w-full mt-3 py-2 text-sm bg-green-700 rounded-md">افزودن عادت‌ها و اتصال</button>
                            </div>
                        )}
                        
                        {goal.type === 'simple' && (
                             <button onClick={() => onConvertToJourney(goal)} disabled={isConverting} className="w-full py-2 bg-violet-700 rounded-md flex items-center justify-center gap-2">
                                {isConverting ? 'در حال تبدیل...' : <> <JourneyIcon className="w-5 h-5"/> تبدیل به سفر (نقشه راه)</>}
                            </button>
                        )}
                    </div>
                )}
                 <button onClick={onClose} className="w-full mt-4 py-2 bg-slate-600 rounded-md">بستن</button>
            </div>
        </div>
    );
};

const HabitSuggestionModal: React.FC<{
    goal: UserGoal;
    onAddHabits: (habitNames: string[]) => void;
    onClose: () => void;
}> = ({ goal, onAddHabits, onClose }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const prompt = `Based on the user's goal "${goal.title}", suggest 3-5 relevant habits (good or bad) that would help them achieve it. The response MUST be a valid JSON object with a single key "habits" containing an array of strings. The habits should be in Persian.`;
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: { habits: { type: Type.ARRAY, items: { type: Type.STRING } } }
                        }
                    }
                });
                const result = JSON.parse(response.text.trim());
                setSuggestions(result.habits || []);
            } catch (error) {
                console.error("Habit suggestion error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestions();
    }, [goal.title]);

    const toggleSelection = (habit: string) => {
        setSelected(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md modal-panel" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2">عادت‌های پیشنهادی برای «{goal.title}»</h3>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24"><SparklesIcon className="w-8 h-8 animate-pulse text-violet-400" /></div>
                ) : (
                    <div className="space-y-2 my-4">
                        {suggestions.map((habit, i) => (
                            <label key={i} className="flex items-center gap-3 p-3 rounded-md cursor-pointer bg-slate-800/70 hover:bg-slate-700/90">
                                <input type="checkbox" checked={selected.includes(habit)} onChange={() => toggleSelection(habit)} className="w-5 h-5 rounded text-violet-500 bg-slate-700 border-slate-600 focus:ring-violet-500" />
                                <span>{habit}</span>
                            </label>
                        ))}
                    </div>
                )}
                <div className="flex gap-4 mt-4">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-600 rounded-md">لغو</button>
                    <button onClick={() => onAddHabits(selected)} disabled={selected.length === 0} className="flex-1 py-2 bg-violet-700 rounded-md disabled:bg-slate-500">افزودن</button>
                </div>
            </div>
        </div>
    );
};

const ChallengeGeneratorModal: React.FC<{
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}> = ({ userData, onUpdateUserData, onClose }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsLoading(true);
        setResult(null);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Based on the user's goal to "${topic}", create a 7-day challenge.`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT, properties: {
                            challengeTitle: { type: Type.STRING },
                            durationDays: { type: Type.NUMBER },
                            dailyTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                            successCriteria: { type: Type.STRING },
                            xpReward: { type: Type.NUMBER }
                        }
                    }
                }
            });
            setResult(JSON.parse(response.text.trim()));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddChallenge = () => {
        if (!result) return;
        const newChallengeGoal: UserGoal = {
            id: `challenge-${Date.now()}`,
            type: 'journey',
            title: `چالش: ${result.challengeTitle}`,
            icon: 'Flag',
            progress: 0,
            description: result.successCriteria,
            milestones: result.dailyTasks.map((task: string, i: number) => ({
                id: `ms-chal-${Date.now()}-${i}`,
                title: `روز ${i + 1}`,
                description: '',
                tasks: [{ id: `task-chal-${Date.now()}-${i}`, title: task, completed: false }]
            }))
        };
        onUpdateUserData({ ...userData, goals: [...userData.goals, newChallengeGoal] });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg modal-panel" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">ساخت چالش با هوش مصنوعی</h3>
                {!result ? (
                    <>
                        <p className="text-sm text-slate-400 mb-4">در چه زمینه‌ای می‌خواهید یک چالش ۷ روزه برای خودتان بسازید؟ (مثال: مطالعه بیشتر، ورزش روزانه، تغذیه سالم)</p>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-slate-800 p-2 rounded-md mb-4"/>
                        <button onClick={handleGenerate} disabled={isLoading || !topic} className="w-full py-2 bg-violet-700 rounded-md disabled:bg-slate-500">
                            {isLoading ? 'در حال ساخت...' : 'ساختن چالش'}
                        </button>
                    </>
                ) : (
                    <div className="space-y-3">
                        <h4 className="font-bold text-xl text-violet-300">{result.challengeTitle}</h4>
                        <p className="text-sm"><span className="font-semibold">معیار موفقیت:</span> {result.successCriteria}</p>
                        <p className="text-sm"><span className="font-semibold">پاداش:</span> {result.xpReward} XP</p>
                        <div className="space-y-1">
                            {result.dailyTasks.map((task: string, i: number) => <p key={i} className="text-sm"><span className="font-semibold">روز {i+1}:</span> {task}</p>)}
                        </div>
                        <button onClick={handleAddChallenge} className="w-full py-2 bg-green-600 rounded-md mt-4">افزودن به اهداف</button>
                    </div>
                )}
            </div>
        </div>
    );
};


export default GoalsView;
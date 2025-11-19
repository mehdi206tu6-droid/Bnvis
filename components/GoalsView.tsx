

import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, UserGoal, JourneyMilestone, Habit, KeyResult, SmartCriteria } from '../types';
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
    
    // OKR State
    const [isOKR, setIsOKR] = useState(goal?.type === 'okr');
    const [keyResults, setKeyResults] = useState<KeyResult[]>(goal?.keyResults || [{ id: 'kr-1', title: '', baseline: 0, current: 0, target: 100, unit: '%' }]);

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

    const handleMakeSmart = async () => {
        if (!title.trim()) {
             setError("لطفا ابتدا یک عنوان وارد کنید.");
             return;
        }
        setIsGenerating(true);
        const prompt = `Transform the goal "${title}" into a structured SMART goal. 
        Provide Specific, Measurable, Achievable, Relevant, Time-bound details. 
        Also provide a list of up to 6 small actionable steps and an effort estimation (Low, Medium, High).
        Respond ONLY with a valid JSON object matching the schema. Persian text.`;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                specific: { type: Type.STRING },
                measurable: { type: Type.STRING },
                achievable: { type: Type.STRING },
                relevant: { type: Type.STRING },
                timeBound: { type: Type.STRING },
                effort: { type: Type.STRING },
                actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        };
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema }
            });
            const result: SmartCriteria = JSON.parse(response.text.trim());
            
            onSave({
                 id: goal?.id || `goal-${Date.now()}`,
                 type: 'smart',
                 title: title.trim(),
                 icon: icon,
                 progress: goal?.progress || 0,
                 progressHistory: goal?.progressHistory || [{ date: new Date().toISOString().split('T')[0], progress: 0 }],
                 smartCriteria: result,
                 targetDate: targetDate
            });
        } catch (e) {
            console.error(e);
            setError("خطا در تبدیل به SMART");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSimpleOrOKR = () => {
        if (!title.trim() || !icon) return;
        
        if (isOKR) {
            const validKRs = keyResults.filter(kr => kr.title.trim() !== '');
            if (validKRs.length === 0) {
                setError("لطفا حداقل یک نتیجه کلیدی (KR) وارد کنید.");
                return;
            }
            // Calculate OKR progress average
            const totalProgress = validKRs.reduce((sum, kr) => {
                const krProgress = Math.min(100, Math.max(0, ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100));
                return sum + krProgress;
            }, 0) / validKRs.length;

            onSave({
                id: goal?.id || `goal-${Date.now()}`,
                type: 'okr',
                title: title.trim(),
                icon: icon,
                progress: Math.round(totalProgress),
                progressHistory: goal?.progressHistory || [{ date: new Date().toISOString().split('T')[0], progress: Math.round(totalProgress) }],
                keyResults: validKRs,
                targetDate: targetDate || undefined,
            });
            return;
        }

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

    const updateKR = (index: number, field: keyof KeyResult, value: any) => {
        const newKRs = [...keyResults];
        newKRs[index] = { ...newKRs[index], [field]: value };
        setKeyResults(newKRs);
    };
    
    const addKR = () => {
        setKeyResults([...keyResults, { id: `kr-${Date.now()}`, title: '', baseline: 0, current: 0, target: 100, unit: '%' }]);
    };

    const removeKR = (index: number) => {
        setKeyResults(keyResults.filter((_, i) => i !== index));
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
                    
                     {/* AI Generation Options */}
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} disabled={isGenerating || !title.trim()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-800/50 border border-violet-600 rounded-[var(--radius-md)] text-sm hover:bg-violet-700 transition-colors disabled:bg-slate-800 disabled:border-slate-700">
                            <SparklesIcon className="w-4 h-4"/>
                            {isGenerating ? '...' : 'ساخت سفر (Journey)'}
                        </button>
                         <button onClick={handleMakeSmart} disabled={isGenerating || !title.trim()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-800/50 border border-blue-600 rounded-[var(--radius-md)] text-sm hover:bg-blue-700 transition-colors disabled:bg-slate-800 disabled:border-slate-700">
                            <SparklesIcon className="w-4 h-4"/>
                            {isGenerating ? '...' : 'تبدیل به SMART'}
                        </button>
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-600"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">یا تنظیم دستی</span>
                        <div className="flex-grow border-t border-slate-600"></div>
                    </div>
                    
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg mb-2">
                        <button onClick={() => setIsOKR(false)} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${!isOKR ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>ساده</button>
                        <button onClick={() => setIsOKR(true)} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${isOKR ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>OKR</button>
                    </div>
                    
                    {isOKR ? (
                         <div className="space-y-3">
                            <p className="text-xs text-slate-400">نتایج کلیدی (Key Results) قابل اندازه‌گیری تعریف کنید.</p>
                            {keyResults.map((kr, index) => (
                                <div key={index} className="bg-slate-800/50 p-3 rounded-md space-y-2 border border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <input type="text" placeholder="عنوان نتیجه کلیدی" value={kr.title} onChange={(e) => updateKR(index, 'title', e.target.value)} className="w-full bg-transparent text-sm border-b border-slate-600 focus:border-violet-500 outline-none pb-1"/>
                                        {keyResults.length > 1 && <button onClick={() => removeKR(index)} className="text-slate-500 hover:text-red-400 ml-2"><TrashIcon className="w-4 h-4"/></button>}
                                    </div>
                                    <div className="flex gap-2 text-xs">
                                        <div className="flex-1">
                                            <label className="block text-slate-500 mb-1">شروع</label>
                                            <input type="number" value={kr.baseline} onChange={(e) => updateKR(index, 'baseline', Number(e.target.value))} className="w-full bg-slate-700 rounded p-1"/>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-slate-500 mb-1">هدف</label>
                                            <input type="number" value={kr.target} onChange={(e) => updateKR(index, 'target', Number(e.target.value))} className="w-full bg-slate-700 rounded p-1"/>
                                        </div>
                                         <div className="flex-1">
                                            <label className="block text-slate-500 mb-1">واحد</label>
                                            <input type="text" value={kr.unit} onChange={(e) => updateKR(index, 'unit', e.target.value)} className="w-full bg-slate-700 rounded p-1" placeholder="%"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addKR} className="w-full py-2 border border-dashed border-slate-600 text-slate-400 rounded-md hover:bg-slate-800 text-sm flex items-center justify-center gap-1">
                                <PlusIcon className="w-4 h-4"/> افزودن نتیجه کلیدی
                            </button>
                         </div>
                    ) : (
                        <>
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
                        </>
                    )}
                    
                    <div className="grid grid-cols-6 gap-3 bg-slate-800/40 p-3 rounded-[var(--radius-md)]">
                        {Object.entries(goalIcons).map(([key, Icon]) => (
                            <button key={key} type="button" onClick={() => setIcon(key)} className={`p-2 rounded-md flex items-center justify-center aspect-square transition-all w-full ${icon === key ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                <Icon className="w-8 h-8 text-white" />
                            </button>
                        ))}
                    </div>

                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={handleSaveSimpleOrOKR} className="flex-1 py-2 bg-slate-700 rounded-[var(--radius-md)] font-semibold hover:bg-slate-600 transition-colors">ذخیره</button>
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

const HabitSuggestionModal: React.FC<{
    goal: UserGoal;
    onAddHabits: (habits: string[]) => void;
    onClose: () => void;
}> = ({ goal, onAddHabits, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const prompt = `Suggest 3 simple, daily habits to help achieve the goal: "${goal.title}". Respond ONLY with a valid JSON array of strings in Persian.`;
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
                });
                setSuggestions(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error(e);
                setSuggestions(["مطالعه روزانه", "تمرین مستمر", "یادداشت برداری"]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestions();
    }, [goal.title]);

    const [selected, setSelected] = useState<string[]>([]);

    const toggle = (h: string) => setSelected(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-4">پیشنهاد عادت برای {goal.title}</h3>
                {isLoading ? <p className="text-center">در حال فکر کردن...</p> : (
                    <div className="space-y-2">
                        {suggestions.map(h => (
                            <div key={h} onClick={() => toggle(h)} className={`p-3 rounded-md cursor-pointer border ${selected.includes(h) ? 'bg-violet-900/50 border-violet-500' : 'bg-slate-800 border-slate-700'}`}>
                                {h}
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={() => onAddHabits(selected)} disabled={selected.length === 0} className="w-full mt-4 py-2 bg-violet-600 rounded-md disabled:bg-slate-700">افزودن</button>
            </div>
        </div>
    );
};

const ChallengeGeneratorModal: React.FC<{
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}> = ({ userData, onUpdateUserData, onClose }) => {
     return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-2">چالش ساز</h3>
                <p className="text-slate-400 text-sm mb-4">این ویژگی به زودی فعال می‌شود.</p>
                <button onClick={onClose} className="w-full py-2 bg-slate-700 rounded-md">بستن</button>
            </div>
        </div>
    );
};

const AiCoachModal: React.FC<{
    goal: UserGoal;
    onClose: () => void;
    onConvertToJourney: (goal: UserGoal) => void;
    onAddHabits: (habits: string[], goalId: string) => void;
    isConverting: boolean;
}> = ({ goal, onClose, onConvertToJourney, isConverting }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-violet-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-violet-400"/>
                </div>
                <h3 className="font-bold mb-2">کوچ هوشمند</h3>
                <p className="text-sm text-slate-400 mb-6">برای هدف "{goal.title}" چه کمکی نیاز دارید؟</p>
                
                <div className="space-y-3">
                     <button onClick={() => onConvertToJourney(goal)} disabled={isConverting} className="w-full py-3 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2">
                        <JourneyIcon className="w-5 h-5"/>
                        {isConverting ? 'در حال تبدیل...' : 'تبدیل به سفر (Journey)'}
                    </button>
                </div>
                 <button onClick={onClose} className="mt-4 text-slate-500 text-sm hover:text-slate-300">بستن</button>
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

    const handleUpdateKR = (goalId: string, krIndex: number, newValue: number) => {
        const updatedGoals = goals.map(g => {
            if (g.id === goalId && g.keyResults) {
                const newKRs = [...g.keyResults];
                newKRs[krIndex] = { ...newKRs[krIndex], current: newValue };
                
                // Recalculate total progress
                const totalProgress = newKRs.reduce((sum, kr) => {
                     const krProgress = Math.min(100, Math.max(0, ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100));
                     return sum + krProgress;
                }, 0) / newKRs.length;
                
                 return { ...g, keyResults: newKRs, progress: Math.round(totalProgress) };
            }
            return g;
        });
        onUpdateUserData({ ...userData, goals: updatedGoals });
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

            {/* Toolbar */}
             <div className="flex justify-between items-center mb-4 overflow-x-auto pb-2">
                <div className="flex items-center gap-2">
                     <span className="text-sm text-slate-400 whitespace-nowrap">مرتب‌سازی:</span>
                     <SortButton sortKey="progress" label="پیشرفت" icon={ChartBarIcon} />
                     <SortButton sortKey="targetDate" label="تاریخ" icon={CalendarIcon} />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsChallengeModalOpen(true)} className="p-2 bg-slate-800 rounded-full text-yellow-400 hover:bg-slate-700">
                        <FlagIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsKeywordGeneratorOpen(true)} className="p-2 bg-slate-800 rounded-full text-violet-400 hover:bg-slate-700">
                         <SparklesIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsCreating(true)} className="p-2 bg-[var(--color-primary-600)] rounded-full text-white hover:bg-[var(--color-primary-700)] shadow-lg">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Goal List */}
            <div className="space-y-4">
                {sortedGoals.length === 0 ? (
                     <div className="text-center py-10 text-slate-500">
                        <TargetIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>هنوز هدفی ندارید. با دکمه + شروع کنید!</p>
                     </div>
                ) : (
                    sortedGoals.map(goal => {
                        const Icon = goalIcons[goal.icon] || TargetIcon;
                        return (
                         <div key={goal.id} className="bg-slate-800/50 border border-slate-700 rounded-[var(--radius-card)] p-4 relative group">
                            {/* Goal Card Content */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if(goal.type==='journey') { setSelectedGoal(goal); setView('detail'); } else { setIsEditing(goal); } }}>
                                     <div className="p-2 rounded-lg bg-slate-700 text-violet-400">
                                         <Icon className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-lg">{goal.title}</h3>
                                         {goal.targetDate && <div className="text-xs text-slate-400 flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> {new Date(goal.targetDate).toLocaleDateString('fa-IR')}</div>}
                                     </div>
                                </div>
                                <div className="flex gap-1">
                                     <button onClick={() => setAiCoachModal(goal)} className="p-1.5 text-violet-400 hover:bg-slate-700 rounded-full"><SparklesIcon className="w-4 h-4"/></button>
                                     <button onClick={() => handleShareGoal(goal)} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-full"><ShareIcon className="w-4 h-4"/></button>
                                     <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            {goal.type === 'okr' && goal.keyResults && (
                                <div className="space-y-2 mb-3">
                                    {goal.keyResults.map((kr, idx) => (
                                        <div key={kr.id} className="text-xs text-slate-300 flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                                            <span>{kr.title}</span>
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="number" 
                                                    value={kr.current} 
                                                    onChange={(e) => handleUpdateKR(goal.id, idx, Number(e.target.value))}
                                                    className="w-12 bg-slate-700 rounded text-center text-white outline-none"
                                                />
                                                <span className="text-slate-500">/ {kr.target} {kr.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex-grow bg-slate-700 rounded-full h-2.5 cursor-pointer relative" onClick={() => {
                                    const newP = prompt("درصد پیشرفت جدید (0-100):", goal.progress.toString());
                                    if(newP !== null && !isNaN(Number(newP))) handleProgressChange(goal.id, Math.min(100, Math.max(0, Number(newP))));
                                }}>
                                    <div className="bg-violet-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${goal.progress}%` }}></div>
                                </div>
                                <span className="text-xs font-bold w-8 text-right">{goal.progress}%</span>
                            </div>
                            
                            {goal.pomodorosToComplete && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>{goal.pomodorosCompleted || 0} / {goal.pomodorosToComplete} پومودورو</span>
                                </div>
                            )}
                         </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default GoalsView;

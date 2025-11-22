
import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, UserGoal, JourneyMilestone, Habit, KeyResult, SmartCriteria } from '../types';
import { goalIcons, PlusIcon, PencilIcon, TrashIcon, ShareIcon, SparklesIcon, JourneyIcon, CheckCircleIcon, TargetIcon, CalendarIcon, ClockIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon, FlagIcon, HabitsIcon, XMarkIcon, MoonIcon, Squares2X2Icon, QueueListIcon } from './icons';
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
                progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: 0 }],
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><SparklesIcon className="w-6 h-6 text-violet-400"/> ساخت هدف با هوش مصنوعی</h2>
                <p className="text-sm text-slate-400 mb-4">چند کلمه کلیدی بنویسید تا یک هدف هوشمند (SMART) برای شما بسازم.</p>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="مثلا: یادگیری گیتار، کاهش وزن..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:bg-slate-700 transition-colors">لغو</button>
                    <button onClick={handleGenerate} disabled={isLoading || !keywords.trim()} className="flex-1 py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-colors disabled:bg-slate-700 flex justify-center items-center gap-2">
                        {isLoading ? <SparklesIcon className="w-5 h-5 animate-spin"/> : 'ساختن'}
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
}> = ({ goal, onSave, onClose, availableHabits = [], onGenerateJourney }) => {
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white">{goal ? 'ویرایش هدف' : 'هدف جدید'}</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="عنوان هدف یا رویای شما..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    
                     {/* AI Generation Options */}
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} disabled={isGenerating || !title.trim()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-900/30 border border-violet-500/30 text-violet-300 rounded-lg text-sm hover:bg-violet-900/50 transition-colors disabled:opacity-50">
                            <SparklesIcon className="w-4 h-4"/>
                            {isGenerating ? '...' : 'تبدیل به سفر (Journey)'}
                        </button>
                         <button onClick={handleMakeSmart} disabled={isGenerating || !title.trim()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-900/30 border border-blue-500/30 text-blue-300 rounded-lg text-sm hover:bg-blue-900/50 transition-colors disabled:opacity-50">
                            <TargetIcon className="w-4 h-4"/>
                            {isGenerating ? '...' : 'تبدیل به SMART'}
                        </button>
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setIsOKR(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!isOKR ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}>ساده</button>
                        <button onClick={() => setIsOKR(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${isOKR ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}>OKR</button>
                    </div>
                    
                    {isOKR ? (
                         <div className="space-y-3">
                            <p className="text-xs text-slate-400 px-1">نتایج کلیدی (Key Results) قابل اندازه‌گیری تعریف کنید.</p>
                            {keyResults.map((kr, index) => (
                                <div key={index} className="bg-slate-800 p-3 rounded-xl space-y-2 border border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <input type="text" placeholder="عنوان نتیجه کلیدی" value={kr.title} onChange={(e) => updateKR(index, 'title', e.target.value)} className="w-full bg-transparent text-sm border-b border-slate-600 focus:border-violet-500 outline-none pb-1 text-white"/>
                                        {keyResults.length > 1 && <button onClick={() => removeKR(index)} className="text-slate-500 hover:text-red-400 ml-2"><TrashIcon className="w-4 h-4"/></button>}
                                    </div>
                                    <div className="flex gap-2 text-xs">
                                        <div className="flex-1">
                                            <label className="block text-slate-500 mb-1">شروع</label>
                                            <input type="number" value={kr.baseline} onChange={(e) => updateKR(index, 'baseline', Number(e.target.value))} className="w-full bg-slate-700 rounded p-1 text-white text-center"/>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-slate-500 mb-1">هدف</label>
                                            <input type="number" value={kr.target} onChange={(e) => updateKR(index, 'target', Number(e.target.value))} className="w-full bg-slate-700 rounded p-1 text-white text-center"/>
                                        </div>
                                         <div className="flex-1">
                                            <label className="block text-slate-500 mb-1">واحد</label>
                                            <input type="text" value={kr.unit} onChange={(e) => updateKR(index, 'unit', e.target.value)} className="w-full bg-slate-700 rounded p-1 text-white text-center" placeholder="%"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addKR} className="w-full py-3 border border-dashed border-slate-600 text-slate-400 rounded-xl hover:bg-slate-800 text-sm flex items-center justify-center gap-1 transition-colors">
                                <PlusIcon className="w-4 h-4"/> افزودن نتیجه کلیدی
                            </button>
                         </div>
                    ) : (
                        <>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 font-bold">تاریخ هدف (اختیاری)</label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 font-bold">پومودورو برای تکمیل</label>
                                <input
                                    type="number"
                                    value={pomodorosToComplete || ''}
                                    onChange={(e) => setPomodorosToComplete(Number(e.target.value))}
                                    min="0"
                                    placeholder="مثلا: ۱۰"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                        </div>
                        {(availableHabits && availableHabits.length > 0) && (
                            <div className="space-y-2 pt-4 border-t border-slate-800">
                                <h4 className="font-bold text-sm text-slate-300">عادت‌های مرتبط</h4>
                                 <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-800/50 p-2 rounded-xl">
                                    {availableHabits.map(habitName => (
                                        <label key={habitName} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={linkedHabits.includes(habitName)}
                                                onChange={() => toggleLinkedHabit(habitName)}
                                                className="w-4 h-4 rounded text-violet-600 bg-slate-700 border-slate-600 focus:ring-violet-500"
                                            />
                                            <span className="text-sm text-slate-200">{habitName}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        </>
                    )}
                    
                    <div>
                        <label className="text-xs text-slate-400 block mb-2 font-bold">آیکون</label>
                        <div className="grid grid-cols-6 gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                            {Object.entries(goalIcons).map(([key, Icon]) => (
                                <button key={key} type="button" onClick={() => setIcon(key)} className={`p-2 rounded-lg flex items-center justify-center aspect-square transition-all ${icon === key ? 'bg-violet-600 text-white shadow-lg scale-110' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
                                    <Icon className="w-6 h-6" />
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
                <div className="mt-8 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:bg-slate-700 transition-colors">لغو</button>
                    <button onClick={handleSaveSimpleOrOKR} className="flex-1 py-3 bg-violet-600 rounded-xl font-bold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/20">ذخیره</button>
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
        <div className="h-full flex flex-col animate-fadeIn bg-[#020617]">
            <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onBack} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <ArrowUpIcon className="w-6 h-6 rotate-90"/>
                </button>
                <h2 className="font-bold text-lg text-white">مسیر سفر</h2>
            </div>

            <div className="flex-grow overflow-y-auto p-6 pb-32">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8 text-center">
                    <div className="w-20 h-20 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-500/30">
                        <Icon className="w-10 h-10 text-violet-400"/>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">{journey.title}</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">{journey.description}</p>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="bg-violet-500 h-full rounded-full transition-all duration-500 relative" style={{ width: `${journey.progress}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-center text-xs font-bold mt-2 text-violet-300">{journey.progress}% پیشرفت</p>
                </div>
                
                <div className="relative pl-4 md:pl-10 border-r-2 border-slate-800 space-y-12 mr-4">
                    {(journey.milestones || []).map((milestone, index) => {
                        const totalTasks = milestone.tasks.length;
                        const completedTasks = milestone.tasks.filter(t => t.completed).length;
                        const milestoneProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        const isMilestoneCompleted = milestoneProgress === 100;

                        return (
                            <div key={milestone.id} className="relative">
                                <div className={`absolute top-6 -right-[25px] w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#020617] transition-all duration-500 ${isMilestoneCompleted ? 'bg-violet-500 scale-110' : 'bg-slate-700'}`}>
                                    {isMilestoneCompleted && <CheckCircleIcon className="w-3 h-3 text-white"/>}
                                </div>
                                
                                <div className={`p-5 rounded-2xl border transition-all duration-300 ${isMilestoneCompleted ? 'bg-violet-900/10 border-violet-500/30' : 'bg-slate-800/40 border-slate-700'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-lg ${isMilestoneCompleted ? 'text-violet-300' : 'text-slate-200'}`}>{milestone.title}</h3>
                                        <span className="text-xs font-mono text-slate-500">M{index+1}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">{milestone.description}</p>
                                    
                                    <div className="space-y-2">
                                        {milestone.tasks.map(task => (
                                            <label key={task.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-violet-600 border-violet-600' : 'border-slate-600 group-hover:border-violet-400'}`}>
                                                    {task.completed && <CheckCircleIcon className="w-3.5 h-3.5 text-white"/>}
                                                </div>
                                                <input type="checkbox" checked={task.completed} onChange={() => handleTaskToggle(milestone.id, task.id)} className="hidden"/>
                                                <span className={`text-sm transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-4 text-white flex items-center gap-2"><HabitsIcon className="w-5 h-5 text-green-400"/> پیشنهاد عادت</h3>
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        <SparklesIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500"/>
                        هوش مصنوعی در حال فکر کردن...
                    </div>
                ) : (
                    <div className="space-y-2">
                        {suggestions.map(h => (
                            <div key={h} onClick={() => toggle(h)} className={`p-3 rounded-xl cursor-pointer border transition-all flex justify-between items-center ${selected.includes(h) ? 'bg-violet-900/30 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                <span>{h}</span>
                                {selected.includes(h) && <CheckCircleIcon className="w-4 h-4 text-violet-400"/>}
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-400 hover:bg-slate-700">لغو</button>
                    <button onClick={() => onAddHabits(selected)} disabled={selected.length === 0} className="flex-[2] py-2 bg-violet-600 rounded-lg font-bold text-white hover:bg-violet-500 disabled:opacity-50">افزودن به عادت‌ها</button>
                </div>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                    <SparklesIcon className="w-8 h-8 text-violet-400"/>
                </div>
                <h3 className="font-bold text-lg text-white mb-2">کوچ هوشمند</h3>
                <p className="text-sm text-slate-400 mb-6">برای هدف "{goal.title}" چه کمکی نیاز دارید؟</p>
                
                <div className="space-y-3">
                     <button onClick={() => onConvertToJourney(goal)} disabled={isConverting} className="w-full py-3 bg-blue-600/10 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-600/20 transition-colors flex items-center justify-center gap-2 font-bold">
                        <JourneyIcon className="w-5 h-5"/>
                        {isConverting ? 'در حال تبدیل...' : 'تبدیل به سفر (Journey)'}
                    </button>
                </div>
                 <button onClick={onClose} className="mt-6 text-slate-500 text-sm hover:text-slate-300">بستن</button>
            </div>
        </div>
    );
};

// --- MAIN VIEW ---

type Tab = 'grid' | 'journey' | 'focus' | 'calendar' | 'new';

interface GoalsViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    addXp: (amount: number) => void;
    onClose: () => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ userData, onUpdateUserData, addXp, onClose }) => {
    const goals = userData.goals || [];
    const habits = userData.habits || [];
    const availableHabits = habits.map(h => h.name);

    const [activeTab, setActiveTab] = useState<Tab>('grid');
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<UserGoal | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'progress' | 'targetDate' | 'manual', direction: 'asc' | 'desc' }>({ key: 'manual', direction: 'asc' });
    
    const [isHabitModalOpen, setIsHabitModalOpen] = useState<UserGoal | null>(null);
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
        setActiveTab('grid');
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
            const updatedGoals = goals.map(g => g.id === goalToConvert.id ? { ...newJourney, id: g.id, title: g.title } : g);
            onUpdateUserData({ ...userData, goals: updatedGoals });
            setAiCoachModal(null); 
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

    const NavButton: React.FC<{ id: Tab; label: string; icon: React.FC<{className?: string}> }> = ({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
            <button 
                onClick={() => {
                    if(id === 'new') setIsCreating(true);
                    else setActiveTab(id);
                }}
                className={`flex flex-col items-center justify-center w-full py-3 gap-1.5 transition-all relative group ${isActive ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-violet-500/20 -translate-y-3 shadow-lg shadow-violet-900/20 ring-1 ring-violet-500/50' : 'bg-transparent group-hover:bg-white/5'}`}>
                    <Icon className={`w-7 h-7 ${isActive ? 'fill-current' : ''}`} />
                </div>
                <span className={`text-xs font-bold absolute bottom-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{label}</span>
            </button>
        );
    };

    if (selectedGoal) {
        return <JourneyDetailView journey={selectedGoal} onBack={() => setSelectedGoal(null)} onUpdateJourney={(updated) => { onUpdateUserData({...userData, goals: goals.map(g => g.id === updated.id ? updated : g)}); setSelectedGoal(updated); }} addXp={addXp} />
    }
    
    return (
        <div className="fixed inset-0 z-50 bg-[#020617] text-slate-200 font-[Vazirmatn] flex flex-col overflow-hidden animate-fadeIn">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Modals */}
            {(isCreating || isEditing) && <GoalFormModal goal={isEditing} onClose={() => {setIsCreating(false); setIsEditing(null);}} onSave={handleSaveGoal} availableHabits={availableHabits} onGenerateJourney={handleGenerateJourney} />}
            {isHabitModalOpen && <HabitSuggestionModal goal={isHabitModalOpen} onAddHabits={(habits) => { handleAddHabits(habits, isHabitModalOpen.id); setIsHabitModalOpen(null); }} onClose={() => setIsHabitModalOpen(null)}/>}
            {aiCoachModal && <AiCoachModal goal={aiCoachModal} onClose={() => setAiCoachModal(null)} onConvertToJourney={handleConvertToJourney} onAddHabits={handleAddHabits} isConverting={isConvertingToJourney === aiCoachModal.id} />}
            {isKeywordGeneratorOpen && <KeywordGoalGeneratorModal onSave={handleSaveGoal} onClose={() => setIsKeywordGeneratorOpen(false)} />}

            {/* Header */}
            <div className="relative z-10 px-6 pt-6 pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">صفحه شطرنج</h2>
                    <p className="text-xs text-violet-500 font-bold uppercase tracking-widest opacity-80">Goals & Strategy</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsKeywordGeneratorOpen(true)} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-violet-400 transition-all" title="ساخت با هوش مصنوعی">
                        <SparklesIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setIsCreating(true)} className="p-2 rounded-full bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/20 transition-all">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto px-4 pb-32 relative z-10 scrollbar-hide">
                {activeTab === 'grid' && (
                    <div className="grid grid-cols-1 gap-4">
                        {sortedGoals.length === 0 && (
                            <div className="text-center py-12 opacity-50">
                                <Squares2X2Icon className="w-16 h-16 mx-auto mb-2 text-slate-600"/>
                                <p>هیچ مهره‌ای روی صفحه نیست.</p>
                            </div>
                        )}
                        {sortedGoals.map(goal => {
                            const Icon = goalIcons[goal.icon] || TargetIcon;
                            return (
                                <div key={goal.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 relative group hover:bg-slate-800/60 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { if(goal.type==='journey') { setSelectedGoal(goal); } else { setIsEditing(goal); } }}>
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-violet-300 shadow-inner border border-white/5">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white">{goal.title}</h3>
                                                {goal.targetDate && <div className="text-xs text-slate-400 flex items-center gap-1 mt-1"><CalendarIcon className="w-3 h-3"/> {new Date(goal.targetDate).toLocaleDateString('fa-IR')}</div>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setAiCoachModal(goal)} className="p-1.5 text-violet-400 hover:bg-slate-700 rounded-lg"><SparklesIcon className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>

                                    {goal.type === 'okr' && goal.keyResults && (
                                        <div className="space-y-2 mb-4">
                                            {goal.keyResults.slice(0, 2).map((kr, idx) => (
                                                <div key={kr.id} className="flex justify-between items-center text-xs text-slate-300 bg-black/20 p-1.5 rounded-lg">
                                                    <span>{kr.title}</span>
                                                    <div className="flex gap-1">
                                                        <input 
                                                            type="number" 
                                                            value={kr.current} 
                                                            onChange={(e) => handleUpdateKR(goal.id, idx, Number(e.target.value))}
                                                            className="w-10 bg-slate-700 rounded text-center text-white outline-none"
                                                        />
                                                        <span className="opacity-50">/ {kr.target}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className="flex-grow bg-slate-700 rounded-full h-2.5 cursor-pointer relative overflow-hidden" onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const percentage = Math.round((x / rect.width) * 100);
                                            if (confirm(`پیشرفت را روی ${percentage}٪ تنظیم می‌کنید؟`)) {
                                                handleProgressChange(goal.id, percentage);
                                            }
                                        }}>
                                            <div className="bg-violet-500 h-full rounded-full transition-all duration-500 relative" style={{ width: `${goal.progress}%` }}>
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold w-8 text-right text-violet-300">{goal.progress}%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                
                {activeTab === 'journey' && (
                    <div className="text-center py-20 opacity-50">
                        <p>نمای سفرها (Journeys) به زودی...</p>
                    </div>
                )}
                
                {activeTab === 'calendar' && (
                    <div className="text-center py-20 opacity-50">
                        <p>نمای زمانی (Timeline) به زودی...</p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation Bar - Enhanced */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
                <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/20 rounded-[2rem] p-3 shadow-2xl flex items-center justify-between px-6">
                    <NavButton id="grid" label="اهداف" icon={Squares2X2Icon} />
                    <NavButton id="journey" label="سفرها" icon={JourneyIcon} />
                    
                    {/* Center Exit Button */}
                    <button 
                        onClick={onClose}
                        className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-105 -mt-8 relative z-10"
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>

                    <NavButton id="focus" label="تمرکز" icon={MoonIcon} />
                    <NavButton id="calendar" label="زمان‌بندی" icon={QueueListIcon} />
                </div>
            </div>
        </div>
    );
};

export default GoalsView;

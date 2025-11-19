
import React, { useState } from 'react';
import { OnboardingData, MicroCourse, MicroCourseDay } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
    AcademicCapIcon, PlusIcon, SparklesIcon, TrashIcon, 
    CheckCircleIcon, ArrowLeftIcon, LockClosedIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MicroCourseViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const MicroCourseView: React.FC<MicroCourseViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [courses, setCourses] = useState<MicroCourse[]>(userData.microCourses || []);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newCourseGoal, setNewCourseGoal] = useState('');
    const [newCourseDuration, setNewCourseDuration] = useState(7);
    const [isGenerating, setIsGenerating] = useState(false);

    const activeCourse = courses.find(c => c.id === activeCourseId);

    const handleCreateCourse = async () => {
        if (!newCourseGoal.trim()) return;
        setIsGenerating(true);

        const prompt = `
            SYSTEM:
            You are an AI course designer creating 7–14 day micro-learning paths based on a single user goal.

            TASK:
            Given a goal: "${newCourseGoal}", generate a ${newCourseDuration}-day micro-course.

            Each day includes:
            - skill focus
            - micro-lesson (<100 words, Persian)
            - challenge (actionable)
            - reflection question

            Language: Persian.
            Format: JSON.

            SCHEMA:
            {
            "courseTitle": "string",
            "days": [
                {
                "day": 1,
                "focus": "string",
                "lesson": "string",
                "challenge": "string",
                "reflection": "string"
                }
            ]
            }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            courseTitle: { type: Type.STRING },
                            days: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        day: { type: Type.NUMBER },
                                        focus: { type: Type.STRING },
                                        lesson: { type: Type.STRING },
                                        challenge: { type: Type.STRING },
                                        reflection: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const result = JSON.parse(response.text.trim());
            
            const newCourse: MicroCourse = {
                id: `course-${Date.now()}`,
                title: result.courseTitle,
                goal: newCourseGoal,
                days: result.days.map((d: any) => ({ ...d, completed: false })),
                progress: 0,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            const updatedCourses = [...courses, newCourse];
            setCourses(updatedCourses);
            onUpdateUserData({ ...userData, microCourses: updatedCourses });
            
            setIsCreating(false);
            setNewCourseGoal('');
            setActiveCourseId(newCourse.id);

        } catch (e) {
            console.error(e);
            alert("خطا در ساخت دوره. لطفا دوباره تلاش کنید.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCompleteDay = (courseId: string, dayNum: number, reflection: string) => {
        const updatedCourses = courses.map(c => {
            if (c.id === courseId) {
                const updatedDays = c.days.map(d => {
                    if (d.day === dayNum) {
                        return { ...d, completed: true, userReflection: reflection };
                    }
                    return d;
                });
                const completedCount = updatedDays.filter(d => d.completed).length;
                const progress = Math.round((completedCount / updatedDays.length) * 100);
                const status: 'active' | 'completed' = progress === 100 ? 'completed' : 'active';
                return { ...c, days: updatedDays, progress, status };
            }
            return c;
        });
        setCourses(updatedCourses);
        onUpdateUserData({ ...userData, microCourses: updatedCourses });
    };

    const handleDeleteCourse = (id: string) => {
        if (window.confirm("آیا از حذف این دوره مطمئن هستید؟")) {
             const updatedCourses = courses.filter(c => c.id !== id);
             setCourses(updatedCourses);
             onUpdateUserData({ ...userData, microCourses: updatedCourses });
             if (activeCourseId === id) setActiveCourseId(null);
        }
    };

    // --- Render Helpers ---

    const renderCourseList = () => (
        <div className="space-y-4 animate-fadeIn">
             <div className="flex justify-between items-center pb-2">
                <h2 className="text-xl font-bold text-white">دوره‌های من</h2>
                <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-700 rounded-xl">
                    <AcademicCapIcon className="w-16 h-16 text-slate-600 mx-auto mb-3"/>
                    <p className="text-slate-400 mb-4">هنوز دوره‌ای نساخته‌ای. یک مهارت یا هدف انتخاب کن تا برایت دوره بسازم!</p>
                    <button onClick={() => setIsCreating(true)} className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-full font-bold transition-colors">
                        ساخت دوره جدید
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {courses.map(course => (
                        <div key={course.id} onClick={() => setActiveCourseId(course.id)} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-700/80 transition-all relative group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white">{course.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${course.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-violet-500/20 text-violet-300'}`}>
                                    {course.status === 'completed' ? 'تکمیل شده' : 'در حال یادگیری'}
                                </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                                <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${course.progress}%` }}></div>
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-slate-400">
                                <span>{course.days.filter(d => d.completed).length} / {course.days.length} روز</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} className="absolute bottom-4 left-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setIsCreating(true)} className="w-full py-3 border-2 border-dashed border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5"/>
                        <span>ساخت دوره جدید</span>
                    </button>
                </div>
            )}
        </div>
    );

    const renderCreateView = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">ساخت دوره میکرو</h3>
            <p className="text-sm text-slate-400">چه مهارت یا عادتی را می‌خواهید در روزهای آینده یاد بگیرید؟</p>
            
            <input 
                type="text" 
                placeholder="مثلا: سحرخیز شدن، یادگیری پایتون، مدیریت استرس..." 
                value={newCourseGoal}
                onChange={(e) => setNewCourseGoal(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-violet-500 outline-none"
            />

            <div>
                <label className="text-sm text-slate-400 mb-2 block">مدت زمان دوره</label>
                <div className="flex gap-2">
                    {[7, 10, 14].map(d => (
                        <button 
                            key={d} 
                            onClick={() => setNewCourseDuration(d)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${newCourseDuration === d ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            {d} روز
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={() => setIsCreating(false)} className="flex-1 py-2 bg-slate-700 rounded-lg">لغو</button>
                <button onClick={handleCreateCourse} disabled={!newCourseGoal || isGenerating} className="flex-1 py-2 bg-violet-600 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {isGenerating ? <SparklesIcon className="w-4 h-4 animate-spin"/> : null}
                    {isGenerating ? 'در حال طراحی...' : 'بساز'}
                </button>
            </div>
        </div>
    );

    const DayDetail: React.FC<{ day: MicroCourseDay; isLocked: boolean; onComplete: (reflection: string) => void }> = ({ day, isLocked, onComplete }) => {
        const [reflection, setReflection] = useState('');
        const [isOpen, setIsOpen] = useState(false);

        if (isLocked) {
            return (
                <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 font-bold">{day.day}</span>
                        <span className="text-slate-400">روز {day.day}</span>
                    </div>
                    <LockClosedIcon className="w-5 h-5 text-slate-500"/>
                </div>
            );
        }

        return (
            <div className={`border rounded-xl transition-all overflow-hidden ${day.completed ? 'bg-slate-800/40 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                <div onClick={() => setIsOpen(!isOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50">
                     <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${day.completed ? 'bg-green-500 text-white' : 'bg-violet-600 text-white'}`}>
                            {day.completed ? <CheckCircleIcon className="w-5 h-5"/> : day.day}
                        </span>
                        <div>
                            <h4 className="font-bold text-white text-sm">{day.focus}</h4>
                            {day.completed && <span className="text-xs text-green-400">تکمیل شده</span>}
                        </div>
                    </div>
                    <span className="text-slate-400 text-xs">{isOpen ? 'بستن' : 'مشاهده'}</span>
                </div>

                {isOpen && (
                    <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 space-y-4 animate-fadeIn">
                        <div className="text-sm text-slate-300 leading-relaxed">
                            <p className="font-bold text-violet-300 mb-1">درس امروز:</p>
                            {day.lesson}
                        </div>
                        <div className="bg-violet-900/20 p-3 rounded-lg border border-violet-500/20">
                            <p className="font-bold text-violet-300 text-sm mb-1">چالش:</p>
                            <p className="text-sm text-slate-200">{day.challenge}</p>
                        </div>
                        
                        {!day.completed ? (
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 block">{day.reflection}</label>
                                <textarea 
                                    value={reflection}
                                    onChange={(e) => setReflection(e.target.value)}
                                    placeholder="پاسخ خود را بنویسید..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                    rows={2}
                                />
                                <button 
                                    onClick={() => onComplete(reflection)}
                                    disabled={!reflection.trim()}
                                    className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    تکمیل روز {day.day}
                                </button>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic bg-slate-800/50 p-2 rounded">
                                <span className="block font-bold text-xs not-italic text-slate-500 mb-1">بازتاب شما:</span>
                                "{day.userReflection}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderActiveCourse = () => {
        if (!activeCourse) return null;

        // Determine locked state: Day N is locked if Day N-1 is not completed
        return (
            <div className="space-y-4 animate-fadeIn h-full flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                     <button onClick={() => setActiveCourseId(null)} className="text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{activeCourse.title}</h2>
                    <div className="w-6"></div> {/* Spacer */}
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                    {activeCourse.days.map((day, index) => {
                        const isLocked = index > 0 && !activeCourse.days[index - 1].completed;
                        return (
                            <DayDetail 
                                key={day.day} 
                                day={day} 
                                isLocked={isLocked} 
                                onComplete={(reflection) => handleCompleteDay(activeCourse.id, day.day, reflection)} 
                            />
                        );
                    })}
                    
                    {activeCourse.status === 'completed' && (
                         <div className="bg-yellow-500/20 border border-yellow-500/50 p-6 rounded-xl text-center animate-celebrate">
                            <AcademicCapIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2"/>
                            <h3 className="text-xl font-bold text-yellow-300">تبریک!</h3>
                            <p className="text-sm text-yellow-200/80">شما این دوره را با موفقیت به پایان رساندید.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-[var(--radius-card)] p-5 w-full max-w-md h-[85vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                {activeCourseId ? renderActiveCourse() : (isCreating ? renderCreateView() : renderCourseList())}
            </div>
        </div>
    );
};

export default MicroCourseView;

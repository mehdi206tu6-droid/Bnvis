
import React, { useState, useEffect } from 'react';
import { OnboardingData, SocialCircle, CircleMember, CircleSummaryData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
    UserCircleIcon, ShareIcon, SparklesIcon, PlusIcon, TrophyIcon, 
    ChatBubbleOvalLeftEllipsisIcon, ArrowPathIcon, ArrowLeftIcon, 
    TrashIcon, FireIcon, UserIcon, StarIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SocialCirclesViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const SocialCirclesView: React.FC<SocialCirclesViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [circles, setCircles] = useState<SocialCircle[]>(userData.socialCircles || []);
    const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Creation State
    const [newCircleName, setNewCircleName] = useState('');
    const [newMembers, setNewMembers] = useState<string[]>([]);
    const [tempMemberName, setTempMemberName] = useState('');

    // Active Circle State
    const activeCircle = circles.find(c => c.id === activeCircleId);
    const [memberUpdates, setMemberUpdates] = useState<Record<string, string>>({}); // map memberId -> update text
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    useEffect(() => {
        // Sync local state with userData
        if (userData.socialCircles) {
            setCircles(userData.socialCircles);
        }
    }, [userData.socialCircles]);

    const handleCreateCircle = () => {
        if (!newCircleName.trim()) return;
        
        const newCircle: SocialCircle = {
            id: `circle-${Date.now()}`,
            name: newCircleName,
            members: [
                { id: 'me', name: userData.fullName, score: userData.xp }, // Current User
                ...newMembers.map((name, idx) => ({ id: `mem-${Date.now()}-${idx}`, name, score: 0 }))
            ],
            summaries: []
        };
        
        const updatedCircles = [...circles, newCircle];
        onUpdateUserData({ ...userData, socialCircles: updatedCircles });
        
        // Reset form
        setNewCircleName('');
        setNewMembers([]);
        setIsCreating(false);
        setActiveCircleId(newCircle.id);
    };

    const handleAddMemberName = () => {
        if (tempMemberName.trim()) {
            setNewMembers([...newMembers, tempMemberName.trim()]);
            setTempMemberName('');
        }
    };

    const handleUpdateMemberScore = (circleId: string, memberId: string, delta: number) => {
        const updatedCircles = circles.map(c => {
            if (c.id === circleId) {
                const updatedMembers = c.members.map(m => {
                    if (m.id === memberId) {
                        return { ...m, score: Math.max(0, m.score + delta) };
                    }
                    return m;
                });
                return { ...c, members: updatedMembers };
            }
            return c;
        });
        onUpdateUserData({ ...userData, socialCircles: updatedCircles });
    };

    const handleUpdateTextChange = (memberId: string, text: string) => {
        setMemberUpdates(prev => ({ ...prev, [memberId]: text }));
    };

    const handleGenerateSummary = async () => {
        if (!activeCircle) return;
        setIsGeneratingSummary(true);

        const updatesList = activeCircle.members.map(m => {
            const update = memberUpdates[m.id] || "No update provided.";
            return `- Member: ${m.name}, Update: ${update}`;
        }).join('\n');

        const prompt = `
            SYSTEM:
            You are an advanced social-behavior AI specialized in creating highly motivating micro-communities for goal achievement. 
            Generate supportive, psychologically-safe, non-judgmental content that increases accountability and sustained motivation.

            TASK:
            Generate a weekly "Circle Summary" for a small group. 
            The output must include:
            1. Collective progress summary
            2. Individual highlights
            3. Positive reinforcement messages
            4. Group challenge for next week
            5. Tone: Empathetic, friendly, deeply motivating. Persian Language.

            INPUT:
            Group Name: ${activeCircle.name}
            Member Updates:
            ${updatesList}

            FORMAT: Return only JSON.

            JSON SCHEMA:
            {
            "groupProgress": "string",
            "memberHighlights": [
                {
                "name": "string",
                "wins": ["string"],
                "growthOpportunities": ["string"]
                }
            ],
            "nextWeekChallenge": "string",
            "motivationMessage": "string"
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
                            groupProgress: { type: Type.STRING },
                            memberHighlights: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        wins: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        growthOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    }
                                }
                            },
                            nextWeekChallenge: { type: Type.STRING },
                            motivationMessage: { type: Type.STRING }
                        }
                    }
                }
            });

            const summaryData: CircleSummaryData = JSON.parse(response.text.trim());
            
            const newSummary = {
                date: new Date().toISOString(),
                data: summaryData
            };

            const updatedCircles = circles.map(c => {
                if (c.id === activeCircle.id) {
                    return { ...c, summaries: [newSummary, ...c.summaries] };
                }
                return c;
            });
            
            onUpdateUserData({ ...userData, socialCircles: updatedCircles });
            setMemberUpdates({}); // Clear inputs
            
        } catch (error) {
            console.error("Summary generation failed", error);
            alert("خطا در تولید خلاصه. لطفا دوباره تلاش کنید.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleShareSummary = async (summary: CircleSummaryData) => {
        const text = `
🌟 خلاصه هفتگی حلقه ${activeCircle?.name} 🌟

${summary.groupProgress}

🏆 هایلایت‌ها:
${summary.memberHighlights.map(h => `- ${h.name}: ${h.wins.join(', ')}`).join('\n')}

🔥 چالش هفته بعد:
${summary.nextWeekChallenge}

💪 ${summary.motivationMessage}

#BenvisLifeOS
        `;

        if (navigator.share) {
            await navigator.share({ title: `خلاصه حلقه ${activeCircle?.name}`, text });
        } else {
            await navigator.clipboard.writeText(text);
            alert("متن خلاصه کپی شد!");
        }
    };

    const handleInvite = async () => {
        const text = `سلام! من یک حلقه پشتیبانی در اپلیکیشن Benvis ساختم به نام "${activeCircle?.name}". دوست دارم تو هم عضو بشی تا با هم پیشرفت کنیم.`;
         if (navigator.share) {
            await navigator.share({ title: 'دعوت به حلقه', text });
        } else {
            await navigator.clipboard.writeText(text);
            alert("متن دعوت کپی شد!");
        }
    };

    const handleDeleteCircle = (id: string) => {
        if (confirm("آیا مطمئنید که می‌خواهید این حلقه را حذف کنید؟")) {
            const updatedCircles = circles.filter(c => c.id !== id);
            onUpdateUserData({ ...userData, socialCircles: updatedCircles });
            if (activeCircleId === id) setActiveCircleId(null);
        }
    };

    // --- RENDERERS ---

    const renderCreateView = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-violet-500/30 rotate-3">
                    <PlusIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">تاسیس قبیله جدید</h3>
                <p className="text-sm text-slate-400 mt-1">یک نام جذاب انتخاب کنید و دوستانتان را اضافه کنید.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 mr-1 mb-1.5 block">نام حلقه</label>
                    <input 
                        type="text" 
                        placeholder="مثلا: سحرخیزان، تیم آلفا..." 
                        value={newCircleName}
                        onChange={(e) => setNewCircleName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-inner"
                    />
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-400 mr-1 mb-1.5 block">هم‌قبیله‌ای‌ها</label>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            placeholder="نام عضو جدید" 
                            value={tempMemberName}
                            onChange={(e) => setTempMemberName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMemberName()}
                            className="flex-grow bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none text-white"
                        />
                        <button onClick={handleAddMemberName} className="bg-slate-700 hover:bg-slate-600 px-4 rounded-xl text-white transition-colors">
                            <PlusIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-violet-500">
                            <UserIcon className="w-3 h-3"/>
                            {userData.fullName || 'من'}
                        </span>
                        {newMembers.map((m, i) => (
                            <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-slate-700">
                                {m}
                                <button onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors">&times;</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-6">
                <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">لغو</button>
                <button onClick={handleCreateCircle} disabled={!newCircleName} className="flex-[2] py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-900/40 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] transition-all">
                    تاسیس حلقه
                </button>
            </div>
        </div>
    );

    const renderActiveCircle = () => {
        if (!activeCircle) return null;
        const sortedMembers = [...activeCircle.members].sort((a, b) => b.score - a.score);
        const latestSummary = activeCircle.summaries[0];

        return (
            <div className="space-y-6 animate-fadeIn h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800 relative z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveCircleId(null)} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-black text-white tracking-tight">{activeCircle.name}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleDeleteCircle(activeCircle.id)} className="w-10 h-10 rounded-xl bg-red-900/20 text-red-400 flex items-center justify-center hover:bg-red-900/40 transition-all">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleInvite} className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-900/30 hover:bg-violet-500 transition-all">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto space-y-6 pr-1 no-scrollbar">
                    
                    {/* Leaderboard */}
                    <div className="bg-[#111] rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl"></div>
                        <h3 className="font-black text-white flex items-center gap-2 mb-4 relative z-10">
                            <TrophyIcon className="w-5 h-5 text-yellow-400" />
                            رده‌بندی قهرمانان
                        </h3>
                        <div className="space-y-3 relative z-10">
                            {sortedMembers.map((member, index) => {
                                let rankStyle = "bg-slate-800/50 border-slate-700";
                                let iconColor = "text-slate-500";
                                let rankBadge = null;

                                if (index === 0) {
                                    rankStyle = "bg-gradient-to-r from-yellow-900/30 to-slate-900 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
                                    iconColor = "text-yellow-400";
                                    rankBadge = <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">اول</div>;
                                } else if (index === 1) {
                                    rankStyle = "bg-gradient-to-r from-slate-800 to-slate-900 border-slate-500/30";
                                    iconColor = "text-slate-300";
                                    rankBadge = <div className="absolute -top-2 -right-2 bg-slate-300 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">دوم</div>;
                                } else if (index === 2) {
                                    rankStyle = "bg-gradient-to-r from-orange-900/20 to-slate-900 border-orange-700/30";
                                    iconColor = "text-orange-400";
                                    rankBadge = <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">سوم</div>;
                                }

                                return (
                                    <div key={member.id} className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${rankStyle}`}>
                                        {rankBadge}
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-lg ${index < 3 ? iconColor : 'text-slate-600'}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <span className={`block font-bold text-sm ${index === 0 ? 'text-white' : 'text-slate-300'}`}>{member.name}</span>
                                                <span className="text-[10px] text-slate-500">Level {Math.floor(member.score / 100) + 1}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono font-bold ${iconColor}`}>{member.score} XP</span>
                                            {member.id !== 'me' && (
                                                <button onClick={() => handleUpdateMemberScore(activeCircle.id, member.id, 5)} className="w-7 h-7 bg-slate-700 hover:bg-green-600 hover:text-white rounded-lg flex items-center justify-center text-green-400 transition-colors">
                                                    <PlusIcon className="w-3.5 h-3.5"/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mission Control (Weekly Sync) */}
                    <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-blue-400"/>
                            اتاق وضعیت (گزارش هفتگی)
                        </h3>
                        
                        <div className="space-y-4 relative z-10">
                            {activeCircle.members.map(member => (
                                <div key={member.id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 focus-within:border-blue-500/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                                            {member.name[0]}
                                        </div>
                                        <label className="text-xs text-slate-400 font-bold">{member.name}</label>
                                    </div>
                                    <textarea 
                                        value={memberUpdates[member.id] || ''}
                                        onChange={(e) => handleUpdateTextChange(member.id, e.target.value)}
                                        placeholder={member.id === 'me' ? "این هفته چه کردی؟" : `گزارش ${member.name}...`}
                                        rows={1}
                                        className="w-full bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
                                        style={{ minHeight: '24px' }}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleGenerateSummary} 
                            disabled={isGeneratingSummary}
                            className="w-full mt-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className={`w-5 h-5 ${isGeneratingSummary ? 'animate-spin' : ''}`}/>
                            {isGeneratingSummary ? 'هوش مصنوعی در حال تحلیل...' : 'تولید گزارش ماموریت'}
                        </button>
                    </div>

                    {/* Latest Summary Card */}
                    {latestSummary && (
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider bg-violet-900/20 px-2 py-1 rounded mb-2 inline-block">آخرین گزارش</span>
                                    <h3 className="font-black text-white text-lg">خلاصه ماموریت</h3>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">{new Date(latestSummary.date).toLocaleDateString('fa-IR')}</span>
                            </div>
                            
                            <div className="space-y-4 relative z-10">
                                <p className="text-sm text-slate-300 leading-relaxed">{latestSummary.data.groupProgress}</p>
                                
                                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                                    <p className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-1">
                                        <FireIcon className="w-3 h-3"/>
                                        چالش هفته بعد
                                    </p>
                                    <p className="text-sm text-white font-medium">{latestSummary.data.nextWeekChallenge}</p>
                                </div>

                                <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl">
                                    <p className="text-xs text-violet-200 italic text-center">"{latestSummary.data.motivationMessage}"</p>
                                </div>
                            </div>

                            <button onClick={() => handleShareSummary(latestSummary.data)} className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors relative z-10">
                                <ShareIcon className="w-4 h-4"/> اشتراک‌گذاری با گروه
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCircleList = () => (
        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
             <div className="flex justify-between items-center pb-2">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">حلقه‌های قدرت</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1">با دوستانت رشد کن</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 transform rotate-180" />
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 no-scrollbar pb-10">
                {circles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <UserCircleIcon className="w-10 h-10 text-slate-600 opacity-50"/>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">هنوز تنهایی؟</h3>
                        <p className="text-slate-400 text-center mb-6 text-sm leading-relaxed">قدرت در جمع است. یک حلقه بساز و دوستانت را برای رسیدن به اهداف مشترک دعوت کن.</p>
                        <button onClick={() => setIsCreating(true)} className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-violet-900/20 hover:scale-105">
                            ساخت اولین حلقه
                        </button>
                    </div>
                ) : (
                    <>
                        {circles.map((circle, idx) => (
                            <div 
                                key={circle.id} 
                                onClick={() => setActiveCircleId(circle.id)}
                                className="group relative bg-slate-800 border border-slate-700 rounded-2xl p-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${idx % 2 === 0 ? 'from-violet-600/20 to-blue-600/20' : 'from-fuchsia-600/20 to-orange-600/20'} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                
                                <div className="relative bg-slate-900/90 rounded-xl p-5 flex justify-between items-center h-full">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg bg-gradient-to-br ${idx % 2 === 0 ? 'from-violet-600 to-indigo-600' : 'from-pink-600 to-rose-600'}`}>
                                            {circle.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-1 group-hover:text-violet-200 transition-colors">{circle.name}</h3>
                                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                <span className="flex items-center gap-1"><UserIcon className="w-3 h-3"/> {circle.members.length} عضو</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                <span className="text-green-500/80">فعال</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-black transition-all">
                                         <ArrowLeftIcon className="w-4 h-4 transform rotate-180" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-slate-800 text-slate-500 rounded-2xl hover:bg-slate-800/50 hover:border-slate-700 hover:text-slate-300 transition-all flex items-center justify-center gap-2 font-bold text-sm mt-4">
                            <PlusIcon className="w-5 h-5"/>
                            <span>ساخت حلقه جدید</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 w-full max-w-lg h-[85vh] flex flex-col shadow-2xl relative overflow-hidden modal-panel" onClick={e => e.stopPropagation()}>
                {activeCircleId ? renderActiveCircle() : (isCreating ? renderCreateView() : renderCircleList())}
            </div>
        </div>
    );
};

export default SocialCirclesView;




import React, { useState, useEffect } from 'react';
import { OnboardingData, SocialCircle, CircleMember, CircleSummaryData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
    UserCircleIcon, ShareIcon, SparklesIcon, PlusIcon, TrophyIcon, 
    ChatBubbleOvalLeftEllipsisIcon, ArrowPathIcon, ArrowLeftIcon, 
    TrashIcon, FireIcon
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

    // --- RENDERERS ---

    const renderCreateView = () => (
        <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">ساخت حلقه جدید</h3>
            <input 
                type="text" 
                placeholder="نام حلقه (مثلا: سحرخیزان)" 
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-violet-500 outline-none"
            />
            
            <div className="space-y-2">
                <p className="text-sm text-slate-400">اعضا (نام دوستانتان را وارد کنید)</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="نام عضو" 
                        value={tempMemberName}
                        onChange={(e) => setTempMemberName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMemberName()}
                        className="flex-grow bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm outline-none"
                    />
                    <button onClick={handleAddMemberName} className="bg-slate-700 hover:bg-slate-600 px-3 rounded-lg">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {newMembers.map((m, i) => (
                        <span key={i} className="bg-violet-900/50 text-violet-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                            {m}
                            <button onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="hover:text-white">&times;</button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={() => setIsCreating(false)} className="flex-1 py-2 bg-slate-700 rounded-lg">لغو</button>
                <button onClick={handleCreateCircle} disabled={!newCircleName} className="flex-1 py-2 bg-violet-600 rounded-lg disabled:opacity-50">ساختن</button>
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
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                    <button onClick={() => setActiveCircleId(null)} className="text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-white">{activeCircle.name}</h2>
                    <button onClick={handleInvite} className="text-violet-400 hover:text-violet-300">
                        <ShareIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-6 pr-1">
                    {/* Leaderboard */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h3 className="font-bold text-yellow-400 flex items-center gap-2 mb-3">
                            <TrophyIcon className="w-5 h-5" />
                            جدول امتیازات
                        </h3>
                        <div className="space-y-2">
                            {sortedMembers.map((member, index) => (
                                <div key={member.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono w-6 text-center ${index === 0 ? 'text-yellow-400 font-bold text-lg' : 'text-slate-500'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="text-slate-200">{member.name}</span>
                                        {index === 0 && <FireIcon className="w-4 h-4 text-orange-500 animate-pulse"/>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-violet-300 font-bold">{member.score} XP</span>
                                        {member.id !== 'me' && (
                                            <button onClick={() => handleUpdateMemberScore(activeCircle.id, member.id, 5)} className="text-xs bg-slate-700 hover:bg-slate-600 px-1.5 py-0.5 rounded text-green-400">+</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Latest Summary Card */}
                    {latestSummary && (
                        <div className="bg-gradient-to-br from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-300"/> آخرین خلاصه</h3>
                                <span className="text-xs text-slate-400">{new Date(latestSummary.date).toLocaleDateString('fa-IR')}</span>
                            </div>
                            <p className="text-sm text-slate-300 mb-3 leading-relaxed">{latestSummary.data.groupProgress}</p>
                            <div className="bg-black/20 p-3 rounded-lg mb-3">
                                <p className="text-xs font-bold text-orange-300 mb-1">چالش هفته:</p>
                                <p className="text-sm text-slate-200">{latestSummary.data.nextWeekChallenge}</p>
                            </div>
                            <button onClick={() => handleShareSummary(latestSummary.data)} className="w-full py-2 bg-violet-600/80 hover:bg-violet-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                                <ShareIcon className="w-4 h-4"/> اشتراک‌گذاری با گروه
                            </button>
                        </div>
                    )}

                    {/* Weekly Sync Input */}
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-blue-400"/>
                            بروزرسانی هفتگی
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">چه کارهایی در این هفته انجام شد؟ گزارش اعضا را وارد کنید تا هوش مصنوعی تحلیل کند.</p>
                        
                        <div className="space-y-3">
                            {activeCircle.members.map(member => (
                                <div key={member.id}>
                                    <label className="text-xs text-slate-500 block mb-1">{member.name}</label>
                                    <textarea 
                                        value={memberUpdates[member.id] || ''}
                                        onChange={(e) => handleUpdateTextChange(member.id, e.target.value)}
                                        placeholder={`گزارش ${member.name}...`}
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleGenerateSummary} 
                            disabled={isGeneratingSummary}
                            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <SparklesIcon className={`w-5 h-5 ${isGeneratingSummary ? 'animate-spin' : ''}`}/>
                            {isGeneratingSummary ? 'در حال تحلیل...' : 'تولید خلاصه هوشمند'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCircleList = () => (
        <div className="space-y-4 animate-fadeIn h-full flex flex-col">
             <div className="flex justify-between items-center pb-2">
                <h2 className="text-xl font-bold text-white">حلقه‌های من</h2>
                <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                {circles.length === 0 ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-slate-700 rounded-xl">
                        <UserCircleIcon className="w-16 h-16 text-slate-600 mx-auto mb-3"/>
                        <p className="text-slate-400 mb-4">هنوز عضوی از هیچ حلقه‌ای نیستی. با دوستانت یک گروه بساز و با هم رشد کنید!</p>
                        <button onClick={() => setIsCreating(true)} className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-full font-bold transition-colors">
                            ساخت اولین حلقه
                        </button>
                    </div>
                ) : (
                    <>
                        {circles.map(circle => (
                            <div 
                                key={circle.id} 
                                onClick={() => setActiveCircleId(circle.id)}
                                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer transition-all flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {circle.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{circle.name}</h3>
                                        <p className="text-sm text-slate-400">{circle.members.length} عضو</p>
                                    </div>
                                </div>
                                <div className="text-slate-500 group-hover:text-white transition-colors">
                                     <ArrowLeftIcon className="w-5 h-5 transform rotate-180" />
                                </div>
                            </div>
                        ))}
                        
                        <button onClick={() => setIsCreating(true)} className="w-full py-3 border-2 border-dashed border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-center gap-2">
                            <PlusIcon className="w-5 h-5"/>
                            <span>ساخت حلقه جدید</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-[var(--radius-card)] p-5 w-full max-w-md h-[85vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                {activeCircleId ? renderActiveCircle() : (isCreating ? renderCreateView() : renderCircleList())}
            </div>
        </div>
    );
};

export default SocialCirclesView;

import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, LifeWheelAssessment, LifeWheelCategory } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { ChartPieIcon, SparklesIcon, ScaleIcon, ArrowLeftIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface LifeWheelViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'health', label: 'سلامت جسمانی' },
    { id: 'career', label: 'شغل و حرفه' },
    { id: 'finance', label: 'وضعیت مالی' },
    { id: 'relationship', label: 'روابط عاطفی' },
    { id: 'growth', label: 'رشد شخصی' },
    { id: 'fun', label: 'تفریح و سرگرمی' },
    { id: 'environment', label: 'محیط زندگی' },
    { id: 'spirituality', label: 'معنویت و معنا' }
];

const RadarChart: React.FC<{ data: LifeWheelCategory[] }> = ({ data }) => {
    const size = 320;
    const center = size / 2;
    const radius = 110;
    const angleSlice = (Math.PI * 2) / data.length;

    const getPoint = (value: number, index: number) => {
        const angle = index * angleSlice - Math.PI / 2;
        const r = (value / 10) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const points = data.map((d, i) => getPoint(d.score, i)).map(p => `${p.x},${p.y}`).join(' ');

    // Background web
    const webs = [2, 4, 6, 8, 10].map(level => {
        const levelPoints = data.map((_, i) => {
             const angle = i * angleSlice - Math.PI / 2;
             const r = (level / 10) * radius;
             return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={level} points={levelPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
    });

    return (
        <div className="flex justify-center my-6 relative">
            <svg width={size} height={size} className="overflow-visible">
                {webs}
                {/* Axes */}
                {data.map((cat, i) => {
                    const p = getPoint(10, i);
                    const textP = {
                         x: center + (radius + 30) * Math.cos(i * angleSlice - Math.PI / 2),
                         y: center + (radius + 30) * Math.sin(i * angleSlice - Math.PI / 2)
                    };
                    return (
                        <g key={i}>
                            <line x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                            <text x={textP.x} y={textP.y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="11" className="font-bold">{cat.label}</text>
                        </g>
                    );
                })}
                {/* Data Area */}
                <polygon points={points} fill="rgba(236, 72, 153, 0.3)" stroke="#ec4899" strokeWidth="3" className="filter drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                {/* Points */}
                {data.map((d, i) => {
                    const p = getPoint(d.score, i);
                    return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" className="shadow-sm" />
                })}
            </svg>
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_white]"></div>
        </div>
    );
};

const LifeWheelView: React.FC<LifeWheelViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [scores, setScores] = useState<Record<string, number>>(() => {
        const initial = {} as Record<string, number>;
        CATEGORIES.forEach(c => {
            const existing = userData.lifeWheel?.categories.find(cat => cat.id === c.id);
            initial[c.id] = existing ? existing.score : 5;
        });
        return initial;
    });
    const [analysis, setAnalysis] = useState<string | null>(userData.lifeWheel?.analysis || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showConcept, setShowConcept] = useState(false);

    const chartData = useMemo(() => {
        return CATEGORIES.map(c => ({ ...c, score: scores[c.id] }));
    }, [scores]);

    // Calculate Balance Score (Standard Deviation inverse)
    const balanceScore = useMemo(() => {
        const values = Object.values(scores);
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        // Score from 0 to 100. Less deviation means better balance.
        // Max deviation roughly 4.5 (if scores are 1 and 10). 
        const balance = Math.max(0, 100 - (stdDev * 20)); 
        return Math.round(balance);
    }, [scores]);

    const handleScoreChange = (id: string, val: number) => {
        setScores(prev => ({ ...prev, [id]: val }));
    };

    const handleSave = async () => {
        setIsAnalyzing(true);
        
        const wheelData: LifeWheelCategory[] = CATEGORIES.map(c => ({ id: c.id, label: c.label, score: scores[c.id] }));
        
        const prompt = `
            Analyze this Life Wheel assessment for a user. 
            Categories and scores (1-10):
            ${wheelData.map(d => `- ${d.label}: ${d.score}`).join('\n')}
            
            Balance Score: ${balanceScore}/100.

            Provide a concise, insightful analysis in Persian.
            1. **Strength**: Identify the area where they are thriving and congratulate them.
            2. **Imbalance**: Point out the biggest gap or the lowest score that might be dragging down their overall life quality ("flat tire" analogy).
            3. **Action**: Suggest ONE specific, very small micro-habit to improve the lowest area.
            
            Tone: Wise, coaching, encouraging. Max 150 words.
        `;
        
        try {
            const response = await ai.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: prompt,
            });
            const resultText = response.text;
            
            const newAssessment: LifeWheelAssessment = {
                date: new Date().toISOString(),
                categories: wheelData,
                analysis: resultText
            };
            
            onUpdateUserData({ ...userData, lifeWheel: newAssessment });
            setAnalysis(resultText);
        } catch (e) {
            console.error(e);
             const newAssessment: LifeWheelAssessment = {
                date: new Date().toISOString(),
                categories: wheelData,
                analysis: "خطا در دریافت تحلیل. اطلاعات ذخیره شد."
            };
            onUpdateUserData({ ...userData, lifeWheel: newAssessment });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col animate-fadeIn">
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pink-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative z-10 px-6 pt-6 pb-2 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">چرخ زندگی</h2>
                    <p className="text-xs text-pink-500 font-bold uppercase tracking-widest opacity-80">Life Balance OS</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
            </div>

            {showConcept && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowConcept(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md text-center" onClick={e => e.stopPropagation()}>
                        <ScaleIcon className="w-16 h-16 text-pink-500 mx-auto mb-4"/>
                        <h3 className="text-xl font-bold text-white mb-2">فلسفه چرخ زندگی</h3>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 text-justify">
                            زندگی مثل یک وسیله نقلیه است و این "چرخ" نشان‌دهنده تعادل آن است. 
                            اگر یک بخش از زندگی شما نمره ۱۰ باشد و بخش دیگر نمره ۲، چرخ شما گرد نیست و حرکت در جاده زندگی پر از تکان و سختی خواهد بود.
                            <br/><br/>
                            هدف این نیست که همه چیز ۱۰ باشد؛ هدف این است که چرخ شما <strong>گرد و متعادل</strong> باشد تا حرکت روان‌تری داشته باشید. نمره تعادل به شما می‌گوید چقدر زندگی‌تان همگون پیش می‌رود.
                        </p>
                        <button onClick={() => setShowConcept(false)} className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold">متوجه شدم</button>
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto px-4 pb-24 relative z-10 scrollbar-hide">
                
                {/* Intro Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-400">نمره تعادل شما</p>
                        <p className={`text-3xl font-black ${balanceScore > 80 ? 'text-green-400' : balanceScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{balanceScore}<span className="text-sm text-slate-500 ml-1">/100</span></p>
                    </div>
                    <button onClick={() => setShowConcept(true)} className="text-xs text-pink-400 font-bold border border-pink-500/30 px-3 py-1.5 rounded-lg hover:bg-pink-500/10">
                        این چیه؟
                    </button>
                </div>

                <RadarChart data={chartData} />
                
                {analysis && (
                    <div className="bg-gradient-to-br from-pink-900/20 to-slate-900 border border-pink-500/30 p-5 rounded-2xl mb-8 text-sm leading-relaxed text-slate-200 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-xl"></div>
                        <h4 className="font-bold text-pink-300 mb-3 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> تحلیل کوچ هوشمند</h4>
                        <div className="prose prose-invert prose-sm max-w-none">
                            {analysis}
                        </div>
                    </div>
                )}

                <div className="space-y-5 pb-10">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between text-sm mb-3">
                                <span className="text-slate-200 font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                    {cat.label}
                                </span>
                                <span className="text-pink-400 font-bold text-lg">{scores[cat.id]}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                step="1"
                                value={scores[cat.id]} 
                                onChange={(e) => handleScoreChange(cat.id, Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                                <span>بحرانی</span>
                                <span>عالی</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent z-20">
                <button onClick={handleSave} disabled={isAnalyzing} className="w-full py-4 bg-pink-600 rounded-2xl font-black text-white hover:bg-pink-500 transition-all shadow-lg shadow-pink-900/40 disabled:bg-slate-700 disabled:text-slate-500 flex justify-center items-center gap-2">
                    {isAnalyzing ? <SparklesIcon className="w-6 h-6 animate-spin"/> : <ChartPieIcon className="w-6 h-6"/>}
                    {isAnalyzing ? 'درحال آنالیز وضعیت...' : 'ذخیره و تحلیل وضعیت'}
                </button>
            </div>
        </div>
    );
};

export default LifeWheelView;

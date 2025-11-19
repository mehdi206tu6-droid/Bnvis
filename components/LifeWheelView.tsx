
import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, LifeWheelAssessment, LifeWheelCategory } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { ChartPieIcon, SparklesIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface LifeWheelViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'health', label: 'سلامت' },
    { id: 'career', label: 'شغل' },
    { id: 'finance', label: 'مالی' },
    { id: 'relationship', label: 'روابط' },
    { id: 'growth', label: 'رشد شخصی' },
    { id: 'fun', label: 'تفریح' },
    { id: 'environment', label: 'محیط' },
    { id: 'spirituality', label: 'معنویت' }
];

const RadarChart: React.FC<{ data: LifeWheelCategory[] }> = ({ data }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
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
    const fullPoints = data.map((_, i) => getPoint(10, i)).map(p => `${p.x},${p.y}`).join(' ');

    // Background web
    const webs = [2, 4, 6, 8, 10].map(level => {
        const levelPoints = data.map((_, i) => {
             const angle = i * angleSlice - Math.PI / 2;
             const r = (level / 10) * radius;
             return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={level} points={levelPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
    });

    return (
        <div className="flex justify-center my-4">
            <svg width={size} height={size} className="overflow-visible">
                {webs}
                {/* Axes */}
                {data.map((cat, i) => {
                    const p = getPoint(10, i);
                    const textP = {
                         x: center + (radius + 25) * Math.cos(i * angleSlice - Math.PI / 2),
                         y: center + (radius + 25) * Math.sin(i * angleSlice - Math.PI / 2)
                    };
                    return (
                        <g key={i}>
                            <line x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                            <text x={textP.x} y={textP.y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="10" className="font-semibold">{cat.label}</text>
                        </g>
                    );
                })}
                {/* Data Area */}
                <polygon points={points} fill="rgba(139, 92, 246, 0.5)" stroke="#8b5cf6" strokeWidth="2" />
                {/* Points */}
                {data.map((d, i) => {
                    const p = getPoint(d.score, i);
                    return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" />
                })}
            </svg>
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

    const chartData = useMemo(() => {
        return CATEGORIES.map(c => ({ ...c, score: scores[c.id] }));
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
            
            Provide a short, empathetic analysis in Persian. 
            1. Identify the strongest area.
            2. Identify the area needing most attention (lowest score or biggest gap).
            3. Suggest one small, actionable step to improve the lowest area.
            
            Keep it under 100 words.
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
            // Save without analysis if AI fails
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-[var(--radius-card)] p-6 w-full max-w-lg h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-violet-300">
                        <ChartPieIcon className="w-6 h-6"/>
                        چرخ زندگی
                    </h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    <RadarChart data={chartData} />
                    
                    {analysis && (
                        <div className="bg-violet-900/30 border border-violet-700/50 p-4 rounded-lg mb-6 text-sm leading-relaxed text-slate-200">
                            <h4 className="font-bold text-violet-300 mb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> تحلیل هوشمند</h4>
                            {analysis}
                        </div>
                    )}

                    <div className="space-y-4">
                        {CATEGORIES.map(cat => (
                            <div key={cat.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300 font-semibold">{cat.label}</span>
                                    <span className="text-violet-400 font-bold">{scores[cat.id]}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    step="1"
                                    value={scores[cat.id]} 
                                    onChange={(e) => handleScoreChange(cat.id, Number(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <button onClick={handleSave} disabled={isAnalyzing} className="w-full py-3 bg-violet-600 rounded-lg font-bold text-white hover:bg-violet-700 transition-colors disabled:bg-slate-600 flex justify-center items-center gap-2">
                        {isAnalyzing ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                        {isAnalyzing ? 'در حال تحلیل...' : 'ذخیره و تحلیل'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LifeWheelView;

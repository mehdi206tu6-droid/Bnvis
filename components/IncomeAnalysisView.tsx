import React, { useState } from 'react';
import { OnboardingData, IncomeSource, IncomeVariability, Rating } from '../types';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, TrashIcon, PlusIcon, ChartPieIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface IncomeAnalysisViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}

const defaultSource: Omit<IncomeSource, 'id' | 'name' | 'type' | 'avgMonthlyIncome'> = {
    incomeType: 'fixed',
    stability: 'medium',
    growthPotential: 'medium',
    risk: 'medium',
    associatedCosts: '',
};

const IncomeAnalysisView: React.FC<IncomeAnalysisViewProps> = ({ userData, onUpdateUserData }) => {
    const [step, setStep] = useState(0);
    const [sources, setSources] = useState<IncomeSource[]>(userData.incomeAnalysis?.sources || []);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(userData.incomeAnalysis?.report || null);
    
    const TOTAL_STEPS = 3; // Welcome, Data Entry, Report

    const updateSource = (id: string, update: Partial<IncomeSource>) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
    };

    const addSource = () => {
        const newSource: IncomeSource = {
            id: `source-${Date.now()}`,
            name: '',
            type: 'freelance',
            avgMonthlyIncome: 0,
            ...defaultSource,
        };
        setSources(prev => [...prev, newSource]);
    };
    
    const removeSource = (id: string) => {
        setSources(prev => prev.filter(s => s.id !== id));
    };

    const handleGenerateReport = async () => {
        setIsLoading(true);
        
        const mainJob = sources.find(s => s.type === 'main_job');
        const otherSources = sources.filter(s => s.type !== 'main_job');

        let prompt = `
            As a professional financial advisor for the Benvis Life OS, analyze the user's income structure based on the provided data. Your response MUST be in Persian and follow the specified format.

            Here is the user's data:
        `;

        if (mainJob) {
            prompt += `
            **Main Job:**
            - Job Title: ${mainJob.name}
            - Role: ${mainJob.role}
            - Income Type: ${mainJob.incomeType} (${mainJob.avgMonthlyIncome} per month)
            - Associated Costs: ${mainJob.associatedCosts || 'None'}
            - User's Assessment: Stability (${mainJob.stability}), Growth Potential (${mainJob.growthPotential}), Risk (${mainJob.risk})
            `;
        } else {
            prompt += `User has no main job.\n`;
        }

        if (otherSources.length > 0) {
            prompt += `
            **Other Income Sources:**
            ${otherSources.map(s => `
            - Source: ${s.name} (${s.type})
            - Income Type: ${s.incomeType} (${s.avgMonthlyIncome} per month)
            - Associated Costs: ${s.associatedCosts || 'None'}
            - User's Assessment: Stability (${s.stability}), Growth Potential (${s.growthPotential}), Risk (${s.risk})
            `).join('\n')}
            `;
        } else {
            prompt += `User has no other income sources.\n`;
        }

        prompt += `
            **Analysis Request:**
            Based on this data, provide a comprehensive report with the following sections in Markdown:
            
            1.  **نقشه منابع درآمدی شما**:
                Start with a summary of total monthly income. Then, create a bulleted list showing the percentage contribution of each income source to the total income.
                
            2.  **تحلیل پایداری و ریسک**:
                For each income source, provide a brief analysis of its stability and risks, considering the user's own assessment but adding your expert opinion. Use bullet points.
                
            3.  **توصیه‌های شخصی برای رشد مالی**:
                This is the most important section. Provide actionable, personalized recommendations.
                -   **کوتاه‌مدت (۱ تا ۳ ماه آینده)**: Give 2-3 specific tips to optimize current income or reduce costs.
                -   **بلندمدت (۱ سال آینده)**: Suggest 2-3 strategies for income growth, diversification, or risk reduction. Tailor these suggestions directly to the user's situation (e.g., if they have high-risk freelance work, suggest ways to stabilize it).
        `;
        
        try {
            const result = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
            const newReport = result.text;
            setReport(newReport);
            const updatedAnalysis = { sources, report: newReport, lastUpdated: new Date().toISOString() };
            onUpdateUserData({ ...userData, incomeAnalysis: updatedAnalysis });
        } catch (error) {
            console.error(error);
            setReport("متاسفانه در تولید گزارش خطایی رخ داد. لطفا دوباره تلاش کنید.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        switch (step) {
            case 0: // Welcome
                return (
                    <div className="text-center p-8">
                        <ChartPieIcon className="w-16 h-16 mx-auto text-violet-400 mb-4"/>
                        <h2 className="text-2xl font-bold mb-2">تحلیل هوشمند درآمد و شغل</h2>
                        <p className="text-slate-400">
                           این دستیار هوشمند به شما کمک می‌کند تا با پاسخ به چند سوال، درک عمیق‌تری از وضعیت مالی خود پیدا کرده و توصیه‌های شخصی‌سازی‌شده برای رشد دریافت کنید.
                        </p>
                    </div>
                );
            case 1: // Data Entry
                return (
                    <div className="space-y-6">
                        {sources.map(source => (
                            <SourceForm key={source.id} source={source} onUpdate={updateSource} onRemove={removeSource} />
                        ))}
                         <button onClick={addSource} className="w-full flex items-center justify-center gap-2 py-3 mt-4 border-2 border-dashed border-slate-600 rounded-[var(--radius-md)] text-slate-400 hover:bg-slate-700/50 hover:border-slate-500 transition-colors">
                            <PlusIcon className="w-5 h-5"/>
                            <span>افزودن منبع درآمد دیگر</span>
                        </button>
                    </div>
                );
            case 2: // Report
                return (
                     <div>
                        {isLoading ? (
                            <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                                <SparklesIcon className="w-12 h-12 text-violet-400 mx-auto animate-pulse mb-4" />
                                <p className="font-semibold text-lg">مشاور مالی در حال تحلیل اطلاعات شماست...</p>
                                <p className="text-sm text-slate-400">این فرآیند ممکن است کمی طول بکشد.</p>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap leading-relaxed text-right prose prose-invert prose-p:text-slate-300 prose-headings:text-white prose-headings:font-bold prose-headings:text-violet-300" dir="rtl">
                                {report?.split('\n').map((line, i) => {
                                    const trimmedLine = line.trim();
                                    if (trimmedLine.startsWith('### ') || trimmedLine.startsWith('## ') || trimmedLine.startsWith('# ')) {
                                        return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{trimmedLine.replace(/#/g, '').trim()}</h3>;
                                    }
                                    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                                        return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{trimmedLine.replace(/\*\*/g, '').trim()}</h3>
                                    }
                                    if (trimmedLine.startsWith('* ')) {
                                        return <p key={i} className="mb-2 pl-4 relative before:content-['•'] before:absolute before:right-full before:mr-2 before:text-violet-400">{trimmedLine.substring(2)}</p>;
                                    }
                                    return <p key={i} className="mb-2">{line}</p>;
                                })}
                            </div>
                        )}
                    </div>
                );
        }
    };
    
    const handleNext = () => {
        if (step === 1) { // After data entry, generate report
            handleGenerateReport();
        }
        setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    };
    
    const handleBack = () => {
         setStep(s => Math.max(s - 1, 0));
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
                <div className="bg-violet-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}></div>
            </div>

            <div className="min-h-[400px]">
                {renderContent()}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 flex-shrink-0 flex gap-4">
                {step > 0 && <button onClick={handleBack} className="flex-1 py-2 bg-slate-600 rounded-[var(--radius-md)] font-semibold hover:bg-slate-500">قبلی</button>}
                {step < TOTAL_STEPS - 1 ? (
                    <button onClick={handleNext} className="flex-1 py-2 bg-violet-700 rounded-[var(--radius-md)] font-semibold hover:bg-violet-800">{step === 0 ? 'شروع' : 'تولید گزارش'}</button>
                ) : (
                    <button onClick={() => setStep(0)} className="w-full py-2 bg-violet-700 rounded-[var(--radius-md)] font-semibold hover:bg-violet-800">شروع مجدد</button>
                )}
            </div>
        </div>
    );
};

const SourceForm: React.FC<{ source: IncomeSource, onUpdate: (id: string, update: Partial<IncomeSource>) => void, onRemove: (id: string) => void }> = ({ source, onUpdate, onRemove }) => {
    
    const handleInputChange = (field: keyof IncomeSource, value: any) => {
        onUpdate(source.id, { [field]: value });
    };

    const handleNumberChange = (field: keyof IncomeSource, value: string) => {
        onUpdate(source.id, { [field]: Number(value) || 0 });
    };

    return (
        <div className="p-4 bg-slate-800/50 rounded-[var(--radius-lg)] space-y-4 border border-slate-700 relative">
            {source.type !== 'main_job' && (
                 <button onClick={() => onRemove(source.id)} className="absolute top-2 left-2 p-1 text-slate-500 hover:text-red-400">
                    <TrashIcon className="w-5 h-5"/>
                </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={source.type} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md font-bold">
                    <option value="main_job">شغل اصلی</option>
                    <option value="freelance">فریلنس</option>
                    <option value="investment">سرمایه‌گذاری</option>
                    <option value="rent">اجاره</option>
                    <option value="online_store">فروشگاه آنلاین</option>
                    <option value="other">سایر</option>
                </select>
                <input type="text" placeholder={source.type === 'main_job' ? 'عنوان شغلی (مثلا: توسعه‌دهنده نرم‌افزار)' : 'نام منبع (مثلا: پروژه طراحی لوگو)'} value={source.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required />
            </div>
            {source.type === 'main_job' && (
                <input type="text" placeholder="نقش شما (مثلا: برنامه‌نویس ارشد)" value={source.role || ''} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
            )}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input type="number" placeholder="متوسط درآمد ماهانه (تومان)" value={source.avgMonthlyIncome || ''} onChange={(e) => handleNumberChange('avgMonthlyIncome', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" required/>
                  <select value={source.incomeType} onChange={(e) => handleInputChange('incomeType', e.target.value as IncomeVariability)} className="w-full bg-slate-700 p-2 rounded-md">
                    <option value="fixed">حقوق ثابت</option>
                    <option value="variable">پروژه‌ای/متغیر</option>
                </select>
            </div>
             <input type="text" placeholder="هزینه‌های مرتبط (اختیاری، مثلا: هزینه اینترنت، اشتراک نرم‌افزار)" value={source.associatedCosts || ''} onChange={(e) => handleInputChange('associatedCosts', e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
                <RatingSelector label="پایداری" value={source.stability} onChange={(v) => handleInputChange('stability', v)} />
                <RatingSelector label="پتانسیل رشد" value={source.growthPotential} onChange={(v) => handleInputChange('growthPotential', v)} />
                <RatingSelector label="ریسک" value={source.risk} onChange={(v) => handleInputChange('risk', v)} />
            </div>

        </div>
    );
};

const RatingSelector: React.FC<{ label: string, value: Rating, onChange: (value: Rating) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="font-semibold mb-2 block">{label}</label>
        <div className="flex gap-1 bg-slate-700/50 p-1 rounded-[var(--radius-full)]">
            {(['low', 'medium', 'high'] as const).map(level => (
                <button key={level} type="button" onClick={() => onChange(level)} className={`flex-1 py-1 text-xs font-semibold rounded-[var(--radius-full)] transition-colors ${value === level ? 'bg-violet-500 text-white' : 'text-slate-300'}`}>
                    { {low: 'کم', medium: 'متوسط', high: 'زیاد'}[level] }
                </button>
            ))}
        </div>
    </div>
);


export default IncomeAnalysisView;
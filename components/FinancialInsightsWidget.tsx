import React, { useState, useEffect, useCallback } from 'react';
import { OnboardingData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, ArrowPathIcon, ChartBarIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface FinancialInsightsWidgetProps {
    userData: OnboardingData;
}

const FinancialInsightsWidget: React.FC<FinancialInsightsWidgetProps> = ({ userData }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `benvis_financial_insight_${todayStr}`;

    const generateInsight = useCallback(async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);

        if (!forceRefresh) {
            try {
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    setInsight(JSON.parse(cachedData));
                    setIsLoading(false);
                    return;
                }
            } catch (e) { console.warn("Failed to read financial insight cache", e); }
        }

        const { transactions = [], transactionCategories = [], budgets = [] } = userData;
        
        const now = new Date();
        const currentMonthTxs = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        });

        if (currentMonthTxs.length < 3) {
            setInsight("تراکنش‌های کافی برای تحلیل در این ماه ثبت نشده است.");
            setIsLoading(false);
            return;
        }

        const formattedTransactions = currentMonthTxs.map(t => {
            const categoryName = transactionCategories.find(c => c.id === t.categoryId)?.name || 'نامشخص';
            return `${t.type === 'expense' ? 'هزینه' : 'درآمد'}: ${t.amount} تومان برای ${categoryName} (${t.description})`;
        }).join('\n');

        const formattedBudgets = budgets.map(b => {
            const categoryName = transactionCategories.find(c => c.id === b.categoryId)?.name || 'نامشخص';
            return `${categoryName}: ${b.amount} تومان`;
        }).join('\n');

        const prompt = `
            As a financial analyst for Benvis Life OS, analyze the user's transactions for the current month and provide one key, actionable insight in Persian. Be concise and encouraging.

            User's data:
            - Transactions this month:
            ${formattedTransactions}
            - Budgets:
            ${formattedBudgets || 'None'}

            Identify the most significant spending pattern, budget deviation, or saving opportunity. The insight should be a single sentence, under 25 words.
        `;

        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const generatedInsight = response.text.trim();
            setInsight(generatedInsight);
            localStorage.setItem(cacheKey, JSON.stringify(generatedInsight));
        } catch (err: any) {
            console.error("Failed to generate financial insight:", err);
            const errorString = JSON.stringify(err);
            if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("429")) {
                setError("محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.");
            } else {
                setError("خطا در تحلیل مالی.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [userData, cacheKey]);

    useEffect(() => {
        generateInsight();
    }, [generateInsight]);
    
    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 animate-pulse h-28">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700/80"></div>
                    <div className="flex-grow space-y-2">
                        <div className="h-4 bg-slate-700/80 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-700/80 rounded w-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
         return (
            <div className="bg-red-900/40 backdrop-blur-lg border border-red-800 rounded-[var(--radius-card)] p-4 col-span-2 text-center">
                <p className="font-semibold text-red-300">خطا در دریافت تحلیل مالی</p>
                <p className="text-sm text-red-300/80 mt-1">{error}</p>
                <button onClick={() => generateInsight(true)} className="mt-3 px-4 py-1 bg-red-800 rounded-md text-xs font-semibold">تلاش مجدد</button>
            </div>
        );
    }

    if (!insight) return null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-grow">
                    <div className="p-2 bg-slate-700 rounded-lg mt-1">
                        <ChartBarIcon className="w-6 h-6 text-green-300"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200">تحلیل مالی هوشمند</h3>
                        <p className="text-sm text-slate-300 mt-1">{insight}</p>
                    </div>
                </div>
                <button onClick={() => generateInsight(true)} className="p-2 text-slate-400 hover:text-white transition-colors flex-shrink-0" title="تحلیل مجدد">
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default FinancialInsightsWidget;

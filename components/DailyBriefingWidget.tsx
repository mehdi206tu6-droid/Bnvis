import React from 'react';
import { SparklesIcon, ArrowPathIcon } from './icons';

interface DailyBriefingWidgetProps {
    briefing: string | null;
    isLoading: boolean;
    onRefresh: () => void;
}


const DailyBriefingWidget: React.FC<DailyBriefingWidgetProps> = ({ briefing, isLoading, onRefresh }) => {

    if (isLoading && !briefing) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 h-40 flex flex-col items-center justify-center animate-pulse">
                <SparklesIcon className="w-8 h-8 text-violet-400 mb-2" />
                <p className="text-sm font-semibold text-slate-400">دستیار هوشمند در حال آماده‌سازی گزارش روزانه شماست...</p>
            </div>
        )
    }

    if (!briefing) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">گزارش روزانه هوشمند</h3>
                <button onClick={onRefresh} className="text-slate-400 hover:text-white transition-colors" title="بازسازی گزارش">
                    <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-300 prose prose-invert prose-p:my-1 prose-headings:my-2 prose-headings:text-violet-300" dir="rtl">
                {briefing.split('\n').map((line, i) => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                        return <h4 key={i} className="font-bold text-base">{trimmedLine.replace(/\*\*/g, '').trim()}</h4>
                    }
                     if (trimmedLine.startsWith('* ')) {
                        return <p key={i} className="pl-4 relative before:content-['•'] before:absolute before:right-full before:mr-2 before:text-violet-400">{trimmedLine.substring(2)}</p>;
                    }
                    return <p key={i}>{line}</p>;
                })}
            </div>
        </div>
    );
};

export default DailyBriefingWidget;

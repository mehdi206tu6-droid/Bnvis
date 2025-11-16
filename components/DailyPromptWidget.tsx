import React from 'react';
import { LightBulbIcon, ArrowPathIcon } from './icons';

interface DailyPromptWidgetProps {
    prompt: string | null;
    isLoading: boolean;
    onPromptClick: (prompt: string) => void;
    onRefresh: () => void;
}

const DailyPromptWidget: React.FC<DailyPromptWidgetProps> = ({ prompt, isLoading, onRefresh, onPromptClick }) => {

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700/80"></div>
                    <div className="flex-grow space-y-2">
                        <div className="h-4 bg-slate-700/80 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-700/80 rounded w-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!prompt) return null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2">
            <div className="flex items-start justify-between gap-4">
                 <div className="flex items-start gap-3 flex-grow cursor-pointer" onClick={() => onPromptClick(prompt)}>
                    <div className="p-2 bg-slate-700 rounded-lg mt-1">
                        <LightBulbIcon className="w-6 h-6 text-yellow-300"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200">ایده برای نوشتن</h3>
                        <p className="text-sm text-slate-300 mt-1">{prompt}</p>
                    </div>
                </div>
                <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-white transition-colors flex-shrink-0" title="ایده جدید">
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default DailyPromptWidget;

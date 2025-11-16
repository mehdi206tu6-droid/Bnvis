import React from 'react';
import { LightBulbIcon } from './icons';

interface PredictiveAlertsWidgetProps {
    alert: { title: string; message: string; } | null;
    isLoading: boolean;
    onToggleMode: (isOn: boolean) => void;
}

const PredictiveAlertsWidget: React.FC<PredictiveAlertsWidgetProps> = ({ alert, isLoading, onToggleMode }) => {
    
    const handleActivate = () => {
        onToggleMode(true);
    };

    if (isLoading || !alert) {
        return null;
    }

    return (
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700 rounded-[var(--radius-card)] p-4 col-span-2">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-700 rounded-lg mt-1">
                    <LightBulbIcon className="w-6 h-6 text-slate-300"/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-200">{alert.title}</h3>
                    <p className="text-sm text-slate-300/80 mt-1 mb-3">{alert.message}</p>
                    <button onClick={handleActivate} className="px-4 py-1.5 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-500 transition-colors">
                        فعال کردن حالت کم‌اصطکاک
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PredictiveAlertsWidget;

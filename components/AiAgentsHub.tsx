import React from 'react';
import { agents } from '../lib/agents';
import { Agent } from '../types';

interface AiAgentsHubProps {
    onAgentSelect: (agent: Agent) => void;
}

const AiAgentsHub: React.FC<AiAgentsHubProps> = ({ onAgentSelect }) => {
    return (
        <div className="space-y-4">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <h2 className="text-xl font-bold">ابزارهای هوشمند بنویس</h2>
                <p className="text-sm text-slate-400 mt-1">از دستیارهای تخصصی هوش مصنوعی برای تحلیل و بهبود جنبه‌های مختلف زندگی خود استفاده کنید.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map(agent => (
                    <button 
                        key={agent.id} 
                        onClick={() => onAgentSelect(agent)}
                        className="p-4 bg-slate-800/60 border border-slate-700 rounded-[var(--radius-lg)] text-right hover:bg-slate-700/80 hover:border-violet-600 transition-all duration-200 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700 rounded-md group-hover:bg-violet-600/50 transition-colors">
                                <agent.icon className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-slate-100">{agent.title}</h3>
                                <p className="text-xs text-slate-400">{agent.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AiAgentsHub;

import React, { useState } from 'react';
import { agents } from '../lib/agents';
import { Agent } from '../types';
import { SparklesIcon } from './icons';

interface AiAgentsHubProps {
    onAgentSelect: (agent: Agent) => void;
}

const agentCategories: Record<string, string[]> = {
  'بهره‌وری و برنامه‌ریزی': ['life-gps', 'smart-day-composer', 'time-sensei', 'ai-decision-helper', 'reflection-coach', 'ai-challenge-maker', 'skill-builder', 'accountability-partner', 'privacy-advisor', 'personal-dev-coach', 'cognitive-habit-designer', 'pomodoro-manager', 'eisenhower-matrix', 'smart-goal-generator', 'behavioral-lab', 'quick-commander'],
  'سلامت و تندرستی': ['mood-weather', 'habit-doctor', 'health-score-360', 'ai-sleep-partner', 'mind-detox', 'calm-sos', 'meal-planner', 'habit-stacking-architect', 'digital-minimalism-coach', 'real-world-challenger', 'somatic-chakra-guide', 'morning-ritual-designer'],
  'خودشناسی': ['identity-builder', 'happiness-archive', 'life-map', 'life-pattern-detector', 'ai-emotion-classifier', 'life-strategy-ai', 'habit-manifesto-creator', 'narrative-journaler'],
  'مالی': ['ai-money-guard', 'financial-autopilot', 'expense-predictor', 'financial-health-score', 'smart-budget-engine', 'debt-management-advisor', 'investment-advisor'],
};

const AiAgentsHub: React.FC<AiAgentsHubProps> = ({ onAgentSelect }) => {
    const [activeCategory, setActiveCategory] = useState(Object.keys(agentCategories)[0]);

    const featuredAgent = agents.find(a => a.id === 'life-gps');

    return (
        <div className="space-y-6">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <h2 className="text-xl font-bold">مرکز ابزارهای هوشمند</h2>
                <p className="text-sm text-slate-400 mt-1">از دستیارهای تخصصی هوش مصنوعی برای تحلیل و بهبود جنبه‌های مختلف زندگی خود استفاده کنید.</p>
            </div>

            {featuredAgent && (
                 <div className="p-4 bg-gradient-to-br from-violet-900/80 to-slate-900 border border-violet-700 rounded-[var(--radius-lg)]">
                     <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-300"/> ابزار پیشنهادی</h3>
                     <button 
                        onClick={() => onAgentSelect(featuredAgent)}
                        className="w-full p-4 bg-slate-800/60 border border-slate-700 rounded-[var(--radius-md)] text-right hover:bg-slate-700/80 hover:border-violet-600 transition-all duration-200 group flex items-center gap-4"
                    >
                         <div className="p-3 bg-slate-700 rounded-lg group-hover:bg-violet-600/50 transition-colors">
                            <featuredAgent.icon className="w-8 h-8 text-violet-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-slate-100">{featuredAgent.title}</h4>
                            <p className="text-sm text-slate-400">{featuredAgent.description}</p>
                        </div>
                    </button>
                 </div>
            )}
            
            <div>
                 <div className="flex space-x-1 overflow-x-auto pb-2 mb-4" dir="rtl">
                    {Object.keys(agentCategories).map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                                activeCategory === category ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agents
                        .filter(agent => agentCategories[activeCategory]?.includes(agent.id))
                        .map(agent => (
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
        </div>
    );
};

export default AiAgentsHub;

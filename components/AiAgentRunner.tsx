import React, { useState } from 'react';
import { Agent } from '../types';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon, ChevronRightIcon } from './icons';

interface AiAgentRunnerProps {
    agent: Agent;
    onBack: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const AiAgentRunner: React.FC<AiAgentRunnerProps> = ({ agent, onBack }) => {
    const [input, setInput] = useState(JSON.stringify(agent.inputSchema, null, 2));
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Validate user input as JSON
            JSON.parse(input);
        } catch (e) {
            setError("ورودی نامعتبر است. لطفا یک JSON معتبر وارد کنید.");
            setIsLoading(false);
            return;
        }

        const finalPrompt = agent.systemPrompt.replace('{userInput}', input);

        try {
            const response = await ai.models.generateContent({
                model: agent.model,
                contents: finalPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: agent.responseSchema,
                },
            });
            setResult(JSON.stringify(JSON.parse(response.text), null, 2));
        } catch (err: any) {
            console.error(`Error running agent ${agent.id}:`, err);
            const errorString = JSON.stringify(err);
            if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes('"code":429')) {
                setError("محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.");
            } else {
                 setError('خطا در اجرای ابزار. لطفا ورودی خود را بررسی کرده و دوباره تلاش کنید.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-4">
            <button onClick={onBack} className="flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300">
                <ChevronRightIcon className="w-5 h-5" />
                <span>بازگشت به لیست ابزارها</span>
            </button>
            <div className="flex items-center gap-4">
                <agent.icon className="w-10 h-10 text-violet-400" />
                <div>
                    <h2 className="text-xl font-bold">{agent.title}</h2>
                    <p className="text-sm text-slate-400">{agent.description}</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="font-semibold text-slate-300">ورودی (فرمت JSON)</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 font-mono text-sm text-slate-200 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="اطلاعات ورودی را در فرمت JSON وارد کنید..."
                />
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-700 rounded-lg font-semibold hover:bg-violet-800 disabled:bg-slate-600 transition-colors"
            >
                <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                <span>{isLoading ? 'در حال پردازش...' : 'اجرا کن'}</span>
            </button>

            {error && (
                <div className="p-3 bg-red-900/50 border border-red-800 rounded-md text-red-300 text-sm">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-300">خروجی</h3>
                    <pre className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 text-sm text-slate-200 overflow-x-auto">
                        <code>{result}</code>
                    </pre>
                </div>
            )}
        </div>
    );
};

export default AiAgentRunner;

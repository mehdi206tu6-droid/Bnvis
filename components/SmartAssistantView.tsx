
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { 
    ChatMessage, OnboardingData, Agent, StandaloneTask, Transaction, CalendarEvent 
} from '../types';
import { agents } from '../lib/agents';
import { 
    SparklesIcon, MicrophoneIcon, XMarkIcon,
    ArrowUpIcon, BriefcaseIcon, SpeakerWaveIcon,
    CogIcon, AdjustmentsHorizontalIcon, CheckCircleIcon
} from './icons';
import AiAgentRunner from './AiAgentRunner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BENVIS_SYSTEM_PROMPT = `
You are Benvis, an advanced AI Life Operating System Assistant.
Your goal is to help the user organize their life, achieve goals, build habits, and maintain wellness.
Tone: Professional yet friendly, encouraging, and insightful.
Language: You are fluent in Persian (Farsi). Always reply in Persian.
Keep responses concise and actionable.
`;

// --- Tools Definition for Live API ---

const tools: FunctionDeclaration[] = [
    {
        name: "create_task",
        description: "Create a new task or to-do item for the user.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the task" },
                urgent: { type: Type.BOOLEAN, description: "Is this task urgent?" }
            },
            required: ["title"]
        }
    },
    {
        name: "create_transaction",
        description: "Log a financial transaction (expense or income).",
        parameters: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: "What was purchased or source of income" },
                amount: { type: Type.NUMBER, description: "The amount in Tomans" },
                type: { type: Type.STRING, enum: ["expense", "income"], description: "Type of transaction" }
            },
            required: ["description", "amount", "type"]
        }
    },
    {
        name: "create_calendar_event",
        description: "Add an event to the user's calendar.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Title of the event" },
                time: { type: Type.STRING, description: "Time of event in HH:MM format (optional)" },
                date: { type: Type.STRING, description: "Date in YYYY-MM-DD format (optional, default to today)" }
            },
            required: ["title"]
        }
    }
];

// --- Audio Utilities ---

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --- Live Session Component ---

const LiveSessionOverlay: React.FC<{
    onClose: () => void;
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}> = ({ onClose, userData, onUpdateUserData }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'>('connecting');
    const [visualizerData, setVisualizerData] = useState<number[]>(new Array(5).fill(10));
    const [activeVoice, setActiveVoice] = useState(userData.audioSettings?.voice || 'Kore');
    const [showSettings, setShowSettings] = useState(false);
    const [executedAction, setExecutedAction] = useState<string | null>(null);
    
    // Audio Contexts
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSessionRef = useRef<any>(null);

    const cleanup = () => {
        if (processorRef.current) { 
            processorRef.current.disconnect(); 
            processorRef.current.onaudioprocess = null; 
            processorRef.current = null; 
        }
        if (sourceRef.current) { 
            sourceRef.current.disconnect(); 
            sourceRef.current = null; 
        }
        if (mediaStreamRef.current) { 
            mediaStreamRef.current.getTracks().forEach(t => t.stop()); 
            mediaStreamRef.current = null; 
        }
        
        if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
            inputContextRef.current.close().catch(console.warn);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.warn);
        }
        inputContextRef.current = null;
        audioContextRef.current = null;
        activeSessionRef.current = null;
    };

    useEffect(() => {
        startSession();
        return () => cleanup();
    }, [activeVoice]); 

    // Simple visualizer simulation based on status
    useEffect(() => {
        const interval = setInterval(() => {
            if (status === 'listening' || status === 'speaking') {
                setVisualizerData(prev => prev.map(() => Math.random() * 100));
            } else {
                setVisualizerData(new Array(5).fill(10));
            }
        }, 100);
        return () => clearInterval(interval);
    }, [status]);

    const startSession = async () => {
        cleanup(); // Ensure clean start
        setStatus('connecting');
        try {
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true } });
            mediaStreamRef.current = stream;

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    tools: [{ functionDeclarations: tools }],
                    systemInstruction: BENVIS_SYSTEM_PROMPT + "\nBe a helpful voice assistant. You can execute commands like creating tasks, transactions, and events. When a tool is used, confirm shortly.",
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: activeVoice } } }
                },
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        activeSessionRef.current = sessionPromise;
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        sourceRef.current = source;
                        processorRef.current = processor;
                        
                        processor.onaudioprocess = (e) => {
                            if (!activeSessionRef.current || inputCtx.state === 'closed') return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcm16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcm16.buffer);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64 } });
                            });
                        };
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Tool Calls
                        if (msg.toolCall) {
                            for (const fc of msg.toolCall.functionCalls) {
                                let result: any = { result: "ok" };
                                
                                if (fc.name === 'create_task') {
                                    const task: StandaloneTask = {
                                        id: `task-${Date.now()}`,
                                        title: fc.args.title as string,
                                        urgent: !!fc.args.urgent,
                                        important: false,
                                        completed: false
                                    };
                                    onUpdateUserData({ ...userData, tasks: [...(userData.tasks || []), task] });
                                    setExecutedAction(`تسک ایجاد شد: ${fc.args.title}`);
                                } else if (fc.name === 'create_transaction') {
                                    const tx: Transaction = {
                                        id: `tx-${Date.now()}`,
                                        type: (fc.args.type as any) || 'expense',
                                        amount: Number(fc.args.amount),
                                        description: fc.args.description as string,
                                        date: new Date().toISOString().split('T')[0],
                                        categoryId: 'default',
                                        accountId: 'default'
                                    };
                                    onUpdateUserData({ ...userData, transactions: [...(userData.transactions || []), tx] });
                                    setExecutedAction(`تراکنش ثبت شد: ${fc.args.amount}`);
                                } else if (fc.name === 'create_calendar_event') {
                                    const evt: CalendarEvent = {
                                        id: `evt-${Date.now()}`,
                                        date: (fc.args.date as string) || new Date().toISOString().split('T')[0],
                                        time: fc.args.time as string,
                                        text: fc.args.title as string
                                    };
                                    onUpdateUserData({ ...userData, calendarEvents: [...(userData.calendarEvents || []), evt] });
                                    setExecutedAction(`رویداد ثبت شد: ${fc.args.title}`);
                                }

                                sessionPromise.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            id: fc.id,
                                            name: fc.name,
                                            response: result
                                        }]
                                    });
                                });
                                
                                setTimeout(() => setExecutedAction(null), 3000);
                            }
                        }

                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            setStatus('speaking');
                            const bytes = base64ToUint8Array(audioData);
                            const int16 = new Int16Array(bytes.buffer);
                            const float32 = new Float32Array(int16.length);
                            for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;
                            
                            const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
                            buffer.copyToChannel(float32, 0);
                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioContextRef.current.destination);
                            const now = audioContextRef.current.currentTime;
                            const startTime = Math.max(now, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            source.onended = () => {
                                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                                    setStatus('listening');
                                }
                            };
                        }
                    },
                    onclose: () => setStatus('error'),
                    onerror: (e) => { console.error(e); setStatus('error'); }
                }
            });
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center justify-center animate-fadeIn font-[Vazirmatn]">
            {/* Abstract Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#000000_70%)]"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8 h-full justify-between py-8">
                
                {/* Top Bar */}
                <div className="w-full flex justify-between items-start mt-4">
                    <button onClick={() => setShowSettings(!showSettings)} className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors border border-white/5">
                        <CogIcon className="w-6 h-6 text-slate-300"/>
                    </button>
                    
                    {executedAction && (
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-2 rounded-xl backdrop-blur-md animate-bounce-in flex items-center gap-2 text-sm font-bold">
                            <CheckCircleIcon className="w-5 h-5"/>
                            {executedAction}
                        </div>
                    )}
                </div>

                {/* Settings Modal inside Live View */}
                {showSettings && (
                    <div className="absolute top-20 w-[90%] bg-[#1a1a1d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 z-50 shadow-2xl animate-fadeIn">
                        <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
                            <AdjustmentsHorizontalIcon className="w-4 h-4"/> تنظیمات صدا
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'Kore', label: 'Kore (زن)' },
                                { id: 'Fenrir', label: 'Fenrir (مرد)' },
                                { id: 'Puck', label: 'Puck (شاد)' },
                                { id: 'Charon', label: 'Charon (بم)' }
                            ].map(v => (
                                <button 
                                    key={v.id}
                                    onClick={() => { setActiveVoice(v.id); setShowSettings(false); }}
                                    className={`p-3 rounded-xl text-xs font-bold transition-all ${activeVoice === v.id ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Visualizer */}
                <div className="relative w-full flex-grow flex items-center justify-center">
                    {/* Glow Rings */}
                    <div className={`absolute rounded-full border border-violet-500/30 transition-all duration-1000 ${status === 'speaking' ? 'w-80 h-80 opacity-0' : 'w-60 h-60 opacity-50'}`}></div>
                    <div className={`absolute rounded-full border border-fuchsia-500/30 transition-all duration-1000 delay-100 ${status === 'speaking' ? 'w-72 h-72 opacity-0' : 'w-52 h-52 opacity-50'}`}></div>
                    
                    {/* Core Orb */}
                    <div className={`relative z-10 w-48 h-48 rounded-full bg-gradient-to-b from-slate-800 to-black flex items-center justify-center shadow-2xl transition-all duration-300 ${status === 'speaking' ? 'shadow-[0_0_80px_rgba(139,92,246,0.6)] border-4 border-violet-400 scale-110' : 'border-2 border-white/10'}`}>
                        {status === 'speaking' ? (
                            <div className="flex gap-1.5 items-center h-12">
                                {visualizerData.map((h, i) => (
                                    <div key={i} className="w-2 bg-violet-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(15, h * 1.5)}%` }}></div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <MicrophoneIcon className={`w-16 h-16 transition-colors ${status === 'listening' ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`}/>
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                    {status === 'connecting' ? 'Connecting...' : status === 'listening' ? 'Listening' : 'Active'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Controls (Fixed Layout) */}
                <div className="w-full pb-8 pt-4">
                    <div className="flex items-center justify-center gap-6">
                        <button 
                            onClick={onClose}
                            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_40px_rgba(220,38,38,0.5)] flex items-center justify-center transition-transform hover:scale-105"
                        >
                            <XMarkIcon className="w-8 h-8"/>
                        </button>
                    </div>
                    <p className="text-center text-slate-500 text-xs mt-6">برای انجام کارها، فقط دستور دهید.</p>
                </div>
            </div>
        </div>
    );
};

// --- Main View ---

interface SmartAssistantViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const SmartAssistantView: React.FC<SmartAssistantViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAgents, setShowAgents] = useState(false);
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isProcessing]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;
        
        const userMsg: ChatMessage = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        try {
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: BENVIS_SYSTEM_PROMPT }
            });

            const result = await chat.sendMessageStream({ message: text });
            
            let fullText = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of result) {
                if (chunk.text) {
                    fullText += chunk.text;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
                        return newMsgs;
                    });
                }
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'model', text: "متاسفانه ارتباط برقرار نشد. لطفا دوباره تلاش کنید." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAgentSelect = (agent: Agent) => {
        setActiveAgent(agent);
        setShowAgents(false);
    };

    if (activeAgent) {
        return (
            <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col">
                <AiAgentRunner 
                    agent={activeAgent} 
                    onBack={() => setActiveAgent(null)} 
                    userData={userData} 
                    onUpdateUserData={onUpdateUserData} 
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] text-slate-200 font-[Vazirmatn] flex flex-col overflow-hidden animate-fadeIn">
            {isLive && <LiveSessionOverlay onClose={() => setIsLive(false)} userData={userData} onUpdateUserData={onUpdateUserData} />}

            {/* Background Ambience */}
            <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-fuchsia-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header - Fixed */}
            <div className="flex-none px-6 pt-6 pb-4 flex justify-between items-center bg-[#020617]/90 backdrop-blur-md z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40">
                        <SparklesIcon className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">نکسوس</h2>
                        <p className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.2em]">AI COMMAND</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowAgents(!showAgents)}
                    className={`p-2.5 rounded-xl border transition-all ${showAgents ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                    <BriefcaseIcon className="w-5 h-5"/>
                </button>
            </div>

            {/* Chat Area - Scrollable */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-4 scrollbar-hide relative">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-violet-600/20 blur-3xl rounded-full"></div>
                            <SparklesIcon className="w-16 h-16 text-violet-400 relative z-10 opacity-80" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">آماده‌ام، فرمانده</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto mb-8 leading-relaxed">
                            می‌توانید تایپ کنید یا برای اجرای دستورات (مثل ساخت تسک یا تراکنش) تماس زنده بگیرید.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                            {[
                                "برنامه‌ریزی امروز",
                                "تحلیل وضعیت خواب",
                                "ایده برای شام سالم",
                                "یک نکته روانشناسی"
                            ].map((suggestion, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className="p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 rounded-xl text-xs text-slate-300 transition-colors text-right backdrop-blur-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                                msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-br-none' 
                                    : 'bg-slate-800/80 backdrop-blur border border-white/5 text-slate-200 rounded-bl-none'
                            }`}>
                                <div className="whitespace-pre-wrap markdown-body">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isProcessing && (
                    <div className="flex justify-start animate-fadeIn">
                        <div className="bg-slate-800/80 backdrop-blur border border-white/5 p-4 rounded-2xl rounded-bl-none flex gap-1.5">
                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} className="h-4"></div>
            </div>

            {/* Bottom Dock (Fixed) */}
            <div className="flex-none p-4 bg-[#020617]/95 backdrop-blur-xl border-t border-white/5 z-30">
                
                {/* Agents Sheet (Pop-up) */}
                {showAgents && (
                    <div className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-[#1a1a1d] border border-white/10 rounded-2xl p-3 shadow-2xl animate-bounce-in overflow-hidden max-h-[60vh] flex flex-col z-40">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ابزارهای هوشمند</span>
                            <button onClick={() => setShowAgents(false)}><XMarkIcon className="w-4 h-4 text-slate-500"/></button>
                        </div>
                        <div className="overflow-y-auto scrollbar-hide space-y-1">
                            {agents.map(agent => (
                                <button 
                                    key={agent.id}
                                    onClick={() => handleAgentSelect(agent)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-right"
                                >
                                    <div className="p-2 bg-slate-800 rounded-lg text-violet-400">
                                        <agent.icon className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold">{agent.title}</span>
                                        <span className="block text-[10px] text-slate-500">{agent.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Input Bar */}
                <div className="flex items-end gap-2 bg-[#1e1e22] border border-white/10 p-2 rounded-[1.5rem] shadow-2xl relative">
                    
                    <button 
                        onClick={onClose}
                        className="p-3.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex-shrink-0"
                    >
                        <XMarkIcon className="w-5 h-5"/>
                    </button>

                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="پیام خود را بنویسید..."
                        rows={1}
                        className="flex-grow bg-transparent text-white px-2 py-3.5 outline-none text-sm placeholder-slate-500 max-h-32 resize-none scrollbar-hide font-medium"
                    />

                    {input.trim() ? (
                        <button 
                            onClick={() => handleSend()}
                            className="p-3.5 bg-violet-600 hover:bg-violet-500 rounded-full text-white shadow-lg shadow-violet-900/20 transition-all flex-shrink-0"
                        >
                            <ArrowUpIcon className="w-5 h-5"/>
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsLive(true)}
                            className="p-3.5 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg shadow-red-900/30 transition-all flex-shrink-0 animate-pulse"
                        >
                            <MicrophoneIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartAssistantView;

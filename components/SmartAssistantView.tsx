
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, FunctionDeclaration, Type, Modality } from "@google/genai";
import { 
    ChatMessage, OnboardingData, Agent, UserGoal, StandaloneTask, Transaction 
} from '../types';
import { 
    SparklesIcon, MicrophoneIcon, StopIcon, BriefcaseIcon,
    VideoCameraIcon, ArrowUpIcon, BookOpenIcon, BoltIcon, XMarkIcon,
    ChatBubbleOvalLeftEllipsisIcon, UserIcon, PaperAirplaneIcon,
    Square2StackIcon, CommandCommandLineIcon,
    ArrowLeftIcon
} from './icons';
import GratitudeJournal from './GratitudeJournal';
import AiAgentsHub from './AiAgentsHub';
import AiAgentRunner from './AiAgentRunner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BENVIS_SYSTEM_PROMPT = `
You are Benvis, an advanced AI Life Operating System Assistant.
Your goal is to help the user organize their life, achieve goals, build habits, and maintain wellness.
Tone: Professional yet friendly, encouraging, and insightful.
Language: You are fluent in Persian (Farsi). Always reply in Persian unless asked otherwise.
Keep responses concise and actionable.
`;

// --- Audio Utilities for Live API ---

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

// --- Tool Definitions for Live API ---

const tools: FunctionDeclaration[] = [
    {
        name: "create_goal",
        description: "Create a new life goal or project for the user.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the goal" },
                description: { type: Type.STRING, description: "A brief description" },
            },
            required: ["title"]
        }
    },
    {
        name: "create_task",
        description: "Add a new todo task to the user's list.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The task description" },
                urgent: { type: Type.BOOLEAN, description: "Is it urgent?" },
                important: { type: Type.BOOLEAN, description: "Is it important?" },
            },
            required: ["title"]
        }
    },
    {
        name: "log_transaction",
        description: "Log a financial transaction (expense or income).",
        parameters: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER, description: "Amount in Tomans" },
                description: { type: Type.STRING, description: "What was it for?" },
                type: { type: Type.STRING, enum: ["income", "expense"] }
            },
            required: ["amount", "type"]
        }
    }
];

// --- Live Assistant Component ---

const LiveAssistantSession: React.FC<{
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}> = ({ userData, onUpdateUserData, onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'thinking'>('connecting');
    const [transcript, setTranscript] = useState<string>("");
    
    const userDataRef = useRef(userData);
    userDataRef.current = userData; 
    
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const activeSessionRef = useRef<any>(null);
    
    // Refs for cleanup
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const connect = useCallback(async () => {
        try {
            // Initialize dedicated client for this session
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Setup Audio Output
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;

            // Setup Audio Input
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;
            
            if (inputCtx.state === 'suspended') await inputCtx.resume();
            if (ctx.state === 'suspended') await ctx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }});
            mediaStreamRef.current = stream;

            const voiceName = userData.audioSettings?.voice || 'Kore';

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    tools: [{ functionDeclarations: tools }],
                    systemInstruction: `
                        You are Benvis Live, a wise, deep-thinking life architect.
                        Your voice is calm, professional, and warm.
                        You help the user organize their thoughts, projects, and life.
                        If the user wants to add a goal, task, or transaction, use the provided tools.
                        Always speak in Persian (Farsi).
                        Keep responses concise for voice conversation, but thoughtful.
                    `,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
                    }
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
                            // Safety check: only send if session is active and context is running
                            if (!activeSessionRef.current || inputCtx.state === 'closed') return;

                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcm16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcm16.buffer);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: "audio/pcm;rate=16000",
                                        data: base64
                                    }
                                });
                            }).catch(err => {
                                console.warn("Send input failed", err);
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setStatus('speaking');
                            // Access ref directly to avoid closure staleness, though checking 'ctx' existence is key
                            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;

                            const bytes = base64ToUint8Array(audioData);
                            const int16Data = new Int16Array(bytes.buffer);
                            const float32Data = new Float32Array(int16Data.length);
                            for(let i=0; i<int16Data.length; i++) {
                                float32Data[i] = int16Data[i] / 32768.0;
                            }

                            const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
                            audioBuffer.copyToChannel(float32Data, 0);

                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContextRef.current.destination);
                            
                            const currentTime = audioContextRef.current.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + audioBuffer.duration;
                            
                            source.onended = () => {
                                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                                    setStatus('listening');
                                }
                            };
                            
                            audioQueueRef.current.push(source);
                        }

                        if (msg.toolCall) {
                            setStatus('thinking');
                            const functionResponses: any[] = [];
                            
                            for (const fc of msg.toolCall.functionCalls) {
                                const args = fc.args as any;
                                const currentData = userDataRef.current;
                                const newData = { ...currentData };

                                if (fc.name === 'create_goal') {
                                    const newGoal: UserGoal = {
                                        id: `goal-live-${Date.now()}`,
                                        title: args.title,
                                        description: args.description,
                                        type: 'simple',
                                        icon: 'Target',
                                        progress: 0,
                                        progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: 0 }]
                                    };
                                    newData.goals = [...(newData.goals || []), newGoal];
                                    setTranscript(`هدف جدید: ${args.title}`);
                                } else if (fc.name === 'create_task') {
                                    const newTask: StandaloneTask = {
                                        id: `task-live-${Date.now()}`,
                                        title: args.title,
                                        urgent: !!args.urgent,
                                        important: !!args.important,
                                        completed: false
                                    };
                                    newData.tasks = [...(newData.tasks || []), newTask];
                                    setTranscript(`تسک جدید: ${args.title}`);
                                } else if (fc.name === 'log_transaction') {
                                    const newTx: Transaction = {
                                        id: `tx-live-${Date.now()}`,
                                        amount: args.amount,
                                        description: args.description,
                                        type: args.type,
                                        date: new Date().toISOString().split('T')[0],
                                        categoryId: 'default',
                                        accountId: newData.financialAccounts?.[0]?.id || 'default'
                                    };
                                    newData.transactions = [...(newData.transactions || []), newTx];
                                    setTranscript(`تراکنش: ${args.amount} تومان`);
                                }

                                onUpdateUserData(newData);
                                userDataRef.current = newData;

                                functionResponses.push({
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: "Action performed successfully." }
                                });
                            }

                            sessionPromise.then(session => {
                                session.sendToolResponse({
                                    functionResponses: functionResponses
                                });
                            });
                        }
                    },
                    onclose: () => {
                        console.log("Live session closed");
                    },
                    onerror: (e) => {
                        console.error("Live session error", e);
                        setStatus('connecting');
                    }
                }
            });
        } catch (error) {
            console.error("Connection initialization error", error);
            setStatus('connecting');
        }

    }, [onUpdateUserData, userData.audioSettings]);

    useEffect(() => {
        connect();

        // Cleanup function
        return () => {
            // Stop audio processing
            if (processorRef.current && inputContextRef.current) {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null;
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            
            // Stop media tracks
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }

            // Close audio contexts
            if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
                inputContextRef.current.close();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            
            activeSessionRef.current = null;
        };
    }, [connect]);

    return (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-fadeIn">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/40 via-slate-950 to-black"></div>
            
            <div className="absolute top-6 right-6 z-20">
                <button onClick={onClose} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-full text-white hover:text-red-400 transition-all backdrop-blur-md">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="text-center space-y-12 relative z-10 w-full max-w-md px-6">
                <div className="relative mx-auto">
                    {/* Visualizer Rings */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-violet-500/20 transition-all duration-1000 ${status === 'speaking' ? 'scale-110 opacity-100' : 'scale-90 opacity-50'}`}></div>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-fuchsia-500/20 transition-all duration-1000 delay-100 ${status === 'speaking' ? 'scale-125 opacity-100' : 'scale-95 opacity-50'}`}></div>
                    
                    <div className={`w-40 h-40 rounded-full blur-3xl transition-all duration-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                        status === 'speaking' ? 'bg-cyan-500 opacity-60 scale-125' :
                        status === 'listening' ? 'bg-emerald-500 opacity-40 scale-100' :
                        status === 'thinking' ? 'bg-violet-500 opacity-70 animate-pulse' :
                        'bg-slate-500 opacity-20'
                    }`}></div>
                    
                    <div className={`relative z-10 w-36 h-36 rounded-full border-4 flex items-center justify-center bg-black/60 backdrop-blur-xl transition-all duration-300 shadow-2xl ${
                        status === 'speaking' ? 'border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.4)]' :
                        status === 'listening' ? 'border-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.4)]' :
                        'border-violet-500 shadow-[0_0_50px_rgba(139,92,246,0.2)]'
                    } mx-auto`}>
                        {status === 'listening' && <MicrophoneIcon className="w-14 h-14 text-emerald-400 animate-pulse"/>}
                        {status === 'speaking' && <BoltIcon className="w-14 h-14 text-cyan-400 animate-pulse"/>}
                        {status === 'thinking' && <SparklesIcon className="w-14 h-14 text-violet-400 animate-spin"/>}
                        {status === 'connecting' && <div className="w-14 h-14 border-t-4 border-white rounded-full animate-spin"></div>}
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        {status === 'listening' ? 'گوش می‌کنم...' : 
                         status === 'speaking' ? 'در حال صحبت...' :
                         status === 'thinking' ? 'در حال پردازش...' : 'اتصال به بنویس'}
                    </h2>
                    <p className="text-slate-400 text-base min-h-[24px] px-4 font-medium">
                        {transcript || (status === 'listening' ? "صحبت کنید..." : " ")}
                    </p>
                </div>
                
                <div className="flex justify-center gap-4">
                    <button className="px-6 py-2 bg-white/5 rounded-full text-sm text-slate-400 border border-white/10 backdrop-blur-sm">هدف جدید</button>
                    <button className="px-6 py-2 bg-white/5 rounded-full text-sm text-slate-400 border border-white/10 backdrop-blur-sm">تسک جدید</button>
                </div>
            </div>
        </div>
    );
};

// --- Chat Component (Text) ---

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'سلام دوست من! من اینجام تا ذهنت رو منظم کنم. چه خبری داری؟' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSessionRef = useRef<Chat | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            if (!chatSessionRef.current) {
                chatSessionRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction: BENVIS_SYSTEM_PROMPT }
                });
            }

            const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
            const modelMsg: ChatMessage = { role: 'model', text: result.text || '' };
            setMessages(prev => [...prev, modelMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: 'متاسفانه مشکلی پیش آمد. لطفا دوباره تلاش کنید.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative bg-transparent">
            <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-28 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/30 flex-shrink-0">
                                <SparklesIcon className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div 
                            className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-violet-600 text-white rounded-br-none' 
                                    : 'bg-slate-800/80 backdrop-blur-md text-slate-200 rounded-bl-none border border-white/5'
                            }`}
                        >
                            {msg.text}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start items-end gap-2">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
                                <SparklesIcon className="w-4 h-4 text-white" />
                        </div>
                         <div className="bg-slate-800/60 p-4 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef}></div>
            </div>

            {/* Floating Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent z-10 pb-6">
                <div className="glass-panel p-2 flex items-center rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-grow bg-transparent text-white px-4 py-2 outline-none placeholder-slate-500"
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-colors disabled:bg-slate-700 disabled:text-slate-500 shadow-lg shadow-violet-900/20"
                    >
                        <ArrowUpIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const AgentSelector: React.FC<{ userData: OnboardingData; onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    if (selectedAgent) {
        return (
            <div className="h-full overflow-y-auto pb-24">
                <AiAgentRunner 
                    agent={selectedAgent} 
                    onBack={() => setSelectedAgent(null)} 
                    userData={userData} 
                    onUpdateUserData={onUpdateUserData} 
                />
            </div>
        );
    }
    
    return (
        <div className="h-full overflow-y-auto pb-24 px-4 pt-2">
             <AiAgentsHub onAgentSelect={setSelectedAgent} />
        </div>
    );
};

const VoiceLauncher: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center pb-20">
            <div className="relative group cursor-pointer" onClick={onLaunch}>
                <div className="absolute inset-0 bg-violet-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300 group-hover:border-violet-500/50">
                    <MicrophoneIcon className="w-20 h-20 text-violet-400 group-hover:text-white transition-colors" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    شروع صحبت
                </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-10 mb-2">دستیار صوتی زنده</h3>
            <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
                برای برنامه‌ریزی، ثبت تراکنش یا فقط درد و دل کردن، با من صحبت کن. من همیشه آماده شنیدن هستم.
            </p>
        </div>
    );
};

interface SmartAssistantViewProps {
  userData: OnboardingData;
  onUpdateUserData: (data: OnboardingData) => void;
  initialTab?: string;
  initialJournalText?: string;
  onClose: () => void;
}

type Tab = 'chat' | 'agents' | 'journal' | 'voice';

const SmartAssistantView: React.FC<SmartAssistantViewProps> = ({ userData, onUpdateUserData, initialTab, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) || 'chat');
    const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
    
    const NavButton: React.FC<{ id: Tab; label: string; icon: React.FC<{className?: string}> }> = ({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
            <button 
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center justify-center w-full py-3 gap-1.5 transition-all relative group ${isActive ? 'text-fuchsia-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-fuchsia-500/20 -translate-y-3 shadow-lg shadow-fuchsia-900/20 ring-1 ring-fuchsia-500/50' : 'bg-transparent group-hover:bg-white/5'}`}>
                    <Icon className={`w-7 h-7 ${isActive ? 'fill-current' : ''}`} />
                </div>
                <span className={`text-xs font-bold absolute bottom-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{label}</span>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] text-slate-200 font-[Vazirmatn] flex flex-col overflow-hidden animate-fadeIn">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-fuchsia-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {isLiveSessionActive && (
                <LiveAssistantSession 
                    userData={userData} 
                    onUpdateUserData={onUpdateUserData} 
                    onClose={() => setIsLiveSessionActive(false)} 
                />
            )}

            {/* Header */}
            <div className="relative z-10 px-6 pt-6 pb-2 flex justify-between items-center border-b border-white/5 bg-[#020617]/50 backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">دستیار هوشمند</h2>
                    <p className="text-xs text-fuchsia-500 font-bold uppercase tracking-widest opacity-80">AI Copilot</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-lg">
                    <SparklesIcon className="w-5 h-5 text-fuchsia-400"/>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-grow relative z-10 overflow-hidden">
                 {activeTab === 'chat' && <ChatBot />}
                 {activeTab === 'agents' && <AgentSelector userData={userData} onUpdateUserData={onUpdateUserData} />}
                 {activeTab === 'journal' && (
                     <div className="h-full overflow-y-auto p-4 pb-32">
                         <GratitudeJournal />
                     </div>
                 )}
                 {activeTab === 'voice' && <VoiceLauncher onLaunch={() => setIsLiveSessionActive(true)} />}
            </div>

            {/* Bottom Dock Navigation */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
                <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/20 rounded-[2rem] p-3 shadow-2xl flex items-center justify-between px-6">
                    <NavButton id="chat" label="چت" icon={ChatBubbleOvalLeftEllipsisIcon} />
                    <NavButton id="agents" label="ابزارها" icon={BriefcaseIcon} />
                    
                    {/* Center Home Button */}
                    <button 
                        onClick={onClose}
                        className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-105 -mt-8 relative z-10"
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>

                    <NavButton id="journal" label="ژورنال" icon={BookOpenIcon} />
                    <NavButton id="voice" label="زنده" icon={BoltIcon} />
                </div>
            </div>
        </div>
    );
};

export default SmartAssistantView;

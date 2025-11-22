
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingData, ChatMessage, UserGoal, Habit, Note } from '../types';
import { GoogleGenAI, Type, FunctionDeclaration, LiveServerMessage, Modality } from "@google/genai";
import { 
    HealthIcon, BrainIcon, HeartIcon, WaterDropIcon, MoonIcon, 
    WalkingIcon, FaceSmileIcon, ChatBubbleLeftRightIcon, ArrowLeftIcon,
    SparklesIcon, PaperAirplaneIcon, PlusIcon, CheckCircleIcon, BeakerIcon,
    BoltIcon, SunIcon, MicrophoneIcon, XMarkIcon, FireIcon, LeafIcon,
    EyeIcon, LockClosedIcon, LockOpenIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface HealthWellnessViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

// --- Data Definitions ---

const CHAKRAS = [
    { id: 'root', name: 'ریشه (مولادهارا)', element: 'زمین', color: 'bg-red-600', glow: 'shadow-red-500/50', text: 'text-red-400', wisdom: 'من هستم. ریشه در امنیت، بقا و ثبات مادی دارد. وقتی متعادل است، احساس امنیت و حضور می‌کنید.' },
    { id: 'sacral', name: 'خاجی (سوادیشتانا)', element: 'آب', color: 'bg-orange-500', glow: 'shadow-orange-500/50', text: 'text-orange-400', wisdom: 'من احساس می‌کنم. مرکز خلاقیت، لذت و احساسات. جریان سیال زندگی در اینجا جاریست.' },
    { id: 'solar', name: 'خورشیدی (مانیپورا)', element: 'آتش', color: 'bg-yellow-500', glow: 'shadow-yellow-500/50', text: 'text-yellow-400', wisdom: 'من انجام می‌دهم. کانون اراده، قدرت شخصی و اعتماد به نفس. آتش درونی برای اقدام.' },
    { id: 'heart', name: 'قلب (آناهاتا)', element: 'هوا', color: 'bg-green-600', glow: 'shadow-green-500/50', text: 'text-green-400', wisdom: 'من عشق می‌ورزم. پل میان زمین و آسمان. مرکز عشق بی قید و شرط، همدلی و شفا.' },
    { id: 'throat', name: 'گلو (ویشودها)', element: 'اثیر', color: 'bg-cyan-500', glow: 'shadow-cyan-500/50', text: 'text-cyan-400', wisdom: 'من بیان می‌کنم. صدای حقیقت درونی و ارتباط شفاف. جایی که نیت به واقعیت تبدیل می‌شود.' },
    { id: 'third_eye', name: 'چشم سوم (آجنا)', element: 'نور', color: 'bg-indigo-600', glow: 'shadow-indigo-500/50', text: 'text-indigo-400', wisdom: 'من می‌بینم. مرکز شهود، بینش و خرد فراتر از زمان و مکان. دیدن آنچه پنهان است.' },
    { id: 'crown', name: 'تاج (ساحاسرارا)', element: 'آگاهی', color: 'bg-violet-600', glow: 'shadow-violet-500/50', text: 'text-violet-400', wisdom: 'من می‌دانم. اتصال به منبع هستی و آگاهی خالص. یگانگی با کائنات.' },
];

// --- Audio Helpers for Live Session ---
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

// --- Therapy Tools Definition ---
const therapyTools: FunctionDeclaration[] = [
    {
        name: "create_goal",
        description: "Create a new health or wellness goal for the user based on the conversation.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Title of the goal" },
                type: { type: Type.STRING, enum: ["simple", "smart"], description: "Type of goal" },
            },
            required: ["title"]
        }
    },
    {
        name: "create_habit",
        description: "Create a new daily habit for the user.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of the habit" },
                type: { type: Type.STRING, enum: ["good", "bad"], description: "Good habit to build or bad habit to break" },
            },
            required: ["name"]
        }
    },
    {
        name: "log_journal",
        description: "Save a journal entry or insight from the therapy session.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "The content of the journal entry" },
            },
            required: ["content"]
        }
    }
];

const THERAPIST_SYSTEM_PROMPT = `
You are Dr. Benvis, a compassionate, wise, and professional AI Therapist and Health Coach.
Your goal is to help the user achieve physical and mental well-being.
Listen actively, ask insightful questions, and provide empathetic support.
You have tools to help the user take action:
- If they want to start doing something regularly, use 'create_habit'.
- If they have a specific objective (lose weight, reduce stress), use 'create_goal'.
- If they share a deep thought or realization, use 'log_journal' to save it.
Always speak in Persian (Farsi). Be warm, encouraging, but grounded in science/psychology.
`;

// --- Live Therapist Session Component ---
const LiveTherapistSession: React.FC<{
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}> = ({ userData, onUpdateUserData, onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'>('connecting');
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
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;

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

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    tools: [{ functionDeclarations: therapyTools }],
                    systemInstruction: `
                        You are Dr. Benvis, a warm and professional therapist.
                        Speak in fluent Persian with a calming, empathetic tone.
                        Help the user with mental health, stress, or physical wellness.
                        Use tools to create goals or habits if the user asks.
                    `,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
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
                            if (!activeSessionRef.current || inputCtx.state === 'closed') return;

                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcm16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcm16.buffer);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: { mimeType: "audio/pcm;rate=16000", data: base64 }
                                });
                            }).catch(console.warn);
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setStatus('speaking');
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
                                        id: `goal-therapy-${Date.now()}`,
                                        title: args.title,
                                        type: args.type || 'simple',
                                        icon: 'Health',
                                        progress: 0,
                                        progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: 0 }]
                                    };
                                    newData.goals = [...(newData.goals || []), newGoal];
                                    setTranscript(`هدف جدید ایجاد شد: ${args.title}`);
                                } else if (fc.name === 'create_habit') {
                                    const newHabit: Habit = {
                                        name: args.name,
                                        type: args.type || 'good',
                                        icon: 'Health'
                                    };
                                    if (!newData.habits.some(h => h.name === newHabit.name)) {
                                        newData.habits = [...newData.habits, newHabit];
                                        setTranscript(`عادت جدید: ${args.name}`);
                                    }
                                } else if (fc.name === 'log_journal') {
                                    const newNote: Note = {
                                        id: `note-therapy-${Date.now()}`,
                                        content: `[Live Therapy]: ${args.content}`,
                                        createdAt: new Date().toISOString()
                                    };
                                    // Sync to storage manually as it might not be in userData prop
                                    const existingNotes = JSON.parse(localStorage.getItem('benvis_journal') || '[]');
                                    localStorage.setItem('benvis_journal', JSON.stringify([newNote, ...existingNotes]));
                                    setTranscript("یادداشت ذخیره شد.");
                                }

                                onUpdateUserData(newData);
                                userDataRef.current = newData;

                                functionResponses.push({
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: "Success" }
                                });
                            }

                            sessionPromise.then(session => {
                                session.sendToolResponse({ functionResponses });
                            });
                        }
                    },
                    onclose: () => console.log("Closed"),
                    onerror: (e) => {
                        console.error(e);
                        setStatus('error');
                    }
                }
            });
        } catch (error) {
            console.error(error);
            setStatus('error');
        }

    }, [onUpdateUserData]);

    useEffect(() => {
        connect();
        return () => {
            if (processorRef.current) processorRef.current.disconnect();
            if (sourceRef.current) sourceRef.current.disconnect();
            if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
            if (inputContextRef.current) inputContextRef.current.close();
            if (audioContextRef.current) audioContextRef.current.close();
            activeSessionRef.current = null;
        };
    }, [connect]);

    const handleRetry = () => {
        setStatus('connecting');
        connect();
    };

    return (
        <div className="fixed inset-0 z-[80] bg-[#0f172a] flex flex-col items-center justify-center animate-fadeIn">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-black"></div>
            
            <div className="absolute top-6 right-6 z-20">
                <button onClick={onClose} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-full text-white hover:text-red-400 transition-all backdrop-blur-md">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="text-center space-y-8 relative z-10 w-full max-w-md px-6">
                {status === 'error' ? (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-6 backdrop-blur-md">
                        <BoltIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">اتصال برقرار نشد</h3>
                        <p className="text-slate-300 mb-6 text-sm">متاسفانه سرویس در حال حاضر در دسترس نیست یا مشکلی در شبکه وجود دارد.</p>
                        <button onClick={handleRetry} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-lg">
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative mx-auto">
                            <div className={`w-48 h-48 rounded-full border-4 flex items-center justify-center bg-black/60 backdrop-blur-xl transition-all duration-500 shadow-2xl mx-auto ${
                                status === 'speaking' ? 'border-teal-400 shadow-[0_0_60px_rgba(45,212,191,0.4)] scale-110' :
                                status === 'listening' ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]' :
                                'border-slate-600'
                            }`}>
                                <div className="flex flex-col items-center">
                                    {status === 'speaking' ? <BoltIcon className="w-16 h-16 text-teal-400 animate-pulse"/> : 
                                     status === 'listening' ? <MicrophoneIcon className="w-16 h-16 text-emerald-400"/> : 
                                     <SparklesIcon className="w-16 h-16 text-slate-500 animate-spin"/>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                                {status === 'listening' ? 'گوش می‌کنم...' : 
                                 status === 'speaking' ? 'دکتر بنویس...' :
                                 status === 'thinking' ? 'در حال تفکر...' : 'اتصال...'}
                            </h2>
                            <p className="text-slate-400 font-medium min-h-[24px]">{transcript}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- Body Optimization Section ---
const BodySection: React.FC = () => {
    const [water, setWater] = useState(0);
    const [sleep, setSleep] = useState(7);
    const [energyLevel, setEnergyLevel] = useState(70);
    
    return (
        <div className="space-y-6 animate-fadeIn p-4 pb-24">
            {/* Bio-Metrics Dashboard */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-indigo-500/30 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-2">
                        <MoonIcon className="w-6 h-6 text-indigo-400" />
                        <span className="text-xs text-indigo-300 font-bold bg-indigo-900/30 px-2 py-1 rounded">کیفیت: ۸۵٪</span>
                    </div>
                    <p className="text-2xl font-black text-white">{sleep} <span className="text-xs font-normal text-slate-400">ساعت</span></p>
                    <p className="text-xs text-slate-400 mt-1">چرخه REM بهینه</p>
                    <input 
                        type="range" 
                        min="4" max="12" step="0.5"
                        value={sleep}
                        onChange={(e) => setSleep(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-3"
                    />
                </div>

                <div className="bg-slate-800/50 border border-blue-500/30 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-2">
                        <WaterDropIcon className="w-6 h-6 text-blue-400" />
                        <span className="text-xs text-blue-300 font-bold bg-blue-900/30 px-2 py-1 rounded">{Math.round((water/8)*100)}٪</span>
                    </div>
                    <p className="text-2xl font-black text-white">{water} <span className="text-xs font-normal text-slate-400">لیوان</span></p>
                    <p className="text-xs text-slate-400 mt-1">هیدراتاسیون سلولی</p>
                    <div className="flex gap-1 mt-3">
                        <button onClick={() => setWater(Math.max(0, water-1))} className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center hover:bg-slate-600">-</button>
                        <button onClick={() => setWater(Math.min(12, water+1))} className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-500 text-white">+</button>
                    </div>
                </div>
            </div>

            {/* Circadian Rhythm & Energy */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-3xl shadow-xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <SunIcon className="w-6 h-6 text-yellow-400" />
                        ریتم سیرکادین
                    </h3>
                    <span className="text-xs font-mono text-slate-400 border border-slate-600 px-2 py-1 rounded">14:30 PM</span>
                </div>
                
                {/* Energy Wave Visualization (CSS approximation) */}
                <div className="h-24 w-full bg-slate-900/50 rounded-xl border border-slate-700 relative overflow-hidden mb-4">
                    <div className="absolute bottom-0 left-0 right-0 h-full flex items-end px-2 gap-1">
                        {[40, 60, 80, 90, 70, 50, 30, 20, 40, 70, 95, 80, 60, 40].map((h, i) => (
                            <div key={i} className="flex-1 bg-teal-500/20 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-slate-500/30"></div>
                    <div className="absolute top-2 right-2 text-[10px] text-teal-400 font-bold">پیک انرژی</div>
                </div>

                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>سطح انرژی فعلی</span>
                        <span>{energyLevel}٪</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-500 to-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${energyLevel}%` }}></div>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-800/50 border border-green-500/20 p-6 rounded-2xl backdrop-blur-md">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-green-300 flex items-center gap-2">
                        <WalkingIcon className="w-6 h-6" />
                        تحرک و متابولیسم
                    </h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {['HIIT', 'یوگا', 'پیاده‌روی'].map(activity => (
                        <button key={activity} className="p-3 bg-slate-700/50 hover:bg-green-600/20 hover:border-green-500/50 border border-transparent rounded-xl text-sm font-bold text-slate-300 hover:text-green-300 transition-all shadow-sm">
                            {activity}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Chakra & Energy Wisdom Section ---
const ChakraTherapySection: React.FC = () => {
    const [selectedChakra, setSelectedChakra] = useState<string | null>(null);
    const [userFeeling, setUserFeeling] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState<{ chakraId: string; advice: string; exercise: string } | null>(null);

    const handleScan = async () => {
        if (!userFeeling.trim()) return;
        setIsAnalyzing(true);
        setDiagnosis(null);

        const prompt = `
            As a master of ancient Hikmat and Energy Healing, analyze the user's somatic and emotional report.
            User says: "${userFeeling}".
            Identify which ONE of the 7 Chakras (Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, Crown) is most likely blocked or imbalanced.
            Provide:
            1. The Chakra ID (root, sacral, solar, heart, throat, third_eye, crown).
            2. Specific Wisdom Advice (Hikmat) in Persian.
            3. A short actionable exercise (breathing, mantra, or movement) in Persian.
            
            Response JSON Schema:
            {
              "chakraId": "string",
              "advice": "string",
              "exercise": "string"
            }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const result = JSON.parse(response.text.trim());
            setDiagnosis(result);
            setSelectedChakra(result.chakraId);
        } catch (e) {
            console.error(e);
            alert("خطا در تحلیل انرژی. لطفا دوباره تلاش کنید.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const activeChakraData = CHAKRAS.find(c => c.id === selectedChakra);

    return (
        <div className="h-full flex flex-col animate-fadeIn relative overflow-hidden">
            {/* Background Aura */}
            {activeChakraData && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[150px] opacity-20 pointer-events-none transition-colors duration-1000 ${activeChakraData.color}`}></div>
            )}

            <div className="flex-grow overflow-y-auto p-4 pb-24 scrollbar-hide z-10">
                
                {/* Diagnostic Input */}
                <div className="bg-slate-900/80 border border-violet-500/30 p-5 rounded-3xl shadow-2xl mb-8 backdrop-blur-xl">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-violet-400"/>
                        اسکنر انرژی هوشمند
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">حس فیزیکی یا روحی خود را بنویسید (مثلا: احساس سنگینی در سینه دارم، یا خیلی مضطرب و بی‌قرارم).</p>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={userFeeling}
                            onChange={e => setUserFeeling(e.target.value)}
                            placeholder="الان چه حسی داری؟"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 pr-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            onKeyDown={e => e.key === 'Enter' && handleScan()}
                        />
                        <button 
                            onClick={handleScan}
                            disabled={isAnalyzing || !userFeeling}
                            className="absolute left-2 top-2 bottom-2 bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:bg-slate-700"
                        >
                            {isAnalyzing ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <SearchIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>

                {/* Diagnosis Result */}
                {diagnosis && (
                    <div className="mb-8 animate-bounce-in">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-2 h-full ${activeChakraData?.color}`}></div>
                            <h4 className="text-xl font-black text-white mb-2">تشخیص: انسداد {activeChakraData?.name}</h4>
                            <p className="text-sm text-slate-300 leading-relaxed mb-4">{diagnosis.advice}</p>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">تمرین تجویزی</p>
                                <p className="text-white font-medium">{diagnosis.exercise}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Interactive Human Chakra Map */}
                <div className="relative flex justify-center items-center py-4">
                    <div className="relative w-64 h-[500px] bg-slate-800/30 rounded-full border border-slate-700/30 flex flex-col items-center justify-between py-10 shadow-inner backdrop-blur-sm">
                        {/* Silhouette hint */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <div className="w-40 h-[450px] bg-slate-500 rounded-[40px]"></div>
                        </div>

                        {CHAKRAS.map((chakra, index) => (
                            <button
                                key={chakra.id}
                                onClick={() => { setSelectedChakra(chakra.id); setDiagnosis(null); }}
                                className={`relative group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ${selectedChakra === chakra.id ? `${chakra.color} ${chakra.glow} scale-125 z-20` : 'bg-slate-700 hover:bg-slate-600 hover:scale-110 z-10'}`}
                            >
                                <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 absolute whitespace-nowrap right-14 bg-black/80 px-2 py-1 rounded transition-opacity pointer-events-none">
                                    {chakra.name}
                                </span>
                                <div className={`w-3 h-3 rounded-full bg-white/80 ${selectedChakra === chakra.id ? 'animate-pulse' : ''}`}></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chakra Wisdom Card (Manual Selection) */}
                {selectedChakra && !diagnosis && activeChakraData && (
                    <div className="mt-6 bg-slate-800/60 border border-slate-700 rounded-3xl p-6 animate-fadeIn backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full ${activeChakraData.color} shadow-lg flex items-center justify-center`}>
                                <LeafIcon className="w-5 h-5 text-white"/>
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${activeChakraData.text}`}>{activeChakraData.name}</h3>
                                <span className="text-xs text-slate-400 font-mono">عنصر: {activeChakraData.element}</span>
                            </div>
                        </div>
                        <p className="text-slate-200 text-sm leading-loose text-justify">
                            {activeChakraData.wisdom}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SearchIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const TherapyChat: React.FC<{ userData: OnboardingData; onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'سلام. من دکتر بنویس هستم. چطور می‌توانم به سلامت جسم و روح شما کمک کنم؟' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSessionRef = useRef<any>(null);
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
                    config: { systemInstruction: THERAPIST_SYSTEM_PROMPT }
                });
            }

            const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
            const responseText = result.text || 'متوجه نشدم.';
            
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: 'متاسفانه مشکلی پیش آمد.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative bg-slate-900/30">
            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-20">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-teal-600 text-white rounded-br-none' 
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none border border-slate-700">
                            <SparklesIcon className="w-5 h-5 text-teal-400 animate-spin"/>
                        </div>
                    </div>
                )}
                <div ref={scrollRef}></div>
            </div>
            <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-slate-800">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-grow bg-slate-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50">
                        <PaperAirplaneIcon className="w-5 h-5 transform rotate-90"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main View ---
const HealthWellnessView: React.FC<HealthWellnessViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [activeTab, setActiveTab] = useState<'body' | 'energy' | 'therapy'>('therapy');

    return (
        <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col animate-fadeIn">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-teal-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 px-4 pt-6 pb-2 flex justify-between items-center border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">کلینیک جامع</h2>
                        <p className="text-xs text-teal-500 font-bold uppercase tracking-widest opacity-80">Holistic Health OS</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                    <HealthIcon className="w-5 h-5 text-white"/>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center gap-2 py-4 bg-[#020617]/50 relative z-10 px-4 overflow-x-auto no-scrollbar">
                {[
                    { id: 'therapy', label: 'تراپیست هوشمند', icon: ChatBubbleLeftRightIcon },
                    { id: 'body', label: 'بهینه‌سازی جسم', icon: BoltIcon },
                    { id: 'energy', label: 'حکمت چاکرا', icon: EyeIcon },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-lg scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <tab.icon className="w-4 h-4"/>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-grow overflow-hidden relative z-10">
                {activeTab === 'body' && <BodySection />}
                {activeTab === 'energy' && <ChakraTherapySection />}
                {activeTab === 'therapy' && <TherapyChat userData={userData} onUpdateUserData={onUpdateUserData} />}
            </div>
        </div>
    );
};

export default HealthWellnessView;

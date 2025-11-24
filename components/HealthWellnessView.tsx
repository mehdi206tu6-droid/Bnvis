
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingData, ChatMessage } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { 
    HealthIcon, BrainIcon, HeartIcon, WaterDropIcon, MoonIcon, 
    WalkingIcon, FaceSmileIcon, ChatBubbleLeftRightIcon, ArrowLeftIcon,
    SparklesIcon, ArrowUpIcon, CheckCircleIcon,
    BoltIcon, SunIcon, MicrophoneIcon, XMarkIcon, FireIcon, LeafIcon,
    EyeIcon, StopIcon, PlayIcon, ScaleIcon, ChartBarIcon,
    ChatBubbleOvalLeftEllipsisIcon, SpeakerWaveIcon, UserIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface HealthWellnessViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

// --- Audio Processing Utilities ---
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
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
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return btoa(binary);
}

// --- Configuration ---
const CHAKRAS = [
    { id: 'crown', name: 'تاج', color: 'bg-violet-500', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.8)]', freq: 963, position: 'top-[2%]' },
    { id: 'third_eye', name: 'چشم سوم', color: 'bg-indigo-600', glow: 'shadow-[0_0_30px_rgba(79,70,229,0.8)]', freq: 852, position: 'top-[12%]' },
    { id: 'throat', name: 'گلو', color: 'bg-cyan-400', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.8)]', freq: 741, position: 'top-[22%]' },
    { id: 'heart', name: 'قلب', color: 'bg-emerald-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.8)]', freq: 639, position: 'top-[35%]' },
    { id: 'solar', name: 'خورشیدی', color: 'bg-yellow-400', glow: 'shadow-[0_0_30px_rgba(250,204,21,0.8)]', freq: 528, position: 'top-[48%]' },
    { id: 'sacral', name: 'خاجی', color: 'bg-orange-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.8)]', freq: 417, position: 'top-[60%]' },
    { id: 'root', name: 'ریشه', color: 'bg-red-600', glow: 'shadow-[0_0_30px_rgba(220,38,38,0.8)]', freq: 396, position: 'top-[72%]' },
];

const PERSONAS = {
    therapy: "You are a compassionate therapist. Speak Persian. Be concise, warm, and professional.",
    energy: "You are a metaphysics expert based on the 'Book of Wisdom' by Harry B. Joseph. Speak Persian. Discuss Energy, Chakras, Aura, and Frequency. Be mystical but practical.",
    body: "You are a fitness & health coach. Speak Persian. Focus on biology, nutrition, and sleep.",
    mind: "You are a Zen meditation master. Speak Persian. Focus on breath, mindfulness, and peace."
};

// --- Live Session Component ---
const LiveHealthSession: React.FC<{ persona: string; title: string; onClose: () => void }> = ({ persona, title, onClose }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [speakingState, setSpeakingState] = useState<'user' | 'ai' | 'silence'>('silence');
    
    // Audio Context Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionRef = useRef<any>(null);

    const cleanup = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) sourceRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (inputCtxRef.current) inputCtxRef.current.close();
        if (audioCtxRef.current) audioCtxRef.current.close();
        sessionRef.current = null;
    };

    useEffect(() => {
        startSession();
        return () => cleanup();
    }, []);

    const startSession = async () => {
        setStatus('connecting');
        try {
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioCtxRef.current = ctx;
            
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputCtxRef.current = inputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true } });
            streamRef.current = stream;

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: persona,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
                },
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        setSpeakingState('silence');
                        
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                            if (sum > 5) setSpeakingState('user'); // Lower threshold for visuals
                            else if (status === 'connected' && speakingState === 'user') setSpeakingState('silence');

                            const pcm16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcm16.buffer);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: { mimeType: "audio/pcm;rate=16000", data: base64 }
                                });
                            });
                        };

                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                        
                        sourceRef.current = source;
                        processorRef.current = processor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioCtxRef.current) {
                            setSpeakingState('ai');
                            const bytes = base64ToUint8Array(audioData);
                            const int16 = new Int16Array(bytes.buffer);
                            const float32 = new Float32Array(int16.length);
                            for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;
                            
                            const buffer = audioCtxRef.current.createBuffer(1, float32.length, 24000);
                            buffer.copyToChannel(float32, 0);
                            
                            const source = audioCtxRef.current.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioCtxRef.current.destination);
                            
                            const now = audioCtxRef.current.currentTime;
                            const startTime = Math.max(now, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            
                            source.onended = () => {
                                if (audioCtxRef.current && audioCtxRef.current.currentTime >= nextStartTimeRef.current) {
                                    setSpeakingState('silence');
                                }
                            };
                        }
                    },
                    onclose: () => setStatus('idle'),
                    onerror: (err) => {
                        console.error(err);
                        setStatus('error');
                    }
                }
            });
            sessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Connection failed", e);
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-fadeIn">
            <div className={`absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-black pointer-events-none transition-opacity duration-1000 ${speakingState === 'ai' ? 'opacity-100' : 'opacity-50'}`}></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
                <div className="mb-10">
                    {status === 'connecting' && <div className="px-4 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold animate-pulse">در حال اتصال...</div>}
                    {status === 'error' && <div className="px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">خطا در اتصال</div>}
                    {status === 'connected' && (
                        <div className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${speakingState === 'ai' ? 'bg-cyan-500/20 text-cyan-400' : speakingState === 'user' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                            {speakingState === 'ai' ? 'در حال صحبت...' : speakingState === 'user' ? 'گوش می‌کنم...' : 'متصل'}
                        </div>
                    )}
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                    <div className={`absolute w-40 h-40 rounded-full bg-gradient-to-br transition-all duration-500 ${
                        status === 'connected' 
                            ? (speakingState === 'ai' ? 'from-cyan-400 to-blue-600 shadow-[0_0_80px_rgba(34,211,238,0.6)] scale-110' 
                            : (speakingState === 'user' ? 'from-green-400 to-emerald-600 shadow-[0_0_60px_rgba(52,211,153,0.4)] scale-95' 
                            : 'from-slate-700 to-slate-900 shadow-[0_0_40px_rgba(255,255,255,0.1)]')) 
                            : 'from-slate-800 to-black border border-white/10'
                    }`}></div>

                    {status === 'connected' && (
                        <>
                            <div className={`absolute inset-0 rounded-full border border-white/10 animate-ping ${speakingState === 'ai' ? 'opacity-50 duration-[2s]' : 'opacity-0'}`}></div>
                            <div className={`absolute inset-[-20px] rounded-full border border-white/5 animate-ping ${speakingState === 'ai' ? 'opacity-30 duration-[3s] delay-75' : 'opacity-0'}`}></div>
                        </>
                    )}

                    <div className="relative z-10">
                        <SpeakerWaveIcon className={`w-16 h-16 text-white transition-opacity ${speakingState === 'ai' ? 'opacity-100' : 'opacity-50'}`} />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-2 text-center">{title}</h2>
                <p className="text-slate-400 text-sm text-center mb-10 max-w-xs mx-auto">
                    مکالمه صوتی هوشمند و زنده
                </p>

                <button onClick={onClose} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/30 hover:scale-105 transition-all">
                    <XMarkIcon className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

// --- Text Chat Component ---
const SectionChat: React.FC<{ systemPrompt: string; placeholder: string }> = ({ systemPrompt, placeholder }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'model', text: 'سلام دوست من. من اینجام. چه کمکی از دستم برمیاد؟' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const send = async () => {
        if (!input.trim()) return;
        const userText = input;
        setMessages(p => [...p, { role: 'user', text: userText }]);
        setInput('');
        setLoading(true);
        try {
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `System: ${systemPrompt}\nUser: ${userText}`
            });
            setMessages(p => [...p, { role: 'model', text: res.text.trim() }]);
        } catch {
            setMessages(p => [...p, { role: 'model', text: 'متاسفانه ارتباط قطع شد. لطفا دوباره تلاش کنید.' }]);
        } finally { setLoading(false); }
    };

    useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

    return (
        <div className="flex flex-col h-full min-h-0 relative">
            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-24 scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${m.role === 'user' ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endRef}></div>
            </div>
            
            {/* Input Area - Positioned absolutely at bottom of container, above padding */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-20">
                <div className="flex gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1.5 rounded-2xl shadow-2xl">
                    <input 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && send()} 
                        placeholder={placeholder} 
                        className="flex-grow bg-transparent px-3 text-white outline-none text-sm placeholder-slate-500"
                    />
                    <button onClick={send} disabled={loading || !input.trim()} className="p-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white disabled:opacity-50 shadow-lg transition-colors">
                        <ArrowUpIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SECTIONS ---

const EnergySection: React.FC = () => {
    const [view, setView] = useState<'tools' | 'chat'>('tools');
    const [activeChakra, setActiveChakra] = useState<string | null>(null);

    if (view === 'chat') return <SectionChat systemPrompt={PERSONAS.energy} placeholder="درباره چاکراها یا انرژی بپرس..." />;

    return (
        <div className="h-full overflow-y-auto scrollbar-hide p-4 pb-24">
            <div className="flex items-center justify-between mb-4 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-violet-600 text-white shadow">اسکنر</button>
                <button onClick={() => setView('chat')} className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">چت با استاد</button>
            </div>

            <div className="relative h-[500px] w-full flex justify-center items-center mt-4">
                {/* Human Silhouette */}
                <div className="relative w-48 h-[450px] opacity-90">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-slate-800 rounded-[40%] border border-slate-700/50 shadow-inner"></div>
                    <div className="absolute top-[90px] left-1/2 -translate-x-1/2 w-8 h-10 bg-slate-800 border-x border-slate-700/50"></div>
                    <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-36 h-64 bg-slate-800 rounded-[3rem] border border-slate-700/50 shadow-inner"></div>
                    
                    {/* Chakras */}
                    {CHAKRAS.map((c) => (
                        <button 
                            key={c.id}
                            onClick={() => setActiveChakra(c.id)}
                            className={`absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full transition-all duration-500 z-20 flex items-center justify-center ${c.position} ${activeChakra === c.id ? `${c.color} ${c.glow} scale-125 ring-4 ring-black/50` : 'bg-slate-900/80 border border-slate-600 hover:bg-slate-800 hover:scale-110'}`}
                        >
                            <div className={`w-3 h-3 rounded-full bg-white/80 ${activeChakra === c.id ? 'animate-ping' : ''}`}></div>
                        </button>
                    ))}
                </div>

                {/* Info Card Overlay */}
                {activeChakra && (
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border border-slate-700 p-5 rounded-3xl backdrop-blur-xl animate-bounce-in shadow-2xl z-30 m-2">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-black text-white flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-yellow-400"/>
                                چاکرای {CHAKRAS.find(c => c.id === activeChakra)?.name}
                            </h4>
                            <button onClick={() => setActiveChakra(null)} className="text-slate-500 hover:text-white"><XMarkIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-black/40 px-3 py-1 rounded-lg text-xs font-mono text-slate-300 border border-white/5">
                                {CHAKRAS.find(c => c.id === activeChakra)?.freq} Hz
                            </div>
                            <span className="text-xs text-green-400 font-bold bg-green-900/20 px-2 py-1 rounded">متعادل‌سازی</span>
                        </div>
                        <button className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-lg">
                            <PlayIcon className="w-5 h-5"/> پخش فرکانس
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const BodySection: React.FC = () => {
    const [view, setView] = useState<'tools' | 'chat'>('tools');

    if (view === 'chat') return <SectionChat systemPrompt={PERSONAS.body} placeholder="سوال ورزشی یا تغذیه‌ای..." />;

    return (
        <div className="h-full overflow-y-auto scrollbar-hide p-4 pb-24 space-y-6">
            <div className="flex items-center justify-between mb-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white shadow">آمار</button>
                <button onClick={() => setView('chat')} className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">چت با مربی</button>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="text-2xl font-black text-white mb-4 relative z-10">وضعیت جسمانی</h3>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                        <WaterDropIcon className="w-6 h-6 text-cyan-400 mb-2"/>
                        <span className="text-2xl font-bold text-white">1.2</span>
                        <span className="text-xs text-slate-400 block">لیتر آب</span>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                        <WalkingIcon className="w-6 h-6 text-emerald-400 mb-2"/>
                        <span className="text-2xl font-bold text-white">4.5k</span>
                        <span className="text-xs text-slate-400 block">قدم</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-400 px-2">ابزارها</h4>
                <button className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                        <ScaleIcon className="w-5 h-5"/>
                    </div>
                    <div className="text-right flex-grow">
                        <h5 className="font-bold text-white">محاسبه BMI</h5>
                        <p className="text-xs text-slate-400">شاخص توده بدنی</p>
                    </div>
                </button>
                <button className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <MoonIcon className="w-5 h-5"/>
                    </div>
                    <div className="text-right flex-grow">
                        <h5 className="font-bold text-white">تحلیل خواب</h5>
                        <p className="text-xs text-slate-400">کیفیت استراحت</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const MindSection: React.FC = () => {
    const [view, setView] = useState<'tools' | 'chat'>('tools');
    const [breathing, setBreathing] = useState(false);
    const [label, setLabel] = useState('شروع');

    useEffect(() => {
        if(!breathing) { setLabel('شروع'); return; }
        let step = 0;
        const cycle = () => {
            if(step===0) { setLabel('دم (۴ ثانیه)'); setTimeout(()=>{ step=1; cycle(); }, 4000); }
            else if(step===1) { setLabel('حبس (۷ ثانیه)'); setTimeout(()=>{ step=2; cycle(); }, 7000); }
            else { setLabel('بازدم (۸ ثانیه)'); setTimeout(()=>{ step=0; cycle(); }, 8000); }
        }
        cycle();
    }, [breathing]);

    if (view === 'chat') return <SectionChat systemPrompt={PERSONAS.mind} placeholder="ذهنت مشغوله؟ با من حرف بزن..." />;

    return (
        <div className="h-full flex flex-col p-4 pb-24">
             <div className="flex items-center justify-between mb-6 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 flex-shrink-0">
                <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white shadow">تمرین تنفس</button>
                <button onClick={() => setView('chat')} className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">چت با استاد</button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="relative mb-12">
                    <div className={`w-64 h-64 rounded-full border border-teal-500/30 flex items-center justify-center transition-all duration-[4000ms] ${breathing ? 'scale-110' : 'scale-95'}`}>
                        <div className={`w-48 h-48 rounded-full bg-teal-500/10 blur-3xl absolute transition-all duration-[4000ms] ${breathing ? 'opacity-100 scale-125' : 'opacity-50 scale-75'}`}></div>
                        <div className={`w-56 h-56 rounded-full border border-teal-400/50 absolute transition-all duration-[4000ms] ${breathing ? 'scale-105 rotate-90' : 'scale-100 rotate-0'}`}></div>
                        <button 
                            onClick={() => setBreathing(!breathing)}
                            className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-b from-slate-800 to-black border border-slate-700 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                        >
                            <span className="text-lg font-black text-teal-100">{label}</span>
                        </button>
                    </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">تنفس ۴-۷-۸</h3>
                <p className="text-slate-400 text-sm text-center max-w-xs">
                    تکنیک باستانی برای کاهش فوری استرس و بازگرداندن آرامش به ذهن.
                </p>
            </div>
        </div>
    );
};

const TherapySection: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 pb-2 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
                        <HeartIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">تراپیست هوشمند</h3>
                        <p className="text-xs text-slate-400">همیشه آماده شنیدن...</p>
                    </div>
                </div>
            </div>
            <SectionChat systemPrompt={PERSONAS.therapy} placeholder="هرچه می‌خواهد دل تنگت بگو..." />
        </div>
    );
};

// --- MAIN PAGE LAYOUT ---

export default function HealthWellnessView({ userData, onUpdateUserData, onClose }: HealthWellnessViewProps) {
    const [activeTab, setActiveTab] = useState<'energy' | 'body' | 'mind' | 'therapy'>('energy');
    const [liveSession, setLiveSession] = useState<{ active: boolean; persona: string; title: string }>({ active: false, persona: '', title: '' });

    const handleStartLive = () => {
        const map = {
            therapy: { p: PERSONAS.therapy, t: 'تراپیست زنده' },
            mind: { p: PERSONAS.mind, t: 'استاد ذهن' },
            body: { p: PERSONAS.body, t: 'مربی سلامت' },
            energy: { p: PERSONAS.energy, t: 'استاد انرژی' }
        };
        const cfg = map[activeTab];
        setLiveSession({ active: true, persona: cfg.p, title: cfg.t });
    };

    return (
        <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col font-[Vazirmatn] animate-fadeIn overflow-hidden">
            {/* Live Overlay */}
            {liveSession.active && <LiveHealthSession persona={liveSession.persona} title={liveSession.title} onClose={() => setLiveSession({ ...liveSession, active: false })} />}

            {/* Top Header - Fixed */}
            <div className="flex-none flex justify-between items-center px-6 pt-6 pb-4 bg-[#020617]/95 backdrop-blur-md z-20 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-teal-500 tracking-tight">کلینیک جامع</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Holistic OS</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleStartLive} className="h-10 px-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse flex items-center justify-center gap-2 transition-all text-xs font-bold">
                        <MicrophoneIcon className="w-4 h-4"/>
                        تماس زنده
                    </button>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-all backdrop-blur-md border border-white/10">
                        <XMarkIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Main Content - Flexible & Scrollable */}
            <div className="flex-grow relative overflow-hidden w-full">
                {/* Background Effects */}
                <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-teal-900/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[250px] h-[250px] bg-indigo-900/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="absolute inset-0">
                    {activeTab === 'energy' && <EnergySection />}
                    {activeTab === 'body' && <BodySection />}
                    {activeTab === 'mind' && <MindSection />}
                    {activeTab === 'therapy' && <TherapySection />}
                </div>
            </div>

            {/* Bottom Dock - Fixed */}
            <div className="flex-none pb-8 pt-2 flex justify-center bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-30">
                <div className="bg-[#1a1a1d]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-2 shadow-2xl flex justify-between items-center px-6 gap-4 pointer-events-auto ring-1 ring-white/5">
                    {[
                        { id: 'energy', icon: EyeIcon, label: 'انرژی' },
                        { id: 'body', icon: BoltIcon, label: 'جسم' },
                        { id: 'mind', icon: BrainIcon, label: 'ذهن' },
                        { id: 'therapy', icon: ChatBubbleLeftRightIcon, label: 'تراپی' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 group ${activeTab === item.id ? '-translate-y-2' : 'hover:-translate-y-1'}`}
                        >
                            <div className={`p-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.5)] scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
                                <item.icon className="w-6 h-6"/>
                            </div>
                            <span className={`text-[10px] font-bold transition-opacity ${activeTab === item.id ? 'text-white opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

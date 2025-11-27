
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingData, WomenHealthData } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { 
    HealthIcon, BrainIcon, HeartIcon, 
    ChatBubbleLeftRightIcon, BoltIcon, XMarkIcon, EyeIcon, 
    PlayIcon, StopIcon, MicrophoneIcon, SpeakerWaveIcon,
    SparklesIcon, CalendarIcon, UserIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILS: Audio Processing ---
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

// --- TYPES ---
type SectionType = 'women' | 'soul' | 'mind' | 'body' | 'therapy';

interface HealthWellnessViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

// --- FREQUENCIES ---
const CHAKRAS = [
    { id: 'root', name: 'ریشه', freq: 396, color: 'bg-red-600', desc: 'امنیت' },
    { id: 'sacral', name: 'خاجی', freq: 417, color: 'bg-orange-500', desc: 'احساس' },
    { id: 'solar', name: 'خورشیدی', freq: 528, color: 'bg-yellow-400', desc: 'قدرت' },
    { id: 'heart', name: 'قلب', freq: 639, color: 'bg-emerald-500', desc: 'عشق' },
    { id: 'throat', name: 'گلو', freq: 741, color: 'bg-cyan-500', desc: 'بیان' },
    { id: 'third_eye', name: 'چشم سوم', freq: 852, color: 'bg-indigo-600', desc: 'شهود' },
    { id: 'crown', name: 'تاج', freq: 963, color: 'bg-violet-500', desc: 'آگاهی' },
];

// --- COMPONENT: Live Doctor Avatar ---
// This component handles the WebSockets, Audio I/O, and Visuals for ONE persona.
const LiveDoctorSession: React.FC<{
    persona: string;
    voiceName: string;
    systemPrompt: string;
    tools?: FunctionDeclaration[];
    onToolCall?: (name: string, args: any) => Promise<any>;
    isActive: boolean;
    themeColor: string;
}> = ({ persona, voiceName, systemPrompt, tools, onToolCall, isActive, themeColor }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error'>('idle');
    const [audioLevel, setAudioLevel] = useState(0);
    
    // Refs for Audio
    const audioCtxRef = useRef<AudioContext | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const activeSessionRef = useRef<Promise<any> | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Cleanup
    const cleanup = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current.onaudioprocess = null; }
        if (sourceRef.current) sourceRef.current.disconnect();
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (inputCtxRef.current && inputCtxRef.current.state !== 'closed') await inputCtxRef.current.close();
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') await audioCtxRef.current.close();
        activeSessionRef.current = null;
    };

    // Visualizer
    const animate = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const connect = async () => {
        await cleanup();
        setStatus('connecting');
        
        try {
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Audio Setup
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioCtxRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;
            analyserRef.current = analyser;
            analyser.connect(ctx.destination); // Output route

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputCtxRef.current = inputCtx;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true } });
            mediaStreamRef.current = stream;

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: systemPrompt,
                    tools: tools ? [{ functionDeclarations: tools }] : undefined,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
                },
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        activeSessionRef.current = sessionPromise;
                        animate(); // Start visualizer

                        // Input Pipeline
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        sourceRef.current = source;
                        processorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            if (!activeSessionRef.current || inputCtx.state === 'closed') return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const base64 = arrayBufferToBase64(floatTo16BitPCM(inputData).buffer);
                            sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64 } }));
                        };

                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Function Calling Logic
                        if (msg.toolCall && onToolCall) {
                            setStatus('processing');
                            for (const fc of msg.toolCall.functionCalls) {
                                const result = await onToolCall(fc.name, fc.args);
                                sessionPromise.then(s => s.sendToolResponse({
                                    functionResponses: [{ id: fc.id, name: fc.name, response: { result } }]
                                }));
                            }
                            setStatus('listening'); // Return to listening after tool exec
                        }

                        // Audio Output Logic
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioCtxRef.current) {
                            setStatus('speaking');
                            const float32 = new Float32Array(new Int16Array(base64ToUint8Array(audioData).buffer).length);
                            const int16 = new Int16Array(base64ToUint8Array(audioData).buffer);
                            for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

                            const buffer = audioCtxRef.current.createBuffer(1, float32.length, 24000);
                            buffer.copyToChannel(float32, 0);
                            const source = audioCtxRef.current.createBufferSource();
                            source.buffer = buffer;
                            if (analyserRef.current) source.connect(analyserRef.current);
                            
                            const now = audioCtxRef.current.currentTime;
                            const start = Math.max(now, nextStartTimeRef.current);
                            source.start(start);
                            nextStartTimeRef.current = start + buffer.duration;
                            
                            source.onended = () => {
                                if (audioCtxRef.current && audioCtxRef.current.currentTime >= nextStartTimeRef.current) {
                                    setStatus('listening');
                                }
                            };
                        }
                    },
                    onclose: () => setStatus('idle'),
                    onerror: (e) => { console.error(e); setStatus('error'); }
                }
            });
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    const disconnect = () => {
        cleanup();
        setStatus('idle');
    };

    // Auto-cleanup on unmount or tab switch
    useEffect(() => {
        return () => { cleanup(); };
    }, []);

    // --- VISUAL UI ---
    return (
        <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden rounded-3xl bg-black/20 backdrop-blur-sm border border-white/5">
            {/* Background Glow */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'speaking' ? 'opacity-30' : 'opacity-10'} bg-gradient-to-b ${themeColor} to-transparent blur-[80px]`}></div>

            {/* Main Orb Visualizer */}
            <div className="relative z-10 flex items-center justify-center mb-8">
                <div 
                    className={`rounded-full transition-all duration-100 border-4 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)]
                    ${status === 'idle' ? 'w-32 h-32 border-white/10 bg-white/5' : ''}
                    ${status === 'connecting' ? 'w-32 h-32 border-white/30 animate-pulse' : ''}
                    ${status === 'listening' ? 'w-36 h-36 border-emerald-400/50 bg-emerald-900/20 shadow-emerald-500/20' : ''}
                    ${status === 'speaking' ? 'border-white/80 bg-white/10 shadow-white/40' : ''}
                    ${status === 'error' ? 'w-32 h-32 border-red-500 bg-red-900/20' : ''}
                    ${status === 'processing' ? 'w-32 h-32 border-blue-400 animate-spin border-t-transparent' : ''}
                    `}
                    style={{
                        width: status === 'speaking' ? `${140 + audioLevel * 2}px` : undefined,
                        height: status === 'speaking' ? `${140 + audioLevel * 2}px` : undefined,
                    }}
                >
                    {status === 'idle' && <MicrophoneIcon className="w-10 h-10 text-white/30" />}
                    {status === 'connecting' && <SparklesIcon className="w-10 h-10 text-white/50 animate-spin" />}
                    {status === 'listening' && <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>}
                    {status === 'speaking' && <SpeakerWaveIcon className="w-12 h-12 text-white" />}
                    {status === 'error' && <XMarkIcon className="w-10 h-10 text-red-500" />}
                </div>
            </div>

            {/* Persona Info */}
            <div className="text-center z-10 mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{persona}</h3>
                <p className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mt-1">
                    {status === 'idle' ? 'آماده اتصال' : status === 'listening' ? 'گوش می‌کنم...' : status === 'speaking' ? 'در حال صحبت...' : 'در حال اتصال...'}
                </p>
            </div>

            {/* Controls */}
            <div className="z-20 flex gap-6">
                {status === 'idle' || status === 'error' ? (
                    <button 
                        onClick={connect}
                        className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
                    >
                        <MicrophoneIcon className="w-6 h-6"/>
                        شروع صحبت
                    </button>
                ) : (
                    <button 
                        onClick={disconnect}
                        className="w-16 h-16 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/50 rounded-full flex items-center justify-center transition-all shadow-lg"
                    >
                        <StopIcon className="w-8 h-8"/>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function HealthWellnessView({ userData, onUpdateUserData, onClose }: HealthWellnessViewProps) {
    const [activeTab, setActiveTab] = useState<SectionType>('women');
    const [isPlayingFreq, setIsPlayingFreq] = useState<{id: string, freq: number} | null>(null);
    
    // Audio Context for Frequencies
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Frequency Player Logic
    const playFrequency = (freq: number, id: string) => {
        if (oscRef.current) stopFrequency();
        
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        
        oscRef.current = osc;
        gainRef.current = gain;
        setIsPlayingFreq({ id, freq });
    };

    const stopFrequency = () => {
        if (oscRef.current) {
            try {
                // Fade out to avoid popping
                const ctx = audioCtxRef.current;
                if (ctx && gainRef.current) {
                    gainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
                }
                setTimeout(() => {
                    if (oscRef.current) {
                        oscRef.current.stop();
                        oscRef.current.disconnect();
                        oscRef.current = null;
                    }
                }, 50);
            } catch(e) {}
        }
        setIsPlayingFreq(null);
    };

    // --- LIVE HANDLERS ---

    const handleWomenTool = async (name: string, args: any) => {
        if (name === 'log_period_start') {
            const date = args.date || new Date().toISOString().split('T')[0];
            const current = userData.womenHealth || { cycleLogs: [], periodStarts: [], avgCycleLength: 28, partner: { enabled: false, name: '' } };
            if (!current.periodStarts.includes(date)) {
                const newStarts = [...current.periodStarts, date].sort().reverse();
                onUpdateUserData({ ...userData, womenHealth: { ...current, periodStarts: newStarts } });
                return `قاعدگی برای تاریخ ${date} ثبت شد.`;
            }
            return "این تاریخ قبلاً ثبت شده است.";
        }
        return "دستور نامشخص";
    };

    const handleSoulTool = async (name: string, args: any) => {
        if (name === 'play_frequency') {
            playFrequency(args.freq, 'ai-command');
            return `در حال پخش فرکانس ${args.freq} هرتز.`;
        }
        if (name === 'stop_frequency') {
            stopFrequency();
            return "پخش متوقف شد.";
        }
        return "دستور نامشخص";
    };

    // --- SUB VIEWS ---

    const renderWomen = () => {
        const healthData = userData.womenHealth || { periodStarts: [], avgCycleLength: 28 };
        const lastPeriod = healthData.periodStarts[0];
        const daysSince = lastPeriod ? Math.floor((new Date().getTime() - new Date(lastPeriod).getTime()) / (1000*3600*24)) : 0;
        const phase = daysSince <= 5 ? 'قاعدگی' : daysSince <= 14 ? 'فولیکولار' : daysSince <= 17 ? 'تخمک‌گذاری' : 'لوتئال';

        return (
            <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
                <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-pink-400 mb-4">
                            <HealthIcon className="w-6 h-6"/>
                            <span className="font-bold text-lg">وضعیت چرخه</span>
                        </div>
                        <div className="text-center mt-10">
                            <div className="inline-block p-1 rounded-full border-4 border-pink-500/30 mb-4">
                                <div className="w-32 h-32 rounded-full bg-pink-600 flex items-center justify-center text-4xl font-black text-white shadow-[0_0_40px_rgba(236,72,153,0.5)] animate-pulse">
                                    {daysSince > 0 ? `روز ${daysSince}` : '?'}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{phase}</h3>
                            <p className="text-slate-400 text-sm mt-2">پیش‌بینی: {phase === 'قاعدگی' ? 'استراحت کن' : phase === 'تخمک‌گذاری' ? 'انرژی بالاست' : 'مراقبت کن'}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/5">
                        <p className="text-xs text-slate-300 mb-2 font-bold">آخرین قاعدگی‌ها:</p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {healthData.periodStarts.slice(0,3).map(d => (
                                <span key={d} className="bg-black/30 px-3 py-1 rounded-lg text-xs font-mono text-pink-300">{d}</span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 h-[400px] lg:h-auto">
                    <LiveDoctorSession 
                        persona="دکتر ماما"
                        voiceName="Kore"
                        systemPrompt="You are Dr. Mama, an expert gynecologist. Speak Persian. Use tools to log periods. Be caring and scientific."
                        tools={[{
                            name: "log_period_start",
                            description: "Log start of period",
                            parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING } }, required: ["date"] }
                        }]}
                        onToolCall={handleWomenTool}
                        isActive={activeTab === 'women'}
                        themeColor="from-pink-600"
                    />
                </div>
            </div>
        );
    };

    const renderSoul = () => (
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-2 text-violet-400 mb-6">
                    <EyeIcon className="w-6 h-6"/>
                    <span className="font-bold text-lg">فرکانس‌های شفا</span>
                </div>
                <div className="space-y-3">
                    {CHAKRAS.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => isPlayingFreq?.id === c.id ? stopFrequency() : playFrequency(c.freq, c.id)}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${isPlayingFreq?.id === c.id ? `${c.color} shadow-lg scale-105` : 'bg-white/5 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${isPlayingFreq?.id === c.id ? 'bg-white text-black' : `${c.color} text-white`}`}>
                                    {c.freq}
                                </div>
                                <div className="text-right">
                                    <h4 className={`font-bold ${isPlayingFreq?.id === c.id ? 'text-white' : 'text-slate-200'}`}>{c.name}</h4>
                                    <p className={`text-xs ${isPlayingFreq?.id === c.id ? 'text-white/80' : 'text-slate-500'}`}>{c.desc}</p>
                                </div>
                            </div>
                            {isPlayingFreq?.id === c.id ? <StopIcon className="w-6 h-6 text-white"/> : <PlayIcon className="w-6 h-6 text-slate-500 group-hover:text-white"/>}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 h-[400px] lg:h-auto">
                <LiveDoctorSession 
                    persona="استاد راهنما"
                    voiceName="Charon"
                    systemPrompt="You are a Spiritual Grandmaster. Speak Persian. Use tools to play frequencies for chakras. Guide meditation."
                    tools={[
                        {
                            name: "play_frequency",
                            description: "Play a specific frequency",
                            parameters: { type: Type.OBJECT, properties: { freq: { type: Type.NUMBER } }, required: ["freq"] }
                        },
                        {
                            name: "stop_frequency",
                            description: "Stop playing sound",
                            parameters: { type: Type.OBJECT, properties: {}, required: [] }
                        }
                    ]}
                    onToolCall={handleSoulTool}
                    isActive={activeTab === 'soul'}
                    themeColor="from-violet-600"
                />
            </div>
        </div>
    );

    const renderMind = () => (
        <div className="h-full flex flex-col p-4">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl flex-grow flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <BrainIcon className="w-20 h-20 text-sky-400 mb-6 opacity-80"/>
                <h2 className="text-3xl font-black text-white mb-2">اتاق امن ذهن</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8">با کودک درون، منتقد درونی یا خودِ برترتان صحبت کنید. هوش مصنوعی نقش آن‌ها را بازی می‌کند.</p>
                
                <div className="w-full max-w-lg h-[400px]">
                    <LiveDoctorSession 
                        persona="روانکاو IFS"
                        voiceName="Fenrir"
                        systemPrompt="You are an IFS (Internal Family Systems) therapist. Help the user talk to their parts (Inner Child, Critic). Speak Persian. Be empathetic."
                        isActive={activeTab === 'mind'}
                        themeColor="from-sky-600"
                    />
                </div>
            </div>
        </div>
    );

    const renderBody = () => (
        <div className="h-full flex flex-col p-4">
             <div className="w-full h-full flex flex-col lg:flex-row gap-4">
                <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                    <BoltIcon className="w-16 h-16 text-orange-400 mb-4"/>
                    <h3 className="text-2xl font-bold text-white">پزشک عمومی هوشمند</h3>
                    <p className="text-slate-400 text-sm mt-2">علائم خود را بگویید تا راهنمایی اولیه دریافت کنید.</p>
                    <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-xs text-red-200">
                        ⚠️ هشدار: این یک ابزار هوش مصنوعی است و جایگزین پزشک واقعی نیست. در موارد اورژانسی با ۱۱۵ تماس بگیرید.
                    </div>
                </div>
                <div className="flex-1">
                    <LiveDoctorSession 
                        persona="پزشک عمومی"
                        voiceName="Fenrir"
                        systemPrompt="You are a General Practitioner (MD). Speak Persian. Triage symptoms. Always give a disclaimer. Suggest home remedies for minor issues."
                        isActive={activeTab === 'body'}
                        themeColor="from-orange-600"
                    />
                </div>
             </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#020617] z-50 font-[Vazirmatn] flex flex-col animate-fadeIn overflow-hidden">
            {/* Background Ambient Light */}
            <div className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${activeTab === 'women' ? 'bg-pink-900/20' : activeTab === 'soul' ? 'bg-violet-900/20' : activeTab === 'mind' ? 'bg-sky-900/20' : 'bg-orange-900/20'}`}></div>

            {/* Top Navigation Bar */}
            <div className="flex-none p-6 flex justify-between items-center z-20">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">کلینیک جامع</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Ultra Clinic OS</p>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-grow relative z-10 overflow-hidden">
                {activeTab === 'women' && renderWomen()}
                {activeTab === 'soul' && renderSoul()}
                {activeTab === 'mind' && renderMind()}
                {activeTab === 'body' && renderBody()}
                {activeTab === 'therapy' && (
                    <div className="h-full p-4">
                        <LiveDoctorSession 
                            persona="تراپیست همدل" 
                            voiceName="Kore" 
                            systemPrompt="You are a compassionate therapist. Speak Persian. Listen actively." 
                            isActive={activeTab === 'therapy'} 
                            themeColor="from-green-600"
                        />
                    </div>
                )}
            </div>

            {/* Bottom Dock Navigation */}
            <div className="flex-none p-6 flex justify-center z-30">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2 flex gap-2 shadow-2xl">
                    {[
                        { id: 'women', icon: HealthIcon, label: 'زنان', color: 'bg-pink-600' },
                        { id: 'soul', icon: EyeIcon, label: 'روح', color: 'bg-violet-600' },
                        { id: 'mind', icon: BrainIcon, label: 'ذهن', color: 'bg-sky-600' },
                        { id: 'body', icon: BoltIcon, label: 'جسم', color: 'bg-orange-600' },
                        { id: 'therapy', icon: ChatBubbleLeftRightIcon, label: 'روان', color: 'bg-green-600' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => { stopFrequency(); setActiveTab(item.id as any); }}
                            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${activeTab === item.id ? `${item.color} text-white scale-110 shadow-lg` : 'text-slate-400 hover:bg-white/10'}`}
                        >
                            <item.icon className="w-6 h-6"/>
                            <span className={`absolute -top-10 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 transition-opacity ${activeTab === item.id ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

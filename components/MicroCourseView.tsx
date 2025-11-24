
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingData, MicroCourse, MicroCourseDay, QuizResult, ChatMessage } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { 
    AcademicCapIcon, PlusIcon, SparklesIcon, TrashIcon, 
    CheckCircleIcon, ArrowLeftIcon, LockClosedIcon, DocumentTextIcon,
    MicrophoneIcon, ArrowUpIcon, StarIcon, XMarkIcon, UserIcon,
    ChartBarIcon, BookOpenIcon, BoltIcon, SpeakerWaveIcon, ChatBubbleOvalLeftEllipsisIcon,
    CogIcon, ArrowPathIcon, BeakerIcon, CloudIcon, FlagIcon, Squares2X2Icon, ArrowRightIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MicroCourseViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

// --- Audio Utilities ---
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

// --- Helper Functions ---
function calculateAverageGrade(quizzes: QuizResult[]): number {
    if (quizzes.length === 0) return 0;
    const total = quizzes.reduce((sum, q) => sum + q.score, 0);
    return Math.round((total / quizzes.length) * 10) / 10; // Round to 1 decimal
}

// --- Settings Types ---
type TeachingMode = 'bilingual' | 'english_only' | 'persian_explain';
type VoiceOption = 'Fenrir' | 'Kore' | 'Puck' | 'Charon';

const VOICE_OPTIONS: {id: VoiceOption, label: string, desc: string}[] = [
    { id: 'Fenrir', label: 'استاد (مرد)', desc: 'صدای بم و جدی' },
    { id: 'Kore', label: 'استاد (زن)', desc: 'صدای آرام و شفاف' },
    { id: 'Puck', label: 'پرانرژی', desc: 'لحن بازیگوش و سریع' },
    { id: 'Charon', label: 'عمیق', desc: 'صدای بسیار بم و آرام' },
];

const SCHOOL_CATEGORIES = [
    { id: 'sciences', label: 'علوم تجربی', icon: BeakerIcon, color: 'from-emerald-600 to-teal-800', text: 'text-emerald-100' },
    { id: 'languages', label: 'زبان‌های خارجی', icon: FlagIcon, color: 'from-blue-600 to-indigo-800', text: 'text-blue-100' },
    { id: 'humanities', label: 'ادبیات و هنر', icon: BookOpenIcon, color: 'from-rose-600 to-pink-800', text: 'text-rose-100' },
    { id: 'physics', label: 'فیزیک و ریاضی', icon: BoltIcon, color: 'from-violet-600 to-fuchsia-800', text: 'text-violet-100' },
];

// --- SUB-COMPONENTS ---

// 0. Live Professor Session
const LiveProfessorSession: React.FC<{ course: MicroCourse; onClose: () => void }> = ({ course, onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'>('connecting');
    
    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [teachingMode, setTeachingMode] = useState<TeachingMode>('bilingual');
    const [voice, setVoice] = useState<VoiceOption>('Fenrir');

    // Transcript State
    const [transcript, setTranscript] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const transcriptContainerRef = useRef<HTMLDivElement>(null);

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSessionRef = useRef<any>(null);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcript, currentTranscript]);

    const cleanupAudio = () => {
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current.onaudioprocess = null; }
        if (sourceRef.current) sourceRef.current.disconnect();
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (inputContextRef.current) inputContextRef.current.close();
        if (audioContextRef.current) audioContextRef.current.close();
        activeSessionRef.current = null;
    };

    const connect = useCallback(async () => {
        cleanupAudio(); // Ensure clean state before connecting
        setStatus('connecting');
        setTranscript([]); // Clear transcript on new connection

        try {
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true } });
            mediaStreamRef.current = stream;

            // Dynamic System Instruction based on Course Type and Settings
            const titleLower = course.title.toLowerCase();
            const isLanguageCourse = titleLower.includes('language') || titleLower.includes('زبان') || titleLower.includes('english') || titleLower.includes('french') || titleLower.includes('فرانسه');
            
            let instruction = `
                You are an expert professor teaching the course "${course.title}".
                Goal of course: "${course.goal}".
                Tone: Professional, encouraging, patient.
                You are conducting a live 1-on-1 tutoring session.
            `;

            if (isLanguageCourse) {
                if (teachingMode === 'english_only') {
                    instruction += `
                    IMPORTANT: IMMERSION MODE.
                    Speak ONLY in the target language (English/French). Do NOT use Persian/Farsi at all.
                    If the student struggles, simplify your language, but do not translate.
                    `;
                } else if (teachingMode === 'persian_explain') {
                    instruction += `
                    IMPORTANT: EXPLANATION MODE.
                    Explain concepts primarily in Persian (Farsi).
                    Use the target language only for examples or keywords, then explain them in Persian.
                    `;
                } else {
                    // Bilingual Mode
                    instruction += `
                    IMPORTANT: BILINGUAL MODE.
                    You are a bilingual tutor.
                    For every concept or sentence you speak in the Target Language, you MUST immediately follow it with the Persian translation.
                    Format: [Target Language Sentence] -> [Persian Translation].
                    Example: "Hello, how are you? سلام، حال شما چطور است؟"
                    Ensure the student sees/hears both.
                    `;
                }
            } else {
                instruction += `Speak in fluent Persian (Farsi). Keep answers concise for audio conversation.`;
            }

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: instruction,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                    outputAudioTranscription: {} 
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
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        
                        // Handle Transcription (Subtitles)
                        if (msg.serverContent?.outputTranscription?.text) {
                            const textChunk = msg.serverContent.outputTranscription.text;
                            setCurrentTranscript(prev => prev + textChunk);
                        }
                        
                        if (msg.serverContent?.turnComplete) {
                            if (currentTranscript) {
                                setTranscript(prev => [...prev, { role: 'ai', text: currentTranscript }]);
                                setCurrentTranscript('');
                            }
                        }

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
                    onclose: () => console.log("Session closed"),
                    onerror: (e) => {
                        console.error(e);
                        setStatus('error');
                    }
                }
            });
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    }, [course, teachingMode, voice, currentTranscript]);

    const handleApplySettings = () => {
        setShowSettings(false);
        connect(); 
    };

    useEffect(() => {
        connect();
        return () => cleanupAudio();
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col animate-fadeIn font-[Vazirmatn] h-[100dvh] w-full overscroll-none touch-none">
            
            {/* TOP BAR CONTROLS - FIXED & VISIBLE */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 pt-safe-area bg-gradient-to-b from-black/90 via-black/60 to-transparent pb-10 pointer-events-auto">
                {/* Exit Button - Right Side (RTL) */}
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg active:scale-95"
                >
                    <ArrowRightIcon className="w-5 h-5"/>
                    <span className="text-sm font-bold">خروج</span>
                </button>

                {/* Title Status */}
                <div className="text-center">
                    <h3 className="text-white font-bold text-sm shadow-black drop-shadow-md">{course.title}</h3>
                    <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full border border-green-500/30 mt-1 inline-block">زنده</span>
                </div>

                {/* Settings Button - Left Side */}
                <button 
                    onClick={() => setShowSettings(true)} 
                    className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg active:scale-95"
                >
                    <span className="text-sm font-bold">تنظیمات</span>
                    <CogIcon className="w-5 h-5"/>
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setShowSettings(false)} className="absolute top-4 left-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><XMarkIcon className="w-5 h-5"/></button>
                        
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <CogIcon className="w-6 h-6 text-indigo-400"/>
                            تنظیمات کلاس
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm text-slate-400 mb-3 block font-bold">شیوه آموزش زبان</label>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setTeachingMode('bilingual')}
                                        className={`w-full p-3 rounded-xl text-right border transition-all ${teachingMode === 'bilingual' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        <div className="font-bold text-sm">دوزبانه (Bilingual)</div>
                                        <div className="text-xs opacity-70">متن و صدا همزمان فارسی و انگلیسی</div>
                                    </button>
                                    <button 
                                        onClick={() => setTeachingMode('english_only')}
                                        className={`w-full p-3 rounded-xl text-right border transition-all ${teachingMode === 'english_only' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        <div className="font-bold text-sm">فقط انگلیسی (Immersion)</div>
                                        <div className="text-xs opacity-70">غوطه‌وری کامل، بدون فارسی</div>
                                    </button>
                                    <button 
                                        onClick={() => setTeachingMode('persian_explain')}
                                        className={`w-full p-3 rounded-xl text-right border transition-all ${teachingMode === 'persian_explain' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        <div className="font-bold text-sm">توضیحی (فارسی)</div>
                                        <div className="text-xs opacity-70">رفع اشکال و توضیح به زبان فارسی</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-400 mb-3 block font-bold">انتخاب صدای استاد</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {VOICE_OPTIONS.map(v => (
                                        <button 
                                            key={v.id}
                                            onClick={() => setVoice(v.id)}
                                            className={`p-3 rounded-xl border text-center transition-all ${voice === v.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                        >
                                            <div className="font-bold text-sm">{v.label}</div>
                                            <div className="text-[10px] opacity-70">{v.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-slate-800 rounded-xl text-slate-400 font-bold hover:bg-slate-700">انصراف</button>
                            <button onClick={handleApplySettings} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/20">
                                اعمال و اتصال مجدد
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Visualizer Area */}
            <div className="flex-grow flex flex-col items-center justify-center relative w-full overflow-hidden">
                {/* Background Ambience */}
                <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'speaking' ? 'bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2),transparent_70%)]' : 'bg-black'}`}></div>
                
                <div className="relative w-64 h-64 flex items-center justify-center mb-12 z-10 mt-10">
                    {/* Ripple Effects */}
                    {status === 'speaking' && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[ping_2s_linear_infinite]"></div>
                            <div className="absolute inset-0 rounded-full border border-indigo-400/20 animate-[ping_2s_linear_infinite_0.5s]"></div>
                            <div className="absolute inset-0 rounded-full border border-fuchsia-500/20 animate-[ping_2s_linear_infinite_1s]"></div>
                        </>
                    )}
                    
                    {/* Main Circle */}
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-black shadow-[0_0_60px_rgba(79,70,229,0.3)] relative z-10 transition-all duration-500 border-4 ${status === 'speaking' ? 'border-indigo-500 scale-110' : (status === 'listening' ? 'border-emerald-500' : 'border-slate-700')}`}>
                        {status === 'speaking' ? (
                            <SpeakerWaveIcon className="w-16 h-16 text-indigo-400 animate-pulse"/>
                        ) : status === 'listening' ? (
                            <MicrophoneIcon className="w-16 h-16 text-emerald-400 animate-bounce"/>
                        ) : status === 'connecting' ? (
                            <ArrowPathIcon className="w-16 h-16 text-yellow-400 animate-spin"/>
                        ) : (
                            <BoltIcon className="w-16 h-16 text-slate-500"/>
                        )}
                    </div>
                    
                    {/* Status Label */}
                    <div className="absolute -bottom-16 w-full flex justify-center">
                        {status === 'listening' && <div className="text-emerald-400 font-bold text-sm animate-pulse bg-emerald-900/30 px-4 py-1.5 rounded-full border border-emerald-500/30">گوش می‌دهم...</div>}
                        {status === 'speaking' && <div className="text-indigo-300 font-bold text-sm bg-indigo-900/30 px-4 py-1.5 rounded-full border border-indigo-500/30">استاد صحبت می‌کند...</div>}
                        {status === 'connecting' && <div className="text-yellow-400 font-bold text-sm animate-pulse">در حال اتصال...</div>}
                        {status === 'error' && <button onClick={handleApplySettings} className="text-white bg-red-600 px-4 py-2 rounded-full text-sm font-bold shadow-lg">تلاش مجدد</button>}
                    </div>
                </div>

                {/* Subtitles / Transcript Area */}
                <div className="absolute bottom-8 w-full px-4 flex flex-col items-center z-40 pointer-events-none">
                    <div 
                        ref={transcriptContainerRef}
                        className="w-full max-w-lg space-y-2 max-h-[30vh] overflow-y-auto scrollbar-hide mask-image-gradient-b pointer-events-auto p-2 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5"
                    >
                        {transcript.map((t, i) => (
                            <div key={i} className={`text-sm p-3 rounded-2xl shadow-sm backdrop-blur-md border mb-2 transition-all animate-fadeIn ${t.role === 'ai' ? 'bg-indigo-950/80 text-indigo-100 border-indigo-500/30 self-start mr-auto text-left' : 'bg-slate-800/80 text-slate-200 border-white/10 text-right self-end ml-auto'}`}>
                                <span className="text-[10px] font-bold opacity-60 block mb-1">{t.role === 'ai' ? 'استاد' : 'شما'}</span>
                                <p className="leading-relaxed whitespace-pre-wrap" dir={t.role === 'ai' ? 'ltr' : 'rtl'}>{t.text}</p>
                            </div>
                        ))}
                        {currentTranscript && (
                            <div className="text-sm p-3 rounded-2xl shadow-sm backdrop-blur-md bg-indigo-900/70 text-indigo-100 border border-indigo-400/50 animate-pulse self-start mr-auto mb-2 text-left">
                                <span className="text-[10px] font-bold opacity-60 block mb-1">استاد (در حال صحبت...)</span>
                                <p className="leading-relaxed whitespace-pre-wrap" dir="ltr">{currentTranscript}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 1. Course Tutor (Live Chat)
const CourseTutor: React.FC<{ course: MicroCourse; onUpdateHistory: (history: ChatMessage[]) => void }> = ({ course, onUpdateHistory }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(course.chatHistory || [{ role: 'model', text: `سلام! من استاد راهنمای دوره «${course.title}» هستم. هر سوالی داری بپرس.` }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg: ChatMessage = { role: 'user', text: input };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            let context = `Course Title: ${course.title}\nGoal: ${course.goal}`;
            if (course.days) {
                context += `\nSyllabus: ${course.days.map(d => d.lesson).join(', ')}`;
            }

            const systemPrompt = `
                You are an expert professor teaching the course "${course.title}".
                Goal: "${course.goal}".
                Tone: Academic yet encouraging, fluent Persian.
                Context: ${context}
                Answer the student's questions based on the course material.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    ...newHistory.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] }))
                ]
            });

            const reply = response.text.trim();
            const updatedHistory = [...newHistory, { role: 'model' as const, text: reply }];
            setMessages(updatedHistory);
            onUpdateHistory(updatedHistory);
        } catch (e) {
            setMessages([...newHistory, { role: 'model', text: "متاسفانه مشکلی پیش آمد." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            {isLiveMode && <LiveProfessorSession course={course} onClose={() => setIsLiveMode(false)} />}
            
            {/* Chat Header */}
            <div className="p-3 border-b border-white/5 bg-slate-900/80 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-400 font-bold">استاد آنلاین است</span>
                </div>
                <button 
                    onClick={() => setIsLiveMode(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                    <MicrophoneIcon className="w-3.5 h-3.5"/>
                    تماس صوتی
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-20 scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-slate-500 text-xs animate-pulse p-2">استاد در حال تایپ...</div>}
                <div ref={scrollRef}></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-slate-900/90 backdrop-blur border-t border-white/10 flex gap-2">
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="سوال خود را بپرسید..."
                    className="flex-grow bg-slate-800 text-white px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white disabled:opacity-50 transition-colors"><ArrowUpIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

// 2. Exam Hall (Quiz)
const ExamHall: React.FC<{ course: MicroCourse; onCompleteQuiz: (score: number) => void }> = ({ course, onCompleteQuiz }) => {
    const [status, setStatus] = useState<'start' | 'generating' | 'taking' | 'result'>('start');
    const [questions, setQuestions] = useState<{q: string, options: string[], answer: number}[]>([]);
    const [answers, setAnswers] = useState<number[]>([]);
    const [score, setScore] = useState(0);

    const startExam = async () => {
        setStatus('generating');
        const prompt = `
            Generate a quiz for the course "${course.title}".
            Goal: ${course.goal}.
            Create 5 multiple-choice questions in Persian.
            Format: JSON array of objects: { "q": "Question text", "options": ["A", "B", "C", "D"], "answer": 0-3 (index) }.
        `;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const data = JSON.parse(response.text.trim());
            if (Array.isArray(data) && data.length > 0) {
                setQuestions(data);
                setAnswers(new Array(data.length).fill(-1));
                setStatus('taking');
            } else {
                alert("خطا در تولید آزمون.");
                setStatus('start');
            }
        } catch (e) {
            console.error(e);
            setStatus('start');
            alert("خطا در ارتباط.");
        }
    };

    const submitExam = () => {
        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.answer) correct++;
        });
        // Score out of 20
        const finalScore = Math.round((correct / questions.length) * 20);
        setScore(finalScore);
        setStatus('result');
        onCompleteQuiz(finalScore);
    };

    if (status === 'start') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                    <DocumentTextIcon className="w-10 h-10 text-slate-400"/>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">سالن امتحانات</h3>
                <p className="text-slate-400 mb-8 text-sm max-w-xs">آیا آماده‌اید دانش خود را در این درس محک بزنید؟ نمره قبولی ۱۰ است.</p>
                <button onClick={startExam} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105">
                    شروع آزمون
                </button>
            </div>
        );
    }

    if (status === 'generating') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center">
                <SparklesIcon className="w-12 h-12 text-indigo-400 animate-spin mb-4"/>
                <p className="text-slate-300 animate-pulse">در حال طراحی سوالات...</p>
            </div>
        );
    }

    if (status === 'result') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 mb-6 ${score >= 10 ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-red-500 text-red-400 bg-red-900/20'}`}>
                    <span className="text-5xl font-black">{score}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">نتیجه آزمون</h3>
                <p className={`text-lg font-bold mb-8 ${score >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                    {score >= 10 ? 'تبریک! قبول شدید' : 'نیاز به تلاش بیشتر'}
                </p>
                <button onClick={() => setStatus('start')} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors">بازگشت</button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 pb-20 scrollbar-hide">
            <div className="space-y-6">
                {questions.map((q, i) => (
                    <div key={i} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
                        <div className="flex gap-3 mb-4">
                            <span className="bg-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                            <p className="font-bold text-white text-sm leading-relaxed">{q.q}</p>
                        </div>
                        <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                                <button 
                                    key={optIdx}
                                    onClick={() => {
                                        const newAnswers = [...answers];
                                        newAnswers[i] = optIdx;
                                        setAnswers(newAnswers);
                                    }}
                                    className={`w-full text-right p-3 rounded-xl text-sm border transition-all ${answers[i] === optIdx ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                <button 
                    onClick={submitExam} 
                    disabled={answers.includes(-1)}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                >
                    ثبت نهایی پاسخ‌نامه
                </button>
            </div>
        </div>
    );
};

// 3. Report Card
const ReportCard: React.FC<{ quizzes: QuizResult[] }> = ({ quizzes }) => {
    const average = calculateAverageGrade(quizzes);
    
    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 text-center mb-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <p className="text-slate-400 text-sm mb-2 font-bold uppercase tracking-widest">معدل کل</p>
                <div className="text-6xl font-black text-white mb-4 tracking-tighter">{average}</div>
                <div className="flex justify-center gap-1">
                    {[1,2,3,4,5].map(star => (
                        <StarIcon key={star} className={`w-6 h-6 ${star <= Math.round(average/4) ? 'text-yellow-400 fill-current drop-shadow-lg' : 'text-slate-700'}`}/>
                    ))}
                </div>
            </div>
            
            <h4 className="font-bold text-slate-300 mb-4 px-2 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5"/>
                کارنامه عملکرد
            </h4>
            
            {quizzes.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-10 border-2 border-dashed border-slate-800 rounded-2xl">
                    هنوز در هیچ آزمونی شرکت نکرده‌اید.
                </div>
            ) : (
                <div className="space-y-3">
                    {quizzes.map((q, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                            <span className="text-slate-400 text-xs font-mono">{new Date(q.date).toLocaleDateString('fa-IR')}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 text-xs font-bold">نمره:</span>
                                <span className={`font-black text-lg ${q.score >= 10 ? 'text-green-400' : 'text-red-400'}`}>{q.score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN VIEW ---

const MicroCourseView: React.FC<MicroCourseViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [courses, setCourses] = useState<MicroCourse[]>(userData.microCourses || []);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null); // New: For School OS Navigation
    const [isCreating, setIsCreating] = useState(false);
    const [newCourseGoal, setNewCourseGoal] = useState('');
    const [activeTab, setActiveTab] = useState<'syllabus' | 'class' | 'exam' | 'report'>('syllabus');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const activeCourse = courses.find(c => c.id === activeCourseId);

    const handleCreateCourse = async () => {
        if (!newCourseGoal.trim()) return;
        setIsGenerating(true);

        let pdfBase64 = undefined;
        if (pdfFile) {
            const reader = new FileReader();
            pdfBase64 = await new Promise<string>((resolve) => {
                reader.onload = (e) => {
                    const res = e.target?.result as string;
                    resolve(res.split(',')[1]); // remove prefix
                };
                reader.readAsDataURL(pdfFile);
            });
        }

        const prompt = `
            Generate a 7-day syllabus for a course on: "${newCourseGoal}".
            If PDF is provided, use it as context.
            Output JSON: { "courseTitle": string, "days": [{ "day": 1, "focus": string, "lesson": string (short), "challenge": string, "reflection": string }] }
            Language: Persian.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            
            const result = JSON.parse(response.text.trim());
            const newCourse: MicroCourse = {
                id: `course-${Date.now()}`,
                title: result.courseTitle,
                goal: newCourseGoal,
                days: result.days.map((d: any) => ({ ...d, completed: false })),
                progress: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                pdfSource: pdfBase64,
                chatHistory: [],
                quizzes: []
            };

            const updated = [...courses, newCourse];
            setCourses(updated);
            onUpdateUserData({ ...userData, microCourses: updated });
            setIsCreating(false);
            setNewCourseGoal('');
            setPdfFile(null);
            setActiveCourseId(newCourse.id);
        } catch (e) {
            alert("خطا در ساخت دوره.");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateCourse = (updated: MicroCourse) => {
        const newCourses = courses.map(c => c.id === updated.id ? updated : c);
        setCourses(newCourses);
        onUpdateUserData({ ...userData, microCourses: newCourses });
    };

    const handleDayToggle = (dayNum: number) => {
        if (!activeCourse) return;
        const newDays = activeCourse.days.map(d => d.day === dayNum ? { ...d, completed: !d.completed } : d);
        const progress = Math.round((newDays.filter(d => d.completed).length / newDays.length) * 100);
        updateCourse({ ...activeCourse, days: newDays, progress });
    };

    const handleQuizComplete = (score: number) => {
        if (!activeCourse) return;
        const newQuiz: QuizResult = { date: new Date().toISOString(), score, totalQuestions: 5 };
        const newQuizzes = [newQuiz, ...(activeCourse.quizzes || [])];
        updateCourse({ ...activeCourse, quizzes: newQuizzes });
    };

    const handleDeleteCourse = (id: string) => {
        if(confirm("حذف دوره؟")) {
            const filtered = courses.filter(c => c.id !== id);
            setCourses(filtered);
            onUpdateUserData({ ...userData, microCourses: filtered });
            if (activeCourseId === id) setActiveCourseId(null);
        }
    };

    // --- Navigation Helpers ---
    const getCoursesByCategory = (catId: string) => {
        if (catId === 'sciences') return courses.filter(c => c.title.includes('فیزیک') || c.title.includes('شیمی') || c.title.includes('زیست'));
        if (catId === 'languages') return courses.filter(c => c.title.includes('زبان') || c.title.includes('انگلیسی') || c.title.includes('فرانسه'));
        if (catId === 'humanities') return courses.filter(c => c.title.includes('ادبیات') || c.title.includes('هنر') || c.title.includes('تاریخ'));
        if (catId === 'physics') return courses.filter(c => c.title.includes('فیزیک') || c.title.includes('ریاضی'));
        return courses; // Fallback
    };

    // --- Render ---

    const renderSchoolHome = () => (
        <div className="space-y-6 p-4 animate-fadeIn pb-20">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">مکتب‌خونه هوشمند</h2>
                    <p className="text-xs text-indigo-400 font-bold mt-1 tracking-widest uppercase">SCHOOL OS v2.0</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white transition-colors border border-slate-700"><XMarkIcon className="w-6 h-6"/></button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 gap-4">
                {SCHOOL_CATEGORIES.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)}
                        className="group relative h-32 rounded-3xl overflow-hidden text-right p-6 transition-transform hover:scale-[1.02] shadow-lg"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${cat.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                        <div className="absolute inset-0 border border-white/10 rounded-3xl"></div>
                        
                        <div className="relative z-10 flex justify-between items-center h-full">
                            <div>
                                <h3 className={`text-2xl font-bold text-white mb-1`}>{cat.label}</h3>
                                <p className={`text-xs ${cat.text} font-bold opacity-80`}>{getCoursesByCategory(cat.id).length} کلاس فعال</p>
                            </div>
                            <cat.icon className={`w-16 h-16 ${cat.text} opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                        </div>
                    </button>
                ))}
                
                <button onClick={() => setIsCreating(true)} className="w-full py-6 border-2 border-dashed border-slate-700 rounded-3xl text-slate-400 font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-800/50 hover:text-white transition-colors">
                    <PlusIcon className="w-8 h-8"/>
                    تاسیس دوره جدید
                </button>
            </div>
        </div>
    );

    const renderCategoryView = () => {
        const category = SCHOOL_CATEGORIES.find(c => c.id === activeCategory);
        const categoryCourses = getCoursesByCategory(activeCategory || '');

        return (
            <div className="h-full flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                    <button onClick={() => setActiveCategory(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <div>
                        <h2 className="text-xl font-bold text-white">{category?.label}</h2>
                        <p className="text-xs text-slate-400 font-medium">{categoryCourses.length} درس</p>
                    </div>
                </div>

                {/* Course List */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-20 scrollbar-hide">
                    {categoryCourses.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <p>هنوز کلاسی در این دانشکده وجود ندارد.</p>
                        </div>
                    ) : (
                        categoryCourses.map(c => (
                            <div key={c.id} onClick={() => setActiveCourseId(c.id)} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl cursor-pointer hover:bg-slate-800 hover:border-indigo-500/50 transition-all relative group shadow-lg flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${category?.color} shadow-inner`}>
                                    {c.title.includes('فیزیک') ? '⚛️' : c.title.includes('شیمی') ? '🧪' : c.title.includes('زیست') ? '🧬' : c.title.includes('فرانسه') ? '🇫🇷' : c.title.includes('انگلیسی') ? '🇬🇧' : '📚'}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-bold text-white text-lg">{c.title}</h3>
                                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${c.progress}%` }}></div>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-slate-400">{c.progress}%</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderActiveCourse = () => {
        if (!activeCourse) return null;
        return (
            <div className="absolute inset-0 flex flex-col animate-fadeIn bg-[#0b0c15] overflow-hidden">
                {/* Header */}
                <div className="flex-none flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveCourseId(null)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeftIcon className="w-5 h-5"/></button>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">{activeCourse.title}</h2>
                            <span className="text-[10px] bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">در حال برگزاری</span>
                        </div>
                    </div>
                    <button onClick={() => handleDeleteCourse(activeCourse.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><TrashIcon className="w-5 h-5"/></button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-hidden relative">
                    {activeTab === 'syllabus' && (
                        <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24">
                            <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 mb-6 text-center">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30 rotate-3">
                                    <AcademicCapIcon className="w-8 h-8 text-white"/>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">هدف دوره</h3>
                                <p className="text-sm text-indigo-200">{activeCourse.goal}</p>
                            </div>

                            {activeCourse.days.map(day => (
                                <div key={day.day} className={`p-5 rounded-2xl border transition-all duration-300 ${day.completed ? 'bg-green-900/10 border-green-500/30' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-bold text-indigo-400 bg-indigo-900/20 px-2.5 py-1 rounded-lg border border-indigo-500/20">جلسه {day.day}</span>
                                        <button onClick={() => handleDayToggle(day.day)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${day.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 hover:border-green-500'}`}>
                                            {day.completed && <CheckCircleIcon className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-white mb-2 text-base">{day.lesson}</h4>
                                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">{day.focus}</p>
                                    
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="bg-black/30 p-3 rounded-xl text-xs text-slate-300 border border-white/5">
                                            <strong className="text-orange-400 block mb-1">🔥 چالش:</strong>
                                            {day.challenge}
                                        </div>
                                        <div className="bg-black/30 p-3 rounded-xl text-xs text-slate-300 border border-white/5">
                                            <strong className="text-blue-400 block mb-1">🤔 تأمل:</strong>
                                            {day.reflection}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'class' && <CourseTutor course={activeCourse} onUpdateHistory={(h) => updateCourse({...activeCourse, chatHistory: h})} />}
                    {activeTab === 'exam' && <ExamHall course={activeCourse} onCompleteQuiz={handleQuizComplete} />}
                    {activeTab === 'report' && <ReportCard quizzes={activeCourse.quizzes || []} />}
                </div>

                {/* Bottom Dock Navigation */}
                <div className="flex-none p-4 bg-[#0b0c15]/90 backdrop-blur-xl border-t border-white/10 z-20 absolute bottom-0 left-0 right-0">
                    <div className="flex justify-around items-center bg-slate-800/80 p-1.5 rounded-2xl shadow-2xl border border-white/5">
                        <button onClick={() => setActiveTab('syllabus')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'syllabus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Squares2X2Icon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">برنامه</span>
                        </button>
                        <button onClick={() => setActiveTab('class')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'class' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                            <UserIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">استاد</span>
                        </button>
                        <button onClick={() => setActiveTab('exam')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'exam' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                            <DocumentTextIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">آزمون</span>
                        </button>
                        <button onClick={() => setActiveTab('report')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                            <ChartBarIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">کارنامه</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col font-[Vazirmatn] animate-fadeIn overflow-hidden h-[100dvh] overscroll-none">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full h-full flex flex-col shadow-2xl relative overflow-hidden z-10">
                {activeCourseId ? renderActiveCourse() : (
                    isCreating ? (
                        <div className="p-6 h-full flex flex-col">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white">تاسیس دوره جدید</h2>
                                <p className="text-slate-400 text-sm mt-2">موضوع دوره را مشخص کنید یا یک فایل PDF (کتاب درسی) آپلود کنید تا برنامه آموزشی برای شما ساخته شود.</p>
                            </div>
                            
                            <div className="space-y-4 flex-grow">
                                <input 
                                    type="text" 
                                    value={newCourseGoal}
                                    onChange={e => setNewCourseGoal(e.target.value)}
                                    placeholder="عنوان یا هدف دوره (مثلا: یادگیری پایتون مقدماتی)"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                
                                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                                    <DocumentTextIcon className="w-10 h-10 text-slate-500 mx-auto mb-2"/>
                                    <p className="text-slate-300 font-bold">{pdfFile ? pdfFile.name : 'آپلود PDF (اختیاری)'}</p>
                                    <p className="text-xs text-slate-500 mt-1">برای ساخت دقیق‌تر سرفصل‌ها</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:text-white">لغو</button>
                                <button onClick={handleCreateCourse} disabled={!newCourseGoal.trim() || isGenerating} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isGenerating ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <AcademicCapIcon className="w-5 h-5"/>}
                                    {isGenerating ? 'در حال ساخت دانشکده...' : 'ساخت دوره'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        activeCategory ? renderCategoryView() : renderSchoolHome()
                    )
                )}
            </div>
        </div>
    );
};

export default MicroCourseView;

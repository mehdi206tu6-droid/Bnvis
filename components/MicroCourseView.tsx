
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingData, MicroCourse, QuizResult } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { 
    AcademicCapIcon, PlusIcon, SparklesIcon, 
    CheckCircleIcon, ArrowLeftIcon, XMarkIcon,
    BoltIcon, SpeakerWaveIcon,
    ArrowPathIcon, BeakerIcon, FlagIcon, ArrowRightIcon,
    CommandCommandLineIcon, MoonIcon, DocumentTextIcon, MicrophoneIcon,
    BookOpenIcon, StopIcon, CloudIcon, DocumentScannerIcon,
    PencilIcon, TrophyIcon
} from './icons';

// Initialize PDF Worker Safely
try {
    // @ts-ignore
    const pdfjs = pdfjsLib.default || pdfjsLib;
    if (pdfjs && pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;
    }
} catch (e) {
    console.warn("PDF Worker init failed", e);
}

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

// --- Constants ---
const SCHOOL_CATEGORIES = [
    { id: 'konkur', label: 'کنکور و آزمون', icon: TrophyIcon, color: 'from-red-600 to-rose-900', text: 'text-rose-100', border: 'border-rose-500/30' },
    { id: 'computer', label: 'کامپیوتر و فناوری', icon: CommandCommandLineIcon, color: 'from-cyan-600 to-sky-900', text: 'text-cyan-100', border: 'border-cyan-500/30' },
    { id: 'languages', label: 'زبان‌های خارجی', icon: FlagIcon, color: 'from-blue-600 to-indigo-900', text: 'text-blue-100', border: 'border-blue-500/30' },
    { id: 'sciences', label: 'علوم تجربی', icon: BeakerIcon, color: 'from-emerald-600 to-teal-900', text: 'text-emerald-100', border: 'border-emerald-500/30' },
    { id: 'physics', label: 'ریاضی و فیزیک', icon: BoltIcon, color: 'from-violet-600 to-fuchsia-900', text: 'text-violet-100', border: 'border-violet-500/30' },
    { id: 'astronomy', label: 'نجوم و فضا', icon: MoonIcon, color: 'from-indigo-600 to-purple-900', text: 'text-indigo-100', border: 'border-indigo-500/30' },
    { id: 'theology', label: 'کتب آسمانی', icon: BookOpenIcon, color: 'from-amber-600 to-orange-900', text: 'text-amber-100', border: 'border-amber-500/30' },
    { id: 'humanities', label: 'علوم انسانی', icon: DocumentTextIcon, color: 'from-stone-600 to-stone-900', text: 'text-stone-100', border: 'border-stone-500/30' },
];

// --- Components ---

const QuizModal: React.FC<{ course: MicroCourse; onComplete: (score: number) => void; onClose: () => void }> = ({ course, onComplete, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<{ q: string; options: string[]; answer: number }[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        const generateQuiz = async () => {
            const prompt = `Generate a 5-question multiple choice quiz for the course "${course.title}". 
            Goal: "${course.goal}".
            Language: Persian.
            Output JSON: [{ "q": "question text", "options": ["opt1", "opt2", "opt3", "opt4"], "answer": 0 }] (answer index 0-3).`;
            
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                setQuestions(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error(e);
                alert("خطا در تولید آزمون");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        generateQuiz();
    }, [course]);

    const handleAnswer = (idx: number) => {
        if (idx === questions[currentQ].answer) setScore(s => s + 1);
        if (currentQ < questions.length - 1) {
            setCurrentQ(q => q + 1);
        } else {
            setFinished(true);
        }
    };

    const finishQuiz = () => {
        onComplete(score);
        onClose();
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[80]">
            <div className="text-center">
                <SparklesIcon className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4"/>
                <p className="text-white font-bold">در حال طراحی سوالات...</p>
            </div>
        </div>
    );

    if (finished) return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[80]">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center max-w-sm w-full animate-bounce-in">
                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/40">
                    <AcademicCapIcon className="w-10 h-10 text-white"/>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">نتیجه آزمون</h3>
                <p className="text-4xl font-black text-indigo-400 mb-4">{score} / {questions.length}</p>
                <p className="text-slate-400 mb-6 text-sm">
                    {score === 5 ? "فوق‌العاده! شما مسلط هستید." : score > 2 ? "خوب بود، اما جای پیشرفت دارد." : "نیاز به مرور بیشتر دارید."}
                </p>
                <button onClick={finishQuiz} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">ثبت نتیجه</button>
            </div>
        </div>
    );

    const q = questions[currentQ];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[80] p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-slate-500 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full">سوال {currentQ + 1} از {questions.length}</span>
                    <span className="text-xs text-slate-500">آزمون هوشمند</span>
                </div>
                
                <h4 className="text-lg font-bold text-white mb-6 leading-relaxed">{q.q}</h4>
                
                <div className="space-y-3">
                    {q.options.map((opt, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleAnswer(idx)}
                            className="w-full text-right p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 transition-all text-sm text-slate-200"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LiveProfessorSession: React.FC<{ course: MicroCourse; onClose: () => void }> = ({ course, onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'>('connecting');
    const [transcript, setTranscript] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [keyTerms, setKeyTerms] = useState<string[]>([]); 
    const transcriptContainerRef = useRef<HTMLDivElement>(null);

    // Audio Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const activeSessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);

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
        if (inputContextRef.current && inputContextRef.current.state !== 'closed') inputContextRef.current.close();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
        activeSessionRef.current = null;
    };

    const connect = useCallback(async () => {
        cleanupAudio();
        setStatus('connecting');
        setTranscript([]);
        setKeyTerms([]);

        try {
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true } });
            mediaStreamRef.current = stream;

            // Provide PDF context if available
            let contextData = "";
            if (course.pdfSource) {
                contextData = `Reference Material from PDF: ${course.pdfSource.substring(0, 15000)}...`; 
            }

            const isKonkur = course.title.includes('کنکور') || course.goal.includes('تست');
            const systemPrompt = isKonkur ? `
                You are an expert Konkur (Iran University Entrance Exam) counselor and planner.
                Course: "${course.title}". Goal: "${course.goal}".
                Role: Guide the student in planning, testing strategies, time management, and reviewing key concepts.
                Tone: Professional, encouraging, strict on discipline, fluent Persian.
                You can suggest schedule changes or focus areas.
                ${contextData ? `Use this material for testing: ${contextData}` : ''}
            ` : `
                You are an expert university professor teaching "${course.title}".
                Goal: "${course.goal}".
                Tone: Academic, wise, clear, fluent Persian (Farsi).
                Extract key academic terms from your speech occasionally.
                Current progress: ${course.progress}%.
                ${contextData ? `Use this reference material to answer questions accurately: ${contextData}` : ''}
            `;

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: systemPrompt,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: isKonkur ? 'Charon' : 'Fenrir' } } },
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
                        if (msg.serverContent?.outputTranscription?.text) {
                            const textChunk = msg.serverContent.outputTranscription.text;
                            setCurrentTranscript(prev => prev + textChunk);
                            
                            if (textChunk.length > 4 && Math.random() > 0.85) {
                                const words = textChunk.split(' ');
                                const keyword = words.sort((a,b) => b.length - a.length)[0];
                                if (keyword && keyword.length > 4 && !keyTerms.includes(keyword)) {
                                    setKeyTerms(prev => [...prev.slice(-3), keyword]);
                                }
                            }
                        }
                        
                        if (msg.serverContent?.turnComplete) {
                            if (currentTranscript) {
                                setTranscript(prev => [...prev, { role: 'ai', text: currentTranscript }]);
                                setCurrentTranscript('');
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
                            const nextTime = nextStartTimeRef.current;
                            const now = audioContextRef.current.currentTime;
                            const startTime = Math.max(now, nextTime);
                            
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            
                            source.onended = () => {
                                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                                    setStatus('listening');
                                }
                            };
                        }
                    },
                    onclose: () => {
                        console.log("Session closed");
                        setStatus('connecting');
                    },
                    onerror: (e) => { console.error(e); setStatus('error'); }
                }
            });
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    }, [course]);

    useEffect(() => {
        connect();
        return () => cleanupAudio();
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col font-[Vazirmatn] overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,27,75,0.4),transparent_80%)] pointer-events-none"></div>
            
            {/* Smart Blackboard (Top) */}
            <div className="absolute top-6 left-4 right-4 flex justify-center gap-3 flex-wrap z-20 pointer-events-none">
                {keyTerms.map((term, idx) => (
                    <div key={`${term}-${idx}`} className="bg-black/60 backdrop-blur-md border border-indigo-500/40 text-indigo-200 px-4 py-2 rounded-xl text-sm font-bold shadow-lg animate-bounce-in">
                        {term}
                    </div>
                ))}
            </div>

            {/* Main Immersive Center */}
            <div className="flex-grow relative flex flex-col items-center justify-center">
                
                {/* Visualizer Core */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* Ripple Effects */}
                    <div className={`absolute inset-0 rounded-full border border-indigo-500/20 transition-all duration-1000 ${status === 'speaking' ? 'scale-150 opacity-0' : 'scale-100 opacity-30'}`}></div>
                    <div className={`absolute inset-0 rounded-full border border-fuchsia-500/20 transition-all duration-1000 delay-200 ${status === 'speaking' ? 'scale-125 opacity-0' : 'scale-90 opacity-30'}`}></div>
                    
                    {/* Core Glow */}
                    <div className={`absolute inset-10 rounded-full bg-indigo-600/20 blur-3xl transition-all duration-300 ${status === 'speaking' ? 'opacity-80 scale-110' : 'opacity-40 scale-100'}`}></div>
                    
                    {/* Main Circle */}
                    <div className={`relative z-10 w-40 h-40 rounded-full bg-gradient-to-b from-slate-800 to-black border-4 flex items-center justify-center shadow-2xl transition-all duration-300 ${status === 'speaking' ? 'border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.5)]' : 'border-slate-700'}`}>
                        {status === 'speaking' ? (
                            <SpeakerWaveIcon className="w-16 h-16 text-indigo-300 animate-pulse"/>
                        ) : status === 'listening' ? (
                            <MicrophoneIcon className="w-16 h-16 text-emerald-400 animate-pulse"/>
                        ) : (
                            <div className="w-10 h-10 border-t-2 border-white rounded-full animate-spin"></div>
                        )}
                    </div>
                </div>

                {/* Subtitles / Transcript */}
                <div className="absolute bottom-32 left-0 right-0 px-6 flex flex-col items-center gap-3 z-20 max-h-60 overflow-y-auto scrollbar-hide mask-linear-fade" ref={transcriptContainerRef}>
                    {transcript.slice(-2).map((msg, i) => (
                        <div key={i} className={`max-w-md p-4 rounded-2xl backdrop-blur-md text-sm leading-relaxed shadow-lg border border-white/5 ${msg.role === 'ai' ? 'bg-indigo-900/40 text-indigo-100 rounded-tl-none' : 'bg-slate-800/60 text-slate-200 rounded-tr-none self-end'}`}>
                            {msg.text}
                        </div>
                    ))}
                    {currentTranscript && (
                        <div className="max-w-md p-4 rounded-2xl bg-indigo-900/60 backdrop-blur-md border border-indigo-500/30 text-white text-sm leading-relaxed shadow-lg animate-fadeIn rounded-tl-none">
                            <span className="animate-pulse">▋</span> {currentTranscript}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Control Dock */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                <div className="flex items-center gap-4 bg-[#1a1a1d]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl">
                    <button onClick={connect} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="اتصال مجدد">
                        <ArrowPathIcon className="w-5 h-5"/>
                    </button>
                    
                    <div className="h-8 w-[1px] bg-white/10"></div>
                    
                    <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-0.5">CLASS LIVE</span>
                        <span className="text-xs font-bold text-white">{course.title}</span>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10"></div>

                    <button onClick={onClose} className="p-3 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors" title="پایان کلاس">
                        <StopIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PDF Course Creator Component ---

const PdfCourseGenerator: React.FC<{ onCourseCreated: (course: MicroCourse) => void; onCancel: () => void }> = ({ onCourseCreated, onCancel }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'reading' | 'processing' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            alert("لطفا فقط فایل PDF آپلود کنید.");
            return;
        }

        setStatus('reading');
        try {
            const arrayBuffer = await file.arrayBuffer();
            // @ts-ignore
            const pdfjs = pdfjsLib.default || pdfjsLib;
            const pdf = await pdfjs.getDocument(arrayBuffer).promise;
            
            let fullText = '';
            const maxPages = Math.min(pdf.numPages, 30); // Limit pages for MVP to avoid token limits
            
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
                setProgress((i / maxPages) * 50); // First 50% is reading
            }

            setStatus('processing');
            
            // Generate Course with Gemini
            const prompt = `
                Analyze this text extracted from a document.
                Create a structured 7-day micro-course syllabus based on the key concepts.
                
                Text Snippet (first 20k chars):
                ${fullText.substring(0, 20000)}...

                Output JSON structure:
                {
                    "courseTitle": "Title based on document",
                    "goal": "One sentence learning goal",
                    "days": [
                        { "day": 1, "focus": "Topic", "lesson": "Short explanation", "challenge": "Actionable task", "reflection": "Deep question" }
                        ... (7 days)
                    ]
                }
                Language: Persian.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            setProgress(100);
            const result = JSON.parse(response.text.trim());

            const newCourse: MicroCourse = {
                id: `pdf-course-${Date.now()}`,
                title: result.courseTitle,
                goal: result.goal,
                days: result.days.map((d: any) => ({ ...d, completed: false })),
                progress: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                chatHistory: [],
                quizzes: [],
                // Store extracted text for Live Professor context
                pdfSource: fullText.substring(0, 50000) // Store reasonable amount for context
            };

            onCourseCreated(newCourse);
            setStatus('done');

        } catch (error) {
            console.error("PDF Processing Error:", error);
            alert("خطا در پردازش فایل. لطفا دوباره تلاش کنید.");
            setStatus('idle');
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white mb-2">تبدیل کتاب به کلاس درس</h3>
                <p className="text-slate-400 text-sm">فایل PDF خود را رها کنید تا هوش مصنوعی آن را تدریس کند.</p>
            </div>

            <div 
                className={`
                    w-full max-w-md aspect-square rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative overflow-hidden
                    ${isDragging ? 'border-indigo-400 bg-indigo-900/20 scale-105' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-indigo-500/50'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsDragging(false); 
                    if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); 
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" ref={fileInputRef} accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                
                {status === 'idle' && (
                    <>
                        <DocumentScannerIcon className="w-20 h-20 text-slate-500 mb-4"/>
                        <span className="text-slate-300 font-bold">اینجا رها کنید</span>
                        <span className="text-slate-500 text-xs mt-2">PDF (Max 30MB)</span>
                    </>
                )}

                {status === 'reading' && (
                    <div className="flex flex-col items-center">
                        <DocumentTextIcon className="w-20 h-20 text-indigo-400 animate-bounce"/>
                        <span className="text-indigo-300 font-bold mt-4">در حال خواندن صفحات...</span>
                    </div>
                )}

                {status === 'processing' && (
                    <div className="flex flex-col items-center">
                        <SparklesIcon className="w-20 h-20 text-fuchsia-400 animate-spin"/>
                        <span className="text-fuchsia-300 font-bold mt-4">طراحی سیلابس درسی...</span>
                    </div>
                )}

                {(status === 'reading' || status === 'processing') && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-700">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
            </div>

            <button onClick={onCancel} className="mt-8 text-slate-500 hover:text-white transition-colors">بازگشت</button>
        </div>
    );
};

// --- Main View ---

const MicroCourseView: React.FC<MicroCourseViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [courses, setCourses] = useState<MicroCourse[]>(userData.microCourses || []);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isPdfMode, setIsPdfMode] = useState(false);
    const [newCourseGoal, setNewCourseGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'syllabus' | 'class' | 'quiz'>('syllabus');

    const activeCourse = courses.find(c => c.id === activeCourseId);

    const getCoursesByCategory = (catId: string) => {
        // Static categorization mapping based on ID patterns or keywords
        // This is a simplification for the demo. Real app needs better categorization.
        return courses.filter(c => {
            if (catId === 'konkur') return c.title.includes('کنکور') || c.goal.includes('آزمون') || c.id.startsWith('course-konkur');
            if (catId === 'computer') return c.id.startsWith('course-comp');
            if (catId === 'languages') return c.id.startsWith('course-lang');
            if (catId === 'theology') return c.id.startsWith('course-theo');
            if (catId === 'astronomy') return c.id.startsWith('course-astro');
            if (catId === 'physics') return c.id.startsWith('course-phys') || c.id.startsWith('course-math');
            if (catId === 'sciences') return c.id.startsWith('course-sci') || c.id.startsWith('course-bio') || c.id.startsWith('course-chem');
            if (catId === 'humanities') return c.id.startsWith('course-human') || c.id.startsWith('course-lit') || c.id.startsWith('course-art') || c.id.startsWith('course-phil') || c.id.startsWith('course-hist');
            
            // Fallback for user generated courses
            return true;
        });
    };

    const handleCreateCourse = async () => {
        if (!newCourseGoal.trim()) return;
        setIsGenerating(true);
        const prompt = `Generate a 7-day syllabus for a micro-course on: "${newCourseGoal}". Output JSON: { "courseTitle": string, "days": [{ "day": 1, "focus": string, "lesson": string, "challenge": string, "reflection": string }] }. Language: Persian.`;
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
                chatHistory: [],
                quizzes: []
            };
            const updated = [...courses, newCourse];
            setCourses(updated);
            onUpdateUserData({ ...userData, microCourses: updated });
            setIsCreating(false);
            setNewCourseGoal('');
            setActiveCourseId(newCourse.id);
        } catch (e) { alert("خطا در ساخت دوره."); } finally { setIsGenerating(false); }
    };

    const handlePdfCourseCreated = (newCourse: MicroCourse) => {
        // Ensure PDF courses are marked if for Konkur
        if (newCourse.title.includes('کنکور') || newCourse.title.includes('آزمون')) {
            newCourse.id = 'course-konkur-' + newCourse.id; // Tagging via ID hack for category sorting
        }
        const updated = [...courses, newCourse];
        setCourses(updated);
        onUpdateUserData({ ...userData, microCourses: updated });
        setIsPdfMode(false);
        setActiveCourseId(newCourse.id);
    };

    const handleQuizComplete = (score: number) => {
        if (!activeCourse) return;
        const newResult: QuizResult = { date: new Date().toISOString(), score, totalQuestions: 5 };
        const updatedCourse = { ...activeCourse, quizzes: [...(activeCourse.quizzes || []), newResult] };
        // Simple XP logic
        const newXp = (userData.xp || 0) + (score * 20); 
        
        const updatedCourses = courses.map(c => c.id === activeCourse.id ? updatedCourse : c);
        setCourses(updatedCourses);
        onUpdateUserData({ ...userData, microCourses: updatedCourses, xp: newXp });
        setActiveTab('syllabus');
    };

    // --- Screens ---

    const renderHome = () => (
        <div className="flex-grow overflow-y-auto p-6 pb-32 scrollbar-hide">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">دانشگاه بنویس</h2>
                    <p className="text-xs text-indigo-400 font-bold mt-1 uppercase tracking-widest">School OS</p>
                </div>
            </div>

            {/* PDF Upload Banner */}
            <button 
                onClick={() => setIsPdfMode(true)}
                className="w-full mb-6 p-5 bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-500/30 rounded-[2rem] flex items-center justify-between group hover:scale-[1.02] transition-transform shadow-lg"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl text-indigo-300">
                        <CloudIcon className="w-8 h-8"/>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-white text-lg">آپلود جزوه / کتاب</h3>
                        <p className="text-xs text-slate-300">تبدیل PDF به کلاس درس تعاملی (مناسب کنکور)</p>
                    </div>
                </div>
                <div className="bg-indigo-600 p-2 rounded-full">
                    <ArrowLeftIcon className="w-5 h-5 text-white rotate-180"/>
                </div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SCHOOL_CATEGORIES.map(cat => {
                    const count = getCoursesByCategory(cat.id).length;
                    return (
                        <button 
                            key={cat.id} 
                            onClick={() => setActiveCategory(cat.id)}
                            className={`relative p-6 rounded-[2rem] overflow-hidden text-right group border bg-slate-900 ${cat.border} hover:border-opacity-100 transition-all hover:scale-[1.02] h-40`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <cat.icon className={`w-10 h-10 ${cat.text} opacity-80`} />
                                    <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded-lg text-slate-300">{count} دوره</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                                    <p className="text-start text-[10px] text-slate-400 mt-1">ورود به دانشکده &larr;</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <button 
                onClick={() => setIsCreating(true)}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-700 rounded-[2rem] text-slate-400 font-bold hover:bg-slate-800 hover:text-white hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
            >
                <PlusIcon className="w-6 h-6"/>
                تاسیس دوره جدید (موضوعی)
            </button>
        </div>
    );

    const renderCategory = () => {
        const cat = SCHOOL_CATEGORIES.find(c => c.id === activeCategory);
        const list = getCoursesByCategory(activeCategory || '');

        return (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/5 bg-slate-900/50 flex items-center gap-4 sticky top-0 z-20 backdrop-blur-md">
                    <button onClick={() => setActiveCategory(null)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowRightIcon className="w-5 h-5 rotate-180"/></button>
                    <h2 className="text-xl font-black text-white">{cat?.label}</h2>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-32">
                    {activeCategory === 'konkur' && (
                        <div className="bg-rose-900/20 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-500 rounded-full text-white animate-pulse">
                                <TrophyIcon className="w-6 h-6"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-rose-200">مشاوره هوشمند کنکور</h3>
                                <p className="text-xs text-rose-300">برای دریافت برنامه ریزی درسی، وارد یک دوره شوید و تماس زنده بگیرید.</p>
                            </div>
                        </div>
                    )}

                    {list.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <BeakerIcon className="w-16 h-16 mx-auto mb-4 text-slate-600"/>
                            <p>هنوز درسی در این دانشکده نیست.</p>
                        </div>
                    ) : (
                        list.map(c => (
                            <div key={c.id} onClick={() => setActiveCourseId(c.id)} className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-white text-lg">{c.title}</h3>
                                    <ArrowLeftIcon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors"/>
                                </div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full" style={{ width: `${c.progress}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 text-right">{c.progress}% تکمیل شده</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderCourse = () => {
        if (!activeCourse) return null;
        if (activeTab === 'class') return <LiveProfessorSession course={activeCourse} onClose={() => setActiveTab('syllabus')} />;
        if (activeTab === 'quiz') return <QuizModal course={activeCourse} onComplete={handleQuizComplete} onClose={() => setActiveTab('syllabus')} />;

        const isKonkur = activeCourse.id.includes('konkur') || activeCourse.title.includes('کنکور');

        return (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/5 bg-slate-900/50 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                    <button onClick={() => setActiveCourseId(null)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowRightIcon className="w-5 h-5 rotate-180"/></button>
                    <h2 className="text-lg font-black text-white truncate max-w-[200px]">{activeCourse.title}</h2>
                    <div className="w-9"></div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 pb-32 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-500/20 p-6 rounded-[2rem] text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 rotate-3 relative z-10">
                            <AcademicCapIcon className="w-8 h-8 text-white"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 relative z-10">هدف دوره</h3>
                        <p className="text-sm text-indigo-200 relative z-10">{activeCourse.goal}</p>
                        
                        <div className="mt-4 flex justify-center gap-2 relative z-10">
                            <button onClick={() => setActiveTab('quiz')} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2">
                                <PencilIcon className="w-4 h-4"/> آزمون مهارت
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeCourse.days.map(day => (
                            <div key={day.day} className="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl group hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold bg-white/5 px-3 py-1 rounded-lg text-indigo-300">جلسه {day.day}</span>
                                    <CheckCircleIcon className={`w-5 h-5 ${day.completed ? 'text-green-500' : 'text-slate-600'}`}/>
                                </div>
                                <h4 className="font-bold text-white mb-1">{day.lesson}</h4>
                                <p className="text-sm text-slate-400">{day.focus}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Action Button for Class */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-max">
                    <button 
                        onClick={() => setActiveTab('class')}
                        className={`flex items-center gap-3 text-white px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-all border-4 border-[#020617] ${isKonkur ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/40'}`}
                    >
                        <MicrophoneIcon className="w-6 h-6"/>
                        {isKonkur ? 'مشاوره و تدریس زنده' : 'شروع کلاس زنده'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] font-[Vazirmatn] flex flex-col animate-fadeIn overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Content Container - Ensures Scrolling */}
            <div className="relative z-10 w-full h-full flex flex-col min-h-0">
                {isPdfMode ? (
                    <PdfCourseGenerator onCourseCreated={handlePdfCourseCreated} onCancel={() => setIsPdfMode(false)} />
                ) : isCreating ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <h2 className="text-2xl font-black text-white mb-6">چه چیزی می‌خواهید یاد بگیرید؟</h2>
                        <input 
                            type="text" 
                            value={newCourseGoal}
                            onChange={e => setNewCourseGoal(e.target.value)}
                            placeholder="مثلا: مبانی فیزیک کوانتوم"
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-center mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <div className="flex gap-4 w-full">
                            <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold text-slate-300">لغو</button>
                            <button onClick={handleCreateCourse} disabled={isGenerating} className="flex-[2] py-3 bg-indigo-600 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                                {isGenerating ? <SparklesIcon className="w-5 h-5 animate-spin"/> : "ساخت دوره"}
                            </button>
                        </div>
                    </div>
                ) : activeCourseId ? renderCourse() : activeCategory ? renderCategory() : renderHome()}
            </div>

            {/* Bottom Dock (Only on main pages, not inside live class or specialized modes) */}
            {!isCreating && !isPdfMode && !activeCourseId && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                    <button onClick={onClose} className="w-16 h-16 rounded-full bg-slate-800 border-4 border-[#020617] text-slate-400 hover:text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                        <XMarkIcon className="w-8 h-8"/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MicroCourseView;


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OnboardingData, Book, ReadingSession, ChatMessage, BookNote, Flashcard } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { 
    BookOpenIcon, PlusIcon, SparklesIcon, 
    ArrowLeftIcon, XMarkIcon, PlayIcon, PauseIcon,
    StopIcon, DocumentTextIcon, ArrowUpIcon,
    MicrophoneIcon, SpeakerWaveIcon, FireIcon, 
    ChatBubbleOvalLeftEllipsisIcon,
    QueueListIcon, StarIcon, TrashIcon,
    AcademicCapIcon, LightBulbIcon, MagnifyingGlassIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helpers
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

// --- SUB COMPONENTS ---

const FlashcardDeck: React.FC<{ book: Book; onUpdate: (cards: Flashcard[]) => void }> = ({ book, onUpdate }) => {
    const [cards, setCards] = useState<Flashcard[]>(book.flashcards || []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [flipped, setFlipped] = useState<Set<string>>(new Set());
    const [scope, setScope] = useState<'chapter' | 'book'>('book');

    const handleFlip = (id: string) => {
        const newFlipped = new Set(flipped);
        if (newFlipped.has(id)) newFlipped.delete(id);
        else newFlipped.add(id);
        setFlipped(newFlipped);
    };

    const generateCards = async () => {
        setIsGenerating(true);
        const promptScope = scope === 'chapter' ? `chapter ${book.currentChapter || 1}` : "the entire book";
        const prompt = `Create 5 high-quality flashcards (Question/Answer) for the book "${book.title}" by "${book.author}", focusing on ${promptScope}.
        Focus on deep insights, definitions, and actionable principles.
        Respond ONLY with a JSON array: [{ "question": "...", "answer": "..." }]. 
        Language: Persian.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: {type: Type.STRING}, answer: {type: Type.STRING} } } } }
            });
            
            const newCardsData = JSON.parse(response.text.trim());
            const newCards: Flashcard[] = newCardsData.map((c: any, i: number) => ({
                id: `fc-${Date.now()}-${i}`,
                question: c.question,
                answer: c.answer,
                box: 1,
                status: 'new'
            }));
            
            const updatedCards = [...cards, ...newCards];
            setCards(updatedCards);
            onUpdate(updatedCards);
        } catch (e) {
            console.error(e);
            alert("خطا در تولید فلش‌کارت");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = (id: string) => {
        const updated = cards.filter(c => c.id !== id);
        setCards(updated);
        onUpdate(updated);
    };

    const moveCard = (id: string, boxDelta: number) => {
        const updated = cards.map(c => {
            if (c.id === id) {
                return { ...c, box: Math.min(5, Math.max(1, c.box + boxDelta)) };
            }
            return c;
        });
        setCards(updated);
        onUpdate(updated);
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="p-4 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <h3 className="font-bold text-white flex items-center gap-2"><AcademicCapIcon className="w-6 h-6 text-yellow-400"/> جعبه لایتنر</h3>
                <div className="flex gap-2">
                    <select value={scope} onChange={(e) => setScope(e.target.value as any)} className="bg-slate-800 text-xs text-white border border-slate-600 rounded-lg px-2 outline-none">
                        <option value="book">کل کتاب</option>
                        <option value="chapter">فصل {book.currentChapter}</option>
                    </select>
                    <button onClick={generateCards} disabled={isGenerating} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1 disabled:opacity-50 shadow-lg">
                        <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`}/>
                        {isGenerating ? 'تولید...' : 'تولید کارت'}
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide pb-32">
                {cards.length === 0 && !isGenerating && (
                    <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                        <AcademicCapIcon className="w-16 h-16 opacity-20 mb-4"/>
                        <p>هنوز کارتی ندارید.</p>
                        <p className="text-xs mt-1 opacity-70">برای یادگیری عمیق، کارت بسازید.</p>
                    </div>
                )}
                {cards.map(card => (
                    <div key={card.id} className="relative h-48 w-full perspective-1000 group cursor-pointer" onClick={() => handleFlip(card.id)}>
                        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${flipped.has(card.id) ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-black/20 px-2 py-1 rounded">سوال</span>
                                    <div className="flex gap-1">
                                        {Array.from({length: 5}).map((_, i) => (
                                            <div key={i} className={`w-2 h-2 rounded-full ${i < card.box ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-center text-white font-bold text-lg leading-relaxed px-2">{card.question}</p>
                                <div className="text-center text-[10px] text-slate-500 mt-2 animate-pulse">برای پاسخ ضربه بزنید</div>
                            </div>
                            {/* Back */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl rotate-y-180">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest bg-indigo-500/20 px-2 py-1 rounded">پاسخ</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }} className="text-slate-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                <p className="text-center text-white font-medium text-base leading-relaxed px-2">{card.answer}</p>
                                <div className="flex gap-2 justify-center mt-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => moveCard(card.id, -1)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30">فراموش کردم</button>
                                    <button onClick={() => moveCard(card.id, 1)} className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-xs hover:bg-green-500/30">بلدم</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BookNotes: React.FC<{ book: Book; onUpdate: (notes: BookNote[]) => void }> = ({ book, onUpdate }) => {
    const [newNote, setNewNote] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
    const [insights, setInsights] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const allNotes = [
        ...(book.notes || []),
        ...(book.sessions || []).filter(s => s.note).map(s => ({
            id: s.id,
            chapter: 0,
            content: `[جلسه مطالعه ${new Date(s.date).toLocaleDateString('fa-IR')}]\n${s.note}`,
            createdAt: s.date
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleSaveNote = () => {
        if (!newNote.trim()) return;
        const note: BookNote = {
            id: `note-${Date.now()}`,
            chapter: book.currentChapter || 0,
            content: newNote,
            createdAt: new Date().toISOString()
        };
        onUpdate([...(book.notes || []), note]);
        setNewNote('');
        setViewMode('list');
    };

    const generateInsights = async () => {
        if (allNotes.length === 0) return;
        setIsAnalyzing(true);
        const notesText = allNotes.map(n => n.content).join('\n---\n');
        const prompt = `Analyze these notes from the book "${book.title}". 
        Identify 3 key takeaways and 3 actionable steps for the user.
        Notes:
        ${notesText}
        
        Response Format (JSON):
        {
            "takeaways": ["string"],
            "actions": ["string"]
        }
        Language: Persian.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const result = JSON.parse(response.text.trim());
            const formatted = `
### 💡 برداشت‌های کلیدی
${result.takeaways.map((t: string) => `- ${t}`).join('\n')}

### 🚀 اقدامات عملی
${result.actions.map((a: string) => `- ${a}`).join('\n')}
            `;
            setInsights(formatted);
        } catch (e) {
            console.error(e);
            alert("خطا در تحلیل یادداشت‌ها.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="p-4 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <h3 className="font-bold text-white flex items-center gap-2"><DocumentTextIcon className="w-6 h-6 text-blue-400"/> دفترچه یادداشت</h3>
                <div className="flex gap-2">
                    {allNotes.length > 0 && (
                        <button onClick={generateInsights} disabled={isAnalyzing} className="p-2 bg-slate-800 text-yellow-400 rounded-lg hover:bg-slate-700 transition-colors" title="تحلیل هوشمند">
                            <LightBulbIcon className={`w-5 h-5 ${isAnalyzing ? 'animate-pulse' : ''}`}/>
                        </button>
                    )}
                    <button onClick={() => setViewMode(viewMode === 'list' ? 'add' : 'list')} className={`p-2 rounded-lg transition-all ${viewMode === 'add' ? 'bg-slate-700 text-white' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'}`}>
                        {viewMode === 'add' ? <QueueListIcon className="w-5 h-5"/> : <PlusIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 pb-32 scrollbar-hide">
                {viewMode === 'add' ? (
                    <div className="space-y-4">
                        <textarea 
                            autoFocus
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            placeholder="یادداشت جدید خود را بنویسید..."
                            className="w-full h-60 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                        <button onClick={handleSaveNote} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all">
                            ذخیره یادداشت
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {insights && (
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-5 rounded-xl animate-fadeIn mb-6 shadow-lg">
                                <h4 className="font-bold text-indigo-300 mb-3 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> تحلیل هوشمند</h4>
                                <div className="prose prose-invert prose-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {insights}
                                </div>
                                <button onClick={() => setInsights(null)} className="mt-4 text-xs text-slate-500 hover:text-slate-300 w-full text-center">بستن تحلیل</button>
                            </div>
                        )}

                        {allNotes.length === 0 && (
                            <div className="text-center py-10 text-slate-500">
                                <DocumentTextIcon className="w-16 h-16 opacity-20 mx-auto mb-4"/>
                                <p>هنوز یادداشتی ثبت نشده است.</p>
                            </div>
                        )}
                        {allNotes.map(note => (
                            <div key={note.id} className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl hover:border-slate-600 transition-colors">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-2">
                                    <span className="text-[10px] text-slate-500">{new Date(note.createdAt).toLocaleDateString('fa-IR')}</span>
                                    {note.id.startsWith('note-') && (
                                        <button onClick={() => onUpdate((book.notes || []).filter(n => n.id !== note.id))} className="text-slate-600 hover:text-red-400"><TrashIcon className="w-3.5 h-3.5"/></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ReadingSessionTimer: React.FC<{ book: Book; onFinish: (session: ReadingSession) => void }> = ({ book, onFinish }) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [startPage, setStartPage] = useState(book.currentPage || 0);
    const [endPage, setEndPage] = useState(book.currentPage || 0);
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        let interval: number | null = null;
        if (isActive) {
            interval = window.setInterval(() => setSeconds(s => s + 1), 1000);
        } else if (!isActive && seconds !== 0) {
            if(interval) clearInterval(interval);
        }
        return () => { if(interval) clearInterval(interval); };
    }, [isActive, seconds]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleFinish = () => {
        setIsActive(false);
        const pagesRead = Math.max(0, endPage - startPage);
        onFinish({
            id: `sess-${Date.now()}`,
            date: new Date().toISOString(),
            durationMinutes: Math.floor(seconds / 60),
            pagesRead,
            startPage,
            endPage,
            note: notes
        });
    };

    return (
        <div className="bg-black/40 p-6 rounded-2xl border border-white/10 text-center backdrop-blur-md w-full max-w-md animate-fadeIn mt-4 shadow-2xl">
            <div className="text-6xl font-mono font-black text-amber-100 mb-8 tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">{formatTime(seconds)}</div>
            
            <div className="flex justify-center gap-8 mb-8">
                <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg border-4 border-black/20 hover:scale-105 ${isActive ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {isActive ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10 pl-1"/>}
                </button>
                {seconds > 0 && !isActive && (
                    <button onClick={handleFinish} className="w-20 h-20 rounded-full bg-red-600 border-4 border-black/20 flex items-center justify-center shadow-lg text-white hover:scale-105 transition-all">
                        <StopIcon className="w-10 h-10"/>
                    </button>
                )}
            </div>

            {!isActive && seconds > 0 && (
                <div className="space-y-4 text-right animate-fadeIn bg-black/30 p-4 rounded-xl border border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-slate-400 mb-1 block uppercase tracking-widest font-bold">صفحه شروع</label>
                            <input type="number" value={startPage} onChange={e => setStartPage(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-center text-white font-mono font-bold"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 mb-1 block uppercase tracking-widest font-bold">صفحه پایان</label>
                            <input type="number" value={endPage} onChange={e => setEndPage(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-center text-white font-mono font-bold"/>
                        </div>
                    </div>
                    <textarea 
                        placeholder="یادداشت‌های این جلسه..." 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500/50 outline-none resize-none"
                        rows={3}
                    />
                </div>
            )}
        </div>
    );
};

// --- Live Author Session (Gemini Live API) ---
const LiveAuthorSession: React.FC<{
    book: Book;
    onClose: () => void;
}> = ({ book, onClose }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'>('idle');
    const nextStartTimeRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    // Audio Contexts & Nodes
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const activeSessionRef = useRef<Promise<any> | null>(null);
    const mountedRef = useRef(true);

    // Clean up audio resources
    const cleanup = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (sourceRef.current) { 
            sourceRef.current.disconnect(); 
            sourceRef.current = null; 
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (mediaStreamRef.current) { 
            mediaStreamRef.current.getTracks().forEach(t => t.stop()); 
            mediaStreamRef.current = null; 
        }
        
        if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
            try { await inputContextRef.current.close(); } catch (e) { console.warn(e); }
        }
        inputContextRef.current = null;

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try { await audioContextRef.current.close(); } catch (e) { console.warn(e); }
        }
        audioContextRef.current = null;
        activeSessionRef.current = null;
    };

    // Visualization Loop
    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw circular visualizer
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 70;
        const barWidth = 4;
        const bars = 40;
        const step = Math.floor(bufferLength / bars);

        for (let i = 0; i < bars; i++) {
            const value = dataArray[i * step];
            const barHeight = (value / 255) * 50;
            const angle = (i / bars) * Math.PI * 2;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = barWidth;
            ctx.strokeStyle = `rgba(139, 92, 246, ${value / 255 + 0.2})`; // Violet color
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    };

    const connect = useCallback(async () => {
        if (status === 'listening' || status === 'speaking' || status === 'connecting') return;
        
        await cleanup();
        if (!mountedRef.current) return;

        setStatus('connecting');
        nextStartTimeRef.current = 0;

        try {
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Audio Output Context (for playing AI voice)
            // Use standard sample rate to avoid issues on some devices, downsample if needed
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            
            // Setup Analyser for Output Visualization
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            analyser.connect(ctx.destination); // Connect analyser to destination

            // Audio Input Context (for microphone)
            // Standard 16kHz for Gemini Live input
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }});
            mediaStreamRef.current = stream;
            
            if (!mountedRef.current) {
                await cleanup();
                return;
            }

            const persona = book.aiPersona || `You are ${book.author}.`;

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: `
                        ${persona}
                        You are the author of the book "${book.title}".
                        Embody a persona that matches the book's tone.
                        Speak in fluent Persian (Farsi).
                        Be natural, concise, and engaging.
                    `,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
                    }
                },
                callbacks: {
                    onopen: () => {
                        if (!mountedRef.current) return;
                        setStatus('listening');
                        activeSessionRef.current = sessionPromise;
                        
                        // Start Visualizer Loop
                        drawVisualizer();

                        // Setup Input Processing
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        sourceRef.current = source;
                        processorRef.current = processor;
                        
                        processor.onaudioprocess = (e) => {
                            if (!activeSessionRef.current || inputCtx.state === 'closed' || !mountedRef.current) return;

                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcm16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcm16.buffer);
                            
                            sessionPromise.then(session => {
                                if (mountedRef.current) {
                                     session.sendRealtimeInput({
                                        media: {
                                            mimeType: "audio/pcm;rate=16000",
                                            data: base64
                                        }
                                    });
                                }
                            }).catch(err => console.warn("Input send failed", err));
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (!mountedRef.current) return;
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setStatus('speaking');
                            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
                            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

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
                            
                            // Connect source to Analyser first, then Analyser is already connected to Destination
                            if (analyserRef.current) {
                                source.connect(analyserRef.current);
                            } else {
                                source.connect(audioContextRef.current.destination);
                            }
                            
                            const now = audioContextRef.current.currentTime;
                            if (nextStartTimeRef.current < now) {
                                nextStartTimeRef.current = now + 0.05; 
                            }
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }

                        if (msg.serverContent?.turnComplete) {
                             if (audioContextRef.current) {
                                const now = audioContextRef.current.currentTime;
                                const delay = Math.max(0, (nextStartTimeRef.current - now) * 1000);
                                setTimeout(() => {
                                    if (mountedRef.current && status !== 'error') setStatus('listening');
                                }, delay + 100);
                             } else if (mountedRef.current) {
                                setStatus('listening');
                             }
                        }
                    },
                    onclose: () => {
                        console.log("Author session closed");
                        if (mountedRef.current && status !== 'error') setStatus('idle'); 
                    },
                    onerror: (e) => {
                        console.error("Author session error", e);
                        if (mountedRef.current) {
                             setStatus('error');
                             activeSessionRef.current = null;
                        }
                    }
                }
            });
        } catch (e) {
            console.error("Connection setup error", e);
            if (mountedRef.current) setStatus('error');
        }

    }, [book, status]);

    useEffect(() => {
        mountedRef.current = true;
        // Do NOT auto-connect immediately to ensure AudioContext can start with user gesture if needed
        // But user just clicked the "Live" tab, so we can try. 
        // Best practice: Show a "Start" button for explicit gesture.
        return () => {
            mountedRef.current = false;
            cleanup();
        };
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white animate-fadeIn overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'listening' ? 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15),transparent_70%)] animate-pulse'}`}></div>
            
            <div className="z-10 flex flex-col items-center gap-8 w-full px-6 h-full justify-between py-12">
                <div className="text-center mt-10">
                    <h3 className="text-slate-400 text-xs mb-2 uppercase tracking-widest font-bold animate-pulse">
                        {status === 'connecting' ? 'در حال برقراری تماس...' : status === 'error' ? 'خطا در ارتباط' : status === 'listening' ? 'گوش می‌کنم...' : status === 'speaking' ? 'در حال صحبت...' : 'آماده تماس'}
                    </h3>
                    <h2 className="text-3xl font-serif font-bold text-white drop-shadow-lg mb-2">{book.author}</h2>
                    <p className="text-sm text-slate-500">{book.title}</p>
                </div>

                {/* Visualizer Container */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                    
                    {/* HTML5 Canvas for Waveform */}
                    <canvas 
                        ref={canvasRef} 
                        width={320} 
                        height={320} 
                        className="absolute inset-0 z-0 opacity-60"
                    />

                    {/* Status Rings */}
                    {status === 'connecting' && (
                        <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
                    )}
                    
                    {status === 'error' && (
                        <div className="absolute inset-0 rounded-full bg-red-500/10 border-2 border-red-500/50"></div>
                    )}
                    
                    {/* Central Avatar */}
                    <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-slate-800 to-black border-4 relative z-10 overflow-hidden transition-all duration-500 flex items-center justify-center ${status === 'speaking' ? 'border-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.5)] scale-105' : 'border-slate-700 shadow-2xl'}`}>
                        {book.coverImage ? (
                            <img src={book.coverImage} alt={book.author} className="w-full h-full object-cover opacity-90" />
                        ) : (
                            <span className="text-6xl filter drop-shadow-lg">{book.uiHint?.icon || '📘'}</span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-4">
                     {status === 'idle' || status === 'error' ? (
                        <button 
                            onClick={connect}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-[0_0_30px_rgba(22,163,74,0.4)] transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <MicrophoneIcon className="w-5 h-5"/>
                            {status === 'error' ? 'تلاش مجدد' : 'شروع مکالمه'}
                        </button>
                     ) : (
                         <div className={`p-4 rounded-full transition-all duration-300 ${status === 'listening' ? 'bg-green-500/20 text-green-400 scale-110' : 'bg-slate-800/50 text-slate-500'}`}>
                            <MicrophoneIcon className="w-6 h-6"/>
                         </div>
                     )}
                     
                     {status === 'listening' && <span className="text-[10px] text-green-400 font-bold animate-pulse">میکروفون فعال</span>}
                </div>

                <div className="flex items-center gap-8 mb-10">
                    <button 
                        onClick={onClose}
                        className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-110 transition-all"
                    >
                        <div className="flex flex-col items-center">
                            <XMarkIcon className="w-8 h-8"/>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookSpirit: React.FC<{ book: Book; onUpdate: (updatedHistory: ChatMessage[]) => void }> = ({ book, onUpdate }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(book.chatHistory || [{
        role: 'model',
        text: `سلام. من روحِ کتاب «${book.title}» هستم. در خدمتم.`
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg, { role: 'model', text: '' }]);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `
                You are the author of the book "${book.title}" (${book.author}). Embody a persona that matches the book's tone.
                Always respond in fluent Persian (فارسی).
                Use standard paragraph structure. Be helpful and encouraging.
            `;
            const requestContents: any[] = [];
            requestContents.push({ role: 'user', parts: [{ text: systemPrompt }] });
            
            messages.slice(-6).forEach(m => requestContents.push({ role: m.role, parts: [{ text: m.text }] }));
            requestContents.push({ role: 'user', parts: [{ text: userMsg.text }] });

            const result = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: requestContents
            });

            let fullText = '';
            for await (const chunk of result) {
                const text = chunk.text;
                if (text) {
                    fullText += text;
                    setMessages(prev => {
                        const newArr = [...prev];
                        newArr[newArr.length - 1] = { role: 'model', text: fullText };
                        return newArr;
                    });
                }
            }
            
            const finalHistory = [...messages, userMsg, { role: 'model', text: fullText }];
            onUpdate(finalHistory);
            
        } catch (e) {
            console.error(e);
            setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = { role: 'model', text: "مشکلی در ارتباط پیش آمد." };
                return newArr;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        👻
                    </div>
                    <div>
                        <h3 className="font-bold text-purple-100">روح {book.title}</h3>
                        <p className="text-xs opacity-70 text-purple-300">{book.author}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-slate-700 text-white rounded-br-none' : 'bg-purple-900/20 border border-purple-500/20 text-purple-100 rounded-bl-none backdrop-blur-sm'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded-2xl rounded-bl-none">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full animate-bounce bg-purple-400"></div>
                                <div className="w-2 h-2 rounded-full animate-bounce delay-100 bg-purple-400"></div>
                                <div className="w-2 h-2 rounded-full animate-bounce delay-200 bg-purple-400"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef}></div>
            </div>

            <div className="p-3 bg-[#020617]/90 backdrop-blur-md border-t border-white/5 absolute bottom-0 left-0 right-0 z-20">
                <div className="flex items-center gap-2 bg-black/40 border border-purple-500/30 p-2 rounded-xl">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-grow bg-transparent text-white text-sm outline-none px-2 placeholder-slate-600"
                        placeholder="سوال خود را بپرسید..."
                    />
                    <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50">
                        <ArrowUpIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main BooksView Component ---

interface BooksViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

const BooksView: React.FC<BooksViewProps> = ({ userData, onUpdateUserData, onClose, addXp }) => {
    const [activeBookId, setActiveBookId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'library' | 'detail'>('library');
    const [activeTab, setActiveTab] = useState<'read' | 'cards' | 'notes' | 'spirit' | 'live'>('read');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'reading' | 'want_to_read' | 'completed'>('all');
    
    const activeBook = (userData.books || []).find(b => b.id === activeBookId);

    const updateBookProgress = (session: ReadingSession) => {
        if (!activeBook) return;
        const updatedBook = {
            ...activeBook,
            currentPage: session.endPage,
            lastReadDate: session.date,
            sessions: [...(activeBook.sessions || []), session],
            status: (session.endPage || 0) >= (activeBook.totalPages || 0) ? 'completed' : 'reading'
        } as Book;

        const updatedBooks = userData.books.map(b => b.id === activeBook.id ? updatedBook : b);
        onUpdateUserData({ ...userData, books: updatedBooks });
        addXp(session.pagesRead * 5 + session.durationMinutes * 2);
    };

    const updateBookChat = (history: ChatMessage[]) => {
        if (!activeBook) return;
        const updatedBook = { ...activeBook, chatHistory: history };
        const updatedBooks = userData.books.map(b => b.id === activeBook.id ? updatedBook : b);
        onUpdateUserData({ ...userData, books: updatedBooks });
    };

    const updateBookCards = (cards: Flashcard[]) => {
        if (!activeBook) return;
        const updatedBook = { ...activeBook, flashcards: cards };
        const updatedBooks = userData.books.map(b => b.id === activeBook.id ? updatedBook : b);
        onUpdateUserData({ ...userData, books: updatedBooks });
    };

    const updateBookNotes = (notes: BookNote[]) => {
        if (!activeBook) return;
        const updatedBook = { ...activeBook, notes: notes };
        const updatedBooks = userData.books.map(b => b.id === activeBook.id ? updatedBook : b);
        onUpdateUserData({ ...userData, books: updatedBooks });
    };

    const renderDetail = () => {
        if (!activeBook) return null;

        if (activeTab === 'live') return <LiveAuthorSession book={activeBook} onClose={() => setActiveTab('read')} />;

        return (
            <div className="flex flex-col h-full relative z-10">
                {/* Book Header */}
                <div className="flex-none p-4 flex justify-between items-center border-b border-white/5 bg-[#050505]/90 backdrop-blur-md z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setActiveBookId(null); setViewMode('library'); }} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-5 h-5"/></button>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-none">{activeBook.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{activeBook.author}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto relative">
                    {activeTab === 'read' && (
                        <div className="p-6 pb-32 flex flex-col items-center space-y-8 animate-fadeIn">
                            <div className={`w-40 h-60 rounded-lg bg-gradient-to-br ${activeBook.coverColor} shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden group`}>
                                {activeBook.coverImage ? (
                                    <img src={activeBook.coverImage} alt={activeBook.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 mix-blend-overlay"></div>
                                        <span className="text-6xl filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-700">{activeBook.uiHint?.icon}</span>
                                    </>
                                )}
                            </div>

                            <div className="w-full max-w-md space-y-2">
                                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    <span>پیشرفت</span>
                                    <span>{Math.round(((activeBook.currentPage||0)/(activeBook.totalPages||1))*100)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600" style={{ width: `${((activeBook.currentPage||0)/(activeBook.totalPages||1))*100}%` }}></div>
                                </div>
                                <p className="text-center text-slate-500 text-xs font-mono mt-1">{activeBook.currentPage} از {activeBook.totalPages} صفحه</p>
                            </div>

                            <ReadingSessionTimer book={activeBook} onFinish={updateBookProgress} />
                        </div>
                    )}

                    {activeTab === 'spirit' && (
                        <BookSpirit book={activeBook} onUpdate={updateBookChat} />
                    )}

                    {activeTab === 'cards' && (
                        <FlashcardDeck book={activeBook} onUpdate={updateBookCards} />
                    )}

                    {activeTab === 'notes' && (
                        <BookNotes book={activeBook} onUpdate={updateBookNotes} />
                    )}
                </div>

                {/* Bottom Navigation Bar - Improved Dock */}
                <div className="flex-none p-3 bg-[#0B0F17]/95 backdrop-blur-md border-t border-white/5 z-30">
                    <div className="flex items-center justify-between max-w-md mx-auto bg-slate-900/50 rounded-2xl p-1 border border-slate-800">
                        <button onClick={() => setActiveTab('read')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'read' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <BookOpenIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">مطالعه</span>
                        </button>
                        <button onClick={() => setActiveTab('cards')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'cards' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <AcademicCapIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">لایتنر</span>
                        </button>
                        <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'notes' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <DocumentTextIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">یادداشت</span>
                        </button>
                        <button onClick={() => setActiveTab('spirit')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'spirit' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <SparklesIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">روح</span>
                        </button>
                        <button onClick={() => setActiveTab('live')} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'live' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <MicrophoneIcon className="w-5 h-5"/>
                            <span className="text-[9px] font-bold">زنده</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderLibrary = () => {
        const filteredBooks = (userData.books || []).filter(b => {
            const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;
            if (filter === 'all') return true;
            return b.status === filter;
        });

        return (
            <div className="p-6 pb-32 space-y-6 overflow-y-auto h-full scrollbar-hide">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">معبد خرد</h2>
                        <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Library OS</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg transition-all">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در کتابخانه..." 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-10 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-500 absolute right-3 top-3"/>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { id: 'all', label: 'همه' },
                        { id: 'reading', label: 'در حال مطالعه' },
                        { id: 'want_to_read', label: 'لیست انتظار' },
                        { id: 'completed', label: 'خوانده شده' },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === tab.id ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredBooks.map(book => (
                         <div key={book.id} onClick={() => { setActiveBookId(book.id); setViewMode('detail'); setActiveTab('read'); }} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex gap-4 cursor-pointer hover:bg-slate-800 transition-all group relative overflow-hidden">
                            <div className={`w-20 h-28 rounded-lg bg-gradient-to-br ${book.coverColor} flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden`}>
                                {book.coverImage ? (
                                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl filter drop-shadow-lg">{book.uiHint?.icon || '📘'}</span>
                                )}
                            </div>
                            <div className="flex-grow py-1 min-w-0">
                                <h4 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors truncate">{book.title}</h4>
                                <p className="text-xs text-slate-400 mb-3 truncate">{book.author}</p>
                                {book.status === 'reading' && (
                                    <>
                                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1">
                                            <div className="h-full bg-amber-500" style={{ width: `${((book.currentPage||0) / (book.totalPages||1)) * 100}%` }}></div>
                                        </div>
                                        <p className="text-center text-slate-500 text-[10px] font-mono">{book.currentPage} / {book.totalPages}</p>
                                    </>
                                )}
                                {book.status === 'want_to_read' && (
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded">در انتظار</span>
                                )}
                                {book.status === 'completed' && (
                                    <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded">تکمیل شده</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredBooks.length === 0 && (
                         <div className="col-span-full text-center py-10 text-slate-500 opacity-50">
                            <BookOpenIcon className="w-12 h-12 mx-auto mb-3"/>
                            <p>کتابی یافت نشد.</p>
                         </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#050505] z-50 font-[Vazirmatn] flex flex-col animate-fadeIn overflow-hidden">
            {/* Ambient BG */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Add Book Modal */}
            {showAddModal && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">افزودن کتاب به کتابخانه</h3>
                            <button onClick={() => setShowAddModal(false)}><XMarkIcon className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            <p className="text-xs text-slate-400 text-center">قابلیت افزودن کتاب به زودی کامل می‌شود.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeBookId && activeBook ? renderDetail() : renderLibrary()}

            {!activeBookId && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                    <button onClick={onClose} className="w-16 h-16 rounded-full bg-slate-800 border-4 border-[#050505] text-slate-400 hover:text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                        <XMarkIcon className="w-8 h-8"/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default BooksView;

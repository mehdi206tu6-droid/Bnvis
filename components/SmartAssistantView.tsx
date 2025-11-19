
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Blob } from "@google/genai";
import { 
    ChatMessage, OnboardingData, Note, GratitudeEntry, SpeechRecognition,
    SpeechRecognitionEvent, SpeechRecognitionErrorEvent, Agent 
} from '../types';
import { 
    SparklesIcon, MicrophoneIcon, StopIcon, DocumentScannerIcon, ImageEditIcon, 
    UserIcon, SpeakerWaveIcon, BookOpenIcon, PencilIcon, TrashIcon, BriefcaseIcon,
    VideoCameraIcon
} from './icons';
import GratitudeJournal from './GratitudeJournal';
import AiAgentsHub from './AiAgentsHub';
import AiAgentRunner from './AiAgentRunner';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

// Base64 decoding for TTS audio
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  // Custom encode function for Live API requirements
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BENVIS_SYSTEM_PROMPT = `
You are Benvis, an advanced AI Life Operating System Assistant.
Your goal is to help the user organize their life, achieve goals, build habits, and maintain wellness.

**About Benvis Project:**
Benvis (from Persian "Benviss" meaning "Write") is a comprehensive Life OS built with React and powered by Google Gemini AI.
It is designed to reduce friction in life management.
Key Features:
1. **Smart Command Center:** Accepts natural language to create tasks, notes, transactions, etc.
2. **Goals & Journeys:** Break down big dreams into milestones and tasks.
3. **Habit Tracker:** Track good and bad habits with streaks and XP.
4. **Financial Center:** Track income, expenses, and budgets.
5. **Women's Health:** Cycle tracking and AI-powered health tips.
6. **AI Agents:** Specialized tools for specific tasks (Life GPS, Habit Doctor, etc.).
7. **Mindfulness:** Quiet Zone (Pomodoro), Night Routine, Weekly Review.

**Your Personality:**
- Name: Benvis (بنویس)
- Tone: Professional yet friendly, encouraging, and insightful.
- Language: You are fluent in Persian (Farsi). Always reply in Persian unless asked otherwise.

**Capabilities:**
- You can answer questions about the app features.
- You can help plan days, analyze habits, and offer financial advice.
- You can engage in voice conversations.
`;

type Tone = 'friendly' | 'formal' | 'empathetic' | 'direct';

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepThought, setIsDeepThought] = useState(false);
    const [tone, setTone] = useState<Tone>('friendly');
    const [voice, setVoice] = useState<'Kore' | 'Puck'>('Kore');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Live API State
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [liveVolume, setLiveVolume] = useState(0);
    const liveSessionRef = useRef<any>(null);
    const liveInputContextRef = useRef<AudioContext | null>(null);
    const liveOutputContextRef = useRef<AudioContext | null>(null);
    const liveNextStartTimeRef = useRef<number>(0);
    const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());


    const toneInstructions: Record<Tone, string> = {
        friendly: "You are a friendly and helpful assistant named Benvis.",
        formal: "You are a formal and professional assistant.",
        empathetic: "You are an empathetic and understanding assistant, offering support and kindness.",
        direct: "You are a direct, concise, and to-the-point assistant."
    };

    const chatHistoryKey = `benvis_chat_history_${tone}_${isDeepThought}`;

    useEffect(() => {
        // Load history on initial mount or when config changes
        try {
            const storedHistory = localStorage.getItem(chatHistoryKey);
            if (storedHistory) {
                setMessages(JSON.parse(storedHistory));
            } else {
                setMessages([]);
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
            setMessages([]);
        }
    }, [chatHistoryKey]);

    useEffect(() => {
        // Save history whenever messages change
        localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }, [messages, chatHistoryKey]);


    useEffect(() => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
    
        const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fa-IR';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setInput(prev => (prev ? prev + ' ' : '') + finalTranscript);
                }
            };
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'network') {
                    setSpeechError('خطا در اتصال اینترنت.');
                } else if (event.error === 'not-allowed') {
                    setSpeechError('دسترسی میکروفون مسدود است.');
                } else if (event.error !== 'no-speech') {
                     setSpeechError('خطا در تشخیص گفتار.');
                }
                setIsRecording(false);
            };
            recognition.onend = () => {
                setIsRecording(false);
            };
            recognitionRef.current = recognition;
        }
        
        return () => {
             disconnectLive();
             if (ctx.state !== 'closed') {
                 ctx.close().catch(e => console.warn("Failed to close main AudioContext", e));
             }
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    // --- Gemini Live Implementation ---
    
    const connectLive = async () => {
        setIsLiveMode(true);
        setIsLiveConnected(false);
        
        try {
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            liveInputContextRef.current = inputCtx;
            liveOutputContextRef.current = outputCtx;
            liveNextStartTimeRef.current = 0;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsLiveConnected(true);
                        // Stream audio from microphone
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (e) => {
                             const inputData = e.inputBuffer.getChannelData(0);
                             
                             // Simple volume visualization
                             let sum = 0;
                             for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                             const rms = Math.sqrt(sum / inputData.length);
                             setLiveVolume(Math.min(1, rms * 5)); // Amplify a bit for visual

                             const pcmBlob = createBlob(inputData);
                             sessionPromise.then(session => {
                                 session.sendRealtimeInput({ media: pcmBlob });
                             });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                         const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                         if (base64Audio && liveOutputContextRef.current) {
                             const ctx = liveOutputContextRef.current;
                             liveNextStartTimeRef.current = Math.max(liveNextStartTimeRef.current, ctx.currentTime);
                             
                             const audioBuffer = await decodeAudioData(
                                 decode(base64Audio),
                                 ctx,
                                 24000,
                                 1
                             );
                             
                             const source = ctx.createBufferSource();
                             source.buffer = audioBuffer;
                             source.connect(ctx.destination);
                             source.addEventListener('ended', () => {
                                 liveSourcesRef.current.delete(source);
                             });
                             
                             source.start(liveNextStartTimeRef.current);
                             liveNextStartTimeRef.current += audioBuffer.duration;
                             liveSourcesRef.current.add(source);
                         }
                         
                         if (msg.serverContent?.interrupted) {
                             liveSourcesRef.current.forEach(src => {
                                 src.stop();
                                 liveSourcesRef.current.delete(src);
                             });
                             liveNextStartTimeRef.current = 0;
                         }
                    },
                    onclose: () => {
                        setIsLiveConnected(false);
                        setIsLiveMode(false);
                    },
                    onerror: (e) => {
                        console.error("Live API Error", e);
                        disconnectLive();
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'Kore' ? 'Kore' : 'Puck' } }
                    },
                    systemInstruction: BENVIS_SYSTEM_PROMPT
                }
            });
            
            liveSessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Failed to connect to Live API", e);
            setIsLiveMode(false);
            alert("خطا در برقراری ارتباط زنده.");
        }
    };

    const disconnectLive = () => {
        if (liveSessionRef.current) {
            liveSessionRef.current.then((session: any) => {
                 try {
                     session.close();
                 } catch (e) {
                     console.warn("Failed to close session", e);
                 }
            });
        }
        
        if (liveInputContextRef.current && liveInputContextRef.current.state !== 'closed') {
             liveInputContextRef.current.close().catch(e => console.warn("Failed to close input context", e));
        }
        if (liveOutputContextRef.current && liveOutputContextRef.current.state !== 'closed') {
            liveOutputContextRef.current.close().catch(e => console.warn("Failed to close output context", e));
        }
        
        liveSourcesRef.current.forEach(src => {
            try {
                src.stop();
            } catch (e) {
                // Ignore if already stopped
            }
        });
        liveSourcesRef.current.clear();
        
        setIsLiveConnected(false);
        setIsLiveMode(false);
        setLiveVolume(0);
    };


     const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setSpeechError(null);
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch(e) {
                console.error("Start recording error", e);
                setIsRecording(false);
                setSpeechError('خطا در شروع ضبط.');
            }
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const currentHistory = [...messages]; // History BEFORE the new user message

        setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);
        
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const model = isDeepThought ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
            // Combine general Benvis info with specific tone instructions
            const systemInstruction = `${BENVIS_SYSTEM_PROMPT}\n\nCurrent Tone: ${toneInstructions[tone]}`;
            const config = isDeepThought ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
            
            const contentsForApi = [
                ...currentHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
                { role: 'user', parts: [{ text: currentInput }] }
            ];

            const response = await ai.models.generateContentStream({
                model,
                contents: contentsForApi,
                config: { systemInstruction, ...config },
            });

            let modelResponse = '';
            for await (const chunk of response) {
                modelResponse += chunk.text || '';
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages.length > 0) {
                        newMessages[newMessages.length - 1].text = modelResponse;
                    }
                    return newMessages;
                });
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            const errorMessage = error?.message || '';
            const displayError = errorMessage.includes("RESOURCE_EXHAUSTED")
                ? 'محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.'
                : 'متاسفانه خطایی رخ داد.';

            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                        newMessages[newMessages.length - 1].text = displayError;
                } else {
                    newMessages.push({ role: 'model', text: displayError });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayTTS = async (text: string, messageId: number) => {
        if (!text || !audioContext) return;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        setPlayingAudioId(messageId);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
                source.onended = () => setPlayingAudioId(null);
            } else {
                setPlayingAudioId(null);
            }
        } catch (error) {
            console.error('TTS Error:', error);
            setPlayingAudioId(null);
        }
    };


    return (
        <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] relative overflow-hidden">
            {/* Live Conversation Overlay */}
            {isLiveMode && (
                <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 animate-fadeIn">
                    <div className="absolute top-4 right-4">
                        <button onClick={disconnectLive} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">مکالمه زنده</h2>
                        <p className="text-violet-400 animate-pulse">{isLiveConnected ? "متصل شد. صحبت کنید..." : "در حال اتصال..."}</p>
                    </div>

                    {/* Visualizer */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className={`absolute inset-0 bg-violet-500/20 rounded-full transition-transform duration-75 ease-linear`} style={{ transform: `scale(${1 + liveVolume})` }}></div>
                         <div className={`absolute inset-4 bg-violet-500/40 rounded-full transition-transform duration-75 ease-linear`} style={{ transform: `scale(${1 + (liveVolume * 0.6)})` }}></div>
                        <div className="absolute inset-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-900/50">
                            <MicrophoneIcon className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={disconnectLive}
                        className="mt-12 px-8 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-full font-semibold hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                        <StopIcon className="w-5 h-5" />
                        پایان مکالمه
                    </button>
                </div>
            )}

            <div className="p-4 border-b border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">چت‌بات هوشمند</h3>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={connectLive} 
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full text-xs font-bold hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-900/40 transition-all transform hover:scale-105"
                         >
                             <SpeakerWaveIcon className="w-4 h-4" />
                             <span>مکالمه زنده</span>
                         </button>
                         <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button onClick={() => setVoice('Kore')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${voice === 'Kore' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>زن</button>
                            <button onClick={() => setVoice('Puck')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${voice === 'Puck' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>مرد</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">تفکر عمیق</span>
                            <button onClick={() => setIsDeepThought(!isDeepThought)} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${isDeepThought ? 'bg-violet-600 justify-end' : 'bg-slate-600 justify-start'}`}>
                                <div className="w-5 h-5 bg-white rounded-full transition-transform"></div>
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="flex gap-1 bg-slate-700/50 p-1 rounded-[var(--radius-full)]">
                    {(['friendly', 'formal', 'empathetic', 'direct'] as const).map(t => (
                        <button key={t} onClick={() => setTone(t)} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-[var(--radius-full)] transition-colors ${tone === t ? 'bg-violet-500 text-white' : 'text-slate-300'}`}>
                           { {friendly: 'دوستانه', formal: 'رسمی', empathetic: 'همدلانه', direct: 'رک'}[t] }
                        </button>
                    ))}
                 </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 bg-violet-600 rounded-full flex-shrink-0 flex items-center justify-center"><SparklesIcon className="w-5 h-5 text-white" /></div>}
                        <div className={`p-3 rounded-[var(--radius-card)] max-w-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-violet-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                            {msg.text || (isLoading && index === messages.length -1 ? '...' : '')}
                             {msg.role === 'model' && msg.text && (
                                <button onClick={() => handlePlayTTS(msg.text, index)} disabled={playingAudioId === index} className="text-slate-400 hover:text-white disabled:text-slate-600 mt-2">
                                    <SpeakerWaveIcon className="w-5 h-5" />
                                </button>
                             )}
                        </div>
                        {msg.role === 'user' && <div className="w-8 h-8 bg-slate-600 rounded-full flex-shrink-0 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white" /></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700">
                {speechError && <div className="text-red-400 text-xs mb-2 text-center animate-pulse">{speechError}</div>}
                <div className="flex items-center gap-2">
                     <button onClick={toggleRecording} className={`p-3 rounded-[var(--radius-md)] transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}>
                        {isRecording ? <StopIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder={isRecording ? "در حال شنیدن..." : "پیام خود را بنویسید یا ضبط کنید..."}
                        className="flex-grow bg-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-violet-800 p-3 rounded-[var(--radius-md)] disabled:bg-slate-500">
                        <svg className="w-6 h-6 transform -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImageAnalyzer: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResult('');
        }
    };
    
    const handleAnalyze = async () => {
        if (!imageFile || !prompt) {
            alert('لطفاً یک تصویر و یک سوال وارد کنید.');
            return;
        }
        setIsLoading(true);
        setResult('');
        try {
            const base64Image = await fileToBase64(imageFile);
            const imagePart = { inlineData: { mimeType: imageFile.type, data: base64Image } };
            const textPart = { text: prompt };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            setResult(response?.text || '');
        } catch (error: any) {
            console.error("Image analysis error:", error);
            const errorMessage = error?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                setResult('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
            } else {
                setResult('خطا در تحلیل تصویر.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg">تحلیلگر تصویر</h3>
            <div className="p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] space-y-4">
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"/>
                {imagePreview && <img src={imagePreview} alt="Preview" className="max-w-full max-h-64 rounded-[var(--radius-md)] mx-auto"/>}
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="در مورد تصویر چه میخواهید بدانید؟" rows={3} className="w-full bg-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"/>
                <button onClick={handleAnalyze} disabled={isLoading || !imageFile || !prompt} className="w-full py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold disabled:bg-slate-500 hover:bg-violet-700">
                    {isLoading ? 'در حال تحلیل...' : 'تحلیل کن'}
                </button>
                 {result && <div className="p-3 bg-slate-700 rounded-[var(--radius-md)] whitespace-pre-wrap">{result}</div>}
            </div>
        </div>
    );
};

const ImageEditor: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResultImage(null);
        }
    };

    const handleEdit = async () => {
        if (!imageFile || !prompt) {
            alert('لطفاً یک تصویر و یک دستور ویرایش وارد کنید.');
            return;
        }
        setIsLoading(true);
        setResultImage(null);
        try {
            const base64Image = await fileToBase64(imageFile);
            const imagePart = { inlineData: { mimeType: imageFile.type, data: base64Image } };
            const textPart = { text: prompt };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && 'inlineData' in firstPart) {
                const mimeType = firstPart.inlineData.mimeType;
                const base64Result = firstPart.inlineData.data;
                setResultImage(`data:${mimeType};base64,${base64Result}`);
            } else {
                 throw new Error("No image data in response");
            }
        } catch (error: any) {
            console.error("Image editing error:", error);
            const errorMessage = error?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                alert('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
            } else {
                alert('خطا در ویرایش تصویر.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg">ویرایشگر تصویر</h3>
            <div className="p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] space-y-4">
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"/>
                {imagePreview && !resultImage && <img src={imagePreview} alt="Original" className="max-w-full max-h-64 rounded-[var(--radius-md)] mx-auto"/>}
                {resultImage && <img src={resultImage} alt="Edited" className="max-w-full max-h-64 rounded-[var(--radius-md)] mx-auto"/>}
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="چه تغییری میخواهید ایجاد کنید؟ مثلا: یک فیلتر قدیمی اضافه کن" rows={3} className="w-full bg-slate-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"/>
                <button onClick={handleEdit} disabled={isLoading || !imageFile || !prompt} className="w-full py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold disabled:bg-slate-500 hover:bg-violet-700">
                    {isLoading ? 'در حال ویرایش...' : 'ویرایش کن'}
                </button>
            </div>
        </div>
    );
};

const VideoStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio && aistudio.hasSelectedApiKey) {
                const has = await aistudio.hasSelectedApiKey();
                setHasKey(has);
            }
        };
        checkKey();
    }, []);

    const handleConnect = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio && aistudio.openSelectKey) {
            try {
                await aistudio.openSelectKey();
                // Optimistic update, race condition mitigation
                setHasKey(true);
            } catch (e) {
                console.error("Failed to open key selector", e);
            }
        }
    };

    const handleSuggestPrompt = async () => {
        setIsSuggesting(true);
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Write a single, highly detailed, and cinematic prompt in Persian for an AI video generator (like Veo). The video should depict a futuristic, high-tech 'Life Operating System' interface with glowing holographic charts, a calm and productive atmosphere, and smooth camera movement. It should look professional and inspiring. Focus on visual descriptions. Keep it under 3 sentences.",
            });
            setPrompt(result.text.trim());
        } catch (e) {
            console.error("Failed to suggest prompt", e);
            alert("خطا در تولید ایده. لطفاً دوباره تلاش کنید.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        setVideoUrl(null);
        setLoadingMessage('در حال ارسال درخواست به هوش مصنوعی...');
        
        const messages = [
            'هوش مصنوعی در حال تصویرسازی است...',
            'در حال ساخت فریم‌های ویدیو...',
            'اعمال افکت‌های نهایی...',
            'تقریباً تمام شده...',
        ];
        
        let msgIndex = 0;
        const interval = setInterval(() => {
            setLoadingMessage(messages[msgIndex % messages.length]);
            msgIndex++;
        }, 3000);

        try {
             // Create fresh instance to ensure key usage
            const veAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let operation = await veAi.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                operation = await veAi.operations.getVideosOperation({ operation: operation });
            }
            
            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                if (!response.ok) throw new Error('Failed to fetch video');
                const blob = await response.blob();
                setVideoUrl(URL.createObjectURL(blob));
            } else {
                throw new Error('No video URI returned');
            }

        } catch (error: any) {
            console.error("Video generation error:", error);
             if (JSON.stringify(error).includes("Requested entity was not found")) {
                setHasKey(false);
                alert("کلید API یافت نشد. لطفاً مجدداً متصل شوید.");
                handleConnect();
            } else {
                alert("خطا در ساخت ویدیو. لطفاً دوباره تلاش کنید.");
            }
        } finally {
            clearInterval(interval);
            setIsLoading(false);
        }
    };

    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                <VideoCameraIcon className="w-16 h-16 text-slate-500" />
                <h3 className="text-xl font-bold">اتصال به استودیو ویدیو</h3>
                <p className="text-slate-400">برای استفاده از قابلیت ساخت ویدیو (Veo)، باید حساب گوگل خود را متصل کنید.</p>
                <button onClick={handleConnect} className="px-6 py-3 bg-violet-600 rounded-lg font-bold text-white hover:bg-violet-700 transition-colors">
                    اتصال حساب گوگل
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:text-violet-300 underline">
                    اطلاعات بیشتر درباره هزینه و بیلیگ
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex-shrink-0">
                 <h3 className="font-bold text-lg flex items-center gap-2"><VideoCameraIcon className="w-6 h-6 text-violet-400"/> استودیو ویدیو هوشمند</h3>
                 <p className="text-sm text-slate-400">توصیف کنید، هوش مصنوعی می‌سازد.</p>
            </div>
            
            <div className="flex-grow bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 flex flex-col gap-4 min-h-0">
                 <div className="flex-shrink-0 flex justify-end">
                    <button 
                        onClick={handleSuggestPrompt} 
                        disabled={isSuggesting || isLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-yellow-300 hover:text-yellow-200 transition-colors disabled:text-slate-500"
                    >
                        <SparklesIcon className={`w-4 h-4 ${isSuggesting ? 'animate-spin' : ''}`} />
                        {isSuggesting ? 'در حال نوشتن...' : '✨ پیشنهاد ایده برای معرفی پروژه'}
                    </button>
                 </div>
                 <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="چه ویدیویی می‌خواهید بسازید؟ (مثلا: نمایی سینمایی از یک شهر سایبرپانکی در شب بارانی)" 
                    className="w-full bg-slate-700/50 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none h-24 flex-shrink-0"
                    disabled={isLoading}
                />
                
                {isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-700 rounded-[var(--radius-md)] bg-slate-800/30">
                        <SparklesIcon className="w-12 h-12 text-violet-400 animate-pulse" />
                        <p className="text-slate-300 font-semibold animate-pulse">{loadingMessage}</p>
                    </div>
                ) : videoUrl ? (
                    <div className="flex-grow flex flex-col gap-2 min-h-0">
                        <video controls src={videoUrl} className="w-full h-full object-contain rounded-[var(--radius-md)] bg-black" />
                        <a href={videoUrl} download={`benvis-video-${Date.now()}.mp4`} className="w-full py-2 bg-green-600 text-center rounded-md font-semibold hover:bg-green-700">دانلود ویدیو</a>
                    </div>
                ) : (
                     <div className="flex-grow flex items-center justify-center border-2 border-dashed border-slate-700 rounded-[var(--radius-md)] text-slate-500">
                        <p>ویدیو شما اینجا نمایش داده می‌شود</p>
                    </div>
                )}

                <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full py-3 bg-violet-600 rounded-[var(--radius-md)] font-bold hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                    {isLoading ? 'در حال ساخت...' : 'ساخت ویدیو'}
                </button>
            </div>
        </div>
    );
};


const Journal: React.FC<{ initialText?: string }> = ({ initialText }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNote, setCurrentNote] = useState(initialText || '');
    const STORAGE_KEY = 'benvis_journal';
    const templates = [
        { title: "اهداف امروز", content: "امروز قصد دارم به این ۳ هدف برسم:\n۱. \n۲. \n۳. \n\nبرای رسیدن به آن‌ها این کارها را انجام خواهم داد:\n- " },
        { title: "آینده ایده‌آل", content: "در آینده ایده‌آل من، زندگی‌ام اینگونه است:\n\nشغل: \nروابط: \nسلامتی: \n\nاحساس من در آن آینده این است که..." },
        { title: "تخلیه ذهنی", content: "چه چیزی در ذهن من است؟\n\nنگرانی‌ها: \nایده‌ها: \nکارها: " }
    ];

    useEffect(() => {
        try {
            const storedNotes = localStorage.getItem(STORAGE_KEY);
            if (storedNotes) {
                setNotes(JSON.parse(storedNotes));
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }, []);

    const saveNote = () => {
        if (!currentNote.trim()) return;
        const newNote: Note = {
            id: new Date().toISOString(),
            content: currentNote,
            createdAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
        setCurrentNote('');
    };
    
    const deleteNote = (id: string) => {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    };

    return (
        <div className="space-y-4 p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)]">
            <h3 className="font-bold text-lg">دفترچه یادداشت</h3>
            <textarea
                value={currentNote}
                onChange={e => setCurrentNote(e.target.value)}
                placeholder="ایده‌ها و افکار خود را اینجا بنویسید..."
                rows={5}
                className="w-full bg-slate-700/60 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
             <div className="flex gap-2">
                <button onClick={saveNote} className="w-full py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold disabled:bg-slate-500 hover:bg-violet-700" disabled={!currentNote.trim()}>
                    ذخیره یادداشت
                </button>
                <div className="relative group">
                    <button className="py-3 px-4 bg-slate-700 rounded-[var(--radius-md)] font-semibold hover:bg-slate-600">
                        الگوها
                    </button>
                    <div className="absolute bottom-full mb-2 w-48 bg-slate-800 border border-slate-700 rounded-[var(--radius-md)] p-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
                        {templates.map(t => (
                            <button key={t.title} onClick={() => setCurrentNote(t.content)} className="w-full text-right p-2 text-sm rounded-md hover:bg-slate-700">{t.title}</button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {notes.map(note => (
                    <div key={note.id} className="bg-slate-800 p-3 rounded-[var(--radius-md)] flex justify-between items-start">
                        <div className="flex-grow">
                             <p className="whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                {new Date(note.createdAt).toLocaleString('fa-IR')}
                            </p>
                        </div>
                        <button onClick={() => deleteNote(note.id)} className="p-1 text-slate-500 hover:text-red-400 ml-2">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface SmartAssistantViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    initialTab?: string;
    initialJournalText?: string;
}

const SmartAssistantView: React.FC<SmartAssistantViewProps> = ({ userData, onUpdateUserData, initialTab = 'chat', initialJournalText = '' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

    useEffect(() => {
        setActiveTab(initialTab);
        setActiveAgent(null);
    }, [initialTab]);

    const tabs = [
        { id: 'chat', label: 'چت', icon: SparklesIcon },
        { id: 'video', label: 'استودیو ویدیو', icon: VideoCameraIcon },
        { id: 'agents', label: 'ابزارهای هوشمند', icon: BriefcaseIcon },
        { id: 'journal', label: 'ژورنال', icon: PencilIcon },
        { id: 'gratitude', label: 'شکرگزاری', icon: BookOpenIcon },
        { id: 'analyzer', label: 'تحلیل تصویر', icon: DocumentScannerIcon },
        { id: 'editor', label: 'ویرایش تصویر', icon: ImageEditIcon },
    ];

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setActiveAgent(null); // Reset agent when switching main tabs
    }

    const renderContent = () => {
        if (activeAgent) {
             return <AiAgentRunner agent={activeAgent} onBack={() => setActiveAgent(null)} userData={userData} onUpdateUserData={onUpdateUserData} />;
        }
        switch (activeTab) {
            case 'video': return <VideoStudio />;
            case 'agents': return <AiAgentsHub onAgentSelect={setActiveAgent} />;
            case 'journal': return <Journal initialText={initialJournalText} />;
            case 'gratitude': return <GratitudeJournal />;
            case 'analyzer': return <ImageAnalyzer />;
            case 'editor': return <ImageEditor />;
            case 'chat':
            default:
                return <ChatBot />;
        }
    };

    return (
        <div className="flex flex-col h-full pb-24">
            <div className="flex justify-center border-b border-slate-700 mb-4 overflow-x-auto">
                <div className="flex space-x-1" dir='rtl'>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-3 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id && !activeAgent
                                    ? 'border-violet-500 text-violet-400'
                                    : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <tab.icon className="w-5 h-5"/>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default SmartAssistantView;

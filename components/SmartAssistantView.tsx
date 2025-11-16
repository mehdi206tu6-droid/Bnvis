import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { 
    ChatMessage, OnboardingData, Note, FocusSession, SpeechRecognition,
    SpeechRecognitionEvent, SpeechRecognitionErrorEvent 
} from '../types';
import { 
    SparklesIcon, MicrophoneIcon, StopIcon, DocumentScannerIcon, ImageEditIcon, 
    UserIcon, SpeakerWaveIcon, BookOpenIcon, PencilIcon, TrashIcon
} from './icons';
import GratitudeJournal from './GratitudeJournal';

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


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type Tone = 'friendly' | 'formal' | 'empathetic' | 'direct';

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepThought, setIsDeepThought] = useState(false);
    const [tone, setTone] = useState<Tone>('friendly');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

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
        setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }));
    
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
                setIsRecording(false);
            };
             recognition.onend = () => {
                setIsRecording(false);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
     const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsRecording(!isRecording);
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
            const systemInstruction = toneInstructions[tone];
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
        setPlayingAudioId(messageId);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
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
        <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)]">
            <div className="p-4 border-b border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">چت‌بات هوشمند</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">تفکر عمیق</span>
                        <button onClick={() => setIsDeepThought(!isDeepThought)} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${isDeepThought ? 'bg-violet-600 justify-end' : 'bg-slate-600 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full transition-transform"></div>
                        </button>
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
                <div className="flex items-center gap-2">
                     <button onClick={toggleRecording} className={`p-3 rounded-[var(--radius-md)] transition-colors ${isRecording ? 'bg-red-500' : 'bg-slate-700'}`}>
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
            alert('لطفا یک تصویر و یک سوال وارد کنید.');
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
            alert('لطفا یک تصویر و یک دستور ویرایش وارد کنید.');
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


const MonthlyBiography: React.FC<{ userData: OnboardingData }> = ({ userData }) => {
    const [reports, setReports] = useState<{ date: string; content: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const STORAGE_KEY = 'benvis_monthly_biographies';

    useEffect(() => {
        try {
            const storedReports = localStorage.getItem(STORAGE_KEY);
            if (storedReports) {
                const parsedReports = JSON.parse(storedReports);
                setReports(parsedReports);
                setCurrentIndex(parsedReports.length - 1);
            }
        } catch (error) {
            console.error('Failed to load monthly reports:', error);
        }
    }, []);

    const generateReport = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            const { goals, habits } = userData;
            
            const habitsHistory: Record<string, number> = {};
            habits.forEach(h => habitsHistory[h.name] = 0);
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateString = d.toISOString().split('T')[0];
                const storedHabits = localStorage.getItem(`benvis_habits_${dateString}`);
                if (storedHabits) {
                    const dailyHabits = JSON.parse(storedHabits);
                    habits.forEach(habit => {
                        const isSuccess = habit.type === 'good' ? dailyHabits[habit.name] : !dailyHabits[habit.name];
                        if (isSuccess) habitsHistory[habit.name]++;
                    });
                } else {
                    habits.forEach(habit => {
                        if (habit.type === 'bad') habitsHistory[habit.name]++;
                    });
                }
            }
            const habitsHistoryString = habits.map(h => `- ${h.name} (${h.type}): ${((habitsHistory[h.name] / 30) * 100).toFixed(0)}% consistency`).join('\n');

            const completedGoals = goals.filter(g => g.progress === 100).length;
            const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0;
            const goalsHistoryString = `Completed ${completedGoals}/${goals.length} goals. Average progress: ${avgProgress.toFixed(0)}%`;

            const storedSessions = localStorage.getItem('benvis_focus_sessions');
            const allSessions: FocusSession[] = storedSessions ? JSON.parse(storedSessions) : [];
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentSessions = allSessions.filter(s => new Date(s.date) >= thirtyDaysAgo);
            const focusTotalString = `${recentSessions.length} sessions, total ${recentSessions.reduce((sum, s) => sum + s.duration, 0)} minutes in the last 30 days.`;

            const prompt = `
            You are an AI life analyst for Benvis Life OS. Create a personalized "Life Biography" monthly report based on the user's data for the last 30 days. Be insightful, use data-driven insights, and predict future trends. The output MUST be in Persian.

            User data for the last 30 days:
            - Goals History: ${goalsHistoryString}
            - Habits History: ${habitsHistoryString}
            - Focus Sessions: ${focusTotalString}
            
            Structure the report with the following sections using Markdown:
            1.  **داستان این ماه شما**: A narrative story of the month (e.g., "This month was a chapter of growth in your life story...").
            2.  **تحلیل داده‌های شما**: 3-5 key metrics with explanations (use simple stats like averages, trends).
            3.  **چالش‌ها و یادگیری‌ها**: An honest but positive review of setbacks.
            4.  **پیش‌بینی آینده**: Predict the next 30 days (e.g., "If habits continue, you'll reach 80% on health goal").
            5.  **برنامه اقدام شما**: A customized 1-week action plan with 3-5 concrete steps.
            
            Keep the report under 400 words. Use an empathetic, storytelling tone.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            
            const newReport = { date: new Date().toISOString(), content: response?.text || '' };
            const updatedReports = [...reports, newReport];
            setReports(updatedReports);
            setCurrentIndex(updatedReports.length - 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));

        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                setError('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
            } else {
                setError('خطا در تولید گزارش ماهانه.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
     const currentReport = reports[currentIndex];

     return (
        <div className="space-y-4 p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)]">
            <h3 className="font-bold text-lg">زندگی‌نامه ماهانه شما</h3>
            <p className="text-sm text-slate-400">تحلیل عمیق از عملکرد یک ماه گذشته شما و پیش‌بینی آینده.</p>
            <button onClick={generateReport} disabled={isLoading} className="w-full py-3 bg-violet-800 rounded-[var(--radius-md)] font-semibold disabled:bg-slate-500 hover:bg-violet-700">
                {isLoading ? 'در حال تولید گزارش...' : 'تولید گزارش جدید'}
            </button>
            {error && <p className="text-red-400">{error}</p>}
            {currentReport && (
                 <div className="whitespace-pre-wrap leading-relaxed text-right prose prose-invert prose-p:text-slate-300 prose-headings:text-white prose-headings:font-bold prose-headings:text-violet-300" dir="rtl">
                    {currentReport.content.split('\n').map((line, i) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                            return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{trimmedLine.replace(/\*\*/g, '').trim()}</h3>
                        }
                        if (trimmedLine.startsWith('* ')) {
                            return <p key={i} className="mb-2 pl-4 relative before:content-['•'] before:absolute before:right-full before:mr-2 before:text-violet-400">{trimmedLine.substring(2)}</p>;
                        }
                        if (/^\d+\.\s/.test(trimmedLine)) {
                             return <p key={i} className="mb-2 pl-4">{trimmedLine}</p>;
                        }
                        return <p key={i} className="mb-2">{line}</p>;
                    })}
                </div>
            )}
            {reports.length > 0 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} className="px-4 py-2 bg-slate-700 rounded-md font-semibold disabled:opacity-50">قبلی</button>
                    <span className="text-sm text-slate-400">گزارش {currentIndex + 1} از {reports.length}</span>
                    <button onClick={() => setCurrentIndex(i => Math.min(reports.length - 1, i + 1))} disabled={currentIndex === reports.length - 1} className="px-4 py-2 bg-slate-700 rounded-md font-semibold disabled:opacity-50">بعدی</button>
                </div>
            )}
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
    initialTab?: string;
    initialJournalText?: string;
}

const SmartAssistantView: React.FC<SmartAssistantViewProps> = ({ userData, initialTab = 'chat', initialJournalText = '' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const tabs = [
        { id: 'chat', label: 'چت', icon: SparklesIcon },
        { id: 'journal', label: 'ژورنال', icon: PencilIcon },
        { id: 'gratitude', label: 'شکرگزاری', icon: BookOpenIcon },
        { id: 'biography', label: 'زندگی‌نامه', icon: BookOpenIcon },
        { id: 'analyzer', label: 'تحلیل تصویر', icon: DocumentScannerIcon },
        { id: 'editor', label: 'ویرایش تصویر', icon: ImageEditIcon },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'journal': return <Journal initialText={initialJournalText} />;
            case 'gratitude': return <GratitudeJournal />;
            case 'analyzer': return <ImageAnalyzer />;
            case 'editor': return <ImageEditor />;
            case 'biography': return <MonthlyBiography userData={userData} />;
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
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id
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

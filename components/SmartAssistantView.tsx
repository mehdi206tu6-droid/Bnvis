
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Blob } from "@google/genai";
import { 
    ChatMessage, OnboardingData, Note, GratitudeEntry, SpeechRecognition,
    SpeechRecognitionEvent, SpeechRecognitionErrorEvent, Agent 
} from '../types';
import { 
    SparklesIcon, MicrophoneIcon, StopIcon, DocumentScannerIcon, ImageEditIcon, 
    UserIcon, SpeakerWaveIcon, BookOpenIcon, PencilIcon, TrashIcon, BriefcaseIcon,
    VideoCameraIcon, ArrowUpIcon
} from './icons';
import GratitudeJournal from './GratitudeJournal';
import AiAgentsHub from './AiAgentsHub';
import AiAgentRunner from './AiAgentRunner';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BENVIS_SYSTEM_PROMPT = `
You are Benvis, an advanced AI Life Operating System Assistant.
Your goal is to help the user organize their life, achieve goals, build habits, and maintain wellness.
Tone: Professional yet friendly, encouraging, and insightful.
Language: You are fluent in Persian (Farsi). Always reply in Persian unless asked otherwise.
`;

type Tone = 'friendly' | 'formal' | 'empathetic' | 'direct';

interface SmartAssistantViewProps {
  userData: OnboardingData;
  onUpdateUserData: (data: OnboardingData) => void;
  initialTab?: string;
  initialJournalText?: string;
}

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'سلام! من بنویس هستم. چطور می‌تونم امروز کمکت کنم؟' }
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
        <div className="flex flex-col h-full relative">
            <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-24">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`max-w-[85%] p-4 rounded-2xl backdrop-blur-md text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-violet-600/80 text-white rounded-br-none' 
                                    : 'bg-slate-800/60 text-slate-200 rounded-bl-none border border-white/5'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="bg-slate-800/60 p-4 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef}></div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
                <div className="glass-panel p-1.5 flex items-center rounded-2xl bg-slate-900/80">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-grow bg-transparent text-white px-4 py-3 outline-none placeholder-slate-500"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-colors disabled:bg-slate-700 disabled:text-slate-500"
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
            <div className="h-full overflow-y-auto pb-20">
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
        <div className="h-full overflow-y-auto pb-20 px-4">
             <AiAgentsHub onAgentSelect={setSelectedAgent} />
        </div>
    );
};

const SmartAssistantView: React.FC<SmartAssistantViewProps> = ({ userData, onUpdateUserData, initialTab, initialJournalText }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'chat');
    
    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-fadeIn">
            <div className="flex gap-2 mb-4 p-1.5 overflow-x-auto flex-shrink-0 no-scrollbar">
                {[
                    { id: 'chat', label: 'چت هوشمند', icon: SparklesIcon },
                    { id: 'agents', label: 'ابزارها', icon: BriefcaseIcon },
                    { id: 'gratitude', label: 'شکرگزاری', icon: BookOpenIcon },
                    // { id: 'image-analyze', label: 'تحلیل تصویر', icon: DocumentScannerIcon }, // Placeholder for future
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`glass-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20' : 'text-slate-400'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <div className="flex-grow overflow-hidden relative rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-sm">
                 {activeTab === 'gratitude' && <GratitudeJournal />}
                 {activeTab === 'agents' && <AgentSelector userData={userData} onUpdateUserData={onUpdateUserData} />}
                 {activeTab === 'chat' && <ChatBot />}
            </div>
        </div>
    );
};

export default SmartAssistantView;

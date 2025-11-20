
import React, { useState, useEffect, useRef } from 'react';
import { OnboardingData, Book, ChatMessage, BookMethod, ApplicationIdea, BookUIHint } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    BookOpenIcon, PlusIcon, TrashIcon, SparklesIcon, 
    ArrowLeftIcon, ChatBubbleOvalLeftEllipsisIcon,
    XMarkIcon, LightBulbIcon, 
    DocumentTextIcon, ArrowUpIcon,
    BoltIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BooksViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

// --- SEED DATA: Spiritual & High Quality ---
const PREDEFINED_BOOKS_DATA: Record<string, Partial<Book>> = {
    "Atomic Habits": {
        title: "Atomic Habits",
        author: "James Clear",
        summary: "«عادت‌های اتمی» انجیلی برای تغییرات کوچک است. جیمز کلیر در این کتاب اثبات می‌کند که چگونه بهبودهای ۱ درصدی روزانه، در درازمدت نتایج خیره‌کننده‌ای می‌سازند. او با ترکیب روانشناسی و بیولوژی، مدلی چهار مرحله‌ای (نشانه، اشتیاق، پاسخ، پاداش) برای ساختن عادت‌های خوب و شکستن عادت‌های بد ارائه می‌دهد.",
        uiHint: { themeColor: "#fbbf24", coverStyle: "modern", icon: "⚛️" },
        methods: [
            { id: "m1", name: "Habit Stacking (انباشت عادت)", summary: "فرمول مقدس: «پس از [عادت فعلی]، من [عادت جدید] را انجام می‌دهم.»", steps: ["عادت فعلی و محکم خود را شناسایی کن (مثل مسواک زدن).", "عادت جدیدی که می‌خواهی بسازی را انتخاب کن (مثل یک دقیقه شکرگزاری).", "این دو را با نیت قلبی به هم گره بزن."], sourceChapter: "Chapter 5" },
            { id: "m2", name: "Environment Design (معماری محیط)", summary: "اگر می‌خواهی عادتی را ترک کنی، نشانه‌های آن را نامرئی کن. اگر می‌خواهی عادتی بسازی، نشانه‌هایش را آشکار کن.", steps: ["محرک‌های منفی را از جلوی چشم بردار (گوشی را در کشو بگذار).", "محرک‌های مثبت را در مسیر قرار بده (کتاب را روی بالشت بگذار)."], sourceChapter: "Chapter 6" }
        ],
        applicationIdeas: [
            { feature: "Habit Builder", description: "استفاده از فرمول انباشت عادت هنگام تعریف عادت جدید در بنویس.", methodRefs: ["m1"] }
        ]
    },
    "Deep Work": {
        title: "Deep Work",
        author: "Cal Newport",
        summary: "در دنیایی که حواس‌پرتی سکه رایج است، «کار عمیق» قدرتی ماورایی محسوب می‌شود. کال نیوپورت استدلال می‌کند که تمرکز بدون وقفه، کلید خلق ارزش واقعی و معنا در زندگی حرفه‌ای است. این کتاب دعوتی است به خلوت گزیدن در میان هیاهو.",
        uiHint: { themeColor: "#f97316", coverStyle: "classic", icon: "🧠" },
        methods: [
            { id: "m1", name: "Monastic Mode (حالت رهبانی)", summary: "حذف کامل عوامل حواس‌پرتی برای دوره‌های طولانی، مانند یک راهب.", steps: ["بازه زمانی طولانی (مثلاً ۴ ساعت) را مشخص کن.", "تمام ارتباطات را قطع کن.", "تنها با کار خود خلوت کن."], sourceChapter: "Rule 1" },
            { id: "m2", name: "Ritualize (آیین‌سازی)", summary: "برای ورود به حالت تمرکز، آیینی بساز تا ذهنت شرطی شود.", steps: ["مکان مشخصی را مقدس بشمار.", "نوشیدنی یا موسیقی خاصی را آماده کن.", "با یک نیت مشخص شروع کن."], sourceChapter: "Rule 1" }
        ],
        applicationIdeas: [
            { feature: "QuietZone", description: "فعال‌سازی حالت «رهبانی» در تایمر تمرکز.", methodRefs: ["m1"] }
        ]
    },
    "The Prophet": {
        title: "The Prophet",
        author: "Kahlil Gibran",
        summary: "«پیامبر» مجموعه‌ای از جستارهای شاعرانه درباره عشق، کار، آزادی و مرگ است. المصطفی، پیامبری که پس از سال‌ها تبعید قصد بازگشت به خانه دارد، پیش از رفتن، خرد خود را با مردم شهر اورفالس در میان می‌گذارد. هر کلمه این کتاب چون گوهری از نور است.",
        uiHint: { themeColor: "#8b5cf6", coverStyle: "mystic", icon: "🕊️" },
        methods: [
             { id: "m1", name: "Work is Love Made Visible", summary: "کار را نه به عنوان وظیفه، بلکه به عنوان تجلی عشق ببین.", steps: ["قبل از شروع کار، نیت کن که با عشق آن را انجام دهی.", "تصور کن که محصول کارت برای محبوب‌ترین فرد زندگی‌ات است."], sourceChapter: "On Work" }
        ],
        applicationIdeas: [
            { feature: "Daily Intent", description: "تنظیم نیت روزانه بر اساس آموزه‌های کتاب.", methodRefs: ["m1"] }
        ]
    },
    "Meditations": {
        title: "Meditations",
        author: "Marcus Aurelius",
        summary: "یادداشت‌های شخصی قدرتمندترین امپراتور روم، نه برای انتشار، بلکه برای خودسازی. مارکوس اورلیوس در این کتاب، اصول رواقی‌گری را تمرین می‌کند: پذیرش آنچه در کنترل ما نیست، و فضیلت‌مندی در آنچه هست.",
        uiHint: { themeColor: "#713f12", coverStyle: "classic", icon: "🏛️" },
        methods: [
             { id: "m1", name: "The View from Above", summary: "به مشکلاتت از دیدگاهی کیهانی نگاه کن تا کوچک و گذرا بودنشان را دریابی.", steps: ["چشمانت را ببند.", "خودت را از بالا تصور کن.", "شهر، کشور، و سپس کل زمین را ببین.", "مشکلاتت در این تصویر چقدر کوچک‌اند؟"], sourceChapter: "Book 9" }
        ],
        applicationIdeas: [
             { feature: "Morning Reflection", description: "تمرین «دیدگاه از بالا» قبل از شروع روز.", methodRefs: ["m1"] }
        ]
    }
};

const PRESET_LIBRARY_KEYS = Object.keys(PREDEFINED_BOOKS_DATA);

// --- Mystic Components ---

const MysticBookCover: React.FC<{ title: string; author: string; hint?: BookUIHint }> = ({ title, author, hint }) => {
    const baseColor = hint?.themeColor || '#4338ca';
    
    return (
        <div 
            className="w-full h-full relative flex flex-col p-4 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
            style={{ 
                background: `linear-gradient(135deg, ${baseColor} 0%, #0f172a 100%)`,
                boxShadow: `inset 2px 0 5px rgba(255,255,255,0.1), inset -2px 0 5px rgba(0,0,0,0.3)`
            }}
        >
            {/* Texture */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] mix-blend-overlay pointer-events-none"></div>
            
            {/* Gold Border */}
            <div className="absolute inset-3 border border-[#fbbf24]/40 rounded-sm pointer-events-none"></div>
            <div className="absolute inset-[14px] border border-[#fbbf24]/20 rounded-sm pointer-events-none"></div>

            {/* Title Area */}
            <div className="mt-6 text-center relative z-10">
                <h3 className="font-serif font-bold text-[#fef3c7] text-sm leading-relaxed drop-shadow-md tracking-wider line-clamp-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {title}
                </h3>
            </div>

            {/* Central Icon/Symbol */}
            <div className="flex-grow flex items-center justify-center relative">
                 <div className="text-4xl opacity-90 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] transform hover:scale-110 transition-transform duration-700">
                    {hint?.icon || '📖'}
                 </div>
                 {/* Glow behind icon */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#fbbf24]/10 to-transparent blur-xl rounded-full"></div>
            </div>

            {/* Author */}
            <div className="text-center mb-4 relative z-10">
                <p className="text-[10px] text-[#fbbf24]/80 font-serif italic tracking-widest">{author}</p>
            </div>
        </div>
    );
};

const Book3D: React.FC<{ book: Book; onClick: () => void }> = ({ book, onClick }) => {
    return (
        <div className="group relative w-36 h-52 cursor-pointer [perspective:1000px] mx-auto transition-all duration-500 hover:-translate-y-4" onClick={onClick}>
            <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] origin-left group-hover:[transform:rotateY(-25deg)]">
                
                {/* Front Cover */}
                <div className="absolute inset-0 rounded-r-sm rounded-l-sm shadow-2xl [backface-visibility:hidden] z-20">
                    <MysticBookCover title={book.title} author={book.author} hint={book.uiHint} />
                    {/* Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-sm"></div>
                </div>
                
                {/* Spine (Simulated attached to left edge of cover) */}
                 <div 
                    className="absolute top-0 bottom-0 right-full w-8 origin-right [transform:rotateY(-90deg)] flex items-center justify-center border-r border-white/5"
                    style={{ backgroundColor: book.uiHint?.themeColor ? `${book.uiHint.themeColor}DD` : '#1e1b4b' }}
                >
                     <div className="absolute inset-0 bg-black/30"></div>
                     {/* Gold ribs on spine */}
                     <div className="absolute top-4 w-full h-[2px] bg-[#fbbf24]/40 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"></div>
                     <div className="absolute bottom-4 w-full h-[2px] bg-[#fbbf24]/40 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"></div>
                     <div className="absolute top-1/2 w-full h-[2px] bg-[#fbbf24]/40 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"></div>
                </div>

                {/* Pages (Right Edge Simulation) */}
                <div className="absolute top-1 bottom-1 left-1 w-[calc(100%-4px)] bg-[#f5f5dc] [transform:translateZ(-4px)] rounded-sm shadow-inner flex flex-col justify-between py-1 border border-gray-300">
                     {/* Just a block to simulate thickness behind the cover */}
                </div>
            </div>
            
            {/* Magical Aura/Shadow */}
            <div className="absolute -bottom-6 left-2 right-2 h-4 bg-black/60 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"></div>
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none mix-blend-screen"
                style={{ backgroundColor: book.uiHint?.themeColor }}
            ></div>
        </div>
    );
};


// --- Sanctuary (Reader) ---

const SanctuaryReader: React.FC<{ 
    book: Book; 
    onClose: () => void; 
    onUpdate: (b: Book) => void; 
    addXp: (a: number) => void 
}> = ({ book, onClose, onUpdate, addXp }) => {
    const [activeTab, setActiveTab] = useState<'sacred_text' | 'rites' | 'commune'>('sacred_text');
    const [messages, setMessages] = useState<ChatMessage[]>(book.chatHistory || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const userMsg: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const prompt = `
                IDENTITY: You are the eternal spirit of the book "${book.title}". 
                TONE: Wise, ancient, mystical, yet practical. Speak like a master guiding a disciple.
                CONTEXT: The user seeks wisdom from your pages.
                LANGUAGE: Persian (Farsi), eloquent and profound.
                TASK: Answer the user's question: "${userMsg.text}" based ONLY on the book's philosophy.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);
            
            // Update book history
            onUpdate({ ...book, chatHistory: [...messages, userMsg, { role: 'model', text: response.text }] });

        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: 'ارتباط با عالم معنا قطع شد. لطفا دوباره تلاش کنید.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#0a0a0c] text-[#e5e5e5] flex flex-col font-[Vazirmatn] animate-fadeIn overflow-hidden">
            
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-[#0a0a0c] to-[#0a0a0c] pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-50"></div>

            {/* Top Navigation */}
            <div className="relative z-10 h-20 flex items-center justify-between px-6 md:px-12">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 text-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition-all">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                    <div>
                        <h2 className="font-serif font-bold text-xl text-amber-100/90 tracking-wide">{book.title}</h2>
                        <p className="text-xs text-amber-500/60 font-mono uppercase tracking-widest">{book.author}</p>
                    </div>
                </div>
                
                {/* Mystic Tabs */}
                <div className="flex bg-[#151518] border border-white/5 p-1 rounded-full shadow-inner">
                    {[
                        { id: 'sacred_text', label: 'متن مقدس', icon: DocumentTextIcon },
                        { id: 'rites', label: 'آیین‌های عمل', icon: BoltIcon },
                        { id: 'commune', label: 'گفتگو با روح', icon: ChatBubbleOvalLeftEllipsisIcon }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-500 ${activeTab === tab.id ? 'bg-amber-900/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <tab.icon className="w-4 h-4"/>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Scroll */}
            <div className="relative z-10 flex-grow overflow-hidden flex justify-center">
                <div className="w-full max-w-4xl h-full overflow-y-auto custom-scrollbar px-6 pb-20 pt-4">
                    
                    {/* 1. SACRED TEXT (Summary) */}
                    {activeTab === 'sacred_text' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="text-center mb-12">
                                <div className="inline-block p-4 border border-amber-500/20 rounded-full mb-4 bg-amber-500/5">
                                    <span className="text-4xl">{book.uiHint?.icon || '📜'}</span>
                                </div>
                                <h3 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600 mb-4">جوهره کلام</h3>
                            </div>
                            
                            <div className="prose prose-invert prose-lg mx-auto font-serif text-justify leading-loose text-amber-50/80 border-l-2 border-amber-500/10 pl-6 py-2">
                                {book.summary ? (
                                    <p className="whitespace-pre-wrap">{book.summary}</p>
                                ) : (
                                    <p className="text-center text-slate-500 italic">متن هنوز بر لوح ثبت نشده است.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. RITES (Methods) */}
                    {activeTab === 'rites' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-serif font-bold text-amber-200 mb-2">آیین‌های عمل</h3>
                                <p className="text-sm text-amber-500/60">دانش بدون عمل، بار سنگینی است.</p>
                            </div>

                            <div className="grid gap-6">
                                {book.methods?.map((method, i) => (
                                    <div key={i} className="relative group bg-[#1a1a1d] border border-white/5 rounded-xl p-6 overflow-hidden hover:border-amber-500/30 transition-colors duration-500">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-600 to-transparent opacity-60"></div>
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-xl font-bold text-amber-50">{method.name}</h4>
                                            <span className="text-[10px] font-mono text-amber-500/50 border border-amber-500/10 px-2 py-1 rounded">{method.sourceChapter}</span>
                                        </div>
                                        
                                        <p className="text-slate-400 mb-6 leading-relaxed text-sm italic border-b border-white/5 pb-4">"{method.summary}"</p>
                                        
                                        <div className="space-y-4">
                                            {method.steps?.map((step, idx) => (
                                                <div key={idx} className="flex items-start gap-4">
                                                    <div className="w-6 h-6 rounded-full bg-amber-900/30 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0 mt-0.5 font-mono">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-sm text-slate-300">{step}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <button className="mt-6 w-full py-3 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-500/20 text-amber-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                            <PlusIcon className="w-4 h-4"/>
                                            افزودن به زندگی من
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {book.applicationIdeas?.length ? (
                                <div className="mt-12 pt-8 border-t border-white/5">
                                    <h4 className="text-lg font-bold text-slate-400 mb-4 text-center">پیشنهادات سیستم برای ادغام</h4>
                                    <div className="grid gap-4">
                                        {book.applicationIdeas?.map((idea, i) => (
                                            <div key={i} className="bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border border-white/5">
                                                <div className="p-2 bg-blue-900/20 rounded-md text-blue-400">
                                                    <LightBulbIcon className="w-5 h-5"/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 text-sm">{idea.feature}</p>
                                                    <p className="text-xs text-slate-500">{idea.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* 3. COMMUNE (Chat) */}
                    {activeTab === 'commune' && (
                        <div className="h-full flex flex-col max-w-2xl mx-auto animate-fadeIn">
                             <div className="flex-grow space-y-6 pb-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <SparklesIcon className="w-12 h-12 mx-auto text-amber-500 mb-4"/>
                                        <p className="text-amber-100/60 font-serif text-lg">من روحِ این کتاب هستم.</p>
                                        <p className="text-sm text-slate-500 mt-2">از من بپرس تا جوهره حقیقت را بر تو آشکار کنم.</p>
                                    </div>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div 
                                            className={`max-w-[85%] p-5 rounded-2xl text-sm leading-loose font-serif shadow-lg relative ${
                                                msg.role === 'user' 
                                                ? 'bg-[#2a2a2e] text-amber-50 rounded-br-sm border border-white/5' 
                                                : 'bg-[#151518] text-amber-100/80 rounded-bl-sm border border-amber-900/20'
                                            }`}
                                        >
                                            {msg.text}
                                            {/* Decorative Corner */}
                                            <div className={`absolute bottom-0 w-2 h-2 ${msg.role === 'user' ? 'right-0 bg-[#2a2a2e]' : 'left-0 bg-[#151518]'}`}></div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#151518] p-4 rounded-2xl rounded-bl-sm border border-amber-900/20 flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                             </div>

                             {/* Input Area */}
                             <div className="mt-auto sticky bottom-0 py-4 bg-[#0a0a0c]">
                                 <div className="relative">
                                     <input 
                                        type="text" 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="سوالی از خرد کتاب بپرسید..."
                                        className="w-full bg-[#1a1a1d] text-amber-50 placeholder-slate-600 border border-white/10 rounded-full py-4 px-6 pr-12 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none shadow-xl"
                                     />
                                     <button 
                                        onClick={handleSendMessage} 
                                        disabled={isLoading || !input.trim()}
                                        className="absolute left-2 top-2 p-2 bg-amber-700/20 hover:bg-amber-600/40 text-amber-500 rounded-full transition-colors disabled:opacity-0"
                                     >
                                         <ArrowUpIcon className="w-5 h-5"/>
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};


// --- Main View ---

const BooksView: React.FC<BooksViewProps> = ({ userData, onUpdateUserData, onClose, addXp }) => {
    const [books, setBooks] = useState<Book[]>(userData.books || []);
    const [activeBook, setActiveBook] = useState<Book | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [magicInput, setMagicInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleMagicAdd = async (input: string, isPreset: boolean = false) => {
        if (isPreset && PREDEFINED_BOOKS_DATA[input]) {
            const preset = PREDEFINED_BOOKS_DATA[input];
            const newBook: Book = {
                id: `book-${Date.now()}`,
                title: preset.title!,
                author: preset.author!,
                totalChapters: 10,
                currentChapter: 1,
                summary: preset.summary!,
                uiHint: preset.uiHint,
                methods: preset.methods,
                applicationIdeas: preset.applicationIdeas,
                status: 'reading',
                aiPersona: `You are the book ${preset.title}.`,
                coverColor: preset.uiHint?.themeColor || '#555'
            };
            const updatedBooks = [newBook, ...books];
            setBooks(updatedBooks);
            onUpdateUserData({ ...userData, books: updatedBooks });
            setIsAdding(false);
            return;
        }

        setIsGenerating(true);
        try {
            const systemPrompt = `
SYSTEM: You are an Ancient Librarian Agent. Convert the user's book request into a 'Book of Wisdom' JSON structure for Benvis Life OS.
Output JSON only.
Language: Persian.
Required Fields: title, author, summary (rich, mystical description), uiHint (themeColor, icon), methods (actionable rituals), applicationIdeas.
INPUT: "${input}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
                config: { responseMimeType: 'application/json' }
            });
            
            const data = JSON.parse(response.text);
            const newBook: Book = {
                id: `book-gen-${Date.now()}`,
                title: data.title,
                author: data.author,
                totalChapters: 10,
                currentChapter: 1,
                summary: data.summary,
                uiHint: data.uiHint,
                methods: data.methods,
                applicationIdeas: data.applicationIdeas,
                status: 'reading',
                aiPersona: `You are the book ${data.title}.`,
                coverColor: data.uiHint?.themeColor || '#6366f1'
            };
            
            const updatedBooks = [newBook, ...books];
            setBooks(updatedBooks);
            onUpdateUserData({ ...userData, books: updatedBooks });
            setMagicInput('');
            setIsAdding(false);

        } catch (e) {
            alert("طلسم ساخت کتاب با شکست مواجه شد. دوباره تلاش کنید.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteBook = (id: string) => {
        if (window.confirm("آیا می‌خواهید این منبع خرد را از کتابخانه حذف کنید؟")) {
            const updated = books.filter(b => b.id !== id);
            setBooks(updated);
            onUpdateUserData({ ...userData, books: updated });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#030304] flex flex-col font-[Vazirmatn] animate-fadeIn overflow-hidden">
             {activeBook && (
                <SanctuaryReader 
                    book={activeBook} 
                    onClose={() => setActiveBook(null)} 
                    onUpdate={(b) => {
                        const updated = books.map(bk => bk.id === b.id ? b : bk);
                        setBooks(updated);
                        onUpdateUserData({...userData, books: updated});
                        setActiveBook(b);
                    }} 
                    addXp={addXp} 
                />
            )}

            {/* Temple Atmosphere */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none mix-blend-soft-light"></div>
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none"></div>
            
            {/* Dust Particles (CSS Animation) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-1 h-1 bg-amber-200/20 rounded-full animate-float"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 10 + 10}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Header */}
            <div className="relative z-10 p-8 flex justify-between items-end border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                         <SparklesIcon className="w-6 h-6 text-amber-500 animate-pulse"/>
                         <span className="text-xs text-amber-500 font-mono uppercase tracking-[0.3em]">Library of Souls</span>
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-amber-50 tracking-wide drop-shadow-lg">معبد خرد</h2>
                </div>
                <div className="flex gap-4">
                     <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-[#1a1a1d] hover:bg-[#252529] text-amber-100 border border-amber-500/30 rounded-full font-bold transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <span className="group-hover:text-amber-400 transition-colors"><PlusIcon className="w-5 h-5"/></span>
                        <span className="hidden sm:inline">احضار کتاب جدید</span>
                    </button>
                    <button onClick={onClose} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            {/* Add Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                    <div className="bg-[#0f0f11] border border-amber-900/50 p-8 rounded-3xl max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                        
                        <h3 className="text-2xl font-serif font-bold text-amber-100 mb-8 text-center">انتخاب منبع خرد</h3>
                        
                        {/* Presets Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            {PRESET_LIBRARY_KEYS.map(key => {
                                const book = PREDEFINED_BOOKS_DATA[key];
                                return (
                                    <button 
                                        key={key} 
                                        onClick={() => handleMagicAdd(key, true)}
                                        className="p-4 bg-[#1a1a1d] border border-white/5 hover:border-amber-500/40 rounded-xl text-left group transition-all hover:-translate-y-1"
                                    >
                                        <div className="text-3xl mb-3 filter drop-shadow-md group-hover:scale-110 transition-transform">{book.uiHint?.icon}</div>
                                        <span className="block text-sm font-bold text-slate-300 group-hover:text-amber-200 truncate">{book.title}</span>
                                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider">{book.author}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Custom AI Input */}
                        <div className="relative">
                            <input 
                                type="text" 
                                value={magicInput} 
                                onChange={e => setMagicInput(e.target.value)} 
                                placeholder="نام هر کتاب دیگری که می‌خواهید..."
                                className="w-full bg-[#151518] border border-white/10 rounded-xl px-5 py-4 text-amber-50 placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                            />
                            <button 
                                onClick={() => handleMagicAdd(magicInput, false)} 
                                disabled={!magicInput.trim() || isGenerating}
                                className="absolute left-2 top-2 bottom-2 px-6 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {isGenerating ? <SparklesIcon className="w-4 h-4 animate-spin"/> : <BoltIcon className="w-4 h-4"/>}
                                <span>احضار</span>
                            </button>
                        </div>
                        
                        <button onClick={() => setIsAdding(false)} className="absolute top-4 left-4 text-slate-600 hover:text-slate-400">
                            <XMarkIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            )}

            {/* Bookshelf Grid */}
            <div className="flex-grow overflow-y-auto px-6 pb-32 pt-12 custom-scrollbar relative z-0">
                {books.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600/50 space-y-6">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                            <BookOpenIcon className="w-10 h-10"/>
                        </div>
                        <p className="text-xl font-serif">معبد خالی است.</p>
                        <button onClick={() => setIsAdding(true)} className="text-amber-700 hover:text-amber-500 underline underline-offset-8 decoration-1">
                            اولین کتاب را احضار کنید
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-20 gap-x-8 items-end justify-items-center perspective-[1000px]">
                        {books.map((book, i) => (
                            <div key={book.id} className="relative group w-full flex flex-col items-center" style={{ animationDelay: `${i * 100}ms` }}>
                                <Book3D book={book} onClick={() => setActiveBook(book)} />
                                
                                {/* Shelf Plank Visual (The Altar) */}
                                <div className="absolute -bottom-5 w-[140%] h-6 bg-[#2d1b14] rounded-sm shadow-[0_20px_40px_rgba(0,0,0,0.8)] transform perspective-[500px] rotateX(25deg) border-t border-white/5">
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent"></div>
                                    {/* Wood grain detail */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}
                                    className="absolute -top-8 right-0 p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BooksView;


import React, { useState, useEffect, useRef } from 'react';
import { OnboardingData, Book, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
    BookOpenIcon, PlusIcon, TrashIcon, SparklesIcon, 
    ArrowLeftIcon, ChatBubbleOvalLeftEllipsisIcon,
    XMarkIcon, UserIcon, LightBulbIcon, 
    DocumentTextIcon, MicrophoneIcon, ArrowUpIcon
} from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BooksViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

// --- Helpers ---

const getContrastColor = (hexcolor: string) => {
    if (!hexcolor) return '#ffffff';
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
};

// --- 3D Book Component ---

const Book3D: React.FC<{ book: Book; onClick: () => void }> = ({ book, onClick }) => {
    const textColor = getContrastColor(book.coverColor);
    
    return (
        <div className="group relative w-32 h-48 sm:w-40 sm:h-60 perspective-[1200px] cursor-pointer z-10" onClick={onClick}>
            <div className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(-25deg)_translateX(-5px)_scale(1.05)]">
                
                {/* Front Cover */}
                <div 
                    className="absolute inset-0 rounded-r-md rounded-l-sm shadow-2xl flex flex-col [backface-visibility:hidden] border-l border-white/10 overflow-hidden"
                    style={{ backgroundColor: book.coverColor, color: textColor }}
                >
                    {/* Cover Image or Fallback Design */}
                    {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="p-4 flex flex-col h-full relative">
                             <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20 pointer-events-none"></div>
                             <div className="absolute left-[2px] top-0 bottom-0 w-[2px] bg-black/20 blur-[1px]"></div>
                             <h3 className="relative font-serif font-bold text-lg leading-tight line-clamp-4 drop-shadow-sm mt-2 text-center">{book.title}</h3>
                             <p className="relative text-[10px] font-semibold opacity-80 mt-2 uppercase tracking-wider text-center">{book.author}</p>
                             <div className="mt-auto mx-auto">
                                 <SparklesIcon className="w-8 h-8 opacity-50"/>
                             </div>
                        </div>
                    )}

                    {/* Lighting Glare */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Spine (Left Side) */}
                <div 
                    className="absolute top-0 bottom-0 left-0 w-10 [transform-origin:left] [transform:rotateY(90deg)] flex flex-col items-center justify-center overflow-hidden border-r border-black/20"
                    style={{ backgroundColor: book.coverColor }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <span className="text-[9px] font-bold text-white whitespace-nowrap [writing-mode:vertical-rl] rotate-180 opacity-90 tracking-widest line-clamp-1 py-2">
                        {book.title}
                    </span>
                </div>

                {/* Pages (Right Side) */}
                <div className="absolute top-1 bottom-1 right-0 w-8 bg-[#fdfbf7] [transform:rotateY(90deg)_translateZ(-4px)] rounded-sm border-l border-r border-gray-300 shadow-inner flex flex-col justify-between py-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-full h-[1px] bg-gray-300/50"></div>
                    ))}
                </div>
                
                {/* Pages (Top) */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-[#fdfbf7] [transform-origin:top] [transform:rotateX(-90deg)] rounded-sm border border-gray-300"></div>
            </div>
            
            {/* Shelf Shadow */}
            <div className="absolute -bottom-4 left-2 right-2 h-4 bg-black/50 blur-md rounded-full opacity-70 group-hover:opacity-40 transition-opacity duration-500"></div>
        </div>
    );
};

// --- Immersive Reader & AI Hub ---

const ImmersiveReader: React.FC<{ 
    book: Book; 
    onClose: () => void; 
    onUpdate: (b: Book) => void; 
    addXp: (a: number) => void 
}> = ({ book, onClose, onUpdate, addXp }) => {
    const [activeTab, setActiveTab] = useState<'read' | 'chat' | 'analysis'>('read');
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(book.chatHistory || []);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pageContent, setPageContent] = useState(book.contentSource || '');
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [analysisData, setAnalysisData] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-save chat history
    useEffect(() => {
        const timeout = setTimeout(() => {
            onUpdate({ ...book, chatHistory: messages });
        }, 1000);
        return () => clearTimeout(timeout);
    }, [messages]);

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("مرورگر شما پشتیبانی نمی‌کند.");
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'fa-IR';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => setChatInput(prev => prev + ' ' + e.results[0][0].transcript);
        recognition.start();
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const newMsg: ChatMessage = { role: 'user', text: chatInput };
        setMessages(prev => [...prev, newMsg]);
        setChatInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `
                You are the book "${book.title}" by ${book.author}.
                Your persona: Wise, insightful, and deep. You answer questions based on the book's content.
                Context: The user is reading chapter ${book.currentChapter}.
                Language: Persian.
            `;
            const chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: systemPrompt } });
            const result = await chat.sendMessage({ message: newMsg.text });
            setMessages(prev => [...prev, { role: 'model', text: result.text || '' }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "متاسفانه ارتباط با کتاب قطع شد." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeChapter = async () => {
        setIsLoading(true);
        try {
            const prompt = `Analyze Chapter ${book.currentChapter} of "${book.title}". Provide deep insights, key mental models, and 3 actionable takeaways. Persian language. Markdown format.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
            setAnalysisData(response.text);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateContent = async () => {
        setIsGeneratingContent(true);
        try {
            const prompt = `
                Write a comprehensive, high-quality, original summary/retelling of Chapter ${book.currentChapter + 1} of the book "${book.title}" by ${book.author}.
                It should be detailed enough to read like a real book chapter (approx 600-1000 words). 
                Include dialogue (if fiction) or key arguments (if non-fiction).
                Language: Persian.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
            setPageContent(response.text);
            onUpdate({ ...book, contentSource: response.text, currentChapter: Math.min(book.totalChapters, book.currentChapter + 1) });
        } catch (e) {
            alert("خطا در تولید محتوا.");
        } finally {
            setIsGeneratingContent(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setPageContent(text);
            onUpdate({ ...book, contentSource: text });
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0f0f11] flex text-slate-200 font-[Vazirmatn]">
            
            {/* Left: Reader (Paper Style) */}
            <div className={`flex-grow h-full overflow-y-auto relative transition-all duration-500 ${activeTab === 'read' ? 'w-full md:w-2/3' : 'hidden md:block md:w-1/2'} bg-[#fdfbf7] text-gray-900`}>
                
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>

                <div className="max-w-3xl mx-auto p-8 md:p-12 min-h-full flex flex-col">
                    <div className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                            <ArrowLeftIcon className="w-6 h-6"/>
                        </button>
                        <div className="text-center">
                            <h2 className="font-serif font-bold text-xl text-gray-800">{book.title}</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">فصل {book.currentChapter}</p>
                        </div>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-grow prose prose-lg prose-slate max-w-none font-serif leading-loose text-justify">
                        {pageContent ? (
                            <div className="whitespace-pre-wrap">{pageContent}</div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 md:h-96 text-center space-y-6">
                                <BookOpenIcon className="w-16 h-16 text-gray-300"/>
                                <p className="text-gray-500 max-w-md">
                                    متن این کتاب هنوز بارگذاری نشده است. می‌توانید یک فایل متنی آپلود کنید یا از هوش مصنوعی بخواهید فصل بعدی را برای شما بنویسد.
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-colors flex items-center gap-2">
                                        <DocumentTextIcon className="w-5 h-5"/>
                                        آپلود فایل (txt)
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md"/>
                                    
                                    <button onClick={handleGenerateContent} disabled={isGeneratingContent} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                                        <SparklesIcon className={`w-5 h-5 ${isGeneratingContent ? 'animate-spin' : ''}`}/>
                                        {isGeneratingContent ? 'در حال نوشتن...' : 'تولید فصل با هوش مصنوعی'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="mt-12 pt-6 border-t border-gray-300 flex justify-between items-center text-gray-500 text-sm font-mono">
                         <span>پیشرفت: {Math.round((book.currentChapter / book.totalChapters) * 100)}%</span>
                         <div className="flex gap-4">
                             <button onClick={() => onUpdate({...book, currentChapter: Math.max(0, book.currentChapter - 1)})} className="hover:text-gray-900">فصل قبل</button>
                             <span className="text-gray-300">|</span>
                             <button onClick={() => onUpdate({...book, currentChapter: Math.min(book.totalChapters, book.currentChapter + 1)})} className="hover:text-gray-900">فصل بعد</button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right: AI Sidebar */}
            <div className={`flex-shrink-0 bg-[#1c1c1e] border-r border-white/5 flex flex-col transition-all duration-500 ${activeTab === 'read' ? 'hidden md:flex md:w-1/2 lg:w-1/3' : 'w-full'}`}>
                
                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-black/20 p-1">
                    {[
                        { id: 'read', label: 'خواندن', icon: BookOpenIcon, mobileOnly: true },
                        { id: 'chat', label: 'گفتگو با کتاب', icon: ChatBubbleOvalLeftEllipsisIcon },
                        { id: 'analysis', label: 'تحلیل عمیق', icon: LightBulbIcon },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'} ${tab.mobileOnly ? 'md:hidden' : ''}`}
                        >
                            <tab.icon className="w-4 h-4"/>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar relative">
                    {/* Chat Mode */}
                    {(activeTab === 'chat' || (activeTab === 'read' && window.innerWidth >= 768)) && (
                        <div className="h-full flex flex-col">
                             <div className="flex-grow space-y-4 pb-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-10 px-6">
                                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserIcon className="w-10 h-10 text-indigo-400"/>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">من «{book.title}» هستم.</h3>
                                        <p className="text-slate-400 text-sm">هر سوالی دارید بپرسید. من اینجا هستم تا به شما در درک عمیق‌تر مفاهیم کمک کنم.</p>
                                    </div>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && <div className="text-xs text-slate-500 animate-pulse">در حال تایپ...</div>}
                                <div ref={messagesEndRef} />
                             </div>

                             <div className="mt-auto pt-4 bg-[#1c1c1e] border-t border-white/5">
                                 <div className="flex gap-2 items-end bg-slate-800/50 p-2 rounded-2xl border border-white/10">
                                     <textarea 
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                        placeholder="پیام خود را بنویسید..."
                                        rows={1}
                                        className="flex-grow bg-transparent text-white px-2 py-2 outline-none placeholder-slate-500 text-sm resize-none max-h-32"
                                        style={{ minHeight: '40px' }}
                                     />
                                     <button onClick={handleVoiceInput} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10 text-slate-400'}`}>
                                         <MicrophoneIcon className="w-5 h-5"/>
                                     </button>
                                     <button onClick={handleSendMessage} disabled={!chatInput.trim() || isLoading} className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors disabled:opacity-50">
                                         <ArrowUpIcon className="w-5 h-5"/>
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* Analysis Mode */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6 animate-fadeIn">
                             <div className="bg-gradient-to-br from-violet-900/20 to-transparent p-6 rounded-2xl border border-violet-500/20 text-center">
                                 <SparklesIcon className="w-10 h-10 text-violet-400 mx-auto mb-4"/>
                                 <h3 className="text-lg font-bold text-white mb-2">تحلیل هوشمند فصل</h3>
                                 <p className="text-sm text-slate-400 mb-4">هوش مصنوعی فصل فعلی را خوانده و نکات کلیدی، مدل‌های ذهنی و ایده‌های عمیق را استخراج می‌کند.</p>
                                 <button onClick={handleAnalyzeChapter} disabled={isLoading} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                     {isLoading ? 'در حال تحلیل...' : 'شروع تحلیل'}
                                 </button>
                             </div>
                             
                             {analysisData && (
                                 <div className="prose prose-invert prose-sm max-w-none">
                                     <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                                         {analysisData}
                                     </div>
                                 </div>
                             )}
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
    const [magicInput, setMagicInput] = useState('');
    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [coverUrlInput, setCoverUrlInput] = useState(''); // Add URL input for covers
    const [showAddModal, setShowAddModal] = useState(false);

    const handleMagicAdd = async () => {
        if (!magicInput.trim()) return;
        setIsMagicLoading(true);
        
        try {
            const prompt = `
                Search for book "${magicInput}". 
                Return valid JSON: 
                {
                    "title": "string", 
                    "author": "string", 
                    "totalChapters": number (approx), 
                    "summary": "Persian summary max 1 sentence", 
                    "coverColor": "hex code (vibrant)", 
                    "genre": "Persian genre"
                }
            `;
            const res = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt, 
                config: { responseMimeType: "application/json" } 
            });
            const data = JSON.parse(res.text.trim());
            
            const newBook: Book = {
                id: `book-${Date.now()}`,
                title: data.title,
                author: data.author,
                totalChapters: data.totalChapters || 15,
                currentChapter: 0,
                summary: data.summary,
                coverColor: data.coverColor || '#6366f1',
                coverImage: coverUrlInput || undefined, // Use user provided URL if any
                genre: data.genre,
                aiPersona: `You are the book ${data.title}.`,
                status: 'reading',
                lastReadDate: new Date().toISOString(),
                notes: [],
                chatHistory: []
            };
            
            const updated = [newBook, ...books];
            setBooks(updated);
            onUpdateUserData({ ...userData, books: updated });
            
            setMagicInput('');
            setCoverUrlInput('');
            setShowAddModal(false);
            
        } catch {
            alert("کتاب پیدا نشد. لطفا دوباره تلاش کنید.");
        } finally {
            setIsMagicLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col animate-fadeIn overflow-hidden">
            
            {/* Immersive Reader Overlay */}
            {activeBook && (
                <ImmersiveReader 
                    book={activeBook} 
                    onClose={() => setActiveBook(null)} 
                    onUpdate={(updated) => {
                        const newBooks = books.map(b => b.id === updated.id ? updated : b);
                        setBooks(newBooks);
                        onUpdateUserData({ ...userData, books: newBooks });
                        setActiveBook(updated);
                    }} 
                    addXp={addXp} 
                />
            )}

            {/* Library Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-20%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-amber-900/10 rounded-full blur-[150px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-700/20 p-3 rounded-2xl border border-amber-600/30 backdrop-blur-md">
                        <BookOpenIcon className="w-8 h-8 text-amber-500"/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-white tracking-wide">کتابخانه</h2>
                        <p className="text-xs text-amber-500/60 font-mono uppercase tracking-widest">مجموعه شخصی شما</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-900/50">
                        <PlusIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">افزودن کتاب</span>
                    </button>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            {/* Shelves (Scrollable) */}
            <div className="relative z-10 flex-grow overflow-y-auto px-4 sm:px-12 py-8 custom-scrollbar">
                
                {/* Add Modal */}
                {showAddModal && (
                    <div className="mb-12 p-6 bg-slate-900/80 border border-slate-700 rounded-2xl backdrop-blur-xl max-w-2xl mx-auto animate-bounce-in">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold text-white">جادوی افزودن کتاب</h3>
                             <button onClick={() => setShowAddModal(false)}><XMarkIcon className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">نام کتاب</label>
                                <div className="flex items-center bg-black/30 border border-slate-600 rounded-xl p-1">
                                    <input 
                                        type="text" 
                                        value={magicInput}
                                        onChange={(e) => setMagicInput(e.target.value)}
                                        placeholder="مثلا: عادت‌های اتمی..."
                                        className="flex-grow bg-transparent px-4 py-3 outline-none text-white placeholder-slate-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">لینک تصویر جلد (اختیاری - برای ظاهر زیباتر)</label>
                                <div className="flex items-center bg-black/30 border border-slate-600 rounded-xl p-1">
                                    <input 
                                        type="text" 
                                        value={coverUrlInput}
                                        onChange={(e) => setCoverUrlInput(e.target.value)}
                                        placeholder="https://example.com/cover.jpg"
                                        className="flex-grow bg-transparent px-4 py-3 outline-none text-white placeholder-slate-600 text-xs font-mono"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={() => handleMagicAdd()}
                                disabled={!magicInput.trim() || isMagicLoading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isMagicLoading ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <PlusIcon className="w-5 h-5"/>}
                                {isMagicLoading ? 'در حال جستجو و ساخت...' : 'افزودن به کتابخانه'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16 place-items-center items-end pb-24">
                    {books.map((book, index) => (
                        <div key={book.id} className="relative flex flex-col items-center group w-full">
                            <Book3D book={book} onClick={() => setActiveBook(book)} />
                            
                            {/* Shelf Plank under each row (visual hack) */}
                            <div className="absolute bottom-[-20px] left-[-20px] right-[-20px] h-4 bg-[#3e2723] rounded-sm shadow-2xl transform perspective-[500px] rotateX(10deg) opacity-80 pointer-events-none z-0">
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                            </div>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(window.confirm('حذف این کتاب؟')) {
                                        const updated = books.filter(b => b.id !== book.id);
                                        setBooks(updated);
                                        onUpdateUserData({ ...userData, books: updated });
                                    }
                                }}
                                className="absolute -top-4 -right-4 p-2 bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                    
                    {/* Add Button Placeholder on Shelf */}
                    <button onClick={() => setShowAddModal(true)} className="group relative w-32 h-48 sm:w-40 sm:h-60 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                         <PlusIcon className="w-12 h-12 text-white/20 group-hover:text-white/50 transition-colors"/>
                         <span className="mt-2 text-xs text-white/30 font-bold uppercase tracking-widest">افزودن</span>
                         <div className="absolute bottom-[-20px] left-[-20px] right-[-20px] h-4 bg-[#3e2723] rounded-sm shadow-2xl opacity-40 pointer-events-none"></div>
                    </button>
                </div>

                {books.length === 0 && !showAddModal && (
                    <div className="text-center text-slate-500 mt-20">
                        <p>کتابخانه‌ی شما خالی است. اولین کتاب خود را اضافه کنید.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BooksView;

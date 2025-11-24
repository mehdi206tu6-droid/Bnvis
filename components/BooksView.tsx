
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { OnboardingData, Book, ReadingSession, ChatMessage, Habit, BookHighlight } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { 
    BookOpenIcon, PlusIcon, SparklesIcon, 
    ArrowLeftIcon, XMarkIcon, BoltIcon, ClockIcon, PlayIcon, PauseIcon,
    StopIcon, DocumentTextIcon, ArrowUpIcon, PencilIcon, CheckCircleIcon,
    MicrophoneIcon, SpeakerWaveIcon, ScaleIcon, FireIcon, ChartBarIcon,
    CogIcon, SunIcon, MoonIcon, MagnifyingGlassIcon, ChatBubbleOvalLeftEllipsisIcon,
    QueueListIcon, Squares2X2Icon, ArrowDownIcon, StarIcon, CloudIcon, TrashIcon,
    ShareIcon
} from './icons';
import { getBookData, saveBookData } from '../storage';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Full text content of Atomic Habits (Persian)
const ATOMIC_HABITS_TEXT = `
عنوان کتاب: عادت‌های اتمی
نویسنده: جیمز کلیر
مترجم: تیم ترجمه رویال مایند

مقدمه: داستان من
در آخرین روز سال دوم دبیرستان، چوب بیسبال به صورتم برخورد کرد. وقتی همکلاسیم یک تاب کامل را انجام داد، چوب از دستش خارج شد و مستقیم به صورت من برخورد کرد. من از لحظه‌ی برخورد، هیچ چیزی را به خاطر ندارم. 
چوب با قدرت بسیار زیادی به صورتم برخورد کرد و بینی‌ام را شکست. این برخورد، بافت نرم مغزم را به داخل جمجمه‌ام فرستاد. بلافاصله، ورم بزرگی در سرم ایجاد شد. در کسری از ثانیه، دماغم شکست، در جمجمه‌ام چندین شکستگی ایجاد شد و دو حفره در چشم‌هایم به وجود آمد.
وقتی چشم‌هایش را باز کردم، افرادی را دیدم که به من نگاه می‌کردند و با عجله برای کمک به سوی من می‌آمدند. پایین را نگاه کردم و متوجه لکه‌های قرمزی روی لباس‌هایم شدم.

چگونه و چرا این کتاب را نوشتم
در نوامبر ۲۰۱۲، شروع به نوشتن مقاله‌هایی در سایت jamesclear.com کردم. من برای سال‌ها یادداشت‌هایی را در مورد تجربه‌های شخصی خودم، در مورد قدرت عادت‌ها جمع‌آوری کرده بودم و آماده بودم تا برخی از آن‌ها را به صورت عمومی به اشتراک بگذارم. من دوشنبه‌ها و پنج‌شنبه‌ها مقاله جدیدی را روی سایت قرار می‌دادم. در کمتر از چند ماه، این عادت ساده نوشتن باعث شد تا بیش از هزار مشترک ایمیلی داشته باشم.
عادت، یک روال یا رفتاری است که به طور مرتب- و در بسیاری موارد به طور خودکار- انجام می‌شود. با گذشت هر ترم، من عادت‌های کوچک اما پیوسته‌ای را در خودم ایجاد کردم و در نهایت، به نتایجی رسیدم که در ابتدای شروع، هرگز تصورشان را هم نمی‌کردم.

فصل اول: قدرت شگفت‌انگیز عادت‌های اتمی
سرنوشت دوچرخه‌سواری بریتانیا در سال ۲۰۰۳ تغییر کرد. بدنه حاکم بر دوچرخه‌سواری حرفه‌ای بریتانیا، اخیراً دیو بریلسفورد را به عنوان مدیر جدید خود استخدام کرده بودند.
بریلسفورد می‌گوید: «اگر می‌توانستید تمام موارد مربوط به دوچرخه‌سواری را بشکافید و سپس آن‌ها را ۱ درصد بهتر کنید، در این صورت زمانی که همه آن‌ها را با هم ترکیب کنید، افزایش چشمگیری خواهید داشت.»
چرا عادت‌های کوچک باعث تفاوت بزرگی می‌شوند؟
ریاضیات عادت‌های کوچک: اگر شما بتوانید هر روز و به مدت یک سال ۱ درصد بهتر شوید، در آخر سال، شما سی و هفت برابر بهتر شده‌اید. از طرف دیگر، اگر هر روز به مدت یک سال ۱ درصد بدتر شوید، تقریباً به صفر می‌رسید.

فصل دوم: عادت‌ها چگونه هویت شما را شکل می‌دهد (و بالعکس)
چرا تکرار عادت‌های بد اینقدر آسان و ایجاد عادت‌های خوب تا این حد سخت است؟
تغییر رفتار واقعی، تغییر هویت است. شما ممکن است به دلیل انگیزه‌ای یک عادت را در خودتان ایجاد کنید، اما تنها دلیلی که عادتی را ادامه می‌دهید، این است که آن عادت بخشی از هویت شما می‌شود.
فرآیند دو مرحله‌ای برای تغییر هویت:
۱. در مورد شخصیتی که می‌خواهید داشته باشید، تصمیم‌گیری کنید.
۲. این شخصیت را با پیروزی‌های کوچک به خودتان اثبات کنید.

فصل سوم: چگونه عادت‌های بهتری را در ۴ مرحله ساده ایجاد کنیم
فرآیند شکل‌گیری عادت را می‌توان به چهار مرحله ساده تقسیم کرد: نشانه، اشتیاق، پاسخ، و پاداش.
قانون اول (نشانه): عادت را آشکار کنید.
قانون دوم (اشتیاق): عادت را جذاب کنید.
قانون سوم (پاسخ): انجام عادت را آسان کنید.
قانون چهارم (پاداش): عادت را رضایت‌بخش کنید.

فصل چهارم: مردی که حال خوبی نداشت
مغز انسان یک ماشین پیش‌بینی است. مغز به طور مداوم موارد محیط اطراف شما را جذب و اطلاعات دریافت شده را تجزیه و تحلیل می‌کند. هر بار که موردی را مکرراً تجربه می‌کنید- مانند یک بهیار که صورت یک بیمار حمله قلبی را می‌بیند- مغز شما متوجه نکات مهمی می‌شود.
کارت امتیازی عادت‌ها یک تمرین ساده است که می‌توانید از آن برای آگاهی بیشتر در مورد رفتار خودتان استفاده کنید.

فصل پنجم: بهترین راه برای شروع یک عادت جدید
فرمول قصد پیاده‌سازی: من در [زمان] در [مکان] این [رفتار] را انجام خواهم داد.
فرمول دسته بندی عادت‌ها: بعد از [عادت کنونی] این کار [عادت جدید] را انجام می‌دهم.

فصل ششم: در مورد انگیزه مبالغه می‌شود؛ محیط اغلب مهم‌تر است
طراحی محیط به شما این امکان را می‌دهد تا دوباره کنترل را به دست بگیرید و معمار زندگی‌تان شوید. طراح جهان خودتان باشید، نه صرفاً مصرف کننده‌ی آن.

فصل هفتم: راز خودکنترلی
افرادی که خودکنترلی عالی دارند، معمولاً افرادی هستند که کمترین نیاز به آن را دارند. بهترین راه برای شکستن عادت بد این است که انجام آن را غیرعملی کنید. نشانه را نامرئی کنید.

فصل هشتم: چگونه عادتی را جذاب و خواستنی کنید
هر چه موقعیت جذاب‌تر باشد، احتمال عادت شدن آن بیشتر می‌شود.
استراتژی پیوند خواسته و نیاز: فرمول: ۱. بعد از [عادت کنونی]، [عادتی که نیاز دارم] را انجام می‌دهم. ۲. بعد از [عادتی که نیاز دارم]، [عادتی که می‌خواهم] را انجام می‌دهم.

فصل نهم: نقش خانواده و دوستان در شکل دادن عادت‌های شما
ما رفتار افرادی را تقلید می‌کنیم که: ۱. نزدیکان (خانواده و دوستان)، ۲. اکثریت (قبیله)، ۳. افراد قدرتمند.

فصل دهم: چگونه دلیل عادت‌های بدتان را پیدا و آن‌ها را درست کنید
برای تغییر عادت بد: آن را زشت کنید. مزایای اجتناب از عادت‌های بد را برجسته کنید تا جذاب به نظر نرسند.

فصل یازدهم: آرام پیش بروید، اما هرگز به عقب برنگردید
تفاوت بین در حرکت بودن و عمل کردن: وقتی در حال حرکت هستید، برنامه‌ریزی می‌کنید و یاد می‌گیرید. عمل کردن نوع رفتاری است که نتیجه می‌دهد.

فصل دوازدهم: قانون کمترین تلاش
طبیعت انسان پیروی از قانون کمترین تلاش است. محیطتان را برای انجام آسان‌تر اقدامات آینده آماده کنید. محیطی ایجاد کنید که در آن انجام کار درست، آسان‌ترین کار باشد.

فصل سیزدهم: چگونه با استفاده از قانون دو دقیقه شک و تردید کردن را کنار بگذاریم؟
قانون دو دقیقه: «هنگامی که یک عادت جدید را شروع می‌کنید، انجام آن باید کمتر از دو دقیقه طول بکشد.»

فصل چهاردهم: چگونه انجام عادت‌های خوب را اجتناب‌ناپذیر و انجام عادت‌های بد را غیرممکن کنیم
استفاده از ابزار تعهد: انتخابی که در حال حاضر می‌کنید و اقدامات شما را در آینده کنترل می‌کند.

فصل پانزدهم: قانون مهم تغییر رفتار
قانون اصلی: کاری که بلافاصله پاداش داده شود، تکرار می‌شود. کاری که بلافاصله تنبیه شود، اجتناب می‌شود.

فصل شانزدهم: چگونه هر روز عادت‌های خوب را ادامه دهیم
استفاده از ردیاب عادت (Habit Tracker). قانون: هرگز دو بار از دست نده.

فصل هفدهم: چگونه دوستان مسئولیت‌پذیری می‌توانند همه چیز را تغییر دهند
دانستن اینکه کسی ناظر اعمال شماست، انگیزه‌ای قوی ایجاد می‌کند.

فصل هجدهم: حقیقت درباره استعداد
ژن‌ها سرنوشت شما را تعیین نمی‌کنند، بلکه زمینه‌های فرصت شما را تعیین می‌کنند.

فصل نوزدهم: قانون گلدیاکس
انسان‌ها هنگام کار بر روی وظایفی که در لبه توانایی‌های فعلی آن‌ها هستند (نه خیلی سخت، نه خیلی آسان)، بالاترین سطح انگیزه را تجربه می‌کنند.

فصل بیستم: مشکل ایجاد عادت‌های خوب
عادت‌ها + تمرین آگاهانه = تسلط.

نتیجه‌گیری
عادت‌های اتمی تغییرات کوچکی هستند که نتایج چشمگیری ایجاد می‌کنند.
`;

const PREDEFINED_BOOKS_DATA: Record<string, Partial<Book>> = {
    "Atomic Habits": {
        title: "عادت‌های اتمی",
        author: "جیمز کلیر",
        summary: "تغییرات کوچک، نتایج قابل توجه. روشی آسان و ثابت شده برای ایجاد عادت‌های خوب و از بین بردن عادت‌های بد.",
        uiHint: { themeColor: "from-yellow-600 to-yellow-800", coverStyle: "modern", icon: "⚛️" },
        totalPages: 330,
        contentSource: ATOMIC_HABITS_TEXT,
        tags: ["Habits", "Psychology", "Self-Improvement", "Systems", "Tiny Gains"],
        methods: [
            { id: 'habit-stacking', name: 'انباشت عادت (Habit Stacking)', summary: 'اتصال عادت جدید به یک عادت موجود.', steps: ['عادت فعلی را شناسایی کن', 'فرمول: بعد از [عادت فعلی]، [عادت جدید] را انجام می‌دهم.'] },
            { id: '2-minute-rule', name: 'قانون ۲ دقیقه', summary: 'شروع عادت باید کمتر از ۲ دقیقه طول بکشد.', steps: ['عادت را به کوچکترین نسخه ممکن تبدیل کن', 'فقط ۲ دقیقه انجامش بده'] }
        ],
        applicationIdeas: [
            { feature: 'Habit Tracker', description: 'ایجاد ردیاب عادت در بخش اهداف', methodRefs: ['habit-stacking'] },
            { feature: 'Environment Design', description: 'تغییر چیدمان محیط برای حذف نشانه‌های بد', methodRefs: [] }
        ]
    },
    "Deep Work": {
        title: "کار عمیق",
        author: "کال نیوپورت",
        summary: "قوانینی برای موفقیت متمرکز در دنیای حواس‌پرتی.",
        uiHint: { themeColor: "from-orange-700 to-amber-900", coverStyle: "classic", icon: "🧠" },
        totalPages: 304
    },
    "Meditations": {
        title: "تأملات",
        author: "مارکوس اورلیوس",
        summary: "تأملات شخصی امپراتور روم درباره فلسفه رواقی.",
        uiHint: { themeColor: "from-slate-700 to-slate-900", coverStyle: "classic", icon: "🏛️" },
        totalPages: 254
    }
};

// --- Audio Helpers ---
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
        <div className="bg-black/40 p-6 rounded-xl border border-white/10 text-center backdrop-blur-md w-full max-w-md animate-fadeIn">
            <div className="text-5xl font-mono font-bold text-amber-100 mb-6 tracking-widest drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">{formatTime(seconds)}</div>
            
            <div className="flex justify-center gap-6 mb-6">
                <button onClick={() => setIsActive(!isActive)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg border-2 border-white/10 ${isActive ? 'bg-amber-900/50 hover:bg-amber-800/50 text-amber-200' : 'bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-200'}`}>
                    {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 pl-1"/>}
                </button>
                {seconds > 0 && !isActive && (
                    <button onClick={handleFinish} className="w-16 h-16 rounded-full bg-red-900/50 border-2 border-red-500/30 hover:bg-red-800/50 flex items-center justify-center shadow-lg text-red-200">
                        <StopIcon className="w-8 h-8"/>
                    </button>
                )}
            </div>

            {!isActive && seconds > 0 && (
                <div className="space-y-4 text-right animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-amber-200/60 mb-1 block uppercase tracking-widest">صفحه شروع</label>
                            <input type="number" value={startPage} onChange={e => setStartPage(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded p-2 text-center text-amber-100 font-mono"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-amber-200/60 mb-1 block uppercase tracking-widest">صفحه پایان</label>
                            <input type="number" value={endPage} onChange={e => setEndPage(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded p-2 text-center text-amber-100 font-mono"/>
                        </div>
                    </div>
                    <textarea 
                        placeholder="الهامات و یادداشت‌های این جلسه..." 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-amber-100 placeholder-amber-200/20 focus:ring-1 focus:ring-amber-500/50 outline-none resize-none"
                        rows={3}
                    />
                </div>
            )}
        </div>
    );
};

type SpiritMode = 'chat' | 'oracle' | 'critique' | 'summary';

// --- Live Author Session (Gemini Live API) ---
const LiveAuthorSession: React.FC<{
    book: Book;
    onClose: () => void;
}> = ({ book, onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'thinking'>('connecting');
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const activeSessionRef = useRef<any>(null);
    
    // Refs for cleanup
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const connect = useCallback(async () => {
        try {
            // Create a new dedicated client instance
            const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = ctx;

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputContextRef.current = inputCtx;
            
            if (inputCtx.state === 'suspended') await inputCtx.resume();
            if (ctx.state === 'suspended') await ctx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }});
            mediaStreamRef.current = stream;

            const bookContent = book.contentSource || ATOMIC_HABITS_TEXT;
            const safeContent = bookContent.substring(0, 10000); // Increased context limit
            const persona = book.aiPersona || `You are ${book.author}.`;

            const sessionPromise = client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: `
                        ${persona}
                        You are the author of the book "${book.title}".
                        Embody a persona that matches the book's tone (e.g., wise, practical, philosophical).
                        Speak in fluent Persian (Farsi).
                        Be natural, concise, and engaging, like a phone call.
                        
                        Book Context Snippet:
                        "${safeContent}"
                    `,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
                    }
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
                            // Safety check
                            if (!activeSessionRef.current || inputCtx.state === 'closed') return;

                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcm16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcm16.buffer);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: "audio/pcm;rate=16000",
                                        data: base64
                                    }
                                });
                            }).catch(err => console.warn("Input send failed", err));
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setStatus('speaking');
                            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;

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
                            source.connect(audioContextRef.current.destination);
                            
                            const currentTime = audioContextRef.current.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + audioBuffer.duration;
                            
                            source.onended = () => {
                                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                                    setStatus('listening');
                                }
                            };
                            
                            audioQueueRef.current.push(source);
                        }
                    },
                    onclose: () => console.log("Author session closed"),
                    onerror: (e) => {
                        console.error("Author session error", e);
                        setStatus('connecting');
                    }
                }
            });
        } catch (e) {
            console.error("Connection setup error", e);
            setStatus('connecting');
        }

    }, [book]);

    useEffect(() => {
        connect();
        
        return () => {
            // Cleanup audio resources
            if (processorRef.current && inputContextRef.current) {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null;
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
                inputContextRef.current.close();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            activeSessionRef.current = null;
        };
    }, [connect]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white animate-fadeIn overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'listening' ? 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15),transparent_70%)] animate-pulse'}`}></div>
            
            <div className="z-10 flex flex-col items-center gap-8 w-full px-6 h-full justify-between py-12">
                <div className="text-center mt-10">
                    <h3 className="text-slate-400 text-xs mb-2 uppercase tracking-widest font-bold animate-pulse">
                        {status === 'connecting' ? 'در حال برقراری تماس...' : 'تماس زنده با نویسنده'}
                    </h3>
                    <h2 className="text-3xl font-serif font-bold text-white drop-shadow-lg mb-2">{book.author}</h2>
                    <p className="text-sm text-slate-500">{book.title}</p>
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                    {status === 'connecting' && (
                            <>
                            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-ping" style={{animationDelay: '0.5s'}}></div>
                            </>
                    )}
                    {status === 'speaking' && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-blue-500/30 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </>
                    )}
                    {status === 'listening' && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-green-500/20 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </>
                    )}
                    
                    <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-slate-800 to-black border-4 ${status === 'listening' ? 'border-green-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : (status === 'speaking' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'border-violet-500 shadow-[0_0_50px_rgba(124,58,237,0.3)]')} flex items-center justify-center relative z-10 overflow-hidden transition-all duration-500`}>
                        {book.coverImage ? (
                            <img src={book.coverImage} alt={book.author} className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <span className="text-6xl">{book.uiHint?.icon || '📘'}</span>
                        )}
                    </div>

                    <div className="absolute -bottom-20 text-sm font-mono text-violet-300 transition-all flex flex-col items-center gap-2">
                        <span>
                            {status === 'connecting' ? "Connecting..." : (status === 'speaking' ? "Author Speaking..." : (status === 'thinking' ? "Thinking..." : "Listening..."))}
                        </span>
                    </div>
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
    const [mode, setMode] = useState<SpiritMode>('chat');
    const [isCallMode, setIsCallMode] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (textInput?: string) => {
        const userText = textInput || input;
        if (!userText.trim()) return;

        const userMsg: ChatMessage = { role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg, { role: 'model', text: '' }]);
        setInput('');
        setIsLoading(true);

        try {
            const bookContent = book.contentSource || ATOMIC_HABITS_TEXT;
            const systemPrompt = `
                You are the author of the book "${book.title}" (${book.author}). Embody a persona that matches the book's tone.
                Always respond in fluent Persian (فارسی). Draw precisely from the book's Persian text context provided below.
                Use standard paragraph structure. Be helpful and encouraging.

                **Book Context:**
                """
                ${bookContent.substring(0, 20000)}
                """
            `;
            const requestContents: any[] = [];
            requestContents.push({ role: 'user', parts: [{ text: systemPrompt }] });
            
            messages.slice(-6).forEach(m => requestContents.push({ role: m.role, parts: [{ text: m.text }] }));
            requestContents.push({ role: 'user', parts: [{ text: userText }] });

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
                newArr[newArr.length - 1] = { role: 'model', text: "مشکلی در ارتباط پیش آمد. لطفا دوباره بگویید." };
                return newArr;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummary = () => {
        setMode('summary');
        handleSend('لطفا خلاصه‌ای از کتاب و نکات کلیدی آن ارائه دهید.');
    };

    const modeColors = {
        chat: { bg: 'bg-amber-900/40', border: 'border-amber-700/30', text: 'text-amber-100', accent: 'text-amber-400', glow: 'shadow-amber-500/20' },
        oracle: { bg: 'bg-cyan-900/40', border: 'border-cyan-700/30', text: 'text-cyan-100', accent: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
        critique: { bg: 'bg-red-900/40', border: 'border-red-700/30', text: 'text-red-100', accent: 'text-red-400', glow: 'shadow-red-500/20' },
        summary: { bg: 'bg-emerald-900/40', border: 'border-emerald-700/30', text: 'text-emerald-100', accent: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    };
    const currentTheme = modeColors[mode];

    if (isCallMode) {
        return <LiveAuthorSession book={book} onClose={() => setIsCallMode(false)} />;
    }

    return (
        <div className="flex flex-col h-full relative animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center pt-4 pointer-events-none">
                <div className="flex gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 pointer-events-auto mb-4 overflow-x-auto max-w-[90%]">
                    <button onClick={() => setMode('chat')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${mode === 'chat' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>گفتگو</button>
                    <button onClick={() => setMode('oracle')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${mode === 'oracle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>پرسش</button>
                    <button onClick={() => setMode('critique')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${mode === 'critique' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>نقد</button>
                    <button onClick={handleSummary} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${mode === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>خلاصه</button>
                </div>

                <div className={`w-20 h-20 rounded-full bg-black/50 border flex items-center justify-center transition-all duration-500 ${currentTheme.border} ${isLoading ? 'scale-110 shadow-[0_0_60px_currentColor]' : 'shadow-lg'} ${currentTheme.accent}`}>
                    <SparklesIcon className={`w-10 h-10 ${isLoading ? 'animate-spin' : ''}`} />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-6 pb-24 pt-40 px-4 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed font-serif border group relative ${msg.role === 'user' ? `${currentTheme.bg} ${currentTheme.text} rounded-br-none ${currentTheme.border}` : 'bg-slate-900/80 text-slate-200 rounded-bl-none border-white/5 shadow-inner'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef}></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent">
                <div className={`flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border p-2 rounded-2xl shadow-2xl transition-colors ${currentTheme.border}`}>
                    <button 
                        onClick={() => setIsCallMode(true)}
                        className={`p-3 rounded-xl transition-all bg-green-600/20 text-green-400 hover:bg-green-600/40 animate-pulse`}
                        title="شروع مکالمه زنده با نویسنده"
                    >
                        <MicrophoneIcon className="w-5 h-5"/>
                    </button>
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={mode === 'oracle' ? "سوالی بپرس..." : (mode === 'critique' ? "نقد خود را وارد کن..." : (mode === 'summary' ? "دستور خلاصه..." : "پیام بگذارید..."))}
                        className="flex-grow bg-transparent text-white px-2 outline-none placeholder-slate-500 font-serif"
                    />
                    <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className={`p-3 text-white rounded-xl transition-colors disabled:opacity-50 ${mode === 'critique' ? 'bg-red-700 hover:bg-red-600' : (mode === 'oracle' ? 'bg-cyan-700 hover:bg-cyan-600' : (mode === 'summary' ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-amber-600/80 hover:bg-amber-500'))}`}>
                        <ArrowUpIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookManuscript: React.FC<{ book: Book; onUpdate: (updates: Partial<Book>) => void }> = ({ book, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(!book.contentSource && !book.pdfSource);
    const [content, setContent] = useState(book.contentSource || '');
    const [showSettings, setShowSettings] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    
    // Persistent Settings
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('benvis_reader_fontSize');
        return saved ? parseInt(saved) : 18;
    });
    const [lineHeight, setLineHeight] = useState(() => {
        const saved = localStorage.getItem('benvis_reader_lineHeight');
        return saved ? parseFloat(saved) : 1.8;
    });
    const [theme, setTheme] = useState<'midnight' | 'sepia' | 'day'>(() => {
        const saved = localStorage.getItem('benvis_reader_theme');
        return (saved as 'midnight' | 'sepia' | 'day') || 'midnight';
    });
    
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
    const [isHighlighting, setIsHighlighting] = useState(false);
    const [generatedHighlight, setGeneratedHighlight] = useState<string | null>(null);

    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    // Save settings
    useEffect(() => localStorage.setItem('benvis_reader_fontSize', fontSize.toString()), [fontSize]);
    useEffect(() => localStorage.setItem('benvis_reader_lineHeight', lineHeight.toString()), [lineHeight]);
    useEffect(() => localStorage.setItem('benvis_reader_theme', theme), [theme]);

    useEffect(() => {
        if (book.pdfSource) {
            try {
                if (!/^[A-Za-z0-9+/=]+$/.test(book.pdfSource)) {
                    console.warn("Potential invalid base64 for PDF");
                }
                const byteCharacters = atob(book.pdfSource);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setPdfBlobUrl(url);
                
                return () => {
                    URL.revokeObjectURL(url);
                };
            } catch (e) {
                console.error("Failed to convert PDF base64 to blob", e);
                setPdfBlobUrl(null);
            }
        } else {
            setPdfBlobUrl(null);
        }
    }, [book.pdfSource]);

    useEffect(() => {
        if (!isEditing && scrollContainerRef.current && book.lastScrollPosition) {
            scrollContainerRef.current.scrollTop = book.lastScrollPosition;
        }
    }, [isEditing, content]);

    // Cleanup save timeout
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (book.contentSource && content !== book.contentSource) {
            setContent(book.contentSource);
        }
    }, [book.contentSource]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = window.setTimeout(() => {
            const updates: Partial<Book> = { lastScrollPosition: scrollTop };
            
            // Calculate page progress
            if (!book.pdfSource && book.totalPages && scrollHeight > clientHeight) {
                const progress = scrollTop / (scrollHeight - clientHeight);
                const newPage = Math.min(book.totalPages, Math.max(1, Math.floor(progress * book.totalPages) + 1));
                if (newPage !== book.currentPage) {
                    updates.currentPage = newPage;
                }
            }
            
            onUpdate(updates);
        }, 500);
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectionMenu(null);
            return;
        }

        const text = selection.toString();
        if (text.length < 5) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectionMenu({
            x: rect.left + (rect.width / 2) - 60,
            y: rect.top - 50,
            text: text
        });
    };

    const handleAiHighlight = async () => {
        if (!selectionMenu) return;
        setIsHighlighting(true);
        
        const prompt = `
        You are a wise reading companion. Summarize the core insight of this text snippet in one profound sentence in Persian.
        Text: "${selectionMenu.text}"
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const result = response.text.trim();
            
            setGeneratedHighlight(result);
            
            const newHighlight: BookHighlight = {
                text: selectionMenu.text,
                note: result,
                page: 0, 
                color: 'gold'
            };
            
            const updatedHighlights = [...(book.highlights || []), newHighlight];
            onUpdate({ ...book, highlights: updatedHighlights });

        } catch (e) {
            console.error(e);
        } finally {
            setIsHighlighting(false);
            setSelectionMenu(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleSave = () => {
        onUpdate({ contentSource: content });
        setIsEditing(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === "application/pdf") {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const base64Content = base64data.includes(',') ? base64data.split(',')[1] : base64data;
                onUpdate({ pdfSource: base64Content, contentSource: undefined });
                setIsEditing(false);
            };
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setContent(text);
                onUpdate({ contentSource: text, pdfSource: undefined });
                setIsEditing(false);
            };
            reader.readAsText(file);
        }
    };

    const toggleReadAloud = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            if (!content) return;
            const utterance = new SpeechSynthesisUtterance(content);
            const voices = window.speechSynthesis.getVoices();
            const faVoice = voices.find(v => v.lang.startsWith('fa'));
            if (faVoice) utterance.voice = faVoice;
            utterance.rate = 0.9;
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const getThemeStyles = () => {
        switch (theme) {
            case 'sepia': return { bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', border: 'border-[#d3c4a9]' };
            case 'day': return { bg: 'bg-[#ffffff]', text: 'text-[#1a1a1a]', border: 'border-[#e5e5e5]' };
            case 'midnight': default: return { bg: 'bg-[#141210]', text: 'text-[#e0d5c5]', border: 'border-[#3e2c22]' };
        }
    };
    const themeStyle = getThemeStyles();

    return (
        <div className="h-full flex flex-col space-y-4 pb-4 animate-fadeIn relative">
            
            <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl mx-2 backdrop-blur-sm mt-2 relative z-20 border border-white/10">
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        <CogIcon className="w-5 h-5"/>
                    </button>
                    {!book.pdfSource && !isEditing && (
                        <button onClick={toggleReadAloud} className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="خواندن متن">
                            {isSpeaking ? <StopIcon className="w-5 h-5"/> : <SpeakerWaveIcon className="w-5 h-5"/>}
                        </button>
                    )}
                </div>
                
                <div className="flex gap-2">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs px-3 py-2 rounded-lg bg-blue-600/80 text-white hover:bg-blue-500 transition-colors font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20"
                     >
                         <DocumentTextIcon className="w-4 h-4"/>
                         {book.pdfSource ? 'تغییر فایل' : 'آپلود فایل'}
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".txt,.md,.pdf" 
                        className="hidden" 
                     />

                    {!book.pdfSource && (
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold shadow-lg ${isEditing ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            {isEditing ? <CheckCircleIcon className="w-3 h-3"/> : <PencilIcon className="w-3 h-3"/>}
                            {isEditing ? 'ذخیره' : 'ویرایش'}
                        </button>
                    )}
                </div>
            </div>

            {showSettings && (
                <div className="absolute top-16 left-4 z-30 bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-2xl w-64 animate-bounce-in">
                    <div className="space-y-4">
                        {!book.pdfSource && (
                        <>
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">اندازه قلم</label>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">-</button>
                                    <span className="text-sm w-6 text-center">{fontSize}</span>
                                    <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">فاصله خطوط</label>
                                <div className="flex gap-2">
                                    {[1.4, 1.8, 2.2].map(lh => (
                                        <button key={lh} onClick={() => setLineHeight(lh)} className={`flex-1 py-1 rounded text-xs ${lineHeight === lh ? 'bg-amber-600 text-white' : 'bg-slate-700'}`}>
                                            {lh === 1.4 ? 'کم' : lh === 1.8 ? 'متوسط' : 'زیاد'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">تم مطالعه</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setTheme('midnight')} className={`flex-1 py-2 rounded border flex justify-center ${theme === 'midnight' ? 'border-amber-500' : 'border-transparent'} bg-[#141210]`}><MoonIcon className="w-4 h-4 text-gray-400"/></button>
                                    <button onClick={() => setTheme('sepia')} className={`flex-1 py-2 rounded border flex justify-center ${theme === 'sepia' ? 'border-amber-500' : 'border-transparent'} bg-[#f4ecd8]`}><BookOpenIcon className="w-4 h-4 text-[#5b4636]"/></button>
                                    <button onClick={() => setTheme('day')} className={`flex-1 py-2 rounded border flex justify-center ${theme === 'day' ? 'border-amber-500' : 'border-transparent'} bg-white`}><SunIcon className="w-4 h-4 text-gray-800"/></button>
                                </div>
                            </div>
                        </>
                        )}
                         {book.pdfSource && <p className="text-xs text-slate-400 text-center">تنظیمات برای فایل‌های PDF غیرفعال است.</p>}
                    </div>
                </div>
            )}

            {selectionMenu && !isHighlighting && !book.pdfSource && (
                <div 
                    className="fixed z-50 bg-slate-900 border border-amber-500/50 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] p-1 flex items-center gap-1 animate-bounce-in"
                    style={{ top: selectionMenu.y, left: selectionMenu.x }}
                >
                    <button onClick={handleAiHighlight} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-md text-amber-300 text-xs font-bold transition-colors">
                        <SparklesIcon className="w-4 h-4"/>
                        عصاره‌گیری
                    </button>
                </div>
            )}

            {generatedHighlight && (
                <div className="absolute bottom-4 left-4 right-4 z-40 bg-slate-900/95 border border-amber-500/30 p-4 rounded-xl shadow-2xl animate-fadeIn">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-amber-400 text-sm font-bold flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> عصاره حکمت</h4>
                        <button onClick={() => setGeneratedHighlight(null)} className="text-slate-500 hover:text-white"><XMarkIcon className="w-4 h-4"/></button>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">"{generatedHighlight}"</p>
                    <p className="text-xs text-green-400 mt-2 text-right flex items-center justify-end gap-1"><CheckCircleIcon className="w-3 h-3"/> ذخیره شد</p>
                </div>
            )}

            {pdfBlobUrl ? (
                <div className="flex-grow w-full h-full px-2 overflow-hidden relative">
                     <div className="absolute inset-0 rounded-xl border border-white/10 overflow-hidden bg-[#202020] shadow-inner">
                        <iframe 
                            key={pdfBlobUrl} // Force re-mount on url change
                            src={pdfBlobUrl} 
                            className="w-full h-full border-none"
                            title="PDF Viewer"
                        >
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                <p className="text-slate-400 mb-4">مرورگر شما از نمایش مستقیم PDF پشتیبانی نمی‌کند.</p>
                                <a href={pdfBlobUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                    دانلود/مشاهده فایل
                                </a>
                            </div>
                        </iframe>
                     </div>
                </div>
            ) : isEditing ? (
                <textarea
                    className="flex-grow w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 font-serif leading-loose focus:ring-1 focus:ring-amber-500/50 outline-none resize-none mx-2"
                    placeholder="متن کتاب را اینجا Paste کنید..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            ) : (
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onMouseUp={handleMouseUp}
                    className={`flex-grow w-full rounded-xl p-6 overflow-y-auto font-serif text-justify whitespace-pre-wrap shadow-inner mx-2 scrollbar-hide transition-colors duration-500 ${themeStyle.bg} ${themeStyle.text} ${themeStyle.border} border`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                >
                    {content || <p className="text-center opacity-50 italic mt-10 flex flex-col items-center gap-4">
                        <CloudIcon className="w-12 h-12 opacity-50"/>
                        طومار خالی است. متن کتاب را اضافه کنید یا فایل PDF آپلود کنید.
                    </p>}
                </div>
            )}
        </div>
    );
};

const BookForge: React.FC<{ book: Book; userData: OnboardingData; onUpdateUserData: (data: OnboardingData) => void }> = ({ book, userData, onUpdateUserData }) => {
    const [extractedItems, setExtractedItems] = useState<{type: 'habit' | 'method', title: string, description: string}[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const extractWisdom = async () => {
        setIsProcessing(true);
        const sourceText = book.contentSource ? book.contentSource.substring(0, 8000) : "No full text available.";
        const chatContext = book.chatHistory?.map(m => m.text).join("\n").substring(0, 2000) || "";
        
        const prompt = `
        Analyze the text/context of the book "${book.title}".
        Extract 3 to 5 concrete, actionable "Habits" or "Methods" that the user can apply in real life.
        Source Text Snippet: ${sourceText}
        Chat Context: ${chatContext}
        
        Return JSON array:
        [
          { "type": "habit", "title": "Morning Pages", "description": "Write 3 pages every morning." },
          { "type": "method", "title": "Pomodoro", "description": "Work 25min, rest 5min." }
        ]
        Language: Persian.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            setExtractedItems(JSON.parse(response.text.trim()));
        } catch(e) {
            console.error(e);
            alert("خطا در استخراج متدها");
        } finally {
            setIsProcessing(false);
        }
    };

    const installHabit = (item: {title: string, description: string}) => {
        const newHabit: Habit = {
            name: item.title,
            type: 'good',
            category: book.title,
            icon: 'Bolt'
        };
        if (!userData.habits.some(h => h.name === newHabit.name)) {
            onUpdateUserData({ ...userData, habits: [...userData.habits, newHabit] });
            alert(`عادت «${item.title}» به سیستم عامل زندگی شما اضافه شد.`);
        } else {
            alert("این عادت قبلاً اضافه شده است.");
        }
    };

    return (
        <div className="h-full p-4 overflow-y-auto scrollbar-hide animate-fadeIn">
            <div className="text-center mb-8 pt-6">
                <div className="w-20 h-20 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30 relative">
                    <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-pulse"></div>
                    <FireIcon className="w-10 h-10 text-orange-500"/>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">کورهٔ عمل</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">دانش خام کتاب را ذوب کرده و به ابزار و عادت‌های واقعی برای زندگی تبدیل کنید.</p>
            </div>

            {extractedItems.length === 0 ? (
                <button 
                    onClick={extractWisdom} 
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-orange-800 to-red-900 rounded-xl font-bold text-white shadow-lg shadow-orange-900/30 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-3 border border-orange-500/20"
                >
                    {isProcessing ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <BoltIcon className="w-5 h-5"/>}
                    {isProcessing ? 'در حال ذوب کردن دانش...' : 'استخراج متدها و عادت‌ها'}
                </button>
            ) : (
                <div className="space-y-4">
                    {extractedItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl flex flex-col gap-3 group hover:bg-slate-800/80 transition-colors">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white text-lg">{item.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${item.type === 'habit' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}`}>{item.type === 'habit' ? 'عادت' : 'متد'}</span>
                                </div>
                                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.description}</p>
                            </div>
                            {item.type === 'habit' && (
                                <button onClick={() => installHabit(item)} className="w-full py-2 bg-slate-700 hover:bg-green-700 hover:text-white text-slate-300 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                    <PlusIcon className="w-4 h-4"/>
                                    نصب در Life OS
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={extractWisdom} className="w-full py-3 text-sm text-slate-500 hover:text-white flex items-center justify-center gap-2">
                        <ArrowUpIcon className="w-4 h-4 rotate-180"/>
                        بازسازی لیست
                    </button>
                </div>
            )}
        </div>
    );
};

const BookStats: React.FC<{ book: Book }> = ({ book }) => {
    const sessions = book.sessions || [];
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalPagesRead = sessions.reduce((acc, s) => acc + s.pagesRead, 0);
    const avgSpeed = totalMinutes > 0 ? (totalPagesRead / totalMinutes * 60).toFixed(1) : "0"; 
    
    const uniqueDays = new Set(sessions.map(s => s.date.split('T')[0])).size;

    return (
        <div className="h-full p-6 overflow-y-auto animate-fadeIn">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-emerald-400" />
                    آمار مطالعه
                </h3>
                <p className="text-slate-400 text-sm">تحلیل عملکرد شما در مطالعه «{book.title}»</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-1">کل زمان مطالعه</p>
                    <p className="text-2xl font-bold text-white font-mono">{totalMinutes} <span className="text-xs text-slate-500">دقیقه</span></p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-1">تعداد صفحات</p>
                    <p className="text-2xl font-bold text-white font-mono">{totalPagesRead}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-1">سرعت مطالعه</p>
                    <p className="text-2xl font-bold text-emerald-400 font-mono">{avgSpeed} <span className="text-xs text-slate-500">ص/ساعت</span></p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400 mb-1">روزهای فعالیت</p>
                    <p className="text-2xl font-bold text-amber-400 font-mono">{uniqueDays}</p>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-slate-300 mb-4">جلسات اخیر</h4>
                <div className="space-y-3">
                    {sessions.slice(0, 5).map((sess, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                            <div className="w-12 text-slate-500">{new Date(sess.date).toLocaleDateString('fa-IR', {day: '2-digit', month: '2-digit'})}</div>
                            <div className="flex-grow bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full" style={{ width: `${Math.min(100, sess.durationMinutes * 2)}%` }}></div>
                            </div>
                            <div className="w-16 text-right text-slate-300">{sess.durationMinutes} دقیقه</div>
                        </div>
                    ))}
                    {sessions.length === 0 && <p className="text-center text-slate-500 text-xs">هنوز جلسه‌ای ثبت نشده است.</p>}
                </div>
            </div>
        </div>
    );
}

const BookNotebook: React.FC<{ book: Book; onUpdate: (b: Book) => void }> = ({ book, onUpdate }) => {
    const highlights = book.highlights || [];
    
    const handleDelete = (idx: number) => {
        const newHighlights = [...highlights];
        newHighlights.splice(idx, 1);
        onUpdate({ ...book, highlights: newHighlights });
    };

    return (
        <div className="h-full p-6 overflow-y-auto animate-fadeIn scrollbar-hide">
            <div className="text-center mb-8">
                 <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <PencilIcon className="w-6 h-6 text-amber-400"/>
                    دفترچه یادداشت
                </h3>
                <p className="text-slate-400 text-sm">نکات و هایلایت‌های ذخیره شده</p>
            </div>

            {highlights.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 flex flex-col items-center gap-4">
                    <DocumentTextIcon className="w-12 h-12 opacity-20"/>
                    <p>هیچ یادداشتی یافت نشد.</p>
                    <p className="text-xs opacity-60">متن کتاب را انتخاب کنید تا هایلایت شود.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {highlights.map((h, i) => (
                        <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl relative group hover:bg-slate-800 transition-colors">
                            <blockquote className="border-r-2 border-amber-500 pr-3 text-slate-200 text-sm mb-3 leading-relaxed">
                                "{h.text}"
                            </blockquote>
                            {h.note && (
                                <div className="text-amber-100/80 text-xs bg-amber-900/20 p-3 rounded-lg flex gap-2 items-start">
                                    <SparklesIcon className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0"/>
                                    <span>{h.note}</span>
                                </div>
                            )}
                            <button onClick={() => handleDelete(i)} className="absolute top-2 left-2 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-900/80 rounded-lg backdrop-blur-sm">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SanctuaryReader: React.FC<{ book: Book; onBack: () => void; onUpdate: (b: Book) => void; addXp: (a: number) => void; userData: OnboardingData; onUpdateUserData: (d: OnboardingData) => void }> = ({ book, onBack, onUpdate, addXp, userData, onUpdateUserData }) => {
    const [activeTab, setActiveTab] = useState<'spirit' | 'scroll' | 'forge' | 'timer' | 'stats' | 'notebook'>('scroll');
    const [hydratedBook, setHydratedBook] = useState<Book>(book);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const hydrate = async () => {
            if (book.id !== hydratedBook.id) {
                if (book.hasExternalContent && !book.contentSource && !book.pdfSource) {
                    setIsLoading(true);
                    try {
                        const data = await getBookData(book.id);
                        setHydratedBook({ ...book, ...(data || {}) });
                    } catch(e) {
                        console.error("Fetch failed", e);
                        setHydratedBook(book);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    setHydratedBook(book);
                }
            } else {
                const hasLocalContent = hydratedBook.contentSource || hydratedBook.pdfSource;
                const hasPropContent = book.contentSource || book.pdfSource;

                if (hasPropContent) {
                    setHydratedBook(book);
                } else if (hasLocalContent) {
                    setHydratedBook(prev => ({
                        ...book,
                        contentSource: prev.contentSource,
                        pdfSource: prev.pdfSource
                    }));
                } else if (book.hasExternalContent) {
                    setIsLoading(true);
                    try {
                        const data = await getBookData(book.id);
                        setHydratedBook({ ...book, ...(data || {}) });
                    } catch (e) {
                        console.error("Fetch failed", e);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    setHydratedBook(book);
                }
            }
        };
        hydrate();
    }, [book, book.id, book.hasExternalContent]);

    const handleSessionFinish = (session: ReadingSession) => {
        const updatedSessions = [session, ...(hydratedBook.sessions || [])];
        const totalP = hydratedBook.totalPages || 1;
        const newPage = session.endPage || hydratedBook.currentPage;
        const isCompleted = newPage >= totalP;
        
        onUpdate({
            ...hydratedBook,
            sessions: updatedSessions,
            currentPage: newPage,
            status: isCompleted ? 'completed' : 'reading'
        });
        addXp(session.durationMinutes * 2); 
    };

    const handleUpdateBook = (updates: Partial<Book>) => {
        const newBook = { ...hydratedBook, ...updates };
        setHydratedBook(newBook);
        onUpdate(newBook);
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn bg-[#050505] relative overflow-hidden font-[Vazirmatn]">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(60,40,20,0.3),transparent_70%)] pointer-events-none"></div>
             
             <div className="flex justify-between items-center p-4 z-20 border-b border-white/5 bg-black/20 backdrop-blur-sm h-16">
                <button onClick={onBack} className="text-amber-200/50 hover:text-amber-100 transition-colors"><ArrowLeftIcon className="w-6 h-6"/></button>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-amber-100 truncate max-w-[200px]">{hydratedBook.title}</h2>
                    <div className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em]">Sanctuary Mode</div>
                </div>
                <div className="w-6"></div>
             </div>

             <div className="flex-grow relative z-10 overflow-hidden">
                 {isLoading ? (
                     <div className="flex items-center justify-center h-full text-amber-500 flex-col gap-4">
                         <SparklesIcon className="w-10 h-10 animate-spin"/>
                         <span className="ml-2 text-sm">در حال احضار متن کتاب...</span>
                     </div>
                 ) : (
                     <>
                        {activeTab === 'scroll' && <BookManuscript book={hydratedBook} onUpdate={handleUpdateBook} />}
                        {activeTab === 'spirit' && <BookSpirit book={hydratedBook} onUpdate={(h) => onUpdate({...hydratedBook, chatHistory: h})} />}
                        {activeTab === 'forge' && <BookForge book={hydratedBook} userData={userData} onUpdateUserData={onUpdateUserData} />}
                        {activeTab === 'stats' && <BookStats book={hydratedBook} />}
                        {activeTab === 'notebook' && <BookNotebook book={hydratedBook} onUpdate={handleUpdateBook} />}
                        {activeTab === 'timer' && (
                            <div className="p-6 flex items-center justify-center h-full">
                                <ReadingSessionTimer book={hydratedBook} onFinish={handleSessionFinish} />
                            </div>
                        )}
                     </>
                 )}
             </div>

             <div className="p-2 z-20 bg-black/60 backdrop-blur-xl border-t border-white/10 pb-6">
                 <div className="flex justify-around items-center max-w-md mx-auto">
                    <button onClick={() => setActiveTab('scroll')} className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'scroll' ? 'text-amber-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                        <DocumentTextIcon className="w-6 h-6"/>
                        <span className="text-[10px] font-bold">طومار</span>
                    </button>
                    <button onClick={() => setActiveTab('spirit')} className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'spirit' ? 'text-amber-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                        <SparklesIcon className="w-6 h-6"/>
                        <span className="text-[10px] font-bold">روح</span>
                    </button>
                    <button onClick={() => setActiveTab('timer')} className="relative -top-5">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-lg transition-all ${activeTab === 'timer' ? 'bg-amber-500 text-black scale-110' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                            <ClockIcon className="w-8 h-8"/>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab('notebook')} className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'notebook' ? 'text-orange-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                        <PencilIcon className="w-6 h-6"/>
                        <span className="text-[10px] font-bold">دفترچه</span>
                    </button>
                    <button onClick={() => setActiveTab('stats')} className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-emerald-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                        <ChartBarIcon className="w-6 h-6"/>
                        <span className="text-[10px] font-bold">آمار</span>
                    </button>
                 </div>
             </div>
        </div>
    );
};

interface BooksViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
    addXp: (amount: number) => void;
}

const BooksView: React.FC<BooksViewProps> = ({ userData, onUpdateUserData, onClose, addXp }) => {
    const [activeBookId, setActiveBookId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<'recent' | 'title' | 'progress' | 'author'>('recent');

    const books = userData.books || [];
    const activeBook = books.find(b => b.id === activeBookId);

    useEffect(() => {
        if (activeBookId && activeBook) {
            const isAtomic = activeBook.title.toLowerCase().includes('atomic') || activeBook.title.includes('اتمی');
            const hasContent = (activeBook.contentSource && activeBook.contentSource.length > 100) || activeBook.hasExternalContent;
            
            if (isAtomic && !hasContent && !activeBook.pdfSource) {
                const updatedBook = { ...activeBook, contentSource: ATOMIC_HABITS_TEXT };
                onUpdateUserData({ 
                    ...userData, 
                    books: books.map(b => b.id === activeBook.id ? updatedBook : b) 
                });
            }
        }
    }, [activeBookId]);

    const displayBooks = useMemo(() => {
        const savedTitles = new Set(books.map(b => b.title));
        const ghosts = Object.entries(PREDEFINED_BOOKS_DATA)
            .filter(([title]) => !savedTitles.has(title) && !savedTitles.has(PREDEFINED_BOOKS_DATA[title].title!))
            .map(([title, data]) => ({
                id: `ghost-${title}`,
                ...data,
                status: 'want_to_read',
                progress: 0,
                isGhost: true,
                coverColor: data.uiHint?.themeColor
            } as unknown as Book & { isGhost: boolean }));
        
        let allBooks = [...books, ...ghosts];
        
        if (searchQuery) {
            allBooks = allBooks.filter(b => 
                b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                b.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        allBooks.sort((a, b) => {
            if (sortOption === 'title') return a.title.localeCompare(b.title);
            if (sortOption === 'author') return a.author.localeCompare(b.author);
            if (sortOption === 'progress') {
                const pA = a.status === 'completed' ? 100 : ((a.currentPage || 0) / (a.totalPages || 1) * 100);
                const pB = b.status === 'completed' ? 100 : ((b.currentPage || 0) / (b.totalPages || 1) * 100);
                return pB - pA;
            }
            if ((a as any).lastReadDate && (b as any).lastReadDate) {
                return new Date((b as any).lastReadDate).getTime() - new Date((a as any).lastReadDate).getTime();
            }
            return 0;
        });

        return allBooks;

    }, [books, searchQuery, sortOption]);

    const handleAddBook = (title: string) => {
        const presetKey = Object.keys(PREDEFINED_BOOKS_DATA).find(key => PREDEFINED_BOOKS_DATA[key].title === title || key === title);
        const preset = presetKey ? PREDEFINED_BOOKS_DATA[presetKey] : null;

        const newBook: Book = {
            id: `book-${Date.now()}`,
            title: preset?.title || title,
            author: preset?.author || 'ناشناس',
            totalChapters: 10,
            totalPages: preset?.totalPages || 200,
            currentChapter: 1,
            currentPage: 0,
            summary: preset?.summary || '',
            uiHint: preset?.uiHint || { themeColor: "from-slate-700 to-slate-900", coverStyle: 'minimal', icon: '📘' },
            methods: [],
            status: 'reading',
            aiPersona: `You are the book ${title}.`,
            coverColor: preset?.uiHint?.themeColor || "from-slate-700 to-slate-900",
            sessions: [],
            flashcards: [],
            chatHistory: [],
            contentSource: preset?.contentSource || ''
        };
        onUpdateUserData({ ...userData, books: [newBook, ...books] });
        setIsAdding(false);
        setManualTitle('');
        setActiveBookId(newBook.id);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] text-slate-200 font-[Vazirmatn] overflow-hidden flex flex-col animate-fadeIn">
            {activeBook ? (
                <SanctuaryReader 
                    book={activeBook} 
                    onBack={() => setActiveBookId(null)} 
                    onUpdate={(updated) => {
                        const timestampedUpdate = { ...updated, lastReadDate: new Date().toISOString() };
                        onUpdateUserData({...userData, books: books.map(b => b.id === updated.id ? timestampedUpdate : b)})
                    }} 
                    addXp={addXp}
                    userData={userData}
                    onUpdateUserData={onUpdateUserData}
                />
            ) : (
                <>
                    <div className="relative pt-6 pb-4 px-6 z-10 bg-[#050505]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"><XMarkIcon className="w-5 h-5"/></button>
                                <h2 className="text-xl font-bold text-white font-serif">معبد خرد</h2>
                            </div>
                            <button onClick={() => setIsAdding(true)} className="p-2 rounded-full bg-amber-900/20 text-amber-400 border border-amber-500/20 hover:bg-amber-900/40 transition-all"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                             <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <MagnifyingGlassIcon className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="جستجو در کتابخانه..." 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-9 pl-3 text-sm focus:ring-1 focus:ring-amber-500/50 outline-none text-slate-200 placeholder-slate-600"
                                    />
                                </div>
                                <button 
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                                >
                                    {viewMode === 'grid' ? <QueueListIcon className="w-5 h-5"/> : <Squares2X2Icon className="w-5 h-5"/>}
                                </button>
                             </div>
                             
                             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                <button onClick={() => setSortOption('recent')} className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${sortOption === 'recent' ? 'bg-amber-900/30 border-amber-500/50 text-amber-300' : 'border-white/10 text-slate-400'}`}>اخیر</button>
                                <button onClick={() => setSortOption('progress')} className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${sortOption === 'progress' ? 'bg-amber-900/30 border-amber-500/50 text-amber-300' : 'border-white/10 text-slate-400'}`}>پیشرفت</button>
                                <button onClick={() => setSortOption('title')} className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${sortOption === 'title' ? 'bg-amber-900/30 border-amber-500/50 text-amber-300' : 'border-white/10 text-slate-400'}`}>عنوان</button>
                                <button onClick={() => setSortOption('author')} className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${sortOption === 'author' ? 'bg-amber-900/30 border-amber-500/50 text-amber-300' : 'border-white/10 text-slate-400'}`}>نویسنده</button>
                             </div>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto px-4 pb-20 z-10 scrollbar-hide">
                        {viewMode === 'grid' ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-8">
                                {displayBooks.map((book) => (
                                    <div 
                                        key={book.id} 
                                        onClick={() => (book as any).isGhost ? handleAddBook(book.title) : setActiveBookId(book.id)}
                                        className="group relative aspect-[2/3] cursor-pointer transition-transform duration-300 hover:-translate-y-2"
                                    >
                                        <div className={`absolute inset-0 rounded-md shadow-lg border border-white/10 overflow-hidden bg-gradient-to-br ${book.coverColor || 'from-slate-800 to-black'} ${(book as any).isGhost ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}>
                                            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] mix-blend-overlay"></div>
                                            <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-white/10"></div>
                                            
                                            <div className="h-full flex flex-col items-center justify-center p-3 text-center relative z-10">
                                                <div className="text-3xl mb-2 filter drop-shadow-md transform group-hover:scale-110 transition-transform">{book.uiHint?.icon || '📘'}</div>
                                                <h3 className="font-serif font-bold text-white/90 text-sm leading-tight line-clamp-2 mb-1">{book.title}</h3>
                                                <p className="text-9px text-white/50 font-serif italic tracking-wider truncate w-full">{book.author}</p>
                                            </div>
                                            
                                            <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-r from-black/40 to-transparent"></div>
                                            
                                            {!((book as any).isGhost) && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                                    <div className="h-full bg-amber-500" style={{ width: `${book.totalPages ? ((book.currentPage || 0) / book.totalPages * 100) : 0}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2 pb-8">
                                 {displayBooks.map((book) => (
                                    <div 
                                        key={book.id} 
                                        onClick={() => (book as any).isGhost ? handleAddBook(book.title) : setActiveBookId(book.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${(book as any).isGhost ? 'opacity-60' : ''}`}
                                    >
                                        <div className={`w-10 h-14 rounded bg-gradient-to-br ${book.coverColor || 'from-slate-800 to-black'} flex items-center justify-center text-lg shadow-sm flex-shrink-0`}>
                                            {book.uiHint?.icon || '📘'}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-bold text-slate-200 text-sm truncate">{book.title}</h3>
                                            <p className="text-xs text-slate-500 truncate">{book.author}</p>
                                            {!((book as any).isGhost) && (
                                                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                                                    <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${book.totalPages ? ((book.currentPage || 0) / book.totalPages * 100) : 0}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                        {(book as any).isGhost ? <PlusIcon className="w-4 h-4 text-slate-500"/> : <ArrowLeftIcon className="w-4 h-4 text-slate-500 rotate-180"/>}
                                    </div>
                                 ))}
                            </div>
                        )}
                        
                         {displayBooks.length === 0 && (
                            <div className="w-full text-center text-slate-600 italic py-10 font-serif">کتابخانه خالیست...</div>
                        )}
                    </div>
                </>
            )}

            {isAdding && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6 backdrop-blur-xl animate-fadeIn">
                    <div className="w-full max-w-sm space-y-6 text-center">
                        <h3 className="text-2xl font-serif text-amber-100 mb-8">احضار کتاب جدید</h3>
                        
                        <input 
                            type="text" 
                            value={manualTitle}
                            onChange={e => setManualTitle(e.target.value)}
                            placeholder="نام کتاب..."
                            className="w-full bg-transparent border-b border-amber-500/50 p-3 text-center text-xl text-white placeholder-slate-600 focus:border-amber-400 outline-none font-serif transition-colors"
                            autoFocus
                        />
                        
                        <div className="flex justify-center gap-6 pt-8">
                            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">لغو</button>
                            <button 
                                onClick={() => handleAddBook(manualTitle)} 
                                disabled={!manualTitle}
                                className="px-8 py-2 bg-amber-900/30 border border-amber-500/30 text-amber-200 rounded-full hover:bg-amber-800/50 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                افزودن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BooksView;

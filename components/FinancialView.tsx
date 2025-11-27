
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { OnboardingData, Transaction, TransactionCategory } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { 
    PlusIcon, TrashIcon, ChartPieIcon, 
    FinanceIcon, CreditCardIcon, ReceiptPercentIcon,
    XMarkIcon, BriefcaseIcon,
    ArrowDownCircleIcon, ArrowUpCircleIcon,
    SparklesIcon, MicrophoneIcon, SpeakerWaveIcon,
    StopIcon, BoltIcon, DocumentScannerIcon,
    ScaleIcon, CalculatorIcon, TrendingUpIcon, CurrencyDollarIcon,
    ChartBarIcon, CheckCircleIcon, ShieldCheckIcon, LockClosedIcon,
    GlobeAltIcon, ArrowPathIcon, DocumentTextIcon
} from './icons';

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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface FinancialViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

// --- Missing Components Placeholders ---

const SMSParser: React.FC<{ onParse: (txs: any[]) => void }> = ({ onParse }) => {
    return (
        <div className="bg-slate-800/40 p-5 rounded-[2rem] border border-white/10">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><DocumentTextIcon className="w-5 h-5 text-green-400"/> پردازش پیامک بانک</h4>
            <p className="text-sm text-slate-400">این قابلیت در نسخه وب در دسترس نیست.</p>
        </div>
    );
};

const MarketWatch: React.FC = () => {
    return (
        <div className="bg-slate-800/40 p-5 rounded-[2rem] border border-white/10 mb-6">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><GlobeAltIcon className="w-5 h-5 text-blue-400"/> دیدبان بازار</h4>
            <p className="text-sm text-slate-400">نمای کلی بازار در اینجا نمایش داده می‌شود.</p>
        </div>
    );
};

const LoanCalculator: React.FC = () => {
    return (
        <div className="bg-slate-800/40 p-5 rounded-[2rem] border border-white/10 mt-6">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><CalculatorIcon className="w-5 h-5 text-yellow-400"/> محاسبه‌گر وام</h4>
            <p className="text-sm text-slate-400">محاسبه اقساط و سود وام‌ها.</p>
        </div>
    );
};

// --- COMPONENT: Live Advisor (AI Personal Assistant) ---
const LiveFinancialAdvisor: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    const audioCtxRef = useRef<AudioContext | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const activeSessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);

    const cleanup = () => {
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (inputCtxRef.current?.state !== 'closed') inputCtxRef.current?.close();
        if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
        activeSessionRef.current = null;
    };

    useEffect(() => { return () => cleanup(); }, []);

    const connect = async () => {
        cleanup();
        setStatus('connecting');
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioCtxRef.current = ctx;
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputCtxRef.current = inputCtx;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, echoCancellation: true } });
            mediaStreamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: "You are 'Benvis Finance AI', an advanced financial assistant based on 2025 FinTech standards. Provide real-time market analysis, investment advice, and risk assessment in fluent Persian. Be professional, data-driven, and concise.",
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
                },
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        activeSessionRef.current = sessionPromise;
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            if (!activeSessionRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const base64 = arrayBufferToBase64(floatTo16BitPCM(inputData).buffer);
                            sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64 } }));
                        };
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: (msg: LiveServerMessage) => {
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
                            source.connect(audioCtxRef.current.destination);
                            const now = audioCtxRef.current.currentTime;
                            const start = Math.max(now, nextStartTimeRef.current);
                            source.start(start);
                            nextStartTimeRef.current = start + buffer.duration;
                            source.onended = () => setStatus('listening');
                        }
                    },
                    onclose: () => setStatus('idle'),
                    onerror: () => setStatus('error')
                }
            });
        } catch { setStatus('error'); }
    };

    return (
        <div className="relative h-full flex flex-col items-center justify-center p-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#020617] border border-indigo-900/30 shadow-2xl">
            <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'speaking' ? 'opacity-40' : 'opacity-10'} bg-[radial-gradient(circle_at_center,#6366f1_0%,transparent_70%)] pointer-events-none`}></div>
            <div className="relative z-10 text-center mb-10">
                <div className={`w-48 h-48 mx-auto rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${status === 'speaking' ? 'bg-indigo-500 shadow-[0_0_80px_rgba(99,102,241,0.6)] scale-110' : 'bg-slate-800 border-4 border-indigo-900/50'}`}>
                    {status === 'speaking' ? <SpeakerWaveIcon className="w-20 h-20 text-white animate-pulse"/> : status === 'listening' ? <div className="w-20 h-20 bg-indigo-400 rounded-full animate-ping opacity-75"></div> : <MicrophoneIcon className="w-20 h-20 text-slate-500"/>}
                </div>
                <h3 className="mt-8 text-3xl font-black text-white tracking-tight">دستیار مالی FinTech AI</h3>
                <p className="text-indigo-400/80 text-sm font-medium mt-3">{status === 'idle' ? 'مشاوره هوشمند با تکنولوژی ۲۰۲۵' : status === 'listening' ? 'در حال شنیدن...' : status === 'speaking' ? 'در حال تحلیل...' : 'اتصال به سرور...'}</p>
            </div>
            <div className="relative z-10">
                {status === 'idle' || status === 'error' ? (
                    <button onClick={connect} className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/40 flex items-center gap-3 transition-all hover:scale-105 text-lg">
                        <BoltIcon className="w-6 h-6"/> شروع مکالمه
                    </button>
                ) : (
                    <button onClick={() => { cleanup(); setStatus('idle'); }} className="w-20 h-20 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/50 backdrop-blur-md">
                        <StopIcon className="w-10 h-10"/>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- COMPONENT: Market Intelligence (Predictive Analytics) ---
const MarketIntelligence: React.FC = () => {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const markets = [
        { name: 'بیت‌کوین', symbol: 'BTC', current: '۶۷,۴۵۰', type: 'crypto' },
        { name: 'طلای ۱۸ عیار', symbol: 'Gold', current: '۳,۸۵۰,۰۰۰', type: 'commodity' },
        { name: 'دلار آمریکا', symbol: 'USD', current: '۶۲,۵۰۰', type: 'fiat' },
    ];

    const runPrediction = async () => {
        setLoading(true);
        const prompt = `
            Act as an AI Market Analyst (AlphaSense style). 
            Analyze current market trends for Bitcoin, Gold (Iran market), and USD/IRR. 
            Generate a "Predictive Analysis" for the next week.
            For each asset provide: 
            1. Prediction (Bullish/Bearish/Neutral)
            2. Confidence Score (0-100%)
            3. Key Driver (max 5 words)
            
            Output JSON: { "assets": [{ "name": "string", "prediction": "string", "confidence": number, "driver": "string" }] }
            Language: Persian.
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            setAnalysis(JSON.parse(response.text));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-blue-400"/> هوش بازار (Market AI)
                </h4>
                <button onClick={runPrediction} disabled={loading} className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-colors">
                    {loading ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <ArrowPathIcon className="w-5 h-5"/>}
                </button>
            </div>

            <div className="grid gap-3">
                {markets.map((m, idx) => {
                    const aiData = analysis?.assets?.find((a: any) => a.name.includes(m.symbol) || a.name.includes(m.name));
                    const isBullish = aiData?.prediction === 'Bullish';
                    
                    return (
                        <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${m.type === 'crypto' ? 'bg-orange-500/20 text-orange-400' : m.type === 'commodity' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {m.type === 'crypto' ? <BoltIcon className="w-5 h-5"/> : m.type === 'commodity' ? <ScaleIcon className="w-5 h-5"/> : <CurrencyDollarIcon className="w-5 h-5"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{m.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">{m.current}</p>
                                    </div>
                                </div>
                                {aiData ? (
                                    <div className="text-right">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isBullish ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                            {aiData.prediction === 'Bullish' ? 'صعودی' : aiData.prediction === 'Bearish' ? 'نزولی' : 'خنثی'}
                                        </span>
                                        <p className="text-[10px] text-slate-500 mt-1">{aiData.confidence}% اطمینان</p>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-600">منتظر تحلیل...</span>
                                )}
                            </div>
                            {aiData && (
                                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-300 flex gap-2 items-center">
                                    <SparklesIcon className="w-3 h-3 text-blue-400"/>
                                    <span>عامل کلیدی: {aiData.driver}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- COMPONENT: Robo-Advisor ---
const RoboAdvisor: React.FC = () => {
    const [riskProfile, setRiskProfile] = useState<string>('medium');
    const [capital, setCapital] = useState<string>('');
    const [portfolio, setPortfolio] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const generatePortfolio = async () => {
        if (!capital) return;
        setLoading(true);
        const prompt = `
            Act as a Robo-Advisor (like Betterment or Wealthfront).
            User Capital: ${capital} Tomans.
            Risk Profile: ${riskProfile}.
            Task: Generate a diversified investment portfolio allocation for the Iranian market context (Gold, Stocks, Fixed Income, Crypto).
            Output JSON: { "allocation": [{"asset": "string", "percentage": number, "color": "string (hex)"}], "rationale": "string" }
            Language: Persian.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            setPortfolio(JSON.parse(response.text));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl">
            <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-purple-400"/> روبو ادوایزر (Robo-Advisor)
            </h4>
            
            {!portfolio ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-xl">
                        {['low', 'medium', 'high'].map(r => (
                            <button key={r} onClick={() => setRiskProfile(r)} className={`py-2 rounded-lg text-xs font-bold transition-all ${riskProfile === r ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                                {r === 'low' ? 'محافظه‌کار' : r === 'medium' ? 'متعادل' : 'جسورانه'}
                            </button>
                        ))}
                    </div>
                    <input 
                        type="number" 
                        value={capital}
                        onChange={e => setCapital(e.target.value)}
                        placeholder="مبلغ سرمایه‌گذاری (تومان)"
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500"
                    />
                    <button onClick={generatePortfolio} disabled={loading || !capital} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold flex justify-center items-center gap-2 disabled:opacity-50">
                        {loading ? <SparklesIcon className="w-5 h-5 animate-spin"/> : 'ساخت پورتفوی هوشمند'}
                    </button>
                </div>
            ) : (
                <div className="animate-fadeIn">
                    <div className="flex h-4 rounded-full overflow-hidden mb-4">
                        {portfolio.allocation.map((item: any, idx: number) => (
                            <div key={idx} style={{ width: `${item.percentage}%`, backgroundColor: item.color || '#6366f1' }} title={item.asset}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {portfolio.allocation.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || '#6366f1' }}></div>
                                <span>{item.asset}: {item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-white/5">{portfolio.rationale}</p>
                    <button onClick={() => setPortfolio(null)} className="w-full mt-4 py-2 bg-slate-700 rounded-xl text-xs text-slate-300">محاسبه مجدد</button>
                </div>
            )}
        </div>
    );
};

// --- COMPONENT: Risk Guard (Fraud Detection & Credit Score) ---
const RiskGuard: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [activeTab, setActiveTab] = useState<'fraud' | 'credit'>('fraud');
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const analyzeFraud = async () => {
        setLoading(true);
        const recentTx = transactions.slice(0, 10);
        const prompt = `
            Act as a Fraud Detection AI (like IBM Watsonx).
            Analyze these recent transactions for anomalies or unusual patterns.
            Transactions: ${JSON.stringify(recentTx)}
            
            Output JSON: { "status": "Clean" | "Warning", "suspicious_ids": ["id"], "risk_score": number (0-100), "message": "string" }
            Language: Persian.
        `;
        try {
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            setAnalysis(JSON.parse(res.text));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const calculateCreditScore = async () => {
        setLoading(true);
        // Simulated credit scoring logic based on "Upstart" concept (using alternative data)
        const prompt = `
            Act as a Smart Credit Scoring AI (like Upstart).
            Calculate a "Financial Health Score" (300-850) based on these metrics (simulated):
            - Transaction Count: ${transactions.length}
            - Consistency: High
            - Savings Rate: Estimated 15%
            
            Output JSON: { "score": number, "rating": "Excellent"|"Good"|"Fair", "factors": ["string"] }
            Language: Persian.
        `;
        try {
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            setAnalysis(JSON.parse(res.text));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-400"/> نگهبان ریسک
                </h4>
                <div className="flex bg-slate-900/50 rounded-lg p-1">
                    <button onClick={() => { setActiveTab('fraud'); setAnalysis(null); }} className={`p-1.5 rounded-md transition-colors ${activeTab === 'fraud' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><LockClosedIcon className="w-4 h-4"/></button>
                    <button onClick={() => { setActiveTab('credit'); setAnalysis(null); }} className={`p-1.5 rounded-md transition-colors ${activeTab === 'credit' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><ChartBarIcon className="w-4 h-4"/></button>
                </div>
            </div>

            <div className="min-h-[150px] flex flex-col justify-center">
                {!analysis && !loading && (
                    <div className="text-center">
                        <p className="text-sm text-slate-400 mb-4">
                            {activeTab === 'fraud' ? 'بررسی امنیت تراکنش‌ها با هوش مصنوعی' : 'محاسبه امتیاز اعتباری هوشمند (مدل Upstart)'}
                        </p>
                        <button onClick={activeTab === 'fraud' ? analyzeFraud : calculateCreditScore} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg">
                            {activeTab === 'fraud' ? 'اسکن تراکنش‌ها' : 'محاسبه امتیاز'}
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="text-center text-emerald-400">
                        <SparklesIcon className="w-8 h-8 animate-spin mx-auto mb-2"/>
                        <span className="text-xs font-bold">در حال تحلیل هوشمند...</span>
                    </div>
                )}

                {analysis && !loading && activeTab === 'fraud' && (
                    <div className="animate-fadeIn">
                        <div className={`p-3 rounded-xl mb-3 flex items-center gap-3 ${analysis.status === 'Clean' ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                            {analysis.status === 'Clean' ? <CheckCircleIcon className="w-6 h-6 text-emerald-400"/> : <XMarkIcon className="w-6 h-6 text-red-400"/>}
                            <div>
                                <p className="font-bold text-white">{analysis.status === 'Clean' ? 'وضعیت امن' : 'هشدار امنیتی'}</p>
                                <p className="text-xs text-slate-300">امتیاز ریسک: {analysis.risk_score}/100</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">{analysis.message}</p>
                    </div>
                )}

                {analysis && !loading && activeTab === 'credit' && (
                    <div className="animate-fadeIn text-center">
                        <div className="relative w-32 h-32 mx-auto mb-3 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="#1e293b" strokeWidth="8" fill="none" />
                                <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray={351} strokeDashoffset={351 - (351 * (analysis.score - 300) / 550)} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{analysis.score}</span>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase">{analysis.rating}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {analysis.factors.map((f: string, i: number) => <span key={i} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300">{f}</span>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN VIEW ---
export const FinancialView: React.FC<FinancialViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'market' | 'advisor' | 'risk'>('dashboard');
    const transactions = userData.transactions || [];
    const accounts = userData.financialAccounts || [];

    // --- Data for Overview ---
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    return (
        <div className="fixed inset-0 z-50 bg-[#020617] text-slate-200 font-[Vazirmatn] flex flex-col overflow-hidden animate-fadeIn">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative z-20 px-6 pt-6 pb-4 flex justify-between items-center bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                        <FinanceIcon className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">فرماندهی مالی AI</h2>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">FinTech OS 2025</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>

            {/* Tabs */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-[#020617]/50 backdrop-blur-sm z-10">
                {[
                    { id: 'dashboard', label: 'داشبورد', icon: CreditCardIcon },
                    { id: 'market', label: 'هوش بازار', icon: GlobeAltIcon },
                    { id: 'advisor', label: 'روبو ادوایزر', icon: BriefcaseIcon },
                    { id: 'risk', label: 'نگهبان ریسک', icon: ShieldCheckIcon },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/30' : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800'}`}
                    >
                        <tab.icon className="w-4 h-4"/>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto px-4 pb-32 relative z-10 scrollbar-hide pt-4 space-y-6">
                
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Hero Card */}
                        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <div className="relative z-10 text-center py-4">
                                <p className="text-sm text-slate-400 mb-2 font-medium uppercase tracking-wider">مجموع دارایی‌ها</p>
                                <h3 className="text-5xl font-black text-white tracking-tighter mb-6 drop-shadow-lg">
                                    {formatCurrency(totalBalance)} <span className="text-lg font-medium text-slate-500 align-top">تومان</span>
                                </h3>
                                <div className="flex justify-center gap-4">
                                    <div className="bg-indigo-900/30 border border-indigo-500/30 px-4 py-2 rounded-xl flex flex-col items-center">
                                        <span className="text-[10px] text-indigo-300 font-bold">امتیاز سلامت مالی</span>
                                        <span className="text-xl font-black text-white">۷۸۰</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <MarketIntelligence />
                        <SMSParser onParse={(txs) => console.log(txs)} />
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="space-y-6 animate-fadeIn">
                        <MarketWatch />
                        <MarketIntelligence />
                        <div className="bg-slate-800/40 p-5 rounded-[2rem] border border-white/10">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><DocumentScannerIcon className="w-5 h-5 text-slate-400"/> اخبار و تحلیل‌ها</h4>
                            <p className="text-sm text-slate-400">بخش اخبار هوشمند در آپدیت بعدی اضافه می‌شود.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'advisor' && (
                    <div className="space-y-6 animate-fadeIn">
                        <LiveFinancialAdvisor />
                        <RoboAdvisor />
                        <LoanCalculator />
                    </div>
                )}

                {activeTab === 'risk' && (
                    <div className="space-y-6 animate-fadeIn">
                        <RiskGuard transactions={transactions} />
                        <div className="bg-slate-800/40 p-5 rounded-[2rem] border border-white/10">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><CalculatorIcon className="w-5 h-5 text-blue-400"/> مشاور مالیاتی (ZeroTax AI)</h4>
                            <p className="text-sm text-slate-400">این ماژول برای محاسبه خودکار مالیات در آینده فعال خواهد شد.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
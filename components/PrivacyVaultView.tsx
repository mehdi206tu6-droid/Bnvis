
import React, { useState, useRef } from 'react';
import { OnboardingData, EncryptedBackup, Note, GratitudeEntry } from '../types';
import { ShieldCheckIcon, LockClosedIcon, LockOpenIcon, KeyIcon, ArrowPathIcon, DocumentTextIcon } from './icons';
import AiAgentRunner from './AiAgentRunner';
import { agents } from '../lib/agents';

interface PrivacyVaultViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const PRIVACY_AGENT_ID = 'privacy-advisor';

// --- Crypto Utilities ---

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(data: any, password: string): Promise<EncryptedBackup> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
    );

    // Convert buffers to Base64 strings for storage/transport
    const cipherArray = new Uint8Array(cipherBuffer);
    const cipherText = btoa(String.fromCharCode(...cipherArray));
    const saltText = btoa(String.fromCharCode(...salt));
    const ivText = btoa(String.fromCharCode(...iv));

    return {
        data: cipherText,
        iv: ivText,
        salt: saltText,
        version: 1
    };
}

async function decryptData(backup: EncryptedBackup, password: string): Promise<any> {
    const salt = Uint8Array.from(atob(backup.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(backup.iv), c => c.charCodeAt(0));
    const cipherData = Uint8Array.from(atob(backup.data), c => c.charCodeAt(0));
    
    const key = await deriveKey(password, salt);
    
    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            cipherData
        );
        
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(decryptedBuffer);
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error("رمز عبور اشتباه است یا فایل خراب شده است.");
    }
}


// --- Component ---

const PrivacyVaultView: React.FC<PrivacyVaultViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [mode, setMode] = useState<'dashboard' | 'audit' | 'backup' | 'restore'>('dashboard');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const privacyAgent = agents.find(a => a.id === PRIVACY_AGENT_ID);

    const handleBackup = async () => {
        if (!password) {
            setStatus("لطفا رمز عبور را وارد کنید.");
            return;
        }
        setStatus("در حال رمزنگاری داده‌ها...");
        
        try {
            // Gather all data
            const journalNotes: Note[] = JSON.parse(localStorage.getItem('benvis_journal') || '[]');
            const gratitudeEntries: GratitudeEntry[] = JSON.parse(localStorage.getItem('benvis_gratitude_journal') || '[]');
            
            // We can grab daily habits too if needed, but keeping it simple for now to userData + journals
            const fullExport = {
                userData,
                journalNotes,
                gratitudeEntries,
                timestamp: new Date().toISOString()
            };

            const encrypted = await encryptData(fullExport, password);
            
            const blob = new Blob([JSON.stringify(encrypted)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `benvis-backup-${new Date().toISOString().split('T')[0]}.benvis`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setStatus("پشتیبان رمزنگاری شده دانلود شد.");
            setPassword('');
        } catch (e) {
            console.error(e);
            setStatus("خطا در ایجاد پشتیبان.");
        }
    };

    const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                const backup: EncryptedBackup = JSON.parse(content);
                // Store pending backup in state or just try decrypt immediately if password is set
                // Here assuming user enters password first or during restore flow
                if(!password) {
                    setStatus("لطفا ابتدا رمز عبور فایل را وارد کنید و دوباره تلاش کنید.");
                    return;
                }
                
                setStatus("در حال رمزگشایی...");
                const decrypted = await decryptData(backup, password);
                
                if (decrypted.userData) {
                    if(window.confirm("رمزگشایی موفق بود. آیا می‌خواهید داده‌های فعلی را جایگزین کنید؟ این عملیات غیرقابل بازگشت است.")) {
                        onUpdateUserData(decrypted.userData);
                        if(decrypted.journalNotes) localStorage.setItem('benvis_journal', JSON.stringify(decrypted.journalNotes));
                        if(decrypted.gratitudeEntries) localStorage.setItem('benvis_gratitude_journal', JSON.stringify(decrypted.gratitudeEntries));
                        
                        setStatus("داده‌ها با موفقیت بازیابی شدند.");
                        alert("بازیابی موفقیت‌آمیز بود.");
                        onClose();
                    }
                } else {
                    setStatus("فایل پشتیبان معتبر نیست.");
                }

            } catch (err) {
                console.error(err);
                setStatus("رمز عبور اشتباه است یا فایل نامعتبر می‌باشد.");
            }
        };
        reader.readAsText(file);
    };

    const renderDashboard = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="p-6 bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-800/50 rounded-2xl text-center">
                <ShieldCheckIcon className="w-16 h-16 mx-auto text-emerald-400 mb-4"/>
                <h3 className="text-xl font-bold text-white">صندوق امن حریم خصوصی</h3>
                <p className="text-slate-400 mt-2 text-sm">داده‌های شما فقط در دستگاه شما ذخیره می‌شوند. با استفاده از این ابزار، می‌توانید آن‌ها را رمزنگاری کرده و پشتیبان بگیرید.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setMode('audit')} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-4 hover:bg-slate-800 transition-colors group">
                    <div className="p-3 bg-slate-700 rounded-lg group-hover:bg-violet-600/20 group-hover:text-violet-400 transition-colors">
                        <DocumentTextIcon className="w-6 h-6"/>
                    </div>
                    <div className="text-right flex-grow">
                        <h4 className="font-bold text-slate-200">مشاور امنیت هوشمند</h4>
                        <p className="text-xs text-slate-400">دریافت برنامه امنیت داده شخصی‌سازی شده</p>
                    </div>
                    <ArrowPathIcon className="w-5 h-5 text-slate-500 transform rotate-180"/>
                </button>

                <button onClick={() => setMode('backup')} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-4 hover:bg-slate-800 transition-colors group">
                    <div className="p-3 bg-slate-700 rounded-lg group-hover:bg-emerald-600/20 group-hover:text-emerald-400 transition-colors">
                        <LockClosedIcon className="w-6 h-6"/>
                    </div>
                    <div className="text-right flex-grow">
                        <h4 className="font-bold text-slate-200">پشتیبان‌گیری رمزنگاری شده</h4>
                        <p className="text-xs text-slate-400">دانلود فایل امن با رمزنگاری نظامی (AES-GCM)</p>
                    </div>
                    <ArrowPathIcon className="w-5 h-5 text-slate-500 transform rotate-180"/>
                </button>

                <button onClick={() => setMode('restore')} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-4 hover:bg-slate-800 transition-colors group">
                    <div className="p-3 bg-slate-700 rounded-lg group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                        <LockOpenIcon className="w-6 h-6"/>
                    </div>
                    <div className="text-right flex-grow">
                        <h4 className="font-bold text-slate-200">بازیابی اطلاعات</h4>
                        <p className="text-xs text-slate-400">بازگرداندن اطلاعات از فایل پشتیبان</p>
                    </div>
                    <ArrowPathIcon className="w-5 h-5 text-slate-500 transform rotate-180"/>
                </button>
            </div>
        </div>
    );

    const renderBackupRestore = (isRestore: boolean) => (
        <div className="space-y-6 animate-fadeIn">
             <div className="text-center">
                {isRestore ? <LockOpenIcon className="w-12 h-12 mx-auto text-blue-400 mb-4"/> : <LockClosedIcon className="w-12 h-12 mx-auto text-emerald-400 mb-4"/>}
                <h3 className="text-xl font-bold text-white">{isRestore ? 'بازیابی اطلاعات' : 'ایجاد پشتیبان امن'}</h3>
                <p className="text-slate-400 mt-2 text-sm">
                    {isRestore 
                        ? 'رمز عبوری که هنگام ایجاد فایل پشتیبان تعیین کرده‌اید را وارد کنید.' 
                        : 'یک رمز عبور قوی انتخاب کنید. این رمز تنها راه بازگشایی فایل شما خواهد بود.'}
                </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-2">رمز عبور {isRestore ? 'فایل' : 'جدید'}</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                            placeholder="••••••••"
                        />
                        <KeyIcon className="w-5 h-5 text-slate-500 absolute left-3 top-3.5"/>
                    </div>
                </div>

                {status && <p className={`text-sm text-center ${status.includes('خطا') || status.includes('اشتباه') ? 'text-red-400' : 'text-emerald-400'}`}>{status}</p>}

                {isRestore ? (
                    <div className="space-y-3">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-colors"
                        >
                            انتخاب فایل پشتیبان (.benvis)
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleRestoreFileChange} 
                            accept=".benvis,.json" 
                            className="hidden" 
                        />
                    </div>
                ) : (
                    <button 
                        onClick={handleBackup}
                        disabled={!password}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        دانلود فایل پشتیبان
                    </button>
                )}
            </div>
            
            <button onClick={() => { setMode('dashboard'); setStatus(''); setPassword(''); }} className="w-full text-slate-400 hover:text-white text-sm">بازگشت</button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-[var(--radius-card)] p-5 w-full max-w-md h-[85vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-300">حریم خصوصی و امنیت</h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-1">
                    {mode === 'dashboard' && renderDashboard()}
                    {mode === 'backup' && renderBackupRestore(false)}
                    {mode === 'restore' && renderBackupRestore(true)}
                    {mode === 'audit' && privacyAgent && (
                        <AiAgentRunner 
                            agent={privacyAgent} 
                            onBack={() => setMode('dashboard')} 
                            userData={userData} 
                            onUpdateUserData={onUpdateUserData} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrivacyVaultView;


import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, Transaction, TransactionCategory, TransactionType, FinancialAccount, Budget } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
    PlusIcon, TrashIcon, PencilIcon, SparklesIcon, ChartPieIcon, 
    ArrowUpCircleIcon, ArrowDownCircleIcon, ChartBarIcon, FinanceIcon, 
    CreditCardIcon, ReceiptPercentIcon, DocumentTextIcon, DocumentChartBarIcon,
    ArrowLeftIcon, XMarkIcon, BriefcaseIcon, Squares2X2Icon
} from './icons';
import IncomeAnalysisView from './IncomeAnalysisView';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f43f5e', '#f97316', '#eab308', '#14b8a6', '#ec4899', '#64748b'];

interface FinancialViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

// --- SUB-COMPONENTS ---

const OverviewTab: React.FC<{ userData: OnboardingData }> = ({ userData }) => {
    const transactions: Transaction[] = userData.transactions || [];
    const transactionCategories: TransactionCategory[] = userData.transactionCategories || [];
    const financialAccounts: FinancialAccount[] = userData.financialAccounts || [];
    
    const monthlySummary = useMemo(() => {
        const now = new Date();
        const currentMonthTxs = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        });
        const income = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        
        const expensesByCategory = currentMonthTxs
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const categoryName = transactionCategories.find(c => c.id === t.categoryId)?.name || 'سایر';
                acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
                return acc;
            }, {} as Record<string, number>);

        return { income, expenses, expensesByCategory };
    }, [transactions, transactionCategories]);

    const totalExpenses = monthlySummary.expenses;
    const sortedCategories = Object.entries(monthlySummary.expensesByCategory).sort((a, b) => Number(b[1]) - Number(a[1]));

    let cumulativePercent = 0;
    const conicGradient = sortedCategories.map(([_, amount], index) => {
        const percent = totalExpenses > 0 ? (Number(amount) / totalExpenses) * 100 : 0;
        const color = COLORS[index % COLORS.length];
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        const endPercent = cumulativePercent;
        return `${color} ${startPercent}% ${endPercent}%`;
    }).join(', ');
    
    const totalBalance = financialAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    return (
        <div className="space-y-6 pb-32 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800/50 border border-green-500/20 p-6 rounded-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">درآمد ماه</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(monthlySummary.income)} <span className="text-sm font-normal text-slate-400">تومان</span></p>
                </div>
                <div className="bg-slate-800/50 border border-red-500/20 p-6 rounded-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">هزینه ماه</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(totalExpenses)} <span className="text-sm font-normal text-slate-400">تومان</span></p>
                </div>
                 <div className="bg-slate-800/50 border border-blue-500/20 p-6 rounded-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">موجودی کل</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(totalBalance)} <span className="text-sm font-normal text-slate-400">تومان</span></p>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="font-bold mb-6 text-center text-slate-300">تفکیک هزینه‌های ماه</h3>
                    <div className="flex justify-center items-center my-4">
                         <div className="relative w-56 h-56">
                            <div className="absolute inset-0 rounded-full transition-all duration-1000" style={{ background: `conic-gradient(${conicGradient || '#374151 0% 100%'})` }}></div>
                            <div className="absolute inset-3 bg-[#0a0f1c] rounded-full flex flex-col items-center justify-center shadow-inner">
                                <span className="text-xs text-slate-500 mb-1">جمع هزینه‌ها</span>
                                <span className="font-bold text-xl text-white">{formatCurrency(totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                     <h3 className="font-bold mb-4 text-slate-300">بیشترین مخارج</h3>
                     <div className="space-y-4">
                        {sortedCategories.length === 0 ? <p className="text-center text-slate-500 py-4">هنوز هزینه‌ای ثبت نشده است.</p> :
                        sortedCategories.slice(0, 5).map(([category, amount], index) => {
                            const percent = totalExpenses > 0 ? (Number(amount) / totalExpenses) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-semibold text-slate-200">{category}</span>
                                        <span className="text-slate-400">{formatCurrency(Number(amount))}</span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                                        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    </div>
                                </div>
                            )
                        })}
                     </div>
                </div>
            </div>
        </div>
    );
};

const TransactionFormModal: React.FC<{
    tx: Transaction | null;
    categories: TransactionCategory[];
    accounts: FinancialAccount[];
    onSave: (tx: Transaction) => void;
    onClose: () => void;
}> = ({ tx, categories, accounts, onSave, onClose }) => {
    const [type, setType] = useState<TransactionType>(tx?.type || 'expense');
    const [amount, setAmount] = useState(tx?.amount || 0);
    const [description, setDescription] = useState(tx?.description || '');
    const [categoryId, setCategoryId] = useState(tx?.categoryId || '');
    const [accountId, setAccountId] = useState(tx?.accountId || (accounts.length > 0 ? accounts[0].id : ''));
    const [date, setDate] = useState(tx?.date || new Date().toISOString().split('T')[0]);

    const filteredCategories = categories.filter(c => c.type === type);

    useEffect(() => {
        if (!filteredCategories.some(c => c.id === categoryId)) {
            setCategoryId(filteredCategories.length > 0 ? filteredCategories[0].id : '');
        }
    }, [type, categoryId, filteredCategories]);

    const handleSave = () => {
        if (!amount || !description || !categoryId || !accountId) return;
        onSave({
            id: tx?.id || `tx-${Date.now()}`,
            type,
            amount,
            description,
            categoryId,
            accountId,
            date
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-white">{tx ? 'ویرایش تراکنش' : 'تراکنش جدید'}</h2>
                <div className="space-y-4">
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setType('expense')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-red-500/20 text-red-400 shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}>هزینه</button>
                        <button onClick={() => setType('income')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-green-500/20 text-green-400 shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}>درآمد</button>
                    </div>
                    <div className="relative">
                        <input type="number" placeholder="0" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center text-2xl font-bold text-white focus:ring-2 focus:ring-green-500 outline-none" />
                        <span className="absolute left-4 top-5 text-xs text-slate-500 font-bold">تومان</span>
                    </div>
                    <input type="text" placeholder="بابت... (مثلا: خرید شام)" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white" />
                    <div className="grid grid-cols-2 gap-3">
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white outline-none">
                            <option value="">انتخاب دسته‌بندی</option>
                            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm text-white outline-none">
                             <option value="">انتخاب حساب</option>
                             {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white text-center" />
                </div>
                <div className="mt-8 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold hover:bg-slate-600 transition-colors">لغو</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20">ذخیره</button>
                </div>
            </div>
        </div>
    );
};

const TransactionsTab: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    const transactions: Transaction[] = userData.transactions || [];
    const transactionCategories: TransactionCategory[] = userData.transactionCategories || [];
    const financialAccounts: FinancialAccount[] = userData.financialAccounts || [];

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const openForm = (tx: Transaction | null = null) => {
        setEditingTx(tx);
        setIsFormOpen(true);
    };

    const handleSave = (tx: Transaction) => {
        let updatedTransactions;
        
        if (editingTx) { // Update
            const oldTx = transactions.find(t => t.id === tx.id)!;
            const oldBalanceChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            const newBalanceChange = tx.type === 'income' ? tx.amount : -tx.amount;
            
            const updatedAccounts = financialAccounts.map(acc => {
                let balance = acc.balance;
                if (acc.id === oldTx.accountId) {
                    balance += oldBalanceChange;
                }
                if (acc.id === tx.accountId) {
                    balance += newBalanceChange;
                }
                return { ...acc, balance };
            });
            
            updatedTransactions = transactions.map(t => t.id === tx.id ? tx : t);
            onUpdateUserData({ ...userData, transactions: updatedTransactions, financialAccounts: updatedAccounts });

        } else { // Create
            const balanceChange = tx.type === 'income' ? tx.amount : -tx.amount;
            updatedTransactions = [...transactions, tx];
             const updatedAccounts = financialAccounts.map(acc => {
                if (acc.id === tx.accountId) {
                    return { ...acc, balance: acc.balance + balanceChange };
                }
                return acc;
            });
             onUpdateUserData({ ...userData, transactions: updatedTransactions, financialAccounts: updatedAccounts });
        }

        setIsFormOpen(false);
        setEditingTx(null);
    };
    
     const handleDelete = (txId: string) => {
        if (!window.confirm("آیا از حذف این تراکنش مطمئن هستید؟")) return;
        const txToDelete = transactions.find(t => t.id === txId);
        if (!txToDelete) return;
        
        const balanceChange = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
        const updatedAccounts = financialAccounts.map(acc => {
            if (acc.id === txToDelete.accountId) {
                return { ...acc, balance: acc.balance + balanceChange };
            }
            return acc;
        });
        
        onUpdateUserData({
            ...userData,
            transactions: transactions.filter(t => t.id !== txId),
            financialAccounts: updatedAccounts
        });
    };

    const groupedTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .reduce((acc, tx) => {
                const date = tx.date;
                if (!acc[date]) acc[date] = [];
                acc[date].push(tx);
                return acc;
            }, {} as Record<string, Transaction[]>);
    }, [transactions]);

    return (
        <div className="pb-32 animate-fadeIn">
            {isFormOpen && <TransactionFormModal tx={editingTx} categories={transactionCategories} accounts={financialAccounts} onSave={handleSave} onClose={() => setIsFormOpen(false)} />}
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-bold text-lg text-white">تراکنش‌ها</h3>
                <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl font-bold hover:bg-green-600/30 transition-all shadow-lg shadow-green-900/20">
                    <PlusIcon className="w-5 h-5"/>
                    <span>جدید</span>
                </button>
            </div>
            <div className="space-y-6">
                {Object.keys(groupedTransactions).length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <DocumentTextIcon className="w-16 h-16 mx-auto mb-2"/>
                        <p>تراکنشی یافت نشد.</p>
                    </div>
                )}
                {Object.entries(groupedTransactions).map(([date, txs]: [string, Transaction[]]) => (
                    <div key={date}>
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                {new Date(date).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                            <div className="h-[1px] bg-slate-800 flex-grow"></div>
                        </div>
                        <div className="space-y-3">
                            {txs.map(tx => {
                                const category = transactionCategories.find(c => c.id === tx.categoryId);
                                const account = financialAccounts.find(a => a.id === tx.accountId);
                                const isExpense = tx.type === 'expense';
                                return (
                                    <div key={tx.id} className="bg-slate-800/40 border border-slate-800 hover:border-slate-600 p-4 rounded-2xl flex justify-between items-center transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpense ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                {isExpense ? <ArrowDownCircleIcon className="w-6 h-6"/> : <ArrowUpCircleIcon className="w-6 h-6"/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{tx.description}</p>
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                                    <span>{category?.name || 'عمومی'}</span>
                                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                    <span>{account?.name || 'نقدی'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold font-mono text-lg ${isExpense ? 'text-white' : 'text-green-400'}`}>
                                                {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </p>
                                            <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openForm(tx)} className="text-slate-500 hover:text-blue-400"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(tx.id)} className="text-slate-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AccountsTab: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    return (
      <div className="pb-32 animate-fadeIn">
        <h3 className="font-bold mb-6 text-lg px-2">کیف پول و حساب‌ها</h3>
        <div className="grid gap-4">
          {(userData.financialAccounts || []).map(acc => (
            <div key={acc.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <CreditCardIcon className="w-5 h-5 text-slate-400"/>
                    <p className="font-bold text-lg text-white">{acc.name}</p>
                </div>
                <p className="text-xs text-slate-400 font-mono tracking-wider opacity-70">**** **** **** 1234</p>
              </div>
              <div className="text-left relative z-10">
                  <p className="text-sm text-slate-400 mb-1">موجودی</p>
                  <p className="text-xl font-black text-white">{formatCurrency(acc.balance)} <span className="text-xs font-normal text-slate-500">تومان</span></p>
              </div>
            </div>
          ))}
          <button className="w-full py-4 border-2 border-dashed border-slate-700 text-slate-500 rounded-2xl hover:bg-slate-800/50 hover:border-slate-600 transition-all flex flex-col items-center justify-center gap-2">
                <PlusIcon className="w-6 h-6"/>
                <span className="font-bold text-sm">افزودن حساب جدید</span>
          </button>
        </div>
      </div>
    );
};

const ToolsTab: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    const [activeTool, setActiveTool] = useState<'menu' | 'sms' | 'income' | 'budget'>('menu');

    if (activeTool === 'sms') {
        return (
            <div className="pb-32 animate-fadeIn">
                <button onClick={() => setActiveTool('menu')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"><ArrowLeftIcon className="w-5 h-5"/> بازگشت</button>
                <SmsParserTab userData={userData} onUpdateUserData={onUpdateUserData} />
            </div>
        );
    }
    if (activeTool === 'income') {
        return (
            <div className="pb-32 animate-fadeIn">
                <button onClick={() => setActiveTool('menu')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"><ArrowLeftIcon className="w-5 h-5"/> بازگشت</button>
                <IncomeAnalysisView userData={userData} onUpdateUserData={onUpdateUserData} />
            </div>
        );
    }
    if (activeTool === 'budget') {
        return (
            <div className="pb-32 animate-fadeIn">
                <button onClick={() => setActiveTool('menu')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"><ArrowLeftIcon className="w-5 h-5"/> بازگشت</button>
                <div className="text-center py-20 text-slate-500">بخش بودجه‌بندی به زودی...</div>
            </div>
        );
    }

    return (
        <div className="pb-32 animate-fadeIn">
            <h3 className="font-bold text-lg mb-6 px-2">ابزارهای مالی</h3>
            <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setActiveTool('sms')} className="bg-slate-800/60 border border-slate-700 hover:bg-slate-800 hover:border-green-500/50 p-5 rounded-2xl flex items-center gap-4 transition-all group text-right">
                    <div className="p-3 bg-slate-700 rounded-xl text-green-400 group-hover:bg-green-500/20 transition-colors">
                        <SparklesIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">پردازشگر پیامک</h4>
                        <p className="text-sm text-slate-400 mt-1">تبدیل خودکار پیامک‌های بانکی به تراکنش</p>
                    </div>
                </button>

                <button onClick={() => setActiveTool('income')} className="bg-slate-800/60 border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 p-5 rounded-2xl flex items-center gap-4 transition-all group text-right">
                    <div className="p-3 bg-slate-700 rounded-xl text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                        <DocumentChartBarIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">تحلیل درآمد</h4>
                        <p className="text-sm text-slate-400 mt-1">بررسی پایداری شغلی و جریان‌های مالی</p>
                    </div>
                </button>

                <button onClick={() => setActiveTool('budget')} className="bg-slate-800/60 border border-slate-700 hover:bg-slate-800 hover:border-orange-500/50 p-5 rounded-2xl flex items-center gap-4 transition-all group text-right">
                    <div className="p-3 bg-slate-700 rounded-xl text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                        <ReceiptPercentIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">بودجه‌بندی</h4>
                        <p className="text-sm text-slate-400 mt-1">تعین سقف مخارج برای دسته‌های مختلف</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const SmsParserTab: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    const [smsText, setSmsText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parsedTxs, setParsedTxs] = useState<Omit<Transaction, 'id' | 'accountId'>[]>([]);

    const handleParse = async () => {
        if (!smsText.trim()) return;
        setIsLoading(true);

        const prompt = `You are a bank SMS transaction parser for a Persian-speaking user. Extract all transactions from the following SMS text. Identify the 'type' ('income' or 'expense'), 'amount' (as a number), and 'description'.
        SMS Text:
        ---
        ${smsText}
        ---
        Respond ONLY with a valid JSON array of transaction objects. The date for all transactions is today: ${new Date().toISOString().split('T')[0]}.`;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    date: { type: Type.STRING }
                }
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema }
            });
            
            const text = response.text;
            if (text) {
                try {
                    const parsed = JSON.parse(text.trim());
                    if (Array.isArray(parsed)) {
                        setParsedTxs(parsed);
                    } else {
                         alert('فرمت پاسخ معتبر نیست.');
                    }
                } catch (e) {
                    console.error("JSON parse error", e);
                    alert('خطا در خواندن پاسخ هوش مصنوعی.');
                }
            } else {
                alert('پاسخی از هوش مصنوعی دریافت نشد.');
            }
        } catch (error) {
            console.error(error);
            alert('خطا در پردازش پیامک‌ها.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTransaction = (tx: Omit<Transaction, 'id' | 'accountId'>) => {
        const defaultAccount = userData.financialAccounts?.[0]?.id || 'default-cash';
        const newTx: Transaction = {
            ...tx,
            id: `tx-${Date.now()}-${Math.random()}`,
            accountId: defaultAccount,
            categoryId: userData.transactionCategories?.[0]?.id || '' 
        };
        
        const balanceChange = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        const updatedAccounts = (userData.financialAccounts || []).map(acc => {
            if (acc.id === defaultAccount) {
                return { ...acc, balance: acc.balance + balanceChange };
            }
            return acc;
        });

        onUpdateUserData({
            ...userData,
            transactions: [...(userData.transactions || []), newTx],
            financialAccounts: updatedAccounts
        });
        
        setParsedTxs(prev => prev.filter(t => t !== tx));
    };
    
    return (
        <div>
            <h3 className="font-bold mb-4 text-white">پردازشگر هوشمند پیامک</h3>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-4">
                <textarea
                    value={smsText}
                    onChange={e => setSmsText(e.target.value)}
                    rows={6}
                    className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-sm resize-none"
                    placeholder="متن پیامک‌های بانکی خود را اینجا Paste کنید..."
                />
            </div>
            <button onClick={handleParse} disabled={isLoading} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all">
                {isLoading ? 'در حال تحلیل...' : 'استخراج تراکنش‌ها'}
            </button>
            
            {parsedTxs.length > 0 && (
                <div className="mt-6 space-y-3 animate-fadeIn">
                    <h4 className="font-bold text-slate-300 px-1">نتایج یافت شده</h4>
                    {parsedTxs.map((tx, index) => (
                        <div key={index} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                            <div>
                                <p className="font-bold text-white text-sm">{tx.description}</p>
                                <p className={`text-xs font-mono mt-1 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(tx.amount)} تومان</p>
                            </div>
                            <button onClick={() => handleAddTransaction(tx)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white transition-colors">
                                افزودن
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN VIEW ---

type Tab = 'overview' | 'transactions' | 'accounts' | 'tools';

export const FinancialView: React.FC<FinancialViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const NavButton: React.FC<{ id: Tab; label: string; icon: React.FC<{className?: string}> }> = ({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
            <button 
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center justify-center w-full py-3 gap-1.5 transition-all relative group ${isActive ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-green-500/20 -translate-y-3 shadow-lg shadow-green-900/20 ring-1 ring-green-500/50' : 'bg-transparent group-hover:bg-white/5'}`}>
                    <Icon className={`w-7 h-7 ${isActive ? 'fill-current' : ''}`} />
                </div>
                <span className={`text-xs font-bold absolute bottom-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{label}</span>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] text-slate-200 font-[Vazirmatn] flex flex-col overflow-hidden animate-fadeIn">
            {/* Background Ambient */}
            <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-green-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 px-6 pt-6 pb-2 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">خزانه‌داری</h2>
                    <p className="text-xs text-green-500 font-bold uppercase tracking-widest opacity-80">Financial OS</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-lg">
                    <FinanceIcon className="w-5 h-5 text-green-400"/>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto px-4 pt-4 relative z-10 scrollbar-hide pb-28">
                {activeTab === 'overview' && <OverviewTab userData={userData} />}
                {activeTab === 'transactions' && <TransactionsTab userData={userData} onUpdateUserData={onUpdateUserData} />}
                {activeTab === 'accounts' && <AccountsTab userData={userData} onUpdateUserData={onUpdateUserData} />}
                {activeTab === 'tools' && <ToolsTab userData={userData} onUpdateUserData={onUpdateUserData} />}
            </div>

            {/* Bottom Navigation Bar - Enhanced */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
                <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/20 rounded-[2rem] p-3 shadow-2xl flex items-center justify-between px-6">
                    <NavButton id="overview" label="نمای کلی" icon={ChartPieIcon} />
                    <NavButton id="transactions" label="تراکنش‌ها" icon={DocumentTextIcon} />
                    
                    {/* Center Home Button */}
                    <button 
                        onClick={onClose}
                        className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[#020617] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-105 -mt-8 relative z-10"
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>

                    <NavButton id="accounts" label="حساب‌ها" icon={CreditCardIcon} />
                    <NavButton id="tools" label="ابزارها" icon={BriefcaseIcon} />
                </div>
            </div>
        </div>
    );
};

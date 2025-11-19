
import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, Transaction, TransactionCategory, TransactionType, FinancialAccount, Budget } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { PlusIcon, TrashIcon, PencilIcon, SparklesIcon, ChartPieIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ChartBarIcon, FinanceIcon, CreditCardIcon, ReceiptPercentIcon, DocumentTextIcon, DocumentChartBarIcon } from './icons';
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-green-400">درآمد این ماه</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlySummary.income)} <span className="text-sm">تومان</span></p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-red-400">هزینه این ماه</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalExpenses)} <span className="text-sm">تومان</span></p>
                </div>
                 <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-blue-400">موجودی کل</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalBalance)} <span className="text-sm">تومان</span></p>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-bold mb-4 text-center">تفکیک هزینه‌های ماه</h3>
                    <div className="flex justify-center items-center">
                         <div className="relative w-48 h-48">
                            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${conicGradient || '#374151 0% 100%'})` }}></div>
                            <div className="absolute inset-2 bg-gray-900 rounded-full flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-400">جمع کل</span>
                                <span className="font-bold text-xl">{formatCurrency(totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                     <h3 className="font-bold mb-4">دسته‌بندی‌های برتر</h3>
                     <div className="space-y-3">
                        {sortedCategories.slice(0, 5).map(([category, amount], index) => {
                            const percent = totalExpenses > 0 ? (Number(amount) / totalExpenses) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold">{category}</span>
                                        <span className="text-gray-400">{formatCurrency(Number(amount))}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="h-2.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{tx ? 'ویرایش تراکنش' : 'تراکنش جدید'}</h2>
                <div className="space-y-4">
                    <div className="flex gap-2 bg-gray-700 p-1 rounded-full">
                        <button onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-semibold rounded-full ${type === 'expense' ? 'bg-red-500' : ''}`}>هزینه</button>
                        <button onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-semibold rounded-full ${type === 'income' ? 'bg-green-500' : ''}`}>درآمد</button>
                    </div>
                    <input type="number" placeholder="مبلغ (تومان)" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded-md" />
                    <input type="text" placeholder="توضیحات" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" />
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                        <option value="">انتخاب دسته‌بندی</option>
                        {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                         <option value="">انتخاب حساب</option>
                         {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" />
                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-2 bg-gray-600 rounded-md">لغو</button>
                    <button onClick={handleSave} className="flex-1 py-2 bg-violet-600 rounded-md">ذخیره</button>
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
        <div>
            {isFormOpen && <TransactionFormModal tx={editingTx} categories={transactionCategories} accounts={financialAccounts} onSave={handleSave} onClose={() => setIsFormOpen(false)} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">تاریخچه تراکنش‌ها</h3>
                <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded-md font-semibold hover:bg-violet-700">
                    <PlusIcon className="w-5 h-5"/>
                    <span>تراکنش جدید</span>
                </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {Object.entries(groupedTransactions).map(([date, txs]: [string, Transaction[]]) => (
                    <div key={date}>
                        <h4 className="font-semibold text-gray-400 mb-2">{new Date(date).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                        <div className="space-y-2">
                            {txs.map(tx => {
                                const category = transactionCategories.find(c => c.id === tx.categoryId);
                                const account = financialAccounts.find(a => a.id === tx.accountId);
                                const isExpense = tx.type === 'expense';
                                return (
                                    <div key={tx.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isExpense ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                                {isExpense ? <ArrowDownCircleIcon className="w-5 h-5 text-red-400"/> : <ArrowUpCircleIcon className="w-5 h-5 text-green-400"/>}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{tx.description}</p>
                                                <p className="text-xs text-gray-400">{category?.name || 'بدون دسته'} &bull; {account?.name || 'بدون حساب'}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(tx.amount)}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button onClick={() => openForm(tx)} className="text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
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
      <div>
        <h3 className="font-bold mb-4">حساب‌های شما</h3>
        <div className="space-y-3">
          {(userData.financialAccounts || []).map(acc => (
            <div key={acc.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{acc.name}</p>
                <p className="text-sm text-gray-400">{acc.type === 'bank' ? 'بانک' : (acc.type === 'card' ? 'کارت' : 'پول نقد')}</p>
              </div>
              <p className="text-xl font-bold">{formatCurrency(acc.balance)} <span className="text-sm">تومان</span></p>
            </div>
          ))}
        </div>
      </div>
    );
};

const BudgetsTab: React.FC<{ userData: OnboardingData, onUpdateUserData: (data: OnboardingData) => void }> = ({ userData, onUpdateUserData }) => {
    return <div className="text-center p-8 text-gray-400">بخش بودجه‌بندی به زودی اضافه خواهد شد.</div>;
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
            categoryId: userData.transactionCategories?.[0]?.id || '' // Default to first category, user should edit later
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
            <h3 className="font-bold mb-4">پردازشگر پیامک بانکی</h3>
            <p className="text-sm text-gray-400 mb-4">متن پیامک‌های بانکی خود را اینجا کپی کنید تا به صورت خودکار به تراکنش تبدیل شوند.</p>
            <textarea
                value={smsText}
                onChange={e => setSmsText(e.target.value)}
                rows={8}
                className="w-full bg-gray-700/80 p-3 rounded-lg"
                placeholder="مثال: برداشت ۱۲۰،۰۰۰ تومان از حساب شما در تاریخ ... بابت خرید از فروشگاه"
            />
            <button onClick={handleParse} disabled={isLoading} className="w-full mt-4 py-3 bg-violet-600 rounded-lg font-semibold disabled:bg-gray-600">
                {isLoading ? 'در حال پردازش...' : 'پردازش پیامک‌ها'}
            </button>
            
            {parsedTxs.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h4 className="font-bold text-slate-300">تراکنش‌های شناسایی شده</h4>
                    {parsedTxs.map((tx, index) => (
                        <div key={index} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{tx.description}</p>
                                <p className={`text-sm ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(tx.amount)} تومان</p>
                            </div>
                            <button onClick={() => handleAddTransaction(tx)} className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500">
                                افزودن
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const FinancialView: React.FC<FinancialViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'نمای کلی', icon: ChartPieIcon },
        { id: 'transactions', label: 'تراکنش‌ها', icon: DocumentTextIcon },
        { id: 'accounts', label: 'حساب‌ها', icon: CreditCardIcon },
        { id: 'budgets', label: 'بودجه‌ها', icon: ReceiptPercentIcon },
        { id: 'sms-parser', label: 'پردازش پیامک', icon: SparklesIcon },
        { id: 'income-analysis', label: 'تحلیل درآمد', icon: DocumentChartBarIcon }
    ];

    const renderTabContent = () => {
        switch(activeTab) {
            case 'transactions': return <TransactionsTab userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'accounts': return <AccountsTab userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'budgets': return <BudgetsTab userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'sms-parser': return <SmsParserTab userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'income-analysis': return <IncomeAnalysisView userData={userData} onUpdateUserData={onUpdateUserData} />;
            case 'overview':
            default:
                return <OverviewTab userData={userData} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 rounded-[var(--radius-card)] p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-green-300 flex items-center gap-2"><FinanceIcon className="w-6 h-6"/> مرکز مالی</h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="flex gap-1 bg-gray-800/50 p-1 rounded-[var(--radius-full)] mb-4 flex-shrink-0 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-[var(--radius-full)] transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                           <tab.icon className="w-5 h-5" />
                           <span>{tab.label}</span>
                        </button>
                    ))}
                 </div>
                
                <div className="overflow-y-auto pr-2 flex-grow">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

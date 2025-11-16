import React, { useState, useMemo, useEffect } from 'react';
import { OnboardingData, Transaction, TransactionCategory, TransactionType, FinancialAccount, Budget } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { PlusIcon, TrashIcon, PencilIcon, SparklesIcon, ChartPieIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ChartBarIcon, FinanceIcon, CreditCardIcon, ReceiptPercentIcon, DocumentTextIcon, DocumentChartBarIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f43f5e', '#f97316', '#eab308', '#14b8a6', '#ec4899', '#64748b'];

interface FinancialViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const AccountHistoryView: React.FC<{
    account: FinancialAccount;
    transactions: Transaction[];
    categories: TransactionCategory[];
    onClose: () => void;
}> = ({ account, transactions, categories, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => t.accountId === account.id)
            .filter(t => !startDate || t.date >= startDate)
            .filter(t => !endDate || t.date <= endDate)
            .filter(t => selectedCategory === 'all' || t.categoryId === selectedCategory)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, account.id, startDate, endDate, selectedCategory]);

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'بدون دسته';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] modal-backdrop">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col modal-panel">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">تاریخچه تراکنش‌های {account.name}</h2>
                        <p className="text-sm text-gray-400">موجودی فعلی: {formatCurrency(account.balance)} تومان</p>
                    </div>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" placeholder="از تاریخ" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" placeholder="تا تاریخ" />
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                        <option value="all">همه دسته‌بندی‌ها</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                
                <div className="overflow-y-auto space-y-2 pr-2">
                    {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                        <div key={t.id} className="bg-gray-800/60 p-3 rounded-md flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                {t.type === 'income' ? <ArrowUpCircleIcon className="w-8 h-8 text-green-400"/> : <ArrowDownCircleIcon className="w-8 h-8 text-red-400"/>}
                                <div>
                                    <p className="font-semibold">{t.description}</p>
                                    <p className="text-xs text-gray-400">{getCategoryName(t.categoryId)} | {new Date(t.date).toLocaleDateString('fa-IR')}</p>
                                </div>
                            </div>
                            <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.amount)} تومان</p>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-6">هیچ تراکنشی با این فیلترها پیدا نشد.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const FinancialView: React.FC<FinancialViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isAnalysisViewOpen, setIsAnalysisViewOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [historyAccount, setHistoryAccount] = useState<FinancialAccount | null>(null);

    const transactions = userData.transactions || [];
    const categories = userData.transactionCategories || [];
    const accounts = userData.financialAccounts || [];
    const budgets = userData.budgets || [];
    
    const handleUpdate = (update: Partial<OnboardingData>) => {
        onUpdateUserData({ ...userData, ...update });
    };

    const handleSaveTransaction = (transaction: Transaction) => {
        const updatedTransactions = editingTransaction
            ? transactions.map(t => t.id === transaction.id ? transaction : t)
            : [...transactions, transaction];
        
        // Update account balances
        const updatedAccounts = accounts.map(acc => {
            // FIX: Operator '+' cannot be applied to types 'unknown' and 'unknown'.
            // Initialize balance as a Number to ensure correct arithmetic operations.
            let newBalance = Number(acc.balance);
            // Revert old amount if editing
            if (editingTransaction && editingTransaction.accountId === acc.id) {
                 newBalance += editingTransaction.type === 'income' ? -Number(editingTransaction.amount) : Number(editingTransaction.amount);
            }
            // Apply new amount
            if (transaction.accountId === acc.id) {
                 newBalance += transaction.type === 'income' ? Number(transaction.amount) : -Number(transaction.amount);
            }
            return { ...acc, balance: newBalance };
        });

        handleUpdate({ transactions: updatedTransactions, financialAccounts: updatedAccounts });
        setIsTxModalOpen(false);
        setEditingTransaction(null);
    };
    
    const handleDeleteTransaction = (txToDelete: Transaction) => {
        if (window.confirm('آیا از حذف این تراکنش مطمئن هستید؟')) {
            const updatedTransactions = transactions.filter(t => t.id !== txToDelete.id);
            const updatedAccounts = accounts.map(acc => {
                 if (acc.id === txToDelete.accountId) {
                    // FIX: The left-hand side and right-hand side of an arithmetic operation must be of type 'number'.
                    // Explicitly cast balance and amount to numbers before performing arithmetic.
                    const newBalance = Number(acc.balance) + (txToDelete.type === 'income' ? -Number(txToDelete.amount) : Number(txToDelete.amount));
                    return { ...acc, balance: newBalance };
                }
                return acc;
            });
            handleUpdate({ transactions: updatedTransactions, financialAccounts: updatedAccounts });
        }
    };

    const tabs = [
        { id: 'overview', label: 'نمای کلی', icon: ChartBarIcon },
        { id: 'transactions', label: 'تراکنش‌ها', icon: FinanceIcon },
        { id: 'budgets', label: 'بودجه', icon: ReceiptPercentIcon },
        { id: 'accounts', label: 'حساب‌ها', icon: CreditCardIcon },
        { id: 'sms_analyzer', label: 'تحلیل پیامک', icon: DocumentTextIcon },
        { id: 'categories', label: 'دسته‌بندی‌ها', icon: ChartPieIcon },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 rounded-[var(--radius-card)] p-4 sm:p-6 w-full max-w-5xl max-h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">مرکز مالی حرفه‌ای</h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </div>
                 <div className="flex gap-1 bg-gray-800/50 p-1 rounded-[var(--radius-full)] mb-4 flex-shrink-0 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-[var(--radius-full)] transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--color-primary-500)] text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                           <tab.icon className="w-5 h-5" />
                           <span>{tab.label}</span>
                        </button>
                    ))}
                 </div>
                <div className="overflow-y-auto pr-2 flex-grow">
                    {activeTab === 'overview' && <OverviewTab userData={userData} onStartAnalysis={() => setIsAnalysisViewOpen(true)} />}
                    {activeTab === 'transactions' && <TransactionsTab transactions={transactions} categories={categories} accounts={accounts} onEdit={(t) => { setEditingTransaction(t); setIsTxModalOpen(true); }} onDelete={handleDeleteTransaction} onAdd={() => { setEditingTransaction(null); setIsTxModalOpen(true); }} />}
                    {activeTab === 'budgets' && <BudgetsTab budgets={budgets} categories={categories} transactions={transactions} onSave={(b) => handleUpdate({ budgets: b })} />}
                    {activeTab === 'accounts' && <AccountsTab accounts={accounts} onSave={(a) => handleUpdate({ financialAccounts: a })} onViewHistory={setHistoryAccount} />}
                    {activeTab === 'sms_analyzer' && <SmsAnalyzerTab categories={categories} onConfirm={(txs) => { handleUpdate({ transactions: [...transactions, ...txs]}) }} />}
                    {activeTab === 'categories' && <CategoriesTab categories={categories} onSave={(c) => handleUpdate({ transactionCategories: c })} />}
                </div>
                 {isTxModalOpen && <TransactionModal transaction={editingTransaction} categories={categories} accounts={accounts} onSave={handleSaveTransaction} onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }} />}
                 {historyAccount && <AccountHistoryView account={historyAccount} transactions={transactions} categories={categories} onClose={() => setHistoryAccount(null)} />}
            </div>
        </div>
    );
};

// --- TABS ---
const BudgetProgress: React.FC<{
    budget: Budget;
    transactions: Transaction[];
    categories: TransactionCategory[];
}> = ({ budget, transactions, categories }) => {
    const category = categories.find(c => c.id === budget.categoryId);
    if (!category) return null;

    const now = new Date();
    const currentMonthTxs = transactions.filter(t => {
        const tDate = new Date(t.date);
        return t.categoryId === budget.categoryId &&
               t.type === 'expense' &&
               tDate.getMonth() === now.getMonth() &&
               tDate.getFullYear() === now.getFullYear();
    });

    const spent = currentMonthTxs.reduce((sum, t) => sum + t.amount, 0);
    const progress = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{category.name}</span>
                <span className="text-xs text-gray-400">{formatCurrency(spent)} / {formatCurrency(budget.amount)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};
const SpendingPieChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        return <div className="text-center text-sm text-gray-400 py-8">داده‌ای برای نمایش نمودار وجود ندارد.</div>;
    }

    const getArcPath = (startAngle: number, endAngle: number, radius: number) => {
        const center = 50;
        const start = {
            x: center + radius * Math.cos(startAngle),
            y: center + radius * Math.sin(startAngle)
        };
        const end = {
            x: center + radius * Math.cos(endAngle),
            y: center + radius * Math.sin(endAngle)
        };
        const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} L ${center} ${center} Z`;
    };

    let cumulativeAngle = -Math.PI / 2; // Start from top
    const slices = Object.entries(data).map(([key, value], index) => {
        const percentage = value / total;
        const angle = percentage * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const endAngle = cumulativeAngle;

        return {
            key,
            value,
            percentage: percentage * 100,
            pathData: getArcPath(startAngle, endAngle, 50),
            color: COLORS[index % COLORS.length]
        };
    });

    return (
        <div>
            <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto">
                {slices.map(slice => (
                    <path key={slice.key} d={slice.pathData} fill={slice.color} />
                ))}
            </svg>
            <div className="mt-4 space-y-1 text-xs">
                {slices.map(slice => (
                    <div key={slice.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                            <span className="text-gray-300">{slice.key}</span>
                        </div>
                        <span className="font-semibold text-white">{slice.percentage.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; color?: string }> = ({ title, value, color }) => (
    <div className="bg-gray-800/50 p-4 rounded-[var(--radius-lg)]">
        <h4 className="text-sm text-gray-400">{title}</h4>
        <p className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</p>
    </div>
);

const OverviewTab: React.FC<{ userData: OnboardingData, onStartAnalysis: () => void; }> = ({ userData, onStartAnalysis }) => {
    const { transactions = [], transactionCategories: categories = [], budgets = [], financialAccounts = [] } = userData;
    const [health, setHealth] = useState<{ score: number; remark: string } | null>(null);
    const [isHealthLoading, setIsHealthLoading] = useState(false);
    const [healthError, setHealthError] = useState<string | null>(null);

    const monthlyData = useMemo(() => {
        const now = new Date();
        const currentMonthTxs = transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
        const income = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

        const spendingByCategory = currentMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => {
            const catName = categories.find(c => c.id === t.categoryId)?.name || 'متفرقه';
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        return { income, expenses, net: income - expenses, totalBudget, spendingByCategory };
    }, [transactions, budgets, categories]);
    
    const analyzeHealth = async () => {
        setIsHealthLoading(true);
        setHealth(null);
        setHealthError(null);
        const prompt = `You are a financial health analyst. Based on the user's summary data for the last 30 days, calculate a financial health score from 0 to 100 and provide a brief, one-sentence explanation in Persian. Consider income, expenses, net savings, and budget adherence. High savings and staying within budget is good. High spending relative to income is bad. Data: Total Income: ${monthlyData.income}, Total Expenses: ${monthlyData.expenses}, Total Budget: ${monthlyData.totalBudget}. Respond ONLY with a JSON object like: {\"score\": 85, \"remark\": \"شما به خوبی هزینه‌های خود را مدیریت می‌کنید و پس‌انداز مناسبی دارید.\"}`;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.INTEGER },
                            remark: { type: Type.STRING }
                        }
                    }
                }
            });
            // A safer way to parse potentially incomplete JSON responses
            const responseText = response.text.trim();
            const jsonMatch = responseText.match(/{[\s\S]*}/);
            if (!jsonMatch) throw new Error("Invalid JSON response from API.");
            
            const parsed = JSON.parse(jsonMatch[0]);
            setHealth(parsed);
        } catch (error: any) {
            console.error("Failed to fetch health score:", error);
            const errorMessage = error?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                setHealthError('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
            } else {
                setHealthError("خطا در تحلیل. لطفا دوباره تلاش کنید.");
            }
        } finally {
            setIsHealthLoading(false);
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);
    const totalBalance = useMemo(() => financialAccounts.reduce((sum, acc) => sum + acc.balance, 0), [financialAccounts]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="موجودی کل" value={`${formatCurrency(totalBalance)} تومان`} />
                <StatCard title="درآمد ماه" value={`${formatCurrency(monthlyData.income)} تومان`} color="text-green-400" />
                <StatCard title="هزینه ماه" value={`${formatCurrency(monthlyData.expenses)} تومان`} color="text-red-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 <div className="md:col-span-2 bg-gray-800/50 p-4 rounded-[var(--radius-lg)]">
                    <h4 className="font-bold mb-3">تفکیک هزینه‌ها</h4>
                    <SpendingPieChart data={monthlyData.spendingByCategory} />
                </div>
                <div className="md:col-span-3 bg-gray-800/50 p-4 rounded-[var(--radius-lg)]">
                    <h4 className="font-bold mb-3">وضعیت بودجه‌ها</h4>
                    <div className="space-y-3">
                         {budgets.length > 0 ? budgets.map(b => <BudgetProgress key={b.categoryId} budget={b} transactions={transactions} categories={categories} />) : <p className="text-center text-sm text-gray-400 py-4">هنوز بودجه‌ای تعریف نکرده‌اید.</p>}
                    </div>
                </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-lg)] p-4">
                {isHealthLoading ? (
                     <div className="flex items-center justify-center gap-4 animate-pulse">
                         <SparklesIcon className="w-8 h-8 text-[var(--color-primary-400)]"/>
                         <p className="font-semibold text-gray-400">در حال تحلیل وضعیت مالی شما...</p>
                    </div>
                ) : health ? (
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20">
                            <svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path><path className="text-[var(--color-primary-500)]" strokeDasharray={`${health.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path></svg>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">{health.score}</div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">نمره سلامت مالی</h4>
                            <p className="text-sm text-gray-300">{health.remark}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <h4 className="font-bold text-lg">نمره سلامت مالی</h4>
                        <p className="text-sm text-gray-400 my-2">با تحلیل هوشمند، وضعیت مالی خود را بسنجید.</p>
                        {healthError && <p className="text-sm text-red-400 mb-2">{healthError}</p>}
                        <button onClick={analyzeHealth} className="flex items-center justify-center gap-2 w-full sm:w-auto mx-auto px-6 py-2 bg-[var(--color-primary-700)] rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-primary-800)]">
                            <SparklesIcon className="w-5 h-5"/>
                            <span>تحلیل کن</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
const TransactionsTab: React.FC<{ transactions: Transaction[]; categories: TransactionCategory[]; accounts: FinancialAccount[]; onEdit: (t: Transaction) => void; onDelete: (t: Transaction) => void; onAdd: () => void; }> = ({ transactions, categories, accounts, onEdit, onDelete, onAdd }) => {
    const [filterAccount, setFilterAccount] = useState('all');
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => filterAccount === 'all' || t.accountId === filterAccount)
                           .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filterAccount]);

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'بدون دسته';
    const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'حذف شده';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                 <button onClick={onAdd} className="w-full sm:w-auto flex-grow flex items-center justify-center gap-2 py-3 bg-[var(--color-primary-700)] rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-primary-800)]">
                    <PlusIcon className="w-6 h-6" />
                    <span>افزودن تراکنش</span>
                </button>
                <select onChange={(e) => setFilterAccount(e.target.value)} value={filterAccount} className="w-full sm:w-48 bg-gray-700 p-3 rounded-md">
                    <option value="all">همه حساب‌ها</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
             <div className="space-y-2">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                    <div key={t.id} className="bg-gray-800/60 p-3 rounded-[var(--radius-md)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {t.type === 'income' ? <ArrowUpCircleIcon className="w-8 h-8 text-green-400"/> : <ArrowDownCircleIcon className="w-8 h-8 text-red-400"/>}
                            <div>
                                <p className="font-semibold">{t.description}</p>
                                <p className="text-xs text-gray-400">{getAccountName(t.accountId)} | {getCategoryName(t.categoryId)} | {new Date(t.date).toLocaleDateString('fa-IR')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.amount)}</p>
                             <button onClick={() => onEdit(t)} className="p-1 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                             <button onClick={() => onDelete(t)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 py-6">هیچ تراکنشی با این فیلتر پیدا نشد.</p>}
             </div>
        </div>
    );
};
const BudgetsTab: React.FC<{ budgets: Budget[]; categories: TransactionCategory[]; transactions: Transaction[]; onSave: (b: Budget[]) => void; }> = ({ budgets, categories, transactions, onSave }) => {
    const [editingBudgets, setEditingBudgets] = useState<Budget[]>(JSON.parse(JSON.stringify(budgets)));
    const [suggestion, setSuggestion] = useState<{ categoryId: string, amount: number } | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const expenseCategories = categories.filter(c => c.type === 'expense');

    const handleAmountChange = (categoryId: string, amount: number) => {
        const existing = editingBudgets.find(b => b.categoryId === categoryId);
        if (existing) {
            setEditingBudgets(editingBudgets.map(b => b.categoryId === categoryId ? { ...b, amount } : b));
        } else {
            setEditingBudgets([...editingBudgets, { categoryId, amount }]);
        }
    };

    const getBudgetAmount = (categoryId: string) => editingBudgets.find(b => b.categoryId === categoryId)?.amount || 0;

    const handleSmartSuggest = async (categoryId: string) => {
        setIsSuggesting(true);
        setSuggestion(null);
        const last60DaysTxs = transactions.filter(t => t.categoryId === categoryId && new Date(t.date) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)).map(t => t.amount);
        if (last60DaysTxs.length < 3) {
            alert("اطلاعات کافی برای پیشنهاد هوشمند وجود ندارد. حداقل ۳ تراکنش در ۲ ماه اخیر لازم است.");
            setIsSuggesting(false);
            return;
        }
        const prompt = `Based on recent spending for a category ([${last60DaysTxs.join(', ')}]), suggest a reasonable monthly budget. Respond ONLY with a JSON object: {\"suggestedAmount\": 500000}`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { suggestedAmount: { type: Type.INTEGER } } } }
            });
            const parsed = JSON.parse(response.text.trim());
            setSuggestion({ categoryId, amount: parsed.suggestedAmount });
        } catch (e: any) {
            console.error(e);
            const errorMessage = e?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                alert('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
            } else {
                alert('خطا در دریافت پیشنهاد هوشمند.');
            }
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="space-y-4">
            {expenseCategories.map(cat => (
                <div key={cat.id} className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">{cat.name}</label>
                        <button onClick={() => handleSmartSuggest(cat.id)} disabled={isSuggesting} className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50">
                            <SparklesIcon className="w-4 h-4" />
                            {isSuggesting ? '...' : 'پیشنهاد هوشمند'}
                        </button>
                    </div>
                     {suggestion?.categoryId === cat.id && (
                        <div className="bg-purple-500/10 p-2 rounded-md text-center text-sm my-2">
                           <span>پیشنهاد: {suggestion.amount.toLocaleString('fa-IR')} تومان. </span>
                           <button onClick={() => { handleAmountChange(cat.id, suggestion.amount); setSuggestion(null); }} className="font-bold text-purple-300">اعمال</button>
                        </div>
                    )}
                    <input type="number" value={getBudgetAmount(cat.id) || ''} onChange={e => handleAmountChange(cat.id, Number(e.target.value))} placeholder="مبلغ بودجه" className="w-full bg-gray-700 p-2 rounded-md mt-2" />
                </div>
            ))}
            <button onClick={() => onSave(editingBudgets.filter(b => b.amount > 0))} className="w-full py-3 bg-[var(--color-primary-700)] rounded-md font-semibold">ذخیره بودجه‌ها</button>
        </div>
    );
};
const AccountsTab: React.FC<{ accounts: FinancialAccount[]; onSave: (a: FinancialAccount[]) => void; onViewHistory: (acc: FinancialAccount) => void; }> = ({ accounts, onSave, onViewHistory }) => {
    const [editingAccounts, setEditingAccounts] = useState<FinancialAccount[]>(JSON.parse(JSON.stringify(accounts)));
    
    const handleUpdate = (id: string, update: Partial<FinancialAccount>) => {
        setEditingAccounts(editingAccounts.map(acc => acc.id === id ? {...acc, ...update} : acc));
    };
    
    const handleAdd = () => {
        setEditingAccounts([...editingAccounts, { id: `acc-${Date.now()}`, name: '', type: 'bank', balance: 0 }]);
    };

    const handleRemove = (id: string) => {
        setEditingAccounts(editingAccounts.filter(acc => acc.id !== id));
    }

    return (
        <div className="space-y-4">
            {editingAccounts.map(acc => (
                <div key={acc.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center bg-gray-800/50 p-3 rounded-lg">
                    <input value={acc.name} onChange={e => handleUpdate(acc.id, {name: e.target.value})} placeholder="نام حساب" className="col-span-2 md:col-span-1 bg-gray-700 p-2 rounded-md"/>
                    <select value={acc.type} onChange={e => handleUpdate(acc.id, {type: e.target.value as any})} className="bg-gray-700 p-2 rounded-md">
                        <option value="bank">بانک</option>
                        <option value="card">کارت</option>
                        <option value="cash">پول نقد</option>
                    </select>
                     <input value={acc.balance} onChange={e => handleUpdate(acc.id, {balance: Number(e.target.value)})} type="number" placeholder="موجودی اولیه" className="bg-gray-700 p-2 rounded-md"/>
                     <div className="flex items-center justify-end">
                        <button onClick={() => onViewHistory(acc)} title="مشاهده تاریخچه" className="text-gray-400 p-2 hover:text-white"><DocumentChartBarIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleRemove(acc.id)} className="p-2 text-red-400"><TrashIcon className="w-5 h-5"/></button>
                     </div>
                </div>
            ))}
            <button onClick={handleAdd} className="w-full border-2 border-dashed border-gray-600 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50">افزودن حساب</button>
            <button onClick={() => onSave(editingAccounts)} className="w-full py-3 bg-[var(--color-primary-700)] rounded-md font-semibold">ذخیره حساب‌ها</button>
        </div>
    );
};
const SmsAnalyzerTab: React.FC<{ categories: TransactionCategory[], onConfirm: (txs: Transaction[]) => void; }> = ({ categories, onConfirm }) => {
    const [smsText, setSmsText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [extracted, setExtracted] = useState<Omit<Transaction, 'id' | 'accountId' | 'categoryId' | 'date'>[]>([]);

    const handleAnalyze = async () => {
        if (!smsText.trim()) return;
        setIsLoading(true);
        setExtracted([]);
        const prompt = `You are an expert financial data extractor for Iranian bank SMS. Parse the following SMS messages. Extract amount, type (income or expense), and a probable description. Ignore non-transactional messages. Provide the output as a valid JSON array of objects. Each object should have keys: 'amount' (number), 'type' ('income' or 'expense'), 'description' (string). \n\nSMS:\n${smsText}`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                amount: { type: Type.INTEGER },
                                type: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        }
                    }
                }
            });
            const parsed = JSON.parse(response.text.trim());
            setExtracted(parsed);
        } catch (e: any) {
            console.error(e);
            const errorMessage = e?.message || '';
            if (errorMessage.includes("RESOURCE_EXHAUSTED")) {
                alert('محدودیت استفاده از سرویس. لطفا بعدا تلاش کنید.');
            } else {
                alert("خطا در تحلیل پیامک‌ها.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirm = () => {
        const newTransactions = extracted.map(e => ({
            ...e,
            id: `sms-${Date.now()}-${Math.random()}`,
            date: new Date().toISOString().split('T')[0],
            categoryId: categories.find(c => c.type === e.type)?.id || '',
            accountId: '' // User will need to set this
        })) as Transaction[];
        onConfirm(newTransactions);
        setExtracted([]);
        setSmsText('');
        alert(`${newTransactions.length} تراکنش با موفقیت برای افزودن آماده شد. لطفاً حساب و دسته‌بندی آن‌ها را در مودال ویرایش تکمیل کنید.`);
    };

    return (
        <div className="space-y-4">
            <textarea value={smsText} onChange={e => setSmsText(e.target.value)} rows={8} placeholder="پیامک‌های بانکی خود را اینجا کپی کنید..." className="w-full bg-gray-800 p-3 rounded-lg" />
            <button onClick={handleAnalyze} disabled={isLoading} className="w-full py-3 bg-blue-700 font-semibold rounded-lg disabled:bg-gray-500">{isLoading ? 'در حال تحلیل...' : 'تحلیل پیامک‌ها'}</button>
            {extracted.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-bold">تراکنش‌های شناسایی شده:</h4>
                    {extracted.map((t, i) => (
                        <div key={i} className="bg-gray-800 p-2 rounded-md flex justify-between">
                            <span>{t.description}</span>
                            <span className={t.type === 'income' ? 'text-green-400' : 'text-red-400'}>{t.amount.toLocaleString('fa-IR')} تومان</span>
                        </div>
                    ))}
                    <button onClick={handleConfirm} className="w-full py-3 bg-green-700 font-semibold rounded-lg">تایید و افزودن همه</button>
                </div>
            )}
        </div>
    );
};
const CategoriesTab: React.FC<{ categories: TransactionCategory[]; onSave: (cats: TransactionCategory[]) => void; }> = ({ categories, onSave }) => {
    const [editing, setEditing] = useState<TransactionCategory[]>(JSON.parse(JSON.stringify(categories)));
    
    const handleUpdate = (id: string, update: Partial<TransactionCategory>) => {
        setEditing(editing.map(c => c.id === id ? {...c, ...update} : c));
    };
    
    const handleAdd = (type: TransactionType) => {
        setEditing([...editing, {id: `cat-${Date.now()}`, name: '', type, color: '#ffffff'}]);
    };

    const handleRemove = (id: string) => {
        setEditing(editing.filter(c => c.id !== id));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['expense', 'income'] as TransactionType[]).map(type => (
                <div key={type} className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-lg">{type === 'expense' ? 'هزینه' : 'درآمد'}</h3>
                    <div className="space-y-2">
                        {editing.filter(c => c.type === type).map(cat => (
                            <div key={cat.id} className="flex items-center gap-2">
                                <input value={cat.name} onChange={e => handleUpdate(cat.id, {name: e.target.value})} className="flex-grow bg-gray-700 p-2 rounded-md"/>
                                <input value={cat.color} onChange={e => handleUpdate(cat.id, {color: e.target.value})} type="color" className="w-10 h-10 p-1 bg-gray-700 rounded-md"/>
                                <button onClick={() => handleRemove(cat.id)} className="p-2 text-red-400"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleAdd(type)} className="w-full mt-3 border-2 border-dashed border-gray-600 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50">افزودن دسته‌بندی</button>
                </div>
            ))}
             <button onClick={() => onSave(editing)} className="md:col-span-2 w-full py-3 bg-[var(--color-primary-700)] rounded-md font-semibold">ذخیره دسته‌بندی‌ها</button>
        </div>
    );
};

// --- SUB-COMPONENTS ---
const TransactionModal: React.FC<{
    transaction: Transaction | null;
    categories: TransactionCategory[];
    accounts: FinancialAccount[];
    onSave: (t: Transaction) => void;
    onClose: () => void;
}> = ({ transaction, categories, accounts, onSave, onClose }) => {
    const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
    const [amount, setAmount] = useState(transaction?.amount || 0);
    const [description, setDescription] = useState(transaction?.description || '');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
    const [accountId, setAccountId] = useState(transaction?.accountId || (accounts.length > 0 ? accounts[0].id : ''));

    const filteredCategories = categories.filter(c => c.type === type);

    useEffect(() => {
        if (!filteredCategories.some(c => c.id === categoryId)) {
            setCategoryId(filteredCategories[0]?.id || '');
        }
    }, [type, filteredCategories, categoryId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount > 0 && description.trim() && date && categoryId && accountId) {
            onSave({
                id: transaction?.id || `tx-${Date.now()}`,
                type, amount, description, date, categoryId, accountId
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md modal-panel">
                <h2 className="text-xl font-bold mb-4">{transaction ? 'ویرایش' : 'افزودن'} تراکنش</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="flex gap-2 bg-gray-700/50 p-1 rounded-full">
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-full ${type === 'expense' ? 'bg-red-500' : ''}`}>هزینه</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-full ${type === 'income' ? 'bg-green-500' : ''}`}>درآمد</button>
                    </div>
                    <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} placeholder="مبلغ" className="w-full bg-gray-700 p-2 rounded-md" required/>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات" className="w-full bg-gray-700 p-2 rounded-md" required/>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" required/>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" required>
                        <option value="" disabled>انتخاب دسته‌بندی</option>
                        {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" required>
                         <option value="" disabled>انتخاب حساب</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString('fa-IR')} تومان)</option>)}
                    </select>
                    <div className="flex gap-4">
                        <button type="submit" className="flex-1 py-2 bg-blue-700 rounded-md">ذخیره</button>
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-600 rounded-md">لغو</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FinancialView;
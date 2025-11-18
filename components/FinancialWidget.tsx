import React, { useMemo } from 'react';
import { OnboardingData } from '../types';
import { FinanceIcon } from './icons';

interface FinancialWidgetProps {
    userData: OnboardingData;
    onOpen: () => void;
}

const FinancialWidget: React.FC<FinancialWidgetProps> = ({ userData, onOpen }) => {
    const transactions = userData.transactions || [];
    const budgets = userData.budgets || [];

    const monthlySummary = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
        const budgetUsage = totalBudget > 0 ? Math.min(100, (expenses / totalBudget) * 100) : 0;

        const totalBalance = (userData.financialAccounts || []).reduce((sum, acc) => sum + Number(acc.balance), 0);


        return { income, expenses, budgetUsage, totalBudget, totalBalance };
    }, [transactions, budgets, userData.financialAccounts]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fa-IR').format(amount);
    };

    return (
        <button 
            onClick={onOpen} 
            className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-[var(--radius-card)] p-4 col-span-2 sm:col-span-1 text-right hover:bg-slate-800/80 transition-colors flex flex-col justify-between min-h-[140px]"
        >
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-green-300">مرکز مالی</h3>
                    <FinanceIcon className="w-6 h-6 text-green-400" />
                </div>
                <div className="space-y-2">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">هزینه ماه:</span>
                        <span className="font-bold text-red-400">{formatCurrency(monthlySummary.expenses)} تومان</span>
                    </div>
                    <div className="flex justify-between items-center text-base mt-2 pt-2 border-t border-slate-700">
                        <span className="text-slate-300 font-semibold">موجودی کل:</span>
                        <span className={`font-bold ${monthlySummary.totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {formatCurrency(monthlySummary.totalBalance)} تومان
                        </span>
                    </div>
                </div>
            </div>
            {monthlySummary.totalBudget > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-400">
                        <span>بودجه ماهانه</span>
                        <span>{monthlySummary.budgetUsage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${monthlySummary.budgetUsage}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </button>
    );
};

export default FinancialWidget;
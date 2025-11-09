
import React, { useState } from 'react';
import { TargetIcon, HabitsIcon, CogIcon, HomeIcon, ChartBarIcon, PlusIcon } from './icons';

type View = 'dashboard' | 'goals' | 'habits' | 'settings';

const DashboardScreen: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');

    const renderView = () => {
        switch (activeView) {
            case 'goals':
                return <GoalsView />;
            case 'habits':
                return <HabitsView />;
            case 'settings':
                return <SettingsView />;
            case 'dashboard':
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0B1A] flex flex-col text-white">
            <header className="p-4">
                <h1 className="text-2xl font-bold">داشبورد</h1>
                <p className="text-gray-400">خوش آمدید، روز خوبی داشته باشید!</p>
            </header>

            <main className="flex-grow p-4 overflow-y-auto">
                {renderView()}
            </main>

            <footer className="sticky bottom-0 bg-[#0F0B1A]/80 backdrop-blur-sm p-4 border-t border-gray-800">
                <div className="flex justify-around items-center">
                    <NavButton icon={HomeIcon} label="داشبورد" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    <NavButton icon={TargetIcon} label="اهداف" isActive={activeView === 'goals'} onClick={() => setActiveView('goals')} />
                    <button className="p-4 bg-purple-600 rounded-full text-white shadow-lg shadow-purple-600/30 -mt-12">
                        <PlusIcon className="w-8 h-8"/>
                    </button>
                    <NavButton icon={HabitsIcon} label="عادت‌ها" isActive={activeView === 'habits'} onClick={() => setActiveView('habits')} />
                    <NavButton icon={CogIcon} label="تنظیمات" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                </div>
            </footer>
        </div>
    );
};

interface NavButtonProps {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`}>
        <Icon className="w-6 h-6" />
        <span className="text-xs font-bold">{label}</span>
    </button>
);


const DashboardView = () => {
    const widgets = ['آب‌وهوا', 'کارهای امروز', 'پیگیری عادت‌ها', 'خلاصه مالی', 'رویدادهای تقویم', 'یادداشت‌های سریع'];
    return (
        <div className="grid grid-cols-2 gap-4">
            {widgets.map((widget, index) => (
                <div key={index} className={`bg-gray-800/50 border border-gray-700 rounded-2xl p-4 flex flex-col justify-between ${index < 2 ? 'col-span-2' : ''}`}>
                    <h3 className="font-bold">{widget}</h3>
                    <p className="text-sm text-gray-400 mt-2">محتوای ویجت اینجا قرار میگیرد.</p>
                </div>
            ))}
        </div>
    );
};

const GoalsView = () => (
    <div>
        <h2 className="text-xl font-bold mb-4">اهداف شما</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
            <p className="text-gray-400">هنوز هدفی اضافه نکرده‌اید.</p>
            <button className="mt-4 px-4 py-2 bg-purple-600 rounded-lg font-semibold">هدف جدید بساز</button>
        </div>
    </div>
);

const HabitsView = () => (
    <div>
        <h2 className="text-xl font-bold mb-4">پیگیری عادت‌ها</h2>
         <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
            <ChartBarIcon className="w-12 h-12 mx-auto text-green-400 mb-4"/>
            <p className="text-gray-400">نقشه حرارتی و آمار عادت‌ها اینجا نمایش داده می‌شود.</p>
        </div>
    </div>
);

const SettingsView = () => (
     <div>
        <h2 className="text-xl font-bold mb-4">تنظیمات</h2>
        <div className="space-y-3">
             <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold">تم برنامه</h3>
                    <p className="text-sm text-gray-400">تاریک</p>
                </div>
                <div className="w-12 h-7 bg-purple-600 rounded-full p-1 flex items-center justify-end">
                    <div className="w-5 h-5 bg-white rounded-full"></div>
                </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                 <h3 className="font-semibold">حساب کاربری</h3>
                 <p className="text-sm text-gray-400">ویرایش پروفایل و اطلاعات کاربری</p>
            </div>
             <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                 <h3 className="font-semibold">اعلان‌ها</h3>
                 <p className="text-sm text-gray-400">مدیریت اعلان‌های برنامه</p>
            </div>
        </div>
    </div>
);


export default DashboardScreen;

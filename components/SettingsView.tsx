
import React, { useState, useEffect, useRef } from 'react';
import { OnboardingData, NotificationType, NotificationTiming, DailyReportSetting, NotificationSetting, ThemeName, Habit, TransactionCategory } from '../types';
import { UserCircleIcon, TrashIcon, HabitsIcon, PlusIcon, WaterDropIcon, ReadingIcon, WalkingIcon, MeditationIcon, MinusCircleIcon, customHabitIcons, SpeakerWaveIcon, PencilIcon, CheckCircleIcon, SparklesIcon } from './icons';

interface SettingsViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
}

const timingOptions: { value: NotificationTiming; label: string }[] = [
    { value: '1h', label: '۱ ساعت قبل' },
    { value: '6h', label: '۶ ساعت قبل' },
    { value: '1d', label: 'روز قبل' },
];

const allHabitOptions = [
    { name: "نوشیدن آب", icon: WaterDropIcon },
    { name: "مطالعه", icon: ReadingIcon },
    { name: "ورزش", icon: WalkingIcon },
    { name: "مدیتیشن", icon: MeditationIcon },
    { name: "چک نکردن شبکه‌های اجتماعی", icon: MinusCircleIcon },
];

const HabitModal: React.FC<{
    habitToEdit?: Habit | null;
    currentHabits: Habit[];
    onSave: (habit: Habit) => void;
    onClose: () => void;
}> = ({ habitToEdit, currentHabits, onSave, onClose }) => {
    const isEditing = !!habitToEdit;
    const currentHabitNames = currentHabits.map(h => h.name);

    const [customHabitName, setCustomHabitName] = useState('');
    const [customHabitType, setCustomHabitType] = useState<'good' | 'bad'>('good');
    const [customHabitCategory, setCustomHabitCategory] = useState('');
    const [customHabitIcon, setCustomHabitIcon] = useState('Habits');
    const [customHabitColor, setCustomHabitColor] = useState('#a855f7');

    useEffect(() => {
        if (habitToEdit) {
            setCustomHabitName(habitToEdit.name);
            setCustomHabitType(habitToEdit.type);
            setCustomHabitCategory(habitToEdit.category || '');
            setCustomHabitIcon(habitToEdit.icon || 'Habits');
            setCustomHabitColor(habitToEdit.color || '#a855f7');
        }
    }, [habitToEdit]);

    const availableHabits = allHabitOptions.filter(h => !currentHabitNames.includes(h.name));
    
    const handleSaveCustomHabit = () => {
        if (customHabitName.trim() && (isEditing || !currentHabitNames.includes(customHabitName.trim()))) {
            onSave({ 
                name: customHabitName.trim(), 
                type: customHabitType, 
                category: customHabitCategory.trim() || undefined,
                icon: customHabitIcon,
                color: customHabitColor,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 modal-backdrop" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-[var(--radius-card)] p-6 w-full max-w-md max-h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 flex-shrink-0">{isEditing ? 'ویرایش عادت' : 'افزودن عادت جدید'}</h2>
                <div className="overflow-y-auto pr-2 space-y-4">
                    {!isEditing && availableHabits.length > 0 && (
                        <div className="space-y-2">
                            {availableHabits.map(habit => (
                                <button key={habit.name} onClick={() => { onSave({ name: habit.name, type: habit.name.includes('نکردن') ? 'bad' : 'good' }); }} className="w-full flex items-center gap-4 p-3 rounded-[var(--radius-md)] bg-gray-700/60 hover:bg-gray-700 transition-colors text-right">
                                    <habit.icon className="w-6 h-6 text-gray-300"/>
                                    <span className="font-semibold">{habit.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className={isEditing ? "" : "pt-4 border-t border-gray-600"}>
                        <h3 className="font-semibold mb-2">{isEditing ? 'مشخصات عادت' : 'عادت سفارشی'}</h3>
                        <input type="text" value={customHabitName} onChange={(e) => setCustomHabitName(e.target.value)} placeholder="نام عادت" readOnly={isEditing} className={`w-full bg-gray-900/80 border border-gray-700 rounded-[var(--radius-md)] p-3 mb-2 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none ${isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}/>
                        <input type="text" value={customHabitCategory} onChange={(e) => setCustomHabitCategory(e.target.value)} placeholder="دسته‌بندی (اختیاری)" className="w-full bg-gray-900/80 border border-gray-700 rounded-[var(--radius-md)] p-3 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none"/>
                        <div className="flex gap-2 mt-2 bg-gray-700/50 p-1 rounded-[var(--radius-full)]">
                            <button onClick={() => !isEditing && setCustomHabitType('good')} disabled={isEditing} className={`flex-1 py-2 text-sm font-semibold rounded-[var(--radius-full)] transition-colors ${customHabitType === 'good' ? 'bg-green-500 text-white' : 'text-gray-300'} ${isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>عادت خوب (انجام دادن)</button>
                            <button onClick={() => !isEditing && setCustomHabitType('bad')} disabled={isEditing} className={`flex-1 py-2 text-sm font-semibold rounded-[var(--radius-full)] transition-colors ${customHabitType === 'bad' ? 'bg-red-500 text-white' : 'text-gray-300'} ${isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>عادت بد (ترک کردن)</button>
                        </div>
                        <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-300 mb-2 text-right">آیکون و رنگ</label>
                            <div className="flex items-center gap-4">
                                <div className="grid grid-cols-6 gap-2 flex-grow bg-gray-900/50 p-2 rounded-[var(--radius-md)]">
                                    {Object.entries(customHabitIcons).map(([key, Icon]) => (
                                        <button key={key} onClick={() => setCustomHabitIcon(key)} className={`p-2 rounded-md aspect-square flex items-center justify-center transition-all ${customHabitIcon === key ? 'bg-gray-600 ring-2 ring-[var(--color-primary-400)]' : 'bg-gray-700/50'}`}>
                                            <Icon className="w-6 h-6" style={{color: customHabitColor}} />
                                        </button>
                                    ))}
                                </div>
                                <input type="color" value={customHabitColor} onChange={e => setCustomHabitColor(e.target.value)} className="w-12 h-12 p-1 bg-gray-700 rounded-md cursor-pointer border-2 border-gray-600" />
                            </div>
                        </div>
                        <button onClick={handleSaveCustomHabit} disabled={!customHabitName.trim()} className="w-full mt-4 py-2 bg-[var(--color-primary-800)] rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-primary-700)] transition-colors disabled:bg-gray-600">
                            {isEditing ? 'ذخیره تغییرات' : 'افزودن عادت سفارشی'}
                        </button>
                    </div>
                </div>
                 <button onClick={onClose} className="w-full mt-4 py-2 bg-gray-600 rounded-[var(--radius-md)] font-semibold hover:bg-gray-500 transition-colors flex-shrink-0">بستن</button>
            </div>
        </div>
    );
};

const themes: { id: ThemeName; name: string }[] = [
    { id: 'benvis_classic', name: 'کلاسیک بنویس' },
    { id: 'oceanic_deep', name: 'اعماق اقیانوس' },
    { id: 'forest_whisper', name: 'نجوای جنگل' },
    { id: 'sunset_bliss', name: 'آرامش غروب' },
    { id: 'galaxy_dream', name: 'رویای کهکشانی' },
    { id: 'cyberpunk_neon', name: 'نئون سایبرپانک' },
    { id: 'royal_gold', name: 'طلایی سلطنتی' },
    { id: 'zen_garden', name: 'باغ ذن' },
    { id: 'crimson_night', name: 'شب مخملی' },
    { id: 'pastel_dream', name: 'رویای پاستلی' },
];

const SettingsView: React.FC<SettingsViewProps> = ({ userData, onUpdateUserData }) => {
    const [habitModal, setHabitModal] = useState<{ isOpen: boolean, habitToEdit?: Habit }>({ isOpen: false });
    const [transactionCategories, setTransactionCategories] = useState<TransactionCategory[]>(userData.transactionCategories || []);
    const [newCategory, setNewCategory] = useState('');
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }, []);

    const playSound = (sound: string) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

        switch (sound) {
            case 'chime':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                break;
            case 'melody':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(659, ctx.currentTime); // E5
                oscillator.frequency.linearRampToValueAtTime(783, ctx.currentTime + 0.1); // G5
                oscillator.frequency.linearRampToValueAtTime(523, ctx.currentTime + 0.2); // C5
                break;
            case 'default':
            default:
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, ctx.currentTime);
                break;
        }

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
    };

    const handleNotificationChange = (key: NotificationType, value: Partial<NotificationSetting> | Partial<DailyReportSetting>) => {
        const updatedNotifications = {
            ...userData.notifications,
            [key]: { ...userData.notifications[key], ...value },
        };
        onUpdateUserData({ ...userData, notifications: updatedNotifications });
    };

    const handleDeleteAllData = () => {
        if (window.confirm("آیا مطمئن هستید؟ تمام اطلاعات شما از جمله اهداف و عادت‌ها برای همیشه پاک خواهد شد.")) {
            localStorage.clear();
            window.location.reload();
        }
    };
    
    const handleSaveHabit = (habit: Habit) => {
        const isUpdating = userData.habits.some(h => h.name === habit.name);
        if (isUpdating) {
            const updatedHabits = userData.habits.map(h => (h.name === habit.name ? habit : h));
            onUpdateUserData({ ...userData, habits: updatedHabits });
        } else {
            const updatedHabits = [...userData.habits, habit];
            onUpdateUserData({ ...userData, habits: updatedHabits });
        }
        setHabitModal({ isOpen: false });
    };

    const handleDeleteHabit = (habitName: string) => {
        if (window.confirm(`آیا از حذف عادت «${habitName}» مطمئن هستید؟ تاریخچه این عادت باقی خواهد ماند اما دیگر در لیست روزانه شما نمایش داده نخواهد شد.`)) {
            const updatedHabits = userData.habits.filter(h => h.name !== habitName);
            onUpdateUserData({ ...userData, habits: updatedHabits });
        }
    };

    const handleAddCategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newCategory.trim()) {
            e.preventDefault();
            const trimmed = newCategory.trim();
            if (!transactionCategories.some(c => c.name === trimmed)) {
                const newCat: TransactionCategory = {
                    id: `cat-custom-${Date.now()}`,
                    name: trimmed,
                    type: 'expense' // Default to expense for new budget categories
                };
                const updatedCategories = [...transactionCategories, newCat];
                setTransactionCategories(updatedCategories);
                onUpdateUserData({ ...userData, transactionCategories: updatedCategories });
            }
            setNewCategory('');
        }
    };

    const handleRemoveCategory = (categoryToRemoveId: string) => {
        const updatedCategories = transactionCategories.filter(c => c.id !== categoryToRemoveId);
        setTransactionCategories(updatedCategories);
        onUpdateUserData({ ...userData, transactionCategories: updatedCategories });
    };
    
    const soundOptions = [
        { value: 'default', label: 'پیش‌فرض' },
        { value: 'chime', label: 'زنگوله' },
        { value: 'melody', label: 'ملودی' },
    ];

    const handleThemeChange = (name: ThemeName) => {
        onUpdateUserData({ ...userData, theme: { ...userData.theme, name } });
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateUserData({ ...userData, theme: { name: 'custom', customColor: e.target.value, animations: userData.theme.animations } });
    };

    return (
     <div className="pb-24 space-y-6">
        {habitModal.isOpen && <HabitModal habitToEdit={habitModal.habitToEdit} currentHabits={userData.habits} onSave={handleSaveHabit} onClose={() => setHabitModal({isOpen: false})} />}
        <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">حساب کاربری</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)] p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <UserCircleIcon className="w-12 h-12 text-gray-300"/>
                    <div>
                        <h4 className="font-bold text-lg">{userData.fullName}</h4>
                        <p className="text-sm text-gray-400">{userData.role}</p>
                    </div>
                </div>
                <button className="text-sm text-[var(--color-primary-400)] font-semibold">ویرایش</button>
            </div>
        </div>
        
         <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">مدیریت عادت‌ها</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)] p-4 space-y-3">
                {userData.habits.map(habit => {
                     const Icon = customHabitIcons[habit.icon || ''] || allHabitOptions.find(h => h.name === habit.name)?.icon || (habit.type === 'good' ? HabitsIcon : MinusCircleIcon);
                     return (
                        <div key={habit.name} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-[var(--radius-md)]">
                            <div className="flex items-center gap-3">
                                <Icon className="w-6 h-6 text-gray-300" style={{ color: habit.color }}/>
                                <span className="font-semibold">{habit.name}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${habit.type === 'good' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {habit.type === 'good' ? 'خوب' : 'بد'}
                                </span>
                                {habit.category && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                        {habit.category}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center">
                                <button onClick={() => setHabitModal({ isOpen: true, habitToEdit: habit })} className="text-gray-400 hover:text-white p-1">
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteHabit(habit.name)} className="text-gray-400 hover:text-red-400 p-1">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                     )
                })}
                 <button onClick={() => setHabitModal({ isOpen: true })} className="w-full flex items-center justify-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-primary-600)]/20 text-[var(--color-primary-300)] hover:bg-[var(--color-primary-600)]/40 transition-colors">
                    <PlusIcon className="w-5 h-5"/>
                    <span className="font-semibold">افزودن عادت جدید</span>
                </button>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">مدیریت مالی</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)] p-4">
                <h4 className="font-semibold mb-2">دسته‌بندی‌های بودجه</h4>
                 <div className="flex flex-wrap gap-2 mb-3">
                    {transactionCategories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-1.5 bg-gray-600 text-sm px-3 py-1 rounded-full">
                            <span>{cat.name}</span>
                            <button onClick={() => handleRemoveCategory(cat.id)} className="text-gray-400 hover:text-white">
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                 </div>
                 <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={handleAddCategory}
                    placeholder="اضافه کردن دسته‌بندی جدید..."
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-[var(--radius-md)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] focus:outline-none"
                 />
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">ظاهر و تم</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)] p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {themes.map(theme => {
                        const isSelected = userData.theme.name === theme.id;
                        return (
                            <div key={theme.id} className="text-center">
                                <button
                                    onClick={() => handleThemeChange(theme.id)}
                                    className={`w-full rounded-lg p-1 border-2 transition-colors ${isSelected ? 'border-[var(--color-primary-500)] scale-105' : 'border-transparent hover:scale-105'} transform duration-200`}
                                >
                                    <div 
                                        data-theme-name={theme.id} 
                                        className="h-24 w-full rounded-lg theme-preview relative overflow-hidden shadow-lg"
                                        style={{
                                            backgroundColor: 'var(--bg-color)',
                                            backgroundImage: 'var(--bg-image)',
                                        }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1.5 opacity-80">
                                            <div className="w-3/4 h-2 bg-[var(--color-primary-500)] rounded-full"></div>
                                            <div className="w-1/2 h-2 bg-[var(--color-primary-400)] rounded-full"></div>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-[var(--color-primary-500)] text-white rounded-full p-0.5 shadow-sm">
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                                <p className={`mt-2 text-sm font-semibold transition-colors ${isSelected ? 'text-[var(--color-primary-300)]' : 'text-gray-400'}`}>
                                    {theme.name}
                                </p>
                            </div>
                        );
                    })}
                    {/* Custom Theme Option */}
                    <div className="text-center">
                        <button
                            onClick={() => handleThemeChange('custom')}
                            className={`w-full rounded-lg p-1 border-2 transition-colors ${userData.theme.name === 'custom' ? 'border-[var(--color-primary-500)] scale-105' : 'border-transparent hover:scale-105'} transform duration-200`}
                        >
                            <div 
                                className="h-24 w-full rounded-lg bg-slate-800 flex items-center justify-center relative overflow-hidden shadow-lg"
                            >
                                <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500"></div>
                                <SparklesIcon className="w-8 h-8 text-white relative z-10" />
                                {userData.theme.name === 'custom' && (
                                    <div className="absolute top-2 right-2 bg-[var(--color-primary-500)] text-white rounded-full p-0.5 shadow-sm z-20">
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </button>
                        <p className={`mt-2 text-sm font-semibold transition-colors ${userData.theme.name === 'custom' ? 'text-[var(--color-primary-300)]' : 'text-gray-400'}`}>
                            شخصی‌سازی
                        </p>
                    </div>
                </div>

                {userData.theme.name === 'custom' && (
                    <div className="mt-4 p-4 bg-gray-700/30 rounded-lg flex items-center justify-between animate-bounce-in">
                        <span className="text-sm font-semibold text-gray-300">رنگ اصلی تم خود را انتخاب کنید:</span>
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full shadow-sm border border-gray-500" style={{ backgroundColor: userData.theme.customColor || '#7c3aed' }}></div>
                             <input 
                                type="color" 
                                value={userData.theme.customColor || '#7c3aed'} 
                                onChange={handleCustomColorChange}
                                className="w-24 h-10 p-1 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">انیمیشن پس‌زمینه</h4>
                            <p className="text-sm text-gray-400">ممکن است بر روی عملکرد تاثیر بگذارد.</p>
                        </div>
                        <button 
                            onClick={() => onUpdateUserData({ ...userData, theme: { ...userData.theme, name: userData.theme.name, animations: { enabled: !(userData.theme.animations?.enabled ?? true) } } })}
                            className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${(userData.theme.animations?.enabled ?? true) ? 'bg-[var(--color-primary-600)] justify-end' : 'bg-gray-600 justify-start'}`}
                        >
                            <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">اعلان‌ها</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)] divide-y divide-gray-700">
                <div className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">یادآوری وظایف</h4>
                            <p className="text-sm text-gray-400">قبل از سررسید کارها</p>
                        </div>
                        <button onClick={() => handleNotificationChange('tasks', { enabled: !userData.notifications.tasks.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${userData.notifications.tasks.enabled ? 'bg-[var(--color-primary-600)] justify-end' : 'bg-gray-600 justify-start'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                    {userData.notifications.tasks.enabled && 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-600/50">
                            <select value={userData.notifications.tasks.timing} onChange={(e) => handleNotificationChange('tasks', { timing: e.target.value as NotificationTiming })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                             <div className="flex items-center gap-2">
                                <select value={userData.notifications.tasks.sound || 'default'} onChange={(e) => handleNotificationChange('tasks', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <button onClick={() => playSound(userData.notifications.tasks.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    }
                </div>
                 <div className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">گزارش مالی</h4>
                            <p className="text-sm text-gray-400">خلاصه هزینه‌های هفتگی</p>
                        </div>
                        <button onClick={() => handleNotificationChange('reminders', { enabled: !userData.notifications.reminders.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${userData.notifications.reminders.enabled ? 'bg-[var(--color-primary-600)] justify-end' : 'bg-gray-600 justify-start'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                    {userData.notifications.reminders.enabled && 
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-600/50">
                            <select value={userData.notifications.reminders.timing} onChange={(e) => handleNotificationChange('reminders', { timing: e.target.value as NotificationTiming })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                             <div className="flex items-center gap-2">
                                <select value={userData.notifications.reminders.sound || 'default'} onChange={(e) => handleNotificationChange('reminders', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <button onClick={() => playSound(userData.notifications.reminders.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    }
                </div>
                 <div className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">انگیزه روزانه</h4>
                            <p className="text-sm text-gray-400">پیام‌های پیشنهادی</p>
                        </div>
                         <button onClick={() => handleNotificationChange('daily_report', { enabled: !userData.notifications.daily_report.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${userData.notifications.daily_report.enabled ? 'bg-[var(--color-primary-600)] justify-end' : 'bg-gray-600 justify-start'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                     {userData.notifications.daily_report.enabled && 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-600/50">
                            <input type="time" value={userData.notifications.daily_report.time} onChange={(e) => handleNotificationChange('daily_report', { time: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm"/>
                            <div className="flex items-center gap-2">
                                <select value={userData.notifications.daily_report.sound || 'default'} onChange={(e) => handleNotificationChange('daily_report', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <button onClick={() => playSound(userData.notifications.daily_report.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                     }
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">هشدارهای بودجه</h4>
                            <p className="text-sm text-gray-400">اعلان هنگام نزدیک شدن به سقف بودجه</p>
                        </div>
                        <button onClick={() => handleNotificationChange('budget_alerts', { enabled: !userData.notifications.budget_alerts?.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${userData.notifications.budget_alerts?.enabled ? 'bg-[var(--color-primary-600)] justify-end' : 'bg-gray-600 justify-start'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                     {userData.notifications.budget_alerts?.enabled && 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-600/50">
                            <select value={userData.notifications.budget_alerts.timing} onChange={(e) => handleNotificationChange('budget_alerts', { timing: e.target.value as NotificationTiming })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                                <select value={userData.notifications.budget_alerts.sound || 'default'} onChange={(e) => handleNotificationChange('budget_alerts', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <button onClick={() => playSound(userData.notifications.budget_alerts.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                     }
                </div>
                 <div className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">هشدار کمبود موجودی</h4>
                            <p className="text-sm text-gray-400">اعلان وقتی موجودی حساب کم است</p>
                        </div>
                         <button onClick={() => handleNotificationChange('low_balance_warnings', { enabled: !userData.notifications.low_balance_warnings?.enabled })} className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${userData.notifications.low_balance_warnings?.enabled ? 'bg-[var(--color-primary-600)] justify-end' : 'bg-gray-600 justify-start'}`}>
                             <div className="w-5 h-5 bg-white rounded-full"></div>
                        </button>
                    </div>
                     {userData.notifications.low_balance_warnings?.enabled && 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-600/50">
                            <select value={userData.notifications.low_balance_warnings.timing} onChange={(e) => handleNotificationChange('low_balance_warnings', { timing: e.target.value as NotificationTiming })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                {timingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                                <select value={userData.notifications.low_balance_warnings.sound || 'default'} onChange={(e) => handleNotificationChange('low_balance_warnings', { sound: e.target.value })} className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-sm">
                                    {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <button onClick={() => playSound(userData.notifications.low_balance_warnings.sound || 'default')} className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><SpeakerWaveIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                     }
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">برنامه</h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)] divide-y divide-gray-700">
                <div className="p-4 flex justify-between items-center">
                    <h4 className="font-semibold">نسخه</h4>
                    <p className="text-sm text-gray-400">1.6.0</p>
                </div>
            </div>
        </div>

        <div>
             <h3 className="text-lg font-semibold text-gray-400 mb-2">مدیریت داده‌ها</h3>
             <div className="bg-gray-800/50 border border-gray-700 rounded-[var(--radius-md)]">
                <button onClick={handleDeleteAllData} className="w-full text-left p-4 flex items-center gap-3 text-red-400 font-semibold hover:bg-red-500/10">
                    <TrashIcon className="w-5 h-5"/>
                    <span>پاک کردن تمام اطلاعات</span>
                </button>
             </div>
        </div>

    </div>
    );
};

export default SettingsView;
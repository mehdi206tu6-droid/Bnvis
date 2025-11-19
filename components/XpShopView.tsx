
import React from 'react';
import { OnboardingData, ShopItem } from '../types';
import { ShoppingBagIcon, LockClosedIcon, CheckCircleIcon, StarIcon } from './icons';

interface XpShopViewProps {
    userData: OnboardingData;
    onUpdateUserData: (data: OnboardingData) => void;
    onClose: () => void;
}

const SHOP_ITEMS: ShopItem[] = [
    { id: 'theme_ocean', title: 'تم اقیانوس', description: 'یک تم آبی و آرامش‌بخش برای تمرکز بیشتر.', price: 300, type: 'theme', value: 'oceanic_deep', purchased: false },
    { id: 'theme_forest', title: 'تم جنگل', description: 'تم سبز و طبیعی برای حس تازگی.', price: 300, type: 'theme', value: 'forest_whisper', purchased: false },
    { id: 'theme_cyber', title: 'تم سایبرپانک', description: 'تم نئونی و پرانرژی برای شب‌زنده‌داران.', price: 500, type: 'theme', value: 'cyberpunk_neon', purchased: false },
    { id: 'theme_gold', title: 'تم سلطنتی', description: 'تم طلایی و لوکس برای حس موفقیت.', price: 800, type: 'theme', value: 'royal_gold', purchased: false },
    { id: 'badge_early_bird', title: 'نشان سحرخیز', description: 'یک نشان افتخار برای پروفایل شما.', price: 150, type: 'badge', purchased: false },
    { id: 'badge_focus_master', title: 'استاد تمرکز', description: 'نشان ویژه برای کسانی که تمرکز بالایی دارند.', price: 400, type: 'badge', purchased: false },
];

const XpShopView: React.FC<XpShopViewProps> = ({ userData, onUpdateUserData, onClose }) => {
    const inventory = userData.shopInventory || [];
    
    // Merge static items with user inventory state
    const items = SHOP_ITEMS.map(item => {
        const owned = inventory.find(i => i.id === item.id);
        return owned ? { ...item, purchased: true } : item;
    });

    const handlePurchase = (item: ShopItem) => {
        if (userData.xp >= item.price) {
            if (window.confirm(`آیا مطمئنید می‌خواهید "${item.title}" را به قیمت ${item.price} XP بخرید؟`)) {
                const newInventory = [...inventory, { ...item, purchased: true }];
                const newXp = userData.xp - item.price;
                
                // If it's a theme, ask to apply immediately
                let newTheme = userData.theme;
                if (item.type === 'theme' && item.value && window.confirm("خرید موفق! آیا می‌خواهید این تم را الان فعال کنید؟")) {
                    newTheme = { ...userData.theme, name: item.value as any };
                }

                onUpdateUserData({
                    ...userData,
                    xp: newXp,
                    shopInventory: newInventory,
                    theme: newTheme
                });
            }
        } else {
            alert("امتیاز XP کافی ندارید!");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-[var(--radius-card)] p-6 w-full max-w-2xl h-[90vh] flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <ShoppingBagIcon className="w-6 h-6 text-yellow-400"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">فروشگاه جوایز</h2>
                            <div className="flex items-center gap-1 text-yellow-400 text-sm font-mono mt-1">
                                <StarIcon className="w-4 h-4 fill-current"/>
                                <span className="font-bold">{userData.xp} XP موجود</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white">&times;</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2">
                    {items.map(item => (
                        <div key={item.id} className={`relative p-4 rounded-xl border ${item.purchased ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-800 border-slate-600'} flex flex-col justify-between transition-all hover:scale-[1.02]`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-200">{item.title}</h3>
                                    {item.purchased ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500"/>
                                    ) : (
                                        <span className="text-xs font-bold bg-slate-700 px-2 py-1 rounded text-slate-300 uppercase">{item.type}</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 mb-4">{item.description}</p>
                            </div>
                            
                            {item.purchased ? (
                                <button disabled className="w-full py-2 bg-slate-700/50 text-slate-500 rounded-lg font-semibold cursor-default">
                                    مالک هستید
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handlePurchase(item)} 
                                    disabled={userData.xp < item.price}
                                    className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${userData.xp >= item.price ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {userData.xp < item.price && <LockClosedIcon className="w-4 h-4"/>}
                                    <span>{item.price} XP</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default XpShopView;

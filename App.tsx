
import React, { useState, useEffect } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import { OnboardingData, UserGoal, AchievementID, Transaction, FinancialAccount } from './types';

const App: React.FC = () => {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementID[]>([]);

  useEffect(() => {
    setLoading(true);
    try {
      const storedData = localStorage.getItem('benvis_user_data');
      let userDataFromStorage: OnboardingData | null = storedData ? JSON.parse(storedData) : null;

      if (userDataFromStorage) {
        // --- MIGRATION LOGIC ---
        // Goals migration
        if (!userDataFromStorage.goals) {
          userDataFromStorage.goals = [];
        } else {
          // Ensure each goal has a linkedHabits array to prevent errors.
          userDataFromStorage.goals.forEach((goal: UserGoal) => {
            if (!goal.linkedHabits) {
              goal.linkedHabits = [];
            }
          });
        }
        
        // Gamification migration
        if (userDataFromStorage.xp === undefined) userDataFromStorage.xp = 0;
        if (userDataFromStorage.level === undefined) userDataFromStorage.level = 1;
        if (!userDataFromStorage.achievements) userDataFromStorage.achievements = [];
        
        // Notifications migration (for older data structures)
        if (userDataFromStorage.notifications && typeof userDataFromStorage.notifications === 'object') {
          if(typeof (userDataFromStorage.notifications as any).tasks === 'boolean') {
            console.log("Migrating notification settings...");
            const oldNotifications = userDataFromStorage.notifications as any;
            userDataFromStorage.notifications = {
              tasks: { enabled: oldNotifications.tasks, timing: '1h' },
              reminders: { enabled: oldNotifications.reminders, timing: '1d' },
              daily_report: { enabled: oldNotifications.daily_report, time: '09:00' },
            };
          }

          // **ROBUSTNESS FIX**: Ensure nested objects exist before migrating properties on them.
          if (!userDataFromStorage.notifications.tasks) {
            userDataFromStorage.notifications.tasks = { enabled: true, timing: '1h' };
          }
          if (!userDataFromStorage.notifications.reminders) {
            userDataFromStorage.notifications.reminders = { enabled: false, timing: '1d' };
          }
          if (!userDataFromStorage.notifications.daily_report) {
            userDataFromStorage.notifications.daily_report = { enabled: false, time: '09:00' };
          }

          // Add sound migration
          if (typeof userDataFromStorage.notifications.tasks.sound === 'undefined') {
              userDataFromStorage.notifications.tasks.sound = 'default';
          }
          if (typeof userDataFromStorage.notifications.reminders.sound === 'undefined') {
              userDataFromStorage.notifications.reminders.sound = 'default';
          }
          if (typeof userDataFromStorage.notifications.daily_report.sound === 'undefined') {
              userDataFromStorage.notifications.daily_report.sound = 'default';
          }
           // Women's Health Notifications migration
          if (!userDataFromStorage.notifications.womenHealth_period) {
              userDataFromStorage.notifications.womenHealth_period = { enabled: true, timing: '1d', sound: 'default' };
          }
          if (!userDataFromStorage.notifications.womenHealth_fertile) {
              userDataFromStorage.notifications.womenHealth_fertile = { enabled: true, timing: '1d', sound: 'default' };
          }
          // Financial Notifications migration
          if (!userDataFromStorage.notifications.budget_alerts) {
              userDataFromStorage.notifications.budget_alerts = { enabled: true, timing: '1h', sound: 'default' };
          }
          if (!userDataFromStorage.notifications.low_balance_warnings) {
              userDataFromStorage.notifications.low_balance_warnings = { enabled: true, timing: '1h', sound: 'default' };
          }
        } else if (!userDataFromStorage.notifications) {
            // Initialize notifications if they don't exist at all
            userDataFromStorage.notifications = {
                tasks: { enabled: true, timing: '1h', sound: 'default' },
                reminders: { enabled: false, timing: '1d', sound: 'default' },
                daily_report: { enabled: false, time: '09:00', sound: 'default' },
                womenHealth_period: { enabled: true, timing: '1d', sound: 'default' },
                womenHealth_fertile: { enabled: true, timing: '1d', sound: 'default' },
                budget_alerts: { enabled: true, timing: '1h', sound: 'default' },
                low_balance_warnings: { enabled: true, timing: '1h', sound: 'default' },
            };
        }
        
        // Theme migration - Set to blue/sharp as requested
        if (!userDataFromStorage.theme) {
            userDataFromStorage.theme = { color: 'blue', shape: 'sharp' };
        } else {
            userDataFromStorage.theme.color = 'blue';
            userDataFromStorage.theme.shape = 'sharp';
        }

        // Initialize habits if they don't exist
        if (!userDataFromStorage.habits) {
            userDataFromStorage.habits = [];
        }

        // Habit structure migration from string[] to Habit[]
        if (userDataFromStorage.habits && userDataFromStorage.habits.length > 0 && typeof (userDataFromStorage.habits as any)[0] === 'string') {
            console.log("Migrating habits structure...");
            userDataFromStorage.habits = (userDataFromStorage.habits as any as string[]).map(habitName => ({
                name: habitName,
                type: habitName.includes('نکردن') || habitName.includes('ترک') ? 'bad' : 'good'
            }));
        }

        // Configure per-habit notification setting for 'مطالعه'
        userDataFromStorage.habits.forEach(habit => {
            if (habit.name === 'مطالعه') {
                habit.notification = { enabled: true, timing: '1d', sound: 'chime' };
            }
        });


        // Women's Health Feature Migration
        if (userDataFromStorage.gender === undefined) {
            userDataFromStorage.gender = 'prefer_not_to_say';
        }
        if (!userDataFromStorage.womenHealth) {
            userDataFromStorage.womenHealth = {
                cycleLength: 28,
                periodLength: 5,
                cycles: [],
                companion: undefined,
            };
        } else {
            // Ensure cycles have logs property
            if (userDataFromStorage.womenHealth.cycles) {
                userDataFromStorage.womenHealth.cycles.forEach(cycle => {
                    if (!cycle.logs) {
                        cycle.logs = {};
                    }
                });
            }
            // Ensure companion exists
            if (userDataFromStorage.womenHealth.companion === undefined) {
                 userDataFromStorage.womenHealth.companion = undefined;
            }
        }

        // Calendar Events Migration
        if (!userDataFromStorage.calendarEvents) {
            userDataFromStorage.calendarEvents = [];
        }

        // Journeys & Goals unification Migration
        if ((userDataFromStorage as any).journeys) {
            console.log("Migrating journeys to goals...");
            const journeysAsGoals: UserGoal[] = (userDataFromStorage as any).journeys.map((journey: any) => {
                const totalTasks = journey.milestones?.reduce((acc: number, ms: any) => acc + (ms.tasks?.length || 0), 0) || 0;
                const completedTasks = journey.milestones?.reduce((acc: number, ms: any) => acc + (ms.tasks?.filter((t: any) => t.completed).length || 0), 0) || 0;
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return {
                    id: journey.id,
                    type: 'journey',
                    title: journey.title,
                    description: journey.description,
                    icon: journey.icon,
                    milestones: journey.milestones,
                    progress: progress,
                    progressHistory: [{ date: new Date().toISOString().split('T')[0], progress: progress }],
                };
            });
            
            if (!userDataFromStorage.goals) {
                userDataFromStorage.goals = [];
            }
            userDataFromStorage.goals.push(...journeysAsGoals);
            delete (userDataFromStorage as any).journeys;
        }

        // Ensure all goals have a type
        if (userDataFromStorage.goals) {
            userDataFromStorage.goals.forEach((goal: UserGoal) => {
                if (!goal.type) {
                    goal.type = 'simple';
                }
                // also migrate progress calculation for journeys if they exist but don't have progress
                if (goal.type === 'journey' && goal.progress === undefined) {
                     const totalTasks = goal.milestones?.reduce((acc: number, ms: any) => acc + (ms.tasks?.length || 0), 0) || 0;
                     const completedTasks = goal.milestones?.reduce((acc: number, ms: any) => acc + (ms.tasks?.filter((t: any) => t.completed).length || 0), 0) || 0;
                     goal.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                }
            });
        }


        // Finance Module Migration
        const defaultCashAccountId = 'default-cash';
        if (!userDataFromStorage.financialAccounts) {
            userDataFromStorage.financialAccounts = [
                { id: defaultCashAccountId, name: 'پول نقد', type: 'cash', balance: 0 }
            ];
        }
        if (!userDataFromStorage.financialAccounts.some(acc => acc.name === 'حساب پس‌انداز')) {
             userDataFromStorage.financialAccounts.push({
                id: 'default-savings', name: 'حساب پس‌انداز', type: 'bank', balance: 1000000
            });
        }
        if (!userDataFromStorage.budgets) {
            userDataFromStorage.budgets = [];
        }

        if (!userDataFromStorage.transactions) {
            userDataFromStorage.transactions = [];
        } else {
            // Add accountId to existing transactions
            userDataFromStorage.transactions.forEach((tx: Transaction) => {
                if (!tx.accountId) {
                    tx.accountId = defaultCashAccountId;
                }
            });
        }
        if (!userDataFromStorage.transactionCategories) {
            userDataFromStorage.transactionCategories = [
                // Default Expense Categories
                { id: 'cat-exp-1', name: 'غذا', type: 'expense' },
                { id: 'cat-exp-2', name: 'حمل و نقل', type: 'expense' },
                { id: 'cat-exp-3', name: 'مسکن', type: 'expense' },
                { id: 'cat-exp-4', name: 'سرگرمی', type: 'expense' },
                { id: 'cat-exp-5', name: 'سلامتی', type: 'expense' },
                // Default Income Categories
                { id: 'cat-inc-1', name: 'حقوق', type: 'income' },
                { id: 'cat-inc-2', name: 'پروژه', type: 'income' },
            ];
        }
        if (!userDataFromStorage.transactionCategories.some(cat => cat.name === 'قبوض')) {
            userDataFromStorage.transactionCategories.push({
                id: 'cat-exp-6', name: 'قبوض', type: 'expense', icon: 'Bolt', color: '#f59e0b'
            });
        }

        // Income Analysis Migration
        if (!userDataFromStorage.incomeAnalysis) {
            userDataFromStorage.incomeAnalysis = {
                sources: [],
                report: null,
                lastUpdated: null,
            };
        }

        // Link 'Drinking Water' habit to 'Health' goal
        const healthGoal = userDataFromStorage.goals.find(g => g.icon === 'Health');
        const drinkingWaterHabitName = 'نوشیدن آب';
        if (healthGoal && userDataFromStorage.habits.some(h => h.name === drinkingWaterHabitName)) {
            if (!healthGoal.linkedHabits) {
                healthGoal.linkedHabits = [];
            }
            if (!healthGoal.linkedHabits.includes(drinkingWaterHabitName)) {
                healthGoal.linkedHabits.push(drinkingWaterHabitName);
            }
        }
        
        // Link 'Walking' habit ('ورزش') to 'Health' goal
        const walkingHabitName = 'ورزش';
        if (healthGoal && userDataFromStorage.habits.some(h => h.name === walkingHabitName)) {
            if (!healthGoal.linkedHabits) {
                healthGoal.linkedHabits = [];
            }
            if (!healthGoal.linkedHabits.includes(walkingHabitName)) {
                healthGoal.linkedHabits.push(walkingHabitName);
            }
        }

        // Add 'First Goal' if it doesn't exist
        const firstGoalExists = userDataFromStorage.goals.some(g => g.title === 'First Goal');
        if (!firstGoalExists) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 7);
            const targetDateString = targetDate.toISOString().split('T')[0];

            userDataFromStorage.goals.push({
                id: `goal-${Date.now()}-first`,
                type: 'simple',
                title: 'First Goal',
                icon: 'Target',
                progress: 0,
                targetDate: targetDateString,
            });
        }

        // Add 'Learn new language' journey goal
        if (!userDataFromStorage.goals.some(g => g.title === 'یادگیری زبان جدید')) {
            userDataFromStorage.goals.push({
                id: `goal-journey-${Date.now()}`,
                type: 'journey',
                title: 'یادگیری زبان جدید',
                icon: 'Education',
                progress: 0,
                milestones: [
                    {
                        id: `ms-${Date.now()}-1`,
                        title: 'مایلستون اول: اصول اولیه',
                        description: 'یادگیری الفبا و کلمات پایه',
                        tasks: [
                            { id: `task-${Date.now()}-1-1`, title: 'یادگیری الفبا و تلفظ', completed: false },
                            { id: `task-${Date.now()}-1-2`, title: 'یادگیری ۱۰۰ کلمه پرکاربرد', completed: false },
                        ]
                    },
                    {
                        id: `ms-${Date.now()}-2`,
                        title: 'مایلستون دوم: ساخت جمله',
                        description: 'تمرین ساخت جملات ساده',
                        tasks: [
                            { id: `task-${Date.now()}-2-1`, title: 'یادگیری گرامر پایه', completed: false },
                            { id: `task-${Date.now()}-2-2`, title: 'تمرین مکالمه روزمره', completed: false },
                        ]
                    },
                    {
                        id: `ms-${Date.now()}-3`,
                        title: 'مایلستون سوم: مکالمه',
                        description: 'توانایی مکالمه در مورد موضوعات ساده',
                        tasks: [
                            { id: `task-${Date.now()}-3-1`, title: 'تماشای یک فیلم با زیرنویس', completed: false },
                            { id: `task-${Date.now()}-3-2`, title: 'پیدا کردن یک پارتنر زبان', completed: false },
                        ]
                    }
                ]
            });
        }
        
        // Low Friction Mode Migration
        if (userDataFromStorage.isLowFrictionMode === undefined) {
            userDataFromStorage.isLowFrictionMode = false;
        }

        // Add custom habit 'نوشیدن ۲ لیوان آب'
        if (!userDataFromStorage.habits.some(h => h.name === 'نوشیدن ۲ لیوان آب')) {
            userDataFromStorage.habits.push({
                name: 'نوشیدن ۲ لیوان آب',
                type: 'good',
                icon: 'WaterDrop',
                color: '#2563eb',
            });
        }


        localStorage.setItem('benvis_user_data', JSON.stringify(userDataFromStorage));
        // --- END MIGRATION LOGIC ---
      }
      
      setUserData(userDataFromStorage);
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      localStorage.removeItem('benvis_user_data');
      setUserData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userData?.theme) {
        document.documentElement.setAttribute('data-theme-color', userData.theme.color);
        document.documentElement.setAttribute('data-theme-shape', userData.theme.shape);
    }
  }, [userData?.theme]);
  
  const checkAndAwardAchievements = (currentUserData: OnboardingData) => {
    const awarded: AchievementID[] = [];
    
    // 1. First Goal Completed
    if (!currentUserData.achievements.includes('first_goal_completed') && currentUserData.goals.some(g => g.progress === 100)) {
        awarded.push('first_goal_completed');
    }

    // 2. Reached Level 5
    if (!currentUserData.achievements.includes('level_5') && currentUserData.level >= 5) {
        awarded.push('level_5');
    }

    // 3. 10-Day Streak
    if (!currentUserData.achievements.includes('10_day_streak')) {
        const today = new Date();
        for (const habit of currentUserData.habits.filter(h => h.type === 'good')) {
            let streak = 0;
            for (let i = 0; i < 10; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateString = d.toISOString().split('T')[0];
                const storedData = localStorage.getItem(`benvis_habits_${dateString}`);
                if (storedData && JSON.parse(storedData)[habit.name]) {
                    streak++;
                } else {
                    break;
                }
            }
            if (streak >= 10) {
                awarded.push('10_day_streak');
                break;
            }
        }
    }

    if (awarded.length > 0) {
        setUserData(prevData => {
            if (!prevData) return null;
            const updatedData = { ...prevData, achievements: [...prevData.achievements, ...awarded] };
            localStorage.setItem('benvis_user_data', JSON.stringify(updatedData));
            setNewAchievements(awarded); // Trigger notification for new achievements
            return updatedData;
        });
    }
  };


  useEffect(() => {
    if (userData) {
      checkAndAwardAchievements(userData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.goals, userData?.level]); // Check on goal/level changes


  const handleOnboardingComplete = (data: OnboardingData) => {
    const finalData: OnboardingData = {
        ...data,
        financialAccounts: [ 
            { id: 'default-cash', name: 'پول نقد', type: 'cash', balance: 0 },
            { id: 'default-savings', name: 'حساب پس‌انداز', type: 'bank', balance: 1000000 }
        ],
        budgets: [],
        transactions: [],
        transactionCategories: [
            { id: 'cat-exp-1', name: 'غذا', type: 'expense' },
            { id: 'cat-exp-2', name: 'حمل و نقل', type: 'expense' },
            { id: 'cat-exp-3', name: 'مسکن', type: 'expense' },
            { id: 'cat-exp-4', name: 'سرگرمی', type: 'expense' },
            { id: 'cat-exp-5', name: 'سلامتی', type: 'expense' },
            { id: 'cat-exp-6', name: 'قبوض', type: 'expense', icon: 'Bolt', color: '#f59e0b' },
            { id: 'cat-inc-1', name: 'حقوق', type: 'income' },
            { id: 'cat-inc-2', name: 'پروژه', type: 'income' },
        ],
        incomeAnalysis: { sources: [], report: null, lastUpdated: null },
    };
    localStorage.setItem('benvis_user_data', JSON.stringify(finalData));
    setUserData(finalData);
  };
  
  const handleUpdateUserData = (data: OnboardingData) => {
    localStorage.setItem('benvis_user_data', JSON.stringify(data));
    setUserData(data);
    checkAndAwardAchievements(data); // Also check when habits are completed
  };

  const addXp = (amount: number) => {
    setUserData(prevData => {
      if (!prevData) return null;

      const newXp = prevData.xp + amount;
      let tempXp = newXp;
      let tempLevel = prevData.level;
      let requiredXpForNext = tempLevel * 100;
      let totalXpForPreviousLevels = 0;
      for (let i = 1; i < tempLevel; i++) {
          totalXpForPreviousLevels += i * 100;
      }
      
      let leveledUp = false;
      while ((tempXp - totalXpForPreviousLevels) >= requiredXpForNext) {
        totalXpForPreviousLevels += requiredXpForNext;
        tempLevel++;
        requiredXpForNext = tempLevel * 100;
        leveledUp = true;
      }

      if(leveledUp) {
        console.log(`Level Up! Reached level ${tempLevel}`);
        setLevelUpInfo({ newLevel: tempLevel });
      }

      const updatedData = { ...prevData, xp: newXp, level: tempLevel };
      localStorage.setItem('benvis_user_data', JSON.stringify(updatedData));
      return updatedData;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F0B1A]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return userData ? (
    <DashboardScreen 
        userData={userData} 
        onUpdateUserData={handleUpdateUserData} 
        addXp={addXp}
        levelUpInfo={levelUpInfo}
        onLevelUpSeen={() => setLevelUpInfo(null)}
        newAchievements={newAchievements}
        onAchievementsSeen={() => setNewAchievements([])}
    />
  ) : (
    <OnboardingScreen onComplete={handleOnboardingComplete} />
  );
};

export default App;
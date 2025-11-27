
import React, { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { OnboardingData, AchievementID, MicroCourse, Habit, Book } from './types';
import { OnboardingScreen } from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-4 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">اوپس! مشکلی پیش آمد.</h1>
            <p className="mb-4">متاسفانه برنامه با خطا مواجه شد.</p>
            <button onClick={() => window.location.reload()} className="bg-white text-red-900 px-4 py-2 rounded font-bold">
              تلاش مجدد
            </button>
            <pre className="mt-4 text-xs opacity-50 text-left bg-black/30 p-2 rounded overflow-auto max-w-sm">
                {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DEFAULT_BOOKS: Book[] = [
    // --- توسعه فردی و موفقیت ---
    {
        id: 'book-atomic-habits',
        title: 'عادت‌های اتمی',
        author: 'جیمز کلیر',
        totalChapters: 20,
        totalPages: 320,
        currentChapter: 1,
        currentPage: 0,
        summary: 'راهنمایی برای ساختن عادت‌های خوب و ترک عادت‌های بد با تغییرات کوچک.',
        aiPersona: 'You are James Clear. Focus on systems, small improvements, and habit formation psychology.',
        status: 'want_to_read',
        coverColor: 'from-amber-500 to-orange-600',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
        uiHint: { themeColor: 'amber', coverStyle: 'minimal', icon: '⚛️' }
    },
    {
        id: 'book-compound-effect',
        title: 'اثر مرکب',
        author: 'دارن هاردی',
        totalChapters: 6,
        totalPages: 200,
        currentChapter: 1,
        currentPage: 0,
        summary: 'چگونه تصمیمات کوچک روزانه منجر به موفقیت‌های بزرگ می‌شوند.',
        aiPersona: 'You are Darren Hardy. Focus on consistency, small choices, and momentum.',
        status: 'want_to_read',
        coverColor: 'from-red-600 to-orange-700',
        coverImage: 'https://covers.openlibrary.org/b/id/8258969-L.jpg',
        uiHint: { themeColor: 'red', coverStyle: 'minimal', icon: '📈' }
    },
    {
        id: 'book-5am-club',
        title: 'باشگاه پنج صبح',
        author: 'رابین شارما',
        totalChapters: 17,
        totalPages: 330,
        currentChapter: 1,
        currentPage: 0,
        summary: 'سحرخیزی و روتین صبحگاهی برای دستیابی به نبوغ و آرامش.',
        aiPersona: 'You are Robin Sharma. Speak inspirationally about morning routines, mastery, and the 20/20/20 formula.',
        status: 'want_to_read',
        coverColor: 'from-orange-400 to-amber-500',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781443456623-L.jpg',
        uiHint: { themeColor: 'orange', coverStyle: 'minimal', icon: '🌅' }
    },
    {
        id: 'book-make-your-bed',
        title: 'تختخوابت را مرتب کن',
        author: 'ویلیام اچ. مک‌ریون',
        totalChapters: 10,
        totalPages: 130,
        currentChapter: 1,
        currentPage: 0,
        summary: 'چیزهای کوچکی که می‌توانند زندگی شما و شاید دنیا را تغییر دهند.',
        aiPersona: 'You are Admiral William H. McRaven. Speak with military discipline, focus on small tasks, resilience, and leadership.',
        status: 'want_to_read',
        coverColor: 'from-blue-700 to-slate-800',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781455570249-L.jpg',
        uiHint: { themeColor: 'blue', coverStyle: 'minimal', icon: '🛏️' }
    },
    {
        id: 'book-four-works',
        title: 'چهار اثر از فلورانس',
        author: 'فلورانس اسکاول شین',
        totalChapters: 4,
        totalPages: 360,
        currentChapter: 1,
        currentPage: 0,
        summary: 'آموزش‌هایی در باب قانون جذب، کلام و قدرت ذهن.',
        aiPersona: 'You are Florence Scovel Shinn. Speak about the power of the spoken word, divine design, and intuition.',
        status: 'want_to_read',
        coverColor: 'from-yellow-200 to-amber-300',
        coverImage: 'https://covers.openlibrary.org/b/id/10522512-L.jpg',
        uiHint: { themeColor: 'yellow', coverStyle: 'classic', icon: '✨' }
    },
    {
        id: 'book-four-agreements',
        title: 'چهار میثاق',
        author: 'دون میگوئل روئیز',
        totalChapters: 4,
        totalPages: 160,
        currentChapter: 1,
        currentPage: 0,
        summary: 'کتابی بر اساس خرد سرخپوستان تولتک برای دستیابی به آزادی شخصی.',
        aiPersona: 'You are Don Miguel Ruiz. Focus on the four agreements: Be impeccable with your word, Do not take anything personally, Do not make assumptions, Always do your best.',
        status: 'want_to_read',
        coverColor: 'from-orange-700 to-red-900',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781878424310-L.jpg',
        uiHint: { themeColor: 'orange', coverStyle: 'minimal', icon: '🔥' }
    },
    {
        id: 'book-wish-i-knew-20',
        title: 'کاش ۲۰ ساله بودم می‌فهمیدم',
        author: 'تینا سیلیگ',
        totalChapters: 12,
        totalPages: 200,
        currentChapter: 1,
        currentPage: 0,
        summary: 'درس‌هایی درباره کارآفرینی، خلاقیت و نوآوری برای جوانان.',
        aiPersona: 'You are Tina Seelig. Encourage creativity, challenging assumptions, and turning problems into opportunities.',
        status: 'want_to_read',
        coverColor: 'from-pink-500 to-rose-600',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780061732805-L.jpg',
        uiHint: { themeColor: 'pink', coverStyle: 'minimal', icon: '💡' }
    },
    {
        id: 'book-write-it-down',
        title: 'بنویس تا اتفاق بیفتد',
        author: 'هنریت آن کلاوسر',
        totalChapters: 20,
        totalPages: 256,
        currentChapter: 1,
        currentPage: 0,
        summary: 'چگونه با نوشتن اهداف و آرزوها، آن‌ها را به واقعیت تبدیل کنیم.',
        aiPersona: 'You are Henriette Anne Klauser. Focus on the power of writing, clarity, and manifesting goals through journaling.',
        status: 'want_to_read',
        coverColor: 'from-teal-500 to-cyan-600',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780684850023-L.jpg',
        uiHint: { themeColor: 'teal', coverStyle: 'minimal', icon: '✍️' }
    },
    {
        id: 'book-miracle-gratitude',
        title: 'معجزه شکرگزاری',
        author: 'راندا برن',
        totalChapters: 28,
        totalPages: 270,
        currentChapter: 1,
        currentPage: 0,
        summary: 'تمرینات ۲۸ روزه برای تغییر زندگی از طریق قدردانی.',
        aiPersona: 'You are Rhonda Byrne. Focus on the law of attraction and the transformative power of gratitude.',
        status: 'want_to_read',
        coverColor: 'from-yellow-400 to-orange-500',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781451673449-L.jpg',
        uiHint: { themeColor: 'yellow', coverStyle: 'minimal', icon: '🙏' }
    },
    {
        id: 'book-power-of-habit',
        title: 'قدرت عادت',
        author: 'چارلز داهیگ',
        totalChapters: 9,
        totalPages: 400,
        currentChapter: 1,
        currentPage: 0,
        summary: 'چرایی کارهایی که انجام می‌دهیم و چگونگی تغییر آن‌ها.',
        aiPersona: 'You are Charles Duhigg. Explain the habit loop (cue, routine, reward) and how to reshape behavior.',
        status: 'want_to_read',
        coverColor: 'from-yellow-500 to-amber-600',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781400069286-L.jpg',
        uiHint: { themeColor: 'yellow', coverStyle: 'minimal', icon: '🔄' }
    },
    {
        id: 'book-30-days',
        title: 'سی روز (تغییر عادت‌ها)',
        author: 'مارک رکلاو',
        totalChapters: 30,
        totalPages: 180,
        currentChapter: 1,
        currentPage: 0,
        summary: 'عادت‌هایتان را تغییر دهید تا زندگی‌تان تغییر کند.',
        aiPersona: 'You are Marc Reklau. Be direct, practical, and focus on daily small actions for 30 days.',
        status: 'want_to_read',
        coverColor: 'from-blue-500 to-indigo-600',
        coverImage: 'https://covers.openlibrary.org/b/id/8375926-L.jpg',
        uiHint: { themeColor: 'blue', coverStyle: 'minimal', icon: '🗓️' }
    },
    {
        id: 'book-first-last',
        title: 'اولی نباشی آخری میشی',
        author: 'گرنت کاردون',
        totalChapters: 15,
        totalPages: 280,
        currentChapter: 1,
        currentPage: 0,
        summary: 'استراتژی‌های فروش و موفقیت در بازار رقابتی.',
        aiPersona: 'You are Grant Cardone. Be high energy, aggressive about success, focus on sales and dominating the market.',
        status: 'want_to_read',
        coverColor: 'from-red-700 to-black',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780470624357-L.jpg',
        uiHint: { themeColor: 'red', coverStyle: 'bold', icon: '🥇' }
    },

    // --- ادبیات و رمان ---
    {
        id: 'book-little-prince',
        title: 'شازده کوچولو',
        author: 'آنتوان دو سنت اگزوپری',
        totalChapters: 27,
        totalPages: 96,
        currentChapter: 1,
        currentPage: 0,
        summary: 'داستانی فلسفی و شاعرانه درباره عشق، دوستی و نگاه به دنیا از چشم یک کودک.',
        aiPersona: 'You are the Little Prince. Speak innocently but profoundly. Talk about taming, roses, and invisible essentials.',
        status: 'want_to_read',
        coverColor: 'from-blue-400 to-indigo-500',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg',
        uiHint: { themeColor: 'blue', coverStyle: 'minimal', icon: '🦊' }
    },
    {
        id: 'book-alchemist',
        title: 'کیمیاگر',
        author: 'پائولو کوئلیو',
        totalChapters: 12,
        totalPages: 180,
        currentChapter: 1,
        currentPage: 0,
        summary: 'داستان چوپانی که در جستجوی گنج، افسانه شخصی خود را می‌یابد.',
        aiPersona: 'You are Paulo Coelho. Speak in metaphors, focus on destiny, dreams, and the language of the world.',
        status: 'want_to_read',
        coverColor: 'from-yellow-500 to-amber-700',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
        uiHint: { themeColor: 'yellow', coverStyle: 'minimal', icon: '🏜️' }
    },
    {
        id: 'book-mellat-eshgh',
        title: 'ملت عشق',
        author: 'الیف شافاک',
        totalChapters: 40,
        totalPages: 500,
        currentChapter: 1,
        currentPage: 0,
        summary: 'داستانی درباره چهل قانون عشق شمس تبریزی و مولانا.',
        aiPersona: 'You are a wise mystic inspired by Shams Tabrizi. Speak about love, connection, and the forty rules.',
        status: 'want_to_read',
        coverColor: 'from-rose-500 to-pink-700',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780143118527-L.jpg',
        uiHint: { themeColor: 'rose', coverStyle: 'minimal', icon: '🌹' }
    },
    {
        id: 'book-suicide-shop',
        title: 'مغازه خودکشی',
        author: 'ژان تولی',
        totalChapters: 15,
        totalPages: 160,
        currentChapter: 1,
        currentPage: 0,
        summary: 'رمانی فانتزی و سیاه درباره خانواده‌ای که ابزار خودکشی می‌فروشند.',
        aiPersona: 'You are Jean Teulé. Use dark humor, irony, and discuss the absurdity of life and death.',
        status: 'want_to_read',
        coverColor: 'from-slate-700 to-black',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9781906040093-L.jpg',
        uiHint: { themeColor: 'slate', coverStyle: 'dark', icon: '☠️' }
    },
    {
        id: 'book-nietzsche-wept',
        title: 'وقتی نیچه گریست',
        author: 'اروین یالوم',
        totalChapters: 22,
        totalPages: 400,
        currentChapter: 1,
        currentPage: 0,
        summary: 'رمانی روانشناختی درباره ملاقات خیالی فریدریش نیچه و یوزف بروئر.',
        aiPersona: 'You are Irvin D. Yalom. Discuss existentialism, obsession, despair, and the therapeutic relationship.',
        status: 'want_to_read',
        coverColor: 'from-stone-500 to-stone-700',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780465091720-L.jpg',
        uiHint: { themeColor: 'stone', coverStyle: 'classic', icon: '🧠' }
    },
    {
        id: 'book-animal-farm',
        title: 'قلعه حیوانات',
        author: 'جورج اورول',
        totalChapters: 10,
        totalPages: 140,
        currentChapter: 1,
        currentPage: 0,
        summary: 'تمثیلی سیاسی درباره انقلاب و فساد قدرت.',
        aiPersona: 'You are George Orwell. Speak critically about power, propaganda, and totalitarianism through allegory.',
        status: 'want_to_read',
        coverColor: 'from-red-800 to-red-950',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg',
        uiHint: { themeColor: 'red', coverStyle: 'classic', icon: '🐷' }
    },
    {
        id: 'book-midnight-library',
        title: 'کتابخانه نیمه‌شب',
        author: 'مت هیگ',
        totalChapters: 25,
        totalPages: 300,
        currentChapter: 1,
        currentPage: 0,
        summary: 'دختری که در کتابخانه‌ای بین مرگ و زندگی، زندگی‌های نزیسته خود را تجربه می‌کند.',
        aiPersona: 'You are the Librarian (Mrs. Elm). Speak about choices, regrets, and the infinite possibilities of life.',
        status: 'want_to_read',
        coverColor: 'from-indigo-800 to-blue-900',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg',
        uiHint: { themeColor: 'indigo', coverStyle: 'mystic', icon: '📚' }
    }
];

const DEFAULT_COURSES: MicroCourse[] = [
    {
        id: 'course-konkur-1404',
        title: 'برنامه‌ریزی جامع کنکور ۱۴۰۴',
        goal: 'قبولی در رشته‌های برتر دانشگاهی',
        days: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            focus: 'مقدمات و استراتژی',
            lesson: 'آشنایی با روش‌های تست‌زنی و مدیریت زمان',
            challenge: 'نوشتن برنامه مطالعاتی هفته اول',
            reflection: 'چه موانعی برای مطالعه دارم؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    },
    {
        id: 'course-comp-python',
        title: 'مبانی برنامه‌نویسی پایتون',
        goal: 'یادگیری اصول اولیه کدنویسی',
        days: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            focus: 'سینتکس و متغیرها',
            lesson: 'چگونه اولین برنامه خود را بنویسیم',
            challenge: 'نوشتن برنامه Hello World',
            reflection: 'برنامه‌نویسی چه کمکی به من می‌کند؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    },
    {
        id: 'course-lang-english',
        title: 'مکالمه انگلیسی در سفر',
        goal: 'یادگیری اصطلاحات ضروری سفر',
        days: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            focus: 'فرودگاه و هتل',
            lesson: 'لغات کلیدی برای چک‌ین و رزرو',
            challenge: 'ضبط صدای مکالمه فرضی',
            reflection: 'اعتماد به نفس من در مکالمه چقدر است؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    },
    {
        id: 'course-phys-quantum',
        title: 'فیزیک کوانتوم به زبان ساده',
        goal: 'درک مفاهیم پایه کوانتوم',
        days: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            focus: 'ذره یا موج؟',
            lesson: 'آزمایش دو شکاف و نتایج عجیب آن',
            challenge: 'توضیح آزمایش برای یک دوست',
            reflection: 'چگونه واقعیت تغییر می‌کند؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    },
    {
        id: 'course-human-philosophy',
        title: 'تاریخ فلسفه غرب',
        goal: 'آشنایی با اندیشه‌های سقراط تا کانت',
        days: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            focus: 'سقراط و پرسشگری',
            lesson: 'چرا زندگی نآزموده ارزش زیستن ندارد؟',
            challenge: 'پرسیدن ۵ سوال "چرا" در مورد یک باور',
            reflection: 'حقیقت چیست؟',
            completed: false
        })),
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    }
];

const App: React.FC = () => {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementID[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('benvis_user_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Check and populate default MicroCourses if missing
        if (!parsed.microCourses || parsed.microCourses.length === 0) {
            parsed.microCourses = DEFAULT_COURSES;
            localStorage.setItem('benvis_user_data', JSON.stringify(parsed));
        }
        
        setUserData(parsed);
      } catch (e) {
        console.error("Failed to load user data", e);
      }
    }
  }, []);

  const handleUpdateUserData = (data: OnboardingData) => {
    setUserData(data);
    localStorage.setItem('benvis_user_data', JSON.stringify(data));
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    // Add default content for new users
    const dataWithContent = { ...data, books: DEFAULT_BOOKS, microCourses: DEFAULT_COURSES };
    handleUpdateUserData(dataWithContent);
  };

  const addXp = (amount: number) => {
    if (!userData) return;
    const currentXp = userData.xp || 0;
    const newXp = currentXp + amount;
    const currentLevel = userData.level || 1;
    
    const xpForNextLevel = currentLevel * 100;
    
    if (newXp >= xpForNextLevel) {
        const newLevel = currentLevel + 1;
        setLevelUpInfo({ newLevel });
        handleUpdateUserData({ ...userData, xp: newXp, level: newLevel });
    } else {
        handleUpdateUserData({ ...userData, xp: newXp });
    }
  };

  if (!userData) {
    return (
      <ErrorBoundary>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardScreen 
        userData={userData}
        onUpdateUserData={handleUpdateUserData}
        addXp={addXp}
        levelUpInfo={levelUpInfo}
        onLevelUpSeen={() => setLevelUpInfo(null)}
        newAchievements={newAchievements}
        onAchievementsSeen={() => setNewAchievements([])}
      />
    </ErrorBoundary>
  );
};

export default App;

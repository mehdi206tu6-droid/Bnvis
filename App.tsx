import React, { useState, useEffect, type ReactNode, type ErrorInfo } from 'react';
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
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

// --- DATA GENERATION HELPERS ---

const generateBooks = (): Book[] => {
    // Helper to get Open Library Cover
    const olCover = (id: string) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
    
    const libraryDB = [
        // --- مذهبی و عرفانی (۲۰ کتاب) ---
        { t: 'قرآن کریم', a: 'وحی الهی', c: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Quran_Investigador.jpg/437px-Quran_Investigador.jpg', cat: 'religious' },
        { t: 'نهج‌البلاغه', a: 'امام علی (ع)', c: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Nahj_al-Balagha_cover.jpg/330px-Nahj_al-Balagha_cover.jpg', cat: 'religious' },
        { t: 'صحیفه سجادیه', a: 'امام سجاد (ع)', c: 'https://ketab.ir/images/book/large/1169000/1169871.jpg', cat: 'religious' },
        { t: 'کتاب مقدس', a: 'پیامبران', c: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Gutenberg_Bible_B42_f002r_Genesis.jpg/440px-Gutenberg_Bible_B42_f002r_Genesis.jpg', cat: 'religious' },
        { t: 'مثنوی معنوی', a: 'مولانا', c: olCover('12628485'), cat: 'poetry' },
        { t: 'فیه ما فیه', a: 'مولانا', c: olCover('12628485'), cat: 'poetry' },
        { t: 'کیمیاگر', a: 'پائولو کوئلیو', c: olCover('14549544'), cat: 'fiction' },
        { t: 'پیامبر', a: 'جبران خلیل جبران', c: olCover('12557434'), cat: 'philosophy' },
        { t: 'سیدارتا', a: 'هرمان هسه', c: olCover('8566687'), cat: 'fiction' },
        { t: 'انسان در جستجوی معنا', a: 'ویکتور فرانکل', c: olCover('8231697'), cat: 'psychology' },
        { t: 'تائوت چینگ', a: 'لائوتسه', c: olCover('8320493'), cat: 'philosophy' },
        { t: 'غزلیات شمس', a: 'مولانا', c: olCover('10567752'), cat: 'poetry' },
        { t: 'منطق الطیر', a: 'عطار', c: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Conference_of_the_Birds_Page_British_Museum.jpg/400px-Conference_of_the_Birds_Page_British_Museum.jpg', cat: 'poetry' },
        { t: 'اوستا', a: 'زرتشت', c: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Avesta_Zoroastrian.jpg/330px-Avesta_Zoroastrian.jpg', cat: 'religious' },
        { t: 'اصول کافی', a: 'شیخ کلینی', c: null, cat: 'religious' },
        { t: 'مفاتیح الجنان', a: 'شیخ عباس قمی', c: null, cat: 'religious' },
        { t: 'حلیة المتقین', a: 'علامه مجلسی', c: null, cat: 'religious' },
        { t: 'تفسیر المیزان', a: 'علامه طباطبایی', c: null, cat: 'religious' },
        { t: 'عرفان اسلامی', a: 'شهید مطهری', c: null, cat: 'religious' },
        { t: 'چهل حدیث', a: 'امام خمینی', c: null, cat: 'religious' },

        // --- ادبیات ایران (۳۰ کتاب) ---
        { t: 'دیوان حافظ', a: 'حافظ', c: olCover('12628490'), cat: 'poetry' },
        { t: 'شاهنامه', a: 'فردوسی', c: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Rustam_slays_the_dragon.jpg/440px-Rustam_slays_the_dragon.jpg', cat: 'poetry' },
        { t: 'گلستان', a: 'سعدی', c: olCover('10567756'), cat: 'poetry' },
        { t: 'بوستان', a: 'سعدی', c: olCover('12628492'), cat: 'poetry' },
        { t: 'بوف کور', a: 'صادق هدایت', c: olCover('12628495'), cat: 'fiction' },
        { t: 'سه قطره خون', a: 'صادق هدایت', c: olCover('12628496'), cat: 'fiction' },
        { t: 'چشم‌هایش', a: 'بزرگ علوی', c: olCover('12628497'), cat: 'fiction' },
        { t: 'سووشون', a: 'سیمین دانشور', c: olCover('12628498'), cat: 'fiction' },
        { t: 'جای خالی سلوچ', a: 'محمود دولت‌آبادی', c: olCover('12628499'), cat: 'fiction' },
        { t: 'کلیدر (جلد ۱)', a: 'محمود دولت‌آبادی', c: olCover('12628500'), cat: 'fiction' },
        { t: 'سمفونی مردگان', a: 'عباس معروفی', c: olCover('12628501'), cat: 'fiction' },
        { t: 'شازده احتجاب', a: 'هوشنگ گلشیری', c: null, cat: 'fiction' },
        { t: 'ماهی سیاه کوچولو', a: 'صمد بهرنگی', c: olCover('12628503'), cat: 'fiction' },
        { t: 'مدیر مدرسه', a: 'جلال آل‌احمد', c: null, cat: 'fiction' },
        { t: 'غرب‌زدگی', a: 'جلال آل‌احمد', c: null, cat: 'non-fiction' },
        { t: 'تنگسیر', a: 'صادق چوبک', c: null, cat: 'fiction' },
        { t: 'انتری که لوطی‌اش مرده بود', a: 'صادق چوبک', c: null, cat: 'fiction' },
        { t: 'همسایه‌ها', a: 'احمد محمود', c: null, cat: 'fiction' },
        { t: 'شوهر آهو خانم', a: 'علی‌محمد افغانی', c: null, cat: 'fiction' },
        { t: 'دایی‌جان ناپلئون', a: 'ایرج پزشک‌زاد', c: olCover('12628508'), cat: 'fiction' },
        { t: 'هشت کتاب', a: 'سهراب سپهری', c: null, cat: 'poetry' },
        { t: 'فروغ فرخزاد (دیوان)', a: 'فروغ فرخزاد', c: null, cat: 'poetry' },
        { t: 'زمستان', a: 'اخوان ثالث', c: null, cat: 'poetry' },
        { t: 'آیدا در آینه', a: 'احمد شاملو', c: null, cat: 'poetry' },
        { t: 'پاییز فصل آخر سال است', a: 'نسیم مرعشی', c: null, cat: 'fiction' },
        { t: 'چراغ‌ها را من خاموش می‌کنم', a: 'زویا پیرزاد', c: null, cat: 'fiction' },
        { t: 'روی ماه خداوند را ببوس', a: 'مصطفی مستور', c: null, cat: 'fiction' },
        { t: 'قهوه سرد آقای نویسنده', a: 'روزبه معین', c: null, cat: 'fiction' },
        { t: 'یک عاشقانه آرام', a: 'نادر ابراهیمی', c: null, cat: 'fiction' },
        { t: 'بار دیگر شهری که دوست می‌داشتم', a: 'نادر ابراهیمی', c: null, cat: 'fiction' },

        // --- ادبیات جهان (۵۰ کتاب) ---
        { t: 'جنایت و مکافات', a: 'داستایفسکی', c: olCover('12563383'), cat: 'fiction' },
        { t: 'برادران کارامازوف', a: 'داستایفسکی', c: olCover('8231575'), cat: 'fiction' },
        { t: 'ابله', a: 'داستایفسکی', c: olCover('8573295'), cat: 'fiction' },
        { t: 'جنگ و صلح', a: 'تولستوی', c: olCover('10567760'), cat: 'fiction' },
        { t: 'آنا کارنینا', a: 'تولستوی', c: olCover('12369673'), cat: 'fiction' },
        { t: 'بیگانه‌', a: 'آلبر کامو', c: olCover('11598923'), cat: 'fiction' },
        { t: 'طاعون', a: 'آلبر کامو', c: olCover('8756987'), cat: 'fiction' },
        { t: 'مسخ', a: 'فرانتس کافکا', c: olCover('12379532'), cat: 'fiction' },
        { t: 'محاکمه', a: 'فرانتس کافکا', c: olCover('10134567'), cat: 'fiction' },
        { t: '۱۹۸۴', a: 'جورج اورول', c: olCover('12643729'), cat: 'fiction' },
        { t: 'قلعه حیوانات', a: 'جورج اورول', c: olCover('10574768'), cat: 'fiction' },
        { t: 'شازده کوچولو', a: 'آنتوان دوسنت اگزوپری', c: olCover('12606553'), cat: 'fiction' },
        { t: 'صد سال تنهایی', a: 'گابریل گارسیا مارکز', c: olCover('12643730'), cat: 'fiction' },
        { t: 'عشق سال‌های وبا', a: 'گابریل گارسیا مارکز', c: olCover('8566789'), cat: 'fiction' },
        { t: 'گتسبی بزرگ', a: 'اسکات فیتزجرالد', c: olCover('12557436'), cat: 'fiction' },
        { t: 'پیرمرد و دریا', a: 'ارنست همینگوی', c: olCover('12557437'), cat: 'fiction' },
        { t: 'وداع با اسلحه', a: 'ارنست همینگوی', c: olCover('8231579'), cat: 'fiction' },
        { t: 'ناتور دشت', a: 'جی.دی. سلینجر', c: olCover('12557438'), cat: 'fiction' },
        { t: 'موش‌ها و آدم‌ها', a: 'جان اشتاین‌بک', c: olCover('8231580'), cat: 'fiction' },
        { t: 'خوشه‌های خشم', a: 'جان اشتاین‌بک', c: olCover('8231581'), cat: 'fiction' },
        { t: 'کوری', a: 'ژوزه ساراماگو', c: olCover('8573299'), cat: 'fiction' },
        { t: 'دنیای قشنگ نو', a: 'آلدوس هاکسلی', c: olCover('12557439'), cat: 'fiction' },
        { t: 'فارنهایت ۴۵۱', a: 'ری بردبری', c: olCover('12557440'), cat: 'fiction' },
        { t: 'کشتن مرغ مقلد', a: 'هارپر لی', c: olCover('12557441'), cat: 'fiction' },
        { t: 'غرور و تعصب', a: 'جین آستین', c: olCover('12557442'), cat: 'fiction' },
        { t: 'بلندی‌های بادگیر', a: 'امیلی برونته', c: olCover('12557443'), cat: 'fiction' },
        { t: 'جین ایر', a: 'شارلوت برونته', c: olCover('12557444'), cat: 'fiction' },
        { t: 'مادام بوواری', a: 'گوستاو فلوبر', c: olCover('12557445'), cat: 'fiction' },
        { t: 'بینوایان', a: 'ویکتور هوگو', c: olCover('12557446'), cat: 'fiction' },
        { t: 'گوژپشت نتردام', a: 'ویکتور هوگو', c: olCover('12557447'), cat: 'fiction' },
        { t: 'کنت مونت کریستو', a: 'الکساندر دوما', c: olCover('12557448'), cat: 'fiction' },
        { t: 'سه تفنگدار', a: 'الکساندر دوما', c: olCover('12557449'), cat: 'fiction' },
        { t: 'دکتر ژیواگو', a: 'بوریس پاسترناک', c: olCover('12557450'), cat: 'fiction' },
        { t: 'مرشد و مارگاریتا', a: 'بولگاکف', c: olCover('12557451'), cat: 'fiction' },
        { t: 'خرمگس', a: 'اتل لیلیان وینیچ', c: olCover('12557452'), cat: 'fiction' },
        { t: 'ملت عشق', a: 'الیف شافاک', c: olCover('12557453'), cat: 'fiction' },
        { t: 'بادبادک‌باز', a: 'خالد حسینی', c: olCover('12557454'), cat: 'fiction' },
        { t: 'هزار خورشید تابان', a: 'خالد حسینی', c: olCover('12557455'), cat: 'fiction' },
        { t: 'من پیش از تو', a: 'جوجو مویز', c: olCover('12557456'), cat: 'fiction' },
        { t: 'دختری در قطار', a: 'پائولا هاوکینز', c: olCover('12557457'), cat: 'fiction' },
        { t: 'کافکا در کرانه', a: 'هاروکی موراکامی', c: olCover('12557458'), cat: 'fiction' },
        { t: 'جنگل نروژی', a: 'هاروکی موراکامی', c: olCover('12557459'), cat: 'fiction' },
        { t: 'جزء از کل', a: 'استیو تولتز', c: olCover('12557460'), cat: 'fiction' },
        { t: 'عقاید یک دلقک', a: 'هاینریش بل', c: olCover('12557461'), cat: 'fiction' },
        { t: 'نان و شراب', a: 'اینیاتسیو سیلونه', c: null, cat: 'fiction' },
        { t: 'قلعه', a: 'فرانتس کافکا', c: null, cat: 'fiction' },
        { t: 'تهوع', a: 'ژان پل سارتر', c: null, cat: 'fiction' },
        { t: 'دیوار', a: 'ژان پل سارتر', c: null, cat: 'fiction' },
        { t: 'سقوط', a: 'آلبر کامو', c: null, cat: 'fiction' },
        { t: 'لولیتا', a: 'ناباکوف', c: null, cat: 'fiction' },

        // --- توسعه فردی و روانشناسی (۳۰ کتاب) ---
        { t: 'عادت‌های اتمی', a: 'جیمز کلیر', c: olCover('10523097'), cat: 'self-help' },
        { t: 'کار عمیق', a: 'کال نیوپورت', c: olCover('10574768'), cat: 'self-help' },
        { t: 'اثر مرکب', a: 'دارن هاردی', c: olCover('8258969'), cat: 'self-help' },
        { t: 'باشگاه پنج صبحی‌ها', a: 'رابین شارما', c: olCover('10523099'), cat: 'self-help' },
        { t: 'چهار میثاق', a: 'دون میگوئل روئیز', c: olCover('8258970'), cat: 'self-help' },
        { t: 'قدرت حال', a: 'اکهارت تول', c: olCover('8231698'), cat: 'self-help' },
        { t: 'هنر شفاف اندیشیدن', a: 'رولف دوبلی', c: olCover('10523100'), cat: 'psychology' },
        { t: 'تفکر سریع و کند', a: 'دانیل کانمن', c: olCover('10523101'), cat: 'psychology' },
        { t: 'بیندیشید و ثروتمند شوید', a: 'ناپلئون هیل', c: olCover('10523102'), cat: 'self-help' },
        { t: 'آیین دوست‌یابی', a: 'دیل کارنگی', c: olCover('10523103'), cat: 'self-help' },
        { t: 'هفت عادت مردمان مؤثر', a: 'استیون کاوی', c: olCover('10523104'), cat: 'self-help' },
        { t: 'قورباغه‌ات را قورت بده', a: 'برایان تریسی', c: olCover('10523105'), cat: 'self-help' },
        { t: 'پدر پولدار پدر بی‌پول', a: 'رابرت کیوساکی', c: olCover('10523106'), cat: 'finance' },
        { t: 'ثروتمندترین مرد بابل', a: 'جورج کلاسون', c: olCover('10523107'), cat: 'finance' },
        { t: 'روانشناسی پول', a: 'مورگان هاوزل', c: olCover('10523108'), cat: 'finance' },
        { t: 'اسنشیالیسم', a: 'گرگ مک‌کیون', c: olCover('10523109'), cat: 'self-help' },
        { t: 'جادوی نظم', a: 'ماری کوندو', c: olCover('10523110'), cat: 'self-help' },
        { t: 'قدرت عادت', a: 'چارلز داهیگ', c: olCover('10523111'), cat: 'psychology' },
        { t: 'سکوت', a: 'سوزان کین', c: olCover('10523112'), cat: 'psychology' },
        { t: 'تختت را مرتب کن', a: 'ویلیام مک‌ریون', c: olCover('10523113'), cat: 'self-help' },
        { t: 'شجاعت نقص بودن', a: 'برنی براون', c: null, cat: 'psychology' },
        { t: 'ذهنیت', a: 'کارول دوک', c: null, cat: 'psychology' },
        { t: 'جرأت بسیار', a: 'برنی براون', c: null, cat: 'psychology' },
        { t: 'انسان خردمند', a: 'یووال نوح هراری', c: olCover('10523114'), cat: 'history' },
        { t: 'انسان خداگونه', a: 'یووال نوح هراری', c: olCover('10523115'), cat: 'history' },
        { t: '۲۱ درس برای قرن ۲۱', a: 'یووال نوح هراری', c: olCover('10523116'), cat: 'history' },
        { t: 'تئوری انتخاب', a: 'ویلیام گلسر', c: null, cat: 'psychology' },
        { t: 'بازی‌ها', a: 'اریک برن', c: null, cat: 'psychology' },
        { t: 'وضعیت آخر', a: 'تامس هریس', c: null, cat: 'psychology' },
        { t: 'مانیفست قهرمان', a: 'رابین شارما', c: null, cat: 'self-help' },

        // --- علمی و فلسفی (۲۰ کتاب) ---
        { t: 'تاریخچه زمان', a: 'استیون هاوکینگ', c: olCover('10523120'), cat: 'science' },
        { t: 'طرح بزرگ', a: 'استیون هاوکینگ', c: olCover('10523121'), cat: 'science' },
        { t: 'جهان در پوست گردو', a: 'استیون هاوکینگ', c: null, cat: 'science' },
        { t: 'ژن خودخواه', a: 'ریچارد داوکینز', c: olCover('10523122'), cat: 'science' },
        { t: 'ساعت‌ساز نابینا', a: 'ریچارد داوکینز', c: null, cat: 'science' },
        { t: 'کیهان', a: 'کارل سیگن', c: olCover('10523123'), cat: 'science' },
        { t: 'دنیای سوفی', a: 'یوستین گردر', c: olCover('10523124'), cat: 'philosophy' },
        { t: 'ضیافت', a: 'افلاطون', c: null, cat: 'philosophy' },
        { t: 'جمهور', a: 'افلاطون', c: null, cat: 'philosophy' },
        { t: 'اخلاق نیکوماخوس', a: 'ارسطو', c: null, cat: 'philosophy' },
        { t: 'چنین گفت زرتشت', a: 'نیچه', c: olCover('10523125'), cat: 'philosophy' },
        { t: 'فراسوی نیک و بد', a: 'نیچه', c: null, cat: 'philosophy' },
        { t: 'در باب حکمت زندگی', a: 'شوپنهاور', c: null, cat: 'philosophy' },
        { t: 'تسلی‌بخشی‌های فلسفه', a: 'آلن دو باتن', c: olCover('10523126'), cat: 'philosophy' },
        { t: 'جستارهایی در باب عشق', a: 'آلن دو باتن', c: null, cat: 'philosophy' },
        { t: 'اضطراب منزلت', a: 'آلن دو باتن', c: null, cat: 'philosophy' },
        { t: 'عدالت', a: 'مایکل سندل', c: null, cat: 'philosophy' },
        { t: 'تاریخ فلسفه غرب', a: 'برتراند راسل', c: null, cat: 'philosophy' },
        { t: 'لویاتان', a: 'توماس هابز', c: null, cat: 'philosophy' },
        { t: 'شهریار', a: 'ماکیاولی', c: olCover('10523127'), cat: 'philosophy' },

        // --- بیزینس و مدیریت (۲۰ کتاب) ---
        { t: 'صفر به یک', a: 'پیتر تیل', c: olCover('10523130'), cat: 'business' },
        { t: 'نوپای ناب', a: 'اریک ریس', c: olCover('10523131'), cat: 'business' },
        { t: 'کفش‌باز', a: 'فیل نایت', c: olCover('10523132'), cat: 'biography' },
        { t: 'استیو جابز', a: 'والتر آیزاکسون', c: olCover('10523133'), cat: 'biography' },
        { t: 'ایلان ماسک', a: 'اشلی ونس', c: olCover('10523134'), cat: 'biography' },
        { t: 'رهبری', a: 'الکس فرگوسن', c: null, cat: 'business' },
        { t: 'اصول', a: 'ری دالیو', c: null, cat: 'business' },
        { t: 'از خوب به عالی', a: 'جیم کالینز', c: olCover('10523135'), cat: 'business' },
        { t: 'ساختن برای ماندن', a: 'جیم کالینز', c: null, cat: 'business' },
        { t: 'قبخ (Nudge)', a: 'ریچارد تالر', c: null, cat: 'business' },
        { t: 'قوی سیاه', a: 'نسیم طالب', c: olCover('10523136'), cat: 'business' },
        { t: 'پوست در بازی', a: 'نسیم طالب', c: null, cat: 'business' },
        { t: 'ضد شکننده', a: 'نسیم طالب', c: null, cat: 'business' },
        { t: 'مدیر یک دقیقه‌ای', a: 'کن بلانچارد', c: null, cat: 'business' },
        { t: 'چه کسی پنیر مرا جابجا کرد', a: 'اسپنسر جانسون', c: olCover('10523137'), cat: 'self-help' },
        { t: 'گاو بنفش', a: 'ست گادین', c: null, cat: 'business' },
        { t: 'مهره حیاتی', a: 'ست گادین', c: null, cat: 'business' },
        { t: 'بازاریابی اجازه‌ای', a: 'ست گادین', c: null, cat: 'business' },
        { t: 'استراتژی اقیانوس آبی', a: 'چان کیم', c: null, cat: 'business' },
        { t: 'طراحی ارزش پیشنهادی', a: 'الکساندر اوستروالدر', c: null, cat: 'business' },

        // --- فانتزی و علمی تخیلی (۳۰ کتاب) ---
        { t: 'هری پاتر و سنگ جادو', a: 'جی.کی. رولینگ', c: olCover('10523140'), cat: 'fantasy' },
        { t: 'هری پاتر و تالار اسرار', a: 'جی.کی. رولینگ', c: olCover('10523141'), cat: 'fantasy' },
        { t: 'هری پاتر و زندانی آزکابان', a: 'جی.کی. رولینگ', c: olCover('10523142'), cat: 'fantasy' },
        { t: 'ارباب حلقه‌ها: یاران حلقه', a: 'تالکین', c: olCover('10523143'), cat: 'fantasy' },
        { t: 'ارباب حلقه‌ها: دو برج', a: 'تالکین', c: olCover('10523144'), cat: 'fantasy' },
        { t: 'ارباب حلقه‌ها: بازگشت شاه', a: 'تالکین', c: olCover('10523145'), cat: 'fantasy' },
        { t: 'هابیت', a: 'تالکین', c: olCover('10523146'), cat: 'fantasy' },
        { t: 'بازی تاج و تخت', a: 'جورج آر.آر. مارتین', c: olCover('10523147'), cat: 'fantasy' },
        { t: 'نبرد پادشاهان', a: 'جورج آر.آر. مارتین', c: null, cat: 'fantasy' },
        { t: 'طوفان شمشیرها', a: 'جورج آر.آر. مارتین', c: null, cat: 'fantasy' },
        { t: 'تل‌ماسه (Dune)', a: 'فرانک هربرت', c: olCover('10523148'), cat: 'sci-fi' },
        { t: 'بنیاد', a: 'آیزاک آسیموف', c: olCover('10523149'), cat: 'sci-fi' },
        { t: 'من، ربات', a: 'آیزاک آسیموف', c: null, cat: 'sci-fi' },
        { t: 'پایان ابدیت', a: 'آیزاک آسیموف', c: null, cat: 'sci-fi' },
        { t: 'ادیسه فضایی ۲۰۱۰', a: 'آرتور سی کلارک', c: olCover('10523150'), cat: 'sci-fi' },
        { t: 'مریخی', a: 'اندی ویر', c: olCover('10523151'), cat: 'sci-fi' },
        { t: 'پروژه هیل مری', a: 'اندی ویر', c: null, cat: 'sci-fi' },
        { t: 'راهنمای مسافران کهکشان', a: 'داگلاس آدامز', c: olCover('10523152'), cat: 'sci-fi' },
        { t: 'بازیکن شماره یک آماده', a: 'ارنست کلاین', c: null, cat: 'sci-fi' },
        { t: 'نیروی اهریمنی‌اش', a: 'فیلیپ پولمن', c: null, cat: 'fantasy' },
        { t: 'پرسی جکسون', a: 'ریک ریوردن', c: null, cat: 'fantasy' },
        { t: 'عطش مبارزه', a: 'سوزان کالینز', c: null, cat: 'sci-fi' },
        { t: 'سنت‌شکن', a: 'ورونیکا راث', c: null, cat: 'sci-fi' },
        { t: 'دونده هزارتو', a: 'جیمز دشنر', c: null, cat: 'sci-fi' },
        { t: 'کتابخانه نیمه‌شب', a: 'مت هیگ', c: null, cat: 'fiction' },
        { t: 'مردی به نام اوه', a: 'فردریک بکمن', c: null, cat: 'fiction' },
        { t: 'مردم مشوش', a: 'فردریک بکمن', c: null, cat: 'fiction' },
        { t: 'مادربزرگ سلام رساند', a: 'فردریک بکمن', c: null, cat: 'fiction' },
        { t: 'بریت ماری اینجا بود', a: 'فردریک بکمن', c: null, cat: 'fiction' },
        { t: 'کوری', a: 'ژوزه ساراماگو', c: null, cat: 'fiction' },
    ];

    // Generate colors based on category
    const getCategoryColor = (cat: string) => {
        switch(cat) {
            case 'religious': return 'from-emerald-800 to-green-950';
            case 'poetry': return 'from-rose-800 to-pink-950';
            case 'fiction': return 'from-blue-800 to-indigo-950';
            case 'psychology': return 'from-violet-800 to-purple-950';
            case 'history': return 'from-amber-800 to-yellow-950';
            case 'science': return 'from-cyan-800 to-sky-950';
            case 'philosophy': return 'from-slate-700 to-slate-900';
            case 'business': return 'from-gray-800 to-zinc-950';
            case 'fantasy': return 'from-fuchsia-800 to-purple-950';
            case 'sci-fi': return 'from-indigo-900 to-blue-950';
            case 'biography': return 'from-stone-700 to-stone-900';
            default: return 'from-slate-700 to-slate-900';
        }
    };

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'religious': return '🕌';
            case 'poetry': return '🍷';
            case 'fiction': return '📖';
            case 'psychology': return '🧠';
            case 'history': return '🏺';
            case 'science': return '🧬';
            case 'philosophy': return '🤔';
            case 'business': return '💼';
            case 'fantasy': return '🐉';
            case 'sci-fi': return '🚀';
            default: return '📚';
        }
    };

    // Fill the rest to 200 with variations if needed or just use the DB
    // Current DB has ~150 items. Let's map them.
    const books: Book[] = libraryDB.map((b, i) => ({
        id: `book-lib-${i}`,
        title: b.t,
        author: b.a,
        totalChapters: Math.floor(Math.random() * 20) + 10,
        totalPages: Math.floor(Math.random() * 400) + 150,
        currentChapter: 1,
        currentPage: 0,
        summary: `خلاصه‌ای از کتاب ${b.t} اثر ${b.a}.`,
        aiPersona: `You are ${b.a}. Discuss ${b.t}.`,
        status: 'want_to_read',
        coverColor: getCategoryColor(b.cat || 'fiction'),
        coverImage: b.c || undefined,
        uiHint: { themeColor: 'slate', coverStyle: 'classic', icon: getIcon(b.cat || 'fiction') }
    }));

    return books;
};

const generateCourses = (): MicroCourse[] => {
    // Helper to create a course object
    const create = (cat: string, sub: string, title: string, goal: string, daysCount: number = 7): MicroCourse => ({
        id: `course-${cat}-${sub}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        goal,
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        days: Array.from({length: daysCount}, (_, i) => ({
            day: i + 1,
            focus: `جلسه ${i + 1}: ${title}`,
            lesson: 'محتوای آموزشی جامع و کاربردی...',
            challenge: 'تمرین عملی مربوط به درس',
            reflection: 'نکته کلیدی که یاد گرفتید چه بود؟',
            completed: false
        }))
    });

    const courses: MicroCourse[] = [];

    // --- 1. LANGUAGE (LANG) - 20 Languages ---
    const langs = [
        ['english', 'انگلیسی جامع (IELTS/TOEFL)', 'تسلط بر ۴ مهارت اصلی'],
        ['french', 'فرانسوی (A1-B2)', 'مکالمه و گرامر پاریس'],
        ['german', 'آلمانی (Goethe)', 'مهاجرت کاری و تحصیلی'],
        ['spanish', 'اسپانیایی کاربردی', 'سفر و فرهنگ لاتین'],
        ['italian', 'ایتالیایی شیرین', 'هنر، غذا و مکالمه'],
        ['russian', 'روسی مقدماتی تا پیشرفته', 'ادبیات و تجارت'],
        ['chinese', 'چینی ماندارین', 'تجارت با چین و HSK'],
        ['japanese', 'ژاپنی (JLPT)', 'انیمه، فرهنگ و کار'],
        ['korean', 'کره‌ای (Topik)', 'مهاجرت و کی‌پاپ'],
        ['turkish', 'ترکی استانبولی', 'سفر و مکالمه روزمره'],
        ['arabic', 'عربی فصیح و لهجه', 'دین، تجارت و سفر'],
        ['portuguese', 'پرتغالی (برزیل)', 'سفر به آمریکای جنوبی'],
        ['dutch', 'هلندی', 'زندگی در هلند و بلژیک'],
        ['swedish', 'سوئدی', 'کار و زندگی در اسکاندیناوی'],
        ['hindi', 'هندی', 'فرهنگ و سینمای هند'],
        ['persian_adv', 'فارسی پیشرفته (ادبی)', 'شعرخوانی و متون کهن'],
        ['greek', 'یونانی', 'اساطیر و سفر'],
        ['polish', 'لهستانی', 'تاریخ و مکالمه'],
        ['thai', 'تایلندی', 'سفر به شرق آسیا'],
        ['vietnamese', 'ویتنامی', 'کسب و کار و سفر']
    ];
    langs.forEach(([key, title, goal]) => courses.push(create('lang', key, title, goal, 30)));

    // --- 2. TECHNOLOGY (TECH) - 30 Courses ---
    const techs = [
        'پایتون مقدماتی تا پیشرفته', 'جاوا اسکریپت مدرن (ES6+)', 'React.js و Next.js', 'توسعه بک‌اند با Node.js',
        'هوش مصنوعی و یادگیری ماشین', 'علم داده (Data Science)', 'امنیت سایبری و هک اخلاقی', 'DevOps و CI/CD',
        'داکر و کوبرنتیز', 'برنامه‌نویسی اندروید (Kotlin)', 'برنامه‌نویسی iOS (Swift)', 'فلاتر (Flutter)',
        'طراحی UI/UX', 'فیگما برای طراحان', 'بلاکچین و قرارداد هوشمند', 'اینترنت اشیاء (IoT)',
        'برنامه‌نویسی C++', 'سی‌شارپ و .NET', 'جاوا اینترپرایز', 'پایگاه داده SQL & NoSQL',
        'لینوکس و اسکریپت‌نویسی', 'شبکه (Network+)', 'سئو (SEO) تخصصی', 'وردپرس و طراحی سایت',
        'بازی‌سازی با یونیتی', 'Unreal Engine', 'تحلیل داده با Excel', 'Power BI و مصورسازی',
        'رباتیک و آردوینو', 'رایانش ابری (AWS/Azure)'
    ];
    techs.forEach((title, i) => courses.push(create('tech', `t${i}`, title, 'یادگیری مهارت‌های پولساز تکنولوژی', 14)));

    // --- 3. ASTRONOMY (SCHOOL/SCIENCE) - 20 Courses ---
    const astronomy = [
        'منظومه شمسی و سیارات', 'زندگی و مرگ ستارگان', 'کهکشان‌ها و راه شیری', 'سیاه‌چاله‌ها و کرم‌چاله‌ها',
        'کیهان‌شناسی و بیگ بنگ', 'سیارات فراخورشیدی', 'تاریخ نجوم و اکتشافات', 'تلسکوپ‌ها و رصد آماتوری',
        'عکاسی نجومی (Astrophotography)', 'فیزیک فضایی', 'سفر به مریخ و استعمار فضا', 'ایستگاه فضایی بین‌المللی',
        'ماده تاریک و انرژی تاریک', 'نظریه نسبیت انیشتین', 'صور فلکی و اساطیر', 'آب و هوا و طوفان‌های خورشیدی',
        'زیست‌اخترشناسی (حیات بیگانه)', 'ماهواره‌ها و فناوری فضایی', 'شهاب‌سنگ‌ها و دنباله‌دارها', 'آینده اکتشافات فضایی'
    ];
    astronomy.forEach((title, i) => courses.push(create('school', `astro${i}`, title, 'سفر به اعماق کیهان', 10)));

    // --- 4. MEDICINE (SCHOOL/SCIENCE) - 10 Courses ---
    const medicine = [
        'کمک‌های اولیه و احیاء (CPR)', 'آناتومی بدن انسان', 'تغذیه و رژیم درمانی', 'مبانی علوم اعصاب (Neuroscience)',
        'روانشناسی سلامت', 'ایمونولوژی و سیستم ایمنی', 'داروشناسی کاربردی', 'مبانی قلب و عروق',
        'ژنتیک پزشکی', 'بهداشت عمومی و پیشگیری'
    ];
    medicine.forEach((title, i) => courses.push(create('school', `med${i}`, title, 'آشنایی با شگفتی‌های بدن و سلامت', 12)));

    // --- 5. MATH (SCHOOL) - 10 Courses ---
    const math = [
        'جبر و معادلات', 'حساب دیفرانسیل و انتگرال', 'هندسه تحلیلی', 'آمار و احتمالات',
        'ریاضیات گسسته', 'جبر خطی', 'نظریه اعداد', 'نظریه بازی‌ها', 'تپولوژی مقدماتی', 'ریاضیات مهندسی'
    ];
    math.forEach((title, i) => courses.push(create('school', `math${i}`, title, 'ورزش ذهن و منطق', 15)));

    // --- 6. PHYSICS (SCHOOL) - 10 Courses ---
    const physics = [
        'مکانیک کلاسیک (نیوتنی)', 'فیزیک کوانتوم', 'ترمودینامیک', 'الکتریسیته و مغناطیس',
        'نورشناسی (اپتیک)', 'نسبیت خاص و عام', 'فیزیک ذرات بنیادی', 'اخترفیزیک', 'فیزیک هسته‌ای', 'دینامیک سیالات'
    ];
    physics.forEach((title, i) => courses.push(create('school', `phys${i}`, title, 'درک قوانین جهان هستی', 15)));

    // --- 7. ENGINEERING & VOCATIONAL (BUSINESS/TECH) - 20 Courses ---
    const eng = [
        'مهندسی برق و الکترونیک', 'مهندسی مکانیک خودرو', 'عمران و نقشه‌کشی', 'معماری و دکوراسیون داخلی',
        'جوشکاری صنعتی', 'تاسیسات و لوله‌کشی', 'تعمیرات موبایل و لپ‌تاپ', 'برق ساختمان و هوشمندسازی',
        'مهندسی شیمی و فرآیند', 'مدیریت پروژه (PMP)', 'ایمنی و بهداشت (HSE)', 'کنترل کیفیت',
        'انرژی‌های تجدیدپذیر', 'طراحی صنعتی', 'چاپ سه بعدی و CNC', 'نجاری و صنایع چوب',
        'خیاطی و طراحی لباس', 'سفالگری و سرامیک', 'کشاورزی مدرن', 'مدیریت زنجیره تامین'
    ];
    eng.forEach((title, i) => courses.push(create('business', `eng${i}`, title, 'مهارت‌های فنی و مهندسی بازار کار', 20)));

    // --- 8. ART & LITERATURE (ART) - Mixed ---
    const arts = [
        'تاریخ هنر جهان', 'نقد ادبی', 'نویسندگی خلاق پیشرفته', 'شعر نو و کلاسیک',
        'تئوری موسیقی', 'فیلم‌نامه نویسی', 'عکاسی حرفه‌ای', 'نقاشی دیجیتال', 'خوشنویسی و کالیگرافی', 'تئاتر و بازیگری'
    ];
    arts.forEach((title, i) => courses.push(create('art', `art${i}`, title, 'پرورش خلاقیت و روح', 10)));

    return courses;
};

const DEFAULT_BOOKS = generateBooks();
const DEFAULT_COURSES = generateCourses();

const App: React.FC = () => {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementID[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('benvis_user_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        let hasChanges = false;

        // Force update default courses
        const existingCourses = parsed.microCourses || [];
        const existingIds = new Set(existingCourses.map((c: any) => c.id));
        
        const newDefaults = DEFAULT_COURSES.filter(c => !existingIds.has(c.id));
        
        if (newDefaults.length > 0) {
            parsed.microCourses = [...existingCourses, ...newDefaults];
            hasChanges = true;
        }

        // Force update default books (Merge with existing)
        const existingBooks = parsed.books || [];
        const existingBookTitles = new Set(existingBooks.map((b: any) => b.title));
        
        // Add new books that are not in the user's library
        const newBooks = DEFAULT_BOOKS.filter(b => !existingBookTitles.has(b.title));
        
        if (newBooks.length > 0) {
             parsed.books = [...existingBooks, ...newBooks];
             hasChanges = true;
        }

        if (hasChanges) {
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
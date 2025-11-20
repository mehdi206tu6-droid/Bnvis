
import type { FC } from 'react';

export type ThemeName = 
    | 'benvis_classic' 
    | 'oceanic_deep' 
    | 'forest_whisper' 
    | 'sunset_bliss' 
    | 'galaxy_dream' 
    | 'cyberpunk_neon' 
    | 'royal_gold' 
    | 'zen_garden' 
    | 'crimson_night' 
    | 'pastel_dream' 
    | 'custom';

export type NotificationTiming = '1h' | '6h' | '1d';
export type NotificationType = 'tasks' | 'reminders' | 'daily_report' | 'budget_alerts' | 'low_balance_warnings';

export interface NotificationSetting {
    enabled: boolean;
    timing?: NotificationTiming;
    sound?: string;
    time?: string; // For daily report
}

export interface DailyReportSetting extends NotificationSetting {
    time: string;
}

export interface Habit {
    name: string;
    type: 'good' | 'bad';
    category?: string;
    icon?: string;
    color?: string;
    notification?: NotificationSetting;
}

export interface KeyResult {
    id: string;
    title: string;
    baseline: number;
    current: number;
    target: number;
    unit: string;
}

export interface SmartCriteria {
    specific?: string;
    measurable?: string;
    achievable?: string;
    relevant?: string;
    timeBound?: string;
    effort?: string;
    actionSteps?: string[];
}

export interface JourneyMilestone {
    id: string;
    title: string;
    description: string;
    tasks: { id: string; title: string; completed: boolean }[];
}

export interface UserGoal {
    id: string;
    title: string;
    type: 'simple' | 'smart' | 'journey' | 'okr';
    description?: string;
    icon: string;
    progress: number;
    progressHistory: { date: string; progress: number }[];
    targetDate?: string;
    linkedHabits?: string[];
    pomodorosToComplete?: number;
    pomodorosCompleted?: number;
    keyResults?: KeyResult[];
    smartCriteria?: SmartCriteria;
    milestones?: JourneyMilestone[];
}

export interface StandaloneTask {
    id: string;
    title: string;
    urgent: boolean;
    important: boolean;
    completed: boolean;
}

export interface TimeBlock {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    type: 'focus' | 'break' | 'routine' | 'meeting';
}

export interface ShopItem {
    id: string;
    title: string;
    description: string;
    price: number;
    type: 'theme' | 'badge';
    value?: string;
    purchased: boolean;
}

export interface CircleMember {
    id: string;
    name: string;
    score: number;
}

export interface CircleSummaryData {
    groupProgress: string;
    memberHighlights: {
        name: string;
        wins: string[];
        growthOpportunities: string[];
    }[];
    nextWeekChallenge: string;
    motivationMessage: string;
}

export interface SocialCircle {
    id: string;
    name: string;
    members: CircleMember[];
    summaries: { date: string; data: CircleSummaryData }[];
}

export interface MicroCourseDay {
    day: number;
    focus: string;
    lesson: string;
    challenge: string;
    reflection: string;
    completed: boolean;
    userReflection?: string;
}

export interface MicroCourse {
    id: string;
    title: string;
    goal: string;
    days: MicroCourseDay[];
    progress: number;
    status: 'active' | 'completed';
    createdAt: string;
}

export interface CalendarEvent {
    id: string;
    date: string;
    time?: string;
    text: string;
}

export type TransactionType = 'income' | 'expense';

export interface TransactionCategory {
    id: string;
    name: string;
    type: TransactionType;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    categoryId: string;
    accountId: string;
}

export interface Budget {
    categoryId: string;
    amount: number;
}

export interface FinancialAccount {
    id: string;
    name: string;
    type: 'card' | 'cash' | 'bank';
    balance: number;
}

export type IncomeVariability = 'fixed' | 'variable';
export type Rating = 'low' | 'medium' | 'high';

export interface IncomeSource {
    id: string;
    name: string;
    role?: string;
    type: 'main_job' | 'freelance' | 'investment' | 'rent' | 'online_store' | 'other';
    avgMonthlyIncome: number;
    incomeType: IncomeVariability;
    stability: Rating;
    growthPotential: Rating;
    risk: Rating;
    associatedCosts?: string;
}

export interface IncomeAnalysis {
    sources: IncomeSource[];
    report: string | null;
    lastUpdated: string;
}

export interface LifeWheelCategory {
    id: string;
    label: string;
    score: number;
}

export interface LifeWheelAssessment {
    date: string;
    categories: LifeWheelCategory[];
    analysis: string;
}

export interface CycleLog {
    date: string;
    symptoms: string[];
    mood?: 'happy' | 'energetic' | 'sensitive' | 'tired' | 'anxious' | 'irritable';
    flow?: 'spotting' | 'light' | 'medium' | 'heavy';
}

export interface WomenHealthData {
    cycleLogs: CycleLog[];
    periodStarts: string[];
    avgCycleLength: number;
    partner: { enabled: boolean; name: string };
}

export interface OnboardingData {
    fullName: string;
    age: string;
    role: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    notifications: {
        tasks: NotificationSetting;
        reminders: NotificationSetting;
        daily_report: DailyReportSetting;
        budget_alerts?: NotificationSetting;
        low_balance_warnings?: NotificationSetting;
    };
    theme: {
        name: ThemeName;
        customColor?: string;
        animations?: { enabled: boolean };
    };
    xp: number;
    level: number;
    habits: Habit[];
    goals: UserGoal[];
    tasks: StandaloneTask[];
    timeBlocks: TimeBlock[];
    shopInventory: ShopItem[];
    socialCircles: SocialCircle[];
    microCourses: MicroCourse[];
    calendarEvents: CalendarEvent[];
    transactions: Transaction[];
    budgets: Budget[];
    financialAccounts: FinancialAccount[];
    transactionCategories: TransactionCategory[];
    incomeAnalysis?: IncomeAnalysis;
    lifeWheel?: LifeWheelAssessment;
    womenHealth?: WomenHealthData;
    achievements: AchievementID[];
    books: Book[];
}

export type AchievementID = string;

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface BookNote {
    id: string;
    chapter: number;
    content: string;
    createdAt: string;
}

export interface BookVocabulary {
    id: string;
    word: string;
    definition: string;
    page?: number;
    createdAt: string;
}

// --- Advanced BookBuilder & Spiritual Types ---

export interface BookUIHint {
    themeColor: string;
    coverStyle: string; // 'modern' | 'classic' | 'minimal' | 'mystic'
    icon: string;
}

export interface BookPage {
    page: number;
    content: string;
}

export interface BookChapter {
    id: string;
    title: string;
    summary: string;
    pages: number[];
}

export interface RagChunk {
    id: string;
    sourcePages: number[];
    text: string;
}

export interface BookMethod {
    id: string;
    name: string;
    summary: string;
    steps: string[];
    sourceChapter?: string;
}

export interface ApplicationIdea {
    feature: string;
    description: string;
    methodRefs: string[];
}

export interface BookHighlight {
    text: string;
    page: number;
    note?: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    totalChapters: number;
    currentChapter: number;
    summary: string;
    aiPersona: string; // System prompt for the "Spirit of the Book"
    status: 'reading' | 'completed' | 'wishlist';
    coverColor: string;
    coverImage?: string;
    genre?: string;
    publishedYear?: string;
    tags?: string[];
    lastReadDate?: string;
    notes?: BookNote[];
    vocabulary?: BookVocabulary[];
    contentSource?: string; // Legacy simple text or generated summary
    chatHistory?: ChatMessage[];
    
    // Advanced Structure
    uiHint?: BookUIHint;
    pages?: BookPage[];
    chapters?: BookChapter[];
    ragChunks?: RagChunk[];
    methods?: BookMethod[]; // Actionable steps extracted from book
    applicationIdeas?: ApplicationIdea[]; // How to use this book in Benvis
    highlights?: BookHighlight[];
}

export interface Note {
    id: string;
    content: string;
    createdAt: string;
}

export interface GratitudeEntry {
    id: string;
    content: string;
    createdAt: string;
}

export interface Agent {
    id: string;
    title: string;
    description: string;
    icon: FC<any>;
    model: string;
    systemPrompt: string;
    inputSchema: Record<string, any>;
    responseSchema: any;
}

export interface FocusSession {
    date: string;
    duration: number;
    goalId: string | null;
}

export interface SmartNotification {
    message: string;
    reason: string;
    bestTimeToSend: string;
}

export interface RescheduleSuggestion {
    recommendedTime: string;
    reason: string;
    alternatives: string[];
}

export interface EncryptedBackup {
    data: string;
    iv: string;
    salt: string;
    version: number;
}

// Interfaces for Web Speech API
export interface SpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
        };
    };
}

export interface SpeechRecognitionErrorEvent {
    error: string;
}

export interface SpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
}

// Augment Window interface to include webkitSpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: {
            new (): SpeechRecognition;
        };
    }
}

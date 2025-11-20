
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

export interface ThemeSettings {
  name: ThemeName;
  animations?: { enabled: boolean; };
  customColor?: string;
}

export interface Habit {
  name: string;
  type: 'good' | 'bad';
  category?: string;
  icon?: string;
  color?: string;
  notification?: NotificationSetting;
}

export interface CalendarEvent {
    id: string; // ISO string date as ID
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    text: string;
}

export type TransactionType = 'income' | 'expense';

export interface TransactionCategory {
    id: string;
    name: string;
    type: TransactionType;
    icon?: string;
    color?: string;
}

export interface FinancialAccount {
    id: string;
    name: string;
    type: 'bank' | 'card' | 'cash';
    last4?: string;
    balance: number;
}

export interface Budget {
    categoryId: string;
    amount: number;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string; // YYYY-MM-DD
    categoryId: string;
    accountId: string;
}

export type IncomeSourceType = 'main_job' | 'freelance' | 'investment' | 'rent' | 'online_store' | 'other';
export type IncomeVariability = 'fixed' | 'variable';
export type Rating = 'low' | 'medium' | 'high';

export interface IncomeSource {
    id: string;
    name: string; // e.g., "Main Job", "Freelance Graphic Design"
    type: IncomeSourceType;
    role?: string; // Only for main_job
    incomeType: IncomeVariability;
    avgMonthlyIncome: number;
    associatedCosts?: string;
    stability: Rating;
    growthPotential: Rating;
    risk: Rating;
}

export interface IncomeAnalysis {
    sources: IncomeSource[];
    report: string | null;
    lastUpdated: string | null;
}

export interface JourneyTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface JourneyMilestone {
    id: string;
    title: string;
    description: string;
    tasks: JourneyTask[];
}

export interface KeyResult {
    id: string;
    title: string;
    baseline: number;
    target: number;
    current: number;
    unit: string;
}

export interface SmartCriteria {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
    effort?: 'Low' | 'Medium' | 'High';
    actionSteps?: string[];
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
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    type: 'focus' | 'routine' | 'break' | 'meeting';
    energyLevel?: 'high' | 'medium' | 'low';
}

export interface LifeWheelCategory {
    id: string;
    label: string;
    score: number; // 1-10
}

export interface LifeWheelAssessment {
    date: string;
    categories: LifeWheelCategory[];
    analysis?: string;
}

export interface ShopItem {
    id: string;
    title: string;
    description: string;
    price: number;
    purchased: boolean;
    type: 'theme' | 'badge' | 'feature';
    value?: string; // e.g., theme name
}

// --- Micro-Courses Types ---
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
    progress: number; // 0-100
    status: 'active' | 'completed';
    createdAt: string;
}

// --- Women's Health Types ---
export interface CycleLog {
    date: string;
    flow?: 'spotting' | 'light' | 'medium' | 'heavy';
    symptoms: string[];
    mood?: 'happy' | 'sensitive' | 'energetic' | 'tired' | 'anxious' | 'irritable';
    notes?: string;
}

export interface PartnerSettings {
    enabled: boolean;
    name: string;
    shareContent?: 'full' | 'summary';
}

export interface WomenHealthData {
    cycleLogs: CycleLog[];
    periodStarts: string[]; // List of YYYY-MM-DD dates where a period started
    avgCycleLength: number;
    partner: PartnerSettings;
}

// --- Social Accountability Types ---
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

export interface CircleMember {
    id: string;
    name: string;
    score: number;
    lastUpdateText?: string; // Temporary holding for generating summary
}

export interface SocialCircle {
    id: string;
    name: string;
    members: CircleMember[];
    summaries: { date: string; data: CircleSummaryData }[];
}

// --- Book / Reading Types ---
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
    createdAt: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    totalChapters: number;
    currentChapter: number;
    summary: string; // Brief overview
    aiPersona: string; // System prompt for the AI when chatting about this book
    status: 'reading' | 'completed' | 'wishlist';
    coverColor: string;
    coverImage?: string; // URL to image
    genre?: string; // New field for categorization
    lastReadDate?: string;
    notes?: BookNote[];
    vocabulary?: BookVocabulary[];
    contentSource?: string; // Full text content if uploaded
    chatHistory?: ChatMessage[]; // Store chat history per book
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

export interface VoiceActionResponse {
    intent: string;
    parsedData: {
        text: string;
        metadata: any;
    }
}

// --- Privacy & Encryption Types ---
export interface EncryptedBackup {
    data: string; // Ciphertext
    iv: string;
    salt: string;
    version: number;
}

export interface OnboardingData {
  fullName: string;
  age: string;
  role: string;
  gender: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  selectedGoals: string[];
  habits: Habit[];
  notifications: {
    tasks: NotificationSetting;
    reminders: NotificationSetting;
    daily_report: DailyReportSetting;
    budget_alerts?: NotificationSetting;
    low_balance_warnings?: NotificationSetting;
  };
  goals: UserGoal[];
  tasks: StandaloneTask[];
  timeBlocks: TimeBlock[];
  lifeWheel?: LifeWheelAssessment;
  shopInventory?: ShopItem[];
  womenHealth?: WomenHealthData;
  socialCircles?: SocialCircle[];
  microCourses?: MicroCourse[];
  books?: Book[]; // New field for books
  xp: number;
  level: number;
  achievements: AchievementID[];
  theme: ThemeSettings;
  calendarEvents?: CalendarEvent[];
  transactions?: Transaction[];
  transactionCategories?: TransactionCategory[];
  incomeAnalysis?: IncomeAnalysis;
  financialAccounts?: FinancialAccount[];
  budgets?: Budget[];
  isLowFrictionMode?: boolean;
}

export type NotificationTiming = '1h' | '6h' | '1d' | 'none';

export interface NotificationSetting {
  enabled: boolean;
  timing: NotificationTiming;
  time?: string; // HH:mm specific time
  sound?: string;
}

export interface DailyReportSetting {
  enabled: boolean;
  time: string; // "HH:mm"
  sound?: string;
}

export type NotificationType = 'tasks' | 'reminders' | 'daily_report' | 'budget_alerts' | 'low_balance_warnings';

export interface UserGoal {
  id: string;
  type: 'simple' | 'journey' | 'okr' | 'smart';
  title: string;
  icon: string;
  description?: string;
  progress: number; // 0-100
  targetDate?: string;
  linkedHabits?: string[];
  progressHistory?: Array<{ date: string; progress: number }>;
  pomodorosToComplete?: number;
  pomodorosCompleted?: number;
  milestones?: JourneyMilestone[];
  keyResults?: KeyResult[]; // For OKR
  smartCriteria?: SmartCriteria; // For SMART
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface FocusSession {
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  goalId: string | null;
}

export type AchievementID = 'first_goal_completed' | 'level_5' | '10_day_streak';

export interface Achievement {
  id: AchievementID;
  title: string;
  description: string;
  icon: FC<{ className?: string }>;
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

// AI Agent Type
export interface Agent {
  id: string;
  title: string;
  description: string;
  icon: FC<{ className?: string }>;
  systemPrompt: string;
  inputSchema: any; 
  responseSchema: any;
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
}

// Types for Web Speech API
export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

export type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

export interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

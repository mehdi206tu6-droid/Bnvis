import type { FC } from 'react';

export type ThemeColor = 'purple' | 'blue' | 'green' | 'rose';
export type ThemeShape = 'rounded' | 'sharp';

export interface ThemeSettings {
  color: ThemeColor;
  shape: ThemeShape;
}

export interface Habit {
  name: string;
  type: 'good' | 'bad';
  category?: string;
  icon?: string;
  color?: string;
  notification?: NotificationSetting;
}

export type Symptom = 'cramps' | 'headache' | 'fatigue' | 'nausea' | 'bloating' | 'mood_swings';
export type FlowIntensity = 'light' | 'medium' | 'heavy' | 'spotting';

export interface SymptomLog {
    symptoms: Symptom[];
    flow: FlowIntensity | null;
}

export interface Cycle {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  logs: Record<string, SymptomLog>; // Key is YYYY-MM-DD
}

export interface Companion {
    email: string;
    sharePeriod: boolean;
    shareFertility: boolean;
    sharePms: boolean;
}

export interface WomenHealthData {
  cycleLength: number; // in days, e.g., 28
  periodLength: number; // in days, e.g., 5
  cycles: Cycle[];
  companion?: Companion;
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
    womenHealth_period?: NotificationSetting;
    womenHealth_fertile?: NotificationSetting;
    budget_alerts?: NotificationSetting;
    low_balance_warnings?: NotificationSetting;
  };
  goals: UserGoal[];
  xp: number;
  level: number;
  achievements: AchievementID[];
  theme: ThemeSettings;
  womenHealth: WomenHealthData;
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
  sound?: string;
}

export interface DailyReportSetting {
  enabled: boolean;
  time: string; // "HH:mm"
  sound?: string;
}

export type NotificationType = 'tasks' | 'reminders' | 'daily_report' | 'womenHealth_period' | 'womenHealth_fertile' | 'budget_alerts' | 'low_balance_warnings';

export interface UserGoal {
  id: string;
  type: 'simple' | 'journey';
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
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface FocusSession {
  date: string; // YYY-MM-DD
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
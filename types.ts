
export interface OnboardingData {
  fullName: string;
  age: string;
  role: string;
  selectedGoals: string[];
  habits: string[];
  budget: string;
  notifications: {
    tasks: boolean;
    reminders: boolean;
    daily_report: boolean;
  };
}

export type NotificationType = 'tasks' | 'reminders' | 'daily_report';

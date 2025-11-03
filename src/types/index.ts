export type FieldType = 
  | 'number' 
  | 'boolean' 
  | 'duration' 
  | 'scale' 
  | 'spectrum'
  | 'text' 
  | 'date' 
  | 'time' 
  | 'datetime'
  | 'email'
  | 'url'
  | 'phone'
  | 'location'
  | 'choice'
  | 'multi_choice'
  | 'rating'
  | 'color'
  | 'file'
  | 'path'
  | 'tally';

export interface SpectrumPoint {
  position: number; // 0-100 representing position on spectrum
  label: string;
}

export interface ProjectField {
  id: string;
  name: string;
  type: FieldType;
  unit?: string;
  required?: boolean;
  description?: string;
  options?: string[]; // For choice/multi_choice fields
  min?: number; // For number/scale/rating fields
  max?: number; // For number/scale/rating fields
  defaultValue?: any;
  subfields?: ProjectField[]; // For nested fields
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  // Widget configuration for tally fields
  widgetEnabled?: boolean; // If true, creates a home screen widget for quick tallying
  // Spectrum configuration
  spectrumConfig?: {
    startLabel: string;
    endLabel: string;
    midpoints?: SpectrumPoint[];
  };
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  fields: ProjectField[];
  createdAt: Date;
}

// Legacy type aliases for backward compatibility
export type Category = Project;
export type CategoryField = ProjectField;

export interface EntryValue {
  fieldId: string;
  value: any;
  subvalues?: EntryValue[]; // For nested field values
}

export interface Entry {
  id: string;
  projectId: string;
  categoryId?: string; // Legacy field for backward compatibility
  values: EntryValue[];
  date: Date;
  note?: string;
}

// GPS coordinate for path tracking
export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

// Path data structure for GPS route tracking
export interface PathData {
  id: string;
  coordinates: GPSCoordinate[];
  startTime: number;
  endTime?: number;
  distance?: number; // In meters
  duration?: number; // In milliseconds
  isRecording: boolean;
}

// Tally data structure for increment counters
export interface TallyData {
  count: number;
  increments: Array<{
    timestamp: number;
    amount: number; // Usually 1, but can be customized
  }>;
}

// Reminder frequency types
export type ReminderFrequency = 
  | 'once' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'custom';

// Notification types
export type NotificationType = 'simple' | 'custom';
export type NotificationSound = 'default' | 'gentle' | 'alert' | 'chime' | 'silent';
export type NotificationPrivacy = 'public' | 'private';

// Custom frequency pattern
export interface CustomFrequency {
  interval: number; // Number of units
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  daysOfWeek?: number[]; // 0-6, Sunday = 0 (for weekly/custom frequencies)
  timesOfDay?: string[]; // HH:MM format - supports multiple times per day
}

// Reminder configuration
export interface Reminder {
  id: string;
  projectId: string;
  categoryId?: string; // Legacy field for backward compatibility
  fieldId?: string; // Optional: specific field within project
  name: string;
  message?: string; // Custom message/question
  frequency: ReminderFrequency;
  customFrequency?: CustomFrequency;
  timesOfDay?: string[]; // HH:MM format - supports multiple times per day for all frequency types
  daysOfWeek?: number[]; // 0-6, Sunday = 0 - for weekly frequency
  startDate: Date;
  endDate?: Date;
  nextDue: Date;
  isActive: boolean;
  notificationType: NotificationType;
  notificationSound: NotificationSound;
  soundEnabled: boolean;
  privacy: NotificationPrivacy;
  showOnHomeScreen: boolean;
  createdAt: Date;
}

// Widget configuration
export interface Widget {
  id: string;
  projectId: string;
  categoryId?: string; // Legacy field for backward compatibility
  fieldId: string;
  name: string;
  type: FieldType;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  isEnabled: boolean;
  quickEntryEnabled: boolean;
  displayStyle: 'minimal' | 'detailed';
  color: string;
  icon: string;
}

// Notification data
export interface PendingNotification {
  id: string;
  reminderId: string;
  scheduledFor: Date;
  delivered: boolean;
  dismissed: boolean;
}

export interface UserProfile {
  name: string;
  surname?: string;
  email: string;
  completedOnboarding: boolean;
  createdAt: Date;
  userNumber?: number; // Position in registration order (1, 2, 3, etc.)
  lastLoginDate?: Date; // Track last login to determine if it's first time
}

export interface AppState {
  projects: Project[];
  entries: Entry[];
  reminders: Reminder[];
  widgets: Widget[];
  pendingNotifications: PendingNotification[];
  // Store active path recordings
  activePaths: PathData[];
  // User settings
  username?: string;
  userProfile?: UserProfile;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date; // ISO string preferred in JSON, but Date object in app
  isTyping?: boolean;
  feedback?: 'up' | 'down'; // User feedback for RLHF
}

export interface StressSource {
  category: string;
  description: string;
  severity: number; // 1-10 scale
}

export interface Recommendation {
  title: string;
  content: string;
  type: 'immediate' | 'lifestyle' | 'professional';
}

// Structured Report Data (Memory)
export interface AssessmentData {
  lastUpdated: string; // ISO Date string for memory tracking
  summary: string;
  stressSources: StressSource[];
  psychologicalStatus: {
    emotionalStability: string; // 情绪稳定性
    burnoutLevel: string;       // 职业倦怠
    socialSupport: string;      // 社会支持
  };
  riskLevel: 'low' | 'medium' | 'high';
  riskAnalysis: string;
  recommendations: Recommendation[];
}

export enum AppMode {
  LOGIN = 'LOGIN',                 // Login Screen
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD', // Admin View
  ASSESSMENT = 'ASSESSMENT', 
  REPORT = 'REPORT',         
  COUNSELING = 'COUNSELING' 
}

export type UserRole = 'admin' | 'officer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
  badgeNumber?: string;
}

export interface UserDataStore {
  assessmentMessages: Message[];
  counselingMessages: Message[];
  reportData: AssessmentData | null;
  uploadedFiles: {name: string, content: string}[];
  recordCount: number;
}

export interface ApiConfig {
  provider: 'gemini' | 'openrouter';
  apiKey: string;
  model: string;
}

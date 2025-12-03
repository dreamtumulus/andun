export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
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

// Structured Report Data
export interface AssessmentData {
  summary: string;
  stressSources: StressSource[];
  psychologicalStatus: {
    emotionalStability: string;
    burnoutLevel: string;
    socialSupport: string;
  };
  riskLevel: 'low' | 'medium' | 'high';
  riskAnalysis: string;
  recommendations: Recommendation[];
}

export enum AppMode {
  ASSESSMENT = 'ASSESSMENT', 
  REPORT = 'REPORT',         
  COUNSELING = 'COUNSELING' 
}

export interface UserProfile {
  name: string;
  badgeNumber: string; 
  uploadedFilesContent: string[]; 
}

export interface ApiConfig {
  provider: 'gemini' | 'openrouter';
  apiKey: string;
  model: string;
}
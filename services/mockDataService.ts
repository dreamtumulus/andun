
import { User, UserDataStore, Message, AssessmentData } from '../types';

// Mock Users
const MOCK_USERS: User[] = [
  { id: 'admin', username: 'admin', name: '系统管理员', role: 'admin', avatar: 'admin' },
  { id: 'u1', username: '9527', name: '周星星', role: 'officer', badgeNumber: 'PC9527' },
  { id: 'u2', username: '8848', name: '陈永仁', role: 'officer', badgeNumber: 'PC8848' },
  { id: 'u3', username: '007', name: '凌凌漆', role: 'officer', badgeNumber: 'PC007' },
];

// In-memory "Database"
const db: Record<string, UserDataStore> = {};

// Initialize DB with some dummy data for demo purposes
const initDB = () => {
  if (Object.keys(db).length > 0) return;

  // Pre-fill data for User 1
  db['u1'] = {
    assessmentMessages: [
      { id: '1', role: 'model', text: '你好，我是心语。最近工作还顺利吗？', timestamp: new Date() }
    ],
    counselingMessages: [],
    reportData: null,
    uploadedFiles: [],
    recordCount: 0
  };

  // Pre-fill data for User 2 (High Risk Demo)
  db['u2'] = {
    assessmentMessages: [],
    counselingMessages: [],
    reportData: {
      lastUpdated: new Date().toISOString(),
      summary: "该警员表现出明显的长期潜伏压力，可能由于长期的卧底工作导致身份认同困扰。表现出焦虑、失眠以及对周围环境的过度警觉。",
      stressSources: [
        { category: "身份认同危机", description: "长期处于高压伪装状态，难以切换回真实自我", severity: 9 },
        { category: "睡眠障碍", description: "严重的入睡困难和噩梦", severity: 8 }
      ],
      psychologicalStatus: {
        emotionalStability: "较差，易激惹",
        burnoutLevel: "重度耗竭",
        socialSupport: "极度缺乏，孤立无援"
      },
      riskLevel: "high",
      riskAnalysis: "存在高度的PTSD风险和抑郁倾向，建议立即介入干预。",
      recommendations: [
        { title: "强制休假", content: "建议立即停止一线任务，进行脱敏治疗。", type: "professional" }
      ]
    },
    uploadedFiles: [],
    recordCount: 10
  };
};

// Initialize on load
initDB();

export const mockAuthService = {
  login: async (username: string): Promise<User | null> => {
    // Simple mock login - in real app, verify password
    const user = MOCK_USERS.find(u => u.username === username);
    return user || null;
  },

  getUsers: (): User[] => {
    return MOCK_USERS.filter(u => u.role !== 'admin'); // Return officers only for dashboard
  },

  // Load user data (or create default)
  getUserData: (userId: string): UserDataStore => {
    if (!db[userId]) {
      db[userId] = {
        assessmentMessages: [],
        counselingMessages: [],
        reportData: null,
        uploadedFiles: [],
        recordCount: 0
      };
    }
    return db[userId];
  },

  // Save user data
  saveUserData: (userId: string, data: Partial<UserDataStore>) => {
    if (!db[userId]) {
      mockAuthService.getUserData(userId); // Init if missing
    }
    db[userId] = { ...db[userId], ...data };
  },

  // For Admin Dashboard: Get simplified stats for all users
  getAllUserStats: () => {
    return MOCK_USERS.filter(u => u.role === 'officer').map(u => {
      const data = db[u.id];
      return {
        user: u,
        hasReport: !!data?.reportData,
        riskLevel: data?.reportData?.riskLevel || 'unknown',
        lastUpdated: data?.reportData?.lastUpdated || null
      };
    });
  }
};

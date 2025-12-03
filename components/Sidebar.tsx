
import React from 'react';
import { ShieldAlert, FileText, HeartHandshake, User, Activity, LayoutDashboard, LogOut } from 'lucide-react';
import { AppMode, User as UserType } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  reportAvailable: boolean;
  agent1Name: string;
  agent2Name: string;
  currentUser: UserType | null;
  onLogout: () => void;
  isAdminViewing?: boolean; // If admin is viewing another user's profile
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  setMode, 
  reportAvailable, 
  agent1Name, 
  agent2Name,
  currentUser,
  onLogout,
  isAdminViewing
}) => {
  // Navigation for Normal Officers
  const officerItems = [
    {
      id: AppMode.ASSESSMENT,
      label: `心理评估 (${agent1Name})`,
      icon: <Activity size={20} />,
      description: '自然对话，智能评估'
    },
    {
      id: AppMode.REPORT,
      label: '评估报告',
      icon: <FileText size={20} />,
      description: 'AI生成的专业分析',
      disabled: !reportAvailable
    },
    {
      id: AppMode.COUNSELING,
      label: `心理疏导 (${agent2Name})`,
      icon: <HeartHandshake size={20} />,
      description: '个性化专业咨询',
      disabled: !reportAvailable
    }
  ];

  // Navigation for Admins (Main View)
  const adminItems = [
    {
      id: AppMode.ADMIN_DASHBOARD,
      label: '全队态势',
      icon: <LayoutDashboard size={20} />,
      description: '全局监控与管理'
    }
  ];

  // Decide which items to show
  // If Admin is viewing a specific user (isAdminViewing is true), they see the officer menu for that user
  // If Admin is in Dashboard, they see admin menu
  // If Officer, they see officer menu
  let items = officerItems;
  
  if (currentUser?.role === 'admin' && !isAdminViewing) {
    items = adminItems;
  }

  // Prevent sidebar rendering if not logged in (handled by App usually, but safe guard)
  if (!currentUser) return null;

  return (
    <div className="w-80 bg-slate-900 text-white flex flex-col h-full shadow-xl shrink-0">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
          <ShieldAlert size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider">警务安盾</h1>
          <p className="text-xs text-slate-400">
            {currentUser.role === 'admin' ? '管理员控制台' : '智能心理支持系统'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setMode(item.id)}
            disabled={item.disabled}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left group border border-transparent
              ${currentMode === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 border-blue-500' 
                : item.disabled 
                  ? 'opacity-40 cursor-not-allowed bg-transparent' 
                  : 'hover:bg-slate-800 text-slate-300 hover:border-slate-700'
              }
            `}
          >
            <div className={`${currentMode === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`}>
              {item.icon}
            </div>
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-950/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800 mb-3">
          <div className="bg-slate-700 p-2 rounded-full">
            <User size={16} />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">
               {currentUser.role === 'admin' ? '系统管理员' : currentUser.badgeNumber}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
        >
          <LogOut size={16} />
          退出 / 切换账号
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

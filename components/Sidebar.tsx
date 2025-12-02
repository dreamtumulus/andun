import React from 'react';
import { ShieldAlert, FileText, HeartHandshake, User, Activity } from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  reportAvailable: boolean;
  agent1Name: string;
  agent2Name: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode, reportAvailable, agent1Name, agent2Name }) => {
  const menuItems = [
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

  return (
    <div className="w-80 bg-slate-900 text-white flex flex-col h-full shadow-xl shrink-0">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
          <ShieldAlert size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider">警务安盾</h1>
          <p className="text-xs text-slate-400">智能心理支持系统</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {menuItems.map((item) => (
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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
          <div className="bg-slate-700 p-2 rounded-full">
            <User size={16} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">警员 9527</p>
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              在线
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
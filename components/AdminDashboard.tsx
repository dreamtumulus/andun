
import React, { useEffect, useState } from 'react';
import { mockAuthService } from '../services/mockDataService';
import { User } from '../types';
import { Shield, AlertTriangle, CheckCircle, Clock, Search, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onViewUser: (userId: string) => void;
}

interface UserStat {
  user: User;
  hasReport: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  lastUpdated: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewUser }) => {
  const [stats, setStats] = useState<UserStat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load stats from mock service
    const data = mockAuthService.getAllUserStats();
    // @ts-ignore
    setStats(data);
  }, []);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100"><AlertTriangle size={12} /> 高风险</span>;
      case 'medium':
        return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-100"><Activity size={12} /> 中度关注</span>;
      case 'low':
        return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100"><CheckCircle size={12} /> 状态良好</span>;
      default:
        return <span className="text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-medium">未评估</span>;
    }
  };

  const filteredStats = stats.filter(s => 
    s.user.name.includes(searchTerm) || 
    s.user.badgeNumber?.includes(searchTerm)
  );

  return (
    <div className="flex-1 bg-slate-50 p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Shield className="text-blue-600" size={28} />
              全局态势感知中心
            </h1>
            <p className="text-slate-500 mt-1">实时监控全队心理健康状态预警</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索警员姓名或警号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64 transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">在册警员总数</div>
            <div className="text-3xl font-bold text-slate-800">{stats.length}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
            <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">高风险预警</div>
            <div className="text-3xl font-bold text-red-600">{stats.filter(s => s.riskLevel === 'high').length}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500">
            <div className="text-orange-500 text-xs font-bold uppercase tracking-wider mb-2">中度关注</div>
            <div className="text-3xl font-bold text-orange-600">{stats.filter(s => s.riskLevel === 'medium').length}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-2">本月已评估</div>
            <div className="text-3xl font-bold text-blue-600">{stats.filter(s => s.hasReport).length}</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">警员信息</th>
                <th className="px-6 py-4">心理状态评估</th>
                <th className="px-6 py-4">最近更新</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStats.map((stat) => (
                <tr key={stat.user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {stat.user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{stat.user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{stat.user.badgeNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRiskBadge(stat.riskLevel)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={14} />
                      {stat.lastUpdated ? new Date(stat.lastUpdated).toLocaleDateString() : '暂无记录'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onViewUser(stat.user.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-all flex items-center gap-2 ml-auto"
                    >
                      <FileText size={16} />
                      查看档案
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    未找到匹配的警员信息
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import { Activity } from 'lucide-react'; // Fix missing import
export default AdminDashboard;


import React, { useState } from 'react';
import { Shield, User as UserIcon, LogIn } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入警号或用户名');
      return;
    }
    onLogin(username);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px]"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/30 mb-6">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">警务安盾</h1>
          <p className="text-slate-500">智能心理评估与疏导系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">警号 / 用户名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon size={20} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
                placeholder="请输入..."
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              安全登录
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-center text-slate-400">
            默认测试账号: <span className="font-mono text-slate-600">9527</span> (警员), <span className="font-mono text-slate-600">8848</span> (高危演示), <span className="font-mono text-slate-600">admin</span> (管理员)
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;


import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ReportDisplay from './components/ReportDisplay';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import { AppMode, Message, AssessmentData, ApiConfig, User, UserDataStore } from './types';
import { sendAssessmentMessage, generateAssessmentReport, sendCounselingMessage, updateAssessmentReport } from './services/geminiService';
import { mockAuthService } from './services/mockDataService';
import { Sparkles, Settings, X, Save, Key, Server, Cpu } from 'lucide-react';

export default function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null); // The user whose data we are viewing

  // --- App Mode ---
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.LOGIN);
  
  // Custom Agent Names
  const [agent1Name, setAgent1Name] = useState("心语");
  const [agent2Name, setAgent2Name] = useState("蓝盾");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // API Configuration
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'gemini',
    apiKey: '',
    model: ''
  });

  // --- Data State (Synced with Mock Service) ---
  const [assessmentMessages, setAssessmentMessages] = useState<Message[]>([]);
  const [reportData, setReportData] = useState<AssessmentData | null>(null);
  const [counselingMessages, setCounselingMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, content: string}[]>([]);
  const [recordCount, setRecordCount] = useState(0);

  // --- UI Loading States ---
  const [isAssessmentTyping, setIsAssessmentTyping] = useState(false);
  const [isCounselingTyping, setIsCounselingTyping] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isUpdatingReport, setIsUpdatingReport] = useState(false);

  // --- Effect: Load Data when Target User Changes ---
  useEffect(() => {
    if (!currentUser || !targetUserId) return;

    // Fetch data from mock service
    const data = mockAuthService.getUserData(targetUserId);
    
    // If new user with no chat history, init welcome message
    if (data.assessmentMessages.length === 0) {
       const welcomeMsg: Message = {
        id: 'welcome',
        role: 'model',
        text: `你好，我是${agent1Name}。不用把我当成冷冰冰的程序，今天工作累吗？我们可以随便聊聊。`,
        timestamp: new Date()
      };
      setAssessmentMessages([welcomeMsg]);
      // Save immediately to persist initialization
      mockAuthService.saveUserData(targetUserId, { assessmentMessages: [welcomeMsg] });
    } else {
      setAssessmentMessages(data.assessmentMessages);
    }

    setCounselingMessages(data.counselingMessages);
    setReportData(data.reportData);
    setUploadedFiles(data.uploadedFiles);
    setRecordCount(data.recordCount || data.assessmentMessages.filter(m=>m.role==='user').length);

  }, [targetUserId, currentUser, agent1Name]);

  // --- Handlers for Data Persistence ---
  
  const saveToCloud = (partialData: Partial<UserDataStore>) => {
    if (targetUserId) {
      mockAuthService.saveUserData(targetUserId, partialData);
    }
  };

  // --- Auth Handlers ---
  const handleLogin = async (username: string) => {
    const user = await mockAuthService.login(username);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setCurrentMode(AppMode.ADMIN_DASHBOARD);
        setTargetUserId(null);
      } else {
        setTargetUserId(user.id);
        setCurrentMode(AppMode.ASSESSMENT);
      }
    } else {
      alert("用户不存在 (尝试: 9527, 8848, admin)");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTargetUserId(null);
    setCurrentMode(AppMode.LOGIN);
    setAssessmentMessages([]);
    setCounselingMessages([]);
    setReportData(null);
  };

  const handleAdminViewUser = (userId: string) => {
    setTargetUserId(userId);
    // Determine where to land: if report exists, show report, else show assessment
    const data = mockAuthService.getUserData(userId);
    if (data.reportData) {
      setCurrentMode(AppMode.REPORT);
    } else {
      setCurrentMode(AppMode.ASSESSMENT);
    }
  };

  const handleBackToDashboard = () => {
    setTargetUserId(null);
    setCurrentMode(AppMode.ADMIN_DASHBOARD);
  };

  // --- Chat Logic Handlers (Wrapped with Persistence) ---

  const handleAssessmentSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    const newHistory = [...assessmentMessages, userMsg];
    
    // Update State
    setAssessmentMessages(newHistory);
    setRecordCount(prev => prev + 1);
    setIsAssessmentTyping(true);
    
    // Persist
    saveToCloud({ assessmentMessages: newHistory, recordCount: recordCount + 1 });

    // Call API
    const responseText = await sendAssessmentMessage(
      newHistory, 
      text, 
      agent1Name, 
      apiConfig, 
      reportData
    );

    // Bot Reply
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };
    const finalHistory = [...newHistory, botMsg];
    
    setAssessmentMessages(finalHistory);
    saveToCloud({ assessmentMessages: finalHistory });
    setIsAssessmentTyping(false);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const data = await generateAssessmentReport(assessmentMessages, apiConfig, reportData);
    
    if (data) {
      setReportData(data);
      saveToCloud({ reportData: data });
      setCurrentMode(AppMode.REPORT);
      
      // Init Counseling if needed
      if (counselingMessages.length === 0) {
        const initMsg: Message = {
          id: 'counseling-start',
          role: 'model',
          text: `你好，我是${agent2Name}。我已经详细阅读了你的评估报告。如果你愿意，我们可以针对报告中提到的压力点聊一聊，或者你可以上传之前的体检或心理档案，我会综合给出一份调理建议。`,
          timestamp: new Date()
        };
        setCounselingMessages([initMsg]);
        saveToCloud({ counselingMessages: [initMsg] });
      }
    } else {
      alert("生成报告失败，请检查网络或 API 设置");
    }
    
    setIsGeneratingReport(false);
  };

  const handleCounselingSend = async (text: string) => {
     const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
     const newHistory = [...counselingMessages, userMsg];
     setCounselingMessages(newHistory);
     setIsCounselingTyping(true);
     saveToCloud({ counselingMessages: newHistory });

     const uploadedContext = uploadedFiles.map(f => `文件 [${f.name}]: ${f.content}`);

     const responseText = await sendCounselingMessage(
       newHistory, 
       text, 
       reportData, 
       uploadedContext,
       agent2Name,
       apiConfig
     );

     const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
     };
     const finalHistory = [...newHistory, botMsg];

     setCounselingMessages(finalHistory);
     saveToCloud({ counselingMessages: finalHistory });
     setIsCounselingTyping(false);
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    const updatedMessages = counselingMessages.map(msg => 
      msg.id === messageId ? { ...msg, feedback: type } : msg
    );
    setCounselingMessages(updatedMessages);
    saveToCloud({ counselingMessages: updatedMessages });
  };

  const handleUpdateReportStatus = async () => {
    if (!reportData || counselingMessages.length < 2) return;
    
    setIsUpdatingReport(true);
    const updatedData = await updateAssessmentReport(reportData, counselingMessages, apiConfig);
    
    if (updatedData) {
      setReportData(updatedData);
      saveToCloud({ reportData: updatedData });
      
      const sysMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        text: '【系统通知】：根据刚才的沟通，心理评估档案已同步更新。',
        timestamp: new Date()
      };
      const newHistory = [...counselingMessages, sysMsg];
      setCounselingMessages(newHistory);
      saveToCloud({ counselingMessages: newHistory });
    }
    setIsUpdatingReport(false);
  }

  const handleFileUpload = (content: string, fileName: string) => {
    const newFiles = [...uploadedFiles, { name: fileName, content }];
    setUploadedFiles(newFiles);
    
    const sysMsg: Message = {
      id: Date.now().toString(),
      role: 'system',
      text: `已上传文件: ${fileName}`,
      timestamp: new Date()
    };
    const newHistory = [...counselingMessages, sysMsg];
    setCounselingMessages(newHistory);

    saveToCloud({ uploadedFiles: newFiles, counselingMessages: newHistory });
  };

  // --- Rendering ---

  if (!currentUser || currentMode === AppMode.LOGIN) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentMode={currentMode} 
        setMode={setCurrentMode}
        reportAvailable={!!reportData}
        agent1Name={agent1Name}
        agent2Name={agent2Name}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAdminViewing={currentUser.role === 'admin' && targetUserId !== null}
      />

      <main className="flex-1 flex flex-col h-full relative">
        {/* Header Bar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
           <div className="flex flex-col">
             <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
               {currentMode === AppMode.ADMIN_DASHBOARD && "指挥中心全局监控"}
               {currentMode === AppMode.ASSESSMENT && `心理状态评估 · ${agent1Name}`}
               {currentMode === AppMode.REPORT && "评估报告概览"}
               {currentMode === AppMode.COUNSELING && `专业心理疏导 · ${agent2Name}`}
               
               {/* Show who we are viewing if Admin */}
               {currentUser.role === 'admin' && targetUserId && (
                 <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded ml-2 font-normal">
                    正在查看: {mockAuthService.getUsers().find(u=>u.id===targetUserId)?.name}
                 </span>
               )}
             </h2>
             
             {/* Status Indicators */}
             <div className="text-xs text-slate-500 flex items-center gap-2">
               {currentMode === AppMode.ASSESSMENT && (
                 <>
                   <span>已收集记录: {recordCount} 条</span>
                   {reportData && <span className="text-blue-600 font-medium">· 已关联历史档案</span>}
                 </>
               )}
               {currentMode === AppMode.COUNSELING && reportData && (
                  <span className="text-slate-400">上次档案更新: {new Date(reportData.lastUpdated).toLocaleTimeString()}</span>
               )}
             </div>
           </div>

           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
               title="设置 (API & 智能体名称)"
             >
               <Settings size={20} />
             </button>

             {/* Only allow report generation in Assessment mode if not admin (or admin can force it) */}
             {currentMode === AppMode.ASSESSMENT && (
               <button
                 onClick={handleGenerateReport}
                 disabled={isGeneratingReport || recordCount < 3} 
                 className={`
                   flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                   ${isGeneratingReport || recordCount < 3
                     ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                     : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'
                   }
                 `}
               >
                 {isGeneratingReport ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     {reportData ? "更新报告" : "生成报告"}
                   </>
                 ) : (
                   <>
                     <Sparkles size={16} />
                     {reportData ? "更新报告" : "生成报告"}
                   </>
                 )}
               </button>
             )}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {currentMode === AppMode.ADMIN_DASHBOARD && (
            <AdminDashboard onViewUser={handleAdminViewUser} />
          )}

          {currentMode === AppMode.ASSESSMENT && (
            <ChatArea 
              messages={assessmentMessages}
              onSendMessage={handleAssessmentSend}
              isTyping={isAssessmentTyping}
              agentName={agent1Name}
              placeholder={`和${agent1Name}聊聊你的日常...`}
              onEndSession={() => {
                if(currentUser.role === 'admin') handleBackToDashboard();
                else setCurrentMode(AppMode.REPORT);
              }} 
            />
          )}

          {currentMode === AppMode.REPORT && reportData && (
            <ReportDisplay 
              data={reportData} 
              onContinueToCounseling={() => setCurrentMode(AppMode.COUNSELING)}
              counselingAgentName={agent2Name}
              isAdmin={currentUser.role === 'admin'}
              onBackToDashboard={handleBackToDashboard}
            />
          )}

          {/* Fallback for empty report in Report Mode */}
          {currentMode === AppMode.REPORT && !reportData && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <div className="mb-4 bg-slate-200 p-4 rounded-full"><Sparkles size={32}/></div>
               <p>暂无评估报告，请先在评估对话中积累足够数据。</p>
            </div>
          )}

          {currentMode === AppMode.COUNSELING && (
            <ChatArea 
              messages={counselingMessages}
              onSendMessage={handleCounselingSend}
              isTyping={isCounselingTyping}
              agentName={agent2Name}
              placeholder={`向${agent2Name}咨询建议...`}
              onFileUpload={handleFileUpload}
              uploadedFiles={uploadedFiles.map(f => f.name)}
              onEndSession={() => {
                 if(currentUser.role === 'admin') handleBackToDashboard();
                 else setCurrentMode(AppMode.REPORT);
              }}
              onUpdateReport={handleUpdateReportStatus}
              isUpdatingReport={isUpdatingReport}
              onFeedback={handleFeedback} // Add feedback handler
            />
          )}
        </div>
      </main>

      {/* Settings Modal (Same as before) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings size={22} className="text-slate-500"/>
                系统设置
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Agent Names Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  智能体个性化
                </h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">评估智能体名称</label>
                  <input 
                    type="text" 
                    value={agent1Name}
                    onChange={(e) => setAgent1Name(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="例如：心语"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">疏导智能体名称</label>
                  <input 
                    type="text" 
                    value={agent2Name}
                    onChange={(e) => setAgent2Name(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="例如：蓝盾"
                  />
                </div>
              </div>

              {/* API Settings Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Server size={14} /> 模型服务配置
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">服务提供商</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setApiConfig({...apiConfig, provider: 'gemini'})}
                      className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                        apiConfig.provider === 'gemini' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Google Gemini
                    </button>
                    <button 
                      onClick={() => setApiConfig({...apiConfig, provider: 'openrouter'})}
                      className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                        apiConfig.provider === 'openrouter' 
                          ? 'bg-purple-50 border-purple-500 text-purple-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      OpenRouter / OpenAI
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Key size={14} /> API Key
                  </label>
                  <input 
                    type="password" 
                    value={apiConfig.apiKey}
                    onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    placeholder={apiConfig.provider === 'gemini' ? "默认使用系统预设 Key (可留空)" : "sk-or-..."}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {apiConfig.provider === 'gemini' 
                      ? "留空将使用默认的环境变量 Key。" 
                      : "必须输入 OpenRouter API Key 才能使用第三方服务。"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Cpu size={14} /> 自定义模型名称
                  </label>
                  <input 
                    type="text" 
                    value={apiConfig.model}
                    onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    placeholder={apiConfig.provider === 'gemini' ? "默认: gemini-2.5-flash" : "默认: google/gemini-2.0-flash-001"}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    如需使用特定版本的模型，请在此输入完整 ID (例如: anthropic/claude-3-opus)。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
              >
                <Save size={18} />
                保存并关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

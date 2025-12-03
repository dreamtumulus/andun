import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ReportDisplay from './components/ReportDisplay';
import { AppMode, Message, AssessmentData, ApiConfig } from './types';
import { sendAssessmentMessage, generateAssessmentReport, sendCounselingMessage, updateAssessmentReport } from './services/geminiService';
import { Sparkles, Settings, X, Save, Key, Server, Cpu } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.ASSESSMENT);
  
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

  // Assessment State (Agent 1)
  const [assessmentMessages, setAssessmentMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `你好，我是${agent1Name}。不用把我当成冷冰冰的程序，今天工作累吗？我们可以随便聊聊。`,
      timestamp: new Date()
    }
  ]);
  const [isAssessmentTyping, setIsAssessmentTyping] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  // Report State (The Long Term Memory)
  const [reportData, setReportData] = useState<AssessmentData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isUpdatingReport, setIsUpdatingReport] = useState(false);

  // Counseling State (Agent 2)
  const [counselingMessages, setCounselingMessages] = useState<Message[]>([]);
  const [isCounselingTyping, setIsCounselingTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, content: string}[]>([]);

  // ---- Agent 1 Logic ----
  const handleAssessmentSend = async (text: string) => {
    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    const newHistory = [...assessmentMessages, userMsg];
    setAssessmentMessages(newHistory);
    setRecordCount(prev => prev + 1);
    setIsAssessmentTyping(true);

    // Call API with config AND current report (Memory)
    const responseText = await sendAssessmentMessage(
      newHistory, 
      text, 
      agent1Name, 
      apiConfig, 
      reportData // Injecting existing report as memory
    );

    // Add bot message
    setAssessmentMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    }]);
    setIsAssessmentTyping(false);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    // Pass existing report to prompt "update" vs "create new"
    const data = await generateAssessmentReport(assessmentMessages, apiConfig, reportData);
    
    if (data) {
      setReportData(data);
      setCurrentMode(AppMode.REPORT);
      
      // Initialize counseling chat if empty
      if (counselingMessages.length === 0) {
        setCounselingMessages([{
          id: 'counseling-start',
          role: 'model',
          text: `你好，我是${agent2Name}。我已经详细阅读了你的评估报告。如果你愿意，我们可以针对报告中提到的压力点聊一聊，或者你可以上传之前的体检或心理档案，我会综合给出一份调理建议。`,
          timestamp: new Date()
        }]);
      }
    } else {
      alert("生成报告失败，请检查网络或 API 设置");
    }
    
    setIsGeneratingReport(false);
  };

  // ---- Agent 2 Logic ----
  const handleCounselingSend = async (text: string) => {
     const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
     const newHistory = [...counselingMessages, userMsg];
     setCounselingMessages(newHistory);
     setIsCounselingTyping(true);

     const uploadedContext = uploadedFiles.map(f => `文件 [${f.name}]: ${f.content}`);

     const responseText = await sendCounselingMessage(
       newHistory, 
       text, 
       reportData, // Agent 2 reads the latest memory
       uploadedContext,
       agent2Name,
       apiConfig
     );

     setCounselingMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
     }]);
     setIsCounselingTyping(false);
  };

  // Manual Trigger to Update Report based on Counseling Chat
  const handleUpdateReportStatus = async () => {
    if (!reportData || counselingMessages.length < 2) return;
    
    setIsUpdatingReport(true);
    const updatedData = await updateAssessmentReport(reportData, counselingMessages, apiConfig);
    
    if (updatedData) {
      setReportData(updatedData);
      // Optional: Add a system message to chat to confirm update
      setCounselingMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        text: '【系统通知】：根据刚才的沟通，心理评估档案已同步更新。',
        timestamp: new Date()
      }]);
    }
    setIsUpdatingReport(false);
  }

  const handleFileUpload = (content: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { name: fileName, content }]);
    setCounselingMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      text: `已上传文件: ${fileName}`,
      timestamp: new Date()
    }]);
  };

  const handleEndSession = () => {
    if (confirm("确定要结束当前会话并返回吗？")) {
      setCurrentMode(AppMode.REPORT);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentMode={currentMode} 
        setMode={setCurrentMode}
        reportAvailable={!!reportData}
        agent1Name={agent1Name}
        agent2Name={agent2Name}
      />

      <main className="flex-1 flex flex-col h-full relative">
        {/* Header Bar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
           <div className="flex flex-col">
             <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
               {currentMode === AppMode.ASSESSMENT && `心理状态评估 · ${agent1Name}`}
               {currentMode === AppMode.REPORT && "评估报告概览"}
               {currentMode === AppMode.COUNSELING && `专业心理疏导 · ${agent2Name}`}
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
          {currentMode === AppMode.ASSESSMENT && (
            <ChatArea 
              messages={assessmentMessages}
              onSendMessage={handleAssessmentSend}
              isTyping={isAssessmentTyping}
              agentName={agent1Name}
              placeholder={`和${agent1Name}聊聊你的日常...`}
              onEndSession={() => setCurrentMode(AppMode.REPORT)} 
            />
          )}

          {currentMode === AppMode.REPORT && reportData && (
            <ReportDisplay 
              data={reportData} 
              onContinueToCounseling={() => setCurrentMode(AppMode.COUNSELING)}
              counselingAgentName={agent2Name}
            />
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
              onEndSession={() => setCurrentMode(AppMode.REPORT)}
              onUpdateReport={handleUpdateReportStatus}
              isUpdatingReport={isUpdatingReport}
            />
          )}
        </div>
      </main>

      {/* Settings Modal */}
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
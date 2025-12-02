import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ReportDisplay from './components/ReportDisplay';
import { AppMode, Message, AssessmentData } from './types';
import { sendAssessmentMessage, generateAssessmentReport, sendCounselingMessage } from './services/geminiService';
import { Sparkles, Settings, X, Save } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.ASSESSMENT);
  
  // Custom Agent Names
  const [agent1Name, setAgent1Name] = useState("心语"); // Heart Whisper / Intimate talk
  const [agent2Name, setAgent2Name] = useState("蓝盾"); // Blue Shield / Police Protection
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  // Report State
  const [reportData, setReportData] = useState<AssessmentData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

    // Call API
    const responseText = await sendAssessmentMessage(newHistory, text, agent1Name);

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
    const data = await generateAssessmentReport(assessmentMessages);
    
    if (data) {
      setReportData(data);
      setCurrentMode(AppMode.REPORT);
      
      // Initialize counseling chat with context
      setCounselingMessages([{
        id: 'counseling-start',
        role: 'model',
        text: `你好，我是${agent2Name}。我已经详细阅读了你的评估报告。如果你愿意，我们可以针对报告中提到的压力点聊一聊，或者你可以上传之前的体检或心理档案，我会综合给出一份调理建议。`,
        timestamp: new Date()
      }]);
    } else {
      // Fallback if JSON generation fails
      alert("生成报告失败，请稍后重试");
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
       reportData, 
       uploadedContext,
       agent2Name
     );

     setCounselingMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
     }]);
     setIsCounselingTyping(false);
  };

  const handleFileUpload = (content: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { name: fileName, content }]);
    // Notify user in chat
    setCounselingMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      text: `已上传文件: ${fileName}`,
      timestamp: new Date()
    }]);
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
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
           <div className="flex flex-col">
             <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
               {currentMode === AppMode.ASSESSMENT && `心理状态评估 · ${agent1Name}`}
               {currentMode === AppMode.REPORT && "评估报告概览"}
               {currentMode === AppMode.COUNSELING && `专业心理疏导 · ${agent2Name}`}
             </h2>
             {currentMode === AppMode.ASSESSMENT && (
               <div className="text-xs text-slate-500 flex items-center gap-1">
                 <span>已收集对话记录: {recordCount} 条</span>
                 {recordCount >= 5 && <span className="text-green-600 font-medium">(数据量充足)</span>}
               </div>
             )}
           </div>

           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
               title="设置智能体名称"
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
                     生成中...
                   </>
                 ) : (
                   <>
                     <Sparkles size={16} />
                     生成评估报告
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
            />
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">系统设置</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">评估智能体名称</label>
                <input 
                  type="text" 
                  value={agent1Name}
                  onChange={(e) => setAgent1Name(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="例如：心语"
                />
                <p className="text-xs text-slate-500 mt-1">负责通过自然对话收集信息的助手</p>
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
                <p className="text-xs text-slate-500 mt-1">负责基于报告提供专业咨询的专家</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Save size={18} />
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
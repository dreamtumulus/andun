import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Paperclip, LogOut, RefreshCw } from 'lucide-react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  agentName: string;
  placeholder?: string;
  onFileUpload?: (content: string, fileName: string) => void;
  uploadedFiles?: string[];
  onEndSession?: () => void;
  onUpdateReport?: () => void; // For Counseling mode to manually trigger update
  isUpdatingReport?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  onSendMessage, 
  isTyping, 
  agentName, 
  placeholder,
  onFileUpload,
  uploadedFiles,
  onEndSession,
  onUpdateReport,
  isUpdatingReport
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileUpload(content, file.name);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      {/* Internal Header for Chat Actions */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-2 flex justify-between items-center bg-gradient-to-b from-slate-100/90 to-transparent pointer-events-none">
         <div className="pointer-events-auto">
           {/* Left side spacer or additional controls */}
         </div>
         <div className="flex gap-2 pointer-events-auto">
            {onUpdateReport && (
              <button 
                onClick={onUpdateReport}
                disabled={isUpdatingReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm transition-all hover:text-blue-600"
                title="根据最新对话更新评估报告"
              >
                <RefreshCw size={14} className={isUpdatingReport ? "animate-spin" : ""} />
                {isUpdatingReport ? "正在同步记忆..." : "更新评估状态"}
              </button>
            )}
            {onEndSession && (
              <button 
                onClick={onEndSession}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm transition-all hover:text-red-600"
              >
                <LogOut size={14} />
                结束/返回
              </button>
            )}
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 pt-12">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="bg-slate-200 p-4 rounded-full mb-4">
              <Bot size={48} className="text-slate-500" />
            </div>
            <p>开始与 {agentName} 的对话...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} agentName={agentName} />
        ))}
        
        {isTyping && (
          <div className="flex justify-start mb-6">
            <div className="flex flex-row gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Bot size={20} className="text-white" />
               </div>
               <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                 <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100">
                <Paperclip size={12} />
                <span className="truncate max-w-[150px]">{f}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          {onFileUpload && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".txt,.md,.json,.csv"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors mb-1"
                title="上传历史心理报告 (txt, md)"
              >
                <Upload size={20} />
              </button>
            </>
          )}

          <div className="flex-1 bg-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-200">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "输入消息..."}
              className="w-full bg-transparent border-none focus:ring-0 resize-none p-3.5 max-h-32 text-sm text-slate-700 placeholder:text-slate-400"
              rows={1}
              style={{ minHeight: '52px' }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className={`
              p-3.5 rounded-xl flex items-center justify-center transition-all mb-1
              ${!inputText.trim() || isTyping
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }
            `}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400">AI 生成内容仅供参考，不构成医疗诊断建议。紧急情况请联系专业医师。</p>
        </div>
      </div>
    </div>
  );
};

import { Bot } from 'lucide-react';

export default ChatArea;
import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  agentName: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, agentName }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
          ${isUser ? 'bg-indigo-600' : 'bg-blue-500'}
        `}>
          {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`
          flex flex-col 
          ${isUser ? 'items-end' : 'items-start'}
        `}>
          <span className="text-xs text-slate-400 mb-1 px-1">
            {isUser ? '我' : agentName}
          </span>
          <div className={`
            px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }
          `}>
            {message.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
import React from 'react';
import { ChatMessage } from '../../types';
import { ChatInput } from '../ChatInput';

interface ChatTabProps {
  chatMessages: ChatMessage[];
  onSendMessage: (messageText: string) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ chatMessages, onSendMessage }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-y-auto mb-2 text-sm scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
        {chatMessages.length === 0 && <div className="text-gray-500 italic p-2">Chat log empty. Type /roll XdY+Z to roll dice.</div>}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`py-0.5 px-1 ${msg.type === 'roll' ? 'text-indigo-300' : msg.type === 'info' ? 'text-yellow-400' : 'text-gray-200'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
};
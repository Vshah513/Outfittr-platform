'use client';

import React from 'react';
import { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface MessageListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUserId: string;
}

export default function MessageList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
}: MessageListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
        <p className="text-sm text-gray-500">
          Start a conversation with a seller to see your messages here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const otherUser = conversation.other_user;
        const lastMessage = conversation.last_message;
        
        return (
          <button
            key={conversation.conversation_id}
            onClick={() => onSelectConversation(conversation.conversation_id)}
            className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
              selectedConversationId === conversation.conversation_id ? 'bg-gray-100' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {otherUser.avatar_url ? (
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={otherUser.avatar_url} 
                      alt={otherUser.full_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {otherUser.full_name[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {otherUser.full_name}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(lastMessage.created_at)}
                    </p>
                  )}
                </div>
                
                {/* Show product if available */}
                {conversation.product && (
                  <p className="text-xs text-gray-500 truncate mb-1">
                    Re: {conversation.product.title}
                  </p>
                )}
                
                <p className="text-sm text-gray-600 truncate">
                  {lastMessage?.content || 'No messages yet'}
                </p>
                
                {conversation.unread_count > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-black text-white mt-1">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


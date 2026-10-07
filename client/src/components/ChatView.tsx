"use client";

import React, { useRef, useEffect } from "react";
import { Message, AIModel } from "@/types/chat";
import { PromptCard } from "./PromptCard";

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, model: AIModel) => void;
  onNewChat: () => void;
}

export function ChatView({
  messages,
  isLoading,
  onSendMessage,
  onNewChat,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-between px-4 pb-4">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-6 pt-4 pb-8">
        <div className="flex justify-end mb-2">
          <button
            onClick={onNewChat}
            className="text-xs font-medium text-[#737373] hover:text-[#292929] bg-[#F6F6F7] hover:bg-[#EAEAEA] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#292929] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#292929] text-white rounded-br-xs"
                    : "bg-[#F6F6F7] text-[#292929] border border-[#E5E7EB] rounded-bl-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-[10px] mt-2 opacity-60 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {message.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#292929] flex items-center justify-center shrink-0 mt-0.5 font-semibold text-xs">
                  U
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-[#292929] text-white flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 animate-spin"
              >
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            </div>
            <div className="bg-[#F6F6F7] border border-[#E5E7EB] rounded-2xl rounded-bl-xs p-3 text-xs text-[#737373] flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#292929] rounded-full animate-bounce"></span>
              <span className="inline-block w-2 h-2 bg-[#292929] rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="inline-block w-2 h-2 bg-[#292929] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-1 text-[11px]">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Persistent Prompt Card at the bottom of chat */}
      <div className="pt-2">
        <PromptCard onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

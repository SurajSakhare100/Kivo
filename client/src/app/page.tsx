"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { PromptCard } from "@/components/PromptCard";
import { ActionPills } from "@/components/ActionPills";
import { Footer } from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";
import { MoreActionsModal } from "@/components/MoreActionsModal";
import { ChatView } from "@/components/ChatView";
import { Message, AIModel } from "@/types/chat";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activePromptDraft, setActivePromptDraft] = useState("");

  const handleSendMessage = (content: string, model: AIModel) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulated AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'd be happy to help with that using **${model}**!\n\nHere is a structured overview and recommendation based on your request:\n\n1. **Core Concept**: Analyzing key objectives and creating a streamlined workflow.\n2. **Actionable Steps**: Break down the process into modular components for maximum clarity and maintainability.\n3. **Next Steps**: Let me know if you would like me to dive deeper into any specific section or generate code!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 900);
  };

  const handleSelectPill = (prompt: string) => {
    setActivePromptDraft(prompt);
  };

  const handleResetChat = () => {
    setMessages([]);
    setActivePromptDraft("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#292929] relative selection:bg-[#292929] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onLoginClick={() => setIsLoginOpen(true)}
        onResetChat={handleResetChat}
      />

      {/* Main Content Area */}
      {hasMessages ? (
        <ChatView
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onNewChat={handleResetChat}
        />
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full -mt-10">
          <div className="w-full max-w-[760px] mx-auto text-center">
            {/* Main Greeting / Title */}
            <h1 className="text-3xl sm:text-[38px] font-normal tracking-[-0.02em] text-[#292929] mb-8 select-none">
              How can I help you?
            </h1>

            {/* Central Prompt Card */}
            <PromptCard
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              initialPrompt={activePromptDraft}
            />

            {/* Quick Action Pill Buttons */}
            <ActionPills
              onSelectAction={handleSelectPill}
              onOpenMore={() => setIsMoreOpen(true)}
            />
          </div>
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Interactive Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <MoreActionsModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onSelectPrompt={handleSelectPill}
      />
    </div>
  );
}

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
}

export type AIModel = "Auto" | "GPT-4o" | "Claude 3.7 Sonnet" | "Gemini 2.5 Pro" | "DeepSeek R1";

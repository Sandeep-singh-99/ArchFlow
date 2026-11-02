import { Button } from "@/components/ui/button";
import { Agent } from "@/types/AgentTypes";
import {
  ArrowRight,
  Bot,
  Copy,
  Loader2,
  MoreVertical,
  Paperclip,
  RefreshCcw,
  Send,
  User,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";

type Props = {
  GenerateAgentToolConfig: () => void;
  loading: boolean;
  agentDetail: Agent;
};

interface Message {
  id?: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
}

export default function ChatUI({
  GenerateAgentToolConfig,
  loading: rebooting,
  agentDetail,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem(
      `chat_session_${agentDetail._id}`
    );
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem(`chat_session_${agentDetail._id}`, storedSessionId);
    }
    setSessionId(storedSessionId);
  }, [agentDetail._id]);

  // Convex Hooks
  const saveMessage = useMutation(api.chat.SaveMessage);
  const clearChat = useMutation(api.chat.ClearChat);
  const dbMessages = useQuery(
    api.chat.GetMessages,
    sessionId ? { agentId: agentDetail._id, sessionId } : "skip"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dbMessages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMsgContent = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    try {
      // 1. Save User Message
      await saveMessage({
        agentId: agentDetail._id,
        role: "user",
        content: userMsgContent,
        sessionId: sessionId,
        createdAt: Date.now(),
      });

      // 2. Call AI API
      // Construct history from dbMessages + new user message
      const currentHistory =
        dbMessages?.map((msg) => ({ role: msg.role, content: msg.content })) ||
        [];

      const response = await axios.post("/api/agent-chat", {
        messages: [
          ...currentHistory,
          { role: "user", content: userMsgContent },
        ],
        agentToolConfig: agentDetail.agentToolConfig,
      });

      // 3. Save AI Response
      await saveMessage({
        agentId: agentDetail._id,
        role: "ai",
        content: response.data.response,
        sessionId: sessionId,
        createdAt: Date.now(),
      });
    } catch (error) {
      toast.error("Failed to get response from AI");
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    if (!sessionId) return;
    try {
      await clearChat({ agentId: agentDetail._id, sessionId });
      toast.success("Chat history cleared");
    } catch (error) {
      toast.error("Failed to clear chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg leading-tight">
              {agentDetail?.name || "AI Agent"}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-gray-500 font-medium">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={GenerateAgentToolConfig}
            disabled={rebooting}
            title="Reboot Agent"
          >
            <RefreshCcw size={18} className={rebooting ? "animate-spin" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-600 transition-colors"
            onClick={handleClearChat}
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {!dbMessages || dbMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot size={48} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700">
                How can I help you today?
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                I'm ready to assist you with your tasks. Just type a message
                below.
              </p>
            </div>
          </div>
        ) : (
          dbMessages.map((msg: any) => (
            <div
              key={msg._id}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                  }`}
                >
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    msg.content
                  )}

                  {/* Actions (Copy) */}
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className={`absolute top-2 ${msg.role === "user" ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-full text-gray-400`}
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex w-full justify-start">
            <div className="flex max-w-[80%] gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Bot size={14} />
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent  focus:ring-0 text-gray-700 placeholder-gray-400 text-sm h-9 p-2"
            autoFocus
          />

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className={`h-9 w-9 rounded-lg transition-all ${
              inputValue.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isTyping ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={18} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

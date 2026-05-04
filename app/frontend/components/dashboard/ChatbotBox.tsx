"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  X,
} from "lucide-react";

import { askChatbot } from "@/libs/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { chatBotStyles } from "./ChatBot.style";

const suggestedQuestions = [
  "Giá vàng gần nhất là bao nhiêu?",
  "Giá vàng thế giới hiện tại là bao nhiêu?",
  "Giá SJC hiện tại là bao nhiêu?",
  "Dự báo ngày kế tiếp là gì?",
  "Chênh lệch forecast hiện tại là bao nhiêu?",
  "MAE là gì?",
  "RMSE là gì?",
  "Validation và test khác nhau thế nào?",
  "Biểu đồ giá vàng cho thấy xu hướng gì?",
];

const CHAT_STORAGE_KEY = "gold-price-chatbot-messages";
const CHAT_OPEN_KEY = "gold-price-chatbot-open";
const CHAT_EXPANDED_KEY = "gold-price-chatbot-expanded";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  isInScope?: boolean;
};

const defaultMessages: ChatMessage[] = [];

export default function ChatBot() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsHydrated(true);

    try {
      const savedMessages = window.localStorage.getItem(CHAT_STORAGE_KEY);
      const savedIsOpen = window.localStorage.getItem(CHAT_OPEN_KEY);
      const savedIsExpanded = window.localStorage.getItem(CHAT_EXPANDED_KEY);

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages) as ChatMessage[];
        setMessages(
          Array.isArray(parsedMessages) ? parsedMessages : defaultMessages,
        );
      }

      if (savedIsOpen) {
        setIsOpen(savedIsOpen === "true");
      }

      if (savedIsExpanded) {
        setIsExpanded(savedIsExpanded === "true");
      }
    } catch (error) {
      console.error("Không thể đọc localStorage của chatbot:", error);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Không thể lưu messages vào localStorage:", error);
    }
  }, [messages, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CHAT_OPEN_KEY, String(isOpen));
    } catch (error) {
      console.error("Không thể lưu trạng thái open vào localStorage:", error);
    }
  }, [isOpen, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CHAT_EXPANDED_KEY, String(isExpanded));
    } catch (error) {
      console.error(
        "Không thể lưu trạng thái expanded vào localStorage:",
        error,
      );
    }
  }, [isExpanded, isHydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  async function submitQuestion(rawQuestion: string) {
    const trimmedQuestion = rawQuestion.trim();

    if (!trimmedQuestion) {
      setErrorMessage("Vui lòng nhập câu hỏi trước khi gửi.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setErrorMessage("");

    try {
      setIsLoading(true);

      const response = await askChatbot(trimmedQuestion);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: response.answer,
        isInScope: response.is_in_scope,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);

      const botErrorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        role: "bot",
        content: "Không thể gửi câu hỏi tới chatbot. Vui lòng thử lại.",
        isInScope: false,
      };

      setMessages((prev) => [...prev, botErrorMessage]);
      setErrorMessage("Không thể gửi câu hỏi tới chatbot. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuestion(inputValue);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!isLoading && inputValue.trim()) {
        void submitQuestion(inputValue);
      }
    }
  }

  async function handleSuggestedQuestion(suggestedQuestion: string) {
    setInputValue(suggestedQuestion);
    await submitQuestion(suggestedQuestion);
  }

  function handleClear() {
    setInputValue("");
    setMessages(defaultMessages);
    setErrorMessage("");
    setIsExpanded(false);

    try {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      window.localStorage.removeItem(CHAT_EXPANDED_KEY);
    } catch (error) {
      console.error("Không thể xóa localStorage của chatbot:", error);
    }
  }

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={chatBotStyles.launcher}
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            chatBotStyles.popupBase,
            isExpanded
              ? chatBotStyles.popupExpanded
              : chatBotStyles.popupCompact,
          )}
        >
          <Card className={chatBotStyles.card}>
            <CardHeader className={chatBotStyles.header}>
              <div className={chatBotStyles.headerLeft}>
                <div className={chatBotStyles.headerIcon}>
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className={chatBotStyles.headerTitle}>
                    Gold Assistant
                  </CardTitle>
                  <p className={chatBotStyles.headerDescription}>
                    Ask about latest price, forecast, and model metrics
                  </p>
                </div>
              </div>

              <div className={chatBotStyles.headerActions}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className={chatBotStyles.iconButton}
                  aria-label={
                    isExpanded ? "Collapse chatbot" : "Expand chatbot"
                  }
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className={chatBotStyles.iconButton}
                  aria-label="Close chatbot"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className={chatBotStyles.content}>
              <div
                className={cn(
                  chatBotStyles.messageAreaBase,
                  isExpanded
                    ? chatBotStyles.messageAreaExpanded
                    : chatBotStyles.messageAreaCompact,
                )}
              >
                {messages.length === 0 && !isLoading && !errorMessage && (
                  <div className="space-y-4">
                    <div className={chatBotStyles.introBubble}>
                      Xin chào, mình có thể hỗ trợ bạn tra cứu giá vàng mới
                      nhất, forecast gần nhất và các metrics đánh giá mô hình.
                    </div>

                    <div>
                      <p className={chatBotStyles.suggestedTitle}>
                        Suggested questions
                      </p>
                      <div className={chatBotStyles.suggestedList}>
                        {suggestedQuestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleSuggestedQuestion(item)}
                            className={chatBotStyles.suggestedButton}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={chatBotStyles.messagesList}>
                  {messages.map((message) => {
                    if (message.role === "user") {
                      return (
                        <div
                          key={message.id}
                          className={chatBotStyles.userMessageRow}
                        >
                          <div className={chatBotStyles.userBubble}>
                            {message.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={chatBotStyles.botMessageWrapper}
                      >
                        {typeof message.isInScope === "boolean" && (
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                chatBotStyles.badgeBase,
                                message.isInScope
                                  ? chatBotStyles.badgeInScope
                                  : chatBotStyles.badgeOutOfScope,
                              )}
                            >
                              {message.isInScope ? "In scope" : "Out of scope"}
                            </Badge>
                          </div>
                        )}

                        <div className={chatBotStyles.botBubble}>
                          {message.content}
                        </div>
                        <div ref={messagesEndRef} />
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className={chatBotStyles.loadingBubble}>
                      Đang gửi câu hỏi tới chatbot...
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className={chatBotStyles.form}>
                <Textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ví dụ: Giá vàng mới nhất là bao nhiêu?"
                  className={cn(
                    chatBotStyles.textareaBase,
                    isExpanded && chatBotStyles.textareaExpanded,
                  )}
                />

                <div className={chatBotStyles.footerActions}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isLoading}
                    className={chatBotStyles.clearButton}
                  >
                    Clear
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={chatBotStyles.submitButton}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? "Sending..." : "Ask chatbot"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

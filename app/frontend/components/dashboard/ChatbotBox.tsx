"use client";

import { useState } from "react";

import { askChatbot } from "@/libs/api";

export default function ChatbotBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isInScope, setIsInScope] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setErrorMessage("Vui lòng nhập câu hỏi trước khi gửi.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setAnswer("");
      setIsInScope(null);

      const response = await askChatbot(trimmedQuestion);

      setAnswer(response.answer);
      setIsInScope(response.is_in_scope);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không thể gửi câu hỏi tới chatbot. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Chatbot Box</h2>
      <p className="mt-2 text-sm text-slate-600">
        Đặt câu hỏi về giá vàng mới nhất, forecast hoặc các chỉ số đánh giá mô
        hình.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="chatbot-question"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Your question
          </label>
          <textarea
            id="chatbot-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ví dụ: Giá vàng mới nhất là bao nhiêu?"
            className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Ask chatbot"}
          </button>

          <button
            type="button"
            onClick={() => {
              setQuestion("");
              setAnswer("");
              setIsInScope(null);
              setErrorMessage("");
            }}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {answer && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Chatbot Response
            </h3>

            {isInScope !== null && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isInScope
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isInScope ? "In scope" : "Out of scope"}
              </span>
            )}
          </div>

          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
            {answer}
          </p>
        </div>
      )}
    </section>
  );
}

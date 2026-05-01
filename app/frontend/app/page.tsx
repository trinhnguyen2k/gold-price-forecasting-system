import { Bot, Brain, LayoutDashboard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import LatestForecastCard from "@/components/dashboard/LatestForecastCard";
import LatestPriceCard from "@/components/dashboard/LatestPriceCard";
import PriceHistoryChart from "@/components/dashboard/PriceHistoryChart";
import { getLatestForecast, getLatestPrice, getPriceHistory } from "@/libs/api";
import ChatBot from "@/components/dashboard/ChatbotBox";

export default async function HomePage() {
  const [latestPrice, priceHistory, latestForecast] = await Promise.all([
    getLatestPrice(),
    getPriceHistory(),
    getLatestForecast(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
              MVP
            </Badge>
            <Badge variant="secondary" className="rounded-full gap-1">
              <Brain className="h-3.5 w-3.5" />
              Forecasting
            </Badge>
            <Badge variant="secondary" className="rounded-full gap-1">
              <Bot className="h-3.5 w-3.5" />
              Chatbot
            </Badge>
            <Badge variant="secondary" className="rounded-full gap-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Microservices Dashboard
            </Badge>
          </div>

          <div className="mt-5 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
              Gold Price Forecast Dashboard
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 lg:text-base">
              Hệ thống theo dõi giá vàng thế giới, hiển thị kết quả dự báo mới
              nhất và hỗ trợ hỏi đáp dữ liệu thông qua chatbot tích hợp.
            </p>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LatestPriceCard latestPrice={latestPrice} />
          <LatestForecastCard latestForecast={latestForecast} />
        </div>

        <div className="mt-8">
          <PriceHistoryChart priceHistory={priceHistory} />
        </div>
      </div>

      <ChatBot />
    </main>
  );
}

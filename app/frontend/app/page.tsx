import ChatbotBox from "@/components/dashboard/ChatbotBox";
import LatestForecastCard from "@/components/dashboard/LatestForecastCard";
import LatestPriceCard from "@/components/dashboard/LatestPriceCard";
import PriceHistoryChart from "@/components/dashboard/PriceHistoryChart";
import { getLatestForecast, getLatestPrice, getPriceHistory } from "@/libs/api";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";

export default async function HomePage() {
  const [latestPrice, priceHistory, latestForecast] = await Promise.all([
    getLatestPrice(),
    getPriceHistory(),
    getLatestForecast(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">
            Gold Price Forecast Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Dashboard theo dõi giá vàng, kết quả dự báo và chatbot hỗ trợ tra
            cứu dữ liệu.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LatestPriceCard latestPrice={latestPrice} />
          <LatestForecastCard latestForecast={latestForecast} />
        </section>

        <PriceHistoryChart priceHistory={priceHistory} />

        <ChatbotBox />
      </div>
    </main>
  );
}

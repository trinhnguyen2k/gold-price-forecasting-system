import LatestForecastCard from "@/components/dashboard/LatestForecastCard";
import LatestPriceCard from "@/components/dashboard/LatestPriceCard";
import PriceHistoryChart from "@/components/dashboard/PriceHistoryChart";
import { getLatestForecast, getLatestPrice, getPriceHistory } from "@/libs/api";
import ChatBot from "@/components/dashboard/ChatbotBox";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function HomePage() {
  const [latestPrice, priceHistory, latestForecast] = await Promise.all([
    getLatestPrice(),
    getPriceHistory(),
    getLatestForecast(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <DashboardHeader />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
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

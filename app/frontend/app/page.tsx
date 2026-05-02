import LatestForecastCard from "@/components/dashboard/LatestForecastCard";
import LatestPriceCard from "@/components/dashboard/LatestPriceCard";
import PriceHistoryChart from "@/components/dashboard/PriceHistoryChart";
import ChatBot from "@/components/dashboard/ChatbotBox";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WorldGoldHistoryTable from "@/components/dashboard/WorldGoldHistoryTable";
import { getLatestForecast, getLatestPrice, getPriceHistory } from "@/libs/api";

export default async function HomePage() {
  const [latestPrice, priceHistory, latestForecast] = await Promise.all([
    getLatestPrice(),
    getPriceHistory(),
    getLatestForecast(),
  ]);

  return (
    <>
      <DashboardHeader />

      <main className="min-h-screen bg-[var(--page-bg)]">
        <div className="mx-auto w-full max-w-[1500px] px-6 py-8 lg:px-8 lg:py-10">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-stretch">
            <LatestPriceCard latestPrice={latestPrice} />
            <LatestForecastCard
              latestForecast={latestForecast}
              latestClosingPrice={latestPrice.close}
            />
          </div>

          <div className="mt-8">
            <PriceHistoryChart priceHistory={priceHistory} />
          </div>

          <div className="mt-8">
            <WorldGoldHistoryTable />
          </div>
        </div>

        <ChatBot />
      </main>
    </>
  );
}

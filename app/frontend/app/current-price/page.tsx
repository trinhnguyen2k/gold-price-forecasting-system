import ChatBot from "@/components/dashboard/ChatbotBox";
import CurrentGoldPriceCard from "@/components/dashboard/CurrentGoldPriceCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function CurrentPricePage() {
  return (
    <>
      <DashboardHeader />

      <main className="min-h-screen bg-[var(--page-bg)]">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
          <CurrentGoldPriceCard />
        </div>

        <ChatBot />
      </main>
    </>
  );
}

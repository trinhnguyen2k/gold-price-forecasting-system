import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import { LatestPrice } from "@/type/api.type";

interface LatestPriceCardProps {
  latestPrice: LatestPrice;
}

export default function LatestPriceCard({ latestPrice }: LatestPriceCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Latest Price</h2>

      <div className="mt-4 space-y-2">
        <p className="text-3xl font-bold text-amber-600">
          {formatPriceUsd(latestPrice.close)}
        </p>

        <p className="text-sm text-slate-600">
          Date: {formatDateDdMmYyyy(latestPrice.price_date)}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-4 text-sm text-slate-700">
          <div className="rounded-xl bg-slate-50 p-3">
            <span className="block text-slate-500">Open</span>
            <span className="font-medium">
              {formatPriceUsd(latestPrice.open)}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <span className="block text-slate-500">High</span>
            <span className="font-medium">
              {formatPriceUsd(latestPrice.high)}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <span className="block text-slate-500">Low</span>
            <span className="font-medium">
              {formatPriceUsd(latestPrice.low)}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <span className="block text-slate-500">Source</span>
            <span className="font-medium">{latestPrice.source ?? "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

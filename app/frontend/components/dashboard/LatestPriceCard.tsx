import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import { LatestPrice } from "@/type/api.type";

interface LatestPriceCardProps {
  latestPrice: LatestPrice;
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function LatestPriceCard({ latestPrice }: LatestPriceCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg text-slate-900">Latest Price</CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Giá đóng cửa mới nhất trong hệ thống
          </p>
        </div>

        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <TrendingUp className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white p-5 ring-1 ring-amber-100">
          <p className="text-sm font-medium text-slate-600">Closing Price</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-amber-600">
            {formatPriceUsd(latestPrice.close)}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Updated on {formatDateDdMmYyyy(latestPrice.price_date)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatItem label="Open" value={formatPriceUsd(latestPrice.open)} />
          <StatItem label="High" value={formatPriceUsd(latestPrice.high)} />
          <StatItem label="Low" value={formatPriceUsd(latestPrice.low)} />
          <StatItem label="Source" value={latestPrice.source ?? "N/A"} />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import { PriceHistoryItem } from "@/type/api.type";

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryItem[];
}

export default function PriceHistoryChart({
  priceHistory,
}: PriceHistoryChartProps) {
  const chartData = priceHistory.map((item) => ({
    ...item,
    formattedDate: formatDateDdMmYyyy(item.price_date),
  }));

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">
        Price History Chart
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Biểu đồ thể hiện lịch sử giá đóng cửa vàng theo thời gian.
      </p>

      <div className="mt-6 h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="formattedDate"
              minTickGap={32}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => Number(value).toFixed(0)}
            />
            <Tooltip
              formatter={(value: number | string) => formatPriceUsd(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="close"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

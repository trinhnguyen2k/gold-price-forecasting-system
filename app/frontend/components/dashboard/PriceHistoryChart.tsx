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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { priceHistoryChartStyles } from "./PriceHistoryChart.style";
import { LineChart as LineChartIcon } from "lucide-react";

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
    <Card className={priceHistoryChartStyles.card}>
      <CardHeader>
        <CardTitle className={priceHistoryChartStyles.title}>
          Price History Chart
        </CardTitle>
        <p className={priceHistoryChartStyles.description}>
          Biểu đồ thể hiện lịch sử giá đóng cửa vàng theo thời gian.
        </p>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className={priceHistoryChartStyles.chartWrapper}>
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
        ) : (
          <div className={priceHistoryChartStyles.emptyState}>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                <LineChartIcon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-medium text-slate-700">
                No price history data available
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Dữ liệu lịch sử giá chưa sẵn sàng để hiển thị biểu đồ.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

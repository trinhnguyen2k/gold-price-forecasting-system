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
import { LineChart as LineChartIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import type { PriceHistoryItem } from "@/type/api.type";
import { priceHistoryChartStyles } from "./PriceHistoryChart.style";

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border px-4 py-3 shadow-lg"
      style={{
        backgroundColor: "var(--tooltip-bg)",
        borderColor: "rgba(148, 163, 184, 0.22)",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--muted-color)" }}
      >
        Ngày
      </p>
      <p
        className="mt-1 text-sm font-semibold"
        style={{ color: "var(--title-color)" }}
      >
        {label}
      </p>

      <div className="mt-3">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--muted-color)" }}
        >
          Giá đóng cửa
        </p>
        <p
          className="mt-1 text-sm font-semibold"
          style={{ color: "var(--blue-accent)" }}
        >
          {formatPriceUsd(payload[0].value)}
        </p>
      </div>
    </div>
  );
}

export default function PriceHistoryChart({
  priceHistory,
}: PriceHistoryChartProps) {
  const chartData = priceHistory.map((item) => ({
    ...item,
    formattedDate: formatDateDdMmYyyy(item.price_date),
  }));

  return (
    <Card
      className={priceHistoryChartStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "rgba(148, 163, 184, 0.45)",
        boxShadow: "0 8px 24px rgba(15, 39, 71, 0.04)",
      }}
    >
      <CardHeader>
        <CardTitle
          className={priceHistoryChartStyles.title}
          style={{ color: "var(--title-color)" }}
        >
          Biểu đồ lịch sử giá vàng
        </CardTitle>
        <p
          className={priceHistoryChartStyles.description}
          style={{ color: "var(--muted-color)" }}
        >
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                />
                <XAxis
                  dataKey="formattedDate"
                  minTickGap={32}
                  tick={{ fontSize: 12, fill: "var(--muted-color)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-color)" }}
                  tickFormatter={(value) => Number(value).toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--chart-line)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            className={priceHistoryChartStyles.emptyState}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "rgba(148, 163, 184, 0.28)",
              color: "var(--muted-color)",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="rounded-full p-3"
                style={{ backgroundColor: "var(--panel-bg)" }}
              >
                <LineChartIcon className="h-5 w-5" />
              </div>
              <p
                className="mt-3 font-medium"
                style={{ color: "var(--title-color)" }}
              >
                Chưa có dữ liệu lịch sử giá
              </p>
              <p
                className="mt-1 max-w-md text-sm"
                style={{ color: "var(--muted-color)" }}
              >
                Dữ liệu lịch sử giá hiện chưa sẵn sàng để hiển thị biểu đồ.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

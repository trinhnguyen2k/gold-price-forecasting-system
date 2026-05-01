import { Brain, CalendarDays, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import type {
  ForecastResultItem,
  LatestForecastResponse,
  ModelEvaluationItem,
} from "@/type/api.type";

interface LatestForecastCardProps {
  latestForecast: LatestForecastResponse;
}

interface MetricPanelProps {
  title: string;
  metric: ModelEvaluationItem | null;
}

function findMetricsBySplit(
  evaluations: ModelEvaluationItem[],
  split: string,
): ModelEvaluationItem | null {
  return (
    evaluations.find(
      (item) => item.dataset_split.toLowerCase() === split.toLowerCase(),
    ) ?? null
  );
}

function MetricPanel({ title, metric }: MetricPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

      {metric ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-500">MAE:</span>{" "}
            {metric.mae.toFixed(4)}
          </p>
          <p>
            <span className="font-medium text-slate-500">RMSE:</span>{" "}
            {metric.rmse.toFixed(4)}
          </p>
          <p>
            <span className="font-medium text-slate-500">MAPE:</span>{" "}
            {metric.mape.toFixed(4)}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No metrics available.</p>
      )}
    </div>
  );
}

export default function LatestForecastCard({
  latestForecast,
}: LatestForecastCardProps) {
  const firstForecast: ForecastResultItem | null =
    latestForecast.results[0] ?? null;

  const validationMetrics = findMetricsBySplit(
    latestForecast.evaluations,
    "validation",
  );

  const testMetrics = findMetricsBySplit(latestForecast.evaluations, "test");

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg text-slate-900">
            Latest Forecast
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Kết quả forecast mới nhất và các chỉ số đánh giá mô hình
          </p>
        </div>

        <div className="rounded-full bg-sky-100 p-2 text-sky-700">
          <Brain className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent>
        {latestForecast.run ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {latestForecast.run.model_name}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {latestForecast.run.status}
              </Badge>
              {latestForecast.run.note?.toLowerCase().includes("sample") && (
                <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
                  Sample data
                </Badge>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarDays className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    Forecast run information
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-medium text-slate-500">Model:</span>{" "}
                    {latestForecast.run.model_name}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Version:</span>{" "}
                    {latestForecast.run.model_version ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">
                      Forecast date:
                    </span>{" "}
                    {formatDateDdMmYyyy(latestForecast.run.forecast_date)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white p-5 ring-1 ring-sky-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-medium">Nearest prediction</p>
                </div>

                {firstForecast ? (
                  <>
                    <p className="mt-4 text-sm text-slate-500">
                      Target date{" "}
                      {formatDateDdMmYyyy(firstForecast.target_date)}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-sky-700">
                      {formatPriceUsd(firstForecast.predicted_close)}
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No forecast result available.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <MetricPanel
                title="Validation Metrics"
                metric={validationMetrics}
              />
              <MetricPanel title="Test Metrics" metric={testMetrics} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Hiện chưa có dữ liệu forecast.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

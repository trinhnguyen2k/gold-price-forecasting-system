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
import { latestForecastCardStyles } from "./LatestForecastCard.style";

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
    <div className={latestForecastCardStyles.metricPanel}>
      <h3 className={latestForecastCardStyles.metricTitle}>{title}</h3>

      {metric ? (
        <div className={latestForecastCardStyles.metricBody}>
          <p>
            <span className={latestForecastCardStyles.metricLabel}>MAE:</span>{" "}
            {metric.mae.toFixed(4)}
          </p>
          <p>
            <span className={latestForecastCardStyles.metricLabel}>RMSE:</span>{" "}
            {metric.rmse.toFixed(4)}
          </p>
          <p>
            <span className={latestForecastCardStyles.metricLabel}>MAPE:</span>{" "}
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
    <Card className={latestForecastCardStyles.card}>
      <CardHeader className={latestForecastCardStyles.header}>
        <div>
          <CardTitle className={latestForecastCardStyles.title}>
            Latest Forecast
          </CardTitle>
          <p className={latestForecastCardStyles.description}>
            Kết quả forecast mới nhất và các chỉ số đánh giá mô hình
          </p>
        </div>

        <div className={latestForecastCardStyles.headerIcon}>
          <Brain className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className={latestForecastCardStyles.content}>
        {latestForecast.run ? (
          <>
            <div className={latestForecastCardStyles.badgeRow}>
              <Badge
                variant="secondary"
                className={latestForecastCardStyles.secondaryBadge}
              >
                {latestForecast.run.model_name}
              </Badge>

              <Badge
                variant="outline"
                className={latestForecastCardStyles.secondaryBadge}
              >
                {latestForecast.run.status}
              </Badge>

              {latestForecast.run.note?.toLowerCase().includes("sample") && (
                <Badge className={latestForecastCardStyles.sampleBadge}>
                  Sample data
                </Badge>
              )}
            </div>

            <div className={latestForecastCardStyles.infoGrid}>
              <div className={latestForecastCardStyles.infoPanel}>
                <div className={latestForecastCardStyles.infoPanelHeader}>
                  <CalendarDays className="h-4 w-4" />
                  <p className={latestForecastCardStyles.infoPanelHeaderText}>
                    Forecast run information
                  </p>
                </div>

                <div className={latestForecastCardStyles.infoPanelBody}>
                  <p>
                    <span className={latestForecastCardStyles.infoLabel}>
                      Model:
                    </span>{" "}
                    {latestForecast.run.model_name}
                  </p>
                  <p>
                    <span className={latestForecastCardStyles.infoLabel}>
                      Version:
                    </span>{" "}
                    {latestForecast.run.model_version ?? "N/A"}
                  </p>
                  <p>
                    <span className={latestForecastCardStyles.infoLabel}>
                      Forecast date:
                    </span>{" "}
                    {formatDateDdMmYyyy(latestForecast.run.forecast_date)}
                  </p>
                </div>
              </div>

              <div className={latestForecastCardStyles.predictionPanel}>
                <div className={latestForecastCardStyles.infoPanelHeader}>
                  <Sparkles className="h-4 w-4" />
                  <p className={latestForecastCardStyles.infoPanelHeaderText}>
                    Nearest prediction
                  </p>
                </div>

                {firstForecast ? (
                  <>
                    <p className={latestForecastCardStyles.predictionDateLabel}>
                      Target date{" "}
                      {formatDateDdMmYyyy(firstForecast.target_date)}
                    </p>
                    <p className={latestForecastCardStyles.predictionValue}>
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

            <div className={latestForecastCardStyles.metricGrid}>
              <MetricPanel
                title="Validation Metrics"
                metric={validationMetrics}
              />
              <MetricPanel title="Test Metrics" metric={testMetrics} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="font-medium text-slate-700">
              No forecast data available
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Hệ thống hiện chưa có dữ liệu dự báo để hiển thị.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

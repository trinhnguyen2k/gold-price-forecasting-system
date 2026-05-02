import { Brain, CalendarDays, Sparkles, TrendingUp } from "lucide-react";

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
  latestClosingPrice: number;
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
    <div
      className={latestForecastCardStyles.metricPanel}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "rgba(148, 163, 184, 0.28)",
      }}
    >
      <h3
        className={latestForecastCardStyles.metricTitle}
        style={{ color: "var(--title-color)" }}
      >
        {title}
      </h3>

      <p
        className={latestForecastCardStyles.metricHint}
        style={{ color: "var(--muted-color)" }}
      >
        Giá trị càng thấp càng tốt
      </p>

      {metric ? (
        <div className={latestForecastCardStyles.metricStatsRow}>
          <div
            className={latestForecastCardStyles.metricStatBox}
            style={{
              backgroundColor: "var(--blue-accent-soft)",
              borderColor: "rgba(148, 163, 184, 0.22)",
            }}
          >
            <p
              className={latestForecastCardStyles.metricStatValue}
              style={{ color: "var(--blue-accent)" }}
            >
              {metric.mae.toFixed(2)}
            </p>
            <p
              className={latestForecastCardStyles.metricStatLabel}
              style={{ color: "var(--muted-color)" }}
            >
              MAE
            </p>
          </div>

          <div
            className={latestForecastCardStyles.metricStatBox}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "rgba(148, 163, 184, 0.22)",
            }}
          >
            <p
              className={latestForecastCardStyles.metricStatValue}
              style={{ color: "var(--title-color)" }}
            >
              {metric.rmse.toFixed(2)}
            </p>
            <p
              className={latestForecastCardStyles.metricStatLabel}
              style={{ color: "var(--muted-color)" }}
            >
              RMSE
            </p>
          </div>

          <div
            className={latestForecastCardStyles.metricStatBox}
            style={{
              backgroundColor: "var(--gold-accent-soft)",
              borderColor: "rgba(148, 163, 184, 0.22)",
            }}
          >
            <p
              className={latestForecastCardStyles.metricStatValue}
              style={{ color: "var(--gold-accent)" }}
            >
              {metric.mape.toFixed(2)}%
            </p>
            <p
              className={latestForecastCardStyles.metricStatLabel}
              style={{ color: "var(--muted-color)" }}
            >
              MAPE
            </p>
          </div>
        </div>
      ) : (
        <p
          className={latestForecastCardStyles.emptyText}
          style={{ color: "var(--muted-color)" }}
        >
          Chưa có dữ liệu đánh giá.
        </p>
      )}
    </div>
  );
}

export default function LatestForecastCard({
  latestForecast,
  latestClosingPrice,
}: LatestForecastCardProps) {
  const firstForecast: ForecastResultItem | null =
    latestForecast.results[0] ?? null;

  const validationMetrics = findMetricsBySplit(
    latestForecast.evaluations,
    "validation",
  );

  const testMetrics = findMetricsBySplit(latestForecast.evaluations, "test");

  const forecastDifference = firstForecast
    ? firstForecast.predicted_close - latestClosingPrice
    : null;

  const forecastDifferenceText =
    forecastDifference === null
      ? "Chưa có dữ liệu"
      : `${forecastDifference > 0 ? "+" : ""}${forecastDifference.toFixed(2)} USD`;

  return (
    <Card
      className={latestForecastCardStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "rgba(148, 163, 184, 0.45)",
        boxShadow: "0 8px 24px rgba(15, 39, 71, 0.04)",
      }}
    >
      <CardHeader className={latestForecastCardStyles.header}>
        <div>
          <CardTitle
            className={latestForecastCardStyles.title}
            style={{ color: "var(--title-color)" }}
          >
            Dự báo mới nhất
          </CardTitle>
          <p
            className={latestForecastCardStyles.description}
            style={{ color: "var(--muted-color)" }}
          >
            Kết quả dự báo mới nhất và các chỉ số đánh giá mô hình
          </p>
        </div>

        <div
          className={latestForecastCardStyles.headerIcon}
          style={{
            backgroundColor: "var(--blue-accent-soft)",
            color: "var(--blue-accent)",
          }}
        >
          <Brain className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className={latestForecastCardStyles.content}>
        {latestForecast.run ? (
          <>
            <div className={latestForecastCardStyles.infoGrid}>
              <div
                className={latestForecastCardStyles.infoPanel}
                style={{
                  backgroundColor: "var(--panel-bg)",
                  borderColor: "rgba(148, 163, 184, 0.28)",
                }}
              >
                <div
                  className={latestForecastCardStyles.infoPanelHeader}
                  style={{ color: "var(--text-color)" }}
                >
                  <CalendarDays className="h-4 w-4" />
                  <p className={latestForecastCardStyles.infoPanelHeaderText}>
                    Thông tin lần chạy dự báo
                  </p>
                </div>

                <div
                  className={latestForecastCardStyles.infoPanelBody}
                  style={{ color: "var(--text-color)" }}
                >
                  <p>
                    <span
                      className={latestForecastCardStyles.infoLabel}
                      style={{ color: "var(--muted-color)" }}
                    >
                      Mô hình:
                    </span>{" "}
                    {latestForecast.run.model_name}
                  </p>
                  <p>
                    <span
                      className={latestForecastCardStyles.infoLabel}
                      style={{ color: "var(--muted-color)" }}
                    >
                      Phiên bản:
                    </span>{" "}
                    {latestForecast.run.model_version ?? "N/A"}
                  </p>
                  <p>
                    <span
                      className={latestForecastCardStyles.infoLabel}
                      style={{ color: "var(--muted-color)" }}
                    >
                      Ngày dự báo:
                    </span>{" "}
                    {formatDateDdMmYyyy(latestForecast.run.forecast_date)}
                  </p>
                </div>
              </div>

              <div
                className={latestForecastCardStyles.predictionPanel}
                style={{
                  backgroundColor: "var(--blue-accent-soft)",
                  borderColor: "rgba(92, 200, 255, 0.28)",
                }}
              >
                <div
                  className={latestForecastCardStyles.infoPanelHeader}
                  style={{ color: "var(--text-color)" }}
                >
                  <Sparkles className="h-4 w-4" />
                  <p className={latestForecastCardStyles.infoPanelHeaderText}>
                    Dự báo ngày kế tiếp
                  </p>
                </div>

                {firstForecast ? (
                  <>
                    <p
                      className={latestForecastCardStyles.predictionDateLabel}
                      style={{ color: "var(--muted-color)" }}
                    >
                      Ngày mục tiêu{" "}
                      {formatDateDdMmYyyy(firstForecast.target_date)}
                    </p>
                    <p
                      className={latestForecastCardStyles.predictionValue}
                      style={{ color: "var(--blue-accent)" }}
                    >
                      {formatPriceUsd(firstForecast.predicted_close)}
                    </p>
                  </>
                ) : (
                  <p
                    className={latestForecastCardStyles.emptyText}
                    style={{ color: "var(--muted-color)" }}
                  >
                    Chưa có dữ liệu dự báo.
                  </p>
                )}
              </div>
            </div>

            <div
              className={latestForecastCardStyles.differenceBox}
              style={{
                backgroundColor: "var(--panel-bg)",
                borderColor: "rgba(148, 163, 184, 0.28)",
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp
                  className="h-4 w-4"
                  style={{ color: "var(--muted-color)" }}
                />
                <p
                  className={latestForecastCardStyles.differenceLabel}
                  style={{ color: "var(--muted-color)" }}
                >
                  Chênh lệch so với giá đóng cửa hiện tại
                </p>
              </div>

              <p
                className={latestForecastCardStyles.differenceValue}
                style={{
                  color:
                    forecastDifference === null
                      ? "var(--muted-color)"
                      : forecastDifference > 0
                        ? "var(--success-text)"
                        : forecastDifference < 0
                          ? "var(--warning-text)"
                          : "var(--title-color)",
                }}
              >
                {forecastDifferenceText}
              </p>
            </div>

            <Separator />

            <div className={latestForecastCardStyles.metricGrid}>
              <MetricPanel
                title="Chỉ số đánh giá Validation"
                metric={validationMetrics}
              />
              <MetricPanel title="Chỉ số đánh giá Test" metric={testMetrics} />
            </div>
          </>
        ) : (
          <p
            className={latestForecastCardStyles.emptyText}
            style={{ color: "var(--muted-color)" }}
          >
            Hiện chưa có dữ liệu dự báo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

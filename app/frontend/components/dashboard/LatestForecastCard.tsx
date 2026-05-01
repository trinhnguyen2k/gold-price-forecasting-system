import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import type {
  ForecastResultItem,
  LatestForecastResponse,
  ModelEvaluationItem,
} from "@/type/api.type";

interface LatestForecastCardProps {
  latestForecast: LatestForecastResponse;
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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Latest Forecast</h2>

      {latestForecast.run ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium">Model:</span>{" "}
              {latestForecast.run.model_name}
            </p>
            <p>
              <span className="font-medium">Version:</span>{" "}
              {latestForecast.run.model_version ?? "N/A"}
            </p>
            <p>
              <span className="font-medium">Forecast date:</span>{" "}
              {formatDateDdMmYyyy(latestForecast.run.forecast_date)}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              {latestForecast.run.status}
            </p>
          </div>

          {firstForecast && (
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-slate-600">
                Forecast gần nhất cho ngày
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatDateDdMmYyyy(firstForecast.target_date)}
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {formatPriceUsd(firstForecast.predicted_close)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">Validation</h3>
              {validationMetrics ? (
                <div className="mt-2 space-y-1">
                  <p>MAE: {validationMetrics.mae.toFixed(4)}</p>
                  <p>RMSE: {validationMetrics.rmse.toFixed(4)}</p>
                  <p>MAPE: {validationMetrics.mape.toFixed(4)}</p>
                </div>
              ) : (
                <p className="mt-2 text-slate-500">No validation metrics.</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">Test</h3>
              {testMetrics ? (
                <div className="mt-2 space-y-1">
                  <p>MAE: {testMetrics.mae.toFixed(4)}</p>
                  <p>RMSE: {testMetrics.rmse.toFixed(4)}</p>
                  <p>MAPE: {testMetrics.mape.toFixed(4)}</p>
                </div>
              ) : (
                <p className="mt-2 text-slate-500">No test metrics.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Hiện chưa có dữ liệu forecast.
        </p>
      )}
    </div>
  );
}

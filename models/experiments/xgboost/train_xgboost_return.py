"""Huấn luyện XGBoost dự báo return ngày kế tiếp rồi quy đổi về giá vàng.

Cấu trúc script:
1. Đọc dữ liệu giá vàng từ CSV.
2. Chuẩn hóa tên cột, kiểu dữ liệu và sắp xếp theo ngày tăng dần.
3. Tạo feature từ dữ liệu hiện tại/quá khứ, tuyệt đối không dùng dữ liệu tương lai.
4. Tạo next_close = close.shift(-1).
5. Tạo target_return = (next_close - close) / close.
6. Chia dữ liệu theo thời gian 75/15/10 thành train/validation/test, không shuffle.
7. Train XGBoost để dự đoán target_return.
8. Khi đánh giá, quy đổi predicted_return thành predicted_next_close.
9. Tính MAE, RMSE, MAPE trên actual_next_close và predicted_next_close.
10. Lưu metrics, predictions, feature importance, model, config và biểu đồ.

Ý nghĩa trong khóa luận:
- Mô hình return không dự báo trực tiếp mức giá tuyệt đối, mà dự báo tỷ lệ thay
  đổi của giá ngày kế tiếp.
- Cách này giúp giảm tác động của việc mức giá vàng thay đổi mạnh theo regime.
- Tuy nhiên metrics cuối cùng vẫn tính trên giá để so sánh công bằng với các mô
  hình dự báo giá trực tiếp như Prophet hoặc XGBoost baseline.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

try:
    import numpy as np
    import pandas as pd
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from xgboost import XGBRegressor
except ImportError as exc:
    raise SystemExit(
        "Missing Python package for this XGBoost return experiment.\n"
        "Run this command in the project root:\n"
        "  .\\.venv\\Scripts\\python.exe -m pip install numpy pandas scikit-learn xgboost matplotlib\n"
        f"Original error: {exc}"
    ) from exc


# =========================
# 1. Cấu hình thí nghiệm
# =========================

RANDOM_STATE = 42
DEFAULT_INPUT_PATH = Path("data/processed/gold_cleaned.csv")
DEFAULT_OUTPUT_DIR = Path("models/experiments/xgboost/outputs_return")
REQUIRED_COLUMNS = ("price_date", "open", "high", "low", "close")

# Feature đầu vào của model.
# Tất cả feature đều được tạo từ dữ liệu tại thời điểm t hoặc trước t.
# Không có feature nào sử dụng next_close hoặc target_return.
FEATURE_COLUMNS = [
    "open",
    "high",
    "low",
    "close",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_5",
    "lag_7",
    "lag_14",
    "rolling_mean_3",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_std_3",
    "rolling_std_7",
    "rolling_std_14",
    "diff_1",
    "diff_3",
    "return_1",
    "return_3",
    "day_of_week",
    "month",
    "trend_index",
    "close_to_rolling_mean_7",
    "close_to_rolling_mean_14",
    "volatility_ratio_7",
    "volatility_ratio_14",
    "trend_strength_3_14",
]

NEXT_CLOSE_COLUMN = "next_close"
TARGET_COLUMN = "target_return"


def parse_args() -> argparse.Namespace:
    """Khai báo CLI để có thể đổi input/output khi chạy thí nghiệm."""
    parser = argparse.ArgumentParser(
        description="Train XGBoost to predict next-day gold return, then evaluate as price."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help=f"Input CSV path. Default: {DEFAULT_INPUT_PATH}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--no-plot",
        action="store_true",
        help="Skip saving actual-vs-predicted plots.",
    )
    return parser.parse_args()


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Chuẩn hóa tên cột để đọc được cả processed CSV và raw CSV đơn giản."""
    normalized = df.copy()
    normalized.columns = (
        normalized.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace(".", "", regex=False)
        .str.replace("%", "pct", regex=False)
    )
    normalized = normalized.rename(
        columns={
            "date": "price_date",
            "price": "close",
        }
    )
    return normalized


def clean_numeric_columns(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    """Chuyển các cột giá sang numeric để model có thể xử lý."""
    cleaned = df.copy()
    for column in columns:
        cleaned[column] = (
            cleaned[column]
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.replace("%", "", regex=False)
        )
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")
    return cleaned


def load_data(input_path: Path) -> pd.DataFrame:
    """Đọc dữ liệu, kiểm tra cột bắt buộc và sắp xếp theo thời gian.

    Sắp xếp theo `price_date` trước khi tạo feature là bắt buộc. Nếu không,
    lag/rolling/shift sẽ không còn đúng ý nghĩa thời gian.
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    df = pd.read_csv(input_path)
    df = normalize_columns(df)

    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    if missing:
        raise ValueError(
            f"Input data is missing required columns: {missing}. "
            f"Available columns: {list(df.columns)}"
        )

    df["price_date"] = pd.to_datetime(df["price_date"], errors="coerce")
    df = clean_numeric_columns(df, ["open", "high", "low", "close"])
    df = df.dropna(subset=list(REQUIRED_COLUMNS))

    # Không shuffle. Dữ liệu phải đi từ quá khứ đến tương lai.
    return df.sort_values("price_date").drop_duplicates("price_date").reset_index(drop=True)


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tạo feature và target_return cho bài toán dự báo return.

    Feature engineering:
    - lag_n: giá đóng cửa n ngày trước.
    - rolling_mean/std: xu hướng và biến động gần đây.
    - diff/return: momentum ngắn hạn.
    - ratio/volatility/trend strength: feature nâng cao để mô tả giá hiện tại
      đang cao/thấp hơn trung bình gần đây và độ biến động tương đối.

    Target:
    - next_close = close.shift(-1)
    - target_return = (next_close - close) / close

    Lưu ý chống leakage:
    - next_close chỉ dùng để tạo nhãn y.
    - next_close và target_return không nằm trong FEATURE_COLUMNS.
    """
    featured = df.copy()

    for lag in (1, 2, 3, 5, 7, 14):
        featured[f"lag_{lag}"] = featured["close"].shift(lag)

    for window in (3, 7, 14):
        rolling_close = featured["close"].rolling(window=window, min_periods=window)
        featured[f"rolling_mean_{window}"] = rolling_close.mean()
        featured[f"rolling_std_{window}"] = rolling_close.std()

    featured["diff_1"] = featured["close"] - featured["lag_1"]
    featured["diff_3"] = featured["close"] - featured["lag_3"]
    featured["return_1"] = featured["diff_1"] / featured["lag_1"]
    featured["return_3"] = featured["diff_3"] / featured["lag_3"]

    featured["day_of_week"] = featured["price_date"].dt.dayofweek
    featured["month"] = featured["price_date"].dt.month
    featured["trend_index"] = np.arange(len(featured), dtype=float)

    # Feature nâng cao: chỉ dùng close/rolling tại thời điểm hiện tại hoặc quá khứ.
    featured["close_to_rolling_mean_7"] = featured["close"] / featured["rolling_mean_7"]
    featured["close_to_rolling_mean_14"] = featured["close"] / featured["rolling_mean_14"]
    featured["volatility_ratio_7"] = featured["rolling_std_7"] / featured["rolling_mean_7"]
    featured["volatility_ratio_14"] = featured["rolling_std_14"] / featured["rolling_mean_14"]
    featured["trend_strength_3_14"] = featured["rolling_mean_3"] - featured["rolling_mean_14"]

    # Target của thí nghiệm return.
    featured[NEXT_CLOSE_COLUMN] = featured["close"].shift(-1)
    featured[TARGET_COLUMN] = (featured[NEXT_CLOSE_COLUMN] - featured["close"]) / featured["close"]

    featured = featured.replace([np.inf, -np.inf], np.nan)
    return featured.dropna(subset=FEATURE_COLUMNS + [NEXT_CLOSE_COLUMN, TARGET_COLUMN]).reset_index(drop=True)


def split_time_series(
    df: pd.DataFrame, train_ratio: float = 0.75, validation_ratio: float = 0.15
) -> dict[str, pd.DataFrame]:
    """Chia dữ liệu theo thời gian 75/15/10, tuyệt đối không shuffle."""
    if not 0 < train_ratio < 1 or not 0 < validation_ratio < 1:
        raise ValueError("train_ratio and validation_ratio must be between 0 and 1.")
    if train_ratio + validation_ratio >= 1:
        raise ValueError("train_ratio + validation_ratio must be less than 1.")

    n_rows = len(df)
    train_end = int(n_rows * train_ratio)
    validation_end = train_end + int(n_rows * validation_ratio)

    if train_end == 0 or validation_end <= train_end or validation_end >= n_rows:
        raise ValueError(
            "Not enough rows after feature engineering for a 75/15/10 time split. "
            f"Rows available: {n_rows}"
        )

    return {
        "train": df.iloc[:train_end].copy(),
        "validation": df.iloc[train_end:validation_end].copy(),
        "test": df.iloc[validation_end:].copy(),
    }


def build_model() -> XGBRegressor:
    """Tạo XGBoost Regressor cho target_return.

    Early stopping:
    - XGBoost cần `eval_set` trong lúc fit.
    - Validation metric sẽ được theo dõi để dừng khi không còn cải thiện.
    - Ở đây metric dừng sớm là RMSE trên target_return.
    """
    return XGBRegressor(
        n_estimators=500,
        max_depth=3,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.5,
        reg_lambda=2.0,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=1,
        eval_metric="rmse",
        early_stopping_rounds=50,
    )


def train_xgboost(splits: dict[str, pd.DataFrame]) -> XGBRegressor:
    """Train model dự báo target_return bằng train set và validation set."""
    x_train = splits["train"][FEATURE_COLUMNS]
    y_train = splits["train"][TARGET_COLUMN]
    x_validation = splits["validation"][FEATURE_COLUMNS]
    y_validation = splits["validation"][TARGET_COLUMN]

    model = build_model()
    try:
        model.fit(
            x_train,
            y_train,
            eval_set=[(x_validation, y_validation)],
            verbose=False,
        )
    except TypeError:
        # Tương thích với một số bản xgboost cũ hơn.
        model = build_model()
        model.set_params(early_stopping_rounds=None)
        try:
            model.fit(
                x_train,
                y_train,
                eval_set=[(x_validation, y_validation)],
                early_stopping_rounds=50,
                verbose=False,
            )
        except TypeError:
            model.fit(
                x_train,
                y_train,
                eval_set=[(x_validation, y_validation)],
                verbose=False,
            )
    return model


def mean_absolute_percentage_error(y_true: pd.Series, y_pred: np.ndarray) -> float:
    """Tính MAPE trên giá thật và giá dự báo."""
    y_true_array = np.asarray(y_true, dtype=float)
    y_pred_array = np.asarray(y_pred, dtype=float)
    mask = y_true_array != 0
    if not mask.any():
        return np.nan
    return float(np.mean(np.abs((y_true_array[mask] - y_pred_array[mask]) / y_true_array[mask])) * 100)


def evaluate_model(
    model: XGBRegressor, splits: dict[str, pd.DataFrame]
) -> tuple[pd.DataFrame, dict[str, pd.DataFrame]]:
    """Đánh giá model bằng cách quy đổi predicted_return về predicted_next_close.

    Model dự đoán:
    - predicted_return

    Quy đổi về giá:
    - predicted_next_close = close * (1 + predicted_return)

    Metrics vẫn tính trên:
    - actual_next_close
    - predicted_next_close
    """
    metric_rows = []
    prediction_frames = {}

    for split_name, split_df in splits.items():
        actual_next_close = split_df[NEXT_CLOSE_COLUMN]
        actual_return = split_df[TARGET_COLUMN]
        predicted_return = model.predict(split_df[FEATURE_COLUMNS])
        predicted_next_close = split_df["close"].to_numpy() * (1 + predicted_return)

        rmse = float(np.sqrt(mean_squared_error(actual_next_close, predicted_next_close)))
        metric_rows.append(
            {
                "split": split_name,
                "rows": len(split_df),
                "start_date": split_df["price_date"].min().date().isoformat(),
                "end_date": split_df["price_date"].max().date().isoformat(),
                "actual_next_close_mean": round(float(actual_next_close.mean()), 4),
                "actual_return_mean": round(float(actual_return.mean()), 6),
                "predicted_return_mean": round(float(np.mean(predicted_return)), 6),
                "MAE": round(float(mean_absolute_error(actual_next_close, predicted_next_close)), 4),
                "RMSE": round(rmse, 4),
                "MAPE": round(mean_absolute_percentage_error(actual_next_close, predicted_next_close), 4),
            }
        )

        predictions = split_df[
            ["price_date", "open", "high", "low", "close", NEXT_CLOSE_COLUMN, TARGET_COLUMN]
        ].copy()
        predictions = predictions.rename(
            columns={
                NEXT_CLOSE_COLUMN: "actual_next_close",
                TARGET_COLUMN: "actual_return",
            }
        )
        predictions["predicted_return"] = predicted_return
        predictions["predicted_next_close"] = predicted_next_close
        predictions["error"] = predictions["actual_next_close"] - predictions["predicted_next_close"]
        predictions["absolute_error"] = predictions["error"].abs()
        predictions["absolute_percentage_error"] = (
            predictions["absolute_error"] / predictions["actual_next_close"].replace(0, np.nan) * 100
        )
        predictions.insert(0, "split", split_name)
        prediction_frames[split_name] = predictions

    return pd.DataFrame(metric_rows), prediction_frames


def calculate_metric_gaps(metrics: pd.DataFrame) -> pd.DataFrame:
    """Tính gap metrics để phân tích overfitting và khả năng tổng quát hóa."""
    indexed = metrics.set_index("split")
    rows = []
    for metric in ("MAE", "RMSE", "MAPE"):
        rows.append(
            {
                "metric": metric,
                "train_to_validation_gap": round(
                    float(indexed.loc["validation", metric] - indexed.loc["train", metric]), 4
                ),
                "validation_to_test_gap": round(
                    float(indexed.loc["test", metric] - indexed.loc["validation", metric]), 4
                ),
            }
        )
    return pd.DataFrame(rows)


def build_split_summary(splits: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Tóm tắt phân phối giá và return của từng split."""
    rows = []
    for split_name, split_df in splits.items():
        rows.append(
            {
                "split": split_name,
                "rows": len(split_df),
                "start_date": split_df["price_date"].min().date().isoformat(),
                "end_date": split_df["price_date"].max().date().isoformat(),
                "close_mean": round(float(split_df["close"].mean()), 4),
                "close_min": round(float(split_df["close"].min()), 4),
                "close_max": round(float(split_df["close"].max()), 4),
                "next_close_mean": round(float(split_df[NEXT_CLOSE_COLUMN].mean()), 4),
                "next_close_min": round(float(split_df[NEXT_CLOSE_COLUMN].min()), 4),
                "next_close_max": round(float(split_df[NEXT_CLOSE_COLUMN].max()), 4),
                "target_return_mean": round(float(split_df[TARGET_COLUMN].mean()), 6),
                "target_return_std": round(float(split_df[TARGET_COLUMN].std()), 6),
                "target_return_min": round(float(split_df[TARGET_COLUMN].min()), 6),
                "target_return_max": round(float(split_df[TARGET_COLUMN].max()), 6),
            }
        )
    return pd.DataFrame(rows)


def save_feature_importance(model: XGBRegressor, output_dir: Path) -> None:
    """Lưu feature importance để giải thích feature nào ảnh hưởng nhiều hơn."""
    importance = pd.DataFrame(
        {
            "feature": FEATURE_COLUMNS,
            "importance": model.feature_importances_,
        }
    ).sort_values("importance", ascending=False)
    importance.to_csv(output_dir / "feature_importance.csv", index=False)


def save_plots(prediction_frames: dict[str, pd.DataFrame], output_dir: Path) -> None:
    """Lưu biểu đồ actual_next_close vs predicted_next_close."""
    try:
        import matplotlib

        # Dùng backend không cần GUI để script chạy ổn trong terminal/CI/venv.
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib is not installed; skipping plots.")
        return

    for split_name in ("validation", "test"):
        predictions = prediction_frames[split_name]
        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(
            predictions["price_date"],
            predictions["actual_next_close"],
            label="Actual next close",
            linewidth=2,
        )
        ax.plot(
            predictions["price_date"],
            predictions["predicted_next_close"],
            label="Predicted next close from return",
            linewidth=2,
        )
        ax.set_title(f"XGBoost Return {split_name.title()} Actual vs Predicted")
        ax.set_xlabel("Date")
        ax.set_ylabel("Gold close price")
        ax.legend()
        ax.grid(alpha=0.25)
        fig.autofmt_xdate()
        fig.tight_layout()
        fig.savefig(output_dir / f"{split_name}_actual_vs_predicted.png", dpi=150)
        plt.close(fig)


def save_outputs(
    model: XGBRegressor,
    metrics: pd.DataFrame,
    metric_gaps: pd.DataFrame,
    split_summary: pd.DataFrame,
    prediction_frames: dict[str, pd.DataFrame],
    output_dir: Path,
    save_plot: bool,
) -> None:
    """Lưu toàn bộ artifact của thí nghiệm return-target."""
    output_dir.mkdir(parents=True, exist_ok=True)

    metrics.to_csv(output_dir / "metrics.csv", index=False)
    metric_gaps.to_csv(output_dir / "metric_gaps.csv", index=False)
    split_summary.to_csv(output_dir / "split_summary.csv", index=False)
    prediction_frames["validation"].to_csv(output_dir / "validation_predictions.csv", index=False)
    prediction_frames["test"].to_csv(output_dir / "test_predictions.csv", index=False)
    pd.concat(prediction_frames.values(), ignore_index=True).to_csv(
        output_dir / "all_predictions.csv", index=False
    )
    save_feature_importance(model, output_dir)
    model.save_model(output_dir / "xgboost_return_model.json")

    config = {
        "random_state": RANDOM_STATE,
        "target": TARGET_COLUMN,
        "price_target_for_metrics": NEXT_CLOSE_COLUMN,
        "features": FEATURE_COLUMNS,
        "split": {"train": 0.75, "validation": 0.15, "test": 0.10},
        "shuffle": False,
        "output_dir": str(output_dir),
        "model_params": model.get_params(),
    }
    (output_dir / "run_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    if save_plot:
        save_plots(prediction_frames, output_dir)


def main() -> None:
    """Luồng chạy chính của script."""
    args = parse_args()

    df = load_data(args.input)
    featured = create_features(df)
    splits = split_time_series(featured)

    model = train_xgboost(splits)
    metrics, prediction_frames = evaluate_model(model, splits)
    metric_gaps = calculate_metric_gaps(metrics)
    split_summary = build_split_summary(splits)

    save_outputs(
        model=model,
        metrics=metrics,
        metric_gaps=metric_gaps,
        split_summary=split_summary,
        prediction_frames=prediction_frames,
        output_dir=args.output_dir,
        save_plot=not args.no_plot,
    )

    print("XGBoost return experiment finished.")
    print(f"Input rows: {len(df)}")
    print(f"Rows after feature engineering: {len(featured)}")
    print(f"Output directory: {args.output_dir}")
    print("\nMetrics on next-close price:")
    print(metrics[["split", "rows", "start_date", "end_date", "MAE", "RMSE", "MAPE"]].to_string(index=False))
    print("\nMetric gaps:")
    print(metric_gaps.to_string(index=False))


if __name__ == "__main__":
    main()

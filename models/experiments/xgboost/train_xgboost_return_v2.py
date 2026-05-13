"""XGBoost return-based v2 cho bài toán dự báo giá vàng ngày kế tiếp.

Mục tiêu của phiên bản v2:
1. Vẫn dự báo target_return thay vì dự báo trực tiếp next_close.
2. Quy đổi predicted_return về predicted_next_close để tính MAE/RMSE/MAPE.
3. Thêm feature trend, momentum, volatility và cấu trúc nến OHLC để prediction
   bớt phẳng hơn so với bản return đầu tiên.
4. Thêm directional accuracy và prediction volatility để đánh giá hành vi dự báo.

Nguyên tắc time-series:
- Dữ liệu luôn được sort theo price_date tăng dần.
- Split theo thời gian 75/15/10.
- Không shuffle.
- Không dùng dữ liệu tương lai làm feature.
- next_close và target_return chỉ là label, không nằm trong FEATURE_COLUMNS.
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
        "Missing Python package for this XGBoost return v2 experiment.\n"
        "Run this command in the project root:\n"
        "  .\\.venv\\Scripts\\python.exe -m pip install numpy pandas scikit-learn xgboost matplotlib\n"
        f"Original error: {exc}"
    ) from exc


# =========================
# 1. Cấu hình thí nghiệm
# =========================

RANDOM_STATE = 42
DEFAULT_INPUT_PATH = Path("data/processed/gold_cleaned.csv")
DEFAULT_OUTPUT_DIR = Path("models/experiments/xgboost/outputs_return_v2")
REQUIRED_COLUMNS = ("price_date", "open", "high", "low", "close")

NEXT_CLOSE_COLUMN = "next_close"
TARGET_COLUMN = "target_return"

# Danh sách feature đưa vào XGBoost.
# Các feature này chỉ dùng dữ liệu tại ngày t hoặc trước ngày t.
FEATURE_COLUMNS = [
    # OHLC gốc.
    "open",
    "high",
    "low",
    "close",
    # Lag features.
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_5",
    "lag_7",
    "lag_14",
    # Rolling trend/volatility features.
    "rolling_mean_3",
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_std_3",
    "rolling_std_7",
    "rolling_std_14",
    # Momentum cơ bản.
    "diff_1",
    "diff_3",
    "return_1",
    "return_3",
    # Calendar/time index.
    "day_of_week",
    "month",
    "trend_index",
    # Advanced relative position features.
    "close_to_rolling_mean_3",
    "close_to_rolling_mean_7",
    "close_to_rolling_mean_14",
    # Advanced momentum features.
    "momentum_3",
    "momentum_7",
    "momentum_14",
    # Trend strength features.
    "trend_strength_3_7",
    "trend_strength_3_14",
    "trend_strength_7_14",
    # Volatility ratio features.
    "volatility_ratio_3",
    "volatility_ratio_7",
    "volatility_ratio_14",
    # OHLC structure features.
    "daily_range",
    "close_position",
    "open_close_change",
]


def parse_args() -> argparse.Namespace:
    """Khai báo tham số dòng lệnh để script chạy độc lập và linh hoạt."""
    parser = argparse.ArgumentParser(
        description="Train XGBoost return v2 and evaluate predictions as next-close price."
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
    return normalized.rename(
        columns={
            "date": "price_date",
            "price": "close",
        }
    )


def clean_numeric_columns(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    """Chuyển các cột giá từ chuỗi sang số."""
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
    """Đọc dữ liệu, kiểm tra cột bắt buộc và sort theo thời gian."""
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

    # Sort theo thời gian là điều kiện bắt buộc trước khi tạo lag/rolling/target.
    return df.sort_values("price_date").drop_duplicates("price_date").reset_index(drop=True)


def safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    """Chia an toàn, tránh inf khi mẫu số bằng 0."""
    safe_denominator = denominator.replace(0, np.nan)
    return numerator / safe_denominator


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tạo feature v2 và target_return.

    Feature v2 tập trung vào 4 nhóm:
    - Relative position: giá hiện tại đang cao/thấp hơn rolling mean.
    - Momentum: tốc độ thay đổi trong 3/7/14 ngày.
    - Trend strength: chênh lệch giữa rolling mean ngắn và dài hạn.
    - Volatility/OHLC structure: độ biến động và vị trí close trong biên high-low.

    Tất cả feature chỉ dùng dữ liệu của ngày hiện tại hoặc quá khứ. `next_close`
    và `target_return` được tạo sau cùng để làm label.
    """
    featured = df.copy()

    for lag in (1, 2, 3, 5, 7, 14):
        featured[f"lag_{lag}"] = featured["close"].shift(lag)

    for window in (3, 7, 14):
        rolling_close = featured["close"].rolling(window=window, min_periods=window)
        featured[f"rolling_mean_{window}"] = rolling_close.mean()
        featured[f"rolling_std_{window}"] = rolling_close.std()

    # Feature gốc: diff và return ngắn hạn.
    featured["diff_1"] = featured["close"] - featured["lag_1"]
    featured["diff_3"] = featured["close"] - featured["lag_3"]
    featured["return_1"] = safe_divide(featured["diff_1"], featured["lag_1"])
    featured["return_3"] = safe_divide(featured["diff_3"], featured["lag_3"])

    featured["day_of_week"] = featured["price_date"].dt.dayofweek
    featured["month"] = featured["price_date"].dt.month
    featured["trend_index"] = np.arange(len(featured), dtype=float)

    # 1. Relative position features.
    featured["close_to_rolling_mean_3"] = safe_divide(featured["close"], featured["rolling_mean_3"])
    featured["close_to_rolling_mean_7"] = safe_divide(featured["close"], featured["rolling_mean_7"])
    featured["close_to_rolling_mean_14"] = safe_divide(featured["close"], featured["rolling_mean_14"])

    # 2. Momentum features.
    featured["momentum_3"] = safe_divide(featured["close"] - featured["lag_3"], featured["lag_3"])
    featured["momentum_7"] = safe_divide(featured["close"] - featured["lag_7"], featured["lag_7"])
    featured["momentum_14"] = safe_divide(featured["close"] - featured["lag_14"], featured["lag_14"])

    # 3. Trend strength features.
    featured["trend_strength_3_7"] = featured["rolling_mean_3"] - featured["rolling_mean_7"]
    featured["trend_strength_3_14"] = featured["rolling_mean_3"] - featured["rolling_mean_14"]
    featured["trend_strength_7_14"] = featured["rolling_mean_7"] - featured["rolling_mean_14"]

    # 4. Volatility ratio features.
    featured["volatility_ratio_3"] = safe_divide(featured["rolling_std_3"], featured["rolling_mean_3"])
    featured["volatility_ratio_7"] = safe_divide(featured["rolling_std_7"], featured["rolling_mean_7"])
    featured["volatility_ratio_14"] = safe_divide(featured["rolling_std_14"], featured["rolling_mean_14"])

    # 5. OHLC structure features.
    featured["daily_range"] = featured["high"] - featured["low"]
    featured["close_position"] = safe_divide(featured["close"] - featured["low"], featured["daily_range"])
    featured["open_close_change"] = safe_divide(featured["close"] - featured["open"], featured["open"])

    # Label cho bài toán return. Không đưa 2 cột này vào FEATURE_COLUMNS.
    featured[NEXT_CLOSE_COLUMN] = featured["close"].shift(-1)
    featured[TARGET_COLUMN] = safe_divide(
        featured[NEXT_CLOSE_COLUMN] - featured["close"],
        featured["close"],
    )

    # Loại bỏ inf/NaN do lag, rolling, shift hoặc chia cho 0.
    featured = featured.replace([np.inf, -np.inf], np.nan)
    return featured.dropna(subset=FEATURE_COLUMNS + [NEXT_CLOSE_COLUMN, TARGET_COLUMN]).reset_index(drop=True)


def split_time_series(
    df: pd.DataFrame, train_ratio: float = 0.75, validation_ratio: float = 0.15
) -> dict[str, pd.DataFrame]:
    """Chia dữ liệu theo thời gian 75/15/10, không shuffle."""
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
    """Tạo XGBoost v2 ít conservative hơn để giảm hiện tượng dự báo quá phẳng."""
    return XGBRegressor(
        n_estimators=500,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="reg:squarederror",
        eval_metric="rmse",
        random_state=RANDOM_STATE,
        n_jobs=1,
        early_stopping_rounds=50,
    )


def train_xgboost(splits: dict[str, pd.DataFrame]) -> XGBRegressor:
    """Train model dự báo target_return, dùng validation set cho early stopping."""
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
        # Tương thích với một số phiên bản xgboost cũ hơn.
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
    """Tính MAPE theo phần trăm, bỏ qua trường hợp y_true bằng 0."""
    y_true_array = np.asarray(y_true, dtype=float)
    y_pred_array = np.asarray(y_pred, dtype=float)
    mask = y_true_array != 0
    if not mask.any():
        return np.nan
    return float(np.mean(np.abs((y_true_array[mask] - y_pred_array[mask]) / y_true_array[mask])) * 100)


def calculate_directional_accuracy(
    close: pd.Series,
    actual_next_close: pd.Series,
    predicted_next_close: np.ndarray,
) -> tuple[pd.Series, pd.Series, pd.Series, float]:
    """Tính dự báo đúng chiều tăng/giảm.

    actual_direction = actual_next_close > close
    predicted_direction = predicted_next_close > close
    directional_accuracy = mean(actual_direction == predicted_direction)
    """
    actual_direction = actual_next_close > close
    predicted_direction = pd.Series(predicted_next_close, index=close.index) > close
    direction_correct = actual_direction == predicted_direction
    return actual_direction, predicted_direction, direction_correct, float(direction_correct.mean())


def calculate_prediction_volatility(
    actual_return: pd.Series,
    predicted_return: np.ndarray,
) -> tuple[float, float, float]:
    """So sánh độ lệch chuẩn return dự báo với return thực tế.

    Nếu predicted_return_std quá nhỏ so với actual_return_std, prediction có thể
    đang quá phẳng dù MAPE vẫn thấp.
    """
    actual_return_std = float(actual_return.std(ddof=1))
    predicted_return_std = float(np.std(predicted_return, ddof=1))
    if actual_return_std == 0:
        ratio = np.nan
    else:
        ratio = predicted_return_std / actual_return_std
    return actual_return_std, predicted_return_std, float(ratio)


def evaluate_model(
    model: XGBRegressor, splits: dict[str, pd.DataFrame]
) -> tuple[pd.DataFrame, dict[str, pd.DataFrame]]:
    """Đánh giá model trên giá next_close và hành vi dự báo return."""
    metric_rows = []
    prediction_frames = {}

    for split_name, split_df in splits.items():
        actual_next_close = split_df[NEXT_CLOSE_COLUMN]
        actual_return = split_df[TARGET_COLUMN]
        predicted_return = model.predict(split_df[FEATURE_COLUMNS])
        predicted_next_close = split_df["close"].to_numpy() * (1 + predicted_return)

        actual_direction, predicted_direction, direction_correct, directional_accuracy = (
            calculate_directional_accuracy(
                close=split_df["close"],
                actual_next_close=actual_next_close,
                predicted_next_close=predicted_next_close,
            )
        )
        actual_return_std, predicted_return_std, volatility_ratio = calculate_prediction_volatility(
            actual_return=actual_return,
            predicted_return=predicted_return,
        )

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
                "directional_accuracy": round(directional_accuracy, 4),
                "actual_return_std": round(actual_return_std, 6),
                "predicted_return_std": round(predicted_return_std, 6),
                "volatility_ratio_pred_vs_actual": round(volatility_ratio, 6),
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
        predictions["actual_direction"] = actual_direction.to_numpy()
        predictions["predicted_direction"] = predicted_direction.to_numpy()
        predictions["direction_correct"] = direction_correct.to_numpy()
        predictions.insert(0, "split", split_name)
        prediction_frames[split_name] = predictions

    return pd.DataFrame(metric_rows), prediction_frames


def calculate_metric_gaps(metrics: pd.DataFrame) -> pd.DataFrame:
    """Tính gap giữa train-validation và validation-test cho các metric chính."""
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
    """Tóm tắt phân phối giá và return theo từng split."""
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
    """Lưu feature importance để phục vụ phần giải thích mô hình trong khóa luận."""
    importance = pd.DataFrame(
        {
            "feature": FEATURE_COLUMNS,
            "importance": model.feature_importances_,
        }
    ).sort_values("importance", ascending=False)
    importance.to_csv(output_dir / "feature_importance.csv", index=False)


def save_price_plots(prediction_frames: dict[str, pd.DataFrame], output_dir: Path) -> None:
    """Lưu plot actual_next_close vs predicted_next_close."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

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
        ax.set_title(f"XGBoost Return V2 {split_name.title()} Price")
        ax.set_xlabel("Date")
        ax.set_ylabel("Gold close price")
        ax.legend()
        ax.grid(alpha=0.25)
        fig.autofmt_xdate()
        fig.tight_layout()
        fig.savefig(output_dir / f"{split_name}_actual_vs_predicted.png", dpi=150)
        plt.close(fig)


def save_return_plots(prediction_frames: dict[str, pd.DataFrame], output_dir: Path) -> None:
    """Lưu plot actual_return vs predicted_return để xem prediction có bị phẳng không."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    for split_name in ("validation", "test"):
        predictions = prediction_frames[split_name]
        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(
            predictions["price_date"],
            predictions["actual_return"],
            label="Actual return",
            linewidth=2,
        )
        ax.plot(
            predictions["price_date"],
            predictions["predicted_return"],
            label="Predicted return",
            linewidth=2,
        )
        ax.set_title(f"XGBoost Return V2 {split_name.title()} Return")
        ax.set_xlabel("Date")
        ax.set_ylabel("Next-day return")
        ax.legend()
        ax.grid(alpha=0.25)
        fig.autofmt_xdate()
        fig.tight_layout()
        fig.savefig(output_dir / f"{split_name}_return_actual_vs_predicted.png", dpi=150)
        plt.close(fig)


def save_plots(prediction_frames: dict[str, pd.DataFrame], output_dir: Path) -> None:
    """Lưu toàn bộ biểu đồ; nếu thiếu matplotlib thì bỏ qua phần plot."""
    try:
        save_price_plots(prediction_frames, output_dir)
        save_return_plots(prediction_frames, output_dir)
    except ImportError:
        print("matplotlib is not installed; skipping plots.")


def save_outputs(
    model: XGBRegressor,
    metrics: pd.DataFrame,
    metric_gaps: pd.DataFrame,
    split_summary: pd.DataFrame,
    prediction_frames: dict[str, pd.DataFrame],
    output_dir: Path,
    save_plot: bool,
) -> None:
    """Lưu toàn bộ artifact của thí nghiệm XGBoost return v2."""
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
    model.save_model(output_dir / "xgboost_return_v2_model.json")

    config = {
        "experiment": "xgboost_return_v2",
        "random_state": RANDOM_STATE,
        "target": TARGET_COLUMN,
        "price_target_for_metrics": NEXT_CLOSE_COLUMN,
        "features": FEATURE_COLUMNS,
        "split": {"train": 0.75, "validation": 0.15, "test": 0.10},
        "shuffle": False,
        "output_dir": str(output_dir),
        "model_params": model.get_params(),
        "notes": (
            "Model predicts target_return. Metrics are calculated after converting "
            "predicted_return to predicted_next_close."
        ),
    }
    (output_dir / "run_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    if save_plot:
        save_plots(prediction_frames, output_dir)


def print_terminal_summary(
    df: pd.DataFrame,
    featured: pd.DataFrame,
    output_dir: Path,
    metrics: pd.DataFrame,
    metric_gaps: pd.DataFrame,
) -> None:
    """In kết quả chính ra terminal sau khi chạy xong."""
    print("XGBoost return v2 experiment finished.")
    print(f"Input rows: {len(df)}")
    print(f"Rows after feature engineering: {len(featured)}")
    print(f"Output directory: {output_dir}")

    print("\nMetrics on next-close price:")
    print(metrics[["split", "rows", "start_date", "end_date", "MAE", "RMSE", "MAPE"]].to_string(index=False))

    print("\nMetric gaps:")
    print(metric_gaps.to_string(index=False))

    print("\nDirectional accuracy per split:")
    print(metrics[["split", "directional_accuracy"]].to_string(index=False))

    print("\nPredicted vs actual return volatility per split:")
    print(
        metrics[
            [
                "split",
                "actual_return_std",
                "predicted_return_std",
                "volatility_ratio_pred_vs_actual",
            ]
        ].to_string(index=False)
    )


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

    print_terminal_summary(
        df=df,
        featured=featured,
        output_dir=args.output_dir,
        metrics=metrics,
        metric_gaps=metric_gaps,
    )


if __name__ == "__main__":
    main()

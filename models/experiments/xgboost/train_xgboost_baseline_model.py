"""Huấn luyện baseline XGBoost để dự báo giá đóng cửa vàng ngày kế tiếp.

Cấu trúc script:
1. Đọc dữ liệu giá vàng từ CSV.
2. Chuẩn hóa tên cột và kiểu dữ liệu.
3. Sắp xếp theo thời gian để giữ đúng bản chất chuỗi thời gian.
4. Tạo feature từ dữ liệu quá khứ: lag, rolling mean/std, diff, return.
5. Tạo target next_close = close(t + 1).
6. Chia dữ liệu theo thời gian 75/15/10 thành train/validation/test.
7. Huấn luyện XGBoost với cấu hình bảo thủ để hạn chế overfitting.
8. Đánh giá bằng MAE, RMSE, MAPE và tính gap giữa các tập.
9. Lưu metrics, predictions, feature importance, model và config ra CSV/JSON.

Hướng thesis:
- Dự báo next_close = close(t + 1), tức giá đóng cửa ngày tiếp theo.
- Không shuffle vì đây là bài toán time-series; dữ liệu tương lai không được
  trộn vào quá khứ.
- Dùng time-based split để phản ánh tình huống thực tế: train trên giai đoạn
  cũ hơn, kiểm tra trên giai đoạn mới hơn.
- Metrics trên train/validation/test giúp phân tích overfitting và regime shift.
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
        "Missing Python package for this XGBoost experiment.\n"
        "Run this command in the project root:\n"
        "  .\\.venv\\Scripts\\python.exe -m pip install numpy pandas scikit-learn xgboost matplotlib\n"
        f"Original error: {exc}"
    ) from exc


# =========================
# 1. Cấu hình thí nghiệm
# =========================
#
# RANDOM_STATE giúp kết quả có thể tái lập.
# DEFAULT_INPUT_PATH là dữ liệu đã xử lý mặc định.
# DEFAULT_OUTPUT_DIR là nơi lưu toàn bộ kết quả của thí nghiệm XGBoost.
# REQUIRED_COLUMNS là các cột bắt buộc để có thể tạo bài toán dự báo giá vàng.
RANDOM_STATE = 42
DEFAULT_INPUT_PATH = Path("data/processed/gold_cleaned.csv")
DEFAULT_OUTPUT_DIR = Path("models/experiments/xgboost/outputs")
REQUIRED_COLUMNS = ("price_date", "open", "high", "low", "close")

# FEATURE_COLUMNS là danh sách biến đầu vào cho model.
# Các feature này chỉ dùng giá hiện tại/quá khứ, không dùng giá tương lai.
# Nhóm feature chính:
# - OHLC hiện tại: open, high, low, close.
# - Lag: giá close của các ngày trước đó.
# - Rolling mean/std: xu hướng và độ biến động ngắn hạn.
# - Diff/return: thay đổi tuyệt đối và tương đối của giá.
# - Calendar/trend: đặc trưng thời gian đơn giản để hỗ trợ phân tích.
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
]

# Target cần dự báo: close của ngày kế tiếp.
TARGET_COLUMN = "next_close"


def parse_args() -> argparse.Namespace:
    """Khai báo tham số CLI để script linh hoạt khi chạy thí nghiệm.

    Người dùng có thể đổi file input, đổi thư mục output, hoặc tắt plot.
    Việc dùng CLI giúp script không bị phụ thuộc vào đường dẫn tuyệt đối.
    """
    parser = argparse.ArgumentParser(
        description="Train XGBoost baseline for next-day gold close prediction."
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
        help=f"Directory for metrics and prediction CSVs. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--no-plot",
        action="store_true",
        help="Skip saving actual-vs-predicted plots.",
    )
    return parser.parse_args()


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Chuẩn hóa tên cột để script đọc được cả raw CSV và processed CSV.

    Ví dụ:
    - Date -> price_date
    - Price -> close

    Bước này giúp pipeline ổn định hơn khi nguồn dữ liệu có tên cột khác nhau.
    """
    normalized = df.copy()

    # Đưa tên cột về dạng đơn giản: chữ thường, bỏ khoảng trắng/ký tự khó xử lý.
    normalized.columns = (
        normalized.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace(".", "", regex=False)
        .str.replace("%", "pct", regex=False)
    )

    rename_map = {
        "date": "price_date",
        "price": "close",
    }
    normalized = normalized.rename(columns=rename_map)
    return normalized


def clean_numeric_columns(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    """Chuyển các cột giá từ chuỗi sang số.

    Một số file raw có thể lưu giá dạng "4,762.18" hoặc phần trăm có ký tự "%".
    Model chỉ làm việc với dữ liệu số, nên cần làm sạch trước khi train.
    """
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
    """Đọc và kiểm tra dữ liệu đầu vào.

    Đây là block nền tảng của toàn bộ pipeline:
    - đọc CSV
    - chuẩn hóa tên cột
    - kiểm tra đủ cột bắt buộc
    - ép kiểu date và numeric
    - bỏ dòng lỗi
    - sắp xếp theo ngày tăng dần

    Việc sắp xếp ngày trước feature engineering rất quan trọng để tránh tạo sai
    lag/target trong bài toán chuỗi thời gian.
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

    # Bỏ các dòng không có ngày hoặc giá OHLC hợp lệ.
    df = df.dropna(subset=list(REQUIRED_COLUMNS))

    # Bắt buộc giữ thứ tự thời gian:
    # - feature chỉ được nhìn thấy hiện tại/quá khứ
    # - target next_close phải là dòng ngay sau dòng hiện tại
    df = df.sort_values("price_date").drop_duplicates("price_date").reset_index(drop=True)
    return df


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tạo feature cho XGBoost từ lịch sử giá.

    Nguyên tắc chống leakage:
    - lag/rolling/diff/return đều dùng close hiện tại hoặc các ngày trước đó.
    - không dùng bất kỳ giá trị tương lai nào làm feature.
    - target next_close được tạo riêng bằng shift(-1).

    Ý nghĩa feature:
    - lag_n: giá đóng cửa n phiên trước, giúp model học quán tính giá.
    - rolling_mean_n: trung bình động, đại diện cho xu hướng ngắn hạn.
    - rolling_std_n: độ biến động gần đây.
    - diff/return: mức thay đổi giá tuyệt đối/tương đối.
    - day_of_week/month: yếu tố lịch đơn giản.
    - trend_index: vị trí thời gian, giúp mô hình có tín hiệu xu hướng tổng quát.
    """
    featured = df.copy()

    # Lag features: dùng giá close của các ngày trước để dự báo ngày kế tiếp.
    for lag in (1, 2, 3, 5, 7, 14):
        featured[f"lag_{lag}"] = featured["close"].shift(lag)

    # Rolling features: thống kê cửa sổ trượt của quá khứ gần.
    for window in (3, 7, 14):
        rolling_close = featured["close"].rolling(window=window, min_periods=window)
        featured[f"rolling_mean_{window}"] = rolling_close.mean()
        featured[f"rolling_std_{window}"] = rolling_close.std()

    # Momentum features: đo mức tăng/giảm giá gần đây.
    featured["diff_1"] = featured["close"] - featured["lag_1"]
    featured["diff_3"] = featured["close"] - featured["lag_3"]
    featured["return_1"] = featured["diff_1"] / featured["lag_1"]
    featured["return_3"] = featured["diff_3"] / featured["lag_3"]

    # Calendar/trend features: thêm thông tin thời gian đơn giản, dễ giải thích.
    featured["day_of_week"] = featured["price_date"].dt.dayofweek
    featured["month"] = featured["price_date"].dt.month
    featured["trend_index"] = np.arange(len(featured), dtype=float)

    # Target y: giá đóng cửa của ngày tiếp theo.
    # Đây là nhãn để train, không nằm trong FEATURE_COLUMNS nên không gây leakage.
    featured[TARGET_COLUMN] = featured["close"].shift(-1)

    # Lag/rolling tạo NaN ở đầu chuỗi; shift(-1) tạo NaN ở cuối chuỗi.
    # Các dòng này không đủ dữ liệu để train/evaluate nên cần loại bỏ.
    featured = featured.replace([np.inf, -np.inf], np.nan)
    return featured.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN]).reset_index(drop=True)


def split_time_series(
    df: pd.DataFrame, train_ratio: float = 0.75, validation_ratio: float = 0.15
) -> dict[str, pd.DataFrame]:
    """Chia dữ liệu theo thời gian thành train/validation/test.

    Tỷ lệ mặc định:
    - train: 75%
    - validation: 15%
    - test: 10%

    Không shuffle vì khi dự báo thực tế, model chỉ được học quá khứ và dự báo
    tương lai. Nếu shuffle, dữ liệu tương lai có thể lọt vào train, làm metrics
    đẹp giả và không phản ánh năng lực dự báo thật.
    """
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

    # iloc giữ nguyên thứ tự thời gian:
    # phần đầu là train, phần giữa là validation, phần cuối là test.
    return {
        "train": df.iloc[:train_end].copy(),
        "validation": df.iloc[train_end:validation_end].copy(),
        "test": df.iloc[validation_end:].copy(),
    }


def build_model() -> XGBRegressor:
    """Tạo model XGBoost với cấu hình baseline bảo thủ.

    Ý nghĩa một số tham số:
    - n_estimators=300: số cây tối đa.
    - max_depth=3: cây nông để hạn chế học quá chi tiết trên train.
    - learning_rate=0.03: học chậm hơn, thường ổn định hơn.
    - subsample/colsample_bytree=0.8: lấy mẫu một phần dòng/cột cho mỗi cây.
    - reg_alpha/reg_lambda: regularization để giảm overfitting.
    - random_state: tái lập kết quả.
    - early_stopping_rounds: dừng sớm nếu validation không cải thiện.
    """
    return XGBRegressor(
        n_estimators=300,
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
    """Huấn luyện XGBoost trên train và theo dõi validation.

    Validation set không dùng để fit trực tiếp, mà dùng cho early stopping.
    Điều này giúp chọn số cây phù hợp hơn và giảm rủi ro overfitting.
    """
    x_train = splits["train"][FEATURE_COLUMNS]
    y_train = splits["train"][TARGET_COLUMN]
    x_validation = splits["validation"][FEATURE_COLUMNS]
    y_validation = splits["validation"][TARGET_COLUMN]

    model = build_model()
    try:
        # Cách gọi phù hợp với các phiên bản xgboost mới.
        model.fit(
            x_train,
            y_train,
            eval_set=[(x_validation, y_validation)],
            verbose=False,
        )
    except TypeError:
        # Một số phiên bản xgboost cũ yêu cầu early_stopping_rounds nằm trong fit().
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
    """Tính MAPE theo phần trăm.

    MAPE cho biết sai số trung bình tương đối so với giá thật.
    Giá trị càng thấp càng tốt. Hàm bỏ qua trường hợp y_true = 0 để tránh chia
    cho 0, dù dữ liệu giá vàng thực tế gần như không gặp trường hợp này.
    """
    y_true_array = np.asarray(y_true, dtype=float)
    y_pred_array = np.asarray(y_pred, dtype=float)
    mask = y_true_array != 0
    if not mask.any():
        return np.nan
    return float(np.mean(np.abs((y_true_array[mask] - y_pred_array[mask]) / y_true_array[mask])) * 100)


def evaluate_model(
    model: XGBRegressor, splits: dict[str, pd.DataFrame]
) -> tuple[pd.DataFrame, dict[str, pd.DataFrame]]:
    """Đánh giá model trên train, validation và test.

    Metrics:
    - MAE: sai số tuyệt đối trung bình, cùng đơn vị với giá vàng.
    - RMSE: phạt mạnh sai số lớn, cùng đơn vị với giá vàng.
    - MAPE: sai số phần trăm trung bình, dễ so sánh giữa các giai đoạn giá.

    Ngoài metrics, hàm còn tạo bảng prediction chi tiết để phân tích từng ngày.
    """
    metric_rows = []
    prediction_frames = {}

    for split_name, split_df in splits.items():
        # Predict từng split để so sánh khả năng khớp train và tổng quát hóa.
        y_true = split_df[TARGET_COLUMN]
        y_pred = model.predict(split_df[FEATURE_COLUMNS])
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

        metric_rows.append(
            {
                "split": split_name,
                "rows": len(split_df),
                "start_date": split_df["price_date"].min().date().isoformat(),
                "end_date": split_df["price_date"].max().date().isoformat(),
                "actual_mean": round(float(y_true.mean()), 4),
                "actual_min": round(float(y_true.min()), 4),
                "actual_max": round(float(y_true.max()), 4),
                "MAE": round(float(mean_absolute_error(y_true, y_pred)), 4),
                "RMSE": round(rmse, 4),
                "MAPE": round(mean_absolute_percentage_error(y_true, y_pred), 4),
            }
        )

        # Bảng prediction dùng cho báo cáo: actual vs predicted và sai số từng dòng.
        predictions = split_df[["price_date", "open", "high", "low", "close", TARGET_COLUMN]].copy()
        predictions = predictions.rename(columns={TARGET_COLUMN: "actual_next_close"})
        predictions["predicted_next_close"] = y_pred
        predictions["error"] = predictions["actual_next_close"] - predictions["predicted_next_close"]
        predictions["absolute_error"] = predictions["error"].abs()
        predictions["absolute_percentage_error"] = (
            predictions["absolute_error"] / predictions["actual_next_close"].replace(0, np.nan) * 100
        )
        predictions.insert(0, "split", split_name)
        prediction_frames[split_name] = predictions

    metrics = pd.DataFrame(metric_rows)
    return metrics, prediction_frames


def calculate_metric_gaps(metrics: pd.DataFrame) -> pd.DataFrame:
    """Tính chênh lệch metrics giữa các tập.

    Ý nghĩa thesis:
    - train_to_validation_gap lớn: dấu hiệu overfitting hoặc distribution shift.
    - validation_to_test_gap lớn: test nằm trong regime giá khác validation,
      model khó tổng quát hóa sang giai đoạn mới hơn.
    """
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
    """Tóm tắt phân phối giá của từng split.

    Bảng này giúp chứng minh regime shift:
    nếu train có mức giá trung bình thấp hơn nhiều validation/test, XGBoost có
    thể gặp khó vì tree-based model thường kém ngoại suy ngoài vùng đã học.
    """
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
                "next_close_mean": round(float(split_df[TARGET_COLUMN].mean()), 4),
                "next_close_min": round(float(split_df[TARGET_COLUMN].min()), 4),
                "next_close_max": round(float(split_df[TARGET_COLUMN].max()), 4),
            }
        )
    return pd.DataFrame(rows)


def save_feature_importance(model: XGBRegressor, output_dir: Path) -> None:
    """Lưu độ quan trọng của feature để phục vụ phần giải thích mô hình."""
    importance = pd.DataFrame(
        {
            "feature": FEATURE_COLUMNS,
            "importance": model.feature_importances_,
        }
    ).sort_values("importance", ascending=False)
    importance.to_csv(output_dir / "feature_importance.csv", index=False)


def save_plots(prediction_frames: dict[str, pd.DataFrame], output_dir: Path) -> None:
    """Lưu biểu đồ actual vs predicted cho validation và test.

    Plot là output phụ, giúp nhìn trực quan việc model bám theo giá thật tốt hay
    bị lệch trong các giai đoạn giá mới.
    """
    try:
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
            label="Predicted next close",
            linewidth=2,
        )
        ax.set_title(f"XGBoost {split_name.title()} Actual vs Predicted")
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
    """Lưu toàn bộ kết quả thí nghiệm ra thư mục output.

    Các file chính:
    - metrics.csv: MAE/RMSE/MAPE cho train/validation/test.
    - metric_gaps.csv: gap giữa train-validation và validation-test.
    - split_summary.csv: thống kê phân phối giá từng split.
    - validation_predictions.csv/test_predictions.csv: actual vs predicted.
    - all_predictions.csv: gom toàn bộ prediction.
    - feature_importance.csv: mức đóng góp tương đối của từng feature.
    - xgboost_baseline_model.json: model đã train.
    - run_config.json: cấu hình để tái lập thí nghiệm.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Lưu các bảng phục vụ báo cáo và so sánh với Prophet/baseline khác.
    metrics.to_csv(output_dir / "metrics.csv", index=False)
    metric_gaps.to_csv(output_dir / "metric_gaps.csv", index=False)
    split_summary.to_csv(output_dir / "split_summary.csv", index=False)
    prediction_frames["validation"].to_csv(output_dir / "validation_predictions.csv", index=False)
    prediction_frames["test"].to_csv(output_dir / "test_predictions.csv", index=False)
    pd.concat(prediction_frames.values(), ignore_index=True).to_csv(
        output_dir / "all_predictions.csv", index=False
    )
    save_feature_importance(model, output_dir)

    # Lưu model để có thể load lại mà không cần train lại.
    model.save_model(output_dir / "xgboost_baseline_model.json")

    # Lưu config giúp thí nghiệm có tính reproducible.
    config = {
        "random_state": RANDOM_STATE,
        "target": TARGET_COLUMN,
        "features": FEATURE_COLUMNS,
        "split": {"train": 0.75, "validation": 0.15, "test": 0.10},
        "shuffle": False,
        "model_params": model.get_params(),
    }
    (output_dir / "run_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    if save_plot:
        save_plots(prediction_frames, output_dir)


def main() -> None:
    """Luồng chạy chính của script.

    Thứ tự pipeline:
    1. Đọc tham số CLI.
    2. Load và clean dữ liệu.
    3. Tạo feature và target.
    4. Chia dữ liệu theo thời gian.
    5. Train model.
    6. Evaluate model.
    7. Lưu output.
    8. In kết quả tóm tắt ra terminal.
    """
    args = parse_args()

    # Data preparation.
    df = load_data(args.input)
    featured = create_features(df)
    splits = split_time_series(featured)

    # Training and evaluation.
    model = train_xgboost(splits)
    metrics, prediction_frames = evaluate_model(model, splits)
    metric_gaps = calculate_metric_gaps(metrics)
    split_summary = build_split_summary(splits)

    # Persist experiment artifacts.
    save_outputs(
        model=model,
        metrics=metrics,
        metric_gaps=metric_gaps,
        split_summary=split_summary,
        prediction_frames=prediction_frames,
        output_dir=args.output_dir,
        save_plot=not args.no_plot,
    )

    # In nhanh kết quả để người chạy script xem ngay mà không cần mở CSV.
    print("XGBoost baseline finished.")
    print(f"Input rows: {len(df)}")
    print(f"Rows after feature engineering: {len(featured)}")
    print(f"Output directory: {args.output_dir}")
    print("\nMetrics:")
    print(metrics[["split", "rows", "start_date", "end_date", "MAE", "RMSE", "MAPE"]].to_string(index=False))
    print("\nMetric gaps:")
    print(metric_gaps.to_string(index=False))


if __name__ == "__main__":
    # Chỉ chạy main khi file được gọi trực tiếp:
    # python models/experiments/xgboost/train_xgboost_baseline.py
    main()

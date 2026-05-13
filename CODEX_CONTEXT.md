# CODEX CONTEXT - Gold Price Forecast Thesis Project

## Project overview

This is a graduation thesis project for a gold price forecasting system.

The system includes:

- Backend: NestJS
- Frontend: NextJS
- Database: PostgreSQL
- Forecasting models: Prophet and XGBoost
- Features:
  - Gold price dashboard
  - Historical price chart
  - Latest forecast
  - Current gold price from vang.today API
  - AI chatbot
  - Discord notification scheduler

## Current focus

The current task is to rebuild the XGBoost forecasting experiment.

The previous XGBoost attempt suffered from heavy overfitting and poor validation/test performance because the gold price distribution shifted significantly:

- training set had lower price levels
- validation/test sets had much higher price levels
- this caused time-series regime shift / distribution shift

The new goal is to build a cleaner and more explainable XGBoost pipeline.

## Modeling objective

Main target:

- Predict next-day gold closing price
- Target column: next_close = close(t + 1)

Do not shuffle data.
This is a time-series forecasting problem.

## Dataset assumptions

Input data should contain at least:

- price_date
- open
- high
- low
- close

The data must be sorted by price_date ascending before feature engineering.

## Train / validation / test strategy

Use time-based split only.

Initial experiment:

- train: 60%
- validation: 20%
- test: 20%

Reason:
The gold price has strong recent regime changes. A 60/20/20 split gives validation and test sets more room to represent the newer price regime.

Later experiments may compare:

- 70/15/15
- 60/20/20
- rolling window / walk-forward evaluation

## Feature engineering

Create features from historical prices only.

Recommended initial features:

- lag_1
- lag_2
- lag_3
- lag_5
- lag_7
- lag_14
- rolling_mean_3
- rolling_mean_7
- rolling_mean_14
- rolling_std_3
- rolling_std_7
- rolling_std_14
- diff_1 = close - lag_1
- diff_3 = close - lag_3
- return_1 = (close - lag_1) / lag_1
- return_3 = (close - lag_3) / lag_3

Optional later features:

- day_of_week
- month
- expanding mean
- trend index

Avoid data leakage:

- Do not use future prices in features.
- The target next_close must be created after sorting by date.

## Model

Use XGBoost Regressor.

Initial conservative config:

- n_estimators: 300
- max_depth: 3
- learning_rate: 0.03
- subsample: 0.8
- colsample_bytree: 0.8
- reg_alpha: 0.5
- reg_lambda: 2.0
- objective: reg:squarederror
- random_state: 42

Use early stopping on validation set if supported.

## Evaluation metrics

Evaluate on train, validation, and test:

- MAE
- RMSE
- MAPE

Also calculate:

- train vs validation gap
- validation vs test gap

The purpose is to diagnose:

- overfitting
- distribution shift
- generalization ability

## Outputs expected from scripts

The XGBoost script should output:

- metrics table for train/validation/test
- predictions for validation and test
- CSV file containing actual vs predicted
- optional plot of actual vs predicted
- optional feature importance

Recommended output folder:
models/experiments/xgboost/outputs/

## Reporting notes

When writing code comments or markdown notes, explain:

- why time-based split is used
- why shuffle is not allowed
- why distribution shift matters
- why lag and rolling features are used
- why lower MAE/RMSE/MAPE is better
- why XGBoost may struggle with unseen price regimes

## Coding style

Write clean, readable Python.
Prefer functions:

- load_data()
- create_features()
- split_time_series()
- evaluate_model()
- train_xgboost()
- save_outputs()

Do not hardcode absolute local paths.
Use relative paths or CLI arguments when possible.

## Important thesis direction

The goal is not only to maximize accuracy.
The goal is to build an explainable experiment that supports thesis discussion.

Prioritize:

- reproducibility
- clear metrics
- clear comparison with Prophet
- clear explanation of overfitting and regime shift

export interface LatestPrice {
  id: number;
  price_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceHistoryItem {
  price_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ForecastRun {
  id: number;
  run_id: string;
  model_name: string;
  model_version: string | null;
  forecast_date: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface ForecastResultItem {
  id: number;
  forecast_run_id: number;
  target_date: string;
  forecast_horizon: number;
  predicted_close: number;
  lower_bound: number | null;
  upper_bound: number | null;
  created_at: string;
}

export interface ModelEvaluationItem {
  id: number;
  forecast_run_id: number;
  dataset_split: string;
  mae: number;
  rmse: number;
  mape: number;
  created_at: string;
}

export interface LatestForecastResponse {
  run: ForecastRun | null;
  results: ForecastResultItem[];
  evaluations: ModelEvaluationItem[];
}

export interface ChatAskResponse {
  question: string;
  answer: string;
  is_in_scope: boolean;
}

export interface CurrentGoldPrice {
  type_code: string;
  name: string;
  buy: number;
  sell: number;
  change_buy: number;
  change_sell: number;
  update_time: number;
  display_time: string;
  display_date: string;
  unit: string;
  source: string;
}

export interface WorldGoldHistoryItem {
  date: string;
  price: number;
  change: number;
  update_time: string;
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ForecastService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getLatestForecast() {
    const latestRuns = await this.databaseService.query(
      `
      SELECT
        id,
        run_id,
        model_name,
        model_version,
        forecast_date,
        status,
        note,
        created_at
      FROM forecast_runs
      ORDER BY forecast_date DESC, id DESC
      LIMIT 1
      `,
    );

    const latestRun = latestRuns[0] ?? null;

    if (!latestRun) {
      return null;
    }

    const results = await this.databaseService.query(
      `
      SELECT
        id,
        forecast_run_id,
        target_date,
        forecast_horizon,
        predicted_close,
        lower_bound,
        upper_bound,
        created_at
      FROM forecast_results
      WHERE forecast_run_id = $1
      ORDER BY target_date ASC
      `,
      [latestRun.id],
    );

    const evaluations = await this.databaseService.query(
      `
      SELECT
        id,
        forecast_run_id,
        dataset_split,
        mae,
        rmse,
        mape,
        created_at
      FROM model_evaluations
      WHERE forecast_run_id = $1
      ORDER BY id ASC
      `,
      [latestRun.id],
    );

    return {
      run: latestRun,
      results,
      evaluations,
    };
  }
}
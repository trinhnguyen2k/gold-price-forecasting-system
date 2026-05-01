import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { formatDateDdMmYyyy, formatPriceUsd } from 'src/common/utils/format.utils';

@Injectable()
export class ChatbotService {
  constructor(private readonly databaseService: DatabaseService) {}

  private isQuestionInScope(question: string): boolean {
    const normalized = question.toLowerCase();

    const keywords = [
      'giá vàng',
      'gold',
      'forecast',
      'dự báo',
      'mae',
      'rmse',
      'mape',
      'biểu đồ',
      'history',
      'lịch sử giá',
      'xau',
      'xau/usd',
    ];

    return keywords.some((keyword) => normalized.includes(keyword));
  }

  private async buildAnswer(question: string): Promise<string> {
    const normalized = question.toLowerCase();

    if (
      normalized.includes('giá vàng mới nhất') ||
      normalized.includes('giá mới nhất') ||
      normalized.includes('latest price')
    ) {
      const rows = await this.databaseService.query(
        `
        SELECT price_date, close
        FROM gold_prices
        ORDER BY price_date DESC
        LIMIT 1
        `,
      );

      const latest = rows[0];

      if (!latest) {
        return 'Hiện tại hệ thống chưa có dữ liệu giá vàng mới nhất.';
      }

      const formattedPrice = formatPriceUsd(latest.close);
      const formattedDate = formatDateDdMmYyyy(latest.price_date);


      return `Giá vàng đóng cửa mới nhất là ${formattedPrice} tại ngày ${formattedDate}.`;
    }

    if (
      normalized.includes('dự báo mới nhất') ||
      normalized.includes('forecast mới nhất') ||
      normalized.includes('latest forecast')
    ) {
      const runs = await this.databaseService.query(
        `
        SELECT id, model_name, forecast_date
        FROM forecast_runs
        ORDER BY forecast_date DESC, id DESC
        LIMIT 1
        `,
      );

      const latestRun = runs[0];

      if (!latestRun) {
        return 'Hiện tại hệ thống chưa có dữ liệu dự báo mới nhất.';
      }

      const results = await this.databaseService.query(
        `
        SELECT target_date, predicted_close
        FROM forecast_results
        WHERE forecast_run_id = $1
        ORDER BY target_date ASC
        LIMIT 1
        `,
        [latestRun.id],
      );

      const firstForecast = results[0];

      if (!firstForecast) {
        return 'Hiện tại hệ thống chưa có kết quả forecast chi tiết.';
      }

      const formattedForecastDate = formatDateDdMmYyyy(latestRun.forecast_date);
      const formattedTargetDate = formatDateDdMmYyyy(firstForecast.target_date);
      const formattedPredictedClose = formatPriceUsd(firstForecast.predicted_close);

      return `Kết quả dự báo mới nhất được tạo bởi mô hình ${latestRun.model_name} vào ngày ${formattedForecastDate}. Giá dự báo gần nhất cho ngày ${formattedTargetDate} là ${formattedPredictedClose}.`;
    }

    if (
      normalized.includes('metric') ||
      normalized.includes('chỉ số') ||
      normalized.includes('đánh giá') ||
      normalized.includes('mae') ||
      normalized.includes('rmse') ||
      normalized.includes('mape')
    ) {
      const runs = await this.databaseService.query(
        `
        SELECT id, model_name, forecast_date
        FROM forecast_runs
        ORDER BY forecast_date DESC, id DESC
        LIMIT 1
        `,
      );

      const latestRun = runs[0];

      if (!latestRun) {
        return 'Hiện tại hệ thống chưa có dữ liệu đánh giá mô hình.';
      }

      const evaluations = await this.databaseService.query(
        `
        SELECT dataset_split, mae, rmse, mape
        FROM model_evaluations
        WHERE forecast_run_id = $1
        ORDER BY id ASC
        `,
        [latestRun.id],
      );

      if (!evaluations.length) {
        return 'Hiện tại hệ thống chưa có metrics đánh giá mô hình.';
      }

      const text = evaluations
        .map(
          (item) =>
            `${item.dataset_split}: MAE = ${item.mae}, RMSE = ${item.rmse}, MAPE = ${item.mape}`,
        )
        .join(' | ');

      return `Các chỉ số đánh giá hiện có của mô hình ${latestRun.model_name} là: ${text}.`;
    }

    return 'Câu hỏi nằm trong phạm vi hệ thống, tuy nhiên bản MVP hiện chỉ hỗ trợ tra cứu giá vàng mới nhất, forecast mới nhất và các metrics cơ bản.';
  }

  async ask(question: string) {
    const isInScope = this.isQuestionInScope(question);

    let answer: string;

    if (isInScope) {
      answer = await this.buildAnswer(question);
    } else {
      answer =
        'Xin lỗi, câu hỏi này hiện nằm ngoài phạm vi hỗ trợ của hệ thống. Bạn có thể hỏi về giá vàng, dữ liệu lịch sử, forecast hoặc các chỉ số đánh giá mô hình.';
    }

    await this.databaseService.query(
      `
      INSERT INTO chatbot_logs (session_id, user_question, bot_answer, is_in_scope)
      VALUES ($1, $2, $3, $4)
      `,
      ['mvp-session', question, answer, isInScope],
    );

    return {
      question,
      answer,
      is_in_scope: isInScope,
    };
  }
}
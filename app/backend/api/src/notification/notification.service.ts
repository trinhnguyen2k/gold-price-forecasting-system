import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { formatDateDdMmYyyy, formatPriceUsd } from 'src/common/utils/format.utils';

@Injectable()
export class NotificationService {
    constructor(private readonly databaseService: DatabaseService) { }

    async sendTestNotification() {
        const settingsRows = await this.databaseService.query(
            `
      SELECT
        id,
        channel_type,
        discord_webhook,
        frequency,
        notify_type,
        is_enabled,
        last_sent_at,
        created_at,
        updated_at
      FROM notification_settings
      WHERE is_enabled = true
      ORDER BY id ASC
      LIMIT 1
      `,
        );

        const setting = settingsRows[0] ?? null;

        if (!setting) {
            return {
                message: 'Chưa có cấu hình notification đang bật trong hệ thống.',
            };
        }

        const latestPriceRows = await this.databaseService.query(
            `
      SELECT
        price_date,
        close
      FROM gold_prices
      ORDER BY price_date DESC
      LIMIT 1
      `,
        );

        const latestPrice = latestPriceRows[0] ?? null;

        const latestRunRows = await this.databaseService.query(
            `
      SELECT
        id,
        model_name,
        forecast_date
      FROM forecast_runs
      ORDER BY forecast_date DESC, id DESC
      LIMIT 1
      `,
        );

        const latestRun = latestRunRows[0] ?? null;

        let latestForecast: {
            target_date: string | Date;
            predicted_close: number;
        } | null = null;

        if (latestRun) {
            const latestForecastRows = await this.databaseService.query(
                `
        SELECT
          target_date,
          predicted_close
        FROM forecast_results
        WHERE forecast_run_id = $1
        ORDER BY target_date ASC
        LIMIT 1
        `,
                [latestRun.id],
            );

            latestForecast = latestForecastRows[0] ?? null;
        }

        const latestPriceText = latestPrice
            ? `Giá vàng mới nhất là ${formatPriceUsd(latestPrice.close)} tại ngày ${formatDateDdMmYyyy(latestPrice.price_date)}.`
            : 'Hiện chưa có dữ liệu giá vàng mới nhất.';

        const latestForecastText =
            latestRun && latestForecast
                ? `Dự báo gần nhất từ mô hình ${latestRun.model_name} cho ngày ${formatDateDdMmYyyy(latestForecast.target_date)} là ${formatPriceUsd(latestForecast.predicted_close)}.`
                : 'Hiện chưa có dữ liệu forecast mới nhất.';

        const content = `${latestPriceText} ${latestForecastText}`;

        await this.databaseService.query(
            `
      UPDATE notification_settings
      SET last_sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
            [setting.id],
        );

        return {
            message: 'Thông báo đã được tạo thành công (MVP, chưa gửi webhook thật).',
            notification: {
                channel_type: setting.channel_type,
                notify_type: setting.notify_type,
                content,
            },
        };
    }
}
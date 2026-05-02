import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { PricesService } from '../prices/prices.service';
import { ForecastService } from '../forecast/forecast.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly pricesService: PricesService,
    private readonly forecastService: ForecastService,
  ) {}

  private formatPriceUsd(value: number | string): string {
    const numericValue = Number(value);
    return `${numericValue.toFixed(2)} USD`;
  }

  private formatDateDdMmYyyy(value: string | Date): string {
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private async getCurrentGoldFromVangToday(type: string) {
    const url = `https://www.vang.today/api/prices?type=${encodeURIComponent(type)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Không thể lấy dữ liệu hiện tại từ vang.today cho ${type}`,
      );
    }

    const rawData = await response.json();

    if (!rawData?.success) {
      throw new InternalServerErrorException(
        rawData?.message || `Dữ liệu vang.today cho ${type} không hợp lệ`,
      );
    }

    return {
      type: rawData.type,
      name: rawData.name,
      buy: Number(rawData.buy ?? 0),
      sell: Number(rawData.sell ?? 0),
      changeBuy: Number(rawData.change_buy ?? 0),
      changeSell: Number(rawData.change_sell ?? 0),
      date: rawData.date,
      time: rawData.time,
    };
  }

  private buildDiscordMessage(params: {
    latestClose: number;
    latestPriceDate: string | Date;
    forecastPrice: number;
    forecastTargetDate: string | Date;
    difference: number;
    currentWorldGold: {
      name: string;
      buy: number;
      sell: number;
      date: string;
      time: string;
    };
    currentSjcGold: {
      name: string;
      buy: number;
      sell: number;
      date: string;
      time: string;
    };
  }): string {
    const {
      latestClose,
      latestPriceDate,
      forecastPrice,
      forecastTargetDate,
      difference,
      currentWorldGold,
      currentSjcGold,
    } = params;

    const reportDate = this.formatDateDdMmYyyy(latestPriceDate);

    const differenceText =
      difference > 0
        ? `+${difference.toFixed(2)} USD`
        : `${difference.toFixed(2)} USD`;

    const formatCurrentPrice = (value: number, unit: string) => {
      if (!value || value <= 0) {
        return 'Chưa có dữ liệu';
      }

      return `${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${unit}`;
    };

    const formatCurrentPriceVnd = (value: number) => {
      if (!value || value <= 0) {
        return 'Chưa có dữ liệu';
      }

      return `${value.toLocaleString('vi-VN')} VND/lượng`;
    };

    return [
      `📢 **Báo cáo giá vàng ngày ${reportDate}**`,
      '',
      `- Giá đóng cửa gần nhất: **${this.formatPriceUsd(latestClose)}**`,
      `- Ngày dữ liệu gần nhất: **${this.formatDateDdMmYyyy(latestPriceDate)}**`,
      `- Ngày mục tiêu: **${this.formatDateDdMmYyyy(forecastTargetDate)}**`,
      `- Dự báo ngày kế tiếp: **${this.formatPriceUsd(forecastPrice)}**`,
      `- Chênh lệch dự báo so với giá đóng cửa: **${differenceText}**`,
      '',
      `🌍 **${currentWorldGold.name}**`,
      `- Giá mua hiện tại: **${formatCurrentPrice(currentWorldGold.buy, 'USD/oz')}**`,
      `- Thời gian cập nhật: **${currentWorldGold.time} ${currentWorldGold.date}**`,
      '',
      `🇻🇳 **${currentSjcGold.name}**`,
      `- Giá mua hiện tại: **${formatCurrentPriceVnd(currentSjcGold.buy)}**`,
      `- Giá bán hiện tại: **${formatCurrentPriceVnd(currentSjcGold.sell)}**`,
      `- Thời gian cập nhật: **${currentSjcGold.time} ${currentSjcGold.date}**`,
    ].join('\n');
  }

  async sendDailyDiscordNotification(): Promise<void> {
    const webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.warn(
        'DISCORD_WEBHOOK_URL is missing. Skip sending Discord notification.',
      );
      return;
    }

    const latestPrice = await this.pricesService.getLatestPrice();
    const latestForecast = await this.forecastService.getLatestForecast();

    const firstForecast = latestForecast?.results?.[0];

    if (!latestPrice || !firstForecast) {
      throw new InternalServerErrorException(
        'Không đủ dữ liệu để gửi thông báo Discord.',
      );
    }

    const currentWorldGold = await this.getCurrentGoldFromVangToday('XAUUSD');
    const currentSjcGold = await this.getCurrentGoldFromVangToday('SJL1L10');

    const latestClose = Number(latestPrice.close);
    const forecastPrice = Number(firstForecast.predicted_close);
    const difference = forecastPrice - latestClose;

    const content = this.buildDiscordMessage({
      latestClose,
      latestPriceDate: latestPrice.price_date,
      forecastPrice,
      forecastTargetDate: firstForecast.target_date,
      difference,
      currentWorldGold,
      currentSjcGold,
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Discord webhook failed: ${response.status} - ${errorText}`,
      );
      throw new InternalServerErrorException(
        `Gửi Discord webhook thất bại: ${response.status}`,
      );
    }

    this.logger.log('Discord notification sent successfully.');
  }

  @Cron('0 0 8 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailyDiscordNotification() {
    this.logger.log('Running daily Discord notification job...');
    await this.sendDailyDiscordNotification();
  }
}

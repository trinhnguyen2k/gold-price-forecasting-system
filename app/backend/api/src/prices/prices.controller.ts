import { Controller, Get, Query } from '@nestjs/common';
import { PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('latest')
  async getLatestPrice() {
    return await this.pricesService.getLatestPrice();
  }

  @Get('history')
  async getPriceHistory() {
    return await this.pricesService.getPriceHistory();
  }

  @Get('current')
  async getCurrentGoldPrice(@Query('type') type?: string) {
    return this.pricesService.getCurrentGoldPrice(type ?? 'XAUUSD');
  }

  @Get('world-history')
  async getWorldGoldHistory(@Query('days') days?: string) {
    const parsedDays = Number(days ?? 10);
    return this.pricesService.getWorldGoldHistory(parsedDays);
  }
}

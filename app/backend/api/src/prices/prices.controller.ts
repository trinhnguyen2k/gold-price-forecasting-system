import { Controller, Get } from '@nestjs/common';
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
}

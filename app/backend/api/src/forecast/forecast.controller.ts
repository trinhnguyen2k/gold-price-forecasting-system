import { Controller, Get } from '@nestjs/common';
import { ForecastService } from './forecast.service';

@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get('latest')
  async getLatestForecast() {
    return await this.forecastService.getLatestForecast();
  }
}

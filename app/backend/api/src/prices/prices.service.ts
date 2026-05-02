import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PricesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getLatestPrice() {
    const rows = await this.databaseService.query(`
      SELECT
        id,
        price_date,
        open,
        high,
        low,
        close,
        source,
        created_at,
        updated_at
      FROM gold_prices
      ORDER BY price_date DESC
      LIMIT 1
      `);
    return rows[0] ?? null;
  }

  async getPriceHistory() {
    const rows = await this.databaseService.query(`
      SELECT
        price_date,
        open,
        high,
        low,
        close
      FROM gold_prices
      ORDER BY price_date ASC
      `);
    return rows;
  }

  async getCurrentGoldPrice(type = 'XAUUSD') {
    const url = `https://www.vang.today/api/prices?type=${encodeURIComponent(type)}`;
    console.log('Current gold API URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch current gold price: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('Current gold rawData:', JSON.stringify(rawData, null, 2));

    if (!rawData?.success) {
      throw new Error(
        rawData?.message || 'Current gold price API returned failed status',
      );
    }

    const isWorldGold = rawData.type === 'XAUUSD';

    return {
      type_code: rawData.type,
      name: rawData.name,
      buy: rawData.buy,
      sell: rawData.sell,
      change_buy: rawData.change_buy ?? 0,
      change_sell: rawData.change_sell ?? 0,
      update_time: rawData.timestamp,
      display_time: rawData.time,
      display_date: rawData.date,
      unit: isWorldGold ? 'USD/oz' : 'VND/lượng',
      source: 'vang.today',
    };
  }
}

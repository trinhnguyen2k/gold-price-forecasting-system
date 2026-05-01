import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PricesService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getLatestPrice() {
        const rows = await this.databaseService.query( `
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
      `,);
        return rows[0] ?? null;
    }

        async getPriceHistory() {
        const rows = await this.databaseService.query( `
      SELECT
        price_date,
        open,
        high,
        low,
        close
      FROM gold_prices
      ORDER BY price_date ASC
      `,);
        return rows;
    }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PricesModule } from './prices/prices.module';
import { ForecastModule } from './forecast/forecast.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { NotificationModule } from './notification/notification.module';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule/dist/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Không cần import ConfigModule ở các module khác
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    PricesModule,
    ForecastModule,
    ChatbotModule,
    NotificationModule,
  ],
})
export class AppModule {}

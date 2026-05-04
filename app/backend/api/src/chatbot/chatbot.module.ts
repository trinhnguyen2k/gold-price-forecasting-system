import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { PricesModule } from '../prices/prices.module';
import { ForecastModule } from '../forecast/forecast.module';
import { AiChatService } from './aiChat.service';

@Module({
  imports: [PricesModule, ForecastModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, AiChatService],
})
export class ChatbotModule {}

import { Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send-test')
  async sendTestDiscordNotification() {
    await this.notificationService.sendDailyDiscordNotification();

    return {
      success: true,
      message: 'Đã gửi test notification lên Discord.',
    };
  }
}

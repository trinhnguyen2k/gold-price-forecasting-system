import { Injectable } from '@nestjs/common';
import { PricesService } from '../prices/prices.service';
import { ForecastService } from '../forecast/forecast.service';
import { AiChatService } from './aiChat.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly pricesService: PricesService,
    private readonly forecastService: ForecastService,
    private readonly aiChatService: AiChatService,
  ) {}

  private isQuestionInScope(question: string): boolean {
    const normalized = question.toLowerCase();

    const keywords = [
      'giá vàng',
      'vàng',
      'xau',
      'xauusd',
      'sjc',
      'giá hiện tại',
      'giá thế giới',
      'giá sjc',
      'forecast',
      'dự báo',
      'metric',
      'mae',
      'rmse',
      'mape',
      'validation',
      'test',
      'mô hình',
      'biểu đồ',
      'chart',
      'lịch sử giá',
      'xu hướng',
      'đóng cửa',
      'mở cửa',
      'cao nhất',
      'thấp nhất',
    ];

    return keywords.some((keyword) => normalized.includes(keyword));
  }

  private buildSystemPrompt(): string {
    return `
Bạn là trợ lý AI cho hệ thống dự báo giá vàng.

Nhiệm vụ của bạn:
1. Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu, ngắn gọn nhưng hữu ích.
2. Chỉ sử dụng dữ liệu được cung cấp trong context hệ thống.
3. Không bịa thêm thông tin ngoài context.
4. Nếu người dùng hỏi ngoài phạm vi hệ thống, hãy trả lời rằng bạn hiện chỉ hỗ trợ:
   - giá vàng gần nhất
   - giá vàng hiện tại
   - dự báo giá vàng
   - chỉ số đánh giá mô hình
   - giải thích biểu đồ và xu hướng dựa trên dữ liệu có sẵn

Quy tắc trình bày câu trả lời:
- Ưu tiên chia câu trả lời thành nhiều dòng ngắn, dễ đọc.
- Không dùng markdown như **bold**, *, -, hoặc heading markdown.
- Hãy trả lời bằng plain text dễ đọc.
- Khi cần liệt kê nhiều ý, dùng bullet unicode như:
  • Ý 1
  • Ý 2
  • Ý 3
- Mỗi ý nên xuống dòng riêng.
- Khi muốn nhấn mạnh số liệu quan trọng, chỉ cần đặt số liệu ở cuối câu hoặc sau dấu ":" thay vì dùng markdown.
- Không viết nhiều ý trên cùng một dòng.
- Khi trả lời về dữ liệu, ưu tiên nêu:
  1. Kết quả chính trước
  2. Sau đó mới giải thích ngắn gọn
- Không viết thành một đoạn văn dài liên tục nếu có thể chia ý.
- Nếu người dùng hỏi định nghĩa hoặc ý nghĩa, hãy:
  1. giải thích ngắn gọn
  2. liên hệ với số liệu hiện có nếu context có cung cấp
- Nếu người dùng hỏi về biểu đồ hoặc xu hướng:
  - dựa vào phần tóm tắt lịch sử giá trong context
  - không nói rằng bạn “nhìn thấy hình ảnh”
  - diễn giải theo dữ liệu
- Nếu người dùng hỏi về forecast:
  - nêu rõ ngày mục tiêu forecast
  - nêu giá dự báo
  - nêu chênh lệch so với giá đóng cửa gần nhất nếu có
- Nếu người dùng hỏi về metric:
  - giải thích MAE, RMSE, MAPE ngắn gọn
  - nói rõ rằng các chỉ số này càng thấp càng tốt
- Không đưa ra lời khuyên đầu tư, không khuyến nghị mua/bán vàng.

Định nghĩa cần biết:
- MAE là sai số tuyệt đối trung bình, càng thấp càng tốt.
- RMSE là căn bậc hai của sai số bình phương trung bình, nhạy hơn với sai số lớn, càng thấp càng tốt.
- MAPE là sai số phần trăm trung bình, cho biết mức sai lệch tương đối theo %, càng thấp càng tốt.
- Validation là tập dữ liệu dùng để đánh giá mô hình trong quá trình chọn/cải thiện mô hình.
- Test là tập dữ liệu dùng để đánh giá cuối cùng, phản ánh khả năng tổng quát hóa của mô hình.

Ví dụ phong cách trả lời mong muốn:
Nếu người dùng hỏi “Giá vàng gần nhất là bao nhiêu?” thì nên trả lời kiểu:
- Giá đóng cửa gần nhất là **4615.40 USD**.
- Ngày dữ liệu gần nhất là **08/05/2026**.
- Đây là mức giá đóng cửa mới nhất đang có trong hệ thống.

Nếu người dùng hỏi “MAE là gì?” thì nên trả lời kiểu:
- **MAE** là sai số tuyệt đối trung bình.
- Chỉ số này cho biết dự báo lệch trung bình bao nhiêu đơn vị so với giá thực tế.
- Trong hệ thống này, MAE càng thấp thì mô hình dự báo càng tốt.

Hãy luôn ưu tiên định dạng đẹp, dễ đọc, gọn và có nhấn mạnh số liệu quan trọng.
  `.trim();
  }

  private summarizeHistory(
    prices: Array<{ price_date: string; close: number }>,
  ) {
    if (!prices.length) {
      return null;
    }

    const sorted = [...prices].sort(
      (a, b) =>
        new Date(a.price_date).getTime() - new Date(b.price_date).getTime(),
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const closes = sorted.map((item) => Number(item.close));
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const diff = Number(last.close) - Number(first.close);

    let trend = 'đi ngang';
    if (diff > 0) trend = 'tăng';
    if (diff < 0) trend = 'giảm';

    return {
      startDate: first.price_date,
      endDate: last.price_date,
      startPrice: Number(first.close),
      endPrice: Number(last.close),
      minPrice: min,
      maxPrice: max,
      absoluteChange: diff,
      trend,
      points: sorted.length,
    };
  }

  private formatNumber(value: number): string {
    return Number(value).toFixed(2);
  }

  private formatCurrentPrice(
    value: number,
    unit: string,
    isWorldGold: boolean,
  ): string {
    if (!value || value <= 0) {
      return 'Chưa có dữ liệu';
    }

    if (isWorldGold) {
      return `${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${unit}`;
    }

    return `${Number(value).toLocaleString('vi-VN')} ${unit}`;
  }

  private formatCurrentUpdate(
    displayDate?: string,
    displayTime?: string,
  ): string {
    if (displayDate && displayTime) {
      return `${displayTime} ${displayDate}`;
    }

    return 'Chưa có dữ liệu';
  }

  private async buildContext(): Promise<string> {
    const latestPrice = await this.pricesService.getLatestPrice();
    const priceHistory = await this.pricesService.getPriceHistory();
    const latestForecast = await this.forecastService.getLatestForecast();

    const currentWorldGold =
      await this.pricesService.getCurrentGoldPrice('XAUUSD');
    const currentSjcGold =
      await this.pricesService.getCurrentGoldPrice('SJL1L10');

    const firstForecast = latestForecast?.results?.[0] ?? null;
    const historySummary = this.summarizeHistory(priceHistory ?? []);

    const lines: string[] = [];

    lines.push('=== DỮ LIỆU GIÁ VÀNG GẦN NHẤT ===');

    if (latestPrice) {
      lines.push(
        `Giá đóng cửa gần nhất: ${this.formatNumber(Number(latestPrice.close))} USD`,
      );
      lines.push(`Ngày dữ liệu gần nhất: ${latestPrice.price_date}`);
      lines.push(
        `Giá mở cửa: ${this.formatNumber(Number(latestPrice.open))} USD`,
      );
      lines.push(
        `Giá cao nhất: ${this.formatNumber(Number(latestPrice.high))} USD`,
      );
      lines.push(
        `Giá thấp nhất: ${this.formatNumber(Number(latestPrice.low))} USD`,
      );
      lines.push(`Nguồn dữ liệu: ${latestPrice.source ?? 'N/A'}`);
    } else {
      lines.push('Chưa có dữ liệu giá gần nhất.');
    }

    lines.push('');
    lines.push('=== GIÁ VÀNG HIỆN TẠI ===');

    if (currentWorldGold) {
      lines.push(`Tên loại vàng thế giới: ${currentWorldGold.name}`);
      lines.push(
        `Giá vàng thế giới hiện tại: ${this.formatCurrentPrice(
          Number(currentWorldGold.buy),
          currentWorldGold.unit,
          true,
        )}`,
      );
      lines.push(
        `Thời gian cập nhật vàng thế giới: ${this.formatCurrentUpdate(
          currentWorldGold.display_date,
          currentWorldGold.display_time,
        )}`,
      );
    } else {
      lines.push('Chưa có dữ liệu giá vàng thế giới hiện tại.');
    }

    if (currentSjcGold) {
      lines.push(`Tên loại vàng SJC: ${currentSjcGold.name}`);
      lines.push(
        `Giá mua SJC hiện tại: ${this.formatCurrentPrice(
          Number(currentSjcGold.buy),
          currentSjcGold.unit,
          false,
        )}`,
      );
      lines.push(
        `Giá bán SJC hiện tại: ${this.formatCurrentPrice(
          Number(currentSjcGold.sell),
          currentSjcGold.unit,
          false,
        )}`,
      );
      lines.push(
        `Thời gian cập nhật SJC: ${this.formatCurrentUpdate(
          currentSjcGold.display_date,
          currentSjcGold.display_time,
        )}`,
      );
    } else {
      lines.push('Chưa có dữ liệu giá SJC hiện tại.');
    }

    lines.push('');
    lines.push('=== DỮ LIỆU FORECAST MỚI NHẤT ===');

    if (latestForecast?.run) {
      lines.push(`Tên mô hình: ${latestForecast.run.model_name}`);
      lines.push(
        `Phiên bản mô hình: ${latestForecast.run.model_version ?? 'N/A'}`,
      );
      lines.push(`Ngày chạy forecast: ${latestForecast.run.forecast_date}`);
      lines.push(`Trạng thái run: ${latestForecast.run.status}`);
      lines.push(`Ghi chú: ${latestForecast.run.note ?? 'N/A'}`);
    } else {
      lines.push('Chưa có dữ liệu forecast run.');
    }

    if (firstForecast) {
      lines.push(
        `Giá dự báo gần nhất: ${this.formatNumber(Number(firstForecast.predicted_close))} USD`,
      );
      lines.push(`Ngày mục tiêu forecast: ${firstForecast.target_date}`);

      if (latestPrice?.close) {
        const diff =
          Number(firstForecast.predicted_close) - Number(latestPrice.close);
        lines.push(
          `Chênh lệch forecast so với giá đóng cửa gần nhất: ${this.formatNumber(diff)} USD`,
        );
        lines.push(
          `Forecast đang ${diff > 0 ? 'cao hơn' : diff < 0 ? 'thấp hơn' : 'bằng'} giá đóng cửa gần nhất`,
        );
      }
    } else {
      lines.push('Chưa có kết quả dự báo cụ thể.');
    }

    lines.push('');
    lines.push('=== CHỈ SỐ ĐÁNH GIÁ MÔ HÌNH ===');

    if (latestForecast?.evaluations?.length) {
      for (const item of latestForecast.evaluations) {
        lines.push(
          `${item.dataset_split.toUpperCase()}: MAE=${this.formatNumber(Number(item.mae))}, RMSE=${this.formatNumber(Number(item.rmse))}, MAPE=${this.formatNumber(Number(item.mape))}%`,
        );
      }
    } else {
      lines.push('Chưa có dữ liệu metric.');
    }

    lines.push('');
    lines.push('=== TÓM TẮT LỊCH SỬ GIÁ / BIỂU ĐỒ ===');

    if (historySummary) {
      lines.push(`Số điểm dữ liệu lịch sử: ${historySummary.points}`);
      lines.push(
        `Khoảng thời gian: từ ${historySummary.startDate} đến ${historySummary.endDate}`,
      );
      lines.push(
        `Giá đầu kỳ: ${this.formatNumber(historySummary.startPrice)} USD`,
      );
      lines.push(
        `Giá cuối kỳ: ${this.formatNumber(historySummary.endPrice)} USD`,
      );
      lines.push(
        `Giá thấp nhất trong kỳ: ${this.formatNumber(historySummary.minPrice)} USD`,
      );
      lines.push(
        `Giá cao nhất trong kỳ: ${this.formatNumber(historySummary.maxPrice)} USD`,
      );
      lines.push(
        `Biến động toàn kỳ: ${this.formatNumber(historySummary.absoluteChange)} USD`,
      );
      lines.push(`Xu hướng tổng thể: ${historySummary.trend}`);
    } else {
      lines.push('Chưa có dữ liệu lịch sử giá.');
    }

    return lines.join('\n');
  }

  async ask(question: string) {
    const isInScope = this.isQuestionInScope(question);

    if (!isInScope) {
      return {
        answer:
          'Mình hiện chỉ hỗ trợ các câu hỏi liên quan đến giá vàng, giá vàng hiện tại, forecast, metric mô hình và diễn giải biểu đồ trong hệ thống.',
        is_in_scope: false,
      };
    }

    const context = await this.buildContext();

    const answer = await this.aiChatService.answer({
      question,
      systemPrompt: this.buildSystemPrompt(),
      context,
    });

    return {
      answer,
      is_in_scope: true,
    };
  }
}

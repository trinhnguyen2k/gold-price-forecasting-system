import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiChatService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.model =
      this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
  }

  async answer(params: {
    question: string;
    systemPrompt: string;
    context: string;
  }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: params.systemPrompt,
        },
        {
          role: 'user',
          content: `Dữ liệu hệ thống:\n${params.context}\n\nCâu hỏi người dùng:\n${params.question}`,
        },
      ],
      temperature: 0.2,
    });

    const text =
      response.choices?.[0]?.message?.content?.trim() ||
      'Xin lỗi, mình chưa tạo được câu trả lời phù hợp.';

    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

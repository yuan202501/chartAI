import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AppService {
  async getHello(id: string, messages?: any, trigger?: string) {
    // eslint-disable-next-line no-console
    // 使用 OpenAI SDK 创建客户端，直接使用标准的 chat/completions API
    console.log('OPENAI_API_KEY', process.env.OPENAI_API_KEY)
    console.log('BASE_URL', process.env.BASE_URL)
    const openai = new OpenAI({
      // apiKey: "sk-2a27aa15692741129b089a1578407020",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.BASE_URL,
    });

    // 转换消息格式为标准格式
    const aiMessages = messages?.map((msg: any) => {
      if (Array.isArray(msg.parts)) {
        const textPart = msg.parts.find((part: any) => part.type === 'text');
        return {
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: textPart?.text || ''
        };
      }
      return {
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.content || ''
      };
    }) || [];

    // 直接使用 OpenAI SDK 的流式调用
    const stream = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: aiMessages as any,
      stream: true,
    });
    return stream;
  }
}

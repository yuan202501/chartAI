import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('chat')
  @HttpCode(200)
  async getHello(@Body() body: any, @Res() res: Response) {
    // eslint-disable-next-line no-console
    console.log('Received body:', JSON.stringify(body, null, 2));
    const id = body?.id ?? '';
    const messages = body?.messages ?? [];
    const trigger = body?.trigger ?? '';
    
    // eslint-disable-next-line no-console
    console.log('Calling service with messages:', messages.length);
    
    try {
      const stream = await this.appService.getHello(id, messages, trigger);
      
      // eslint-disable-next-line no-console
      console.log('Stream received, starting to process...');
      
      // 设置响应头（AI SDK 数据流协议使用 text/plain）
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      // AI SDK UI Message Stream 协议需要这个响应头
      res.setHeader('x-vercel-ai-ui-message-stream', 'v1');
    
    // 将 OpenAI 流转换为 AI SDK 数据流格式（使用 0: 前缀）
    let messageId = `msg_${Date.now()}`;
    let fullText = '';
    
      try {
        // 发送开始标记
        // eslint-disable-next-line no-console
        console.log('Sending start marker');
        res.write(`0:{"type":"start"}\n`);
        
        // 发送消息开始标记
        const initialMessage = { 
          type: 'message', 
          message: {
            id: messageId,
            role: 'assistant',
            parts: []
          }
        };
        // eslint-disable-next-line no-console
        console.log('Sending initial message:', JSON.stringify(initialMessage));
        res.write(`0:${JSON.stringify(initialMessage)}\n`);
        
        // 生成文本块的 ID
        const textPartId = `text-${messageId}`;
        
        // 发送 text-start
        res.write(`0:${JSON.stringify({ type: 'text-start', id: textPartId })}\n`);
        
        let chunkCount = 0;
        for await (const chunk of stream) {
          chunkCount++;
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            
            // AI SDK 数据流格式：需要包含 id 和 delta 字段
            const data = JSON.stringify({ 
              type: 'text-delta', 
              id: textPartId,
              delta: delta 
            });
            res.write(`0:${data}\n`);
            // eslint-disable-next-line no-console
            console.log(`Sent delta chunk ${chunkCount}: ${delta.substring(0, 20)}...`);
          }
        }
        
        // 发送 text-end
        res.write(`0:${JSON.stringify({ type: 'text-end', id: textPartId })}\n`);
        
        // eslint-disable-next-line no-console
        console.log(`Total chunks received: ${chunkCount}, Full text length: ${fullText.length}`);
        
        // 发送完整消息（更新消息内容）
        const finalMessage = { 
          type: 'message', 
          message: {
            id: messageId,
            role: 'assistant',
            parts: [{ type: 'text', text: fullText }]
          }
        };
        // eslint-disable-next-line no-console
        console.log('Sending final message:', JSON.stringify(finalMessage));
        res.write(`0:${JSON.stringify(finalMessage)}\n`);
        
        // 发送完成标记
        res.write(`d:{"type":"finish"}\n`);
        // eslint-disable-next-line no-console
        console.log('Stream completed successfully');
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Stream processing error:', error);
        const errorData = JSON.stringify({ type: 'error', error: String(error) });
        res.write(`e:${errorData}\n`);
      } finally {
        res.end();
      }
    } catch (serviceError) {
      // eslint-disable-next-line no-console
      console.error('Service error:', serviceError);
      res.status(500).json({ error: String(serviceError) });
    }
  }
}

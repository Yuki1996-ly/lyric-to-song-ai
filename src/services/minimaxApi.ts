// MiniMax API服务 - 用于歌词生成音乐

interface AudioSetting {
  sample_rate: number; // 采样率：16000, 24000, 32000, 44100
  bitrate: number; // 比特率：32000, 64000, 128000, 256000
  format: string; // 音频编码格式：mp3, wav, pcm
}

interface MiniMaxRequest {
  model: string; // 模型名称，使用 'music-1.5'
  prompt: string; // 音乐描述，长度限制10-300字符
  lyrics: string; // 歌词内容，长度限制10-3000字符
  stream?: boolean; // 是否使用流式传输，默认false
  output_format?: string; // 音频返回格式：'url' 或 'hex'，默认hex
  audio_setting: AudioSetting; // 音频输出配置
  aigc_watermark?: boolean; // 是否添加水印，默认false
}

interface MiniMaxResponse {
  data?: {
    status?: number; // 音乐合成状态：1-合成中，2-已完成
    audio?: string; // hex格式的音频数据
  };
  base_resp?: {
    status_code: number; // 状态码：0-成功，其他-错误
    status_msg?: string; // 错误详情
  };
}

export class MiniMaxAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_MINIMAX_API_KEY;
    this.baseUrl = import.meta.env.VITE_MINIMAX_BASE_URL;
    
    if (!this.apiKey) {
      throw new Error('MiniMax API key is not configured');
    }
  }

  /**
   * 根据歌词和风格生成音乐
   * @param lyrics 歌词内容
   * @param style 音乐风格
   * @param tempo 节奏
   * @returns 音频文件的Blob对象
   */
  async generateMusic(lyrics: string, style: string, tempo: string): Promise<Blob> {
    // 参数验证
    this.validateInputs(lyrics, style, tempo);
    
    // 根据风格和节奏生成prompt
    const prompt = this.generatePrompt(style, tempo);

    const request: MiniMaxRequest = {
      model: 'music-1.5',
      prompt: prompt,
      lyrics: lyrics,
      stream: false,
      output_format: 'hex',
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3'
      },
      aigc_watermark: false
    };

    try {
      console.log('🎵 MiniMax API 请求开始');
      console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 20)}...` : 'Not configured');
      console.log('Base URL:', this.baseUrl);
      console.log('Request payload:', JSON.stringify(request, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时（音乐生成需要更长时间）

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('MiniMax API 响应状态:', response.status, response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MiniMax API 错误响应:', errorText);
        throw new Error(`MiniMax API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: MiniMaxResponse = await response.json();
      console.log('MiniMax API 响应数据:', JSON.stringify(data, null, 2));
      
      // 根据官方文档检查响应状态
      if (data.base_resp) {
        const { status_code, status_msg } = data.base_resp;
        
        if (status_code !== 0) {
          console.error('MiniMax API 错误:', { status_code, status_msg });
          const errorMessage = this.getErrorMessage(status_code, status_msg);
          throw new Error(errorMessage);
        }
      }

      // 检查音频数据
      if (!data.data || !data.data.audio) {
        console.error('MiniMax API 返回数据不完整，未找到音频数据:', data);
        throw new Error('音乐生成完成但未收到音频数据');
      }

      // 检查音乐合成状态
      if (data.data.status === 1) {
        console.log('音乐正在合成中...');
        throw new Error('音乐正在合成中，请稍后重试');
      }

      const audioHex = data.data.audio;
      console.log('✓ 成功获取音频数据，hex长度:', audioHex.length);
      
      console.log('🎶 开始转换音频数据');
      const audioBlob = this.hexToBlob(audioHex, 'audio/mpeg');
      console.log('✅ 音乐生成成功，文件大小:', audioBlob.size, 'bytes');
      return audioBlob;
    } catch (error) {
      console.error('❌ MiniMax API 调用失败:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('音乐生成超时，请检查网络连接后重试');
        }
        throw new Error(`音乐生成失败: ${error.message}`);
      }
      throw new Error('音乐生成失败，请重试');
    }
  }

  /**
   * 根据风格和节奏生成专业的音乐描述prompt
   * 参考MiniMax API文档示例格式："独立民谣,忧郁,内省,渴望,独自漫步,咖啡馆"
   */
  private generatePrompt(style: string, tempo: string): string {
    // 音乐风格的详细描述映射
    const stylePrompts: Record<string, string> = {
      'pop': '流行音乐,现代感,朗朗上口,商业化,主流,时尚,青春活力,都市生活',
      'rap': 'Hip-Hop,说唱,节奏感强,urban风格,街头文化,律动感,韵律密集,态度鲜明',
      'rock': '摇滚乐,电吉他,激情澎湃,力量感,反叛精神,高能量,驱动感,震撼',
      'electronic': '电子音乐,合成器,科技感,未来感,数字化,律动,舞曲,现代制作',
      'jazz': '爵士乐,即兴演奏,优雅,复杂和声,摇摆感,蓝调,经典,艺术性',
      'ballad': '抒情歌,温柔,深情,感人,内省,治愈,温暖,情感丰富'
    };

    // 节奏速度的情感和氛围描述
    const tempoPrompts: Record<string, string> = {
      'slow': '慢节奏,舒缓,放松,冥想,深沉,宁静,治愈,温柔',
      'medium': '中等节奏,稳定,平衡,舒适,自然流畅,适中,和谐',
      'fast': '快节奏,活力四射,动感,兴奋,充满能量,积极向上,激昂',
      'very-fast': '极快节奏,高能量,激烈,紧张感,爆发力,狂热,刺激'
    };

    // 通用的高质量音乐制作描述
    const qualityPrompts = [
      '高质量制作',
      '专业录音',
      '清晰人声',
      '丰富层次',
      '动态平衡',
      '情感表达'
    ];

    const styleDesc = stylePrompts[style] || stylePrompts.pop;
    const tempoDesc = tempoPrompts[tempo] || tempoPrompts.medium;
    const qualityDesc = qualityPrompts.join(',');

    // 按照MiniMax API推荐的格式组合prompt
    return `${styleDesc},${tempoDesc},${qualityDesc}`;
  }

  /**
   * 将hex字符串转换为Blob对象（参考minimax.ts的实现）
   */
  private hexToBlob(hexString: string, mimeType: string): Blob {
    try {
      // 移除空白字符并确保长度为偶数
      const cleanHex = hexString.replace(/\s/g, '');
      
      // 验证hex字符串
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Invalid hex string: odd length');
      }
      
      if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        throw new Error('Invalid hex string: contains non-hex characters');
      }
      
      const bytes = new Uint8Array(cleanHex.length / 2);
      
      for (let i = 0; i < cleanHex.length; i += 2) {
        const hexByte = cleanHex.substr(i, 2);
        const byte = parseInt(hexByte, 16);
        
        if (isNaN(byte)) {
          throw new Error(`Invalid hex byte at position ${i}: ${hexByte}`);
        }
        
        bytes[i / 2] = byte;
      }
      
      console.log(`Successfully converted hex string (${cleanHex.length} chars) to ${bytes.length} bytes`);
      return new Blob([bytes], { type: mimeType });
    } catch (error) {
      console.error('Error in hexToBlob:', error);
      throw error;
    }
  }

  /**
   * 创建音频URL用于播放
   */
  createAudioUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }

  /**
   * 释放音频URL资源
   */
  revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * 验证输入参数
   */
  private validateInputs(lyrics: string, style: string, tempo: string): void {
    if (!lyrics || lyrics.trim().length === 0) {
      throw new Error('歌词内容不能为空');
    }
    
    if (lyrics.length < 10 || lyrics.length > 3000) {
      throw new Error('歌词长度必须在10-3000字符之间');
    }
    
    if (!style || !tempo) {
      throw new Error('请选择音乐风格和节奏');
    }
    
    const prompt = this.generatePrompt(style, tempo);
    if (prompt.length < 10 || prompt.length > 300) {
      throw new Error('音乐描述长度必须在10-300字符之间');
    }
  }

  /**
   * 根据错误码获取中文错误信息
   */
  private getErrorMessage(statusCode: number, statusMsg?: string): string {
    const errorMessages: Record<number, string> = {
      0: '请求成功',
      1002: '请求过于频繁，请稍后再试',
      1004: '账号鉴权失败，请检查API密钥是否正确',
      1008: '账号余额不足，请充值后重试',
      1026: '内容涉及敏感信息，请修改后重试',
      2013: '传入参数异常，请检查参数格式',
      2049: 'API密钥无效，请检查密钥配置'
    };
    
    const message = errorMessages[statusCode] || `未知错误 (${statusCode})`;
    return statusMsg ? `${message}: ${statusMsg}` : message;
  }
}

// 导出单例实例
export const minimaxApi = new MiniMaxAPI();
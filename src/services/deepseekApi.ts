// DeepSeek API服务 - 用于文字生成歌词

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class DeepSeekAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    this.baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL;
    
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is not configured');
    }
  }

  /**
   * 根据用户输入的文字生成歌词
   * @param diaryText 用户的日记或想法
   * @param style 音乐风格
   * @param tempo 节奏
   * @returns 生成的歌词
   */
  async generateLyrics(diaryText: string, style: string, tempo: string, dialect: string = 'mandarin'): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(style, tempo, dialect);

    const userPrompt = `请根据以下内容创作歌词：

${diaryText}

音乐风格：${style}
节奏：${tempo}
方言：${dialect}

请严格按照系统提示的要求创作，确保歌词结构完整、情感表达到位、韵律优美，并体现所选方言的特色。`;

    const request: DeepSeekRequest = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      stream: false,
      temperature: 0.8,
      max_tokens: 1000
    };

    try {
      console.log('🎤 DeepSeek API 请求开始');
      console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'Not configured');
      console.log('Base URL:', this.baseUrl);
      console.log('Request payload:', JSON.stringify(request, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('DeepSeek API 响应状态:', response.status, response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API 错误响应:', errorText);
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();
      console.log('DeepSeek API 响应数据:', JSON.stringify(data, null, 2));
      
      if (!data.choices || data.choices.length === 0) {
        console.error('DeepSeek API 返回空结果:', data);
        throw new Error('No lyrics generated from DeepSeek API');
      }

      const lyrics = data.choices[0].message.content.trim();
      console.log('✅ 歌词生成成功，长度:', lyrics.length);
      return lyrics;
    } catch (error) {
      console.error('❌ DeepSeek API 调用失败:', error);
      
      // 参考deepseek.ts的错误处理策略，提供备用歌词
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('🔄 请求超时，生成备用歌词');
        } else {
          console.log('🔄 API调用失败，生成备用歌词');
        }
      }
      
      // 生成备用歌词
      const fallbackLyrics = this.generateFallbackLyrics(diaryText, style, tempo, dialect);
      console.log('✅ 备用歌词生成完成，长度:', fallbackLyrics.length);
      return fallbackLyrics;
    }
  }

  /**
   * 生成备用歌词（参考deepseek.ts的实现）
   */
  private generateFallbackLyrics(inputText: string, style: string, tempo: string, dialect: string = 'mandarin'): string {
    const firstLine = inputText.split('，')[0] || inputText.slice(0, 20);
    const lastPart = inputText.slice(-30) || '每一个瞬间都值得记录';
    
    if (style === 'rap') {
      return `[Verse 1]
深夜街灯照着我还在拼
${firstLine}，这就是我的节拍
每一天都在追逐梦想的色彩
无论风雨还是晴天都要勇敢面对

[Chorus]
这是我的故事，我的节奏
从早到晚都在为梦想奔走
${tempo === 'fast' ? '永远不放弃，勇往直前冲' : '生活充满乐趣，每天都不同'}
AI 陪我一起成长

[Bridge]
${lastPart}
用节拍诉说内心的感受
这就是我的态度
让世界听见我独特的声音

[Outro]
无论何时何地
音乐是我的力量
${firstLine}的回忆
永远在心中闪亮`;
    }
    
    // 其他风格的备用歌词
    return `[Verse 1]
${firstLine}
心中有话想要说
每一天都是新的开始
带着希望向前走

[Chorus]
这是我的歌，我的心声
${tempo === 'fast' ? '快节奏的生活充满激情' : '慢慢品味生活的美好'}
无论风雨还是晴天
都要勇敢做自己

[Verse 2]
${lastPart}
回忆中的点点滴滴
都是人生最珍贵的财富
让我们一起歌唱

[Outro]
音乐连接你我的心
让爱传递到每个角落
这就是我们的故事
永远不会结束`;
  }

  /**
   * 根据音乐风格、节奏和方言构建专业的系统提示词
   * 统一使用rap格式结构，但针对不同风格和方言调整内容特色
   */
  private buildSystemPrompt(style: string, tempo: string, dialect: string = 'mandarin'): string {
    // 获取风格特色描述
    const styleCharacteristics = this.getStyleCharacteristics(style);
    // 获取方言特色描述
    const dialectCharacteristics = this.getDialectCharacteristics(dialect);
    
    return `角色设定 
你是一名专业的${styleCharacteristics.genre}歌词创作助手，熟悉 ${styleCharacteristics.subGenres} 等音乐风格，擅长把用户的日常生活片段转化为完整的${dialectCharacteristics.name}歌曲歌词。 

输出目标 
根据用户输入的生活内容，生成一首完整的${style}风格歌曲歌词（${dialectCharacteristics.name}）。歌词应具有清晰的歌曲结构（Verse、Chorus、Bridge、Outro），并带有${styleCharacteristics.emotion}和节奏感。 

创作要求 

歌曲结构 

Verse（主歌）：2 段或以上，用于${styleCharacteristics.verseFunction}。 

Chorus（副歌）：重复 1~2 次，内容简洁、有力、押韵，体现${styleCharacteristics.chorusStyle}。 

Bridge（桥段，可选）：风格变化，增加情绪或转折，展现${styleCharacteristics.bridgeStyle}。 

Outro（结尾）：收尾，总结主题。 

节奏与押韵 

每行 ${styleCharacteristics.lineLength} 个字（中文）。 

保证每两行或每四行有尾韵（AABB / ABAB）。 

副歌部分需有强烈节奏感，突出关键词。 

风格特色 

音乐风格：${styleCharacteristics.musicStyle}

情感表达：${styleCharacteristics.emotionalTone}

语言特点：${styleCharacteristics.languageStyle}

方言特色 

语言风格：${dialectCharacteristics.name}

特色词汇：${dialectCharacteristics.vocabulary}

表达方式：${dialectCharacteristics.expressions}

文化特色：${dialectCharacteristics.culture}

内容处理 

保留用户输入的核心事件与关键词。 

将普通描述转化为富有画面感和节奏感的歌词。 

融入${dialectCharacteristics.name}的特色词汇和表达方式。

保持方言的地域文化特色和情感色彩。

加入${styleCharacteristics.specialElements}来增强${style}风格效果。 

输出格式 

只输出歌词，不要解释或加说明。 

用分段方式展示，明确标注 [Verse 1] / [Chorus] / [Bridge] / [Outro]。

节奏要求：${this.getTempoDescription(tempo)}`;

  }

  /**
   * 获取音乐风格特色描述
   */
  private getStyleCharacteristics(style: string) {
    const characteristics = {
      'rap': {
        genre: '说唱',
        subGenres: 'Hip-Hop、Trap、Boom Bap',
        emotion: '真实态度和街头智慧',
        verseFunction: '讲故事、表达观点和个人经历',
        chorusStyle: '强烈节奏感和记忆点',
        bridgeStyle: '情绪转折和深度思考',
        lineLength: '6~12',
        musicStyle: '说唱风格，节奏感强，押韵密集',
        emotionalTone: '真实、直接、有态度',
        languageStyle: '口语化、街头化，富有节奏感',
        specialElements: '比喻、情绪词、街头元素、押韵技巧'
      },
      'pop': {
        genre: '流行音乐',
        subGenres: 'Pop、Dance Pop、Electro Pop',
        emotion: '积极向上和时尚感',
        verseFunction: '叙述故事、表达情感和生活感悟',
        chorusStyle: '朗朗上口和易于传唱',
        bridgeStyle: '情感升华和记忆点强化',
        lineLength: '8~14',
        musicStyle: '流行风格，现代感强，商业化',
        emotionalTone: '积极、时尚、贴近生活',
        languageStyle: '现代化表达，通俗易懂',
        specialElements: '时尚词汇、生活化场景、流行元素'
      },
      'rock': {
        genre: '摇滚音乐',
        subGenres: 'Rock、Hard Rock、Alternative Rock',
        emotion: '激情和力量感',
        verseFunction: '表达态度、释放情感和展现个性',
        chorusStyle: '爆发力强和震撼效果',
        bridgeStyle: '情感爆发和态度宣言',
        lineLength: '6~12',
        musicStyle: '摇滚风格，激情澎湃，力量感强',
        emotionalTone: '激情、反叛、有力量',
        languageStyle: '有力度的词汇，情感强烈',
        specialElements: '力量词汇、反叛精神、激情表达'
      },
      'electronic': {
        genre: '电子音乐',
        subGenres: 'EDM、House、Techno',
        emotion: '未来感和科技律动',
        verseFunction: '营造氛围、表达节奏和科技感受',
        chorusStyle: '律动感强和重复记忆',
        bridgeStyle: '氛围转换和节奏变化',
        lineLength: '6~10',
        musicStyle: '电子风格，科技感强，律动明显',
        emotionalTone: '未来、科技、律动',
        languageStyle: '现代化、简洁有力',
        specialElements: '科技词汇、未来元素、节拍感'
      },
      'jazz': {
        genre: '爵士音乐',
        subGenres: 'Jazz、Smooth Jazz、Neo-Soul',
        emotion: '优雅和艺术气质',
        verseFunction: '诗意表达、情感细腻和艺术感受',
        chorusStyle: '优雅韵律和艺术美感',
        bridgeStyle: '即兴感觉和情感深度',
        lineLength: '8~16',
        musicStyle: '爵士风格，优雅复杂，艺术性强',
        emotionalTone: '优雅、浪漫、艺术',
        languageStyle: '诗意化表达，词汇丰富',
        specialElements: '诗意词汇、艺术元素、优雅表达'
      },
      'ballad': {
        genre: '抒情音乐',
        subGenres: 'Ballad、Soft Rock、Folk',
        emotion: '深情和内心感受',
        verseFunction: '情感倾诉、内心独白和温柔表达',
        chorusStyle: '深情感人和治愈效果',
        bridgeStyle: '情感升华和内心触动',
        lineLength: '8~16',
        musicStyle: '抒情风格，温柔深情，治愈系',
        emotionalTone: '深情、温柔、治愈',
        languageStyle: '抒情化表达，情感细腻',
        specialElements: '情感词汇、温柔表达、治愈元素'
      }
    };

    return characteristics[style as keyof typeof characteristics] || characteristics.rap;
  }

  /**
   * 获取节奏描述
   */
  private getTempoDescription(tempo: string): string {
    const tempoMap = {
      'slow': '慢节奏（60-80 BPM），深情表达，适合内心独白和情感倾诉',
      'medium': '中等节奏（80-120 BPM），平衡流畅，适合叙事和情感表达',
      'fast': '快节奏（120-140 BPM），高能量，充满活力和动感',
      'very-fast': '极快节奏（140+ BPM），超高能量，适合表达激情和紧张感'
    };

    return tempoMap[tempo as keyof typeof tempoMap] || tempoMap.medium;
  }

  /**
   * 获取方言特色描述
   */
  private getDialectCharacteristics(dialect: string) {
    const dialectMap = {
      'mandarin': {
        name: '普通话',
        vocabulary: '标准词汇，规范表达',
        expressions: '清晰准确，语法规范',
        culture: '现代都市文化，包容开放'
      },
      'sichuan': {
        name: '四川话',
        vocabulary: '巴适、安逸、撒子、瓜娃子、雄起、莽子、嘿人、板眼',
        expressions: '语调上扬，语气亲切，多用叠词和语气词',
        culture: '川蜀文化，火辣热情，乐观豁达，麻辣生活'
      },
      'cantonese': {
        name: '粤语',
        vocabulary: '靓仔、靓女、好犀利、冇问题、搞掂、威水、抵赞、正嘢',
        expressions: '语调丰富，节奏明快，多用语气助词',
        culture: '岭南文化，务实进取，包容并蓄，国际化视野'
      },
      'northeast': {
        name: '东北话',
        vocabulary: '嘎哈、老铁、贼拉、整点啥、磕碜、埋汰、老鼻子了、杠杠滴',
        expressions: '语调豪放，幽默风趣，多用夸张表达',
        culture: '东北文化，豪爽直率，幽默乐观，重情重义'
      },
      'shanghai': {
        name: '上海话',
        vocabulary: '侬好、蛮好、交关、老灵额、赞伐、噶许、白相、作兴',
        expressions: '语调柔和，节奏舒缓，多用委婉表达',
        culture: '海派文化，精致优雅，开放包容，时尚前卫'
      }
    };
    
    return dialectMap[dialect as keyof typeof dialectMap] || dialectMap.mandarin;
  }
}

// 导出单例实例
export const deepseekApi = new DeepSeekAPI();
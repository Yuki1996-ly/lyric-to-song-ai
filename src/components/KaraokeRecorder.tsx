import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Play, Pause, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AudioWaveform from './AudioWaveform';

interface KaraokeRecorderProps {
  originalAudioUrl: string;
  lyrics: string; // 改为字符串格式的歌词
  onScoreCalculated: (score: KaraokeScore) => void;
  isVisible: boolean;
}

interface KaraokeScore {
  totalScore: number;
  pitchAccuracy: number;
  rhythmStability: number;
  volumeControl: number;
  beatMatching: number;
  details: {
    recordedDuration: number;
    averagePitch: number;
    pitchVariance: number;
    rhythmConsistency: number;
  };
}

interface AudioAnalysisData {
  pitch: number;
  volume: number;
  timestamp: number;
}

const KaraokeRecorder = ({ originalAudioUrl, lyrics, onScoreCalculated, isVisible }: KaraokeRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [parsedLyrics, setParsedLyrics] = useState<Array<{time: number, text: string}>>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realTimeScore, setRealTimeScore] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  
  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const analysisDataRef = useRef<AudioAnalysisData[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 初始化音频权限
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      console.log('🎤 [DEBUG] 开始请求麦克风权限...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ [DEBUG] 麦克风权限获取成功');
        setHasPermission(true);
        // 立即停止流，只是为了获取权限
        stream.getTracks().forEach(track => track.stop());
        console.log('🔇 [DEBUG] 权限测试流已停止');
      } catch (error) {
        console.error('❌ [DEBUG] 麦克风权限被拒绝:', error);
        setHasPermission(false);
        toast({
          title: "麦克风权限被拒绝",
          description: "请在浏览器设置中允许麦克风访问",
          variant: "destructive"
        });
      }
    };

    if (isVisible) {
      requestMicrophonePermission();
    }
  }, [isVisible, toast]);

  // 初始化原始音频
  useEffect(() => {
    if (originalAudioUrl && !originalAudioRef.current) {
      console.log('🎵 [DEBUG] 初始化原始音频URL:', originalAudioUrl);
      try {
        originalAudioRef.current = new Audio(originalAudioUrl);
        
        // 添加错误处理
        originalAudioRef.current.addEventListener('error', (e) => {
          console.error('❌ [DEBUG] 音频加载错误:', e);
          console.error('❌ [DEBUG] 音频URL:', originalAudioUrl);
        });
        
        originalAudioRef.current.addEventListener('loadstart', () => {
          console.log('🔄 [DEBUG] 音频开始加载');
        });
        
        originalAudioRef.current.addEventListener('canplay', () => {
          console.log('✅ [DEBUG] 音频可以播放');
        });
        
        originalAudioRef.current.addEventListener('timeupdate', handleOriginalAudioTimeUpdate);
        originalAudioRef.current.addEventListener('ended', handleOriginalAudioEnded);
      } catch (error) {
        console.error('❌ [DEBUG] 创建音频对象失败:', error);
      }
    }

    return () => {
      if (originalAudioRef.current) {
        originalAudioRef.current.removeEventListener('timeupdate', handleOriginalAudioTimeUpdate);
        originalAudioRef.current.removeEventListener('ended', handleOriginalAudioEnded);
        originalAudioRef.current.removeEventListener('error', () => {});
        originalAudioRef.current.removeEventListener('loadstart', () => {});
        originalAudioRef.current.removeEventListener('canplay', () => {});
      }
    };
  }, [originalAudioUrl]);

  // 解析歌词
  useEffect(() => {
    const parseLyrics = (lyricsText: string) => {
      const lines = lyricsText.split('\n').filter(line => line.trim());
      const parsed: Array<{time: number, text: string}> = [];
      let currentTime = 0;
      
      lines.forEach((line, index) => {
        // 移除结构标签如[Verse], [Chorus]等
        const cleanLine = line.replace(/\[.*?\]/g, '').trim();
        if (cleanLine) {
          parsed.push({
            time: currentTime,
            text: cleanLine
          });
          // 假设每行歌词持续3秒
          currentTime += 3;
        }
      });
      
      return parsed;
    };
    
    setParsedLyrics(parseLyrics(lyrics));
  }, [lyrics]);

  // 处理原始音频时间更新
  const handleOriginalAudioTimeUpdate = useCallback(() => {
    if (!originalAudioRef.current) return;
    
    const currentTime = originalAudioRef.current.currentTime;
    const duration = originalAudioRef.current.duration;
    
    if (duration > 0) {
      setRecordingProgress((currentTime / duration) * 100);
    }
    
    // 更新当前歌词
    const lyricIndex = parsedLyrics.findIndex((lyric, index) => {
      const nextLyric = parsedLyrics[index + 1];
      return lyric.time <= currentTime && (!nextLyric || nextLyric.time > currentTime);
    });
    
    if (lyricIndex !== -1) {
      setCurrentLyricIndex(lyricIndex);
    }
  }, [parsedLyrics]);

  // 处理原始音频结束
  const handleOriginalAudioEnded = useCallback(() => {
    setIsPlayingOriginal(false);
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording]);

  // 开始录音
  const startRecording = async () => {
    console.log('🎙️ [DEBUG] 开始录音函数被调用');
    console.log('🔐 [DEBUG] 权限状态:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ [DEBUG] 没有麦克风权限，无法开始录音');
      toast({
        title: "需要麦克风权限",
        description: "请允许访问麦克风",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎤 [DEBUG] 正在获取麦克风流...');
      // 获取麦克风流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ [DEBUG] 麦克风流获取成功');

      // 设置音频上下文和分析器
      console.log('🔧 [DEBUG] 创建音频上下文...');
      audioContextRef.current = new AudioContext();
      console.log('🔧 [DEBUG] 音频上下文状态:', audioContextRef.current.state);
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      console.log('✅ [DEBUG] 音频分析器设置完成');

      // 设置媒体录制器
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      analysisDataRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📦 [DEBUG] 录音数据可用，大小:', event.data.size);
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('⏹️ [DEBUG] 录音停止，开始分析');
        console.log('📊 [DEBUG] 录音数据块数量:', recordedChunksRef.current.length);
        analyzeRecording();
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ [DEBUG] 录音错误:', event);
        toast({
          title: "录音错误",
          description: "录音过程中发生错误",
          variant: "destructive"
        });
      };

      // 纯清唱模式：只录音，完全不播放任何音乐
      // 用户可以自由清唱，无时长限制
      mediaRecorderRef.current.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setShowWaveform(true);

      // 开始实时分析
      startRealTimeAnalysis();

      toast({
        title: "🎤 开始清唱！",
        description: "请开始清唱，系统将根据您的声音进行评分！"
      });
    } catch (error) {
      console.error('录音启动失败:', error);
      toast({
        title: "录音失败",
        description: "无法启动录音功能",
        variant: "destructive"
      });
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowWaveform(false);
      
      // 停止原始音频播放（如果有的话）
      if (originalAudioRef.current) {
        originalAudioRef.current.pause();
        originalAudioRef.current.currentTime = 0;
        setIsPlayingOriginal(false);
      }
      
      // 清除实时分析
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // 停止所有音频轨道
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      toast({
        title: "录音结束",
        description: "正在分析您的清唱表现...",
      });
      
      // 立即进行评分，无论录音时长多短
      setIsAnalyzing(true);
    }
  };

  // 实时音频分析
  const startRealTimeAnalysis = () => {
    console.log('📊 [DEBUG] 开始实时音频分析');
    if (!analyserRef.current) {
      console.error('❌ [DEBUG] 分析器未初始化，无法开始分析');
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const pitchArray = new Float32Array(bufferLength);
    console.log('🔧 [DEBUG] 分析缓冲区大小:', bufferLength);

    let analysisCount = 0;
    const analyze = () => {
      if (!analyserRef.current || !isRecording) {
        console.log('⏹️ [DEBUG] 停止分析 - 分析器状态:', !!analyserRef.current, '录音状态:', isRecording);
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      analyserRef.current.getFloatFrequencyData(pitchArray);

      // 计算音量
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // 简单的音高检测（基于最强频率）
      let maxIndex = 0;
      let maxValue = -Infinity;
      for (let i = 0; i < pitchArray.length; i++) {
        if (pitchArray[i] > maxValue) {
          maxValue = pitchArray[i];
          maxIndex = i;
        }
      }
      
      const pitch = (maxIndex * audioContextRef.current!.sampleRate) / (2 * analyserRef.current.fftSize);
      
      // 记录分析数据
      analysisDataRef.current.push({
        pitch,
        volume,
        timestamp: Date.now() - startTimeRef.current
      });

      analysisCount++;
      // 每50次分析输出一次调试信息
      if (analysisCount % 50 === 0) {
        console.log(`📈 [DEBUG] 分析数据 #${analysisCount} - 音量: ${volume.toFixed(2)}, 音高: ${pitch.toFixed(2)}Hz, 数据点总数: ${analysisDataRef.current.length}`);
      }

      // 计算实时得分（简化版）
      const recentData = analysisDataRef.current.slice(-10);
      const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
      const volumeScore = Math.min(avgVolume / 50, 1) * 100; // 假设50是理想音量
      setRealTimeScore(Math.round(volumeScore));

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  // 分析录音并计算得分
  const analyzeRecording = async () => {
    console.log('🎯 [DEBUG] 开始分析录音并计算得分');
    const recordingDuration = (Date.now() - startTimeRef.current) / 1000;
    const analysisData = analysisDataRef.current;
    
    console.log('⏱️ [DEBUG] 录音时长:', recordingDuration.toFixed(2), '秒');
    console.log('📊 [DEBUG] 分析数据点数量:', analysisData.length);
    
    if (analysisData.length > 0) {
      console.log('📈 [DEBUG] 前5个数据点:', analysisData.slice(0, 5));
      console.log('📈 [DEBUG] 后5个数据点:', analysisData.slice(-5));
    }

    // 完全移除时长限制，支持任意时长的录音评分
    // 即使是极短的录音也能获得评分和鼓励
    if (analysisData.length === 0) {
      console.log('⚠️ [DEBUG] 没有分析数据，给予基础鼓励分');
      // 如果没有分析数据，给予基础鼓励分
      const score: KaraokeScore = {
        totalScore: 50,
        pitchAccuracy: 50,
        rhythmStability: 50,
        volumeControl: 50,
        beatMatching: 50,
        details: {
          recordedDuration: recordingDuration,
          averagePitch: 0,
          pitchVariance: 0,
          rhythmConsistency: 50
        }
      };
      console.log('✅ [DEBUG] 基础得分已计算:', score);
      setIsAnalyzing(false);
      onScoreCalculated(score);
      toast({
        title: "🌟 勇敢尝试！得分: 50",
        description: "每一次尝试都很棒！继续加油！"
      });
      return;
    }

    // 清唱模式音频分析
    console.log('🔍 [DEBUG] 开始纯人声录音分析...');
    const analysisResults = await analyzePureVocalRecording(analysisData, recordingDuration);
    console.log('📊 [DEBUG] 分析结果:', analysisResults);

    // 根据录音时长调整评分策略，支持所有时长
    let finalScore = analysisResults.baseScore;
    let durationBonus = 0;
    
    console.log('⏱️ [DEBUG] 根据录音时长调整评分策略...');
    if (recordingDuration < 1) {
      // 超短录音 (0-1秒): 基础分50分 + 10分尝试奖励
      finalScore = 50 + 10;
      durationBonus = 10;
      console.log('🚀 [DEBUG] 超短录音策略 - 基础分:50 + 奖励:10');
    } else if (recordingDuration < 2) {
      // 极短录音 (1-2秒): 基础分55分 + 15分鼓励分
      finalScore = 55 + 15;
      durationBonus = 15;
      console.log('⚡ [DEBUG] 极短录音策略 - 基础分:55 + 奖励:15');
    } else if (recordingDuration < 5) {
      // 短录音 (2-5秒): 基础评分×0.8 + 20分鼓励分
      finalScore = analysisResults.baseScore * 0.8 + 20;
      durationBonus = 20;
      console.log('🎵 [DEBUG] 短录音策略 - 基础分×0.8 + 奖励:20, 计算结果:', finalScore.toFixed(2));
    } else if (recordingDuration < 10) {
      // 中等录音 (5-10秒): 基础评分×0.9 + 10分奖励
      finalScore = analysisResults.baseScore * 0.9 + 10;
      durationBonus = 10;
      console.log('🎶 [DEBUG] 中等录音策略 - 基础分×0.9 + 奖励:10, 计算结果:', finalScore.toFixed(2));
    } else {
      // 长录音 (10秒以上): 标准评分 + 15分完整演唱奖励
      finalScore = analysisResults.baseScore + 15;
      durationBonus = 15;
      console.log('🎤 [DEBUG] 长录音策略 - 基础分 + 奖励:15, 计算结果:', finalScore.toFixed(2));
    }
    
    // 确保分数在合理范围内，给予更宽松的下限
    const totalScore = Math.min(Math.max(finalScore, 40), 100);
    console.log('🎯 [DEBUG] 最终得分计算 - 原始分:', finalScore.toFixed(2), '调整后:', totalScore.toFixed(2));

    const score: KaraokeScore = {
      totalScore: Math.round(totalScore),
      pitchAccuracy: analysisResults.pitchScore,
      rhythmStability: analysisResults.rhythmScore,
      volumeControl: analysisResults.volumeScore,
      beatMatching: analysisResults.completenessScore,
      details: {
        recordedDuration: recordingDuration,
        averagePitch: analysisResults.averagePitch,
        pitchVariance: analysisResults.pitchVariance,
        rhythmConsistency: analysisResults.rhythmScore
      }
    };

    console.log('🏆 [DEBUG] 最终评分对象:', score);
    console.log('📤 [DEBUG] 调用评分回调函数...');
    setIsAnalyzing(false);
    onScoreCalculated(score);
    console.log('✅ [DEBUG] 评分计算完成并已回调');

    // 根据录音时长提供不同的反馈
    let feedbackTitle = `🎉 清唱完成！得分: ${Math.round(totalScore)}`;
    let feedbackDescription = `音高: ${score.pitchAccuracy} | 节奏: ${score.rhythmStability} | 音量: ${score.volumeControl}`;
    
    if (recordingDuration < 1) {
      feedbackTitle = `🌟 勇敢尝试！得分: ${Math.round(totalScore)}`;
      feedbackDescription = "每一次尝试都很棒！试试稍长一点的演唱吧！";
    } else if (recordingDuration < 2) {
      feedbackTitle = `✨ 很好的开始！得分: ${Math.round(totalScore)}`;
      feedbackDescription = "勇敢的第一步，继续加油！";
    } else if (recordingDuration < 5) {
      feedbackTitle = `🌟 短时间清唱！得分: ${Math.round(totalScore)}`;
      feedbackDescription += " | 尝试更长时间录音获得更高分数！";
    } else if (recordingDuration >= 10) {
      feedbackTitle = `🏆 完整清唱！得分: ${Math.round(totalScore)}`;
      feedbackDescription += " | 完美的演唱时长！";
    }
    
    toast({
      title: feedbackTitle,
      description: feedbackDescription
    });
  };

  // 纯人声录音分析算法
  const analyzePureVocalRecording = async (analysisData: AudioAnalysisData[], recordingDuration: number): Promise<{
    baseScore: number;
    pitchScore: number;
    rhythmScore: number;
    volumeScore: number;
    completenessScore: number;
    averagePitch: number;
    pitchVariance: number;
  }> => {
    // 计算各项指标
    const volumes = analysisData.map(d => d.volume);
    const pitches = analysisData.filter(d => d.pitch > 0).map(d => d.pitch);
    
    // 音量控制得分 (25分)
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeVariance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
    const volumeScore = Math.round(Math.max(0, 25 - (volumeVariance / avgVolume) * 25));

    // 音高准确度得分 (25分)
    const avgPitch = pitches.length > 0 ? pitches.reduce((sum, p) => sum + p, 0) / pitches.length : 0;
    const pitchVariance = pitches.length > 0 ? pitches.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / pitches.length : 0;
    const pitchScore = pitches.length > 0 ? Math.round(Math.max(0, 25 - Math.sqrt(pitchVariance) / 40)) : 12;

    // 节奏稳定性得分 (25分)
    const timeIntervals = analysisData.slice(1).map((d, i) => d.timestamp - analysisData[i].timestamp);
    const avgInterval = timeIntervals.reduce((sum, i) => sum + i, 0) / timeIntervals.length;
    const intervalVariance = timeIntervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / timeIntervals.length;
    const rhythmScore = Math.round(Math.max(0, 25 - Math.sqrt(intervalVariance) / avgInterval * 25));

    // 演唱完整性得分 (25分) - 基于录音时长和音频连续性
    const continuityScore = Math.min(recordingDuration / 10, 1) * 15; // 时长奖励
    const consistencyScore = Math.min(analysisData.length / 100, 1) * 10; // 数据连续性
    const completenessScore = Math.round(continuityScore + consistencyScore);
    
    // 计算基础总分
    const baseScore = pitchScore + rhythmScore + volumeScore + completenessScore;
    
    return {
      baseScore,
      pitchScore,
      rhythmScore,
      volumeScore,
      completenessScore,
      averagePitch: avgPitch,
      pitchVariance
    };
  };

  // 切换原始音频播放
  const toggleOriginalAudio = () => {
    if (!originalAudioRef.current) {
      console.log('⚠️ [DEBUG] 原始音频引用不存在');
      return;
    }

    if (isPlayingOriginal) {
      console.log('⏸️ [DEBUG] 暂停原始音频');
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    } else {
      console.log('▶️ [DEBUG] 播放原始音频');
      originalAudioRef.current.play().catch(error => {
        console.error('❌ [DEBUG] 音频播放失败:', error);
        toast({
          title: "音频播放失败",
          description: "无法播放原始音频文件",
          variant: "destructive"
        });
      });
      setIsPlayingOriginal(true);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 text-white border-purple-500/30">
      <CardContent className="p-6 space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🎤 自由清唱模式</h3>
          <p className="text-purple-200">想唱多久就唱多久，每一次尝试都值得鼓励！</p>
          <p className="text-sm text-yellow-300 mt-1">⏱️ 无时长限制，随时停止即可评分</p>
        </div>

        {/* 清唱模式说明 */}
        <div className="text-center mb-4">
          <div className="bg-white/10 rounded-lg p-3 border border-white/20">
            <p className="text-sm text-white/80">
              🌟 自由清唱模式：无伴奏、无压力，展现您的纯净嗓音
            </p>
          </div>
        </div>

        {/* 歌词显示区域 */}
        <div className="bg-black/30 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
          <div className="space-y-2">
            {parsedLyrics.map((lyric, index) => (
              <div
                key={index}
                className={`text-lg leading-relaxed transition-all duration-300 p-2 rounded ${
                  index === currentLyricIndex
                    ? 'bg-purple-600/50 text-yellow-300 font-bold text-xl transform scale-105 shadow-lg'
                    : index < currentLyricIndex
                    ? 'text-gray-400 opacity-60'
                    : 'text-white opacity-80'
                }`}
              >
                {lyric.text}
              </div>
            ))}
            {parsedLyrics.length === 0 && (
              <p className="text-xl font-medium text-center leading-relaxed text-purple-200">
                准备开始跟唱...
              </p>
            )}
          </div>
        </div>

        {/* 实时波形显示 */}
        <div className="mb-6">
          <AudioWaveform
            audioContext={audioContextRef.current || undefined}
            analyser={analyserRef.current || undefined}
            isRecording={isRecording}
            className="w-full"
          />
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-purple-200">
            <span>进度</span>
            <span>{Math.round(recordingProgress)}%</span>
          </div>
          <Progress value={recordingProgress} className="h-2" />
        </div>

        {/* 实时得分和状态显示 */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-purple-200">
              {Math.floor(recordingProgress / 60)}:{Math.floor(recordingProgress % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-purple-300">播放时长</p>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">录音中</span>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">
              {Math.round(realTimeScore)}
            </div>
            <p className="text-xs text-purple-300">实时得分</p>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <>
              <Button
                onClick={startRecording}
                disabled={!hasPermission || isAnalyzing}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                {isAnalyzing ? "分析中..." : "开始自由清唱"}
              </Button>
              
              <Button
                onClick={toggleOriginalAudio}
                variant="outline"
                className="border-purple-400 text-purple-200 hover:bg-purple-800/50 px-6 py-3"
              >
                {isPlayingOriginal ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isPlayingOriginal ? "暂停" : "试听"}
              </Button>
            </>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 text-lg"
            >
              <Square className="w-5 h-5 mr-2" />
              停止并评分
            </Button>
          )}
        </div>

        {/* 权限提示 */}
        {!hasPermission && (
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 text-center">
            <MicOff className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-yellow-200">需要麦克风权限才能使用跟唱功能</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KaraokeRecorder;
export type { KaraokeScore };
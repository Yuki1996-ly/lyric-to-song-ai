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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        // 立即停止流，只是为了获取权限
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('麦克风权限被拒绝:', error);
        toast({
          title: "需要麦克风权限",
          description: "请允许访问麦克风以使用跟唱功能",
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
      originalAudioRef.current = new Audio(originalAudioUrl);
      originalAudioRef.current.addEventListener('timeupdate', handleOriginalAudioTimeUpdate);
      originalAudioRef.current.addEventListener('ended', handleOriginalAudioEnded);
    }

    return () => {
      if (originalAudioRef.current) {
        originalAudioRef.current.removeEventListener('timeupdate', handleOriginalAudioTimeUpdate);
        originalAudioRef.current.removeEventListener('ended', handleOriginalAudioEnded);
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
    if (!hasPermission) {
      toast({
        title: "需要麦克风权限",
        description: "请允许访问麦克风",
        variant: "destructive"
      });
      return;
    }

    try {
      // 获取麦克风流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 设置音频上下文和分析器
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      // 设置媒体录制器
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      analysisDataRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        analyzeRecording();
      };

      // 开始录音和播放原始音频
      mediaRecorderRef.current.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setShowWaveform(true);
      
      if (originalAudioRef.current) {
        originalAudioRef.current.currentTime = 0;
        originalAudioRef.current.play();
        setIsPlayingOriginal(true);
      }

      // 开始实时分析
      startRealTimeAnalysis();

      toast({
        title: "🎤 开始跟唱！",
        description: "跟着音乐一起唱吧！"
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
    }

    if (originalAudioRef.current) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 停止所有音频轨道
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setIsAnalyzing(true);
  };

  // 实时音频分析
  const startRealTimeAnalysis = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const pitchArray = new Float32Array(bufferLength);

    const analyze = () => {
      if (!analyserRef.current || !isRecording) return;

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
    const recordingDuration = (Date.now() - startTimeRef.current) / 1000;
    const analysisData = analysisDataRef.current;

    if (analysisData.length === 0) {
      toast({
        title: "录音数据不足",
        description: "请重新尝试录音",
        variant: "destructive"
      });
      setIsAnalyzing(false);
      return;
    }

    // 计算各项指标
    const volumes = analysisData.map(d => d.volume);
    const pitches = analysisData.filter(d => d.pitch > 0).map(d => d.pitch);
    
    // 音量控制得分 (0-100)
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeVariance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
    const volumeControl = Math.max(0, 100 - (volumeVariance / avgVolume) * 100);

    // 音高准确度得分 (0-100)
    const avgPitch = pitches.length > 0 ? pitches.reduce((sum, p) => sum + p, 0) / pitches.length : 0;
    const pitchVariance = pitches.length > 0 ? pitches.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / pitches.length : 0;
    const pitchAccuracy = pitches.length > 0 ? Math.max(0, 100 - Math.sqrt(pitchVariance) / 10) : 50;

    // 节奏稳定性得分 (0-100)
    const timeIntervals = analysisData.slice(1).map((d, i) => d.timestamp - analysisData[i].timestamp);
    const avgInterval = timeIntervals.reduce((sum, i) => sum + i, 0) / timeIntervals.length;
    const intervalVariance = timeIntervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / timeIntervals.length;
    const rhythmStability = Math.max(0, 100 - Math.sqrt(intervalVariance) / avgInterval * 100);

    // 节拍匹配度得分 (0-100) - 简化计算
    const expectedDuration = originalAudioRef.current?.duration || recordingDuration;
    const durationDiff = Math.abs(recordingDuration - expectedDuration);
    const beatMatching = Math.max(0, 100 - (durationDiff / expectedDuration) * 100);

    // 总分计算
    const totalScore = Math.round(
      (pitchAccuracy * 0.3 + rhythmStability * 0.25 + volumeControl * 0.25 + beatMatching * 0.2)
    );

    const score: KaraokeScore = {
      totalScore,
      pitchAccuracy: Math.round(pitchAccuracy),
      rhythmStability: Math.round(rhythmStability),
      volumeControl: Math.round(volumeControl),
      beatMatching: Math.round(beatMatching),
      details: {
        recordedDuration,
        averagePitch: avgPitch,
        pitchVariance,
        rhythmConsistency: rhythmStability
      }
    };

    setIsAnalyzing(false);
    onScoreCalculated(score);

    toast({
      title: `🎉 跟唱完成！得分: ${totalScore}`,
      description: `音高: ${score.pitchAccuracy} | 节奏: ${score.rhythmStability} | 音量: ${score.volumeControl}`
    });
  };

  // 切换原始音频播放
  const toggleOriginalAudio = () => {
    if (!originalAudioRef.current) return;

    if (isPlayingOriginal) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    } else {
      originalAudioRef.current.play();
      setIsPlayingOriginal(true);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 text-white border-purple-500/30">
      <CardContent className="p-6 space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">🎤 KTV跟唱模式</h3>
          <p className="text-purple-200">跟着原唱一起演唱，AI将为您的表现打分！</p>
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
                {isAnalyzing ? "分析中..." : "开始跟唱"}
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
              停止录音
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
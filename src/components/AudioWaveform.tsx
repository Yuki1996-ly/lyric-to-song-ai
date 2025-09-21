import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  isRecording: boolean;
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioContext,
  analyser,
  isRecording,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));

  useEffect(() => {
    if (!analyser || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray));

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // 清空画布
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // 绘制波形
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // 创建渐变
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#4ecdc4');
      gradient.addColorStop(1, '#45b7d1');

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.8;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      // 绘制中心线波形
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      const sliceWidth = width / bufferLength;
      let waveX = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(waveX, y);
        } else {
          ctx.lineTo(waveX, y);
        }

        waveX += sliceWidth;
      }

      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRecording]);

  // 计算音量级别
  const getVolumeLevel = () => {
    if (!frequencyData.length) return 0;
    const average = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
    return Math.round((average / 255) * 100);
  };

  const volumeLevel = getVolumeLevel();

  return (
    <div className={`relative ${className}`}>
      {/* 波形画布 */}
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full h-32 bg-gray-900 rounded-lg border border-gray-700"
      />
      
      {/* 音量指示器 */}
      <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1 text-white text-xs">
        音量: {volumeLevel}%
      </div>
      
      {/* 录音状态指示 */}
      {isRecording && (
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-500/80 rounded px-2 py-1 text-white text-xs">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          录音中
        </div>
      )}
      
      {/* 频率条 */}
      <div className="mt-2 flex justify-center gap-1">
        {Array.from({ length: 20 }).map((_, i) => {
          const intensity = frequencyData[i * 6] || 0;
          const height = Math.max(2, (intensity / 255) * 20);
          return (
            <div
              key={i}
              className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm transition-all duration-75"
              style={{
                width: '4px',
                height: `${height}px`,
                opacity: isRecording ? 1 : 0.3
              }}
            />
          );
        })}
      </div>
      
      {/* 提示文字 */}
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
          <p className="text-white/70 text-sm">点击开始录音查看波形</p>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;
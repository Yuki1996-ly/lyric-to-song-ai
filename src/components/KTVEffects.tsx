import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface KTVEffectsProps {
  isPlaying: boolean;
  tempo?: string;
  style?: string;
  className?: string;
}

const KTVEffects = ({ isPlaying, tempo = 'medium', style = 'rap', className }: KTVEffectsProps) => {
  const [animationSpeed, setAnimationSpeed] = useState('2s');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // 根据节奏调整动画速度
  useEffect(() => {
    const speedMap = {
      'slow': '3s',
      'medium': '2s', 
      'fast': '1.5s',
      'very-fast': '1s'
    };
    setAnimationSpeed(speedMap[tempo as keyof typeof speedMap] || '2s');
  }, [tempo]);

  // 生成粒子效果
  useEffect(() => {
    if (isPlaying) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setParticles(newParticles);
    }
  }, [isPlaying]);

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* 霓虹背景 */}
      <div className="absolute inset-0 ktv-neon-bg" />
      
      {/* 粒子效果 */}
      {isPlaying && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full ktv-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: animationSpeed
          }}
        />
      ))}

      {/* 主要小人角色 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={cn(
            'ktv-character relative',
            isPlaying && 'ktv-character-dancing'
          )}
          style={{
            animationDuration: animationSpeed
          }}
        >
          {/* 小人身体 */}
          <div className="relative">
            {/* 头部 */}
            <div className="w-16 h-16 bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-full mx-auto mb-2 ktv-head">
              {/* 眼睛 */}
              <div className="flex justify-center items-center h-full">
                <div className="w-2 h-2 bg-black rounded-full mx-1 ktv-eye" />
                <div className="w-2 h-2 bg-black rounded-full mx-1 ktv-eye" />
              </div>
              {/* 嘴巴 */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-red-500 rounded-full ktv-mouth" />
            </div>
            
            {/* 身体 */}
            <div className="w-12 h-20 bg-gradient-to-b from-blue-400 to-blue-500 rounded-lg mx-auto mb-2 ktv-body" />
            
            {/* 手臂 */}
            <div className="absolute top-16 -left-6 w-4 h-12 bg-yellow-300 rounded-full ktv-arm ktv-arm-left" />
            <div className="absolute top-16 -right-6 w-4 h-12 bg-yellow-300 rounded-full ktv-arm ktv-arm-right" />
            
            {/* 腿部 */}
            <div className="flex justify-center gap-2">
              <div className="w-4 h-16 bg-blue-600 rounded-full ktv-leg ktv-leg-left" />
              <div className="w-4 h-16 bg-blue-600 rounded-full ktv-leg ktv-leg-right" />
            </div>
            
            {/* 脚部 */}
            <div className="flex justify-center gap-2 mt-1">
              <div className="w-6 h-3 bg-black rounded-full ktv-foot" />
              <div className="w-6 h-3 bg-black rounded-full ktv-foot" />
            </div>
          </div>
          
          {/* 麦克风 */}
          <div className="absolute top-12 -right-8 w-2 h-8 bg-gray-600 rounded-full ktv-mic">
            <div className="w-3 h-3 bg-gray-800 rounded-full -mt-1 -ml-0.5" />
          </div>
          
          {/* 音符效果 */}
          {isPlaying && (
            <>
              <div className="absolute -top-4 -left-4 text-2xl ktv-note ktv-note-1">🎵</div>
              <div className="absolute -top-2 right-4 text-xl ktv-note ktv-note-2">🎶</div>
              <div className="absolute top-2 -left-6 text-lg ktv-note ktv-note-3">♪</div>
            </>
          )}
        </div>
      </div>
      
      {/* 舞台灯光效果 */}
      {isPlaying && (
        <>
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-radial from-pink-400/30 to-transparent rounded-full ktv-spotlight ktv-spotlight-1" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-gradient-radial from-blue-400/30 to-transparent rounded-full ktv-spotlight ktv-spotlight-2" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-gradient-radial from-purple-400/20 to-transparent rounded-full ktv-spotlight ktv-spotlight-3" />
        </>
      )}
      
      {/* 底部舞台 */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 ktv-stage" />
    </div>
  );
};

export default KTVEffects;
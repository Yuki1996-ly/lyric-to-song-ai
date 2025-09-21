import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Music, Clock, Volume2, Zap } from 'lucide-react';

interface ScoreAnimationProps {
  score: number;
  maxScore?: number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
  showParticles?: boolean;
}

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({
  score,
  maxScore = 100,
  label,
  icon,
  color = 'text-blue-500',
  delay = 0,
  showParticles = false
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      
      // 数字递增动画
      const duration = 2000; // 2秒
      const steps = 60;
      const increment = score / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const currentScore = Math.min(increment * currentStep, score);
        setDisplayScore(Math.round(currentScore));

        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayScore(score);
          
          // 如果分数很高，显示粒子效果
          if (showParticles && score >= 80) {
            generateParticles();
          }
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [score, delay, showParticles]);

  const generateParticles = () => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100
    }));
    setParticles(newParticles);
    
    // 清除粒子
    setTimeout(() => setParticles([]), 3000);
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'S', color: 'text-yellow-500', bgColor: 'bg-yellow-100', glowColor: 'shadow-yellow-500/50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500', bgColor: 'bg-green-100', glowColor: 'shadow-green-500/50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-500', bgColor: 'bg-blue-100', glowColor: 'shadow-blue-500/50' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-500', bgColor: 'bg-orange-100', glowColor: 'shadow-orange-500/50' };
    return { grade: 'D', color: 'text-red-500', bgColor: 'bg-red-100', glowColor: 'shadow-red-500/50' };
  };

  const gradeInfo = getScoreGrade(score);
  const percentage = (score / maxScore) * 100;

  return (
    <div className="relative">
      {/* 粒子效果 */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: [0, 1, 0],
              rotate: 360
            }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
            style={{
              left: '50%',
              top: '50%'
            }}
          />
        ))}
      </AnimatePresence>

      {/* 主要分数显示 */}
      <motion.div
        className={`relative p-6 rounded-2xl ${gradeInfo.bgColor} border-2 border-transparent transition-all duration-500`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: isAnimating ? 1 : 0.8, 
          opacity: isAnimating ? 1 : 0,
          borderColor: score >= 80 ? gradeInfo.color.replace('text-', 'border-') : 'transparent'
        }}
        transition={{ delay: delay / 1000, duration: 0.6, type: "spring", bounce: 0.4 }}
      >
        {/* 背景光效 */}
        {score >= 90 && (
          <motion.div
            className={`absolute inset-0 rounded-2xl ${gradeInfo.glowColor} shadow-2xl`}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        <div className="relative z-10">
          {/* 图标和标签 */}
          <div className="flex items-center justify-center mb-4">
            {icon && (
              <motion.div
                className={`mr-2 ${color}`}
                animate={{ rotate: score >= 80 ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5, delay: delay / 1000 + 0.5 }}
              >
                {icon}
              </motion.div>
            )}
            <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
          </div>

          {/* 分数显示 */}
          <div className="text-center mb-4">
            <motion.div
              className={`text-4xl font-bold ${gradeInfo.color} mb-2`}
              animate={{
                scale: score >= 90 ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 0.3,
                delay: delay / 1000 + 1.5
              }}
            >
              {displayScore}
              <span className="text-2xl text-gray-500">/{maxScore}</span>
            </motion.div>
            
            {/* 等级显示 */}
            <motion.div
              className={`inline-flex items-center px-3 py-1 rounded-full ${gradeInfo.bgColor} border-2 ${gradeInfo.color.replace('text-', 'border-')}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay / 1000 + 1, type: "spring", bounce: 0.6 }}
            >
              <Trophy className={`w-4 h-4 mr-1 ${gradeInfo.color}`} />
              <span className={`font-bold ${gradeInfo.color}`}>{gradeInfo.grade}级</span>
            </motion.div>
          </div>

          {/* 进度条 */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getProgressGradient(score)} rounded-full relative`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: delay / 1000 + 0.5, duration: 1.5, ease: "easeOut" }}
              >
                {/* 进度条光效 */}
                <motion.div
                  className="absolute inset-0 bg-white/30 rounded-full"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    delay: delay / 1000 + 1,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </div>
            
            {/* 百分比显示 */}
            <motion.div
              className="absolute -top-8 right-0 text-sm font-medium text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay / 1000 + 1.2 }}
            >
              {Math.round(percentage)}%
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const getProgressGradient = (score: number) => {
  if (score >= 90) return 'from-yellow-400 to-yellow-600';
  if (score >= 80) return 'from-green-400 to-green-600';
  if (score >= 70) return 'from-blue-400 to-blue-600';
  if (score >= 60) return 'from-orange-400 to-orange-600';
  return 'from-red-400 to-red-600';
};

// 预设的分数动画组件
export const TotalScoreAnimation: React.FC<{ score: number; delay?: number }> = ({ score, delay = 0 }) => (
  <ScoreAnimation
    score={score}
    label="总分"
    icon={<Trophy className="w-6 h-6" />}
    delay={delay}
    showParticles={true}
  />
);

export const PitchScoreAnimation: React.FC<{ score: number; delay?: number }> = ({ score, delay = 200 }) => (
  <ScoreAnimation
    score={score}
    label="音高准确度"
    icon={<Music className="w-5 h-5" />}
    color="text-blue-500"
    delay={delay}
  />
);

export const RhythmScoreAnimation: React.FC<{ score: number; delay?: number }> = ({ score, delay = 400 }) => (
  <ScoreAnimation
    score={score}
    label="节奏稳定性"
    icon={<Clock className="w-5 h-5" />}
    color="text-green-500"
    delay={delay}
  />
);

export const VolumeScoreAnimation: React.FC<{ score: number; delay?: number }> = ({ score, delay = 600 }) => (
  <ScoreAnimation
    score={score}
    label="音量控制"
    icon={<Volume2 className="w-5 h-5" />}
    color="text-orange-500"
    delay={delay}
  />
);

export const BeatScoreAnimation: React.FC<{ score: number; delay?: number }> = ({ score, delay = 800 }) => (
  <ScoreAnimation
    score={score}
    label="节拍匹配"
    icon={<Star className="w-5 h-5" />}
    color="text-pink-500"
    delay={delay}
  />
);

export default ScoreAnimation;
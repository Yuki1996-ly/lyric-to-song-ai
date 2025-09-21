import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Music, Volume2, Clock, Share2, Save } from 'lucide-react';
import { KaraokeScore } from './KaraokeRecorder';
import { useToast } from '@/hooks/use-toast';
import { 
  TotalScoreAnimation, 
  PitchScoreAnimation, 
  RhythmScoreAnimation, 
  VolumeScoreAnimation, 
  BeatScoreAnimation 
} from './ScoreAnimation';

interface KaraokeScoreDisplayProps {
  score: KaraokeScore | null;
  onClose: () => void;
  onSaveScore: (score: KaraokeScore) => void;
  songTitle: string;
}

const KaraokeScoreDisplay = ({ score, onClose, onSaveScore, songTitle }: KaraokeScoreDisplayProps) => {
  const { toast } = useToast();
  const [animatedScores, setAnimatedScores] = useState({
    total: 0,
    pitch: 0,
    rhythm: 0,
    volume: 0,
    beat: 0
  });
  const [showDetails, setShowDetails] = useState(false);

  // 动画效果：逐步显示分数
  useEffect(() => {
    if (!score) return;

    const animateScore = (targetScore: number, key: keyof typeof animatedScores, delay: number = 0) => {
      setTimeout(() => {
        let current = 0;
        const increment = targetScore / 30; // 30帧动画
        const timer = setInterval(() => {
          current += increment;
          if (current >= targetScore) {
            current = targetScore;
            clearInterval(timer);
          }
          setAnimatedScores(prev => ({ ...prev, [key]: Math.round(current) }));
        }, 50);
      }, delay);
    };

    // 依次动画显示各项分数
    animateScore(score.pitchAccuracy, 'pitch', 500);
    animateScore(score.rhythmStability, 'rhythm', 800);
    animateScore(score.volumeControl, 'volume', 1100);
    animateScore(score.beatMatching, 'beat', 1400);
    animateScore(score.totalScore, 'total', 1800);
  }, [score]);

  // 获取分数等级和颜色
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'S', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-400/20' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-400', bg: 'bg-orange-400/20' };
    return { grade: 'D', color: 'text-red-400', bg: 'bg-red-400/20' };
  };

  // 获取评价文本
  const getScoreComment = (score: number) => {
    if (score >= 90) return '完美演出！你就是天生的歌手！🌟';
    if (score >= 80) return '表现优秀！继续保持这个水平！👏';
    if (score >= 70) return '不错的演唱！还有进步空间！💪';
    if (score >= 60) return '继续努力！多练习会更好！📈';
    return '加油练习！每次都会有进步！🎯';
  };

  // 保存分数到排行榜
  const handleSaveScore = () => {
    if (!score) return;
    
    onSaveScore(score);
    toast({
      title: "🏆 分数已保存！",
      description: "您的跟唱成绩已添加到排行榜"
    });
  };

  // 分享成绩
  const handleShareScore = () => {
    if (!score) return;

    const shareText = `我在《${songTitle}》的跟唱中获得了 ${score.totalScore} 分！🎤\n音高准确度: ${score.pitchAccuracy}\n节奏稳定性: ${score.rhythmStability}\n音量控制: ${score.volumeControl}\n节拍匹配: ${score.beatMatching}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'KTV跟唱成绩',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "📋 成绩已复制！",
        description: "分享文本已复制到剪贴板"
      });
    }
  };

  if (!score) return null;

  const totalGrade = getScoreGrade(animatedScores.total);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-purple-900/95 to-pink-900/95 text-white border-purple-500/30 animate-in fade-in-0 zoom-in-95 duration-500">
        <CardContent className="p-8 space-y-6">
          {/* 标题和总分 */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h2 className="text-3xl font-bold">跟唱成绩</h2>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            
            <div className="space-y-2">
              <p className="text-purple-200">《{songTitle}》</p>
            </div>
          </div>

          {/* 总分动画显示 */}
          <div className="mb-8">
            <TotalScoreAnimation score={score.totalScore} delay={0} />
          </div>

          {/* 详细分数动画 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <PitchScoreAnimation score={score.pitchAccuracy} delay={200} />
            <RhythmScoreAnimation score={score.rhythmStability} delay={400} />
            <VolumeScoreAnimation score={score.volumeControl} delay={600} />
            <BeatScoreAnimation score={score.beatMatching} delay={800} />
          </div>

          {/* 详细信息切换 */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="text-purple-200 hover:text-white hover:bg-purple-800/50"
            >
              {showDetails ? '隐藏详细信息' : '查看详细信息'}
            </Button>
          </div>

          {/* 详细信息 */}
          {showDetails && (
            <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
              <h4 className="font-medium text-purple-200 mb-3">技术详情</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-purple-300">录音时长:</span>
                  <span className="ml-2 text-white">{score.details.recordedDuration.toFixed(1)}秒</span>
                </div>
                <div>
                  <span className="text-purple-300">平均音高:</span>
                  <span className="ml-2 text-white">{score.details.averagePitch.toFixed(0)}Hz</span>
                </div>
                <div>
                  <span className="text-purple-300">音高方差:</span>
                  <span className="ml-2 text-white">{score.details.pitchVariance.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-purple-300">节奏一致性:</span>
                  <span className="ml-2 text-white">{score.details.rhythmConsistency.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={handleSaveScore}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <Save className="w-4 h-4 mr-2" />
              保存成绩
            </Button>
            
            <Button
              onClick={handleShareScore}
              variant="outline"
              className="border-purple-400 text-purple-200 hover:bg-purple-800/50 px-6 py-2"
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享成绩
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-400 text-gray-200 hover:bg-gray-800/50 px-6 py-2"
            >
              关闭
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KaraokeScoreDisplay;
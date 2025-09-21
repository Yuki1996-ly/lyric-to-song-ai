import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Heart, MessageCircle, Share2, Save, ArrowLeft, Play, Pause, SkipBack, SkipForward, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import KTVEffects from "@/components/KTVEffects";
import KaraokeRecorder, { KaraokeScore } from "@/components/KaraokeRecorder";
import KaraokeScoreDisplay from "@/components/KaraokeScoreDisplay";
import "@/components/KTVEffects.css";

interface SongData {
  id: string;
  title: string;
  lyrics: string;
  audioUrl: string;
  style: string;
  tempo: string;
  originalText: string;
  createdAt: string;
}

const PlayerPage = () => {
  const navigate = useNavigate();
  const { songId } = useParams();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [songData, setSongData] = useState<SongData | null>(null);
  const [parsedLyrics, setParsedLyrics] = useState<Array<{time: number, text: string}>>([]);
  const [showKaraoke, setShowKaraoke] = useState(false);
  const [karaokeScore, setKaraokeScore] = useState<KaraokeScore | null>(null);
  const [showScoreDisplay, setShowScoreDisplay] = useState(false);

  // 加载歌曲数据
  useEffect(() => {
    const loadSongData = () => {
      if (songId) {
        // 从localStorage获取特定歌曲
        const songs = JSON.parse(localStorage.getItem('generatedSongs') || '[]');
        const song = songs.find((s: SongData) => s.id === songId);
        if (song) {
          setSongData(song);
          return;
        }
      }
      
      // 如果没有songId或找不到歌曲，尝试获取当前歌曲
      const currentSong = localStorage.getItem('currentSong');
      if (currentSong) {
        setSongData(JSON.parse(currentSong));
      } else {
        // 如果没有歌曲数据，返回首页
        navigate('/');
      }
    };

    loadSongData();
  }, [songId, navigate]);

  // 解析歌词
  useEffect(() => {
    if (songData?.lyrics) {
      const lyrics = parseLyrics(songData.lyrics);
      setParsedLyrics(lyrics);
    }
  }, [songData]);

  // 解析歌词文本，提取时间戳（如果有的话）
  const parseLyrics = (lyricsText: string) => {
    const lines = lyricsText.split('\n').filter(line => line.trim());
    const lyrics: Array<{time: number, text: string}> = [];
    let currentTime = 0;

    lines.forEach((line, index) => {
      // 简单的时间分配，每行歌词间隔4秒
      lyrics.push({
        time: currentTime,
        text: line.trim()
      });
      currentTime += 4;
    });

    return lyrics;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current || !songData) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      toast({
        title: "🎵 播放您的歌曲",
        description: "享受您的个性化创作！",
      });
    }
    setIsPlaying(!isPlaying);
  };

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // 更新当前歌词
      const currentLyric = parsedLyrics.findIndex((lyric, index) => {
        const nextLyric = parsedLyrics[index + 1];
        return lyric.time <= audio.currentTime && 
               (!nextLyric || nextLyric.time > audio.currentTime);
      });
      
      if (currentLyric !== -1) {
        setCurrentLyricIndex(currentLyric);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [parsedLyrics]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "已从收藏中移除" : "❤️ 已添加到收藏！",
      description: isLiked ? "歌曲已从您的收藏中移除" : "歌曲已保存到您的收藏",
    });
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "已从合集中移除" : "💾 已保存到合集！",
      description: isSaved ? "歌曲已从您的合集中移除" : "歌曲已保存到您的个人合集",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "🔗 链接已复制！",
      description: "与朋友和家人分享您的歌曲",
    });
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // 处理跟唱得分
  const handleKaraokeScore = (score: KaraokeScore) => {
    setKaraokeScore(score);
    setShowKaraoke(false);
    setShowScoreDisplay(true);
  };

  // 保存跟唱得分到排行榜
  const handleSaveKaraokeScore = (score: KaraokeScore) => {
    const existingScores = JSON.parse(localStorage.getItem('karaokeScores') || '[]');
    const newScore = {
      id: Date.now().toString(),
      songId: songData?.id,
      songTitle: songData?.title,
      score: score,
      timestamp: new Date().toISOString()
    };
    existingScores.unshift(newScore);
    localStorage.setItem('karaokeScores', JSON.stringify(existingScores));
  };

  // 开始跟唱模式
  const startKaraokeMode = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setShowKaraoke(true);
  };

  if (!songData) {
     return (
       <div className="min-h-screen gradient-player text-white flex items-center justify-center">
         <LoadingSpinner size="lg" text="加载中..." className="text-white" />
       </div>
     );
   }



  return (
    <div className="min-h-screen gradient-player text-white">
      {/* 隐藏的音频元素 */}
      {songData?.audioUrl && (
        <audio
          ref={audioRef}
          src={songData.audioUrl}
          preload="metadata"
        />
      )}

      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold">正在播放</h1>
        <Button 
          variant="secondary" 
          onClick={() => navigate("/")}
          className="bg-white text-primary hover:bg-white/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </header>

      <div className="container mx-auto px-6 pb-8">
        {/* Song Info Card */}
        <Card className="bg-white text-foreground mb-8 player-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{songData.title}</h2>
                <p className="text-muted-foreground">AI生成 • {songData.style} • {songData.tempo}</p>
              </div>
              <Button 
                onClick={handleSave}
                variant={isSaved ? "default" : "outline"}
                className="btn-shadow"
              >
                <Save className="w-4 h-4 mr-2" />
                 {isSaved ? "已保存" : "保存"}
              </Button>
            </div>

            {/* Lyrics Display */}
            <div className="my-8 h-48 overflow-y-auto border-t pt-6 space-y-2">
              {parsedLyrics.map((lyric, index) => (
                <p 
                  key={index}
                  className={`transition-all duration-300 ${
                    index === currentLyricIndex 
                      ? "text-primary font-semibold text-lg scale-105" 
                      : "text-muted-foreground"
                  }`}
                >
                  [{formatTime(lyric.time)}] {lyric.text}
                </p>
              ))}
            </div>

            {/* Player Controls */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="lg" className="rounded-full p-3">
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button 
                  onClick={togglePlay}
                  size="lg" 
                  className="rounded-full p-4 gradient-main hover:opacity-90"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                
                <Button variant="outline" size="lg" className="rounded-full p-3">
                  <SkipForward className="w-5 h-5" />
                </Button>

                <div className="flex-1 space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    className="w-full"
                    onValueChange={handleSeek}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons and Volume */}
              <div className="flex justify-between items-center">
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    variant={isLiked ? "default" : "outline"}
                    onClick={handleLike}
                    className="btn-shadow"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    Like
                  </Button>
                  <Button 
                    onClick={startKaraokeMode}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-shadow"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    跟唱
                  </Button>
                  <Button variant="outline" className="btn-shadow">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="btn-shadow">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔊</span>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KTV Effects & Music Visualizer */}
        <Card className="bg-black/80 border-0 ktv-glow relative overflow-hidden">
          <CardContent className="p-0 relative">
            {/* KTV背景特效 */}
            <div className="h-80 relative">
              <KTVEffects 
                isPlaying={isPlaying}
                tempo={songData.tempo}
                style={songData.style}
                className="absolute inset-0"
              />
            </div>
            
            {/* 音乐可视化器 - 叠加在特效上方 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="h-16 flex items-end justify-center gap-1">
                {/* Animated visualizer bars */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-t from-pink-400 via-purple-400 to-blue-400 w-2 rounded-t transition-all duration-300 ${
                      isPlaying ? "visualizer-bar" : "h-2"
                    }`}
                    style={{
                      animationDelay: `${i * 30}ms`,
                      height: isPlaying ? `${Math.random() * 60 + 10}%` : "8px"
                    }}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-white/80 text-sm font-medium">
                  {isPlaying ? "🎤 KTV模式激活 - 跟着节拍一起摇摆！" : "🎵 点击播放开始KTV体验"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 跟唱功能 */}
        {showKaraoke && songData && (
          <KaraokeRecorder
            originalAudioUrl={songData.audioUrl}
            lyrics={parsedLyrics}
            onScoreCalculated={handleKaraokeScore}
            isVisible={showKaraoke}
          />
        )}
      </div>

      {/* 跟唱得分显示 */}
      {showScoreDisplay && karaokeScore && songData && (
        <KaraokeScoreDisplay
          score={karaokeScore}
          songTitle={songData.title}
          onClose={() => setShowScoreDisplay(false)}
          onSaveScore={handleSaveKaraokeScore}
        />
      )}
    </div>
  );
};

export default PlayerPage;
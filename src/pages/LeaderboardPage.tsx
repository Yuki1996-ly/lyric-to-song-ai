import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Heart, Users, Trophy, Music, Clock, Volume2, Star, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KaraokeScore } from "@/components/KaraokeRecorder";

interface KaraokeScoreEntry {
  id: string;
  songId?: string;
  songTitle?: string;
  score: KaraokeScore;
  timestamp: string;
  userName?: string;
}

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("songs");
  const [karaokeScores, setKaraokeScores] = useState<KaraokeScoreEntry[]>([]);
  const [karaokeRankingType, setKaraokeRankingType] = useState("total");

  const topSongs = [
    {
      id: 1,
      title: "Summer Dreams",
      artist: "Sarah M.",
      likes: 1234,
      plays: 5678,
      style: "Pop",
      medal: "🥇",
      bgColor: "bg-gradient-to-br from-yellow-200 to-yellow-300"
    },
    {
      id: 2,
      title: "Night Runner",
      artist: "Alex K.",
      likes: 980,
      plays: 4321,
      style: "Electronic",
      medal: "🥈", 
      bgColor: "bg-gradient-to-br from-gray-200 to-gray-300"
    },
    {
      id: 3,
      title: "Coffee Shop Blues",
      artist: "Emma L.",
      likes: 765,
      plays: 3210,
      style: "Jazz",
      medal: "🥉",
      bgColor: "bg-gradient-to-br from-orange-200 to-orange-300"
    }
  ];

  const otherSongs = [
    { id: 4, title: "Midnight Thoughts", artist: "David R.", likes: 654, plays: 2890, style: "Ballad" },
    { id: 5, title: "City Lights", artist: "Luna P.", likes: 543, plays: 2456, style: "Rock" },
    { id: 6, title: "Morning Coffee", artist: "Jake W.", likes: 432, plays: 2123, style: "Pop" },
    { id: 7, title: "Rainy Day Vibes", artist: "Maya S.", likes: 321, plays: 1876, style: "Rap" },
  ];

  // 加载跟唱得分数据
  useEffect(() => {
    const scores = JSON.parse(localStorage.getItem('karaokeScores') || '[]');
    setKaraokeScores(scores);
  }, []);

  const tabs = [
    { id: "songs", label: "歌曲排行", icon: "🎵" },
    { id: "karaoke", label: "跟唱排行", icon: "🎤" },
    { id: "stats", label: "统计数据", icon: "📊" },
  ];

  const karaokeRankingTabs = [
    { id: "total", label: "总分", icon: <Trophy className="w-4 h-4" /> },
    { id: "pitch", label: "音高", icon: <Music className="w-4 h-4" /> },
    { id: "rhythm", label: "节奏", icon: <Clock className="w-4 h-4" /> },
    { id: "volume", label: "音量", icon: <Volume2 className="w-4 h-4" /> },
    { id: "beat", label: "节拍", icon: <Star className="w-4 h-4" /> },
  ];

  // 获取排序后的跟唱得分
  const getSortedKaraokeScores = () => {
    return [...karaokeScores].sort((a, b) => {
      switch (karaokeRankingType) {
        case 'pitch':
          return b.score.pitchAccuracy - a.score.pitchAccuracy;
        case 'rhythm':
          return b.score.rhythmStability - a.score.rhythmStability;
        case 'volume':
          return b.score.volumeControl - a.score.volumeControl;
        case 'beat':
          return b.score.beatMatching - a.score.beatMatching;
        default:
          return b.score.totalScore - a.score.totalScore;
      }
    });
  };

  // 获取分数等级
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'S', color: 'text-yellow-500', bg: 'bg-yellow-100' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500', bg: 'bg-green-100' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-500', bg: 'bg-orange-100' };
    return { grade: 'D', color: 'text-red-500', bg: 'bg-red-100' };
  };

  // 获取当前排行的分数值
  const getCurrentScore = (entry: KaraokeScoreEntry) => {
    switch (karaokeRankingType) {
      case 'pitch': return entry.score.pitchAccuracy;
      case 'rhythm': return entry.score.rhythmStability;
      case 'volume': return entry.score.volumeControl;
      case 'beat': return entry.score.beatMatching;
      default: return entry.score.totalScore;
    }
  };

  const handlePlaySong = (songId: number | string, title: string) => {
    toast({
      title: `🎵 Playing "${title}"`,
      description: "Enjoy this community favorite!",
    });
    navigate(`/player/${songId}`);
  };

  // 渲染跟唱排行榜
  const renderKaraokeLeaderboard = () => {
    const sortedScores = getSortedKaraokeScores();
    const topThree = sortedScores.slice(0, 3);
    const others = sortedScores.slice(3, 10);

    return (
      <div className="space-y-8">
        {/* 跟唱排行类型选择 */}
        <div className="flex justify-center gap-2 flex-wrap">
          {karaokeRankingTabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setKaraokeRankingType(tab.id)}
              variant={karaokeRankingType === tab.id ? "default" : "outline"}
              className={`px-4 py-2 ${karaokeRankingType === tab.id ? "gradient-main" : ""} btn-shadow`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </div>

        {sortedScores.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <Mic className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">还没有跟唱记录</h3>
              <p className="text-muted-foreground mb-4">开始你的第一次跟唱，登上排行榜吧！</p>
              <Button onClick={() => navigate('/')} className="gradient-main">
                开始创作歌曲
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 前三名展示 */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {topThree.map((entry, index) => {
                  const currentScore = getCurrentScore(entry);
                  const grade = getScoreGrade(currentScore);
                  const medals = ['🥇', '🥈', '🥉'];
                  const bgColors = [
                    'bg-gradient-to-br from-yellow-200 to-yellow-300',
                    'bg-gradient-to-br from-gray-200 to-gray-300', 
                    'bg-gradient-to-br from-orange-200 to-orange-300'
                  ];

                  return (
                    <Card key={entry.id} className={`${bgColors[index]} border-0 card-shadow hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
                      <CardContent className="p-6 text-center">
                        <div className="text-5xl mb-4">{medals[index]}</div>
                        <div className="space-y-2 mb-4">
                          <h3 className="font-bold text-lg text-gray-800 truncate">
                            {entry.songTitle || '未知歌曲'}
                          </h3>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full ${grade.bg}`}>
                            <span className={`font-bold text-2xl ${grade.color}`}>{currentScore}</span>
                            <span className={`ml-2 font-medium ${grade.color}`}>{grade.grade}级</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <div>总分: {entry.score.totalScore}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        {entry.songId && (
                          <Button 
                            onClick={() => handlePlaySong(entry.songId!, entry.songTitle || '未知歌曲')}
                            className="gradient-main hover:opacity-90 btn-shadow"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            播放
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* 其他排名 */}
            {others.length > 0 && (
              <Card className="card-shadow">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    跟唱排行榜
                  </h2>
                  <div className="space-y-3">
                    {others.map((entry, index) => {
                      const currentScore = getCurrentScore(entry);
                      const grade = getScoreGrade(currentScore);
                      const rank = index + 4;

                      return (
                        <div 
                          key={entry.id}
                          className="flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              #{rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                                {entry.songTitle || '未知歌曲'}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded ${grade.bg}`}>
                                  <span className={`font-bold ${grade.color}`}>{currentScore}</span>
                                  <span className={`text-xs ${grade.color}`}>{grade.grade}</span>
                                </div>
                                <span className="text-xs">
                                  {new Date(entry.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="hidden sm:flex flex-col gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Music className="w-3 h-3" />
                                <span>{entry.score.pitchAccuracy}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>{entry.score.rhythmStability}</span>
                              </div>
                            </div>
                          </div>
                          {entry.songId && (
                            <Button 
                              onClick={() => handlePlaySong(entry.songId!, entry.songTitle || '未知歌曲')}
                              variant="outline"
                              size="sm"
                              className="btn-shadow group-hover:border-primary group-hover:text-primary"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              播放
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold mb-4 text-primary">🏆 Leaderboard</h1>
          <p className="text-muted-foreground text-lg">
            Discover the most loved songs created by our community
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={`px-6 py-3 ${activeTab === tab.id ? "gradient-main" : ""} btn-shadow`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        {/* 内容区域 */}
        {activeTab === 'songs' && (
          <>
            {/* Top 3 Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {topSongs.map((song, index) => (
                <Card key={song.id} className={`${song.bgColor} border-0 card-shadow hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-4">{song.medal}</div>
                    <div className="space-y-2 mb-4">
                      <h3 className="font-bold text-xl text-gray-800">{song.title}</h3>
                      <p className="text-gray-600 font-medium">{song.artist}</p>
                      <Badge variant="secondary" className="bg-white/50 text-gray-700">
                        {song.style}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-4 space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="w-4 h-4" />
                        {song.likes.toLocaleString()} likes
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        {song.plays.toLocaleString()} plays
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePlaySong(song.id, song.title)}
                      className="gradient-main hover:opacity-90 btn-shadow"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Other Rankings */}
            <Card className="card-shadow">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-primary">More Great Songs</h2>
                <div className="space-y-4">
                  {otherSongs.map((song, index) => (
                    <div 
                      key={song.id} 
                      className="flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                          #{index + 4}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {song.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{song.artist}</span>
                            <Badge variant="outline" className="text-xs">
                              {song.style}
                            </Badge>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {song.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {song.plays}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handlePlaySong(song.id, song.title)}
                        variant="outline"
                        className="btn-shadow group-hover:border-primary group-hover:text-primary"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* 跟唱排行榜 */}
        {activeTab === 'karaoke' && renderKaraokeLeaderboard()}

        {/* 统计数据 */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* 基础统计 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center p-6 card-shadow">
                <div className="text-3xl mb-2">🎵</div>
                <h3 className="font-semibold text-lg">总歌曲数</h3>
                <p className="text-2xl font-bold text-primary">12,456</p>
              </Card>
              
              <Card className="text-center p-6 card-shadow">
                <div className="text-3xl mb-2">🎤</div>
                <h3 className="font-semibold text-lg">跟唱记录</h3>
                <p className="text-2xl font-bold text-primary">{karaokeScores.length}</p>
              </Card>
              
              <Card className="text-center p-6 card-shadow">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-lg">活跃用户</h3>
                <p className="text-2xl font-bold text-primary">3,789</p>
              </Card>
              
              <Card className="text-center p-6 card-shadow">
                <div className="text-3xl mb-2">⭐</div>
                <h3 className="font-semibold text-lg">平均得分</h3>
                <p className="text-2xl font-bold text-primary">
                  {karaokeScores.length > 0 
                    ? Math.round(karaokeScores.reduce((sum, s) => sum + s.score.totalScore, 0) / karaokeScores.length)
                    : 0
                  }
                </p>
              </Card>
            </div>

            {/* 跟唱统计详情 */}
            {karaokeScores.length > 0 && (
              <Card className="card-shadow">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-primary">跟唱数据分析</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 各项能力平均分 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">平均能力分析</h3>
                      {[
                        { key: 'pitchAccuracy', label: '音高准确度', icon: <Music className="w-4 h-4" />, color: 'bg-blue-500' },
                        { key: 'rhythmStability', label: '节奏稳定性', icon: <Clock className="w-4 h-4" />, color: 'bg-green-500' },
                        { key: 'volumeControl', label: '音量控制', icon: <Volume2 className="w-4 h-4" />, color: 'bg-orange-500' },
                        { key: 'beatMatching', label: '节拍匹配', icon: <Star className="w-4 h-4" />, color: 'bg-pink-500' }
                      ].map((item) => {
                        const avgScore = Math.round(
                          karaokeScores.reduce((sum, s) => sum + s.score[item.key as keyof KaraokeScore], 0) / karaokeScores.length
                        );
                        return (
                          <div key={item.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                              </div>
                              <span className="font-bold">{avgScore}%</span>
                            </div>
                            <Progress value={avgScore} className="h-2" />
                          </div>
                        );
                      })}
                    </div>

                    {/* 得分分布 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">得分分布</h3>
                      {[
                        { range: '90-100', label: 'S级 (90-100)', count: karaokeScores.filter(s => s.score.totalScore >= 90).length },
                        { range: '80-89', label: 'A级 (80-89)', count: karaokeScores.filter(s => s.score.totalScore >= 80 && s.score.totalScore < 90).length },
                        { range: '70-79', label: 'B级 (70-79)', count: karaokeScores.filter(s => s.score.totalScore >= 70 && s.score.totalScore < 80).length },
                        { range: '60-69', label: 'C级 (60-69)', count: karaokeScores.filter(s => s.score.totalScore >= 60 && s.score.totalScore < 70).length },
                        { range: '0-59', label: 'D级 (0-59)', count: karaokeScores.filter(s => s.score.totalScore < 60).length }
                      ].map((grade) => {
                        const percentage = karaokeScores.length > 0 ? (grade.count / karaokeScores.length) * 100 : 0;
                        return (
                          <div key={grade.range} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{grade.label}</span>
                              <span className="text-sm text-muted-foreground">{grade.count} 次</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaderboardPage;

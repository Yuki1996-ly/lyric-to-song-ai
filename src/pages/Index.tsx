import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deepseekApi } from "@/services/deepseekApi";
import { minimaxApi } from "@/services/minimaxApi";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const [diaryText, setDiaryText] = useState("");
  const [style, setStyle] = useState("");
  const [tempo, setTempo] = useState("");
  const [dialect, setDialect] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerateSong = async () => {
    if (!diaryText.trim()) {
      toast({
        title: "请先写点什么！",
        description: "输入您的日记或想法来生成歌曲。",
        variant: "destructive",
      });
      return;
    }

    if (!style || !tempo || !dialect) {
      toast({
        title: "选择风格、节奏和方言",
        description: "请选择音乐风格、节奏和方言来生成您的歌曲。",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // 第一步：生成歌词
      setGenerationStep("正在生成歌词...");
      toast({
        title: "开始创作您的歌曲! 🎵",
        description: "AI正在根据您的文字生成歌词...",
      });

      const lyrics = await deepseekApi.generateLyrics(diaryText, style, tempo, dialect);
      
      // 第二步：生成音乐
      setGenerationStep("正在生成音乐...");
      toast({
        title: "歌词生成完成! 🎤",
        description: "现在正在为您的歌词配上音乐...",
      });

      const audioBlob = await minimaxApi.generateMusic(lyrics, style, tempo);
      const audioUrl = minimaxApi.createAudioUrl(audioBlob);

      // 将生成的歌曲数据存储到localStorage或状态管理中
      const songData = {
        id: Date.now().toString(),
        title: `我的歌曲 - ${new Date().toLocaleDateString()}`,
         lyrics: lyrics,
        audioUrl: audioUrl,
        style: style,
        tempo: tempo,
        dialect: dialect,
        originalText: diaryText,
        createdAt: new Date().toISOString()
      };

      // 存储到localStorage
      const existingSongs = JSON.parse(localStorage.getItem('generatedSongs') || '[]');
      existingSongs.unshift(songData);
      localStorage.setItem('generatedSongs', JSON.stringify(existingSongs));
      localStorage.setItem('currentSong', JSON.stringify(songData));

      setIsGenerating(false);
      setGenerationStep("");
      
      toast({
        title: "歌曲生成成功! 🎉",
        description: "您的个性化歌曲已准备好播放！",
      });
      
      // 导航到播放器页面
      navigate(`/player/${songData.id}`);
    } catch (error) {
      console.error('Error generating song:', error);
      setIsGenerating(false);
      setGenerationStep("");
      
      toast({
        title: "生成失败 😞",
        description: error instanceof Error ? error.message : "生成歌曲时出现错误，请重试。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-10 fade-in">
          <h1 className="text-5xl font-bold mb-4 gradient-animated bg-clip-text text-transparent">
            Turn Your Life Into Music
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Share your thoughts, feelings, or daily experiences and watch AI transform them into a personalized song
          </p>
        </div>

        <Card className="card-shadow mb-8">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label className="text-lg font-semibold block mb-3">
                  What's on your mind today? ✍️
                </label>
                <Textarea
                  placeholder="Write your diary, thoughts, or daily experiences here... The more you share, the more personal your song will be!"
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  className="min-h-[120px] text-base resize-none border-2 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-base font-medium block mb-2">Music Style 🎼</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose your vibe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pop">🎤 Pop</SelectItem>
                      <SelectItem value="rap">🎤 Rap</SelectItem>
                      <SelectItem value="rock">🎸 Rock</SelectItem>
                      <SelectItem value="electronic">🎛️ Electronic</SelectItem>
                      <SelectItem value="jazz">🎺 Jazz</SelectItem>
                      <SelectItem value="ballad">💕 Ballad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-base font-medium block mb-2">Tempo 🥁</label>
                  <Select value={tempo} onValueChange={setTempo}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Set the pace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">🐌 Slow & Chill</SelectItem>
                      <SelectItem value="medium">🚶 Medium Pace</SelectItem>
                      <SelectItem value="fast">🏃 Fast & Energetic</SelectItem>
                      <SelectItem value="very-fast">⚡ Lightning Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-base font-medium block mb-2">方言选择 🗣️</label>
                  <Select value={dialect} onValueChange={setDialect}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="选择方言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mandarin">🗣️ 普通话（标准）</SelectItem>
                      <SelectItem value="sichuan">🌶️ 四川话</SelectItem>
                      <SelectItem value="cantonese">🏮 粤语（广东话）</SelectItem>
                      <SelectItem value="northeast">❄️ 东北话</SelectItem>
                      <SelectItem value="shanghai">🏙️ 上海话</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateSong}
                disabled={isGenerating}
                className="w-full h-14 text-lg font-semibold gradient-main hover:opacity-90 transition-all duration-300 btn-shadow"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" className="text-white" />
                    <span>{generationStep || "正在生成您的歌曲..."}</span>
                  </div>
                ) : (
                  "🎵 生成我的歌曲"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center p-6 card-shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="font-semibold text-lg mb-2">AI Lyrics Generation</h3>
            <p className="text-muted-foreground text-sm">Transform your thoughts into beautiful song lyrics</p>
          </Card>
          
          <Card className="text-center p-6 card-shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🎵</div>
            <h3 className="font-semibold text-lg mb-2">Multiple Music Styles</h3>
            <p className="text-muted-foreground text-sm">Pop, Rock, Rap, Jazz - choose your perfect sound</p>
          </Card>
          
          <Card className="text-center p-6 card-shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-semibold text-lg mb-2">Share & Compete</h3>
            <p className="text-muted-foreground text-sm">Join the leaderboard and share your creations</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [diaryText, setDiaryText] = useState("");
  const [style, setStyle] = useState("");
  const [tempo, setTempo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerateSong = async () => {
    if (!diaryText.trim()) {
      toast({
        title: "Please write something first!",
        description: "Enter your diary or daily thoughts to generate a song.",
        variant: "destructive",
      });
      return;
    }

    if (!style || !tempo) {
      toast({
        title: "Choose your style and tempo",
        description: "Select both music style and tempo to generate your song.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation process
    toast({
      title: "Creating your song! 🎵",
      description: "AI is turning your words into music...",
    });

    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Song generated successfully! 🎉",
        description: "Your personalized song is ready to play!",
      });
      // Navigate to player page with generated song
      navigate("/player");
    }, 3000);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <Button
                onClick={handleGenerateSong}
                disabled={isGenerating}
                className="w-full h-14 text-lg font-semibold gradient-main hover:opacity-90 transition-all duration-300 btn-shadow"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Your Song...
                  </div>
                ) : (
                  "🎵 Generate My Song"
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
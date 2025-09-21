import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("weekly");

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

  const tabs = [
    { id: "weekly", label: "Weekly", icon: "📅" },
    { id: "monthly", label: "Monthly", icon: "📊" },
    { id: "alltime", label: "All Time", icon: "🏆" },
  ];

  const handlePlaySong = (songId: number, title: string) => {
    toast({
      title: `🎵 Playing "${title}"`,
      description: "Enjoy this community favorite!",
    });
    navigate(`/player/${songId}`);
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

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center p-6 card-shadow">
            <div className="text-3xl mb-2">🎵</div>
            <h3 className="font-semibold text-lg">Total Songs</h3>
            <p className="text-2xl font-bold text-primary">12,456</p>
          </Card>
          
          <Card className="text-center p-6 card-shadow">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-lg">Active Artists</h3>
            <p className="text-2xl font-bold text-primary">3,789</p>
          </Card>
          
          <Card className="text-center p-6 card-shadow">
            <div className="text-3xl mb-2">▶️</div>
            <h3 className="font-semibold text-lg">Total Plays</h3>
            <p className="text-2xl font-bold text-primary">89.2K</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;

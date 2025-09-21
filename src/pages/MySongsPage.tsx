import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Edit3, Trash2, Plus, Calendar, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MySongsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [songs, setSongs] = useState([
    {
      id: 1,
      title: "My Morning Reflection",
      createdAt: "2025-09-21",
      style: "Pop",
      tempo: "Medium",
      likes: 45,
      plays: 128,
      duration: "3:24"
    },
    {
      id: 2,
      title: "Weekend Adventures",
      createdAt: "2025-09-20",
      style: "Rock",
      tempo: "Fast", 
      likes: 32,
      plays: 89,
      duration: "2:56"
    },
    {
      id: 3,
      title: "Rainy Day Thoughts",
      createdAt: "2025-09-18",
      style: "Jazz",
      tempo: "Slow",
      likes: 67,
      plays: 234,
      duration: "4:12"
    },
    {
      id: 4,
      title: "City Life Chronicles",
      createdAt: "2025-09-15",
      style: "Electronic",
      tempo: "Very Fast",
      likes: 89,
      plays: 345,
      duration: "3:48"
    }
  ]);

  const handlePlaySong = (songId: number, title: string) => {
    toast({
      title: `🎵 Playing "${title}"`,
      description: "Enjoying your personal creation!",
    });
    navigate(`/player/${songId}`);
  };

  const handleEditSong = (songId: number, title: string) => {
    toast({
      title: `✏️ Editing "${title}"`,
      description: "Redirecting to edit mode...",
    });
    // In a real app, this would navigate to an edit page
  };

  const handleDeleteSong = (songId: number) => {
    setSongs(songs.filter(song => song.id !== songId));
    toast({
      title: "🗑️ Song deleted",
      description: "Your song has been removed from your collection.",
    });
  };

  const handleCreateNew = () => {
    navigate("/");
    toast({
      title: "🎵 Create new song",
      description: "Let's turn your thoughts into music!",
    });
  };

  const getStyleIcon = (style: string) => {
    const icons: { [key: string]: string } = {
      "Pop": "🎤",
      "Rock": "🎸", 
      "Jazz": "🎺",
      "Electronic": "🎛️",
      "Rap": "🎙️",
      "Ballad": "💕"
    };
    return icons[style] || "🎵";
  };

  const getTempoColor = (tempo: string) => {
    const colors: { [key: string]: string } = {
      "Slow": "bg-blue-100 text-blue-800",
      "Medium": "bg-green-100 text-green-800",
      "Fast": "bg-orange-100 text-orange-800",
      "Very Fast": "bg-red-100 text-red-800"
    };
    return colors[tempo] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold mb-4 text-primary">🎵 My Songs</h1>
          <p className="text-muted-foreground text-lg">
            Your personal collection of AI-generated songs
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4 card-shadow">
            <div className="text-2xl font-bold text-primary">{songs.length}</div>
            <div className="text-sm text-muted-foreground">Total Songs</div>
          </Card>
          
          <Card className="text-center p-4 card-shadow">
            <div className="text-2xl font-bold text-primary">
              {songs.reduce((acc, song) => acc + song.likes, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Likes</div>
          </Card>
          
          <Card className="text-center p-4 card-shadow">
            <div className="text-2xl font-bold text-primary">
              {songs.reduce((acc, song) => acc + song.plays, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Plays</div>
          </Card>
          
          <Card className="text-center p-4 card-shadow">
            <div className="text-2xl font-bold text-primary">
              {new Set(songs.map(song => song.style)).size}
            </div>
            <div className="text-sm text-muted-foreground">Styles Tried</div>
          </Card>
        </div>

        {/* Songs List */}
        <div className="space-y-4 mb-8">
          {songs.map((song) => (
            <Card key={song.id} className="card-shadow hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl">
                      {getStyleIcon(song.style)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1">{song.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {song.createdAt}
                        </span>
                        <span>Duration: {song.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getStyleIcon(song.style)} {song.style}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${getTempoColor(song.tempo)}`}>
                          {song.tempo}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {song.likes} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {song.plays} plays
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handlePlaySong(song.id, song.title)}
                      variant="default"
                      className="gradient-main hover:opacity-90 btn-shadow"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>
                    
                    <Button 
                      onClick={() => handleEditSong(song.id, song.title)}
                      variant="outline"
                      className="btn-shadow"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="btn-shadow">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{song.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your song from your collection.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteSong(song.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete Song
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Song Button */}
        <div className="text-center">
          <Button 
            onClick={handleCreateNew}
            size="lg"
            className="px-8 py-4 text-lg font-semibold gradient-main hover:opacity-90 player-shadow"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Song
          </Button>
        </div>

        {/* Empty State (if no songs) */}
        {songs.length === 0 && (
          <Card className="text-center p-12 card-shadow">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-2xl font-bold mb-2">No songs yet</h3>
            <p className="text-muted-foreground mb-6">
              Start creating your first AI-generated song from your thoughts and experiences
            </p>
            <Button 
              onClick={handleCreateNew}
              size="lg"
              className="gradient-main hover:opacity-90 btn-shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Song
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MySongsPage;
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostCard } from "@/components/forum/PostCard";
import { CreatePostModal } from "@/components/forum/CreatePostModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface Post {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  comments: Array<{
    id: number;
    content: string;
    author: {
      id: number;
      firstName: string;
      lastName: string;
      avatar?: string;
      role: string;
    };
    createdAt: string;
  }>;
}

export const Forum = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/forum/posts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des posts");
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const handleLike = (postId: number) => {
    // La logique de like est gérée dans PostCard
    // On peut juste rafraîchir les posts si nécessaire
    fetchPosts();
  };

  const handleCommentAdded = () => {
    fetchPosts();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Forum</h1>
            <p className="text-muted-foreground mt-1">
              Partagez vos idées, posez des questions et interagissez avec la communauté
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            <CreatePostModal onPostCreated={handlePostCreated} />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">
              Aucun post pour le moment. Soyez le premier à publier !
            </p>
            <CreatePostModal onPostCreated={handlePostCreated} />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handlePostDeleted}
                onCommentAdded={handleCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};



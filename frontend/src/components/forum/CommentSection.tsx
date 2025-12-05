import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Comment {
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
}

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  onCommentAdded: () => void;
}

export const CommentSection = ({ postId, comments, onCommentAdded }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du commentaire");
      }

      const newComment = await response.json();
      setLocalComments([...localComments, newComment]);
      setCommentText("");
      onCommentAdded();
      toast({
        title: "Succès",
        description: "Commentaire ajouté",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/forum/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setLocalComments(localComments.filter((c) => c.id !== commentId));
      onCommentAdded();
      toast({
        title: "Succès",
        description: "Commentaire supprimé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3">
        {localComments.map((comment) => {
          const initials = `${comment.author.firstName[0]}${comment.author.lastName[0]}`;
          const canDelete = user?.id === comment.author.id || user?.role === "ADMIN";

          return (
            <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">
                    {comment.author.firstName} {comment.author.lastName}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {comment.author.role}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Ajouter un commentaire..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="min-h-[80px]"
        />
        <Button type="submit" disabled={isSubmitting || !commentText.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};



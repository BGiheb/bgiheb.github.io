import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Paperclip, Bot, User, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: Array<{
    documentId: number;
    text: string;
    similarity: number;
  }>;
}

interface ChatInterfaceProps {
  classId?: string;
}

export const ChatInterface = ({ classId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Bonjour ! Je suis votre assistant IA pour cette classe. Je peux répondre à vos questions en me basant sur les documents uploadés dans cette classe. Comment puis-je vous aider aujourd'hui ?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState<{
    documents: number;
    embeddings: number;
    lmStudio: { connected: boolean };
    status: string;
  } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Vérifier l'état du RAG au chargement
  useEffect(() => {
    if (classId) {
      checkRAGStatus();
    }
  }, [classId]);

  const checkRAGStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/rag/class/${classId}/status`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRagStatus(data);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut RAG:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !classId) return;

    const question = inputValue.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      content: question,
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/rag/class/${classId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la génération de la réponse");
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        role: "assistant",
        timestamp: new Date(),
        sources: data.sources || [],
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer une réponse",
        variant: "destructive",
      });
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Alert */}
      {ragStatus && (
        <div className="p-4 border-b border-card-border">
          {ragStatus.embeddings === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Base de connaissances vide</AlertTitle>
              <AlertDescription>
                Aucun document n'a été traité. Uploadez des documents (PDF, DOCX, TXT, MD) pour que l'assistant puisse répondre.
              </AlertDescription>
            </Alert>
          ) : !ragStatus.lmStudio.connected ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>LM Studio non connecté</AlertTitle>
              <AlertDescription>
                {ragStatus.embeddings} documents traités. LM Studio n'est pas accessible. L'assistant utilisera un mode fallback.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-success/10 border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">Système RAG opérationnel</AlertTitle>
              <AlertDescription className="text-success/80">
                {ragStatus.embeddings} chunks disponibles dans {ragStatus.documents} document(s). LM Studio connecté.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-[80%] space-y-1",
                message.role === "user" ? "items-end" : "items-start"
              )}>
                <Card className={cn(
                  "p-3 border-card-border",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "glass"
                )}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </Card>
                
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-success/10">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-destructive/10">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-3 glass border-card-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                  <span className="text-sm text-foreground-muted">L'assistant réfléchit...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-card-border p-4">
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" className="hover:bg-surface-elevated">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre question..."
              className="resize-none glass border-input-border focus:border-primary min-h-[44px] max-h-32"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Phone, Video } from "lucide-react";

interface Message {
  id: number;
  content: string;
  senderId: number;
  recipientId: number;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export const MessagingInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStudent = user?.role === "STUDENT";

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setConversations(response.data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages(response.data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const endpoint = isStudent 
        ? `${import.meta.env.VITE_API_URL}/api/messages/to-teacher` 
        : `${import.meta.env.VITE_API_URL}/api/messages/to-student`;
      
      const payload = isStudent 
        ? { teacherId: selectedConversation, content: newMessage } 
        : { studentId: selectedConversation, content: newMessage };

      await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Ajouter le message à la liste locale
      const newMsg: Message = {
        id: Date.now(), // Temporaire jusqu'à la réponse du serveur
        content: newMessage,
        senderId: user?.id || 0,
        recipientId: selectedConversation,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setMessages([...messages, newMsg]);
      setNewMessage("");
      
      // Mettre à jour la conversation dans la liste
      fetchConversations();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r bg-background">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Conversations</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {loading && conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Chargement...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.user.id}
                className={`p-4 border-b cursor-pointer hover:bg-accent/50 ${
                  selectedConversation === conversation.user.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedConversation(conversation.user.id)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    {conversation.user.avatar ? (
                      <img
                        src={conversation.user.avatar}
                        alt={`${conversation.user.firstName} ${conversation.user.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">
                        {conversation.user.firstName} {conversation.user.lastName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* En-tête de la conversation */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">
                  {conversations.find(c => c.user.id === selectedConversation)?.user.firstName}{" "}
                  {conversations.find(c => c.user.id === selectedConversation)?.user.lastName}
                </h2>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" title="Appel audio (bientôt disponible)">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Appel vidéo (bientôt disponible)">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && messages.length === 0 ? (
                <div className="text-center text-muted-foreground">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  Aucun message. Commencez la conversation !
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent"
                      }`}
                    >
                      <p>{message.content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.senderId === user?.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Sélectionnez une conversation pour commencer à discuter
          </div>
        )}
      </div>
    </div>
  );
};
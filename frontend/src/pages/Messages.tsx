import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagingInterface } from "@/components/messaging/MessagingInterface";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Search, Phone, Video, Star, Archive, Paperclip, Send } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    fetchStudents();
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération du rôle");
      const data = await response.json();
      setUserRole(data.role || "user"); // Assume 'user' if role is not provided
      console.log("Rôle de l'utilisateur:", data.role);
    } catch (error) {
      console.error("Erreur lors de la récupération du rôle:", error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des conversations");
      const data = await response.json();
      console.log("Conversations reçues:", data);
      data.forEach(conv => {
        if (conv.isIndividual && !conv.studentId && !conv.userId) {
          console.warn("Conversation individuelle sans studentId ni userId:", conv);
        }
      });
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        const validConversation = data.find(conv => conv.isIndividual ? (conv.studentId || conv.userId) : true);
        if (validConversation) {
          setSelectedConversation(validConversation);
          fetchMessages(validConversation);
        } else {
          console.warn("Aucune conversation valide trouvée");
        }
      }
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const fetchMessages = async (conversation) => {
    if (!conversation) return;
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/messages/messages/${conversation.id}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des étudiants");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

 const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedConversation) {
    toast({ title: "Erreur", description: "Aucun message ou conversation sélectionnée", variant: "destructive" });
    return;
  }
  if (selectedConversation.isIndividual && !selectedConversation.studentId && !selectedConversation.userId) {
    console.error("studentId et userId manquants pour la conversation individuelle:", JSON.stringify(selectedConversation, null, 2));
    toast({ title: "Erreur", description: "Destinataire non valide pour cette conversation", variant: "destructive" });
    return;
  }
  console.log("Envoi du message dans la conversation:", JSON.stringify(selectedConversation, null, 2));
  try {
    const recipientId = selectedConversation.studentId || selectedConversation.userId; // Utiliser le premier ID disponible
    const recipientType = selectedConversation.studentId ? "student" : "user";

    if (!recipientId) {
      console.error("recipientId manquant:", { selectedConversation: JSON.stringify(selectedConversation, null, 2) });
      toast({ title: "Erreur", description: "Destinataire non valide pour cette conversation", variant: "destructive" });
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: newMessage,
        conversationId: selectedConversation.id,
        recipientId,
        recipientType,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'envoi du message");
    }
    const data = await response.json();
    setMessages([
      ...messages,
      {
        id: data.id,
        sender: "Vous",
        content: newMessage,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
        avatar: "",
      },
    ]);
    setNewMessage("");
    fetchConversations();
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    toast({ title: "Erreur", description: error.message, variant: "destructive" });
  }
};

  const handleSendMessageToRecipient = async () => {
    if (!newMessage.trim()) {
      toast({ title: "Erreur", description: "Le message est vide", variant: "destructive" });
      return;
    }
    if (!selectedRecipient || !selectedRecipient.id) {
      console.error("selectedRecipient invalide:", selectedRecipient);
      toast({ title: "Erreur", description: "Aucun destinataire sélectionné", variant: "destructive" });
      return;
    }
    console.log("Envoi du message à:", selectedRecipient);

    try {
      const existingConversation = conversations.find(
        (c) => c.isIndividual && (c.studentId === selectedRecipient.id || c.userId === selectedRecipient.id)
      );

      const conversationId = existingConversation
        ? existingConversation.id
        : `student-${selectedRecipient.id}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          recipientId: selectedRecipient.id,
          recipientType: selectedRecipient.type,
          conversationId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur inconnue");
      }
      const data = await response.json();

      if (!existingConversation) {
        const newConversation = {
          id: data.conversationId,
          name: selectedRecipient.name,
          avatar: "",
          lastMessage: newMessage,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          unread: 0,
          isIndividual: true,
          studentId: selectedRecipient.type === "student" ? selectedRecipient.id : null,
          userId: selectedRecipient.type === "user" ? selectedRecipient.id : null,
        };
        setConversations((prev) => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
      } else {
        setSelectedConversation(existingConversation);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          sender: "Vous",
          content: newMessage,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          isOwn: true,
          avatar: "",
        },
      ]);
      setNewMessage("");
      setSelectedRecipient(null);
      setIsRecipientDialogOpen(false);
      fetchConversations();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error.message);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-6rem)] flex gap-6 p-6">
        <Card className="w-80 glass border-card-border flex flex-col shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={() => setIsRecipientDialogOpen(true)}
                title="Nouveau message"
                aria-label="Nouveau message"
              >
                <Plus className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Rechercher une conversation..."
                className="pl-10 glass border-card-border rounded-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="glass border-card-border text-xs hover:bg-primary/10"
              >
                <Filter className="h-3 w-3 mr-1" />
                Tous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="glass border-card-border text-xs hover:bg-primary/10"
              >
                Non lus
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {conversations
                  .filter((conversation) =>
                    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedConversation?.id === conversation.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-surface-elevated"
                      }`}
                      onClick={() => {
                        console.log("Conversation sélectionnée:", conversation);
                        setSelectedConversation(conversation);
                        fetchMessages(conversation);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {conversation.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm truncate">{conversation.name}</p>
                            <span className="text-xs text-foreground-muted">{conversation.time}</span>
                          </div>
                          <p className="text-xs text-foreground-muted truncate">{conversation.lastMessage}</p>
                          {conversation.isIndividual ? (
                            <Badge
                              variant="secondary"
                              className="bg-accent/20 text-accent border-accent/30 text-xs mt-1"
                            >
                              Individuel
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-accent/20 text-accent border-accent/30 text-xs mt-1"
                            >
                              {conversation.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>

          <Dialog open={isRecipientDialogOpen} onOpenChange={setIsRecipientDialogOpen}>
            <DialogContent className="sm:max-w-[425px] glass border-card-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Nouveau message</DialogTitle>
              </DialogHeader>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <Input
                  placeholder="Rechercher un destinataire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass border-card-border rounded-full text-sm"
                />
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {students
                    .filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((student) => (
                      <div
                        key={student.id}
                        className="p-2 hover:bg-primary/10 rounded-lg cursor-pointer flex items-center gap-2 transition-all duration-200"
                        onClick={() => {
                          console.log("Destinataire sélectionné:", student);
                          setSelectedRecipient({ id: student.id, name: student.name, type: userRole === "student" ? "user" : "student" });
                          setIsRecipientDialogOpen(false);
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name.split(" ")[0][0] + (student.name.split(" ")[1]?.[0] || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-foreground-muted">{student.classCode}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </Card>

        <Card className="flex-1 glass border-card-border flex flex-col shadow-lg">
          <CardHeader className="pb-4 border-b border-card-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation?.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedConversation?.name}</h3>
                  <div className="flex items-center gap-2">
                    {selectedConversation?.isIndividual ? (
                      <Badge
                        variant="secondary"
                        className="bg-accent/20 text-accent border-accent/30 text-xs"
                      >
                        Individuel
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-accent/20 text-accent border-accent/30 text-xs"
                      >
                        {selectedConversation?.name}
                      </Badge>
                    )}
                    <span
                      className={`text-xs ${
                        selectedConversation?.online ? "text-success" : "text-foreground-muted"
                      }`}
                    >
                      {selectedConversation?.online ? "En ligne" : "Hors ligne"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    message.isOwn ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {message.sender.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[60%] ${
                      message.isOwn ? "ml-auto" : "mr-auto"
                    } flex flex-col`}
                  >
                    <div
                      className={`p-3 rounded-2xl shadow-sm ${
                        message.isOwn
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p
                      className={`text-xs text-foreground-muted mt-1 ${
                        message.isOwn ? "text-right" : "text-left"
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-card-border">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="glass border-card-border rounded-full text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newMessage.trim()) {
                      if (selectedConversation) {
                        handleSendMessage();
                      } else if (selectedRecipient) {
                        handleSendMessageToRecipient();
                      }
                    }
                  }}
                />
              </div>
              <Button
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground rounded-full"
                disabled={!newMessage.trim() || (!selectedConversation && !selectedRecipient)}
                onClick={() => {
                  if (selectedConversation) {
                    handleSendMessage();
                  } else if (selectedRecipient) {
                    handleSendMessageToRecipient();
                  }
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Messages;
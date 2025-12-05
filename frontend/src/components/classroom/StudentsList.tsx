import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  UserPlus, 
  MoreVertical,
  Mail,
  MessageSquare,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-success";
    case "INACTIVE":
      return "bg-warning";
    case "PAUSED":
      return "bg-muted-foreground";
    default:
      return "bg-muted-foreground";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "En ligne";
    case "INACTIVE":
      return "Absent";
    case "PAUSED":
      return "Hors ligne";
    default:
      return "Inconnu";
  }
};

export const StudentsList = () => {
  const { id } = useParams(); // Récupérer l'ID de la classe depuis l'URL
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/class/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setStudents(response.data.students || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [id]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleInvite = async () => {
    const emailArray = emails.split(',').map(email => email.trim()).filter(email => email);
    if (emailArray.length === 0) {
      setInviteStatus("Veuillez entrer au moins un email.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/class/${id}/invite-students`,
        { emails: emailArray },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setInviteStatus(response.data.message);
      setEmails(""); // Réinitialiser le champ après succès
    } catch (err) {
      setInviteStatus(`Erreur : ${err.response?.data?.error || err.message}`);
    }
  };

  if (isLoading) return <div className="p-4">Chargement des étudiants...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur : {error}</div>;

  return (
    <Card className="glass border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Étudiants ({students.length})
          </CardTitle>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-input-border focus:border-primary"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-card-border hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(student.status)}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{student.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {getStatusText(student.status)}
                  </Badge>
                </div>
                <p className="text-xs text-foreground-muted truncate">{student.email}</p>
                <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                  <span>{student.messagesCount || 0} messages</span>
                  <span>•</span>
                  <span>{student.lastActivity}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Envoyer un message"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Envoyer un email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-card-border" align="end">
                  <DropdownMenuItem className="hover:bg-surface-elevated cursor-pointer">
                    Voir le profil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-surface-elevated cursor-pointer">
                    Statistiques
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-surface-elevated cursor-pointer text-destructive">
                    Retirer de la classe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-foreground-muted">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun étudiant trouvé</p>
            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass border-card-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Inviter des étudiants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Entrez les emails (séparés par des virgules, ex: email1@example.com, email2@example.com)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="glass border-input-border focus:border-primary"
            />
            {inviteStatus && <p className={inviteStatus.includes("Erreur") ? "text-red-500" : "text-green-500"}>{inviteStatus}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button className="bg-gradient-primary hover:opacity-90" onClick={handleInvite}>
              <Mail className="h-4 w-4 mr-2" />
              Envoyer les invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
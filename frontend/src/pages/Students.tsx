import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Search, 
  Filter, 
  Mail,
  Calendar,
  MoreHorizontal,
  UserPlus,
  BookOpen,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/students`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des étudiants");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/class/my-classes`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des classes");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleInvite = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ email: inviteEmail, classId: selectedClassId }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      toast({ title: "Succès", description: data.message });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setSelectedClassId("");
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Étudiants</h1>
            <p className="text-foreground-muted">
              Gérez tous vos étudiants et suivez leur progression
            </p>
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter un étudiant
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="glass border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-foreground-muted">Total étudiants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {students.reduce((sum, s) => sum + s.participation, 0) / (students.length || 1)}%
                  </p>
                  <p className="text-sm text-foreground-muted">Taux d'engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {students.reduce((sum, s) => sum + s.messages, 0)}
                  </p>
                  <p className="text-sm text-foreground-muted">Messages ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-sm text-foreground-muted">Classes actives</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input 
              placeholder="Rechercher un étudiant..." 
              className="pl-10 glass border-card-border"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="glass border-card-border">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button variant="outline" size="sm" className="glass border-card-border">
              <Calendar className="h-4 w-4 mr-2" />
              Activité
            </Button>
          </div>
        </div>

        {/* Students Table */}
        <Card className="glass border-card-border">
          <CardHeader>
            <CardTitle>Liste des étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-card-border">
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="border-card-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-foreground-muted">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.classes.map((classCode) => (
                          <Badge 
                            key={classCode} 
                            variant="secondary" 
                            className="bg-accent/20 text-accent border-accent/30 text-xs"
                          >
                            {classCode}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-secondary" />
                        <span>{student.messages}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-primary"
                            style={{ width: `${student.participation}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{student.participation}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground-muted">
                        {student.lastActive}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={student.status === 'active' ? 'default' : 'secondary'}
                        className={student.status === 'active' 
                          ? 'bg-success/20 text-success border-success/30' 
                          : 'bg-muted/50 text-foreground-muted border-muted'
                        }
                      >
                        {student.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Invite Modal */}
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogContent className="glass border-card-border">
            <DialogHeader>
              <DialogTitle>Inviter un étudiant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="exemple@universite.fr"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-select">Classe</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="glass border-card-border">
                    <SelectValue placeholder="Sélectionnez une classe" />
                  </SelectTrigger>
                  <SelectContent className="glass border-card-border">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.code} - {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail || !selectedClassId}>
                Envoyer l'invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Students;
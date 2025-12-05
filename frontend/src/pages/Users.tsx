import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  UserCog,
  Clock,
  BarChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

// User type definition
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  lastActive: string;
  status: string;
  avatar?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== "ADMIN") {
      navigate("/dashboard");
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits d'accès à cette page",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer la liste des utilisateurs",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Filter users based on search term and role
  useEffect(() => {
    let result = users;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          user.firstName.toLowerCase().includes(term) ||
          user.lastName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }
    
    // Filter by role
    if (roleFilter !== "ALL") {
      result = result.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, users]);

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        // Update local state
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'utilisateur",
          variant: "destructive",
        });
      }
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "INSTRUCTOR":
        return "bg-primary/20 text-primary border-primary/30";
      case "STUDENT":
        return "bg-success/20 text-success border-success/30";
      case "INSPECTOR":
        return "bg-warning/20 text-warning border-warning/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "INSTRUCTOR":
        return "Instructeur";
      case "STUDENT":
        return "Étudiant";
      case "INSPECTOR":
        return "Inspecteur";
      default:
        return role;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestion des Utilisateurs</h1>
            <p className="text-foreground-muted">
              Gérez tous les comptes utilisateurs de la plateforme
            </p>
          </div>
          
          <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input 
              placeholder="Rechercher un utilisateur..." 
              className="pl-10 glass border-card-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="glass border-card-border">
                  <Filter className="h-4 w-4 mr-2" />
                  Rôle: {roleFilter === "ALL" ? "Tous" : formatRole(roleFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRoleFilter("ALL")}>
                  Tous
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("ADMIN")}>
                  Administrateur
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("INSTRUCTOR")}>
                  Instructeur
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("STUDENT")}>
                  Étudiant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("INSPECTOR")}>
                  Inspecteur
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Users Table */}
        <Card className="glass border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Chargement des utilisateurs...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">Aucun utilisateur trouvé</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <UserCog className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeVariant(user.role)}>
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === "ACTIVE" ? "default" : "secondary"}
                          className={user.status === "ACTIVE" 
                            ? "bg-success/20 text-success border-success/30" 
                            : "bg-warning/20 text-warning border-warning/30"
                          }
                        >
                          {user.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-foreground-muted" />
                          <span className="text-sm text-foreground-muted">
                            {user.lastActive || "Jamais"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/users/${user.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/users/${user.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card className="glass border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Statistiques des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserCog className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-foreground-muted">Total utilisateurs</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <UserCog className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === "STUDENT").length}
                    </p>
                    <p className="text-xs text-foreground-muted">Étudiants</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <UserCog className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === "INSTRUCTOR").length}
                    </p>
                    <p className="text-xs text-foreground-muted">Instructeurs</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <BarChart className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.status === "ACTIVE").length}
                    </p>
                    <p className="text-xs text-foreground-muted">Utilisateurs actifs</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Users;
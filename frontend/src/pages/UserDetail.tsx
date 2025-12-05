import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  UserCog, 
  Mail, 
  Calendar, 
  Clock, 
  Key, 
  Eye, 
  EyeOff,
  BookOpen,
  MessageSquare,
  BarChart,
  Activity
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
  password?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

// Activity log type
interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

// Class type
interface Class {
  id: string;
  title: string;
  code: string;
  status: string;
  role: string;
}

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      navigate("/dashboard");
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits d'accès à cette page",
        variant: "destructive",
      });
    }
  }, [currentUser, navigate, toast]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les détails de l'utilisateur",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id, toast]);

  // Fetch user activity logs
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${id}/activity`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setActivityLogs(response.data);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      }
    };

    if (id) {
      fetchActivityLogs();
    }
  }, [id]);

  // Fetch user classes
  useEffect(() => {
    const fetchUserClasses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${id}/classes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching user classes:", error);
      }
    };

    if (id) {
      fetchUserClasses();
    }
  }, [id]);

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
        });
        
        navigate("/users");
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Chargement des détails de l'utilisateur...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-xl">Utilisateur non trouvé</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/users")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/users")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRoleBadgeVariant(user.role)}>
                  {formatRole(user.role)}
                </Badge>
                <Badge 
                  variant={user.status === "ACTIVE" ? "default" : "secondary"}
                  className={user.status === "ACTIVE" 
                    ? "bg-success/20 text-success border-success/30" 
                    : "bg-warning/20 text-warning border-warning/30"
                  }
                >
                  {user.status === "ACTIVE" ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/users/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="glass border-card-border md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profil utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserCog className="h-12 w-12 text-primary" />
                  )}
                </div>
                <h3 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-foreground-muted">{user.email}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{user.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Créé le {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Dernière activité: {user.lastActive || "Jamais"}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <div className="flex-1 relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={user.password || "••••••••"} 
                      readOnly
                      className="w-full bg-surface-elevated border border-card-border rounded-md px-3 py-2 pr-10"
                    />
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-foreground-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-foreground-muted" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {user.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-sm text-foreground-muted">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Activity, Classes, etc. */}
          <div className="md:col-span-2">
            <Tabs defaultValue="activity">
              <TabsList className="glass border-card-border">
                <TabsTrigger value="activity">Activité</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
              </TabsList>
              
              {/* Activity Logs */}
              <TabsContent value="activity" className="mt-4">
                <Card className="glass border-card-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Journal d'activité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activityLogs.length === 0 ? (
                      <p className="text-center py-4 text-foreground-muted">
                        Aucune activité enregistrée
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Détails</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>IP</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>{log.details}</TableCell>
                              <TableCell>
                                {new Date(log.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell>{log.ipAddress}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Classes */}
              <TabsContent value="classes" className="mt-4">
                <Card className="glass border-card-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classes.length === 0 ? (
                      <p className="text-center py-4 text-foreground-muted">
                        Aucune classe associée
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classes.map((classItem) => (
                          <div 
                            key={classItem.id}
                            className="p-4 rounded-lg bg-surface-elevated border border-card-border"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{classItem.title}</h4>
                              <Badge 
                                variant={classItem.status === "ACTIVE" ? "default" : "secondary"}
                                className={classItem.status === "ACTIVE" 
                                  ? "bg-success/20 text-success border-success/30" 
                                  : "bg-warning/20 text-warning border-warning/30"
                                }
                              >
                                {classItem.status === "ACTIVE" ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                              <BookOpen className="h-4 w-4" />
                              <span>Code: {classItem.code}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground-muted mt-1">
                              <UserCog className="h-4 w-4" />
                              <span>Rôle: {formatRole(classItem.role)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Statistics */}
              <TabsContent value="stats" className="mt-4">
                <Card className="glass border-card-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Statistiques d'utilisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{classes.length}</p>
                            <p className="text-xs text-foreground-muted">Classes</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <MessageSquare className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-foreground-muted">Messages</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-surface-elevated border border-card-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-warning/10">
                            <Activity className="h-4 w-4 text-warning" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{activityLogs.length}</p>
                            <p className="text-xs text-foreground-muted">Actions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Activité récente</h4>
                      <div className="h-64 bg-surface-elevated rounded-lg border border-card-border flex items-center justify-center">
                        <p className="text-foreground-muted">Graphique d'activité à venir</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDetail;
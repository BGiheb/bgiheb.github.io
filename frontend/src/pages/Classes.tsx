import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Users, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { Link } from "react-router-dom";
import { CreateClassModal } from "@/components/classroom/CreateClassModal"; 
import { useQuery } from "@tanstack/react-query"; // Importer useQuery
import axios from "axios"; // Assurez-vous d'avoir axios installé
import { useAuth } from "@/contexts/AuthContext";

const Classes = () => {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const canCreateClass = ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role || '');
  
  // Récupérer les classes via l'API - différent endpoint selon le rôle
  const { data: classes = [], isLoading, error } = useQuery({
    queryKey: ["myClasses", user?.role],
    queryFn: async () => {
      // Utiliser l'endpoint approprié selon le rôle
      const endpoint = isStudent 
        ? `${import.meta.env.VITE_API_URL}/api/class/student-only-classes` 
        : `${import.meta.env.VITE_API_URL}/api/class/my-classes`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return response.data;
    },
  });

  if (isLoading) return <div className="p-4">Chargement des classes...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur : {error.message}</div>;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Mes Classes</h1>
            <p className="text-foreground-muted">
              {isStudent ? "Accédez à vos classes et interagissez avec vos instructeurs" : "Gérez toutes vos classes et suivez leur activité"}
            </p>
          </div>
          
          {canCreateClass && (
            <CreateClassModal>
              <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle classe
              </Button>
            </CreateClassModal>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input 
              placeholder="Rechercher une classe..." 
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
              Planning
            </Button>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="glass border-card-border interactive hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{classItem.title}</CardTitle>
                    <p className="text-sm text-foreground-muted font-mono">
                      {classItem.code}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={classItem.status === 'active' ? 'default' : 'secondary'}
                      className={classItem.status === 'active' 
                        ? 'bg-success/20 text-success border-success/30' 
                        : 'bg-warning/20 text-warning border-warning/30'
                      }
                    >
                      {classItem.status === 'active' ? 'Active' : 'En pause'}
                    </Badge>
                    
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{classItem.students}</span>
                    <span className="text-xs text-foreground-muted">étudiants</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium">{classItem.messages}</span>
                    <span className="text-xs text-foreground-muted">messages</span>
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Clock className="h-4 w-4" />
                  {classItem.schedule}
                </div>

                {/* Last Activity */}
                <div className="text-xs text-foreground-muted">
                  Dernière activité: {classItem.lastActivity}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" className="flex-1 bg-gradient-primary hover:opacity-90">
                    <Link to={`/classes/${classItem.id}`}>
                      Accéder
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="glass border-card-border hover:border-primary/30"
                  >
                    Paramètres
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for when no classes */}
        {classes.length === 0 && (
          <Card className="glass border-card-border text-center py-12">
            <div className="space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-foreground-muted" />
              <div>
                <h3 className="text-lg font-semibold">Aucune classe trouvée</h3>
                <p className="text-foreground-muted">
                  Commencez par créer votre première classe
                </p>
              </div>
              <CreateClassModal>
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une classe
                </Button>
              </CreateClassModal>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Classes;
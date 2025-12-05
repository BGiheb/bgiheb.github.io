import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, MessageSquare, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const RecentClasses = ({ classes: propClasses }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(propClasses || []);
  const { toast } = useToast();

  useEffect(() => {
    if (!propClasses) {
      fetchRecentClasses();
    }
  }, [propClasses]);

  const fetchRecentClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/recent-classes`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des classes récentes");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card className="glass border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Classes récentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
            Voir tout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated border border-card-border hover:bg-surface transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{classItem.title || classItem.name}</h4>
                <p className="text-xs text-foreground-muted">Code: {classItem.code}</p>
                
                <div className="flex items-center gap-4 text-xs text-foreground-muted">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {classItem.studentsCount || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {classItem.messagesCount || 0}
                  </div>
                </div>
                
                <p className="text-xs text-foreground-muted">
                  {classItem.lastActivity ? `Il y a ${Math.floor((new Date().getTime() - new Date(classItem.lastActivity).getTime()) / 3600000)}h` : "Inconnu"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={classItem.status === "active" ? "default" : "secondary"}
                className={classItem.status === "active" 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-muted text-muted-foreground"
                }
              >
                {classItem.status === "active" ? "Actif" : "Archivé"}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={() => navigate(`/classes/${classItem.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Clock, TrendingUp } from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";

export const ClassStats = () => {
  const { id } = useParams(); // Extraire l'ID de l'URL
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/class/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const classData = response.data;
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Début de la journée
        const messagesToday = classData.messages.filter((m) => new Date(m.timestamp) >= now).length;

        setStats([
          {
            label: "Étudiants inscrits",
            value: classData.students.length.toString(),
            icon: Users,
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            label: "Messages aujourd'hui",
            value: messagesToday.toString(),
            icon: MessageSquare,
            color: "text-secondary",
            bgColor: "bg-secondary/10",
          },
          {
            label: "Temps de réponse moyen",
            value: "2m 34s", // À implémenter avec une logique réelle
            icon: Clock,
            color: "text-accent",
            bgColor: "bg-accent/10",
          },
          {
            label: "Engagement",
            value: "92%", // À implémenter avec une logique réelle
            icon: TrendingUp,
            color: "text-success",
            bgColor: "bg-success/10",
          },
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchClassData(); // Exécuter uniquement si id est défini
  }, [id]);

  if (isLoading) return <div>Chargement des statistiques...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-foreground-muted">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
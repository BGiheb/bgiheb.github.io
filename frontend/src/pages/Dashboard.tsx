import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentClasses } from "@/components/dashboard/RecentClasses";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Users, BookOpen, MessageSquare, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeClasses: 0,
    enrolledStudents: 0,
    totalMessages: 0,
    engagementRate: 0,
    changes: {
      activeClasses: "0",
      enrolledStudents: "0",
      totalMessages: "0",
      engagementRate: "0%",
    },
  });
  const [recentClasses, setRecentClasses] = useState([]);
  const [studentClasses, setStudentClasses] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    if (!isStudent) {
      fetchStats();
      fetchRecentClasses();
    } else {
      fetchStudentClasses();
    }
  }, [isStudent]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const fetchRecentClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/recent-classes`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des classes récentes");
      const data = await response.json();
      setRecentClasses(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const fetchStudentClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/class/student-only-classes`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération de vos classes");
      const data = await response.json();
      setStudentClasses(data);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      {/* Hero Section with Background */}
      <div 
        className="relative -mx-8 -mt-8 mb-8 h-48 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(240, 13, 6, 0.8), rgba(240, 12, 8, 0.9)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="relative z-10 flex items-center h-full px-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Bienvenue, <span className="gradient-text">{user?.firstName ? `${user.firstName} ${user.role === 'TEACHER' ? 'Prof.' : ''}` : 'Utilisateur'}</span>
            </h1>
            <p className="text-lg text-foreground-muted max-w-2xl">
              {isStudent 
                ? "Accédez à vos classes, communiquez avec vos enseignants et planifiez vos réunions" 
                : "Gérez vos classes, interagissez avec vos étudiants et accédez aux analytics en temps réel"
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Vue d'ensemble</h2>
            <p className="text-foreground-muted">
              {isStudent ? "Vos classes et activités" : "Activité pédagogique de cette semaine"}
            </p>
          </div>
          <QuickActions />
        </div>

        {/* Stats Cards - Only for Teachers */}
        {!isStudent && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Classes actives"
              value={stats.activeClasses.toString()}
              change={stats.changes.activeClasses}
              trend="up"
              icon={BookOpen}
              className="glass"
            />
            <StatsCard
              title="Étudiants inscrits"
              value={stats.enrolledStudents.toString()}
              change={stats.changes.enrolledStudents}
              trend="up"
              icon={Users}
              className="glass"
            />
            <StatsCard
              title="Messages échangés"
              value={stats.totalMessages.toString()}
              change={stats.changes.totalMessages}
              trend="up"
              icon={MessageSquare}
              className="glass"
            />
            <StatsCard
              title="Taux d'engagement"
              value={`${stats.engagementRate}%`}
              change={stats.changes.engagementRate}
              trend="up"
              icon={TrendingUp}
              className="glass"
            />
          </div>
        )}

        {/* Main Content Grid */}
        {!isStudent ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Charts & Analytics */}
            <div className="lg:col-span-2 space-y-8">
              <ActivityChart />
            </div>

            {/* Right Column - Classes & Notifications */}
            <div className="space-y-8">
              <RecentClasses classes={recentClasses} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-card rounded-lg border border-card-border p-6">
              <h3 className="text-xl font-semibold mb-4">Mes Classes</h3>
              {studentClasses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {studentClasses.map((classItem, index) => (
                    <div key={index} className="bg-surface-elevated rounded-lg p-4 border border-card-border">
                      <h4 className="font-medium text-lg">{classItem.name}</h4>
                      <p className="text-sm text-foreground-muted">{classItem.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {classItem.subject}
                        </span>
                        <button className="text-sm text-primary hover:underline">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground-muted">Vous n'êtes inscrit à aucune classe pour le moment.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
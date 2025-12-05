import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  MessageSquare, 
  Clock,
  BookOpen,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const Analytics = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      activeStudents: 0,
      totalMessages: 0,
      avgResponseTime: "0s",
      avgEngagement: 0,
      changes: {
        activeStudents: "0%",
        totalMessages: "0%",
        avgResponseTime: "0%",
        avgEngagement: "0%"
      }
    },
    classAnalytics: [],
    classData: [],
    participationData: [],
    messagesByDay: [],
    topStudents: []
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Fetch main analytics data
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/analytics/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        setAnalyticsData(prevData => ({
          ...prevData,
          kpis: response.data.kpis,
          messagesByDay: response.data.messagesByDay,
          topStudents: response.data.topStudents,
          classData: response.data.classData || [], // Ensure classData is updated
          participationData: response.data.participationData || [] // Ensure participationData is updated
        }));
        
        // Fetch class analytics for teachers
        if (user && user.role === 'TEACHER' && response.data.classes) {
          const classAnalyticsPromises = response.data.classes.map(async (classItem) => {
            const classAnalytics = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/analytics/class/${classItem.id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            return classAnalytics.data;
          });
          
          const classAnalyticsData = await Promise.all(classAnalyticsPromises);
          setAnalyticsData(prevData => ({
            ...prevData,
            classAnalytics: classAnalyticsData
          }));
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données d'analyse",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [toast, user]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
                <p className="text-foreground-muted">
                  Analysez les performances et l'engagement de vos classes
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="glass border-card-border">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cette semaine
                </Button>
                <Button variant="outline" className="glass border-card-border">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="glass border-card-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">{analyticsData.kpis.activeStudents}</p>
                        <div className="flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">{analyticsData.kpis.changes.activeStudents}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground-muted">Étudiants actifs</p>
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
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">{analyticsData.kpis.totalMessages}</p>
                        <div className="flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">{analyticsData.kpis.changes.totalMessages}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground-muted">Messages ce mois</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">{analyticsData.kpis.avgResponseTime}</p>
                        <div className="flex items-center gap-1 text-destructive">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm">{analyticsData.kpis.changes.avgResponseTime}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground-muted">Temps de réponse</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">{analyticsData.kpis.avgEngagement}%</p>
                        <div className="flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">{analyticsData.kpis.changes.avgEngagement}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground-muted">Taux d'engagement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Engagement Timeline */}
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution de l'engagement
                  </CardTitle>
                  <p className="text-sm text-foreground-muted">
                    Messages, étudiants actifs et réponses cette semaine
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.engagementData}>
                        <defs>
                          <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-md)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="messages"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#messagesGradient)"
                          name="Messages"
                        />
                        <Area
                          type="monotone"
                          dataKey="students"
                          stroke="hsl(var(--secondary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#studentsGradient)"
                          name="Étudiants actifs"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Performance */}
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Performance par classe
                  </CardTitle>
                  <p className="text-sm text-foreground-muted">
                    Nombre d'étudiants et taux d'engagement par classe
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.classData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-md)'
                          }}
                        />
                        <Bar 
                          dataKey="students" 
                          fill="hsl(var(--primary))" 
                          name="Étudiants"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="engagement" 
                          fill="hsl(var(--secondary))" 
                          name="Engagement %"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Participation Distribution */}
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle>Distribution de participation</CardTitle>
                  <p className="text-sm text-foreground-muted">
                    Répartition des étudiants par niveau d'activité
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.participationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        >
                          {analyticsData.participationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Classes */}
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle>Classes les plus actives</CardTitle>
                  <p className="text-sm text-foreground-muted">
                    Classées par nombre de messages
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.classData.map((classItem, index) => (
                      <div key={classItem.name} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{classItem.name}</p>
                            <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                              {classItem.messages} msg
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-3 w-3 text-foreground-muted" />
                            <span className="text-xs text-foreground-muted">
                              {classItem.students} étudiants
                            </span>
                            <span className="text-xs text-success">
                              {classItem.engagement}% engagement
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                  <p className="text-sm text-foreground-muted">
                    Derniers événements importants
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Nouveau record d'engagement</p>
                        <p className="text-xs text-foreground-muted">
                          {analyticsData.classData[0]?.name} a atteint {analyticsData.classData[0]?.engagement}% d'engagement
                        </p>
                        <p className="text-xs text-foreground-muted">Il y a 2h</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Pic d'activité détecté</p>
                        <p className="text-xs text-foreground-muted">
                          {analyticsData.classData[1]?.name} avec {analyticsData.classData[1]?.messages} messages
                        </p>
                        <p className="text-xs text-foreground-muted">Il y a 4h</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Baisse d'activité</p>
                        <p className="text-xs text-foreground-muted">
                          {analyticsData.classData[2]?.name} en dessous de la moyenne
                        </p>
                        <p className="text-xs text-foreground-muted">Il y a 1j</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Analytics;
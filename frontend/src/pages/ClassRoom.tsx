import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { DocumentsList } from "@/components/classroom/DocumentsList";
import { StudentsList } from "@/components/classroom/StudentsList";
import { ClassStats } from "@/components/classroom/ClassStats";
import { LeaveClassRequest } from "@/components/classroom/LeaveClassRequest";
import { ScheduleMeeting } from "@/components/meetings/ScheduleMeeting";
import { UpcomingMeetings } from "@/components/meetings/UpcomingMeetings";
import { 
  Copy, 
  Share2, 
  Settings, 
  Users, 
  FileText, 
  MessageSquare,
  MoreVertical,
  LogOut,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ClassRoom = () => {
  const { id } = useParams(); // Extraire l'ID de l'URL
  const [classData, setClassData] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveRequestOpen, setLeaveRequestOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const canCreateMeeting = ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role || '');
  const canShare = ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role || '');

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/class/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setClassData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchClassData(); // Exécuter uniquement si id est défini
  }, [id]);

  const copyClassCode = () => {
    if (classData) {
      navigator.clipboard.writeText(classData.code);
    }
  };

  if (isLoading) return <div className="p-4">Chargement de la classe...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur : {error}</div>;
  if (!classData) return <div className="p-4">Aucune donnée disponible</div>;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Class Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{classData.title}</h1>
              <Badge className="bg-success/10 text-success border-success/20">
                {classData.status === "ACTIVE" ? "Actif" : classData.status}
              </Badge>
            </div>
           
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <span>Code de classe:</span>
                <code className="bg-surface px-2 py-1 rounded text-primary font-mono">
                  {classData.code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyClassCode}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canShare && (
              <Button variant="outline" className="glass border-card-border">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            )}
            {canCreateMeeting && (
              <Button variant="outline" className="glass border-card-border" onClick={() => setMeetingOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Planifier une réunion
              </Button>
            )}
            {isStudent && (
              <Button variant="outline" className="glass border-card-border" onClick={() => setLeaveRequestOpen(true)}>
                <LogOut className="h-4 w-4 mr-2" />
                Demander à quitter
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="glass border-card-border">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-card-border" align="end">
                <DropdownMenuItem className="hover:bg-surface-elevated cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres de classe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <ClassStats />
        
        {/* Upcoming Meetings */}
        <UpcomingMeetings classId={id} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Documents & Students */}
          <div className="lg:col-span-1 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 glass">
                <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MessageSquare className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-6">
                <DocumentsList />
              </TabsContent>

              <TabsContent value="students" className="mt-6">
                <StudentsList />
              </TabsContent>

              <TabsContent value="chat" className="mt-6 lg:hidden">
                <Card className="glass border-card-border h-[600px]">
                  <ChatInterface classId={id} />
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Chat Interface (Desktop) */}
          <div className="hidden lg:block lg:col-span-3">
            <Card className="glass border-card-border h-[700px]">
              <CardHeader className="border-b border-card-border">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Assistant IA de la classe
                </CardTitle>
                <p className="text-sm text-foreground-muted">
                  Posez vos questions sur le contenu du cours
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <ChatInterface classId={id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Composant de demande de sortie de classe */}
      <LeaveClassRequest 
        isOpen={leaveRequestOpen} 
        onClose={() => setLeaveRequestOpen(false)} 
      />
      
      {/* Composant de planification de réunion */}
      <ScheduleMeeting
        isOpen={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        classId={id}
      />
    </AppLayout>
  );
};

export default ClassRoom;
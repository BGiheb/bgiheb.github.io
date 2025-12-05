import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { JoinMeeting } from "./JoinMeeting";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  duration: number;
  classId: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface UpcomingMeetingsProps {
  classId: string;
}

export function UpcomingMeetings({ classId }: UpcomingMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/meetings/class/${classId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        // Add classId to each meeting
        const meetingsWithClassId = response.data.map(meeting => ({
          ...meeting,
          classId
        }));
        setMeetings(meetingsWithClassId);
      } catch (err) {
        console.error("Error fetching meetings:", err);
        setError("Impossible de charger les réunions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, [classId]);

  const formatMeetingTime = (startTime: string, duration: number) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    
    return `${format(start, "HH:mm", { locale: fr })} - ${format(end, "HH:mm", { locale: fr })}`;
  };

  if (isLoading) {
    return (
      <Card className="glass border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Réunions à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Chargement des réunions...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Réunions à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Réunions à venir
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Aucune réunion planifiée
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 rounded-lg bg-surface-elevated border border-card-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{meeting.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {meeting.duration} min
                    </Badge>
                    <JoinMeeting meeting={meeting} />
                  </div>
                </div>
                
                {meeting.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {meeting.description}
                  </p>
                )}
                
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(meeting.startTime), "EEEE d MMMM", { locale: fr })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatMeetingTime(meeting.startTime, meeting.duration)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Organisé par {meeting.createdBy.firstName} {meeting.createdBy.lastName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
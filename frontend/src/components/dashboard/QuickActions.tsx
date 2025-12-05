import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Users, MessageSquare, Upload, Video, Calendar, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveClassRequest } from "../classroom/LeaveClassRequest";
import { ScheduleMeeting } from "../meetings/ScheduleMeeting";

export const QuickActions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'STUDENT';
  const canCreateClass = ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role || '');
  const canCreateMeeting = ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role || '');
  const canUpload = ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user?.role || '');
  const [leaveRequestOpen, setLeaveRequestOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const handleAction = (action) => {
    switch (action) {
      case "schedule-meeting":
        setMeetingOpen(true);
        break;
      case "leave-class":
        setLeaveRequestOpen(true);
        break;
      case "message-teacher":
        navigate("/messages");
        break;
      default:
        navigate(action);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {canUpload && (
          <Button variant="outline" size="sm" className="glass border-card-border">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              {isStudent ? "Actions" : "Nouveau"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass border-card-border" align="end">
            {canCreateClass && (
              <DropdownMenuItem 
                className="hover:bg-surface-elevated cursor-pointer"
                onClick={() => handleAction("/create-class")}
              >
                <Users className="mr-2 h-4 w-4" />
                Créer une classe
              </DropdownMenuItem>
            )}
            {!['INSPECTOR'].includes(user?.role || '') && (
              <DropdownMenuItem 
                className="hover:bg-surface-elevated cursor-pointer"
                onClick={() => isStudent ? handleAction("message-teacher") : handleAction("/messages")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {isStudent ? "Contacter l'enseignant" : "Nouvelle discussion"}
              </DropdownMenuItem>
            )}
            {canCreateMeeting && (
              <DropdownMenuItem 
                className="hover:bg-surface-elevated cursor-pointer"
                onClick={() => handleAction("schedule-meeting")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Planifier une réunion
              </DropdownMenuItem>
            )}
            {isStudent && (
              <>
                <DropdownMenuItem 
                  className="hover:bg-surface-elevated cursor-pointer"
                  onClick={() => handleAction("leave-class")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Demander à quitter une classe
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LeaveClassRequest
        open={leaveRequestOpen}
        onOpenChange={setLeaveRequestOpen}
      />
      
      <ScheduleMeeting
        isOpen={meetingOpen}
        onClose={() => setMeetingOpen(false)}
      />
    </>
  );
};
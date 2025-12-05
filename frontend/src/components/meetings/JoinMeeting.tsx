import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Video } from 'lucide-react';
import VideoCall from './VideoCall';
import { useAuth } from '@/contexts/AuthContext';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  classId: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface JoinMeetingProps {
  meeting: Meeting;
}

export const JoinMeeting: React.FC<JoinMeetingProps> = ({ meeting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  const handleJoinMeeting = () => {
    setIsOpen(true);
  };
  
  const handleEndCall = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        onClick={handleJoinMeeting}
        className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
        size="sm"
      >
        <Video className="h-4 w-4 mr-2" />
        Rejoindre
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{meeting.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <VideoCall 
              meetingId={meeting.id} 
              classId={meeting.classId} 
              onEndCall={handleEndCall} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinMeeting;
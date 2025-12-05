import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface ScheduleMeetingProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
}

export function ScheduleMeeting({ isOpen, onClose, classId }: ScheduleMeetingProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("14:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const timeOptions = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      timeOptions.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !title || !duration) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Combine date and time
      const meetingDate = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      meetingDate.setHours(hours, minutes);
      
      const meetingData = {
        classId,
        title,
        description,
        startTime: meetingDate.toISOString(),
        duration: parseInt(duration),
      };
      
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/meetings/create`, 
        meetingData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      
      toast({
        title: "Réunion planifiée",
        description: "La réunion a été planifiée avec succès.",
      });
      
      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setDate(new Date());
      setTime("14:00");
      setDuration("60");
      onClose();
      
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la planification de la réunion.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass border-card-border">
        <DialogHeader>
          <DialogTitle>Planifier une réunion</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la réunion</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Révision du chapitre 3"
              className="glass border-card-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de la réunion..."
              className="glass border-card-border"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal glass border-card-border",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass border-card-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Heure</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal glass border-card-border"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {time}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 glass border-card-border">
                  <div className="grid gap-1 max-h-[200px] overflow-y-auto">
                    {timeOptions.map((timeOption) => (
                      <Button
                        key={timeOption}
                        variant={time === timeOption ? "default" : "ghost"}
                        className="justify-start font-normal"
                        onClick={() => {
                          setTime(timeOption);
                          document.body.click(); // Close the popover
                        }}
                      >
                        {timeOption}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="glass border-card-border">
                <SelectValue placeholder="Sélectionner une durée" />
              </SelectTrigger>
              <SelectContent className="glass border-card-border">
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="90">1 heure 30</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="glass border-card-border">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Planification..." : "Planifier la réunion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
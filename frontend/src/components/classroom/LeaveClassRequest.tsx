import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeaveClassRequestProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveClassRequest = ({ isOpen, onClose }: LeaveClassRequestProps) => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/class/student-only-classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setClasses(response.data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos classes",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRequest = async () => {
    if (!selectedClass) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une classe",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/class/request-leave/${selectedClass}`,
        { reason: leaveReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      toast({
        title: "Succès",
        description: "Votre demande de sortie a été envoyée",
      });
      onClose();
      setSelectedClass("");
      setLeaveReason("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de l'envoi de la demande",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demande de sortie de classe</DialogTitle>
          <DialogDescription>
            Votre demande sera envoyée à l'enseignant pour approbation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="class-select" className="text-sm font-medium">
              Classe
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id.toString()}>
                    {classItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="leave-reason" className="text-sm font-medium">
              Raison
            </label>
            <Textarea
              id="leave-reason"
              placeholder="Expliquez pourquoi vous souhaitez quitter cette classe"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleLeaveRequest} disabled={isLoading}>
            {isLoading ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
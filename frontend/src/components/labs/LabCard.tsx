import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Lab {
  id: number;
  title: string;
  description?: string;
  vagrantBox: string;
  vagrantConfig?: string;
  vmPath?: string;
  status: "CREATED" | "RUNNING" | "STOPPED" | "ERROR";
  instructor: {
    id: number;
    firstName: string;
    lastName: string;
  };
  class?: {
    id: number;
    title: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LabCardProps {
  lab: Lab;
  onLabDeleted: () => void;
  onLabStatusChanged: () => void;
}

export const LabCard = ({ lab, onLabDeleted, onLabStatusChanged }: LabCardProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState(lab.status);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setStatus(lab.status);
  }, [lab.status]);

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/labs/${lab.id}/launch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du lancement");
      }

      toast({
        title: "Succès",
        description: "Le lab est en cours de lancement...",
      });

      // Polling pour vérifier le statut
      checkStatus();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de lancer le lab",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/labs/${lab.id}/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'arrêt");
      }

      setStatus("STOPPED");
      onLabStatusChanged();
      toast({
        title: "Succès",
        description: "Lab arrêté avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'arrêter le lab",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/labs/${lab.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      onLabDeleted();
      toast({
        title: "Succès",
        description: "Lab supprimé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le lab",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/labs/${lab.id}/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        onLabStatusChanged();
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "RUNNING":
        return <Badge className="bg-green-500">En cours</Badge>;
      case "STOPPED":
        return <Badge variant="secondary">Arrêté</Badge>;
      case "ERROR":
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Créé</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {lab.title}
              {getStatusBadge()}
            </CardTitle>
            {lab.class && (
              <p className="text-sm text-muted-foreground mt-1">
                Classe: {lab.class.title} ({lab.class.code})
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lab.description && (
          <p className="text-sm text-muted-foreground mb-4">{lab.description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="text-sm">
            <span className="font-medium">Box Vagrant:</span>{" "}
            <code className="text-xs bg-muted px-2 py-1 rounded">{lab.vagrantBox}</code>
          </div>
          {lab.vagrantConfig && (
            <div className="text-sm">
              <span className="font-medium">Configuration:</span>{" "}
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {JSON.stringify(JSON.parse(lab.vagrantConfig), null, 2)}
              </code>
            </div>
          )}
          {lab.vmPath && (
            <div className="text-sm">
              <span className="font-medium">Chemin Lab:</span>{" "}
              <code className="text-xs bg-muted px-2 py-1 rounded">{lab.vmPath}</code>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Créé {formatDistanceToNow(new Date(lab.createdAt), { addSuffix: true, locale: fr })}
          </p>
          <div className="flex gap-2">
            {status === "CREATED" || status === "STOPPED" || status === "ERROR" ? (
              <Button
                size="sm"
                onClick={handleLaunch}
                disabled={isLoading}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Lancer
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                disabled={isLoading}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Arrêter
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={checkStatus}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={isLoading} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le lab</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce lab ? La VM associée sera également supprimée.
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {status === "ERROR" && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Erreur</p>
              <p className="text-xs text-muted-foreground">
                Une erreur s'est produite lors du lancement de la VM. Vérifiez les logs et réessayez.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


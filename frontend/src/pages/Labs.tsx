import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LabCard } from "@/components/labs/LabCard";
import { CreateLabModal } from "@/components/labs/CreateLabModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, FlaskConical } from "lucide-react";

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

export const Labs = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchLabs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/labs/my-labs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des labs");
      }

      const data = await response.json();
      setLabs(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les labs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleLabCreated = () => {
    fetchLabs();
  };

  const handleLabDeleted = () => {
    fetchLabs();
  };

  const handleLabStatusChanged = () => {
    fetchLabs();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLabs();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FlaskConical className="h-8 w-8" />
              Labs Virtuels
            </h1>
            <p className="text-muted-foreground mt-1">
              Créez et gérez des environnements virtuels pour vos étudiants
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            <CreateLabModal onLabCreated={handleLabCreated} />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-[300px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucun lab pour le moment. Créez votre premier lab virtuel !
            </p>
            <CreateLabModal onLabCreated={handleLabCreated} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                onLabDeleted={handleLabDeleted}
                onLabStatusChanged={handleLabStatusChanged}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};


import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CreateLabModalProps {
  onLabCreated: () => void;
  children?: React.ReactNode;
}

interface Class {
  id: number;
  title: string;
  code: string;
}

export const CreateLabModal = ({ onLabCreated, children }: CreateLabModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vagrantBox, setVagrantBox] = useState("ubuntu/jammy64");
  const [memory, setMemory] = useState("1024");
  const [cpus, setCpus] = useState("1");
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.role === "INSTRUCTOR") {
      fetchClasses();
    }
  }, [open, user]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/class/my-classes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !vagrantBox.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et la box Vagrant sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vagrantConfig = {
        box: vagrantBox,
        memory: memory || "1024",
        cpus: parseInt(cpus) || 1,
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/labs/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title,
          description: description || null,
          vagrantBox,
          vagrantConfig,
          classId: classId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création du lab");
      }

      setTitle("");
      setDescription("");
      setVagrantBox("ubuntu/jammy64");
      setMemory("1024");
      setCpus("1");
      setClassId("");
      setOpen(false);
      onLabCreated();
      toast({
        title: "Succès",
        description: "Lab créé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le lab",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau lab
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau lab</DialogTitle>
          <DialogDescription>
            Configurez un lab virtuel pour vos étudiants
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du lab *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lab Linux - Configuration réseau"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du lab..."
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vagrantBox">Box Vagrant *</Label>
            <Input
              id="vagrantBox"
              value={vagrantBox}
              onChange={(e) => setVagrantBox(e.target.value)}
              placeholder="ubuntu/jammy64"
              required
            />
            <p className="text-xs text-muted-foreground">
              Box Vagrant à utiliser (ex: ubuntu/jammy64, centos/7, debian/bullseye64)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="memory">Mémoire (MB)</Label>
              <Input
                id="memory"
                type="number"
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                placeholder="1024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpus">CPU</Label>
              <Input
                id="cpus"
                type="number"
                value={cpus}
                onChange={(e) => setCpus(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>
          {user?.role === "INSTRUCTOR" && (
            <div className="space-y-2">
              <Label htmlFor="classId">Classe (optionnel)</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune classe</SelectItem>
                  {loadingClasses ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.title} ({cls.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer le lab"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


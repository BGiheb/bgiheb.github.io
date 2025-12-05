import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CreateClassModal = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    schedule: "",
    emails: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const emailsArray = formData.emails.split(",").map((email) => email.trim()).filter(Boolean);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/class/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Vérifiez que le token est présent
      },
      body: JSON.stringify({ ...formData, emails: emailsArray }),
    });

    const responseText = await response.text();
    if (!response.ok) throw new Error(responseText || "Erreur lors de la création");

    const data = JSON.parse(responseText);
    toast({ title: "Succès", description: "Classe créée avec succès !" });
    setOpen(false);
    navigate(`/classes/${data.id}`);
  } catch (error) {
    toast({ title: "Erreur", description: error.message, variant: "destructive" });
    console.error("Error details:", error); // Ajoutez un log pour débogage
  }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une nouvelle classe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" value={formData.code} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="schedule">Horaire</Label>
            <Input id="schedule" name="schedule" value={formData.schedule} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="emails">Emails des étudiants (séparés par des virgules)</Label>
            <Input id="emails" name="emails" value={formData.emails} onChange={handleInputChange} required />
          </div>
          <Button type="submit" className="w-full">Créer et inviter</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
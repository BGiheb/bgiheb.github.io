import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, Mail, User, Building } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    console.log("Token dans RegisterForm:", token);
  }, [token]);

  const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          organization: formData.organization,
          role: formData.role 
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(responseText || "Erreur d'inscription");
      }

      if (!response.ok) {
        throw new Error(data.error || responseText || "Erreur d'inscription");
      }

      if (!data.token) {
        throw new Error("Token manquant dans la réponse");
      }

      localStorage.setItem("token", data.token);

      toast({ title: "Inscription réussie", description: "Votre compte a été créé !" });
      if (token) {
        // Vérifiez si l'email correspond à l'invitation
        try {
          const acceptResponse = await fetch(`${apiUrl}/api/class/accept-class-invitation/${token}`, {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
          });
          const acceptText = await acceptResponse.text();
          let acceptData;
          try {
            acceptData = JSON.parse(acceptText);
          } catch {
            acceptData = { error: acceptText };
          }
          
          if (!acceptResponse.ok) {
            if (acceptData.error && acceptData.error.includes("email")) {
              toast({ title: "Erreur", description: acceptData.error, variant: "destructive" });
            } else {
              toast({ title: "Avertissement", description: acceptData.error || "Impossible d'accepter l'invitation", variant: "destructive" });
            }
            navigate("/dashboard");
          } else {
            toast({ title: "Succès", description: acceptData.message || "Invitation acceptée" });
            navigate(acceptData.redirect || "/dashboard");
          }
        } catch (acceptError) {
          console.error("Erreur lors de l'acceptation de l'invitation:", acceptError);
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue lors de l'inscription", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            Prénom
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="pl-10 glass border-input-border focus:border-primary focus:ring-primary/20"
              placeholder="Jean"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Nom
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className="glass border-input-border focus:border-primary focus:ring-primary/20"
            placeholder="Dupont"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Adresse email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="pl-10 glass border-input-border focus:border-primary focus:ring-primary/20"
            placeholder="jean.dupont@entreprise.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization" className="text-sm font-medium">
          Organisation <span className="text-foreground-muted text-xs">(optionnel)</span>
        </Label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            id="organization"
            type="text"
            value={formData.organization}
            onChange={(e) => handleInputChange("organization", e.target.value)}
            className="pl-10 glass border-input-border focus:border-primary focus:ring-primary/20"
            placeholder="Nom de votre entreprise"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-sm font-medium">
          Rôle
        </Label>
        <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
          <SelectTrigger className="glass border-input-border focus:border-primary focus:ring-primary/20">
            <SelectValue placeholder="Sélectionnez votre rôle" />
          </SelectTrigger>
          <SelectContent className="glass border-card-border">
            <SelectItem value="TEACHER">Enseignant</SelectItem>
            <SelectItem value="ADMIN">Administrateur</SelectItem>
            <SelectItem value="COORDINATOR">Coordinateur pédagogique</SelectItem>
            <SelectItem value="STUDENT">Étudiant</SelectItem>
            <SelectItem value="INSTRUCTOR">Instructeur</SelectItem>
            <SelectItem value="INSPECTOR">Inspecteur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="pr-10 glass border-input-border focus:border-primary focus:ring-primary/20"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmer le mot de passe
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            className="pr-10 glass border-input-border focus:border-primary focus:ring-primary/20"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          className="w-4 h-4 mt-1 rounded border-input-border bg-input text-primary focus:ring-primary/20"
          required
        />
        <label htmlFor="terms" className="text-sm text-foreground-muted">
          J'accepte les{" "}
          <button type="button" className="text-primary hover:text-primary-light transition-colors">
            conditions d'utilisation
          </button>{" "}
          et la{" "}
          <button type="button" className="text-primary hover:text-primary-light transition-colors">
            politique de confidentialité
          </button>
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Création du compte...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Créer mon compte
          </div>
        )}
      </Button>
    </form>
  );
};
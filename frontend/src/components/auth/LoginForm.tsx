import { useState, useEffect } from "react"; // Ajoutez useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const LoginForm = ({ token: propToken }) => {
 const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = propToken || searchParams.get("token");

  useEffect(() => {
    console.log("Token dans LoginForm:", token);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast({ title: "Erreur", description: "Email et mot de passe requis", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(responseText || "Erreur de connexion");
      }

      if (!response.ok) {
        throw new Error(data.error || responseText || "Erreur de connexion");
      }

      if (!data.token) {
        throw new Error("Token manquant dans la réponse");
      }

      localStorage.setItem("token", data.token);

      if (token) {
        // Tenter d'accepter l'invitation après login
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
            if (acceptResponse.status === 401) {
              toast({ title: "Erreur", description: "Authentification requise. Veuillez réessayer.", variant: "destructive" });
            } else {
              toast({ title: "Avertissement", description: acceptData.error || "Erreur lors de l'acceptation", variant: "destructive" });
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
        toast({ title: "Connexion réussie", description: "Bienvenue sur EduPlatform !" });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue lors de la connexion", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Adresse email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 glass border-input-border focus:border-primary focus:ring-primary/20"
              placeholder="votre@email.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input-border bg-input text-primary focus:ring-primary/20"
          />
          <span className="text-foreground-muted">Se souvenir de moi</span>
        </label>
        <button
          type="button"
          className="text-primary hover:text-primary-light transition-colors"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Connexion...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Se connecter
          </div>
        )}
      </Button>
    </form>
  );
};
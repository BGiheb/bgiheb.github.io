import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm"; // Importez LoginForm comme composant réutilisable

export default function Login() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Optionnel : Pré-remplir l'email si nécessaire (basé sur le token ou une logique future)
  useEffect(() => {
    if (token) {
      console.log("Token d'invitation détecté:", token);
      // Vous pouvez ajouter une logique pour pré-remplir l'email si vous avez une API pour le récupérer
    }
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
      <LoginForm token={undefined} />
    </div>
  );
}
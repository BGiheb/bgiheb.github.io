import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export const AcceptClassInvitation = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Params:", { token });

    const handleInvitation = async () => {
      if (!token) {
        toast({ title: "Erreur", description: "Token d'invitation manquant", variant: "destructive" });
        navigate("/");
        return;
      }

      const tokenFromStorage = localStorage.getItem("token");

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/class/accept-class-invitation/${token}`, {
          headers: tokenFromStorage ? { Authorization: `Bearer ${tokenFromStorage}` } : {},
        });

        const data = response.data;
        toast({ title: "Succès", description: data.message });
        navigate(data.redirect || `/classes/${data.classId}`);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate(`/?token=${token}`); // Redirige vers / avec le token
        } else {
          toast({ title: "Erreur", description: error.response?.data?.error || "Erreur lors de l'acceptation", variant: "destructive" });
          navigate("/");
        }
      }
    };

    handleInvitation();
  }, [token, navigate, toast]);

  return <div>Processing invitation...</div>;
};
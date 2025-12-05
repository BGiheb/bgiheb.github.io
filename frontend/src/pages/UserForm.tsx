import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  ArrowLeft, 
  Save, 
  UserCog, 
  Eye, 
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  status: string;
  phone?: string;
  address?: string;
  bio?: string;
}

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "STUDENT",
    status: "ACTIVE",
    phone: "",
    address: "",
    bio: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      navigate("/dashboard");
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits d'accès à cette page",
        variant: "destructive",
      });
    }
  }, [currentUser, navigate, toast]);

  // Fetch user data if in edit mode
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isEditMode) return;
      
      try {
        setIsFetching(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        const userData = response.data;
        setFormData({
          email: userData.email || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          password: userData.password || "",
          role: userData.role || "STUDENT",
          status: userData.status || "ACTIVE",
          phone: userData.phone || "",
          address: userData.address || "",
          bio: userData.bio || ""
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les données de l'utilisateur",
          variant: "destructive",
        });
        navigate("/users");
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, [id, isEditMode, navigate, toast]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (isEditMode) {
        // Update existing user
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/users/${id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        });
      } else {
        // Create new user
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/users`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        });
      }
      
      // Redirect to users list
      navigate("/users");
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Erreur",
        description: isEditMode 
          ? "Impossible de mettre à jour l'utilisateur" 
          : "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Chargement des données...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/users")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                {isEditMode ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </h1>
              <p className="text-foreground-muted">
                {isEditMode 
                  ? "Modifier les informations de l'utilisateur" 
                  : "Créer un nouveau compte utilisateur"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Information Card */}
            <Card className="glass border-card-border md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Informations de l'utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required={!isEditMode}
                      placeholder={isEditMode ? "Laisser vide pour ne pas modifier" : ""}
                      className="pr-10"
                    />
                    <button 
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-foreground-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-foreground-muted" />
                      )}
                    </button>
                  </div>
                  {isEditMode && (
                    <p className="text-xs text-foreground-muted">
                      Laissez vide pour conserver le mot de passe actuel
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                        <SelectItem value="INSTRUCTOR">Instructeur</SelectItem>
                        <SelectItem value="STUDENT">Étudiant</SelectItem>
                        <SelectItem value="INSPECTOR">Inspecteur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="INACTIVE">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Preview Card */}
            <Card className="glass border-card-border md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Aperçu du profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <UserCog className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {formData.firstName || "Prénom"} {formData.lastName || "Nom"}
                  </h3>
                  <p className="text-foreground-muted">{formData.email || "email@exemple.com"}</p>
                  
                  <div className="mt-4 w-full">
                    <div className="p-3 rounded-lg bg-surface-elevated border border-card-border mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <UserCog className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Rôle</p>
                          <p className="text-xs text-foreground-muted">
                            {formData.role === "ADMIN" && "Administrateur"}
                            {formData.role === "INSTRUCTOR" && "Instructeur"}
                            {formData.role === "STUDENT" && "Étudiant"}
                            {formData.role === "INSPECTOR" && "Inspecteur"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-surface-elevated border border-card-border">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          formData.status === "ACTIVE" 
                            ? "bg-success/10" 
                            : "bg-warning/10"
                        }`}>
                          <UserCog className={`h-4 w-4 ${
                            formData.status === "ACTIVE" 
                              ? "text-success" 
                              : "text-warning"
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Statut</p>
                          <p className="text-xs text-foreground-muted">
                            {formData.status === "ACTIVE" ? "Actif" : "Inactif"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? "Mettre à jour" : "Créer l'utilisateur"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default UserForm;
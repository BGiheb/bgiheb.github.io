import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  CreditCard,
  Users,
  Camera,
  Save,
  Upload,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    bio: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);

  // Charger le profil au montage du composant
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération du profil");
        const data = await response.json();
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          title: data.title || "",
          bio: data.bio || "",
          avatar: data.avatar || "",
        });
      } catch (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  // Sauvegarder les modifications
  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          title: profile.title,
          bio: profile.bio,
        }),
      });
      if (!response.ok) throw new Error("Échec de la mise à jour du profil");
      const data = await response.json();
      toast({ title: "Succès", description: "Profil mis à jour avec succès", variant: "default" });
      setProfile({ ...profile, ...data }); // Mettre à jour l'état avec la réponse
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  // Gérer l'upload de l'avatar
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/avatar`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Échec de l'upload de l'avatar");
      const data = await response.json();
      setProfile({ ...profile, avatar: data.avatar });
      toast({ title: "Succès", description: "Avatar mis à jour avec succès", variant: "default" });
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  // Supprimer l'avatar
  const handleAvatarDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/avatar`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Échec de la suppression de l'avatar");
      const data = await response.json();
      setProfile({ ...profile, avatar: "" });
      toast({ title: "Succès", description: "Avatar supprimé avec succès", variant: "default" });
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Paramètres</h1>
          <p className="text-foreground-muted">
            Gérez votre profil et les préférences de l'application
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="glass border-card-border">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Organisation
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Facturation
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {profile.firstName[0] + profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" className="glass border-card-border">
                          <Camera className="h-4 w-4 mr-2" />
                          Changer la photo
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                      <Button
                        variant="outline"
                        className="glass border-card-border text-destructive"
                        onClick={handleAvatarDelete}
                        disabled={!profile.avatar}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                    <p className="text-sm text-foreground-muted">
                      JPG, PNG ou GIF. Taille max : 2MB
                    </p>
                  </div>
                </div>

                <Separator className="bg-card-border" />

                {/* Form Fields */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input 
                      id="firstName" 
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="glass border-card-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input 
                      id="lastName" 
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="glass border-card-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="glass border-card-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="glass border-card-border"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Titre/Position</Label>
                    <Input 
                      id="title" 
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      className="glass border-card-border"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Biographie</Label>
                    <Input 
                      id="bio" 
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="glass border-card-border"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
                    onClick={handleSaveProfile}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder les modifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Préférences de notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nouveaux messages</p>
                      <p className="text-sm text-foreground-muted">
                        Recevoir une notification pour chaque nouveau message
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Activité des classes</p>
                      <p className="text-sm text-foreground-muted">
                        Alertes sur l'activité inhabituelle dans vos classes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nouveaux étudiants</p>
                      <p className="text-sm text-foreground-muted">
                        Notification lors de l'inscription d'un nouvel étudiant
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Rapports hebdomadaires</p>
                      <p className="text-sm text-foreground-muted">
                        Résumé d'activité envoyé chaque lundi
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications par email</p>
                      <p className="text-sm text-foreground-muted">
                        Recevoir les notifications importantes par email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Changer le mot de passe</h4>
                    <div className="space-y-3">
                      <Input 
                        type="password" 
                        placeholder="Mot de passe actuel" 
                        className="glass border-card-border"
                      />
                      <Input 
                        type="password" 
                        placeholder="Nouveau mot de passe" 
                        className="glass border-card-border"
                      />
                      <Input 
                        type="password" 
                        placeholder="Confirmer le nouveau mot de passe" 
                        className="glass border-card-border"
                      />
                      <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                        Mettre à jour le mot de passe
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-card-border" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Authentification à deux facteurs</p>
                      <p className="text-sm text-foreground-muted">
                        Ajoutez une couche de sécurité supplémentaire
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                      Non activé
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sessions actives</p>
                      <p className="text-sm text-foreground-muted">
                        Gérer les appareils connectés à votre compte
                      </p>
                    </div>
                    <Button variant="outline" className="glass border-card-border">
                      Voir les sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Préférences d'affichage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mode sombre</p>
                      <p className="text-sm text-foreground-muted">
                        Interface optimisée pour une utilisation en faible luminosité
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Animations</p>
                      <p className="text-sm text-foreground-muted">
                        Activer les transitions et animations de l'interface
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Effets de transparence</p>
                      <p className="text-sm text-foreground-muted">
                        Glassmorphism et effets de flou dans l'interface
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div>
                    <Label className="font-medium">Langue de l'interface</Label>
                    <div className="mt-2">
                      <select className="w-full p-2 bg-input border border-input-border rounded-lg glass">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Paramètres de l'organisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nom de l'organisation</Label>
                    <Input 
                      id="orgName" 
                      defaultValue="Université de Sciences" 
                      className="glass border-card-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domaine email</Label>
                    <Input 
                      id="domain" 
                      defaultValue="universite.fr" 
                      className="glass border-card-border"
                    />
                  </div>

                  <Separator className="bg-card-border" />

                  <div>
                    <h4 className="font-medium mb-4">Invitations en attente</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                        <div>
                          <p className="font-medium">marie.dupont@universite.fr</p>
                          <p className="text-sm text-foreground-muted">Enseignant • Invité il y a 2 jours</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="glass border-card-border">
                            Renvoyer
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive glass border-card-border">
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Inviter un enseignant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="glass border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Facturation et abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Plan Professionnel</h4>
                        <p className="text-sm text-foreground-muted">
                          Classes illimitées • 1000 étudiants max • Support prioritaire
                        </p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        Actuel
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border border-card-border rounded-lg glass">
                      <h4 className="font-medium mb-2">Utilisation ce mois</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Classes actives</span>
                          <span>12 / illimité</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Étudiants</span>
                          <span>348 / 1000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Stockage</span>
                          <span>2.4 GB / 100 GB</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-card-border rounded-lg glass">
                      <h4 className="font-medium mb-2">Prochaine facturation</h4>
                      <p className="text-2xl font-bold gradient-text">89€</p>
                      <p className="text-sm text-foreground-muted">
                        Le 15 octobre 2025
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 glass border-card-border"
                      >
                        Voir la facture
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-card-border" />

                  <div>
                    <h4 className="font-medium mb-4">Historique des paiements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                        <div>
                          <p className="font-medium">Septembre 2025</p>
                          <p className="text-sm text-foreground-muted">15 sept. 2025</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">89€</p>
                          <Badge className="bg-success/20 text-success border-success/30">
                            Payé
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
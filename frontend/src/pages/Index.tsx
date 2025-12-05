import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Sparkles, Users, BarChart3 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Index = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      setActiveTab("login"); // Force l'onglet "login" si un token est présent
      console.log("Token d'invitation détecté:", token);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Panel - Hero */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-primary rounded-2xl">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">EduPlatform</h1>
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Plateforme éducative
              <span className="gradient-text"> nouvelle génération</span>
            </h2>

            <p className="text-lg text-foreground-muted mb-12 leading-relaxed">
              Révolutionnez l'apprentissage avec l'IA, des analyses avancées et une expérience utilisateur futuriste.
            </p>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">IA Conversationnelle</h3>
                  <p className="text-sm text-foreground-muted">Chatbot intelligent adapté à chaque classe</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Collaboration Avancée</h3>
                  <p className="text-sm text-foreground-muted">Gestion seamless des enseignants et étudiants</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Analytics Temps Réel</h3>
                  <p className="text-sm text-foreground-muted">KPI et insights pour optimiser l'apprentissage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
          <div className="w-full max-w-md">
            <Card className="glass border-card-border p-8">
              <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-gradient-primary rounded-2xl mb-4 lg:hidden">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Bienvenue</h2>
                <p className="text-foreground-muted">Accédez à votre plateforme éducative</p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 glass">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Connexion
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Inscription
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6">
                  <LoginForm token={token} /> {/* Passez le token comme prop */}
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                  <RegisterForm />
                </TabsContent>
              </Tabs>

              <div className="mt-8 pt-6 border-t border-card-border">
                <p className="text-xs text-center text-foreground-muted">
                  Plateforme sécurisée pour l'éducation B2B
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
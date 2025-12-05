import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Upload, 
  Download, 
  Search,
  MoreVertical,
  File,
  Image as ImageIcon,
  Video,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-4 w-4 text-destructive" />;
    case "presentation":
      return <File className="h-4 w-4 text-warning" />;
    case "document":
      return <FileText className="h-4 w-4 text-primary" />;
    case "spreadsheet":
      return <File className="h-4 w-4 text-success" />;
    case "image":
      return <ImageIcon className="h-4 w-4 text-secondary" />;
    case "video":
      return <Video className="h-4 w-4 text-accent" />;
    default:
      return <File className="h-4 w-4 text-foreground-muted" />;
  }
};

export const DocumentsList = () => {
  const { id } = useParams(); // Extraire l'ID de l'URL
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/documents/class/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setDocuments(response.data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des documents:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDocuments(); // Exécuter uniquement si id est défini
  }, [id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !id) return;

    setUploading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('classId', id);

      const response = await axios.post(`${apiUrl}/api/documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Succès",
        description: "Document uploadé avec succès",
      });

      // Recharger la liste des documents
      const docsResponse = await axios.get(`${apiUrl}/api/documents/class/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDocuments(docsResponse.data || []);

      // Réinitialiser
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'uploader le document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/documents/download/${documentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: 'blob',
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Succès",
        description: "Téléchargement démarré",
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.delete(`${apiUrl}/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });

      // Recharger la liste
      const docsResponse = await axios.get(`${apiUrl}/api/documents/class/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDocuments(docsResponse.data || []);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-4">Chargement des documents...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur : {error}</div>;

  return (
    <Card className="glass border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Documents</CardTitle>
          {user?.role && ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user.role) && (
            <Button 
              size="sm" 
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-input-border focus:border-primary"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-card-border hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-surface rounded-lg">
                {getFileIcon(doc.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.uploadedBy || 'Inconnu'}</span>
                  {doc.uploadedAt && (
                    <>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {doc.downloads} téléchargements
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                onClick={() => handleDownload(doc.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {user?.role && ['TEACHER', 'ADMIN', 'INSTRUCTOR'].includes(user.role) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass border-card-border" align="end">
                    <DropdownMenuItem 
                      className="hover:bg-surface-elevated cursor-pointer text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="text-center py-8 text-foreground-muted">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun document trouvé</p>
            <p className="text-sm">
              {searchTerm ? "Essayez de modifier vos critères de recherche" : "Aucun document n'a été uploadé pour cette classe"}
            </p>
          </div>
        )}
      </CardContent>

      {/* Dialog d'upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="glass border-card-border">
          <DialogHeader>
            <DialogTitle>Uploader un document</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier à uploader dans cette classe. Les documents serviront de base de connaissances pour l'assistant IA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Fichier (PDF, DOCX, TXT, MD)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div className="border-2 border-dashed border-card-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{selectedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-foreground-muted" />
                        <p className="text-sm text-foreground-muted">
                          Cliquez pour sélectionner un fichier
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={uploading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-gradient-primary hover:opacity-90"
              >
                {uploading ? "Upload en cours..." : "Uploader"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
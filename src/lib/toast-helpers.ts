import { toast } from "@/hooks/use-toast";

export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title: `✅ ${title}`,
    description,
    duration: 3000,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title: `❌ ${title}`,
    description,
    variant: "destructive",
    duration: 4000,
  });
};

export const showInfoToast = (title: string, description?: string) => {
  toast({
    title: `ℹ️ ${title}`,
    description,
    duration: 3000,
  });
};

export const showWarningToast = (title: string, description?: string) => {
  toast({
    title: `⚠️ ${title}`,
    description,
    duration: 3500,
  });
};

export const showLoadingToast = (title: string, description?: string) => {
  return toast({
    title: `⏳ ${title}`,
    description,
    duration: Infinity, // Ne se ferme pas automatiquement
  });
};

// Helpers spécifiques pour les actions courantes
export const toasts = {
  postCreated: () => showSuccessToast("Publication créée", "Votre post est maintenant visible"),
  postDeleted: () => showSuccessToast("Publication supprimée"),
  commentAdded: () => showSuccessToast("Commentaire ajouté", "Votre commentaire est maintenant visible"),
  replyAdded: () => showSuccessToast("Réponse ajoutée", "Votre réponse est maintenant visible"),
  profileUpdated: () => showSuccessToast("Profil mis à jour", "Vos modifications ont été enregistrées"),
  liked: () => showInfoToast("J'aime ajouté"),
  unliked: () => showInfoToast("J'aime retiré"),
  saved: () => showSuccessToast("Enregistré"),
  shared: () => showSuccessToast("Partagé"),
  
  // Erreurs
  networkError: () => showErrorToast("Erreur réseau", "Vérifiez votre connexion internet"),
  serverError: () => showErrorToast("Erreur serveur", "Réessayez dans quelques instants"),
  unauthorized: () => showErrorToast("Non autorisé", "Vous devez être connecté"),
  notFound: () => showErrorToast("Introuvable", "Cette ressource n'existe pas"),
  
  // Warnings
  unsavedChanges: () => showWarningToast("Modifications non enregistrées", "Vos changements seront perdus"),
  slowConnection: () => showWarningToast("Connexion lente", "Le chargement peut prendre du temps"),
};

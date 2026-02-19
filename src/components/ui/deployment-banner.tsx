import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

export const DeploymentBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Nouvelles fonctionnalités:</strong> Système d'amis et tendances ajoutés. 
            <span className="hidden sm:inline"> Pour activer, rebuild le backend: </span>
            <code className="hidden sm:inline bg-amber-500/20 px-2 py-0.5 rounded text-xs ml-1">
              cd backend && .\rebuild-user-service.bat
            </code>
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded hover:bg-amber-500/20 transition-colors shrink-0"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
};

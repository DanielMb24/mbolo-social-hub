import { useEffect } from "react";
import { toast } from "sonner";
import {
  appErrorEventName,
  getErrorMessage,
  type AppErrorNotification,
} from "@/lib/error-notifier";

export function ErrorNotificationBridge() {
  useEffect(() => {
    const onAppError = (event: Event) => {
      const detail = (event as CustomEvent<AppErrorNotification>).detail;
      if (!detail) return;

      const description = detail.source
        ? `${detail.message} (${detail.source})`
        : detail.message;

      if (detail.severity === "warning") {
        toast.warning(detail.title, { description });
      } else if (detail.severity === "info") {
        toast.info(detail.title, { description });
      } else {
        toast.error(detail.title, { description });
      }
    };

    const onUnhandledError = (event: ErrorEvent) => {
      toast.error("Erreur inattendue", {
        description: getErrorMessage(event.error || event.message),
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      toast.error("Erreur inattendue", {
        description: getErrorMessage(event.reason),
      });
    };

    window.addEventListener(appErrorEventName, onAppError);
    window.addEventListener("error", onUnhandledError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener(appErrorEventName, onAppError);
      window.removeEventListener("error", onUnhandledError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

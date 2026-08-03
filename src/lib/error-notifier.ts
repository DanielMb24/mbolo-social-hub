export type AppErrorSeverity = "info" | "warning" | "error";

export interface AppErrorNotification {
  id?: string;
  title: string;
  message: string;
  severity?: AppErrorSeverity;
  status?: number;
  source?: string;
}

const EVENT_NAME = "mbolo:error";
const recentErrors = new Map<string, number>();
const DEDUPE_MS = 4_000;
const TECHNICAL_ERROR_PATTERNS = [
  /FUNCTION_INVOCATION_FAILED/i,
  /A server error has occurred/i,
  /Unhandled Runtime Error/i,
  /Internal Server Error/i,
];

export const appErrorEventName = EVENT_NAME;

export function notifyAppError(notification: AppErrorNotification) {
  const severity = notification.severity || "error";
  const key = `${severity}:${notification.status || ""}:${notification.title}:${notification.message}`;
  const now = Date.now();
  const lastShownAt = recentErrors.get(key) || 0;

  if (now - lastShownAt < DEDUPE_MS) return;
  recentErrors.set(key, now);

  window.dispatchEvent(
    new CustomEvent<AppErrorNotification>(EVENT_NAME, {
      detail: {
        ...notification,
        id: notification.id || `${now}-${Math.random().toString(36).slice(2)}`,
        severity,
      },
    })
  );
}

export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue") {
  const message =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string" && error.trim()
        ? error
        : "";

  if (message && !isTechnicalErrorMessage(message)) return message;
  return fallback;
}

export function getFriendlyErrorMessage(error: unknown, fallback = "Une erreur est survenue. Réessayez dans quelques instants.") {
  return getErrorMessage(error, fallback);
}

function isTechnicalErrorMessage(message: string) {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function getHttpStatus(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { status?: number } }).response;
    return response?.status;
  }

  return undefined;
}

export function shouldNotifyHttpError(status?: number) {
  if (!status) return true;
  return status === 401 || status === 405 || status === 413 || status >= 500;
}

export function httpErrorTitle(status?: number) {
  if (!status) return "Connexion instable";
  if (status === 401) return "Session expirée";
  if (status === 405) return "Action indisponible";
  if (status === 413) return "Fichier trop lourd";
  if (status >= 500) return "Erreur serveur";
  return "Action impossible";
}

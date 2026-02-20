import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface RateLimitOptions {
  maxCalls: number;
  windowMs: number;
  message?: string;
}

/**
 * Hook de rate limiting frontend.
 * Retourne `check()` qui renvoie `true` si l'action est autorisée.
 */
export const useRateLimit = ({
  maxCalls,
  windowMs,
  message = "Vous allez trop vite ! Veuillez patienter.",
}: RateLimitOptions) => {
  const callsRef = useRef<number[]>([]);

  const check = useCallback((): boolean => {
    const now = Date.now();
    // Supprimer les appels hors fenêtre
    callsRef.current = callsRef.current.filter(t => now - t < windowMs);

    if (callsRef.current.length >= maxCalls) {
      toast.warning(message);
      return false;
    }

    callsRef.current.push(now);
    return true;
  }, [maxCalls, windowMs, message]);

  const remaining = useCallback((): number => {
    const now = Date.now();
    callsRef.current = callsRef.current.filter(t => now - t < windowMs);
    return Math.max(0, maxCalls - callsRef.current.length);
  }, [maxCalls, windowMs]);

  return { check, remaining };
};

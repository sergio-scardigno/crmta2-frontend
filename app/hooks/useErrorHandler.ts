import { useState, useCallback } from "react";
import type { ApiError } from "@/app/lib/types/resources";

interface ErrorState {
  message: string | null;
  details?: string[];
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState>({ message: null });

  const handleError = useCallback((err: unknown) => {
    console.error("Error:", err);
    
    if (err instanceof Error) {
      setError({ message: err.message });
      return;
    }

    // Si es una respuesta de la API con formato de error
    if (typeof err === "object" && err !== null && "detail" in err) {
      const apiError = err as ApiError;
      
      if (typeof apiError.detail === "string") {
        setError({ message: apiError.detail });
      } else if (Array.isArray(apiError.detail)) {
        const details = apiError.detail.map((item) => item.msg);
        setError({ 
          message: "Error de validación", 
          details 
        });
      }
      return;
    }

    setError({ message: "Ha ocurrido un error inesperado" });
  }, []);

  const clearError = useCallback(() => {
    setError({ message: null });
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}

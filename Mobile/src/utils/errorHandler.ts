/**
 * Manejador centralizado de errores
 * Soluciona: Sin manejo de errores uniforme
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
}

export const parseError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return {
      type: classifyError(error.message),
      message: error.message,
      originalError: error,
    };
  }

  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: 'Ocurrió un error inesperado',
  };
};

const classifyError = (message: string): ErrorType => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection')
  ) {
    return ErrorType.NETWORK;
  }

  if (lowerMessage.includes('token') || lowerMessage.includes('401')) {
    return ErrorType.AUTHENTICATION;
  }

  if (lowerMessage.includes('validation')) {
    return ErrorType.VALIDATION;
  }

  if (lowerMessage.includes('500') || lowerMessage.includes('server')) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
};

export const getErrorMessage = (error: AppError): string => {
  // Si tenemos un mensaje específico del error, intentamos usarlo
  const originalMsg = error.message?.trim();
  
  switch (error.type) {
    case ErrorType.NETWORK:
      return originalMsg || 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    case ErrorType.AUTHENTICATION:
      return originalMsg || 'No autorizado. Tu sesión puede haber expirado.';
    case ErrorType.VALIDATION:
      return originalMsg || 'Los datos ingresados no son válidos.';
    case ErrorType.SERVER:
      return originalMsg || 'El servidor está presentando problemas. Intenta más tarde.';
    default:
      // Retornar el mensaje original si no es genérico
      if (originalMsg && originalMsg !== 'Ocurrió un error inesperado') {
        return originalMsg;
      }
      return error.message || 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
};

// Error tracking utilities for production monitoring

export interface ErrorContext {
  userId?: string;
  botId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

// In-memory error store (in production, use Sentry or similar)
const errorStore: ErrorInfo[] = [];
const MAX_ERRORS = 1000; // Keep only last 1000 errors

export const trackError = (
  error: Error | string, 
  context?: ErrorContext,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void => {
  const errorInfo: ErrorInfo = {
    message: typeof error === 'string' ? error : error.message,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    severity,
    timestamp: new Date()
  };

  // Add to store
  errorStore.push(errorInfo);

  // Keep only last MAX_ERRORS
  if (errorStore.length > MAX_ERRORS) {
    errorStore.splice(0, errorStore.length - MAX_ERRORS);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error tracked:', {
      message: errorInfo.message,
      severity: errorInfo.severity,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp
    });
  }

  // In production, you would send to Sentry or similar service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: context });
    console.error('Production error:', errorInfo);
  }
};

// Track API errors
export const trackApiError = (
  error: Error | string,
  req: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void => {
  const context: ErrorContext = {
    endpoint: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userId: req.user?.uid,
    botId: req.query?.botId,
    sessionId: req.body?.sessionId
  };

  trackError(error, context, severity);
};

// Track authentication errors
export const trackAuthError = (
  error: Error | string,
  userId?: string,
  phoneNumber?: string
): void => {
  const context: ErrorContext = {
    userId,
    phoneNumber,
    endpoint: 'auth',
    severity: 'high'
  };

  trackError(error, context, 'high');
};

// Track database errors
export const trackDbError = (
  error: Error | string,
  operation: string,
  collection?: string,
  documentId?: string
): void => {
  const context: ErrorContext = {
    operation,
    collection,
    documentId,
    endpoint: 'database',
    severity: 'high'
  };

  trackError(error, context, 'high');
};

// Track OpenAI API errors
export const trackOpenAIError = (
  error: Error | string,
  model?: string,
  tokensUsed?: number
): void => {
  const context: ErrorContext = {
    model,
    tokensUsed,
    endpoint: 'openai',
    severity: 'medium'
  };

  trackError(error, context, 'medium');
};

// Get recent errors (for monitoring)
export const getRecentErrors = (
  limit: number = 50,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): ErrorInfo[] => {
  let filtered = errorStore;

  if (severity) {
    filtered = filtered.filter(error => error.severity === severity);
  }

  return filtered
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};

// Get error statistics
export const getErrorStats = (): {
  total: number;
  bySeverity: Record<string, number>;
  byEndpoint: Record<string, number>;
  recentErrors: ErrorInfo[];
} => {
  const bySeverity: Record<string, number> = {};
  const byEndpoint: Record<string, number> = {};

  errorStore.forEach(error => {
    // Count by severity
    bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;

    // Count by endpoint
    const endpoint = error.context?.endpoint || 'unknown';
    byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
  });

  return {
    total: errorStore.length,
    bySeverity,
    byEndpoint,
    recentErrors: getRecentErrors(10)
  };
};

// Clear error store (useful for testing)
export const clearErrorStore = (): void => {
  errorStore.length = 0;
};

// Error boundary helper
export const withErrorTracking = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      trackError(error as Error, context);
      throw error;
    }
  };
}; 
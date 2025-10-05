/**
 * Global Error Handler
 * 전역 에러를 캐치하고 처리하는 유틸리티
 */

import { logError } from '@services/errorLogging';

export interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
}

/**
 * 에러 상세 정보를 생성
 */
export const createErrorDetails = (
  error: Error | string,
  errorInfo?: any
): ErrorDetails => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  return {
    message: errorMessage,
    stack: errorStack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
};

/**
 * 전역 에러 핸들러
 */
export const handleError = (
  error: Error | string,
  errorInfo?: any,
  context?: string
): void => {
  const details = createErrorDetails(error, errorInfo);

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(
      `[${context || 'Error'}]`,
      error,
      errorInfo,
      details
    );
  }

  // Log to error logging service
  logError(details, context || 'UnknownError');

  // TODO: Send to error reporting service (e.g., Sentry)
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { contexts: { details } });
  // }
};

/**
 * Promise rejection 핸들러
 */
export const handlePromiseRejection = (event: PromiseRejectionEvent): void => {
  event.preventDefault();

  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  handleError(error, null, 'UnhandledPromiseRejection');
};

/**
 * 전역 에러 리스너 등록
 */
export const initErrorHandler = (): void => {
  initGlobalErrorHandlers();
};

export const initGlobalErrorHandlers = (): void => {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    handleError(event.error || event.message, null, 'WindowError');
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', handlePromiseRejection);

  if (import.meta.env.DEV) {
    console.log('[ErrorHandler] Global error handlers initialized');
  }
};

/**
 * 에러 카테고리 타입
 */
export type ErrorCategory =
  | 'NetworkError'
  | 'ParseError'
  | 'PermissionError'
  | 'NotFoundError'
  | 'ValidationError'
  | 'StorageError'
  | 'ImportError'
  | 'ExportError'
  | 'RuntimeError';

/**
 * 에러 타입 분류
 */
export const classifyError = (error: Error | string): ErrorCategory => {
  const message = typeof error === 'string' ? error : error.message;

  if (message.includes('fetch') || message.includes('network')) {
    return 'NetworkError';
  }
  if (message.includes('parse') || message.includes('JSON')) {
    return 'ParseError';
  }
  if (message.includes('permission') || message.includes('denied')) {
    return 'PermissionError';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'NotFoundError';
  }

  return 'RuntimeError';
};

/**
 * Error Logging Service
 * 에러를 로깅하고 추적하는 서비스
 */

import type { ErrorDetails } from '@utils/errorHandler';

export type ErrorLevel = 'error' | 'warning' | 'info';

interface ErrorLog {
  level: ErrorLevel;
  context: string;
  details: ErrorDetails;
}

/**
 * 에러 로그 저장소 (메모리)
 * 프로덕션에서는 외부 서비스로 전송
 */
const errorLogs: ErrorLog[] = [];

/**
 * 에러 로깅
 */
export const logError = (
  details: ErrorDetails,
  context: string = 'Unknown',
  level: ErrorLevel = 'error'
): void => {
  const log: ErrorLog = {
    level,
    context,
    details,
  };

  // Store in memory
  errorLogs.push(log);

  // Keep only last 100 errors
  if (errorLogs.length > 100) {
    errorLogs.shift();
  }

  // Console logging based on level
  if (import.meta.env.DEV) {
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info';
    console[consoleMethod](`[${context}]`, details);
  }

  // TODO: Send to external logging service in production
  // if (import.meta.env.PROD) {
  //   sendToLoggingService(log);
  // }
};

/**
 * 모든 에러 로그 가져오기 (디버깅용)
 */
export const getErrorLogs = (): ErrorLog[] => {
  return [...errorLogs];
};

/**
 * 에러 로그 초기화
 */
export const clearErrorLogs = (): void => {
  errorLogs.length = 0;
};

/**
 * 에러 통계
 */
export const getErrorStats = (): {
  total: number;
  byLevel: Record<ErrorLevel, number>;
  byContext: Record<string, number>;
} => {
  const stats = {
    total: errorLogs.length,
    byLevel: { error: 0, warning: 0, info: 0 } as Record<ErrorLevel, number>,
    byContext: {} as Record<string, number>,
  };

  errorLogs.forEach((log) => {
    stats.byLevel[log.level]++;
    stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
  });

  return stats;
};


import { LogModel, ILog } from '@/models/Log';
import { headers } from 'next/headers';

/**
 * Valid log levels for the logging system
 */
type LogLevel = 'info' | 'warning' | 'error';

/**
 * Options that can be passed when creating a log entry
 * @interface LogOptions
 * @property {string} [userId] - The ID of the user associated with this log entry
 * @property {Record<string, any>} [metadata] - Additional metadata to store with the log
 * @property {string} [service] - The service/component generating this log (defaults to 'appliedtrack')
 */
interface LogOptions {
  userId?: string;
  metadata?: Record<string, any>;
  service?: string;
}

let wsClients: Set<WebSocket> = new Set()

/**
 * Logger class providing static methods for application-wide logging
 * Logs are stored in MongoDB and optionally output to console in development
 */
export class Logger {
  /**
   * Core logging method that handles creating log entries
   * @param {LogLevel} level - The severity level of the log
   * @param {string} action - The action/event being logged
   * @param {any} details - The main payload/details of what is being logged
   * @param {LogOptions} [options] - Additional options for the log entry
   * @returns {Promise<ILog>} The created log entry
   */
  static async log(
    level: LogLevel,
    action: string,
    details: any,
    options?: LogOptions
  ) {
    try {
      const headersList = headers();
      const ip = headersList.get('x-forwarded-for') || 'unknown';

      const logEntry = await LogModel.create({
        level,
        action,
        details,
        userId: options?.userId,
        metadata: options?.metadata,
        service: options?.service || 'appliedtrack',
        ip,
        timestamp: new Date()
      });

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}] ${action}:`, details);
      }

      this.broadcastLog(logEntry)

      return logEntry;
    } catch (error) {
      console.error('Error creating log entry:', error);
      // Don't throw - logging should never break the main application flow
    }
  }

  /**
   * Log an info level message
   * @param {string} action - The action/event being logged
   * @param {any} details - The details to log
   * @param {LogOptions} [options] - Additional options for the log entry
   * @returns {Promise<ILog>} The created log entry
   */
  static async info(action: string, details: any, options?: LogOptions) {
    return this.log('info', action, details, options);
  }

  /**
   * Log a warning level message
   * @param {string} action - The action/event being logged
   * @param {any} details - The details to log
   * @param {LogOptions} [options] - Additional options for the log entry
   * @returns {Promise<ILog>} The created log entry
   */
  static async warning(action: string, details: any, options?: LogOptions) {
    return this.log('warning', action, details, options);
  }

  /**
   * Log an error level message
   * @param {string} action - The action/event being logged
   * @param {any} details - The details to log
   * @param {LogOptions} [options] - Additional options for the log entry
   * @returns {Promise<ILog>} The created log entry
   */
  static async error(action: string, details: any, options?: LogOptions) {
    return this.log('error', action, details, options);
  }

  static addWebSocketClient(ws: WebSocket) {
    wsClients.add(ws)
    ws.onclose = () => wsClients.delete(ws)
  }

  private static broadcastLog(logEntry: ILog) {
    const message = JSON.stringify(logEntry)
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }
}
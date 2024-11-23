

import { headers } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { LogLevel } from '@prisma/client';
import { prisma } from './prisma';
import { use } from 'react';


interface LogOptions {
  userId?: string;
  metadata?: Record<string, any>;
  service?: string;
}

/**
 * Logger class providing static methods for application-wide logging
 */
export const Logger = {
  /**
   * Core logging method that handles creating log entries
   */
  async log(
    level: LogLevel,
    action: string,
    details: any,
    options?: LogOptions
  ) {
    try {
      const headersList = headers();
      const user = await currentUser();

      // console.log(user?.id);
      
      const log = await prisma.log.create({
        data: {
          level,
          action,
          details: details as any,
          userId: user?.id,
          metadata: options?.metadata as any,
          service: options?.service || 'appliedtrack',
          ip: headersList.get('x-forwarded-for') || undefined
        }
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development' && level.toUpperCase() !== 'INFO') {
        console.log(`[${level.toUpperCase()}] ${action}:`, details);
      }

      return log;
    } catch (error) {
      console.error('Failed to create log:', error);
      throw error;
    }
  },

  /**
   * Creates an info level log entry
   */
  async info(action: string, details: any, options?: LogOptions) {
    return this.log('info', action, details, options);
  },

  /**
   * Creates a warning level log entry
   */
  async warning(action: string, details: any, options?: LogOptions) {
    return this.log('warning', action, details, options);
  },

  /**
   * Creates an error level log entry
   */
  async error(action: string, details: any, options?: LogOptions) {
    return this.log('error', action, details, options);
  }
}
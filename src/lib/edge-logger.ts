// New file for edge-compatible logging
import { headers } from 'next/headers';

export class EdgeLogger {
  private static getBaseUrl() {
    // In development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    // In production - get from environment variable
    return process.env.NEXT_PUBLIC_APP_URL || 'https://appliedtrack.ai';
  }

  static async log(level: 'info' | 'warning' | 'error', action: string, details: any) {
    const baseUrl = this.getBaseUrl();
    
    // Immediately return to not block the middleware
    fetch(`${baseUrl}/api/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        action,
        details,
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('EdgeLogger error:', error);
      }
    });
  }

  static info(action: string, details: any) {
    return this.log('info', action, details);
  }

  static warning(action: string, details: any) {
    return this.log('warning', action, details);
  }

  static error(action: string, details: any) {
    return this.log('error', action, details);
  }
} 
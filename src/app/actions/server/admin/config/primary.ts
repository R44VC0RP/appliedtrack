'use server'

import { Logger } from '@/lib/logger';
import { srv_authAdminUser } from '@/lib/useUser';
import { PrismaClient, Config, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface ConfigResponse {
  success: boolean;
  message: string;
  data: Config | null;
}

export async function srv_getConfigData(): Promise<ConfigResponse> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to fetch config data', {
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    let config = await prisma.config.findFirst();
    
    if (!config) {
      // Create default configuration
      const defaultConfig = {
        tierLimits: {
          free: {
            AI_RESUME: { limit: 1 },
            AI_COVER_LETTER: { limit: 1 },
            AI_RESUME_RATING: { limit: 1 },
            HUNTER_EMAIL_SEARCH: { limit: 2 },
            JOBS_SAVED: { limit: 10 },
            COVER_LETTERS: { limit: 5 }
          },
          pro: {
            AI_RESUME: { limit: 5 },
            AI_COVER_LETTER: { limit: 5 },
            AI_RESUME_RATING: { limit: 5 },
            HUNTER_EMAIL_SEARCH: { limit: 50 },
            JOBS_SAVED: { limit: 50 },
            COVER_LETTERS: { limit: 25 }
          },
          power: {
            AI_RESUME: { limit: 10 },
            AI_COVER_LETTER: { limit: 10 },
            AI_RESUME_RATING: { limit: 10 },
            HUNTER_EMAIL_SEARCH: { limit: 100 },
            JOBS_SAVED: { limit: -1 },
            COVER_LETTERS: { limit: -1 }
          }
        },
        services: {
          AI_RESUME: {
            name: "AI Resume Generation",
            description: "Generate AI-powered resumes",
            active: true
          },
          AI_COVER_LETTER: {
            name: "AI Cover Letter",
            description: "Generate AI-powered cover letters",
            active: true
          },
          AI_RESUME_RATING: {
            name: "AI Resume Rating",
            description: "Get AI feedback on your resume",
            active: true
          },
          HUNTER_EMAIL_SEARCH: {
            name: "Email Search",
            description: "Search for contact emails",
            active: true
          },
          JOBS_SAVED: {
            name: "Saved Jobs",
            description: "Number of jobs you can save",
            active: true
          },
          COVER_LETTERS: {
            name: "Cover Letters",
            description: "Number of cover letters you can create",
            active: true
          }
        }
      };

      config = await prisma.config.create({
        data: defaultConfig
      });
      
      await Logger.info('Initialized default system configuration', {
        action: 'CONFIG_CREATION',
        timestamp: new Date()
      });
    }

    return {
      success: true,
      message: 'Configuration retrieved successfully',
      data: config
    };

  } catch (error) {
    console.error('Error:', error);
    await Logger.error('Error fetching configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'GET_CONFIG'
    });

    return {
      success: false,
      message: 'Failed to fetch configuration',
      data: null
    };
  }
}

export async function srv_updateConfig(configData: Partial<Config>): Promise<ConfigResponse> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to update config', {
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    const config = await prisma.config.findFirst();
    if (!config) {
      throw new Error('Configuration not found');
    }

    const updatedConfig = await prisma.config.update({
      where: { id: config.id },
      data: {
        tierLimits: configData.tierLimits as Prisma.InputJsonValue,
        services: configData.services as Prisma.InputJsonValue,
        dateUpdated: new Date()
      }
    });

    await Logger.info('Updated system configuration', {
      action: 'CONFIG_UPDATE',
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Configuration updated successfully',
      data: updatedConfig
    };

  } catch (error) {
    console.error('Error:', error);
    await Logger.error('Error updating configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'UPDATE_CONFIG'
    });

    return {
      success: false,
      message: 'Failed to update configuration',
      data: null
    };
  }
}

export async function srv_deleteService(serviceKey: string): Promise<ConfigResponse> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to delete service', {
        error: "Forbidden",
        serviceKey
      });
      throw new Error('Forbidden');
    }

    const config = await prisma.config.findFirst();
    if (!config) {
      throw new Error('Configuration not found');
    }

    const services = { ...config.services as any };
    const tierLimits = { ...config.tierLimits as any };

    // Remove service from services
    delete services[serviceKey];

    // Remove service from all tier limits
    Object.keys(tierLimits).forEach(tier => {
      if (tierLimits[tier][serviceKey]) {
        delete tierLimits[tier][serviceKey];
      }
    });

    const updatedConfig = await prisma.config.update({
      where: { id: config.id },
      data: {
        services,
        tierLimits,
        dateUpdated: new Date()
      }
    });

    await Logger.info('Deleted service from configuration', {
      action: 'SERVICE_DELETE',
      serviceKey,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Service deleted successfully',
      data: updatedConfig
    };

  } catch (error) {
    console.error('Error:', error);
    await Logger.error('Error deleting service', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      serviceKey,
      action: 'DELETE_SERVICE'
    });

    return {
      success: false,
      message: 'Failed to delete service',
      data: null
    };
  }
}

export async function srv_addService(
  serviceKey: string,
  serviceName: string,
  description: string
): Promise<ConfigResponse> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to add service', {
        error: "Forbidden",
        serviceKey
      });
      throw new Error('Forbidden');
    }

    const config = await prisma.config.findFirst();
    if (!config) {
      throw new Error('Configuration not found');
    }

    const services = { ...config.services as any };
    const tierLimits = { ...config.tierLimits as any };

    // Add service to services
    services[serviceKey] = {
      name: serviceName,
      description,
      active: true
    };

    // Add service to all tier limits with default values
    Object.keys(tierLimits).forEach(tier => {
      tierLimits[tier][serviceKey] = { limit: 0 };
    });

    const updatedConfig = await prisma.config.update({
      where: { id: config.id },
      data: {
        services,
        tierLimits,
        dateUpdated: new Date()
      }
    });

    await Logger.info('Added new service to configuration', {
      action: 'SERVICE_ADD',
      serviceKey,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Service added successfully',
      data: updatedConfig
    };

  } catch (error) {
    console.error('Error:', error);
    await Logger.error('Error adding service', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      serviceKey,
      action: 'ADD_SERVICE'
    });

    return {
      success: false,
      message: 'Failed to add service',
      data: null
    };
  }
}

export async function srv_getAllUserQuotas() {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to fetch user quotas', {
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    const userQuotas = await prisma.userQuota.findMany({
      include: {
        user: true,
        quotaUsage: true
      }
    });

    const formattedQuotas = userQuotas.map(quota => ({
      userId: quota.userId,
      tier: quota.user.tier,
      quotaResetDate: quota.quotaResetDate,
      usage: Object.fromEntries(
        quota.quotaUsage.map(usage => [
          usage.quotaKey,
          usage.usageCount
        ])
      )
    }));

    return {
      success: true,
      message: 'User quotas retrieved successfully',
      data: formattedQuotas
    };

  } catch (error) {
    console.error('Error:', error);
    await Logger.error('Error fetching user quotas', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'GET_USER_QUOTAS'
    });

    return {
      success: false,
      message: 'Failed to fetch user quotas',
      data: null
    };
  }
}

'use server'

import { ConfigModel, ConfigData, Config } from '@/models/Config';
import { Logger } from '@/lib/logger';
import { srv_authAdminUser, srv_getAllCompleteUserProfiles } from '@/lib/useUser';
import { plain } from '@/lib/plain';
import { UserModel } from '@/models/User';
import { UserQuotaModel } from '@/models/UserQuota';

interface ConfigResponse {
  success: boolean;
  message: string;
  data: ConfigData | null;
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

    let config = await ConfigModel.findOne();
    
    if (!config) {
      // Create default configuration
      const defaultConfig: ConfigData = {
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
        },
        dateCreated: new Date(),
        dateUpdated: new Date()
      };

      config = await ConfigModel.create(defaultConfig);
      
      await Logger.info('Initialized default system configuration', {
        action: 'CONFIG_CREATION',
        timestamp: new Date()
      });
    }

    return {
      success: true,
      message: 'Config data fetched successfully',
      data: plain(config)
    };
  } catch (error) {
    await Logger.error('Failed to fetch config data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_updateConfig(config: Config): Promise<ConfigResponse> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      throw new Error('Forbidden');
    }

    // Convert the nested objects to dot notation for MongoDB
    const updateObj: any = {};

    // Update tier limits
    Object.entries(config.tierLimits).forEach(([tier, limits]) => {
      Object.entries(limits).forEach(([service, quota]) => {
        updateObj[`tierLimits.${tier}.${service}`] = quota;
      });
    });

    // Update services
    Object.entries(config.services).forEach(([key, service]) => {
      updateObj[`services.${key}`] = service;
    });

    const updatedConfig = await ConfigModel.findOneAndUpdate(
      {},
      {
        $set: {
          ...updateObj,
          dateUpdated: new Date()
        }
      },
      { new: true }
    );

    if (!updatedConfig) {
      throw new Error('Failed to update configuration');
    }

    await Logger.info('Config updated successfully', {
      updatedTierLimits: config.tierLimits,
      updatedServices: config.services
    });

    return {
      success: true,
      message: 'Configuration updated successfully',
      data: plain(updatedConfig)
    };

  } catch (error) {
    await Logger.error('Failed to update config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_deleteService(serviceKey: string): Promise<ConfigResponse> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to delete service', {
        serviceKey,
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    // First, verify the service exists
    const config = await ConfigModel.findOne({
      [`services.${serviceKey}`]: { $exists: true }
    });

    if (!config) {
      await Logger.warning('Service not found for deletion', { serviceKey });
      throw new Error('Service not found');
    }

    // Use $unset to remove the service and its tier limits
    const updateOperations = {
      $unset: {
        [`services.${serviceKey}`]: 1
      },
      $set: {
        dateUpdated: new Date()
      }
    };

    // Add unset operations for each tier
    const tiers = Object.keys(config.tierLimits);
    tiers.forEach(tier => {
      updateOperations.$unset[`tierLimits.${tier}.${serviceKey}`] = 1;
    });

    const updatedConfig = await ConfigModel.findOneAndUpdate(
      {},
      updateOperations,
      { new: true }
    );

    if (!updatedConfig) {
      throw new Error('Failed to update config');
    }

    await Logger.info('Service deleted successfully', {
      serviceKey,
      updatedServices: Object.keys(updatedConfig.services)
    });

    return {
      success: true,
      message: 'Service deleted successfully',
      data: plain(updatedConfig)
    };

  } catch (error) {
    await Logger.error('Failed to delete service', {
      serviceKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete service',
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
        serviceKey,
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    const currentConfig = await ConfigModel.findOne();
    if (!currentConfig) {
      throw new Error('Configuration not found');
    }

    // Check if service already exists
    if (currentConfig.services[serviceKey]) {
      throw new Error('Service key already exists');
    }

    // Add new service
    const updatedConfig = await ConfigModel.findOneAndUpdate(
      {},
      {
        $set: {
          [`services.${serviceKey}`]: {
            name: serviceName,
            description,
            active: true
          },
          [`tierLimits.free.${serviceKey}`]: { limit: 0 },
          [`tierLimits.pro.${serviceKey}`]: { limit: 0 },
          [`tierLimits.power.${serviceKey}`]: { limit: -1 },
          dateUpdated: new Date()
        }
      },
      { new: true }
    );

    await Logger.info('New service added successfully', {
      serviceKey,
      serviceName
    });

    return {
      success: true,
      message: `Service ${serviceKey} added successfully`,
      data: plain(updatedConfig)
    };
  } catch (error) {
    await Logger.error('Failed to add service', {
      serviceKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_getAllUserQuotas() {
  try {
    const users = await srv_getAllCompleteUserProfiles();
    const quotas = await UserQuotaModel.find({}).lean();

    const userQuotaMap = quotas.reduce((acc, quota) => {
      acc[quota.userId.toString()] = quota;
      return acc;
    }, {} as Record<string, any>);

    const userQuotaInfo = users.map(user => ({
      userId: user.id,
      email: user.email || 'N/A',
      tier: user.tier || 'free',
      quotaResetDate: userQuotaMap[user.id]?.quotaResetDate || new Date(),
      usage: userQuotaMap[user.id]?.usage || {}
    }));

    return {
      success: true,
      data: userQuotaInfo
    };
  } catch (error) {
    await Logger.error('Failed to fetch user quotas', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      message: 'Failed to fetch user quotas'
    };
  }
}

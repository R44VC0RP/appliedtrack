'use server'

import { ConfigModel, Config } from '@/models/Config';
import { Logger } from '@/lib/logger';
import { srv_authAdminUser } from '@/lib/useUser';
import { plain } from '@/lib/plain';
interface TierLimits {
  jobs: number;
  coverLetters: number;
  contactEmails: number;
}

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

    let config = await ConfigModel.findOne();
    
    if (!config) {
      await Logger.info('Initializing default system configuration', {
        action: 'CONFIG_CREATION',
        timestamp: new Date()
      });
      
      config = await ConfigModel.create({
        tierLimits: {
          free: { jobs: 10, coverLetters: 5, contactEmails: 2 },
          pro: { jobs: 50, coverLetters: 25, contactEmails: 50 },
          power: { jobs: -1, coverLetters: -1, contactEmails: 100 }
        },
        dateCreated: new Date(),
        dateUpdated: new Date()
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
      await Logger.warning('Non-admin user attempted to update config data', {
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    if (!config.tierLimits || typeof config.tierLimits !== 'object') {
      await Logger.warning('Invalid configuration update attempted', {
        status: 'FAILED',
        reason: 'INVALID_PAYLOAD',
        payload: config
      });
      throw new Error('Invalid configuration data');
    }

    const updatedConfig = await ConfigModel.findOneAndUpdate(
      {},
      { 
        $set: {
          tierLimits: config.tierLimits,
          dateUpdated: new Date()
        }
      },
      { new: true, upsert: true }
    );

    await Logger.info('System configuration updated successfully', {
      status: 'SUCCESS',
      updates: config.tierLimits
    });

    return {
      success: true,
      message: 'Config data updated successfully',
      data: plain(updatedConfig)
    };
  } catch (error) {
    await Logger.error('Failed to update config data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

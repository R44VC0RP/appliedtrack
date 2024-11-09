import { ConfigModel } from '@/models/Config';
import { Logger } from '@/lib/logger';

interface TierResponse {
  tierLimits?: Record<string, any>;
  error?: string;
}

export async function fetchTierLimits(): Promise<TierResponse> {
    try {
      const config = await ConfigModel.findOne({}, { 
        tierLimits: 1, 
        _id: 0
      }).lean();
  
      if (!config) {
        await Logger.warning('Tier config not found in database', {
          action: 'GET_TIER_CONFIG',
          timestamp: new Date()
        });
        
        return { error: 'Tier configuration not found' };
      }
  
      await Logger.info('Tier config retrieved successfully', {
        action: 'GET_TIER_CONFIG',
        timestamp: new Date()
      });
  
      return { tierLimits: config.tierLimits };
  
    } catch (error) {
      await Logger.error('Error fetching tier configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        action: 'GET_TIER_CONFIG'
      });
  
      return { error: 'Internal server error' };
    }
  }
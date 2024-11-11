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
        return { error: 'Tier configuration not found' };
      }
      return { tierLimits: config.tierLimits };
    } catch (error) {
      console.log('error', error)
      await Logger.error('Error fetching tier configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        action: 'GET_TIER_CONFIG'
      });
  
      return { error: 'Internal server error' };
    }
  }
'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Settings } from 'lucide-react'
import { Config } from '@/models/Config';


// Server Actions
import { srv_getConfigData, srv_updateConfig } from '@/app/actions/server/admin/config/primary';

interface TierLimits {
  jobs: number;
  coverLetters: number;
  contactEmails: number;
}



export function TierConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await srv_getConfigData();
      if (!response.success) throw new Error(response.message);
      setConfig(response.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to fetch tier configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!config) return;
      const response = await srv_updateConfig(config);

      if (!response.success) throw new Error(response.message);

      toast.success("Tier configuration updated successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to update tier configuration");
    }
  };

  const handleInputChange = (tier: string, field: string, value: string) => {
    if (!config) return;
    
    const updatedConfig = {
      ...config,
      tierLimits: {
        ...config.tierLimits,
        [tier]: {
          ...config.tierLimits[tier as keyof typeof config.tierLimits],
          [field]: parseInt(value) || 0
        }
      }
    };
    setConfig(updatedConfig as Config);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col w-full max-w-full">
      <div className="flex-none mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Tier Configuration
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {config && Object.entries(config.tierLimits).map(([tier, limits]) => (
          <Card key={tier} className="p-6">
            <h3 className="text-lg font-semibold capitalize mb-4">{tier} Tier</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Job Applications</label>
                <Input
                  type="number"
                  value={limits.jobs}
                  onChange={(e) => handleInputChange(tier, 'jobs', e.target.value)}
                  min="-1"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">(-1 for unlimited)</p>
              </div>
              <div>
                <label className="text-sm font-medium">Cover Letters</label>
                <Input
                  type="number"
                  value={limits.coverLetters}
                  onChange={(e) => handleInputChange(tier, 'coverLetters', e.target.value)}
                  min="-1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Emails</label>
                <Input
                  type="number"
                  value={limits.contactEmails}
                  onChange={(e) => handleInputChange(tier, 'contactEmails', e.target.value)}
                  min="-1"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={handleUpdate}>
          Save Changes
        </Button>
      </div>
    </div>
  );
} 
import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Settings } from 'lucide-react'

interface TierLimits {
  jobs: number;
  coverLetters: number;
  contactEmails: number;
}

interface Config {
  tierLimits: {
    free: TierLimits;
    pro: TierLimits;
    power: TierLimits;
  };
}

export function TierConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tier configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to update config');

      toast({
        title: "Success",
        description: "Tier configuration updated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update tier configuration",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (tier: string, field: string, value: string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      tierLimits: {
        ...config.tierLimits,
        [tier]: {
          ...config.tierLimits[tier as keyof typeof config.tierLimits],
          [field]: parseInt(value) || 0
        }
      }
    });
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
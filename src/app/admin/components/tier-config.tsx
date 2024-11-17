'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Settings, Plus } from 'lucide-react'
import { Config, ConfigData } from '@/models/Config';
import { AddServiceModal } from './add-service-modal'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search } from 'lucide-react'


// Server Actions
import { srv_getConfigData, srv_updateConfig, srv_deleteService, srv_addService, srv_getAllUserQuotas } from '@/app/actions/server/admin/config/primary';


// Add these new types
interface UserQuotaInfo {
  userId: string;
  email: string;
  tier: string;
  quotaResetDate: Date;
  usage: Record<string, number>;
}


export function TierConfig() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [userQuotas, setUserQuotas] = useState<UserQuotaInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tierConfigActiveTab') || 'limits';
    }
    return 'limits';
  });

  useEffect(() => {
    localStorage.setItem('tierConfigActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchConfig();
    fetchUserQuotas();
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

  const fetchUserQuotas = async () => {
    try {
      const response = await srv_getAllUserQuotas();
      if (response.success && response.data) {
        setUserQuotas(response.data);
      }
    } catch (error) {
      console.error('Error fetching user quotas:', error);
      toast.error("Failed to fetch user quotas");
    }
  };

  const handleUpdate = async () => {
    try {
      if (!config) return;
      const response = await srv_updateConfig(config as Config);

      if (!response.success) throw new Error(response.message);

      toast.success("Tier configuration updated successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to update tier configuration");
    }
  };

  const handleInputChange = (tier: string, serviceKey: string, value: string) => {
    if (!config) return;
    
    const updatedConfig = {
      ...config,
      tierLimits: {
        ...config.tierLimits,
        [tier]: {
          ...config.tierLimits[tier],
          [serviceKey]: {
            limit: value === '' ? 0 : parseInt(value)
          }
        }
      }
    };

    setConfig(updatedConfig);
  };

  const handleAddService = async (serviceKey: string, serviceName: string, description: string) => {
    try {
      const response = await srv_addService(serviceKey, serviceName, description);
      if (!response.success) throw new Error(response.message);
      
      setConfig(response.data);
      toast.success("Service added successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to add service");
    }
  };

  const handleDeleteService = async (serviceKey: string) => {
    try {
      const response = await srv_deleteService(serviceKey);
      if (!response.success || !response.data) {
        toast.error(response.message || "Failed to delete service.");
        return;
      }
      
      setConfig(response.data);
      setServiceToDelete(null);
      toast.success(response.message || "Service deleted successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to delete service");
      setServiceToDelete(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log(config);

  return (
    <div className="h-full flex flex-col w-full max-w-full">
      <div className="flex-none mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          System Configuration
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="limits">Tier Limits</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="quotas">User Quotas</TabsTrigger>
        </TabsList>

        <TabsContent value="limits">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config && Object.entries(config.tierLimits).map(([tier, limits]) => (
              <Card key={tier} className="p-6">
                <h3 className="text-lg font-semibold capitalize mb-4">{tier} Tier</h3>
                <div className="space-y-4">
                  {config && Object.entries(config.services).map(([serviceKey, service]) => {
                    const quotaLimit = limits[serviceKey] || { limit: 0 };
                    return (
                      <div key={serviceKey}>
                        <label className="text-sm font-medium">
                          {service.name}
                        </label>
                        <Input
                          type="number"
                          value={quotaLimit.limit === 0 ? '' : quotaLimit.limit}
                          onChange={(e) => handleInputChange(tier, serviceKey, e.target.value)}
                          min="-1"
                          className="mt-1"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">(-1 for unlimited)</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="mb-4">
            <AddServiceModal onAdd={handleAddService} />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {config && Object.entries(config.services).map(([key, service]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">Key: {key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.active}
                      onCheckedChange={(checked) => {
                        const updatedConfig = {
                          ...config,
                          services: {
                            ...config.services,
                            [key]: { ...service, active: checked }
                          }
                        };
                        setConfig(updatedConfig);
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setServiceToDelete(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Description"
                  value={service.description}
                  onChange={(e) => {
                    const updatedConfig = {
                      ...config,
                      services: {
                        ...config.services,
                        [key]: { ...service, description: e.target.value }
                      }
                    };
                    setConfig(updatedConfig);
                  }}
                />
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quotas">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Quota Reset Date</TableHead>
                    {config && Object.entries(config.services).map(([key, service]) => (
                      <TableHead key={key}>{service.name} Usage</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userQuotas
                    .filter(user => 
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.tier}</TableCell>
                        <TableCell>
                          {new Date(user.quotaResetDate).toLocaleDateString()}
                        </TableCell>
                        {config && Object.entries(config.services).map(([key]) => (
                          <TableCell key={key}>
                            {user.usage[key] || 0}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service and all associated tier limits.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => serviceToDelete && handleDeleteService(serviceToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-6">
        <Button onClick={handleUpdate}>
          Save Changes
        </Button>
      </div>
    </div>
  );
} 
"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { DropdownMenu } from '../ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bell, Grid, Settings, FileText, Users, CreditCard, Settings2, PieChart, Sparkles, CircleDot, GaugeCircle, RefreshCw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeControl } from '@/components/ui/themecontrol';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import logo from '@/app/logos/logo.png'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser
} from '@clerk/nextjs'
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card } from "@/components/ui/card"
import { devLog } from '@/lib/devLog';

// Server Actions
import { srv_getHeaderData, HeaderData, QuotaData } from "@/app/actions/server/header/primary"
import { srv_getConfigTiers } from "@/app/actions/server/settings/primary"
import { UserTier } from '@/types/subscription'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'

interface ConfigData {
  services: {
    [key: string]: {
      name: string;
      description: string;
      active: boolean;
    };
  };
  tierLimits: {
    [key: string]: {
      [serviceKey: string]: {
        limit: number;
        description?: string;
      };
    };
  };
}

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

interface QuotaIndicatorProps {
  quota: QuotaData | null;
  tier: UserTier;
}

interface UserMetadata {
  tier?: string;
  publicMetadata?: {
    tier?: string;
  };
  fullName?: string;
}

const serviceNames: { [key: string]: string } = {
  'HUNTER_EMAILSEARCH': 'InsightLink™',
  'GENAI_RESUME': 'Resume AI',
  'GENAI_COVERLETTER': 'Cover Letter AI',
  'GENAI_JOBMATCH': 'JobMatch AI',
  'JOBS_COUNT': 'Applications'
};

const QuotaIndicator = ({ quota: initialQuota, tier }: QuotaIndicatorProps) => {
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [quota, setQuota] = useState<QuotaData | null>(initialQuota);
  const [isLoading, setIsLoading] = useState(false);
  const { user: clerkUser, isSignedIn } = useUser();

  const fetchData = async () => {
    if (!isSignedIn || !clerkUser?.id) {
      return null;
    }

    try {
      setIsLoading(true);
      const [config, headerData] = await Promise.all([
        srv_getConfigTiers(),
        srv_getHeaderData(clerkUser.id)
      ]);
      devLog.log('Data refreshed:', { config, headerData });
      setConfigData(config);
      setQuota(headerData.quota);
    } catch (error) {
      devLog.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isSignedIn && clerkUser?.id) {
      fetchData();
    }
  }, [isSignedIn, clerkUser?.id]);

  // Listen for quota updates
  useEffect(() => {
    if (!isSignedIn) return;

    const handleQuotaUpdate = () => {
      devLog.log("Quota update event received in QuotaIndicator");
      fetchData();
    };

    window.addEventListener('quotaUpdate', handleQuotaUpdate);
    return () => window.removeEventListener('quotaUpdate', handleQuotaUpdate);
  }, [isSignedIn, clerkUser?.id]);

  // Update local quota when prop changes
  useEffect(() => {
    setQuota(initialQuota);
  }, [initialQuota]);

  // Log the current state for debugging
  devLog.debug('Current state:', {
    isLoading,
    quota,
    configData,
    tier,
    quotaUsage: quota?.quotaUsage
  });

  // Don't render until we have both quota and config data
  if (isLoading || !configData) {
    devLog.log("Loading or missing data:", { isLoading, quota, configData });
    return (
      <div className="flex items-center space-x-2 min-w-[100px] min-h-[60px] animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  // Don't render if we don't have quota data
  if (!quota?.quotaUsage) {
    devLog.log("Missing quota data:", { quota });
    return (
      <div className="flex items-center space-x-2 min-w-[100px] min-h-[60px] animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  const getServiceUsage = (serviceKey: string) => {
    // Get service configuration first
    const serviceConfig = configData.services[serviceKey];
    if (!serviceConfig?.active) {
      devLog.log("Service not active:", { serviceKey, serviceConfig });
      return null;
    }

    // Get tier limits
    const tierLimits = configData.tierLimits[tier]?.[serviceKey];
    if (!tierLimits) {
      devLog.log("No tier limits for service:", { serviceKey, tier, tierLimits: configData.tierLimits[tier] });
      return null;
    }

    // Find quota usage for this service
    const quotaUsage = quota.quotaUsage.find(q => q.quotaKey === serviceKey);
    const usage = quotaUsage?.usageCount || 0;
    const limit = tierLimits.limit;

    if (limit === 0) {
      devLog.log("Service has zero limit:", { serviceKey, limit });
      return null;
    }

    const percentage = limit > 0 ? (usage / limit) * 100 : 0;

    devLog.debug("Service usage calculated:", {
      serviceKey,
      usage,
      limit,
      percentage,
      quotaUsage,
      serviceConfig,
      tierLimits
    });

    return {
      key: serviceKey,
      used: usage,
      limit,
      name: serviceNames[serviceKey] || serviceKey,
      percentage
    };
  };

  // Get all valid services
  const services = Object.keys(serviceNames)
    .map(getServiceUsage)
    .filter((service): service is NonNullable<typeof service> => service !== null);

  devLog.log("Filtered services:", services);

  if (services.length === 0) {
    devLog.log("No services to display");
    return null;
  }

  // Calculate total percentage only from valid services
  const totalUsagePercentage = services.reduce((acc, service) =>
    acc + service.percentage, 0) / services.length;

  devLog.log("Total usage percentage:", totalUsagePercentage);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "text-destructive";
    if (percentage >= 80) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 h-9 px-3",
            getStatusColor(totalUsagePercentage)
          )}
        >
          <GaugeCircle className="h-4 w-4" />
          <span className="font-medium hidden sm:inline">
            {Math.round(totalUsagePercentage)}% Used
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Service Usage</h4>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn("h-8 w-8 p-0", isLoading && "animate-spin")}
                onClick={(e) => {
                  e.preventDefault();
                  fetchData();
                }}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh quota data</span>
              </Button>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getStatusColor(totalUsagePercentage)
            )}>
              {Math.round(totalUsagePercentage)}% Total
            </span>
          </div>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium">{service.name}</h5>
                    <p className="text-xs text-muted-foreground">
                      {service.limit === -1 ?
                        `${service.used} / Unlimited` :
                        `${service.used} of ${service.limit} used`}
                    </p>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    getStatusColor(service.percentage)
                  )}>
                    {Math.round(service.percentage)}%
                  </span>
                </div>
                {service.limit !== -1 && (
                  <Progress
                    value={Math.min(service.percentage, 100)}
                    className={cn(
                      "h-2",
                      service.percentage >= 100
                        ? "bg-destructive/50"
                        : service.percentage >= 80
                          ? "bg-yellow-500/50"
                          : "bg-green-500/50"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <Link
            href="/settings?tab=subscription"
            className="block w-full text-xs text-center text-muted-foreground hover:text-primary transition-colors"
          >
            View detailed usage in settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function Header({ onNotificationClick }: HeaderProps) {
  const { user: clerkUser, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [headerData, setHeaderData] = useState<HeaderData | null>(null);

  const fetchHeaderData = async () => {
    if (!isSignedIn || !clerkUser?.id) return;

    try {
      setIsLoading(true);
      const data = await srv_getHeaderData(clerkUser.id);
      setHeaderData(data);
    } catch (error) {
      devLog.error('Error fetching header data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && clerkUser?.id) {
      fetchHeaderData();
    }
  }, [isSignedIn, clerkUser?.id]);

  useEffect(() => {
    if (!isSignedIn) return;

    const handleQuotaUpdate = () => {
      console.log("Quota update event received, refreshing header data");
      fetchHeaderData();
    };

    window.addEventListener('quotaUpdate', handleQuotaUpdate);
    return () => window.removeEventListener('quotaUpdate', handleQuotaUpdate);
  }, [isSignedIn, clerkUser?.id]);

  return (
    <header className="container mx-auto p-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!isSignedIn && (
            <Link href="/" className="flex items-center space-x-2">
              <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
              <h1 className="text-3xl font-bold hidden sm:block">AppliedTrack</h1>
            </Link>
          )}
          {isSignedIn && (
            <>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
                <h1 className="text-3xl font-bold hidden sm:block">AppliedTrack</h1>

              </Link>
              {headerData?.role === 'admin' && !isLoading && (

                <Button
                  onClick={() => navigator.clipboard.writeText(clerkUser.id)}
                  className="hidden sm:inline-flex"
                >

                  ADMIN

                </Button>

              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">

          <TooltipProvider>
            {headerData?.role === 'admin' && !isLoading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin" className="hidden sm:inline-flex focus:outline-none">
                    <Settings2 className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Admin Dashboard
                </TooltipContent>
              </Tooltip>
            )}
            {headerData?.tier === 'free' && isSignedIn && !isLoading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  {isSignedIn && (
                    <Button
                      variant="outline"
                      className="hidden sm:flex items-center gap-2 border-yellow-500/50 hover:border-yellow-500 text-yellow-500 hover:text-yellow-600"
                      onClick={() => {
                        window.location.href = '/settings?tab=subscription';
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Upgrade to Pro</span>
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unlock unlimited applications, emails, and more!</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
          {isSignedIn && (
            <TooltipProvider>
              <div className="hidden sm:block">
                {headerData?.tier === 'free' ? (
                  <Badge>
                    Free
                  </Badge>
                ) : headerData?.tier === 'pro' ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Pro
                  </Badge>
                ) : headerData?.tier === 'power' ? (
                  <Badge className="bg-yellow-500 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-200">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Power
                  </Badge>
                ) : null}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard" className="focus:outline-none group flex items-center">
                    <Grid className="h-5 w-5" />
                    <span className="w-0 overflow-hidden transition-all duration-200 group-hover:w-20 group-hover:ml-2">
                      Dashboard
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Dashboard
                </TooltipContent>
              </Tooltip>
              {!isLoading && headerData && (
                <QuotaIndicator quota={headerData.quota} tier={headerData.tier} />
              )}
            </TooltipProvider>
          )}
          {isSignedIn && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/settings" className="focus:outline-none group flex items-center">
                    <Settings className="h-5 w-5" />
                    <span className="w-0 overflow-hidden transition-all duration-200 group-hover:w-16 group-hover:ml-2">
                      Settings
                    </span>
                  </Link>
                </TooltipTrigger>
              </Tooltip>


            </TooltipProvider>

          )}

          <ThemeControl />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {!isSignedIn && (
                    <SignInButton>
                      <Button>Get Started</Button>
                    </SignInButton>
                  )}
                  {isSignedIn && (
                    <UserButton>
                    </UserButton>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {clerkUser ? clerkUser.fullName : 'Get Started'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}

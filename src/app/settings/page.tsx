"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadButton } from "@/utils/uploadthing";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { CircleProgress } from "@/components/ui/circle-progress";
import { Header } from "@/components/header";
import { Loader2, FileText, CreditCard, User2, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@prisma/client";

import { UserProfile } from "@clerk/nextjs";
import Confetti from 'react-dom-confetti';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTier, QuotaNotification } from '@/types/subscription';
import { Progress } from "@/components/ui/progress";
import { QuotaUsage } from '@prisma/client';
import {
  srv_getUserDetails,
  srv_updateUserDetails,
  srv_getResumes,
  srv_addResume,
  srv_removeResume,
  srv_createCustomerPortal,
  srv_getConfigTiers,
  srv_createStripeCheckout
} from "@/app/actions/server/settings/primary";
import { PDFViewerModal } from "@/components/pdf-viewer-modal";
import { Suspense } from "react";

type UserDetails = {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'power';
  role: 'user' | 'admin';
  about: string | null;
  onboardingComplete: boolean;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean | null;
  currentPeriodEnd: Date | null;
  baselineResume: string | null;
  createdAt: number;
  updatedAt: Date;
  email: string;
  name: string;
  imageUrl: string;
  lastSignInAt: number | null;
  userQuota: {
    quotaUsage: {
      id: string;
      userQuotaId: string;
      quotaKey: string;
      usageCount: number;
      dateCreated: Date;
      dateUpdated: Date;
    }[];
    notifications: any[];
  } | null;
};

interface ConfigData {
  services: {
    [key: string]: {
      name: string;
      description: string;
      active: boolean;
    };
  };
  tierLimits: {
    [key in UserTier]: {
      [serviceKey: string]: {
        limit: number;
        description?: string;
      };
    };
  };
}

// Create a new component for the tabs content
function SettingsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') || "personal";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const { user: clerkUser, isSignedIn } = useUser();
  const [localAbout, setLocalAbout] = useState('');
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [quotaNotifications, setQuotaNotifications] = useState<QuotaNotification[]>([]);
  const [selectedResume, setSelectedResume] = useState<{ url: string; name: string } | null>(null);
  
  // Simplified fetch functions using server actions
  const fetchAllData = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      const userDetails = await srv_getUserDetails();
      const [userResumes, config] = await Promise.all([
        srv_getResumes(),
        srv_getConfigTiers()
      ]);

      setLocalAbout(userDetails.about || '');

      setUserDetails(userDetails as UserDetails);
      setResumes(userResumes);
      setConfigData(config as ConfigData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load settings data");
    } finally {
      setIsLoading(false);
      setIsLoadingConfig(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handlers using server actions
  const handleSavePersonalInfo = async () => {
    try {
      await srv_updateUserDetails({ about: localAbout });
      toast.success("Changes saved");
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  const handleResumeUpload = async (res: any) => {
    const uploadedFile = res[0];
    try {
      await srv_addResume(uploadedFile.url, uploadedFile.name, uploadedFile.key);
      
      toast.success("Resume uploaded");
      const updatedResumes = await srv_getResumes();
      setResumes(updatedResumes);
    } catch (error) {
      toast.error("Failed to upload resume");
    }
  };

  const handleRemoveResume = async (resumeId: string) => {
    try {
      await srv_removeResume(resumeId);
      const updatedResumes = await srv_getResumes();
      setResumes(updatedResumes);
      toast.success("Resume removed");
    } catch (error) {
      toast.error("Failed to remove resume");
    }
  };

  // Update the tab handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/settings?tab=${value}`, { scroll: false });
  };

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const tier = searchParams.get('tier');
    const canceled = searchParams.get('canceled');

    if (success === 'true' && tier) {
      setShowConfetti(true);
      toast.success("Subscription activated!", {
        description: `Welcome to your new ${tier} plan! Refresh to see your updated limits.`,
      });
      // Remove the success parameter from URL without page reload
      router.replace('/settings?tab=subscription', { scroll: false });
      
      // Reset confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);
      
      // Refresh data to show new limits
      fetchAllData();
    }

    if (error) {
      const errorMessages: { [key: string]: string } = {
        missing_session: "Session information is missing",
        unauthorized: "Unauthorized access",
        invalid_session: "Invalid session",
        processing_failed: "Failed to process subscription"
      };

      toast.error("Subscription Error", {
        description: errorMessages[error] || "An unknown error occurred",
      });
      router.replace('/settings?tab=subscription', { scroll: false });
    }

    if (canceled === 'true') {
      toast.info("Subscription canceled", {
        description: "Your subscription checkout was canceled.",
      });
      router.replace('/settings?tab=subscription', { scroll: false });
    }
  }, [searchParams, router, fetchAllData]);

  const confettiConfig = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 70,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
  };

  const getQuotaUsage = useCallback((serviceKey: string) => {
    if (!userDetails?.userQuota?.quotaUsage || !configData?.tierLimits?.[userDetails.tier]?.[serviceKey]) {
      return { usage: 0, limit: configData?.tierLimits?.[userDetails?.tier || 'free']?.[serviceKey]?.limit || 0, percentage: 0 };
    }

    const quotaUsage = userDetails.userQuota.quotaUsage.find(q => q.quotaKey === serviceKey);
    const usage = quotaUsage?.usageCount || 0;
    const limit = configData.tierLimits[userDetails.tier][serviceKey].limit;
    const percentage = limit > 0 ? (usage / limit) * 100 : 0;

    return { usage, limit, percentage };
  }, [userDetails, configData]);

  function QuotaUsageIndicator({ serviceKey }: { serviceKey: string }) {
    const { usage, limit, percentage } = getQuotaUsage(serviceKey);
    const service = configData?.services?.[serviceKey];

    if (!service || limit === 0) return null;

    const getVariant = () => {
      if (percentage >= 100) return 'destructive';
      if (percentage >= 80) return 'warning';
      return 'default';
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{service.name}</span>
          <span>
            {limit === -1 ? `${usage} / Unlimited` : `${usage} / ${limit}`}
            {serviceKey === 'JOBS_COUNT' && (
              <span className="text-xs text-muted-foreground ml-1">
                (active jobs)
              </span>
            )}
          </span>
        </div>
        {limit !== -1 && (
          <Progress
            value={Math.min(percentage, 100)}
            className={`h-2 ${
              getVariant() === 'destructive' 
                ? 'bg-destructive/20' 
                : getVariant() === 'warning'
                ? 'bg-warning/20'
                : ''
            }`}
          />
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Return the tabs content
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="personal" className="flex items-center gap-2">
          <User2 className="h-4 w-4" />
          Personal Info
        </TabsTrigger>
        <TabsTrigger value="resumes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Resumes
        </TabsTrigger>
        <TabsTrigger value="subscription" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Subscription
        </TabsTrigger>
      </TabsList>

      {/* Personal Info Tab */}
      <TabsContent value="personal">
        <div className="grid gap-6 md:grid-cols-2">
          {/* About Me Section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>About Me</CardTitle>
                  <CardDescription>
                    Share your professional background to help generate better cover letters and job matches.
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  className="min-h-[200px] resize-none"
                  value={localAbout}
                  onChange={(e) => setLocalAbout(e.target.value)}
                  placeholder="Tell us about your professional background, key skills, and career goals. This information helps us tailor your experience and create more personalized content."
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {localAbout.length === 0 ? (
                      "Add some information about yourself"
                    ) : (
                      `${localAbout.length} characters`
                    )}
                  </p>
                  <Button 
                    onClick={handleSavePersonalInfo}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>
                Your account statistics and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="text-2xl font-bold">
                      {new Date(userDetails?.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={userDetails?.tier === 'power' ? 'default' : userDetails?.tier === 'pro' ? 'secondary' : 'outline'}>
                        {userDetails?.tier?.toUpperCase() || 'FREE'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Resumes</p>
                    <p className="text-2xl font-bold">{resumes.length}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Last Sign In</p>
                    <p className="text-2xl font-bold">
                      {userDetails?.lastSignInAt ? (
                        new Date(userDetails.lastSignInAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email & Account</CardTitle>
              <CardDescription>
                Manage your email preferences and account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {userDetails?.imageUrl && (
                    <img 
                      src={userDetails.imageUrl} 
                      alt="Profile" 
                      className="h-16 w-16 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{userDetails?.name || 'User'}</p>
                    <p className="text-sm text-muted-foreground truncate">{userDetails?.email}</p>
                  </div>
                </div>
                
              </div>
              
            </CardContent>
          </Card>
          <Card className="md:col-span-2 p-4 flex items-center justify-center">
          
                    <UserProfile 
                      routing="hash"
                      appearance={{
                        // // elements: {
                        // //   rootBox: "w-full border-none shadow-none",
                        // //   card: "shadow-none p-0 border-none",
                        // //   navbar: "hidden ",
                        // //   pageScrollBox: "p-0"
                            
                        // }
                      }}
                    />
          
          </Card>
        </div>
      </TabsContent>

      {/* Resumes Tab */}
      <TabsContent value="resumes">
        <Card>
          <CardHeader>
            <CardTitle>Resume Management</CardTitle>
            <CardDescription>
              Upload and manage your resumes for easy access when applying to jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Upload Resume</h3>
                        <p className="text-sm text-muted-foreground">Add a new resume to your collection</p>
                      </div>
                      <FileText className="h-8 w-8 text-primary opacity-50" />
                    </div>
                    <UploadButton
                      endpoint="pdfUploader"
                      onClientUploadComplete={handleResumeUpload}
                      onUploadError={(error: Error) => {
                        toast.error("Failed to upload resume");
                      }}
                      className="w-full ut-button:w-full ut-button:h-10 ut-button:bg-primary ut-button:hover:bg-primary/90 ut-button:text-primary-foreground ut-button:rounded-md ut-button:text-sm ut-button:font-medium ut-allowed-content:hidden"
                      appearance={{
                        button: "Upload New Resume"
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">Resume Stats</h3>
                        <p className="text-sm text-muted-foreground">Your resume collection</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{resumes.length}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-4">
                      {resumes.length === 0 ? (
                        "No resumes uploaded yet"
                      ) : (
                        `You have ${resumes.length} resume${resumes.length === 1 ? '' : 's'} ready to use`
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border bg-card">
                <div className="flex items-center p-4 border-b">
                  <h3 className="text-lg font-semibold">Your Resumes</h3>
                  <Badge variant="secondary" className="ml-2">{resumes.length}</Badge>
                </div>
                <ScrollArea className="h-[400px] w-full">
                  {resumes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No resumes yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Upload your first resume to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {resumes.map((resume) => (
                        <div key={resume.resumeId} 
                            className="flex items-center justify-between p-4 group hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{resume.fileName}</p>
                              <p className="text-xs text-muted-foreground">Added {new Date().toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedResume({ url: resume.fileUrl, name: resume.fileName })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveResume(resume.resumeId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Subscription tab content remains largely the same but with updated styling */}
      <TabsContent value="subscription">
        {isLoadingConfig ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Manage your subscription and view your usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <SubscriptionStatus userDetails={userDetails} />
                  <div className="space-x-2">
                    {userDetails?.tier === 'free' && (
                      <>
                        <Button
                          onClick={async () => {
                            try {
                              const { url } = await srv_createStripeCheckout('pro');
                              if (url) window.location.href = url;
                            } catch (error) {
                              toast.error("Failed to start checkout");
                            }
                          }}
                        >
                          Upgrade to Pro
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const { url } = await srv_createStripeCheckout('power');
                              if (url) window.location.href = url;
                            } catch (error) {
                              toast.error("Failed to start checkout");
                            }
                          }}
                        >
                          Upgrade to Power
                        </Button>
                      </>
                    )}
                    {userDetails?.tier === 'pro' && (
                      <Button
                        onClick={async () => {
                          try {
                            const { url } = await srv_createStripeCheckout('power');
                            if (url) window.location.href = url;
                          } catch (error) {
                            toast.error("Failed to start checkout");
                          }
                        }}
                      >
                        Upgrade to Power
                      </Button>
                    )}
                    {userDetails?.stripeCustomerId && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { url } = await srv_createCustomerPortal();
                            if (url) window.location.href = url;
                          } catch (error) {
                            toast.error("Failed to access billing portal");
                          }
                        }}
                      >
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quota Usage Section */}
              {userDetails && configData?.services && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Current Usage</h3>
                  <div className="grid gap-4">
                    {Object.entries(configData.services)
                      .filter(([_, service]) => service && service.active)
                      .map(([serviceKey, service]) => {
                        if (!service || !service.name) return null;
                        return (
                          <QuotaUsageIndicator key={serviceKey} serviceKey={serviceKey} />
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Quota Notifications */}
              {quotaNotifications.length > 0 && (
                <div className="space-y-2">
                  {quotaNotifications.map((notification, index) => (
                    <Alert
                      key={index}
                      variant={notification.type === 'exceeded' ? 'destructive' : 'default'}
                      className="bg-white dark:bg-gray-800"
                    >
                      <AlertTitle>
                        {notification.type === 'exceeded' ? 'Quota Exceeded' : 'Quota Warning'}
                      </AlertTitle>
                      <AlertDescription>{notification.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Plan Comparison */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Plan Comparison</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {['free', 'pro', 'power'].map((tier) => (
                    <Card 
                      key={tier} 
                      className={`
                        ${tier === userDetails?.tier ? 'border-2 border-primary shadow-lg' : ''}
                        ${tier === 'power' ? 'bg-muted/50' : ''}
                      `}
                    >
                      <CardHeader>
                        <CardTitle className="capitalize">{tier}</CardTitle>
                        {tier === userDetails?.tier && (
                          <Badge variant="secondary">Current Plan</Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {configData?.services && Object.entries(configData.services).map(([key, service]) => {
                            const limit = configData.tierLimits[tier as UserTier]?.[key]?.limit;
                            return (
                              <div key={key} className="flex justify-between text-sm">
                                <span>{service.name}</span>
                                <Badge variant="outline">
                                  {limit === -1 ? 'Unlimited' : limit}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Modify the main component
export default function SettingsPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Suspense 
          fallback={
            <div className="h-screen w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <SettingsTabs />
        </Suspense>
      </div>
    </>
  );
}

function SubscriptionStatus({ userDetails }: { userDetails: UserDetails | null }) {
  if (!userDetails) return null;

  const getStatusDisplay = () => {
    if (userDetails.cancelAtPeriodEnd && userDetails.currentPeriodEnd) {
      return `Cancels on ${new Date(userDetails.currentPeriodEnd).toLocaleDateString('en-US')}`;
    }
    
    if (userDetails.tier === 'free') {
      return 'Free Plan';
    }
    
    if (userDetails.currentPeriodEnd) {
      const tierName = userDetails.tier.charAt(0).toUpperCase() + userDetails.tier.slice(1);
      return `${tierName} Plan | Renews ${new Date(userDetails.currentPeriodEnd).toLocaleDateString('en-US')}`;
    }

    return `${userDetails.tier.charAt(0).toUpperCase() + userDetails.tier.slice(1)} Plan`;
  };

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{getStatusDisplay()}</p>
      {userDetails.tier !== 'free' && (
        <p className="text-xs text-muted-foreground">
          Next billing date: {userDetails.currentPeriodEnd 
            ? new Date(userDetails.currentPeriodEnd).toLocaleDateString('en-US')
            : 'N/A'}
        </p>
      )}
    </div>
  );
}

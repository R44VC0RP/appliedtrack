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
import { Loader2, FileText, CreditCard, User2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/models/User";
import { ConfigData, ServiceConfig, TierLimits } from "@/models/Config";
import { UserProfile } from "@clerk/nextjs";
import Confetti from 'react-dom-confetti';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { canDowngradeTier } from '@/lib/subscription';
import { getSubscriptionStatusDisplay } from "@/lib/subscription";

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


export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') || "personal";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const { user: clerkUser, isSignedIn } = useUser();
  const [localAbout, setLocalAbout] = useState('');
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Simplified fetch functions using server actions
  const fetchAllData = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      const [userDetails, userResumes, config] = await Promise.all([
        srv_getUserDetails(),
        srv_getResumes(),
        srv_getConfigTiers()
      ]);

      console.log('userDetails', userDetails);

      setUserDetails(userDetails);
      setResumes(userResumes);
      setConfigData(config as ConfigData);
    } catch (error) {
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

  function SubscriptionStatus({ userDetails }: { userDetails: User | null }) {
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
      async function fetchStatus() {
        if (!userDetails) return;
        
        const displayStatus = await getSubscriptionStatusDisplay({
          tier: userDetails.tier,
          isCanceled: userDetails.cancelAtPeriodEnd || false,
          currentPeriodEnd: userDetails.currentPeriodEnd,
        });
        setStatus(displayStatus);
      }
      fetchStatus();
    }, [userDetails]);

    return (
      <p className="text-sm text-muted-foreground">
        {status || (userDetails?.tier || 'Free')}
      </p>
    );
  }

  const SubscriptionLoadingPlaceholder = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      {showSuccessMessage && (
        <div className="container mx-auto p-4 max-w-5xl">
          <Alert className="bg-success/20 border-success mb-4">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your subscription has been successfully activated. Welcome to your new plan!
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Confetti active={showConfetti} config={confettiConfig} />
      </div>
      {searchParams.get('error') && (
        <div className="container mx-auto p-4 max-w-5xl">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem processing your subscription. Please try again or contact support.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="container mx-auto p-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
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
            <div className="space-y-6 flex flex-col gap-4 items-center">
              {/* About Me Card */}
              
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    This information helps generate more accurate cover letters and other documents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">About Me</label>
                    <Textarea
                      className="min-h-[200px] resize-none"
                      value={localAbout}
                      onChange={(e) => setLocalAbout(e.target.value)}
                      placeholder="Tell us about your professional background, skills, and career goals..."
                    />
                  </div>
                  <Button onClick={handleSavePersonalInfo}>
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
              <Card className="w-full" id="user-profile">
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">If you have an .edu address, make sure to set it as your primary email address to get the most out of the platform.</p>
                  <UserProfile routing="hash" 
                    
                    appearance={{
                      elements: {
                        avatarBox: "h-20 w-20",
                        userProfile: {
                          emailAddressesPageTitle: "Email Addresses"
                        }
                      }
                    }}
                  />
                </CardContent>
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
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {resumes.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No resumes uploaded yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {resumes.map((resume) => (
                          <div key={resume.resumeId} 
                               className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                            <a
                              href={resume.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              {resume.fileName}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveResume(resume.resumeId)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload New Resume</label>
                    <UploadButton
                      endpoint="pdfUploader"
                      onClientUploadComplete={handleResumeUpload}
                      onUploadError={(error: Error) => {
                        toast.error("Failed to upload resume");
                      }}
                      className="mt-2 ut-button:w-full ut-button:h-9 ut-button:bg-secondary ut-button:hover:bg-secondary/80 ut-button:text-secondary-foreground ut-button:rounded-md ut-button:text-sm ut-button:font-medium ut-allowed-content:hidden"
                      appearance={{
                        button: "Upload New Resume"
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription tab content remains largely the same but with updated styling */}
          <TabsContent value="subscription">
            {isLoadingConfig ? (
              <SubscriptionLoadingPlaceholder />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing details
                    <br />
                    <span className="text-xs text-muted-foreground">
                      <em>Note: If you are a student, you must have your .edu email as the primary email on your account. 
                        <br />
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-primary hover:underline"
                          onClick={() => {
                            setActiveTab('personal');
                            document.getElementById('user-profile')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Click here to change your email
                        </Button>
                      </em>
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Plan Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Subscription Plan</h3>
                        <SubscriptionStatus userDetails={userDetails} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                      <div className="space-y-1">
                        <p className="font-medium capitalize">{userDetails?.tier || 'Free'} Plan</p>
                        {userDetails?.stripeCustomerId && (
                          <Badge>Active</Badge>
                        )}
                      </div>
                      {userDetails?.stripeCustomerId ? (
                        <div className="space-x-4">
                          {userDetails.tier === 'free' && (
                            <>
                            <Button 
                              onClick={async () => {
                                try {
                                  const { url } = await srv_createStripeCheckout('pro');
                                  if (url) {
                                    window.location.href = url;
                                  } else {
                                    toast.error("Failed to start checkout");
                                  }
                                } catch (error) {
                                  toast.error("Failed to start checkout");
                                }
                              }}
                            >
                              Upgrade to Pro
                            </Button>
                            <Button 
                              onClick={async () => {
                                try {
                                  const { url } = await srv_createStripeCheckout('power');
                                  if (url) {
                                    window.location.href = url;
                                  } else {
                                    toast.error("Failed to start checkout");
                                  }
                                } catch (error) {
                                  toast.error("Failed to start checkout");
                                }
                              }}
                            >
                              Upgrade to Power
                            </Button>
                            </>
                          )}
                          {userDetails.tier === 'pro' && (
                            <Button 
                              onClick={async () => {
                                try {
                                  const { url } = await srv_createStripeCheckout('power');
                                  if (url) {
                                    window.location.href = url;
                                  } else {
                                    toast.error("Failed to start checkout");
                                  }
                                } catch (error) {
                                  toast.error("Failed to start checkout");
                                }
                              }}
                            >
                              Upgrade to Power
                            </Button>
                          )}
                          <Button 
                            onClick={async () => {
                              try {
                                const { url } = await srv_createCustomerPortal();
                                window.location.href = url;
                              } catch (error) {
                                toast.error("Failed to access billing portal");
                              }
                            }}
                          >
                            Manage Subscription
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              onClick={async () => {
                                try {
                                  const { url } = await srv_createStripeCheckout('pro');
                                  if (url) {
                                    window.location.href = url;
                                  } else {
                                    toast.error("Failed to start checkout");
                                  }
                                } catch (error) {
                                  toast.error("Failed to start checkout");
                                }
                              }}
                            >
                              Upgrade to Pro
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  const { url } = await srv_createStripeCheckout('power');
                                  if (url) {
                                    window.location.href = url;
                                  } else {
                                    toast.error("Failed to start checkout");
                                  }
                                } catch (error) {
                                  toast.error("Failed to start checkout");
                                }
                              }}
                            >
                              Upgrade to Power
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Features Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plan Features</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {['free', 'pro', 'power'].map((tier) => (
                        <Card key={tier} className={tier.toLowerCase() === userDetails?.tier?.toLowerCase() ? "border-2 border-blue-500 shadow-lg" : ""}>
                          <CardHeader>
                            <CardTitle className="capitalize">{tier}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {configData?.services && Object.entries(configData.services).map(([key, service]) => {
                                const limit = configData.tierLimits[tier]?.[key]?.limit;
                                return (
                                  <li key={key} className="flex items-center justify-between text-sm">
                                    <span>{service.name}</span>
                                    <Badge variant="secondary">
                                      {limit === -1 ? 'Unlimited' : limit}
                                    </Badge>
                                  </li>
                                );
                              })}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Service Descriptions */}
                    {/* <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Service Descriptions</h3>
                      <div className="grid gap-4">
                        {configData?.services && Object.entries(configData.services).map(([key, service]) => (
                          <div key={key} className="p-4 rounded-lg bg-muted">
                            <h4 className="font-medium">{service.name}</h4>
                          </div>
                        ))}
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

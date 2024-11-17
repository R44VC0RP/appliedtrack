"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadButton } from "@/utils/uploadthing";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CircleProgress } from "@/components/ui/circle-progress";
import { Header } from "@/components/header";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || "personal";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const { user: clerkUser, isSignedIn } = useUser();

  // Personal Info State
  const [localAbout, setLocalAbout] = useState('');

  // Resumes State
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);

  // Subscription State
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    currentPeriodEnd: string;
    status: string;
    cancelAt?: string;
  } | null>(null);

  // Add quota state and fetch
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      await Promise.all([
        fetchUserDetails(),
        fetchResumes(),
        fetchSubscription()
      ]);
    } catch (error) {
      console.error('Error loading settings data:', error);
      toast.error("Failed to load settings data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isSignedIn]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setLocalAbout(data.about || '');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.tier || 'free');
        if (data.subscriptionDetails) {
          setSubscriptionDetails({
            currentPeriodEnd: new Date(data.subscriptionDetails.currentPeriodEnd * 1000).toLocaleDateString(),
            status: data.subscriptionDetails.status,
            cancelAt: data.subscriptionDetails.cancelAt
              ? new Date(data.subscriptionDetails.cancelAt * 1000).toLocaleDateString()
              : undefined
          });
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  // Handlers
  const handleSavePersonalInfo = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about: localAbout }),
      });

      if (response.ok) {
        toast.success("Changes saved");
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      toast.error("Failed to save changes");
    }
  };

  const handleResumeUpload = async (res: any) => {
    const uploadedFile = res[0];
    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: uploadedFile.url,
          fileId: uploadedFile.key,
          resumeId: "RESUME_" + uploadedFile.key,
          fileName: uploadedFile.name,
        }),
      });

      if (response.ok) {
        toast.success("Resume uploaded");
        fetchResumes();
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error("Failed to upload resume");
    }
  };

  const handleRemoveResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes?resumeId=${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchResumes();
        toast.success("Resume removed");
      }
    } catch (error) {
      console.error('Error removing resume:', error);
      toast.error("Failed to remove resume");
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgradeLoading(true);
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start subscription process");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to open subscription management");
    }
  };

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
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="resumes">Resumes</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Personal Information</h2>
              <div>
                <h3 className="text-lg font-semibold mb-2">About Me</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  This is used to help generate more accurate cover letters and other documents.
                </p>
                <Textarea
                  className="min-h-[100px]"
                  value={localAbout}
                  onChange={(e) => setLocalAbout(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
                <Button onClick={handleSavePersonalInfo} className="mt-4">
                  Save Changes
                </Button>
              </div>
              <Separator />
              {/* Example bios section remains the same as in the header component */}
            </div>
          </TabsContent>

          {/* Resumes Tab */}
          <TabsContent value="resumes">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Manage Resumes</h2>
              <ScrollArea className="h-[300px] w-full border rounded-md p-4">
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <div key={resume.resumeId} className="flex items-center justify-between">
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {resume.fileName}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveResume(resume.resumeId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Upload New Resume</h4>
                <UploadButton
                  endpoint="pdfUploader"
                  onClientUploadComplete={handleResumeUpload}
                  onUploadError={(error: Error) => {
                    console.error(error);
                    toast.error("Failed to upload resume");
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Subscription Management</h2>
              <div className="bg-muted p-4 rounded-lg">
                <h2 className="font-semibold mb-2 text-foreground">
                  Current Plan: {currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) : 'Free'}
                </h2>
                {subscriptionDetails && currentPlan !== 'free' && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Status: <Badge variant={
                      subscriptionDetails.cancelAt ? 'destructive' :
                        subscriptionDetails.status === 'active' ? 'default' : 'secondary'
                    }>
                      {subscriptionDetails.cancelAt
                        ? `Cancels ${subscriptionDetails.cancelAt}`
                        : subscriptionDetails.status.charAt(0).toUpperCase() + subscriptionDetails.status.slice(1)
                      }
                    </Badge></p>
                    {subscriptionDetails.status === 'active' && (
                      <p>Next billing date: {subscriptionDetails.currentPeriodEnd}</p>
                    )}
                  </div>
                )}
                {currentPlan === 'free' && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                {/* Show compact plans if subscription is canceled */}
                {subscriptionDetails?.cancelAt ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Available plans after cancellation:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {pricingTiers.slice(1).map((tier) => (
                        <div key={tier.name.toLowerCase()} className="border rounded-lg p-3">
                          <h3 className="font-semibold text-sm">{tier.name} Plan</h3>
                          <p className="text-xs text-muted-foreground my-1">{tier.price}/month</p>
                          <Button
                            onClick={() => handleUpgrade(tier.name.toLowerCase())}
                            disabled={upgradeLoading}
                            className="w-full mt-2"
                            size="sm"
                          >
                            {upgradeLoading ? "..." : `Choose ${tier.name}`}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {currentPlan === 'free' && pricingTiers.slice(1).map((tier) => (
                      <div key={tier.name.toLowerCase()} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-foreground">{tier.name} Plan</h3>
                        <p className="text-sm text-muted-foreground my-2">{tier.price}/month</p>
                        <ul className="text-sm space-y-2 mb-4 text-foreground">
                          {tier.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleUpgrade(tier.name.toLowerCase())}
                          disabled={upgradeLoading}
                          className="w-full"
                        >
                          {upgradeLoading ? "Processing..." : `Upgrade to ${tier.name}`}
                        </Button>
                      </div>
                    ))}

                    {currentPlan !== 'power' && currentPlan !== 'free' && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-foreground">Power Plan</h3>
                        <p className="text-sm text-muted-foreground my-2">{pricingTiers[2].price}/month</p>
                        <ul className="text-sm space-y-2 mb-4 text-foreground">
                          {pricingTiers[2].features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleUpgrade('power')}
                          disabled={upgradeLoading}
                          className="w-full"
                        >
                          {upgradeLoading ? "Processing..." : "Upgrade to Power"}
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {currentPlan !== 'free' && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Add the QuotaData interface
interface QuotaData {
  jobs: { used: number; limit: number; remaining: number };
  coverLetters: { used: number; limit: number; remaining: number };
  emails: { used: number; limit: number; remaining: number };
  resetDate: Date;
}

// Add this near the top where other constants are defined
const pricingTiers = [
  { 
    name: "Basic", 
    price: 'Free', 
    features: [
      'Up to 15 job applications',
      'Unlimited resumes',
      'Up to 5 personalized cover letters/month',
      '5 email domain lookups/month'
    ] 
  },
  { 
    name: 'Pro', 
    price: '$10', 
    features: [
      '100 applications',
      'Unlimited resumes',
      'Up to 25 personalized cover letters/month',
      '25 email lookups/month',
      'Priority support'
    ] 
  },
  { 
    name: 'Power', 
    price: '$30', 
    features: [
      'Unlimited applications',
      'Unlimited resumes',
      'Unlimited cover letters',
      '50 email lookups',
    ]
  },
];
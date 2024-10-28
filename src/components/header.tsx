import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Bell, Grid, Settings, FileText, Users, CreditCard, Settings2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { AdminOnly } from '@/components/auth/AdminOnly';

import logo from '@/app/logos/logo.png'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser
} from '@clerk/nextjs'
import Link from 'next/link'
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UploadButton } from "@/utils/uploadthing"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

// Move SubscriptionPage outside of Header component as a separate component
function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    currentPeriodEnd: string;
    status: string;
    cancelAt?: string;
  } | null>(null);

  const fetchSubscription = useCallback(async () => {
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
      toast({
        title: "Error",
        description: "Failed to fetch subscription details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

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
      toast({
        title: "Error",
        description: "Failed to start subscription process",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md" />
        <div className="h-24 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Failed to load subscription details</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Subscription</h1>
      <div className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">
            Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
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
                <div className="border rounded-lg p-3">
                  <h3 className="font-semibold text-sm">Pro Plan</h3>
                  <p className="text-xs text-muted-foreground my-1">$10/month</p>
                  <Button 
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgradeLoading}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {upgradeLoading ? "..." : "Choose Pro"}
                  </Button>
                </div>
                <div className="border rounded-lg p-3">
                  <h3 className="font-semibold text-sm">Power Plan</h3>
                  <p className="text-xs text-muted-foreground my-1">$30/month</p>
                  <Button 
                    onClick={() => handleUpgrade('power')}
                    disabled={upgradeLoading}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {upgradeLoading ? "..." : "Choose Power"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Regular plan display for non-canceled subscriptions */}
              {currentPlan === 'free' && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Pro Plan</h3>
                  <p className="text-sm text-muted-foreground my-2">$10/month</p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li>• Unlimited applications</li>
                    <li>• Multiple resume versions</li>
                    <li>• Advanced cover letter generator</li>
                    <li>• 50 email lookups/month</li>
                  </ul>
                  <Button 
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgradeLoading}
                    className="w-full"
                  >
                    {upgradeLoading ? "Processing..." : "Upgrade to Pro"}
                  </Button>
                </div>
              )}

              {currentPlan !== 'power' && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Power Plan</h3>
                  <p className="text-sm text-muted-foreground my-2">$30/month</p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li>• Unlimited everything</li>
                    <li>• Priority support</li>
                    <li>• Beta features access</li>
                    <li>• 100 email lookups/month</li>
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
    </div>
  );
}

// Move CustomPage outside of Header component as a separate component
function CustomPage() {
  const { toast } = useToast();
  const [localAbout, setLocalAbout] = useState('');

  const handleLocalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalAbout(e.target.value);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ about: localAbout }),
      });

      if (response.ok) {
        toast({
          title: "Changes saved",
          description: "Your information has been updated successfully",
        });
      } else {
        console.error('Failed to update user details');
      }
    } catch (error) {
      console.error('Error updating user details:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Personal Info</h1>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">About Me</h3>
          <p className="text-sm text-gray-500 mb-2">This is used to help generate more accurate cover letters and other documents.</p>
          <Textarea
            className="min-h-[100px] w-full"
            name="about"
            placeholder="About Me"
            value={localAbout}
            onChange={handleLocalChange}
          />
          <Button onClick={handleSaveChanges} className="mt-2">Save Changes</Button>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold mb-2">Example Bio's</h3>
          <div className="space-y-2">
            <p className="text-sm font-semibold">John Doe</p>
            <p className="text-sm text-gray-500 mb-2 p-2 bg-gray-100 rounded-md">
              John Doe is a seasoned software engineer with over 10 years of experience in the tech industry.
              He has a proven track record of developing high-quality software solutions and leading successful projects.
              John is proficient in multiple programming languages and frameworks, and he is passionate about continuous learning and improvement.
              His accomplishments include leading a team to develop a highly scalable web application that serves millions of users,
              and contributing to open-source projects that have been widely adopted by the developer community.
            </p>
            <p className="text-sm font-semibold">Jane Smith</p>
            <p className="text-sm text-gray-500 mb-2 p-2 bg-gray-100 rounded-md">
              Jane Smith is a creative and innovative marketing professional with a passion for creating engaging and effective campaigns.
              She has a proven track record of developing high-quality marketing strategies and leading successful projects.
              Jane is proficient in multiple marketing platforms and frameworks, and she is passionate about continuous learning and improvement.
              Her accomplishments include leading a team to develop a highly scalable marketing campaign that served millions of users,
              and contributing to open-source projects that have been widely adopted by the marketing community.
            </p>

          </div>


        </div>
        {/* <div>
          <h3 className="text-lg font-semibold mb-2">Resumes</h3>
          <ScrollArea className="h-[200px] w-full border rounded-md p-4">
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
                alert("Upload failed");
              }}
            />
          </div>
        </div> */}
      </div>
    </div>
  );
}

export function Header({ onNotificationClick }: HeaderProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState({
    about: '',
  });
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);

  // Remove unused handleUserDetailsChange
  
  const handleResumeUpload = useCallback((res: any) => {
    const uploadedFile = res[0];
    console.log("Uploaded file:", uploadedFile);
    const saveResume = async (uploadedFile: any) => {
      try {
        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: uploadedFile.url,
            fileId: uploadedFile.key,
            resumeId: "RESUME_" + uploadedFile.key,
            fileName: uploadedFile.name,
          }),
        });
        if (response.ok) {
          toast({
            title: "Resume uploaded",
            description: "Your resume has been uploaded successfully",
          });
        } else {
          throw new Error('Failed to save resume');
        }

        const data = await response.json();
        console.log('Resume saved:', data);

        setResumes(prevResumes => [...prevResumes, {
          resumeId: "RESUME_" + uploadedFile.key,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name
        }]);
      } catch (error) {
        console.error('Error saving resume:', error);
      }
    };

    saveResume(uploadedFile);
  }, [toast]);

  const fetchResumes = useCallback(async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  }, []);

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUserDetails({ about: data.about });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
    fetchUserDetails();
  }, [fetchResumes, fetchUserDetails]);

  const handleRemoveResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes?resumeId=${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchResumes();
      } else {
        console.error('Failed to remove resume');
      }
    } catch (error) {
      console.error('Error removing resume:', error);
    }
  };

  return (
    <header className="container mx-auto p-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
          </Link>
          <h1 className="text-3xl font-bold">AppliedTrack</h1>
        </div>
        <div className="flex items-center space-x-4">
          <AdminOnly fallback={null}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin" className="focus:outline-none">
                    <Settings2 className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Admin Dashboard
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AdminOnly>
          <SignedIn>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onNotificationClick} className="focus:outline-none">
                    <Bell className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Notifications
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard" className="focus:outline-none">
                    <Grid className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Dashboard
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SignedIn>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <SignedOut>
                    <SignInButton>
                      <Button>Get Started</Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton>
                      <UserButton.UserProfilePage label="Personal Info" url="personal-info" labelIcon={<Settings className="w-4 h-4" />}>
                        <CustomPage />
                      </UserButton.UserProfilePage>
                      <UserButton.UserProfilePage label="Resumes" url="resumes" labelIcon={<FileText className="w-4 h-4" />}>
                        <div className="p-4">
                          <h1 className="text-2xl font-bold mb-4">Resumes</h1>
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
                                alert("Upload failed");
                              }}
                              className="[&_[data-ut-element='allowed-content']]:uppercase"
                            />
                          </div>
                        </div>
                      </UserButton.UserProfilePage>
                      <UserButton.UserProfilePage 
                        label="Subscription" 
                        url="subscription" 
                        labelIcon={<CreditCard className="w-4 h-4" />}
                      >
                        <SubscriptionPage />
                      </UserButton.UserProfilePage>
                    </UserButton>
                  </SignedIn>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {user ? user.fullName : 'Get Started'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}

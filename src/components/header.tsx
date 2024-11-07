import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Bell, Grid, Settings, FileText, Users, CreditCard, Settings2, PieChart, Sparkles } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { AdminOnly } from '@/components/auth/AdminOnly';
import { ThemeControl } from '@/components/ui/themecontrol';
import { TierOnly } from '@/components/auth/TierOnly';
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
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CircleProgress } from "@/components/ui/circle-progress"

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

interface QuotaData {
  jobs: { used: number; limit: number; remaining: number };
  coverLetters: { used: number; limit: number; remaining: number };
  emails: { used: number; limit: number; remaining: number };
  resetDate: Date;
}


// Add this interface near the top with other interfaces
interface UserMetadata {
  tier?: string;
  publicMetadata?: {
    tier?: string;
  };
  fullName?: string;
}

export function Header({ onNotificationClick }: HeaderProps) {
  const { user: clerkUser, isSignedIn } = useUser();
  const user = clerkUser as UserMetadata;
  // console.log("User:", user);
  const [userTier, setUserTier] = useState<string>('free');
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState({
    about: '',
  });
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);

  // Add this function to fetch user tier
  const fetchUserTier = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUserTier(data.tier || 'free');
      }
    } catch (error) {
      console.error('Error fetching user tier:', error);
    }
  }, [isSignedIn]);

  // Modify fetchResumes to check auth status
  const fetchResumes = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  }, [isSignedIn]);

  // Modify fetchUserDetails to check auth status
  const fetchUserDetails = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUserDetails({ about: data.about });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, [isSignedIn]);

  // Modify useEffect to depend on isSignedIn
  useEffect(() => {
    if (isSignedIn) {
      fetchResumes();
      fetchUserDetails();
    }
  }, [fetchResumes, fetchUserDetails, isSignedIn]);

  // Add this to your existing useEffect
  useEffect(() => {
    if (isSignedIn) {
      fetchUserTier();
    }
  }, [fetchUserTier, isSignedIn]);

  const handleResumeUpload = useCallback((res: any) => {
    const uploadedFile = res[0];
    // console.log("Uploaded file:", uploadedFile);
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
        // console.log('Resume saved:', data);

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

  const fetchQuotaData = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetch('/api/quota');
      if (response.ok) {
        const data = await response.json();
        // console.log("Quota data:", data);
        setQuotaData(data);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchQuotaData();
      fetchResumes();
      fetchUserDetails();
    }
  }, [fetchQuotaData, isSignedIn]);

  return (
    <header className="container mx-auto p-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SignedOut>
            <Link href="/" className="flex items-center space-x-2">
              <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
              <h1 className="text-3xl font-bold hidden sm:block">AppliedTrack</h1>
            </Link>

          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
              <h1 className="text-3xl font-bold hidden sm:block">AppliedTrack</h1>
            </Link>
          </SignedIn>

          {/* <TierOnly tier="free">
            This
          </TierOnly>
          <TierOnly tier="pro,power">
            This
          </TierOnly> */}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <SignedIn>
                    {userTier === 'free' && (
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
                  </SignedIn>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unlock unlimited applications, emails, and more!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AdminOnly>
          <SignedIn>
            {/* <TooltipProvider>
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
            </TooltipProvider> */}

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

          <SignedIn>
            <TooltipProvider>
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => {
                      // You can add a modal or dropdown here to show detailed usage
                    }}
                  >
                    <PieChart className="h-5 w-5" />
                    {quotaData && (
                      <div className="absolute -top-1 -right-1">
                        <CircleProgress
                          value={Math.round((quotaData.emails.used / quotaData.emails.limit) * 100)}
                          size="small"
                          variant={
                            quotaData.emails.remaining < 3
                              ? "destructive"
                              : quotaData.emails.remaining < 7
                                ? "warning"
                                : "default"
                          }
                        />
                      </div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {quotaData ? (
                    <div className="space-y-2">
                      <p>Email Lookups: {quotaData.emails.used}/{quotaData.emails.limit}</p>
                      <p>Cover Letters: {quotaData.coverLetters.used}/{quotaData.coverLetters.limit}</p>
                      <p>Jobs: {quotaData.jobs.used}/{quotaData.jobs.limit}</p>
                      <p>You are on the {userTier} tier</p>
                      <p className="text-xs text-muted-foreground">
                        Resets on {new Date(quotaData.resetDate).toLocaleDateString()}
                      </p>
                      {userTier === 'free' && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            window.location.href = '/dashboard/settings?tab=subscription';
                          }}
                        >
                          Upgrade Now
                        </Button>
                      )}
                    </div>
                  ) : (
                    "Loading quota..."
                  )}
                </TooltipContent>
              </Tooltip> */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/settings" className="focus:outline-none">
                    <Settings className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </SignedIn>

          <ThemeControl />

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

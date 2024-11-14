"use ser"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Bell, Grid, Settings, FileText, Users, CreditCard, Settings2, PieChart, Sparkles } from 'lucide-react'
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

// Server Actions
import { srv_getHeaderData, HeaderData } from "@/app/actions/server/header/primary"



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
  const [isLoading, setIsLoading] = useState(true);
  const [headerData, setHeaderData] = useState<HeaderData | null>(null);
  const user = clerkUser as UserMetadata;
  
  

  useEffect(() => {
    if (isSignedIn) {
      srv_getHeaderData(clerkUser.id).then((data) => {
        setHeaderData(data)
        setIsLoading(false)
      })
    } 
  }, [isSignedIn])

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
              { headerData?.role === 'admin' && !isLoading && (
                <Badge >
                  ADMIN
                </Badge>
              )}
            </Link>
          </SignedIn>
        </div>
        <div className="flex items-center space-x-4">
          
            <TooltipProvider>
            { headerData?.role === 'admin' && !isLoading && (
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
            )}
            { headerData?.tier !== 'free' && isSignedIn && !isLoading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SignedIn>
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
                  </SignedIn>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unlock unlimited applications, emails, and more!</p>
                </TooltipContent>
              </Tooltip>
            )}
            </TooltipProvider>
          <SignedIn>
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

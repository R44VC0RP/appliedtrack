import React from 'react'
import Image from 'next/image'
import { Bell, UserCircle, Grid } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import logo from '@/app/logos/logo.png'
import Link from 'next/link'
interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export function Header({ user, onNotificationClick, onProfileClick }: HeaderProps) {
  return (
    <header className="container mx-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
          </Link>
          <h1 className="text-3xl font-bold">JobTrack</h1>
        </div>
        <div className="flex items-center space-x-4">
        
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onProfileClick} className="focus:outline-none">
                  {user && user.avatar ? (
                    <Image src={user.avatar} alt={user.name} width={24} height={24} className="rounded-full" />
                  ) : (
                    <UserCircle className="h-6 w-6" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {user ? user.name : 'User Profile'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}


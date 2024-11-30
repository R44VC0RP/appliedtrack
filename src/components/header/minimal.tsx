"use client";

import React from 'react';
import Image from 'next/image';
import { ThemeControl } from '@/components/ui/themecontrol';
import logo from '@/app/logos/logo.png';
import {
  SignedIn,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';

export function MinimalHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logo}
            alt="AppliedTrack Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="font-semibold text-lg">AppliedTrack</span>
        </Link>

        <div className="flex items-center space-x-4">
          <ThemeControl />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

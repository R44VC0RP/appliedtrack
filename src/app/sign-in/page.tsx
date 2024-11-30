"use client"

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import logo from "@/app/logos/logo.png";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Back to Home Link */}
      <div className="fixed top-4 left-4 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt="AppliedTrack Logo"
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="text-2xl font-bold">AppliedTrack</span>
        </Link>
      </div>

      {/* Sign In Component */}
      <div className="w-full max-w-md px-4">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
          appearance={{
           
          }}
        />
      </div>

      {/* Footer Links */}
      <div className="mt-8 text-sm text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground mr-4">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
} 
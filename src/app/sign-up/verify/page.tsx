"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinimalHeader } from "@/components/header/minimal";

export default function VerifyPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a pending sign-up
    if (isLoaded && !signUp?.verifications?.emailAddress) {
      console.log("No pending verification found");
      toast.error("No pending verification found");
      router.push("/");
    }
  }, [isLoaded, signUp, router]);

  if (!isLoaded) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      console.log("Starting verification attempt...");
      
      if (!signUp) {
        console.error("No active sign-up session");
        toast.error("No active sign-up session found");
        router.push("/");
        return;
      }

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log("Verification response:", completeSignUp);

      if (completeSignUp.status !== "missing_requirements") {
        console.error("Verification incomplete:", completeSignUp.status);
        toast.error("Verification failed. Please try again.");
        return;
      }

      // Set this session active
      await setActive({ session: completeSignUp.createdSessionId });
      
      toast.success("Email verified successfully!");
      
      // Redirect to the complete sign-up page
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.errors?.[0]?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      if (!signUp) {
        toast.error("No active sign-up session found");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.success("New verification code sent!");
    } catch (err: any) {
      console.error("Error resending code:", err);
      toast.error(err.errors?.[0]?.message || "Failed to resend code");
    }
  };

  return (
    <>
      <MinimalHeader />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
              Verify your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please enter the verification code sent to your email
            </p>
            {signUp?.emailAddress && (
              <p className="mt-1 text-center text-sm text-gray-500">
                Code sent to: {signUp.emailAddress}
              </p>
            )}
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter verification code"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6"
              />
              <Button
                type="submit"
                disabled={isVerifying || !code}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-semibold"
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResendCode}
              className="text-sm text-yellow-600 hover:text-yellow-500"
            >
              Resend verification code
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

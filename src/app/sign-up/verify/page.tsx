"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinimalHeader } from "@/components/header/minimal";
import { Label } from "@/components/ui/label";

export default function VerifyPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    // Check if we have a pending sign-up
    if (!signUp.verifications?.emailAddress) {
      console.log("No pending verification found");
      toast.error("No pending verification found");
      router.push("/");
      return;
    }

    // Check if email is already verified
    if (signUp.verifications?.emailAddress.status === "verified") {
      console.log("Email already verified, showing profile completion");
      setIsVerified(true);
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

      if (completeSignUp.status !== "complete" && completeSignUp.status === "missing_requirements") {
        setIsVerified(true);
        toast.success("Email verified! Please complete your profile.");
      } else if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        console.error("Verification incomplete:", completeSignUp.status);
        toast.error("Verification failed. Please try again.");
      }
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

  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!signUp) {
        toast.error("No active sign-up session found");
        return;
      }

      // First update the user's data
      await signUp.update({
        firstName,
        lastName,
        password,
      });

      // Then complete the sign up
      const completeSignUp = await signUp.create({
        firstName,
        lastName,
        password,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        console.error("Sign up incomplete:", completeSignUp.status);
        toast.error("Failed to complete sign up. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      toast.error(err.errors?.[0]?.message || "Failed to complete sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <MinimalHeader />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
              {isVerified ? "Complete Your Profile" : "Verify your email"}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {isVerified
                ? "Just a few more details to get started"
                : "Please enter the verification code sent to your email"}
            </p>
            {!isVerified && signUp?.emailAddress && (
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Code sent to: {signUp.emailAddress}
              </p>
            )}
          </div>

          {!isVerified ? (
            <>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter verification code"
                    required
                    disabled={isVerifying}
                  />
                  <Button
                    type="submit"
                    disabled={isVerifying || !code}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <>
                        <span className="loading loading-spinner loading-sm mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={handleResendCode}
                  disabled={isVerifying}
                  className="text-sm"
                >
                  Resend verification code
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCompleteSignUp} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !firstName || !lastName || !password}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Sign Up"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

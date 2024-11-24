"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinimalHeader } from "@/components/header/minimal";

export default function CompleteSignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a pending sign-up and set the email
    if (isLoaded && !signUp) {
      console.log("No pending sign-up found");
      toast.error("No pending sign-up found");
      router.push("/");
    } else if (isLoaded && signUp?.emailAddress) {
      setEmail(signUp.emailAddress);
    }
  }, [isLoaded, signUp, router]);

  if (!isLoaded) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("Completing sign-up...");
      
      if (!signUp) {
        console.error("No active sign-up session");
        toast.error("No active sign-up session found");
        router.push("/");
        return;
      }

      // Use email as username
      const username = email.split('@')[0];

      const completeSignUp = await signUp.update({
        username,
        password,
        firstName,
        lastName,
      });

      console.log("Update response:", completeSignUp);

      // Complete the sign-up process
      const finalizeSignUp = await signUp.create({
        username,
        password,
        firstName,
        lastName,
      });
      
      console.log("Finalize response:", finalizeSignUp);

      if (finalizeSignUp.status === "complete") {
        await setActive({ session: finalizeSignUp.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        console.error("Unexpected status:", finalizeSignUp.status);
        toast.error("Failed to complete sign-up");
      }
    } catch (err: any) {
      console.error("Sign-up completion error:", err);
      toast.error(err.errors?.[0]?.message || "Failed to complete sign-up");
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
              Complete Your Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Just a few more details to set up your account
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <Input
                    name="fname"
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                    className="mt-1"
                    autoComplete="fname"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <Input
                    name="lname"
                    autoComplete="lname"
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="mt-1"
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !password || !firstName || !lastName}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-semibold"
              >
                {isSubmitting ? "Creating Account..." : "Complete Sign Up"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

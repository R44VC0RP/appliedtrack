"use server"

import { AppliedTrack } from "./appliedtrack";
import { srv_checkUserAttributes, srv_initialData } from "@/app/actions/server/job-board/primary";
import { CompleteUserProfile } from "@/lib/useUser";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Job } from "@/app/types/job";
import { SubscriptionStatus } from '../components/subscription-status';

export default async function DashboardPage() {
  const { jobs, resumes } = await srv_initialData();
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }
  const user = await srv_checkUserAttributes(clerkUser.id);
  return (
    <div>
      <AppliedTrack 
        initJobs={jobs as unknown as Job[]} 
        initResumes={resumes?.map(({ resumeId, fileUrl, fileName }) => ({ resumeId, fileUrl, fileName })) || []} 
        onboardingComplete={user?.onboardingComplete || false} 
        role={user?.role || 'user'} 
        tier={user?.tier || 'free'} 
        user={user as CompleteUserProfile} 
      />
    </div>
  )
}

"use server"

import { AppliedTrack } from "./appliedtrack";
import { srv_checkUserAttributes, srv_initialData } from "@/app/actions/server/job-board/primary";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { jobs, resumes } = await srv_initialData();
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }
  const { onboardingComplete, role, tier } = await srv_checkUserAttributes(user.id);
  return (
    <div>
      <AppliedTrack initJobs={jobs} initResumes={resumes} onboardingComplete={onboardingComplete} role={role} tier={tier} />
    </div>
  )
}


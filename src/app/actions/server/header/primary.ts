'use server'

// Notes:
/*
    So the data that is required for the header is:
    - /api/user which returns:

    - /api/resumes which is not needed (can be removed)

    - /api/user/quota which can be returned with the user data


    so we need a function that returns the user data which includes the quota, tier, and role
*/

import { srv_getCompleteUserProfile, CompleteUserProfile } from "@/lib/useUser"
import { plain } from "@/lib/plain"
import { prisma } from "@/lib/prisma"

export interface HeaderData extends CompleteUserProfile {
    quota: any | null // Using any temporarily until we define proper types
}


export async function srv_getHeaderData(userId: string): Promise<HeaderData> {
    const user = await srv_getCompleteUserProfile(userId) as CompleteUserProfile
    const quota = await prisma.userQuota.findUnique({
        where: { userId },
        include: {
            notifications: true
        }
    })
    return plain({ ...user, quota })
}
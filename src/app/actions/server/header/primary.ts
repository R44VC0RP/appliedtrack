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
import { QuotaNotification, QuotaUsage } from "@prisma/client"

export interface QuotaData {
    id: string;
    userId: string;
    quotaResetDate: Date;
    stripeCurrentPeriodEnd: Date | null;
    dateCreated: Date;
    dateUpdated: Date;
    quotaUsage: Array<QuotaUsage>;
    notifications: Array<QuotaNotification>;
}

export interface HeaderData extends CompleteUserProfile {
    quota: QuotaData | null;
}

export async function srv_getHeaderData(userId: string): Promise<HeaderData> {
    const user = await srv_getCompleteUserProfile(userId) as CompleteUserProfile;
    const quota = await prisma.userQuota.findUnique({
        where: { userId },
        include: {
            notifications: true,
            quotaUsage: true
        }
    });

    return plain({ 
        ...user, 
        quota: quota ? {
            ...quota,
            quotaResetDate: quota.quotaResetDate,
            stripeCurrentPeriodEnd: quota.stripeCurrentPeriodEnd,
            dateCreated: quota.dateCreated,
            dateUpdated: quota.dateUpdated
        } : null 
    });
}
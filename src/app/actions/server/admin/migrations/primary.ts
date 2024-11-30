"use server"

import { Logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { srv_authAdminUser } from '@/lib/useUser'


export interface MongoUser {
    _id: { $oid: string };
    userId: string;
    tier: 'free' | 'pro' | 'power';
    role: 'user' | 'admin';
    about?: string;
    dateCreated: { $date: string };
    dateUpdated: { $date: string };
    __v: number;
    onboardingComplete: boolean;
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: { $date: string };
}

export interface MongoJob {
    _id: { $oid: string };
    id?: string;
    userId: string;
    company: string;
    position: string;
    status: 'YET_TO_APPLY' | 'APPLIED' | 'PHONE_SCREEN' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'ACCEPTED' | 'ARCHIVED';
    website?: string;
    jobDescription?: string;
    dateApplied?: { $date: string };
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    interviewDate?: { $date: string };
    salary?: number;
    location?: string;
    remoteType?: 'onsite' | 'remote' | 'hybrid';
    jobType?: 'full_time' | 'part_time' | 'contract' | 'internship';
    flag?: string;
    aiRated?: boolean;
    aiNotes?: string;
    aiRating?: number;
    dateCreated: { $date: string };
    dateUpdated: { $date: string };
    __v: number;
}

export async function srv_migrateMongoUsers(mongoExport: MongoUser[]) {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            throw new Error('Forbidden');
        }

        console.log(`Starting migration of ${mongoExport.length} users...`);

        const users = await Promise.all(mongoExport.map(async (item) => {
            console.log(`Processing user ${item.userId}...`);
            
            const user = await prisma.user.create({
                data: {
                    id: item.userId,
                    tier: item.tier,
                    role: item.role,
                    about: item.about,
                    onboardingComplete: item.onboardingComplete,
                    stripeCustomerId: item.stripeCustomerId,
                    subscriptionId: item.subscriptionId,
                    subscriptionStatus: item.subscriptionStatus,
                    cancelAtPeriodEnd: item.cancelAtPeriodEnd,
                    currentPeriodEnd: item.currentPeriodEnd ? new Date(item.currentPeriodEnd.$date) : null,
                    createdAt: new Date(item.dateCreated.$date),
                    updatedAt: new Date(item.dateUpdated.$date)
                }
            });

            // await Logger.info('admin.migration.user.created', {
            //     userId: user.id,
            //     mongoId: item._id.$oid
            // });

            return user;
        }));

        // await Logger.info('admin.migration.users.completed', {
        //     count: users.length
        // });

        return users;
    } catch (error) {
        // await Logger.error('admin.migration.users.failed', {
        //     error: error instanceof Error ? error.message : 'Unknown error',
        //     stack: error instanceof Error ? error.stack : undefined
        // });
        throw error;
    }
}


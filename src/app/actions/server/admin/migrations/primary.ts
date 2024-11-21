"use server"

import { Logger } from '@/lib/logger'
import { JobStatus, PrismaClient } from '@prisma/client'
import { srv_authAdminUser } from '@/lib/useUser'

const prisma = new PrismaClient()

export interface MongoUser {
    _id: { $oid: string };
    userId: string;
    tier: 'free' | 'pro' | 'power';
    role: 'user' | 'admin';
    about?: string;
    dateCreated: { $date: string };
    dateUpdated: { $date: string };
    __v: number;
    onBoardingComplete: boolean;
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
                    onboardingComplete: item.onBoardingComplete,
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

export async function srv_migrateMongoJobs() {
    // Open local file in the same directory as this file
    const mongoExport = require('./appliedtrack.jobs.json') as MongoJob[];
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            throw new Error('Forbidden');
        }

        console.log(`Found ${mongoExport.length} jobs to migrate...`);

        const jobs = [];
        
        // Process one job at a time
        for (let i = 0; i < mongoExport.length; i++) {
            const item = mongoExport[i];
            console.log(`Processing job ${i + 1} of ${mongoExport.length}: ${item._id.$oid}...`);

            // Date Handling
            const dateApplied = (() => {
                if (!item.dateApplied) return new Date();
                try {
                    const date = new Date(Date.parse(item.dateApplied.$date));
                    return isNaN(date.getTime()) ? new Date() : date;
                } catch {
                    return new Date();
                }
            })();

            const interviewDate = (() => {
                if (!item.interviewDate) return null;
                try {
                    const date = new Date(Date.parse(item.interviewDate.$date));
                    return isNaN(date.getTime()) ? null : date;
                } catch {
                    return null;
                }
            })();

            const jobStatus = item.status.toUpperCase() as JobStatus;

            try {
                const job = await prisma.job.create({
                    data: {
                        id: item._id.$oid,
                        userId: item.userId,
                        company: item.company,
                        position: item.position,
                        status: jobStatus,
                        website: item.website,
                        jobDescription: item.jobDescription,
                        dateApplied: dateApplied,
                        notes: item.notes,
                        contactName: item.contactName,
                        contactEmail: item.contactEmail,
                        contactPhone: item.contactPhone,
                        interviewDate,
                        location: item.location,
                        remoteType: item.remoteType,
                        jobType: item.jobType,
                        flag: item.flag,
                        aiRated: item.aiRated || false,
                        aiNotes: item.aiNotes,
                        aiRating: item.aiRating,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                jobs.push(job);
            } catch (error) {
                console.error(`Failed to migrate job ${item._id.$oid}:`, error);
                // Continue with next job instead of failing the entire migration
                continue;
            }

            // Add a small delay between jobs
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Successfully migrated ${jobs.length} jobs.`);
        return jobs;
    } catch (error) {
        console.error('Failed to migrate jobs:', error);
        throw error;
    } finally {
        // Disconnect from the database
        await prisma.$disconnect();
    }
}

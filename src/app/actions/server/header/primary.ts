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
import { createInitialQuota, checkAndResetQuota } from "@/lib/useQuota"
import { Logger } from "@/lib/logger"
import Stripe from 'stripe';
import { srv_getConfigTiers } from "../settings/primary"
import { ConfigData } from "@/components/header"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

async function shouldCheckSubscription(user: CompleteUserProfile): Promise<boolean> {
    if (!user.subscriptionId) return false;
    
    // Always check if there's no last check timestamp
    if (!user.updatedAt) return true;

    const lastCheck = new Date(user.updatedAt).getTime();
    const now = Date.now();

    // Check if cache has expired
    if (now - lastCheck > CACHE_DURATION) return true;

    // Check if we're within 24 hours of period end
    if (user.currentPeriodEnd) {
        const periodEnd = new Date(user.currentPeriodEnd).getTime();
        const timeUntilEnd = periodEnd - now;
        if (timeUntilEnd <= 24 * 60 * 60 * 1000) return true; // Check if within 24 hours of expiry
    }

    // Check if subscription status is not active
    if (user.subscriptionStatus && user.subscriptionStatus !== 'active') return true;

    return false;
}

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
    initConfig: ConfigData | null;
}

export async function srv_getHeaderData(userId: string): Promise<HeaderData> {
    const user = await srv_getCompleteUserProfile(userId) as CompleteUserProfile;
    const initConfig = await srv_getConfigTiers();
    const quota = await prisma.userQuota.findUnique({
        where: { userId },
        include: {
            notifications: true,
            quotaUsage: true
        }
    });

    // Validate and update subscription status only when necessary
    if (user.subscriptionId) {
        try {
            // Fetch the latest subscription status from Stripe
            const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
            const now = new Date();
            const stripePeriodEnd = new Date(subscription.current_period_end * 1000);
            console.log(`User ${userId} subscription status: ${subscription.status}`)
            // Update user's subscription details if they've changed
            if (subscription.status !== user.subscriptionStatus || 
                stripePeriodEnd.getTime() !== new Date(user.currentPeriodEnd!).getTime() ||
                subscription.cancel_at_period_end !== user.cancelAtPeriodEnd) {
                
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionStatus: subscription.status,
                        currentPeriodEnd: stripePeriodEnd,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        updatedAt: new Date()
                    }
                });

                await Logger.info('Updated user subscription details from Stripe', {
                    userId,
                    subscriptionId: user.subscriptionId,
                    newStatus: subscription.status,
                    newPeriodEnd: stripePeriodEnd
                });

                // Only handle downgrade if status is not active
                if (subscription.status !== 'active' || stripePeriodEnd < now) {
                    // Downgrade user to free tier
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            tier: 'free',
                            subscriptionStatus: subscription.status,
                            currentPeriodEnd: null,
                            cancelAtPeriodEnd: null,
                            updatedAt: new Date()
                        }
                    });

                    await Logger.info('User downgraded to free tier', {
                        userId,
                        previousStatus: user.subscriptionStatus,
                        newStatus: subscription.status
                    });

                    await checkAndResetQuota(userId);
                    
                    // Return updated data
                    const [updatedUser, updatedQuota] = await Promise.all([
                        srv_getCompleteUserProfile(userId) as Promise<CompleteUserProfile>,
                        prisma.userQuota.findUnique({
                            where: { userId },
                            include: {
                                notifications: true,
                                quotaUsage: true
                            }
                        })
                    ]);

                    if (updatedQuota) {
                        return plain({ 
                            ...updatedUser, 
                            quota: {
                                ...updatedQuota,
                                quotaResetDate: updatedQuota.quotaResetDate,
                                stripeCurrentPeriodEnd: updatedQuota.stripeCurrentPeriodEnd,
                                dateCreated: updatedQuota.dateCreated,
                                dateUpdated: updatedQuota.dateUpdated
                            },
                            initConfig: initConfig
                        });
                    }
                }
            }
        } catch (error) {
            await Logger.error('Error verifying Stripe subscription', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                subscriptionId: user.subscriptionId
            });
        }
    }

    if (!quota) {   
        const initialQuota = await createInitialQuota(userId);
        return plain({ 
            ...user, 
            quota: initialQuota ? {
                ...initialQuota,
                quotaResetDate: initialQuota.quotaResetDate,
                stripeCurrentPeriodEnd: initialQuota.stripeCurrentPeriodEnd,
                dateCreated: initialQuota.dateCreated,
                dateUpdated: initialQuota.dateUpdated
            } : null ,
            initConfig: initConfig
        });
    }

    return plain({ 
        ...user, 
        quota: quota ? {
            ...quota,
            quotaResetDate: quota.quotaResetDate,
            stripeCurrentPeriodEnd: quota.stripeCurrentPeriodEnd,
            dateCreated: quota.dateCreated,
            dateUpdated: quota.dateUpdated
        } : null ,
        initConfig: initConfig
    });
}
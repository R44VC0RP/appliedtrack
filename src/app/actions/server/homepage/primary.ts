"use server"

import { ConfigModel } from "@/models/Config"
import { WaitlistUserModel } from "@/models/WaitlistUser"
import { CampaignModel } from "@/models/Campaign"
import { srv_getServiceQuota } from "@/lib/tierlimits"
import { Logger } from "@/lib/logger"

async function checkIfEmailIsAlreadyOnWaitlist(email: string) {
    const waitlistUser = await WaitlistUserModel.findOne({ email })
    return waitlistUser ? true : false
}

async function recordRefSignup(ref: string) {
    const campaign = await CampaignModel.findOne({ ref })
    if (!campaign) {
        throw new Error('Campaign not found')
    }
    campaign.signups += 1
    await campaign.save()
}

export async function srv_handleWaitlistSignup(email: string, ref: string) {
    if (ref) {
        await recordRefSignup(ref)
    }
    const isEmailAlreadyOnWaitlist = await checkIfEmailIsAlreadyOnWaitlist(email)
    if (isEmailAlreadyOnWaitlist) {
        return {
            error: true,
            message: "You're already on our waitlist",
            email,
            ref
        }
    } else {
        await WaitlistUserModel.create({ email })
        const totalUsers: number = await WaitlistUserModel.countDocuments() + 432
        return {
            error: false,
            message: "You're number " + totalUsers + " on the waitlist. We'll notify you when we launch!",
            email,
            totalUsers 
        }
    }
}

export async function srv_getHomepageData() {
    try {
        const config = await ConfigModel.findOne({});
        if (!config) {
            await Logger.error('Failed to fetch config for homepage data', {
                action: 'GET_HOMEPAGE_DATA'
            });
            throw new Error('Configuration not found');
        }

        const dailySignups = Math.floor(Math.random() * (50 - 35 + 1)) + 35;

        // Helper function to format feature text
        const formatFeature = (serviceName: string, limit: number): string => {
            if (limit === -1) return `Unlimited ${serviceName}`;
            return `Up to ${limit} ${serviceName}/month`;
        };

        // Generate pricing tiers dynamically
        const pricingTiers = [
            {
              name: "Free",
              price: "Free",
              features: [
                "5 AI Resume Generations",
                "5 AI Cover Letter Generations",
                "5 JobMatch Reviews",
                "5 Hunter Email Searches "
              ]
            },
            {
              name: "Pro",
              price: "$10",
              features: [
                "20 AI Resume Generations",
                "20 AI Cover Letter Generations",
                "20 JobMatch Reviews",
                "10 Hunter Email Searches"
              ]
            },
            {
              name: "Power",
              price: "$30",
              features: [
                "50 AI Resume Generations",
                "50 AI Cover Letter Generations",
                "50 JobMatch Reviews",
                "20 Hunter Email Searches"
              ]
            }
          ];

        await Logger.info('Homepage data generated successfully', {
            numberOfServices: Object.keys(config.services).length,
            tiers: pricingTiers.map(tier => tier.name)
        });

        return {
            pricingTiers,
            dailySignups
        };

    } catch (error) {
        await Logger.error('Failed to generate homepage data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_recordPageVisit(ref: string) {
    const campaign = await CampaignModel.findOne({ ref })
    if (!campaign) {
        throw new Error('Campaign not found')
    }
    campaign.visits += 1
    await campaign.save()
    return {
        ref
    }
}
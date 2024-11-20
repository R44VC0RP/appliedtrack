"use server"

import { Logger } from "@/lib/logger"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkIfEmailIsAlreadyOnWaitlist(email: string) {
    const waitlistUser = await prisma.waitlistUser.findUnique({
        where: { email }
    })
    return !!waitlistUser
}

async function recordRefSignup(ref: string) {
    const campaign = await prisma.campaign.findUnique({
        where: { ref }
    })
    if (!campaign) {
        throw new Error('Campaign not found')
    }
    
    await prisma.campaign.update({
        where: { ref },
        data: {
            signups: { increment: 1 }
        }
    })
}

export async function srv_handleWaitlistSignup(email: string, ref: string) {
    try {
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
        }

        await prisma.waitlistUser.create({
            data: {
                email,
                campaignRef: ref || null
            }
        })

        // Get total count and add offset
        const totalUsers = await prisma.waitlistUser.count() + 432

        return {
            error: false,
            message: "You're number " + totalUsers + " on the waitlist. We'll notify you when we launch!",
            email,
            totalUsers
        }
    } catch (error) {
        await Logger.error('Failed to handle waitlist signup', {
            error: error instanceof Error ? error.message : 'Unknown error',
            email,
            ref
        })
        throw error
    }
}

export async function srv_getHomepageData() {
    try {
        // Generate pricing tiers
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
        ]

        const dailySignups = Math.floor(Math.random() * (50 - 35 + 1)) + 35

        await Logger.info('Homepage data generated successfully', {
            tiers: pricingTiers.map(tier => tier.name)
        })

        return {
            pricingTiers,
            dailySignups
        }
    } catch (error) {
        await Logger.error('Failed to fetch homepage data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })
        throw error
    }
}

export async function srv_recordPageVisit(ref: string) {
    if (!ref) return

    try {
        await prisma.campaign.update({
            where: { ref },
            data: {
                visits: { increment: 1 }
            }
        })
    } catch (error) {
        await Logger.error('Failed to record page visit', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ref
        })
        // Don't throw error for visit tracking
    }
}
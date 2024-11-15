"use server"

import { ConfigModel, PricingTierLimits } from "@/models/Config"
import { WaitlistUserModel } from "@/models/WaitlistUser"
import { CampaignModel } from "@/models/Campaign"

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
    const config = await ConfigModel.findOne({})
    const dailySignups = Math.floor(Math.random() * (50 - 35 + 1)) + 35
    const pricingTierLimits = config?.tierLimits
    const pricingTiers = [
        { 
          name: "Basic", 
          price: 'Free', 
          features: [
            `Up to ${pricingTierLimits?.free?.jobs ?? 15} job applications`,
            'Unlimited resumes',
            `Up to ${pricingTierLimits?.free?.coverLetters ?? 5} personalized cover letters/month`,
            `${pricingTierLimits?.free?.contactEmails ?? 5} email domain lookups/month`
          ] 
        },
        { 
          name: 'Pro', 
          price: '$10', 
          features: [
            `Up to ${pricingTierLimits?.pro?.jobs ?? 100} job applications`,
            'Unlimited resumes',
            `Up to ${pricingTierLimits?.pro?.coverLetters ?? 25} personalized cover letters/month`,
            `${pricingTierLimits?.pro?.contactEmails ?? 25} email domain lookups/month`,
            'Priority support'
          ] 
        },
        { 
          name: 'Power', 
          price: '$30', 
          features: [
            'Unlimited applications',
            'Unlimited resumes',
            'Unlimited cover letters',
            `${pricingTierLimits?.power?.contactEmails ?? 50} email domain lookups/month`
          ]
        }
    ]
    return {
        pricingTiers,
        dailySignups
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
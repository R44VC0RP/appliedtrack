"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";



type OpenAIUsageMetadata = {
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
};

type HunterUsageMetadata = {
    usage: {
        credits: number;
    };
};

export async function srv_addOpenAIUsage(
    totalTokens: number,
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, any>
) {
    const user = await currentUser();
    if (!user?.id) {
        throw new Error("No authenticated user found");
    }

    const serviceUsage = await prisma.serviceUsage.create({ 
        data: {
            userId: user.id,
            service: "OPENAI",
            metadata: {
                ...metadata,
                usage: {
                    totalTokens,
                    inputTokens,
                    outputTokens,
                },
            },
        },
    });
    return serviceUsage;
}

export async function srv_addHunterUsage(
    credits: number,
    metadata?: Record<string, any>
) {
    const user = await currentUser();
    if (!user?.id) {
        throw new Error("No authenticated user found");
    }

    const serviceUsage = await prisma.serviceUsage.create({ 
        data: {
            userId: user.id,
            service: "HUNTER",
            metadata: {
                ...metadata,
                usage: {
                    credits,
                },
            },
        },
    });
    return serviceUsage;
}

export async function srv_getServiceUsageStats() {
    const allUsage = await prisma.serviceUsage.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 100, // Limit to last 100 records
        include: {
            user: {
                select: {
                    id: true,
                }
            }
        }
    });

    // Calculate usage statistics
    let totalOpenAITokens = 0;
    let totalHunterCredits = 0;

    allUsage.forEach(usage => {
        if (usage.service === 'OPENAI') {
            const metadata = usage.metadata as OpenAIUsageMetadata;
            if (metadata?.usage) {
                const { inputTokens = 0, outputTokens = 0 } = metadata.usage;
                totalOpenAITokens += inputTokens + outputTokens;
            }
        } else if (usage.service === 'HUNTER') {
            const metadata = usage.metadata as HunterUsageMetadata;
            if (metadata?.usage) {
                const { credits = 0 } = metadata.usage;
                totalHunterCredits += credits;
            }
        }
    });

    return {
        summary: {
            totalOpenAITokens,
            totalHunterCredits,
        },
        recentUsage: allUsage.slice(0, 10), // Only return 10 most recent records
    };
}

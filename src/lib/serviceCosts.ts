import { Prisma, ServiceType } from "@prisma/client";

export interface OpenAIUsage {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
}

export interface HunterUsage {
    credits: number;
}

export type ServiceUsageData = {
    [ServiceType.OPENAI]: OpenAIUsage;
    [ServiceType.HUNTER]: HunterUsage;
}

export type ServiceUsageMetadata = Prisma.JsonValue;
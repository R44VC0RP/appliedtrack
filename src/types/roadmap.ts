import { Prisma } from '@prisma/client'

export type RoadmapStatus = 'not_started' | 'in_progress' | 'completed';

export interface TRoadmap {
    id: string;
    title: string;
    description: string;
    status: RoadmapStatus;
    dateCreated: Date;
    dateUpdated: Date;
}

// Helper functions to convert between frontend and backend status formats
export const toFrontendStatus = (status: RoadmapStatus): string => {
    return status.replace('_', '-');
}

export const toBackendStatus = (status: string): RoadmapStatus => {
    return status.replace('-', '_') as RoadmapStatus;
}

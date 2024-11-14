'use server'

import { RoadmapModel, Roadmap } from '@/models/Roadmap'
import { Logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'
import { plain } from '@/lib/plain'
import { srv_authAdminUser } from '@/lib/useUser'

export async function srv_getRoadmapData() {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to fetch roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        const roadmap = await RoadmapModel.find();
        return plain(roadmap);
    } catch (error) {
        await Logger.error('Failed to get roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_createRoadmap(title: string, description: string, status: 'not-started' | 'in-progress' | 'completed') {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to create roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        if (!title || !description) {
            throw new Error('Title and description are required')
        }
        const id = uuidv4()
        const roadmap = await RoadmapModel.create({ id, title, description, status })
        return plain(roadmap)
    } catch (error) {
        await Logger.error('Failed to create roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_updateRoadmap(id: string, title: string, description: string, status: 'not-started' | 'in-progress' | 'completed') {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to update roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        const roadmap = await RoadmapModel.findOneAndUpdate({ id }, { title, description, status }, { new: true })
        return plain(roadmap)
    } catch (error) {
        await Logger.error('Failed to update roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_deleteRoadmap(id: string) {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to delete roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        const roadmap = await RoadmapModel.findOneAndDelete({ id })
        return plain(roadmap)
    } catch (error) {
        await Logger.error('Failed to delete roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}
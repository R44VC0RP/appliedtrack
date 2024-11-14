'use server'

import { RoadmapModel, Roadmap } from '@/models/Roadmap'
import { Logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'
import { plain } from '@/lib/plain'
export async function srv_getRoadmapData() {
    try {
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

    if (!title || !description) {
        throw new Error('Title and description are required')
    }
    const id = uuidv4()
    const roadmap = await RoadmapModel.create({ id, title, description, status })
    return plain(roadmap)
}

export async function srv_updateRoadmap(id: string, title: string, description: string, status: 'not-started' | 'in-progress' | 'completed') {
    const roadmap = await RoadmapModel.findOneAndUpdate({ id }, { title, description, status }, { new: true })
    return plain(roadmap)
}

export async function srv_deleteRoadmap(id: string) {
    const roadmap = await RoadmapModel.findOneAndDelete({ id })
    return plain(roadmap)
}
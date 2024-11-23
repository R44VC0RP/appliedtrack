'use server'

import { Logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'
import { srv_authAdminUser } from '@/lib/useUser'
import { prisma } from '@/lib/prisma'
import { TRoadmap, RoadmapStatus } from '@/types/roadmap'



const mapPrismaRoadmapToRoadmap = (prismaRoadmap: any): TRoadmap => ({
    ...prismaRoadmap,
    status: prismaRoadmap.status as RoadmapStatus
})

export async function srv_getRoadmapData(): Promise<TRoadmap[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to fetch roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        
        const roadmaps = await prisma.roadmapItem.findMany({
            orderBy: {
                dateCreated: 'desc'
            }
        });
        
        return roadmaps.map(mapPrismaRoadmapToRoadmap);
    } catch (error) {
        await Logger.error('Failed to get roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_createRoadmap(title: string, description: string, status: RoadmapStatus): Promise<TRoadmap> {
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

        const roadmap = await prisma.roadmapItem.create({
            data: {
                id: uuidv4(),
                title,
                description,
                status: status as RoadmapStatus
            }
        });

        return mapPrismaRoadmapToRoadmap(roadmap);
    } catch (error) {
        await Logger.error('Failed to create roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_updateRoadmap(id: string, title: string, description: string, status: RoadmapStatus): Promise<TRoadmap> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to update roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }

        const roadmap = await prisma.roadmapItem.update({
            where: { id },
            data: {
                title,
                description,
                status: status as RoadmapStatus
            }
        });

        return mapPrismaRoadmapToRoadmap(roadmap);
    } catch (error) {
        await Logger.error('Failed to update roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_deleteRoadmap(id: string): Promise<TRoadmap> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to delete roadmap data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }

        const roadmap = await prisma.roadmapItem.delete({
            where: { id }
        });

        return mapPrismaRoadmapToRoadmap(roadmap);
    } catch (error) {
        await Logger.error('Failed to delete roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

const mongoExport = [{
    "_id": {
      "$oid": "673564c0a3e1fcdd18f8e690"
    },
    "id": "50deea48-67f0-477b-aafc-0b4934ce1c7a",
    "title": "Header | Use Server Actions",
    "description": "Update the header to use react server actions instead of a bunch of endpoint.",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-14T02:47:28.995Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T02:47:28.995Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "67356845a3e1fcdd18f8e6ba"
    },
    "id": "0ed2110f-6e7a-4d5c-be22-9bde88037a52",
    "title": "Extract Dashboard",
    "description": "Extract out dashboard to use server components but also a be a lot faster and simpler, by removing redundancies. \n\nThis should optemize the page by preloading mostly everything with server components and only updating what you need to.",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-14T03:02:29.273Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T03:02:29.273Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "673568aea3e1fcdd18f8e6be"
    },
    "id": "4d452de5-7354-4c20-a233-d14768881c17",
    "title": "Look into JSON Resumes instead of LaTeX",
    "description": "LaTeX is being really hard to work with so we will be pushing that farther down the roadmap.\n\nI need to work on the generative AI features with resumes of this sort.",
    "status": "not-started",
    "dateCreated": {
      "$date": "2024-11-14T03:04:14.855Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T03:04:14.855Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "67356929a3e1fcdd18f8e6cc"
    },
    "id": "c87a60e6-537b-4a48-a5d9-c54b238ab7ce",
    "title": "Subscription Management",
    "description": "Update the subscription logic, so that if a user upgrades or cancels the service it is handled so that we can add in proper retention logic in the future.\n\nThis also needs to include the automatic .edu discount of 50%. (ADDED)\n\nTODO:\n\nIt needs to autocancel and upgrade a subscription the right way (whatever that correct way is)\n\n",
    "status": "in-progress",
    "dateCreated": {
      "$date": "2024-11-14T03:06:17.332Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T03:06:17.332Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "6735721e1a92b7400057bdc0"
    },
    "id": "bc751fa9-25fd-4aa9-8eb7-c37fdad50d96",
    "title": "Admin | Components to Use Server Actions",
    "description": "Update all of the Admin Component to use server actions. Also remove the admin components that are no longer needed. (With exception of logging, this might still need an API. I will check)\n\nLogging still uses an API.\n",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-14T03:44:30.321Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T03:44:30.321Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "67357d3f1a92b7400057bef3"
    },
    "id": "ecf6b4e3-0434-4c6c-bb7b-87daccbf2a5e",
    "title": "Admin | Users Update to Server Actions",
    "description": "Update it to use server actions",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-14T04:31:59.400Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T04:31:59.400Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "6735f35aa9e157fb732e7d80"
    },
    "id": "009534d1-5e7d-4fe3-8926-9269f2ebccaf",
    "title": "Admin | Waitlist Update to Server Actions",
    "description": "Update the waitlist component to use server actions.\n",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-14T12:55:54.985Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T12:55:54.985Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "673635eab0e806ccdfc4af92"
    },
    "id": "0eada7e0-fc4c-46e9-806f-1902f26a3359",
    "title": "Header | Convert header to server rendered for better speeds",
    "description": "Update header for better speeds.",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-14T17:39:54.716Z"
    },
    "dateUpdated": {
      "$date": "2024-11-14T17:39:54.716Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "6736a9c6b9274b6302a8004a"
    },
    "id": "c3a63e7e-2e5d-490c-8776-439d2411746e",
    "title": "JobCard & AppliedTrack | Using and being implemented with server components.",
    "description": "Using server actions for all API calls:\n\n- Currently updated getJobs, updateJobs",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-15T01:54:14.662Z"
    },
    "dateUpdated": {
      "$date": "2024-11-15T01:54:14.662Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "6737d38a54ec8049294dd627"
    },
    "id": "18c86856-7d2a-448a-81db-13d394a4053e",
    "title": "Dashboard | Better keyboard shortcuts.",
    "description": "Look into a better icon and keyboard shortcut library.",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-15T23:04:42.312Z"
    },
    "dateUpdated": {
      "$date": "2024-11-15T23:04:42.312Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "6737d67b54ec8049294dd62e"
    },
    "id": "9d19d474-2caa-423e-a7fe-0d4af2251c79",
    "title": "Admin & Dashboard | Add keyboard shortcuts with correct keyboard icons.",
    "description": "Use the cmd icon here:",
    "status": "not-started",
    "dateCreated": {
      "$date": "2024-11-15T23:17:15.871Z"
    },
    "dateUpdated": {
      "$date": "2024-11-15T23:17:15.871Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "6737d67c54ec8049294dd631"
    },
    "id": "33f3a871-1d4c-4f32-8307-43c8eb47d3d2",
    "title": "Admin & Dashboard | Add keyboard shortcuts with correct keyboard icons.",
    "description": "Use the cmd icon here:\n\nhttps://lucide.dev/icons/command\n\nAnd find an alternative for the window control icon:\nhttps://lucide.dev/icons/chevron-up\n\nwith a plus and the letter.\n\nalso integrate this with a unified keyboard shortcut library for ease of maintenance and ease of use.\n\n",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-15T23:17:16.037Z"
    },
    "dateUpdated": {
      "$date": "2024-11-15T23:17:16.037Z"
    },
    "__v": 0
  },
  {
    "_id": {
      "$oid": "673a5b52306e94566a743619"
    },
    "id": "1b0ea3cd-1fe9-4552-927f-214fe09571ea",
    "title": "Dashboard | Extract Hunter out to a server component.",
    "description": "yep",
    "status": "completed",
    "dateCreated": {
      "$date": "2024-11-17T21:08:34.902Z"
    },
    "dateUpdated": {
      "$date": "2024-11-17T21:08:34.902Z"
    },
    "__v": 0
  }]
// One-time migration function
export async function srv_migrateMongoRoadmapData(): Promise<TRoadmap[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            throw new Error('Forbidden');
        }

        const roadmaps = await Promise.all(mongoExport.map(async (item) => {
            console.log(`Processing ${item._id.$oid}...\nArributes: Title: ${item.title} Status: ${item.status}, Date Created: ${item.dateCreated.$date}, Date Updated: ${item.dateUpdated.$date}`);

            const roadmap = await prisma.roadmapItem.create({
                data: {
                    title: item.title,
                    description: item.description,
                    status: item.status.replace('-', '_') as RoadmapStatus,
                    dateCreated: new Date(item.dateCreated.$date),
                    dateUpdated: new Date(item.dateUpdated.$date)
                }
            });
            return mapPrismaRoadmapToRoadmap(roadmap);
        }));

        return roadmaps;
    } catch (error) {
        await Logger.error('Failed to migrate MongoDB roadmap data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

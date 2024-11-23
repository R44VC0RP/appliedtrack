"use server"

/*
    So for the waitlist, we need to be able to:
    - View all users in the waitlist
    - Send an invitation to a user
    - Delete a user from the waitlist
*/

import { Logger } from "@/lib/logger";
import { srv_authAdminUser } from "@/lib/useUser";
import { prisma } from "@/lib/prisma";

export async function srv_getWaitlist(): Promise<any[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to fetch waitlist data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }

        const waitlist = await prisma.waitlistUser.findMany({
            orderBy: {
                dateSignedUp: 'desc'
            }
        });

        return waitlist;
    } catch (error) {
        await Logger.error('Failed to fetch waitlist data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_deleteWaitlistUser(email: string): Promise<any[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to delete waitlist data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }

        await prisma.waitlistUser.delete({
            where: {
                email: email
            }
        });

        return srv_getWaitlist();
    } catch (error) {
        await Logger.error('Failed to delete waitlist data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_sendInvitation(email: string): Promise<any[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to send invitation', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }

        await prisma.waitlistUser.update({
            where: {
                email: email
            },
            data: {
                isNotified: true
            }
        });

        return srv_getWaitlist();
    } catch (error) {
        await Logger.error('Failed to send invitation', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}
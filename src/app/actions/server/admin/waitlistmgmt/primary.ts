"use server"

/*
    So for the waitlist, we need to be able to:
    - View all users in the waitlist
    - Send an invitation to a user
    - Delete a user from the waitlist
*/

import { WaitlistUser } from "@/models/WaitlistUser";
import { WaitlistUserModel } from "@/models/WaitlistUser";
import dbConnect from "@/lib/mongodb";
import { plain } from "@/lib/plain";
import { Logger } from "@/lib/logger";
import { srv_authAdminUser } from "@/lib/useUser";

export async function srv_getWaitlist(): Promise<WaitlistUser[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to fetch waitlist data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        await dbConnect();
        const waitlist = await WaitlistUserModel.find();
        return plain(waitlist);
    } catch (error) {
        await Logger.error('Failed to fetch waitlist data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_deleteWaitlistUser(email: string): Promise<WaitlistUser[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to delete waitlist data', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        await dbConnect();
        await WaitlistUserModel.findOneAndDelete({ email: email });
        const result = await srv_getWaitlist();
        return plain(result);
    } catch (error) {
        await Logger.error('Failed to delete waitlist data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function srv_sendInvitation(email: string): Promise<WaitlistUser[]> {
    try {
        const authAdminUser = await srv_authAdminUser();
        if (!authAdminUser) {
            await Logger.warning('Non-admin user attempted to send invitation', {
                error: "Forbidden"
            });
            throw new Error('Forbidden');
        }
        await dbConnect();
        await WaitlistUserModel.findOneAndUpdate({ email: email }, { $set: { isNotified: true } });
        const result = await srv_getWaitlist();
        return plain(result);
    } catch (error) {
        await Logger.error('Failed to send invitation', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}
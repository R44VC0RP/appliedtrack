"use server"

import { currentUser } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend"
import { Logger } from "@/lib/logger";
import { UserModel } from "@/models/User";
import { ResumeModel } from "@/models/Resume";
import { plain } from "@/lib/plain";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import { ConfigModel } from "@/models/Config";
import Stripe from 'stripe';
import { UserTier, StripeCheckoutOptions } from '@/types/subscription';
import { resetQuota, checkQuotaLimits, notifyQuotaStatus, createInitialQuota } from '@/models/UserQuota';
import { UserQuotaModel } from "@/models/UserQuota";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const utapi = new UTApi();

// Schema for user details validation
const UserDetailsSchema = z.object({
  about: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function srv_getUserDetails() {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to get user details', {
        path: "srv_getUserDetails",
        method: 'GET'
      });
      return null;
    }

    // Get user details and quota information
    console.log('Fetching details for user:', user.id);
    
    const [userDetails, userQuota] = await Promise.all([
      UserModel.findOne({ userId: user.id }),
      UserQuotaModel.findOne({ userId: user.id })
    ]);

    console.log('Raw userDetails:', userDetails);
    console.log('Raw userQuota:', userQuota);

    if (!userQuota) {
      console.log('No quota found for user, creating initial quota');
      const newQuota = await createInitialQuota(user.id);
      console.log('Created new quota:', newQuota);
    } else {
      console.log('Found existing quota:', userQuota);
    }

    // First convert userDetails to plain object
    const plainUserDetails = plain(userDetails);
    
    // Then attach the quota data
    if (userDetails && userQuota) {
      // Convert Map to plain object for usage and clean up any duplicate keys
      const plainUsage = plain(userQuota.usage);
      
      // If we have both 'jobs' and 'JOBS_COUNT', use JOBS_COUNT
      if ('jobs' in plainUsage && 'JOBS_COUNT' in plainUsage) {
        delete plainUsage['jobs'];
      }
      
      console.log('Plain usage after cleanup:', plainUsage);

      plainUserDetails.quotas = {
        usage: plainUsage,
        quotaResetDate: userQuota.quotaResetDate,
        notifications: userQuota.notifications
      };
    }

    console.log('Final plainUserDetails:', plainUserDetails);
    return plainUserDetails;
  } catch (error) {
    await Logger.error('Error fetching user details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_updateUserDetails(details: z.infer<typeof UserDetailsSchema>) {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to update user details', {
        path: "srv_updateUserDetails",
        method: 'PUT'
      });
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validatedData = UserDetailsSchema.parse(details);

    const updatedUser = await UserModel.findOneAndUpdate(
      { userId: user.id },
      {
        ...validatedData,
        dateUpdated: new Date().toISOString()
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    await Logger.info('User details updated successfully', {
      userId: user.id,
      updatedFields: Object.keys(validatedData)
    });

    return { success: true, data: plain(updatedUser) };
  } catch (error) {
    await Logger.error('Error updating user details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_getResumes() {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to get resumes', {
        path: "srv_getResumes",
        method: 'GET'
      });
      return [];
    }

    const resumes = await ResumeModel.find({ userId: user.id })
      .select('resumeId fileUrl fileName dateCreated');

    await Logger.info('Resumes retrieved successfully', {
      userId: user.id,
      count: resumes.length
    });

    return plain(resumes);
  } catch (error) {
    await Logger.error('Error fetching resumes', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_addResume(fileUrl: string, fileName: string, fileKey: string) {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to add resume', {
        path: "srv_addResume",
        method: 'POST'
      });
      return { success: false, error: 'Unauthorized' };
    }

    const newResume = await ResumeModel.create({
      userId: user.id,
      fileId: fileKey,
      resumeId: `RESUME_${fileKey}`,
      fileUrl,
      fileName,
      dateCreated: new Date().toISOString()
    });

    await Logger.info('Resume added successfully', {
      userId: user.id,
      resumeId: newResume.resumeId,
      fileName
    });

    return { success: true, data: plain(newResume) };
  } catch (error) {
    await Logger.error('Error adding resume', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_removeResume(resumeId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to remove resume', {
        path: "srv_removeResume",
        method: 'DELETE',
        resumeId
      });
      return { success: false, error: 'Unauthorized' };
    }

    // Find the resume first to get the file key
    const resume = await ResumeModel.findOne({ resumeId, userId: user.id });
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Delete from UploadThing if there's a fileKey
    if (resume.fileUrl) {
      const fileKey = resume.fileUrl.split('/').pop();
      if (fileKey) {
        await utapi.deleteFiles([fileKey]);
      }
    }

    // Delete from database
    await ResumeModel.deleteOne({ resumeId, userId: user.id });

    await Logger.info('Resume removed successfully', {
      userId: user.id,
      resumeId
    });

    return { success: true };
  } catch (error) {
    await Logger.error('Error removing resume', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_createStripeCheckout(tier: Exclude<UserTier, 'free'>) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const PRICE_IDS = {
      pro: process.env.STRIPE_PRO_PRICE_ID!,
      power: process.env.STRIPE_POWER_PRICE_ID!
    };

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      throw new Error('Invalid tier');
    }

    const userDetails = await UserModel.findOne({ userId: user.id });
    if (!userDetails) {
      throw new Error('User details not found');
    }

    // Check if user is already on this tier
    if (userDetails.tier === tier) {
      throw new Error('Already subscribed to this tier');
    }

    if (!user.emailAddresses[0].emailAddress) {
      throw new Error('No email address found');
    }

    const promotionCode = process.env.NODE_ENV === 'production' ? 'yaH1WWJW' : 'v8SGiyAV';

    // Create a unique session ID
    const sessionId = `${user.id}_${Date.now()}`;

    const session = await stripe.checkout.sessions.create({
      customer_email: user.emailAddresses[0].emailAddress,
      ...(user.emailAddresses[0].emailAddress.endsWith('.edu') ? {
        discounts: [{ coupon: promotionCode }]
      } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription&canceled=true`,
      metadata: {
        userId: user.id,
        tier,
        sessionId,
        previousTier: userDetails.tier
      },
    });

    await Logger.info('Created checkout session', {
      userId: user.id,
      tier,
      sessionId
    });

    return { url: session.url, sessionId };
  } catch (error) {
    await Logger.error('Error creating checkout session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_handleSubscriptionChange(
  clerkUserId: string,
  stripeCustomerId: string,
  newTier: UserTier,
  periodEnd: Date
) {
  try {
    // First try to find by Clerk user ID
    let user = await UserModel.findOne({ userId: clerkUserId });
    
    await Logger.info('Looking up user for subscription change', {
      clerkUserId,
      stripeCustomerId,
      foundByClerkId: !!user
    });

    if (!user) {
      throw new Error('User not found');
    }

    const previousTier = user.tier;

    // Update user's tier
    await UserModel.findOneAndUpdate(
      { userId: clerkUserId },
      { 
        tier: newTier,
        dateUpdated: new Date(),
        ...(newTier !== 'free' ? {
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false
        } : {
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: undefined
        })
      }
    );

    // Reset quotas based on new tier
    await resetQuota({
      userId: clerkUserId,
      tier: newTier,
      resetDate: periodEnd
    });

    await Logger.info('Subscription changed', {
      userId: clerkUserId,
      previousTier,
      newTier,
      periodEnd
    });

    // Check quota limits after change
    const notifications = await checkQuotaLimits(clerkUserId, newTier);
    if (notifications.length > 0) {
      await notifyQuotaStatus(notifications);
    }

    return true;
  } catch (error) {
    await Logger.error('Error handling subscription change', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: clerkUserId
    });
    throw error;
  }
}

export async function srv_createCustomerPortal() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const dbUser = await UserModel.findOne({ userId: user.id });
    if (!dbUser?.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription`,
    });

    return { url: session.url };
  } catch (error) {
    await Logger.error('Error creating portal session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_getConfigTiers() {
  try {
    const config = await ConfigModel.findOne({});
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Get the raw document
    const rawDoc = plain(config);

    // Create a clean structure for tierLimits
    const tierLimits = Object.keys(rawDoc.tierLimits).reduce((acc, tier) => {
      acc[tier] = {};
      // Remove _id and only keep limit values for each service
      Object.entries(rawDoc.tierLimits[tier]).forEach(([service, data]: [string, any]) => {
        if (service !== '_id') {
          acc[tier][service] = {
            limit: data.limit
          };
        }
      });
      return acc;
    }, {} as Record<string, Record<string, { limit: number }>>);

    // Create a clean structure for services
    const services = Object.entries(rawDoc.services).reduce((acc, [key, value]: [string, any]) => {
      acc[key] = {
        name: value.name,
        description: value.description,
        active: value.active
      };
      return acc;
    }, {} as Record<string, { name: string; description: string; active: boolean }>);

    await Logger.info('Config tiers retrieved successfully', {
      tiersCount: Object.keys(tierLimits).length,
      servicesCount: Object.keys(services).length
    });

    return { tierLimits, services };
  } catch (error) {
    await Logger.error('Error fetching config tiers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_updateUserEmail(email: string) {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to update email', {
        path: "srv_updateUserEmail",
        method: 'PUT'
      });
      throw new Error('Unauthorized');
    }

    // First check if the email address already exists

    // First create the email address
    const newEmailAddress = await clerkClient.emailAddresses.createEmailAddress({
      userId: user.id,
      emailAddress: email,
      primary: true
    });



    await Logger.info('User email update initiated', {
      userId: user.id,
      newEmail: email,
      emailAddressId: newEmailAddress.id
    });

    return { 
      success: true, 
      message: 'Verification email sent. Please check your inbox to verify the new email address.'
    };

  } catch (error) {
    await Logger.error('Error updating user email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

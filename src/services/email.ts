import { Resend } from 'resend';
import { renderAsync } from '@react-email/render';
import WaitlistEmail from '@/emails/WaitlistEmail';
import AdminWaitlistNotification from '@/emails/AdminWaitlistNotification';
import { User } from '@prisma/client';
import NewUserWelcomeEmail from '@/emails/NewUserWelcomeEmail';
import AdminNewUserNotification from '@/emails/AdminNewUserNotification';
import { Logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWaitlistEmail(email: string) {
  try {
    const html = await renderAsync(WaitlistEmail({ userEmail: email }));

    const data = await resend.emails.send({
      from: 'AppliedTrack <notifications@appliedtrack.com>',
      to: email,
      subject: 'Welcome to the AppliedTrack Waitlist!',
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending waitlist email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNotification(userEmail: string, totalUsers: number) {
  try {
    const html = await renderAsync(AdminWaitlistNotification({ 
      userEmail, 
      totalUsers 
    }));

    const data = await resend.emails.send({
      from: 'AppliedTrack <notifications@appliedtrack.com>',
      to: 'ryan@appliedtrack.com',
      subject: 'New AppliedTrack Waitlist Signup!',
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error };
  }
}

export async function sendNewUserNotification(fullName: string, email: string) {
  try {
    // Send welcome email to user
    const userHtml = await renderAsync(NewUserWelcomeEmail({ 
      fullName, 
      email 
    }));

    const userEmailResult = await resend.emails.send({
      from: 'AppliedTrack <notifications@appliedtrack.com>',
      to: email,
      subject: 'Welcome to AppliedTrack!',
      html: userHtml,
    });

    // Send notification to admin
    const adminHtml = await renderAsync(AdminNewUserNotification({ 
      fullName, 
      email 
    }));

    const adminEmailResult = await resend.emails.send({
      from: 'AppliedTrack <notifications@appliedtrack.com>',
      to: 'ryan@appliedtrack.com',
      subject: 'New AppliedTrack User Registration!',
      html: adminHtml,
    });

    await Logger.info('New user notification emails sent', {
      userEmail: email,
      userName: fullName,
    });

    return { success: true, userEmail: userEmailResult, adminEmail: adminEmailResult };
  } catch (error) {
    await Logger.error('Error sending new user notification emails', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userEmail: email,
      userName: fullName
    });
    return { success: false, error };
  }
}
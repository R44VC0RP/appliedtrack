'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { ContactMessageEmail } from '@/emails/contact-message';
import { Logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'ryan@mandarin3d.com';

export type ContactFormData = {
  name: string;
  email: string;
  category: string;
  message: string;
};

export async function srv_submitContactForm(formData: ContactFormData) {
  try {
    const user = await currentUser();

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    await resend.emails.send({
      from: 'AppliedTrack <no-reply@appliedtrack.com>',
      to: ADMIN_EMAIL,
      replyTo: formData.email,
      subject: `New Contact Message: ${formData.category}`,
      react: ContactMessageEmail({
        ...formData,
        userId: user?.id,
      }),
    });

    await Logger.info('Contact form submitted successfully', {
      category: formData.category,
      userId: user?.id,
      userEmail: formData.email,
    });

    return { success: true };
  } catch (error) {
    await Logger.error('Failed to submit contact form', {
      error: error instanceof Error ? error.message : 'Unknown error',
      category: formData.category,
      userEmail: formData.email,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: 'Failed to send message. Please try again later.',
    };
  }
} 
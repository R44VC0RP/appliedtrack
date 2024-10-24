import { Resend } from 'resend';
import { renderAsync } from '@react-email/render';
import WaitlistEmail from '@/emails/WaitlistEmail';

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

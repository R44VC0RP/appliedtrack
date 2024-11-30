import { Metadata } from 'next';
import ContactForm from './contact-form';
import { currentUser } from '@clerk/nextjs/server';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contact Us | AppliedTrack',
  description: 'Get in touch with the AppliedTrack team for support, feedback, or inquiries.',
};

export default async function ContactPage() {
  const user = await currentUser();
  
  return (
    <>
      <Header />
      <div className="container mx-auto p-4 dark:bg-gray-950">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Have a question or concern? We're here to help. Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm userId={user?.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 
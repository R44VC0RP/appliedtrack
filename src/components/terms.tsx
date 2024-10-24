import React from 'react';
import { Header } from '@/components/header';
import { Separator } from "@/components/ui/separator";

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using AppliedTrack ("the Service"), you accept and agree to be bound by the terms and conditions outlined in this agreement.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-700">
              AppliedTrack is a job application tracking platform that allows users to manage their job search process, store resumes, and track application status.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Users must:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide accurate and complete information when creating an account</li>
                <li>Maintain the security of their account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Take responsibility for all activities under their account</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="text-gray-700">
              Users retain all rights to their content but grant AppliedTrack a license to use, store, and display the content in connection with the Service.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Users may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Use the Service for any illegal purpose</li>
                <li>Upload malicious code or content</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Interfere with the proper functioning of the Service</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
            <p className="text-gray-700">
              We reserve the right to terminate or suspend access to the Service immediately, without prior notice, for any violation of these Terms.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the Service constitutes acceptance of modified terms.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
            <p className="text-gray-700">
              For questions about these Terms, please contact us at support@appliedtrack.com
            </p>
          </section>

          <div className="mt-8 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { Header } from '@/components/header';
import { Separator } from "@/components/ui/separator";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Account information (name, email, password)</li>
                <li>Profile information (resume, work history, education)</li>
                <li>Job application details and status</li>
                <li>Communication preferences</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We use the collected information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide and maintain the Service</li>
                <li>Track your job applications</li>
                <li>Send notifications about application status</li>
                <li>Improve and personalize your experience</li>
                <li>Communicate with you about our services</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-gray-700">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mt-4 text-gray-700">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in our operations</li>
            </ul>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Export your data</li>
              </ul>
            </div>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Privacy Policy</h2>
            <p className="text-gray-700">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <Separator className="my-6" />

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us at privacy@appliedtrack.com
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

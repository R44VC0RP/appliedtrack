import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface WaitlistEmailProps {
  userEmail?: string;
}

export const WaitlistEmail = ({
  userEmail = 'there',
}: WaitlistEmailProps) => {
  const features = [
    'Smart Application Tracking',
    'Email Discovery powered by Hunter.io',
    'Resume Management',
    'Cover Letter Generator',
    'Follow-up Reminders',
    'Coming Soon: ATS Review',
  ];

  return (
    <Html>
      <Head />
      <Preview>Welcome to the AppliedTrack waitlist!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to AppliedTrack!</Heading>
          
          <Text style={text}>
            Hi {userEmail.split('@')[0]},
          </Text>
          
          <Text style={text}>
            Thank you for joining the AppliedTrack waitlist! We're excited to have you on board
            and can't wait to help you streamline your job search process.
          </Text>

          <Section style={featuresSection}>
            <Heading style={h2}>What to Look Forward To:</Heading>
            {features.map((feature, index) => (
              <Text key={index} style={featureText}>
                - {feature}
              </Text>
            ))}
          </Section>

          <Text style={text}>
            We're working hard to bring you the best job application tracking experience.
            You'll be among the first to know when we launch!
          </Text>

          <Section style={ctaSection}>
            <Link style={button} href="https://appliedtrack.com">
              Learn More
            </Link>
          </Section>

          <Text style={footer}>
            If you have any questions, just reply to this email - we're always happy to help.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles matching your website's theme
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '500',
  lineHeight: '28px',
  margin: '0 0 16px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const featuresSection = {
  margin: '24px 0',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
};

const featureText = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '8px 0',
};

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0 0',
};

export default WaitlistEmail;

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
} from '@react-email/components';
import * as React from 'react';

interface NewUserWelcomeEmailProps {
  fullName: string;
  email: string;
}

export const NewUserWelcomeEmail = ({
  fullName,
  email,
}: NewUserWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to AppliedTrack - Let's streamline your job search!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to AppliedTrack!</Heading>
          
          <Text style={text}>
            Hi {fullName},
          </Text>
          
          <Text style={text}>
            Thank you for joining AppliedTrack! We're excited to help you organize and optimize 
            your job search journey.
          </Text>

          <Section style={featuresSection}>
            <Heading style={h2}>Getting Started:</Heading>
            <Text style={featureText}>
              1. Complete your profile
            </Text>
            <Text style={featureText}>
              2. Import or create your first resume
            </Text>
            <Text style={featureText}>
              3. Start tracking your job applications
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Link style={button} href="https://appliedtrack.com/dashboard">
              Go to Dashboard
            </Link>
          </Section>

          <Text style={footer}>
            Need help? Reply to this email or contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

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

export default NewUserWelcomeEmail; 
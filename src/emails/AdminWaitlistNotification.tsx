import { Html } from '@react-email/html';
import { Text } from '@react-email/text';
import { Section } from '@react-email/section';
import { Container } from '@react-email/container';

interface AdminWaitlistNotificationProps {
  userEmail: string;
  totalUsers: number;
}

export default function AdminWaitlistNotification({ userEmail, totalUsers }: AdminWaitlistNotificationProps) {
  return (
    <Html>
      <Section>
        <Container>
          <Text>New Waitlist Signup!</Text>
          <Text>A new user has joined the AppliedTrack waitlist:</Text>
          <Text>Email: {userEmail}</Text>
          <Text>Total Users on Waitlist: {totalUsers}</Text>
        </Container>
      </Section>
    </Html>
  );
}

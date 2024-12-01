import { Html } from '@react-email/html';
import { Text } from '@react-email/text';
import { Section } from '@react-email/section';
import { Container } from '@react-email/container';

interface AdminNewUserNotificationProps {
  fullName: string;
  email: string;
}

export default function AdminNewUserNotification({ 
  fullName, 
  email 
}: AdminNewUserNotificationProps) {
  return (
    <Html>
      <Section>
        <Container>
          <Text>New User Registration!</Text>
          <Text>A new user has joined AppliedTrack:</Text>
          <Text>Name: {fullName}</Text>
          <Text>Email: {email}</Text>
          <Text>Time: {new Date().toLocaleString()}</Text>
        </Container>
      </Section>
    </Html>
  );
} 
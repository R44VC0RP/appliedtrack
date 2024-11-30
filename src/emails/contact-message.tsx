import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface ContactMessageEmailProps {
  name: string;
  email: string;
  category: string;
  message: string;
  userId?: string;
}

export const ContactMessageEmail = ({
  name,
  email,
  category,
  message,
  userId,
}: ContactMessageEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Contact Message from {name}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              New Contact Message
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>From:</strong> {name} ({email})
            </Text>
            {userId && (
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>User ID:</strong> {userId}
              </Text>
            )}
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>Category:</strong> {category}
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Section>
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>Message:</strong>
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">{message}</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ContactMessageEmail; 
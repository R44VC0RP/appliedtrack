'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEnvelope, FaUser, FaTag, FaComment } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { srv_submitContactForm } from '../actions/server/contact';
import { useUser } from '@clerk/nextjs';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormValues = z.infer<typeof formSchema>;

const categories = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'feedback', label: 'General Feedback' },
  { value: 'other', label: 'Other' },
] as const;

interface ContactFormProps {
  userId?: string | null;
}

export default function ContactForm({ userId }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.fullName || '',
      email: user?.primaryEmailAddress?.emailAddress || '',
      category: '',
      message: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await srv_submitContactForm(values);
      
      if (result.success) {
        toast.success('Message sent successfully');
        form.reset();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field}) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-10" placeholder="Your name" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    className="pl-10" 
                    placeholder="your.email@example.com" 
                    type="email"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <div className="relative">
                  <FaTag className="absolute left-3 top-3 text-muted-foreground z-10" />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <div className="relative">
                  <FaComment className="absolute left-3 top-3 text-muted-foreground" />
                  <Textarea 
                    className="pl-10 min-h-[150px]" 
                    placeholder="Please describe your issue or feedback in detail..."
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </Form>
  );
} 
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export function StripeTestHelper() {
  const simulateWebhookEvent = async (eventType: string) => {
    try {
      const response = await fetch('/api/test/stripe-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType }),
      });

      if (!response.ok) throw new Error('Failed to simulate webhook');
      
      toast({
        title: 'Webhook Simulated',
        description: `Event ${eventType} was triggered`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to simulate webhook',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-4 m-4">
      <h2 className="text-lg font-bold mb-4">Stripe Test Helper</h2>
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold mb-2">Test Card Numbers:</h3>
          <pre className="bg-muted p-2 rounded text-xs">
            Success: 4242 4242 4242 4242
            Decline: 4000 0000 0000 0002
            Auth Required: 4000 0025 0000 3155
          </pre>
        </div>
        <div className="space-x-2">
          <Button
            size="sm"
            onClick={() => simulateWebhookEvent('customer.subscription.created')}
          >
            Simulate Sub Created
          </Button>
          <Button
            size="sm"
            onClick={() => simulateWebhookEvent('customer.subscription.deleted')}
          >
            Simulate Sub Deleted
          </Button>
        </div>
      </div>
    </Card>
  );
}

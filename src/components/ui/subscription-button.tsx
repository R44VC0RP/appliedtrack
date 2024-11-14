'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

interface SubscriptionButtonProps {
  tier: string;
  price: string;
}

export function SubscriptionButton({ tier, price }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start subscription process");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full mt-4"
    >
      {loading ? "Loading..." : `Subscribe ${price}/month`}
    </Button>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StripeTestHelper } from '@/components/stripe-test-helper';
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  customer: {
    email: string;
    id: string;
  };
  plan: string;
  status: string;
  amount: number;
  created: number;
}

export function BillingDashboard() {
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStripeData();
  }, []);

  const fetchStripeData = async () => {
    try {
      const response = await fetch('/api/admin/stripe/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stripe data');
      const data = await response.json();
      setStripeMode(data.mode);
      setSubscriptions(data.subscriptions);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const active = subscriptions.filter(s => s.status === 'active').length;
    const mrr = subscriptions.reduce((acc, s) => 
      s.status === 'active' ? acc + s.amount : acc, 0
    );
    const trial = subscriptions.filter(s => s.status === 'trialing').length;
    return { active, mrr, trial };
  };

  const { active, mrr, trial } = calculateMetrics();

  return (
    <div className="h-full w-full max-w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Billing Dashboard</h2>
        <Badge variant={stripeMode === 'live' ? 'default' : 'secondary'}>
          {stripeMode.toUpperCase()} MODE
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="h-[calc(100%-4rem)]">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {process.env.NODE_ENV === 'development' && (
            <TabsTrigger value="testing">Testing</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="h-full">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Active Subscriptions</h3>
              <div className="text-2xl font-bold">{loading ? '...' : active}</div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Monthly Revenue</h3>
              <div className="text-2xl font-bold">
                {loading ? '...' : `$${mrr.toFixed(2)}`}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Trial Users</h3>
              <div className="text-2xl font-bold">{loading ? '...' : trial}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="h-full">
          <Card className="p-4 h-full">
            <div className="overflow-x-auto h-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Plan</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4">Loading...</td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b">
                        <td className="p-2">{sub.customer.email}</td>
                        <td className="p-2">{sub.plan}</td>
                        <td className="p-2">
                          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="p-2">${sub.amount}</td>
                        <td className="p-2">
                          {new Date(sub.created * 1000).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`https://dashboard.stripe.com/${stripeMode === 'live' ? '' : 'test'}/subscriptions/${sub.id}`, '_blank')}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="h-full">
          <Card className="p-4 h-full">
            <h3 className="font-semibold mb-4">Stripe Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Webhook Status</label>
                <Badge className="ml-2" variant="outline">
                  {stripeMode === 'live' ? 'Configured' : 'Development'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">API Mode</label>
                <Badge className="ml-2" variant={stripeMode === 'live' ? 'default' : 'secondary'}>
                  {stripeMode}
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {process.env.NODE_ENV === 'development' && (
          <TabsContent value="testing" className="h-full">
            <StripeTestHelper />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

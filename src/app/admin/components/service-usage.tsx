import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { srv_getServiceUsageStats } from '@/app/actions/server/job-board/serviceUsage'
import { ServiceType } from '@prisma/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type ServiceUsageStats = {
  summary: {
    totalOpenAITokens: number;
    totalHunterCredits: number;
  };
  recentUsage: Array<{
    id: string;
    userId: string;
    service: ServiceType;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
    };
  }>;
};

const inputPricePerMillionTokens = 2.50;

// OpenAI GPT-4 pricing (per 1K tokens)
const OPENAI_INPUT_TOKEN_PRICE = 0.0025;
const OPENAI_OUTPUT_TOKEN_PRICE = 0.01; // $0.06 per 1K output tokens

// Hunter.io pricing
const HUNTER_CREDIT_PRICE = 0.01; // $0.01 per credit

type DailyUsage = {
  date: string;
  openAITokens: number;
  hunterCredits: number;
  cost: number;
};

export function ServiceUsage() {
  const [stats, setStats] = useState<ServiceUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyUsage[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await srv_getServiceUsageStats();
        setStats(data);
        
        // Process daily statistics
        const dailyData = processUsageData(data.recentUsage);
        setDailyStats(dailyData);
      } catch (error) {
        console.error('Error fetching service usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const processUsageData = (usage: ServiceUsageStats['recentUsage']): DailyUsage[] => {
    const dailyMap = new Map<string, DailyUsage>();

    usage.forEach(record => {
      const date = new Date(record.createdAt).toISOString().split('T')[0];
      const current = dailyMap.get(date) || { date, openAITokens: 0, hunterCredits: 0, cost: 0 };

      if (record.service === 'OPENAI' && record.metadata?.usage) {
        const inputTokens = record.metadata.usage.inputTokens || 0;
        const outputTokens = record.metadata.usage.outputTokens || 0;
        current.openAITokens += inputTokens + outputTokens;
        current.cost += (inputTokens * OPENAI_INPUT_TOKEN_PRICE + outputTokens * OPENAI_OUTPUT_TOKEN_PRICE) / 1000;
      } else if (record.service === 'HUNTER' && record.metadata?.usage) {
        const credits = record.metadata.usage.credits || 0;
        current.hunterCredits += credits;
        current.cost += credits * HUNTER_CREDIT_PRICE;
      }

      dailyMap.set(date, current);
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const calculateTotalCost = (): number => {
    if (!stats) return 0;
    const openAICost = stats.summary.totalOpenAITokens * ((OPENAI_INPUT_TOKEN_PRICE + OPENAI_OUTPUT_TOKEN_PRICE) / 2) / 1000;
    const hunterCost = stats.summary.totalHunterCredits * HUNTER_CREDIT_PRICE;
    return openAICost + hunterCost;
  };

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  if (!stats) {
    return <div>Failed to load statistics.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>OpenAI Usage</CardTitle>
            <CardDescription>Total tokens used across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.summary.totalOpenAITokens.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              Est. Cost: ${((stats.summary.totalOpenAITokens * ((OPENAI_INPUT_TOKEN_PRICE + OPENAI_OUTPUT_TOKEN_PRICE) / 2)) / 1000).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hunter.io Usage</CardTitle>
            <CardDescription>Total credits used across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.summary.totalHunterCredits.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              Est. Cost: ${(stats.summary.totalHunterCredits * HUNTER_CREDIT_PRICE).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
            <CardDescription>Estimated total cost of all services</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${calculateTotalCost().toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trends</CardTitle>
          <CardDescription>Service usage and costs over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="openAITokens" name="OpenAI Tokens" stroke="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="hunterCredits" name="Hunter Credits" stroke="#82ca9d" />
              <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage History</CardTitle>
          <CardDescription>Last 100 service usage records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentUsage.map((usage) => {
                let usageValue = 0;
                let cost = 0;
                
                if (usage.service === 'OPENAI' && usage.metadata?.usage) {
                  const inputTokens = usage.metadata.usage.inputTokens || 0;
                  const outputTokens = usage.metadata.usage.outputTokens || 0;
                  usageValue = inputTokens + outputTokens;
                  cost = (inputTokens * OPENAI_INPUT_TOKEN_PRICE + outputTokens * OPENAI_OUTPUT_TOKEN_PRICE) / 1000;
                } else if (usage.service === 'HUNTER' && usage.metadata?.usage) {
                  usageValue = usage.metadata.usage.credits || 0;
                  cost = usageValue * HUNTER_CREDIT_PRICE;
                }

                return (
                  <TableRow key={usage.id}>
                    <TableCell>
                      {new Date(usage.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{usage.service}</TableCell>
                    <TableCell>
                      {usage.service === 'OPENAI' 
                        ? `${usageValue} tokens`
                        : `${usageValue} credits`}
                    </TableCell>
                    <TableCell>${cost.toFixed(4)}</TableCell>
                    <TableCell className="font-mono">{usage.user.id}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

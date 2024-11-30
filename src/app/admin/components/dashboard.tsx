import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { srv_getDashboardStats } from '@/app/actions/server/admin/dashboard/primary';

export function AdminStats() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    tierDistribution: {
      free: number;
      pro: number;
      power: number;
    };
    userGrowth: {
      date: string;
      count: number;
    }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await srv_getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!stats) {
    return <div>Error loading dashboard stats</div>;
  }

  // Calculate cumulative user growth
  const cumulativeGrowth = stats.userGrowth.reduce((acc: any[], curr, index) => {
    const previousTotal = index > 0 ? acc[index - 1].total : 0;
    return [...acc, { date: curr.date, total: previousTotal + curr.count }];
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Users Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>

      {/* Tier Distribution Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Free Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tierDistribution.free}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.tierDistribution.free / stats.totalUsers) * 100).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tierDistribution.pro}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.tierDistribution.pro / stats.totalUsers) * 100).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Power Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tierDistribution.power}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.tierDistribution.power / stats.totalUsers) * 100).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>User Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

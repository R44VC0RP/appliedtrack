'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Briefcase, Calendar, Clock, CheckCircle } from 'lucide-react'

// Sample data for charts
const applicationData = [
  { name: 'Jan', applications: 4, interviews: 2, offers: 0 },
  { name: 'Feb', applications: 6, interviews: 3, offers: 1 },
  { name: 'Mar', applications: 8, interviews: 4, offers: 1 },
  { name: 'Apr', applications: 10, interviews: 5, offers: 2 },
  { name: 'May', applications: 12, interviews: 6, offers: 2 },
  { name: 'Jun', applications: 15, interviews: 8, offers: 3 },
]

const statusData = [
  { name: 'Applied', value: 30 },
  { name: 'Phone Screen', value: 20 },
  { name: 'Interview', value: 15 },
  { name: 'Offer', value: 5 },
  { name: 'Rejected', value: 10 },
]

export function JobTrackerDashboardComponent() {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    { title: 'Total Applications', value: 80, icon: Briefcase, change: 10, isPositive: true },
    { title: 'Interviews Scheduled', value: 12, icon: Calendar, change: 2, isPositive: true },
    { title: 'Average Response Time', value: '5 days', icon: Clock, change: 1, isPositive: false },
    { title: 'Offer Rate', value: '15%', icon: CheckCircle, change: 3, isPositive: true },
  ]

  const recentActivity = [
    { company: 'TechCorp', position: 'Frontend Developer', status: 'Applied', date: '2024-06-15' },
    { company: 'InnoSoft', position: 'Full Stack Engineer', status: 'Interview', date: '2024-06-14' },
    { company: 'DataDynamics', position: 'Data Scientist', status: 'Offer', date: '2024-06-13' },
    { company: 'CloudNine', position: 'DevOps Engineer', status: 'Rejected', date: '2024-06-12' },
  ]

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Job Application Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.isPositive ? (
                    <span className="text-green-600 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stat.change}% increase
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                      {stat.change}% decrease
                    </span>
                  )}
                  {' '}from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="status">Application Status</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={applicationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#8884d8" />
                  <Line type="monotone" dataKey="interviews" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="offers" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#8884d8" />
                  <Bar dataKey="interviews" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-semibold">{activity.company}</p>
                  <p className="text-sm text-muted-foreground">{activity.position}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={activity.status === 'Offer' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.date}</span>
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>View All Applications</Button>
      </div>
    </div>
  )
}
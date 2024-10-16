"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Briefcase, Calendar, Search, Users, BarChart } from 'lucide-react'
import { Header } from '@/components/header'

import jobTrackrLogo from '@/app/logos/logo.png'

export default function Homepage() {
  const [email, setEmail] = useState('')

  const features = [
    { icon: Briefcase, title: 'Job Tracking', description: 'Easily manage and track all your job applications in one place.' },
    { icon: Calendar, title: 'Interview Scheduler', description: 'Never miss an interview with our built-in scheduling system.' },
    { icon: Search, title: 'Company Research', description: 'Access comprehensive company information and insights.' },
    { icon: Users, title: 'Networking Tools', description: 'Build and maintain your professional network effortlessly.' },
    { icon: BarChart, title: 'Analytics Dashboard', description: 'Gain valuable insights into your job search progress.' },
  ]

  const pricingTiers = [
    { name: 'Basic', price: 'Free', features: ['Job application tracking', 'Basic analytics', 'Limited company research'] },
    { name: 'Pro', price: '$9.99/mo', features: ['Everything in Basic', 'Advanced analytics', 'Unlimited company research', 'Interview scheduling'] },
    { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'API access', 'Dedicated support', 'Custom integrations'] },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  Supercharge Your Job Search
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Track applications, schedule interviews, and land your dream job with JobTrackr.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    className="max-w-lg flex-1 bg-white text-primary"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" variant="secondary">
                    Get Started
                  </Button>
                </form>
                <p className="text-xs text-gray-300">
                  Start your free trial. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Features that Empower Your Job Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <feature.icon className="w-10 h-10 text-primary mb-2" />
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Choose the Right Plan for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>
                        <span className="text-3xl font-bold">{tier.price}</span>
                        {tier.price !== 'Custom' && <span className="text-sm ml-1">/month</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-2">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <CheckCircle2 className="w-5 h-5 text-primary mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">
                  About JobTrackr
                </h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-4">
                  JobTrackr was born out of a simple idea: to make the job search process easier and more efficient for everyone. Our team of dedicated professionals has experienced the challenges of job hunting firsthand, and we've built the tool we wish we had.
                </p>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-6">
                  With JobTrackr, you're not just getting a job application tracker. You're gaining a partner in your career journey, equipped with powerful tools and insights to help you land your dream job.
                </p>
                <Button>
                  Learn More
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="JobTrackr dashboard"
                  className="rounded-lg shadow-lg"
                  width={600}
                  height={400}
                />
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src="/placeholder.svg?height=200&width=280"
                    alt="Team collaboration"
                    className="rounded-lg shadow-lg"
                    width={280}
                    height={200}
                  />
                  <img
                    src="/placeholder.svg?height=200&width=280"
                    alt="Mobile app"
                    className="rounded-lg shadow-lg"
                    width={280}
                    height={200}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">© 2024 JobTrackr. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

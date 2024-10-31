"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SubscriptionButton } from '@/components/ui/subscription-button'
// import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Briefcase, Calendar, Search, Users, BarChart, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { SignedOut, SignedIn, useUser } from '@clerk/nextjs'
import { useToast } from "@/hooks/use-toast"

// import jobTrackrLogo from '@/app/logos/logo.png'

// images:

import jobTrackDashboard from '@/app/images/jobTrackDashboard.png'
import emailLookup from '@/app/images/emailLookup.png'
import resumeManagement from '@/app/images/resumeManagement.png'

export default function Homepage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { user } = useUser()
  const { toast } = useToast()
  const isDev = true // Toggle for development/launch mode

  const features = [
    { 
      icon: Briefcase, 
      title: 'Smart Application Tracking', 
      description: 'Organize and monitor all your job applications with detailed status tracking and follow-up reminders.' 
    },
    { 
      icon: Search, 
      title: 'Email Discovery', 
      description: 'Powered by Hunter.io, automatically find the right contact person for your follow-ups and networking.' 
    },
    { 
      icon: BarChart, 
      title: 'Resume Management', 
      description: 'Upload multiple resumes and track which version you used for each application.' 
    },
    { 
      icon: Users, 
      title: 'Cover Letter Generator', 
      description: 'Generate professional, personalized PDF cover letters tailored to each application.' 
    },
    {
      icon: Clock,
      title: 'Follow-up Reminders',
      description: 'We will remind you to follow up on your applications if it has been a while since you last heard from them.'
    },
    { 
      icon: Calendar, 
      title: 'Coming Soon: ATS Review', 
      description: 'Get insights on how your resume performs against applicant tracking systems.' 
    },
  ]

  const pricingTiers = [
    { 
      name: "Basic", 
      price: 'Free', 
      features: [
        'Up to 50 job applications',
        'Store up to 5 resumes',
        'Up to 10 custom cover letters/month',
        '2 email domain lookups/month'
      ] 
    },
    { 
      name: 'Pro', 
      price: '$10', 
      features: [
        'Unlimited applications',
        'Multiple resume versions',
        'Advanced cover letter generator',
        '50 email lookups/month',
        'Priority support'
      ] 
    },
    { 
      name: 'Power', 
      price: '$30', 
      features: [
        'Unlimited applications',
        'Unlimited resumes',
        'Unlimited cover letters',
        '100 email lookups',
        'Access to all beta features'
      ]
    },
  ]

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (!email) {
        throw new Error('Email is required')
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.status === 409) {
        throw new Error('This email is already on our waitlist!')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join waitlist')
      }

      const data = await response.json()
      setEmail('')
      
      toast({
        title: "Success!",
        description: `You're number ${data.totalUsers} on the waitlist. We'll notify you when we launch!`,
      })

    } catch (err: any) {
      toast({
        title: "Notice",
        description: err.message,
        variant: err.message.includes('already on our waitlist') ? "default" : "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-950">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                {isDev ? (
                  <>
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                      Join the Waitlist for AppliedTrack
                    </h1>
                    <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                      Be the first to experience the future of job application management.
                    </p>
                  </>
                ) : (
                  <SignedOut>
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                      Take Control of Your Job Search
                    </h1>
                    <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                      Smart email discovery, resume management, and application tracking all in one place.
                    </p>
                  </SignedOut>
                )}
                
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Track applications, generate cover letters, discover the right contact, and land your dream job with AppliedTrack.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2" onSubmit={handleWaitlistSignup}>
                  <Input
                    className="max-w-lg flex-1 bg-white text-primary"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" variant="secondary">
                    {isDev ? 'Join Waitlist' : 'Get Started'}
                  </Button>
                </form>
                <p className="text-xs text-gray-300">
                  {isDev ? 'You will receive an email when we launch to sign up.' : 'Start your free trial. No credit card required.'}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 dark:text-white">
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
                  <Card className="h-full dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader>
                      <feature.icon className="w-10 h-10 text-primary dark:text-primary mb-2" />
                      <CardTitle className="dark:text-white">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="dark:text-gray-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
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
                  <Card className="h-full flex flex-col dark:bg-gray-800 dark:border-gray-700">
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
                      {tier.price !== 'Free' && (
                        <SignedIn>
                        <SubscriptionButton 
                          tier={tier.name.toLowerCase()} 
                          price={tier.price} 
                        />
                        </SignedIn>
                      )}
                    </CardContent>
                    
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                  About AppliedTrack
                </h2>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-4">
                  AppliedTrack was born out of a simple idea: to make the job search process easier and more efficient for everyone. 
                </p>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-6">
                  With AppliedTrack, you&apos;re not just getting a job application tracker. You&apos;re gaining a partner in your career journey, equipped with powerful tools and insights to help you land your dream job.
                </p>
                {/* <Button>
                  Learn More
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button> */}
              </div>
              <div className="space-y-4">
                <Image
                  src={jobTrackDashboard}
                  alt="JobTrackr dashboard"
                  className="rounded-lg shadow-lg"
                  width={600}
                  height={400}
                  priority
                />
                <div className="grid grid-cols-2 gap-4">
                  <Image
                    src={emailLookup}
                    alt="Team collaboration"
                    className="rounded-lg shadow-lg"
                    width={280}
                    height={200}
                  />
                  <Image
                    src={resumeManagement}
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
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t dark:border-gray-800 dark:bg-gray-950">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 AppliedTrack. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link 
            href="/terms" 
            className="text-xs hover:underline underline-offset-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Terms of Service
          </Link>
          <Link 
            href="/privacy" 
            className="text-xs hover:underline underline-offset-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Briefcase, Calendar, Search, Users, BarChart, Clock, FileUp, BarChart2, Target, Quote, Zap } from 'lucide-react'
import { Header } from '@/components/header'

import { FaRocket, FaChartLine, FaBrain } from 'react-icons/fa'
import { Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from "sonner"

// import jobTrackrLogo from '@/app/logos/logo.png'

// images:

import jobTrackDashboard from '@/app/images/jobTrackDashboard.png'
import emailLookup from '@/app/images/emailLookup.png'
import resumeManagement from '@/app/images/resumeManagement.png'

const PricingSection = dynamic(() => import('./homepage-components/PricingSection'), {
  loading: () => <LoadingPricingSection />,
  ssr: true
})

const ParticlesBackground = dynamic(() => import('./homepage-components/ParticlesBackground'), {
  loading: () => null,
  ssr: false
})

const DemoVideo = dynamic(() => import('./homepage-components/DemoVideo'), {
  loading: () => <LoadingDemoVideo />,
  ssr: false
})

// Move FEATURES and images to a separate constants file
// src/constants/homepage.ts
export const FEATURES = [
  { 
    icon: Briefcase, 
    title: 'Smart Application Tracking', 
    description: 'Organize and monitor all your job applications with detailed status tracking and follow-up reminders.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  { 
    icon: Search, 
    title: 'Email Discovery', 
    description: 'Powered by Hunter.io, automatically find the right contact person for your follow-ups and networking.',
    gradient: 'from-purple-500 to-pink-500'
  },
  { 
    icon: BarChart, 
    title: 'Resume Management', 
    description: 'Upload multiple resumes and track which version you used for each application.',
    gradient: 'from-orange-500 to-red-500'
  },
  { 
    icon: Users, 
    title: 'Cover Letter Generator', 
    description: 'Generate professional, personalized PDF cover letters tailored to each application.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Clock,
    title: 'Follow-up Reminders',
    description: 'We will remind you to follow up on your applications if it has been a while since you last heard from them.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  { 
    icon: Calendar, 
    title: 'Coming Soon: ATS Review', 
    description: 'Get insights on how your resume performs against applicant tracking systems.',
    gradient: 'from-teal-500 to-cyan-500'
  },
] as const


export default function Homepage() {
  const [refItem, setRefItem] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const DAILY_SIGNUPS = 35 // Average number, no need for random generation

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

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
        body: JSON.stringify({ email, ref: refItem }),
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
      
      toast.success("Success!", {
        description: `You're number ${data.totalUsers} on the waitlist. We'll notify you when we launch!`
      })

    } catch (err: any) {
      toast.error(err.message.includes('already on our waitlist') ? "Notice" : "Error", {
        description: err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const trackCampaignVisit = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      setRefItem(ref || '')
      
      if (ref) {
        try {
          await fetch('/api/campaigns/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref, type: "access" }),
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error tracking campaign visit:', error);
        }
      }
    };

    trackCampaignVisit();
  }, []);

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        {/* Hero Section with proper centering */}
        <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-gray-950 dark:via-gray-950/90 dark:to-gray-950/80 overflow-hidden">
          <Suspense fallback={null}>
            <ParticlesBackground />
          </Suspense>

          <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center">
            {/* Beta Badge */}
            <div className="mb-6">
              <span className="px-3 py-1 text-sm bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Beta Access</span>
                <span className="md:hidden">Beta Soon</span>
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white max-w-4xl">
              Your Job Search,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                Supercharged
              </span>
            </h1>

            <p className="max-w-[600px] text-base md:text-xl text-gray-200 mt-4 md:mt-6">
              Never miss another opportunity. Land interviews{' '}
              <span className="font-semibold text-yellow-300">3x faster</span>{' '}
              with our intelligent system.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-6 md:mt-8">
              <div className="flex items-center space-x-2 text-gray-200 text-sm md:text-base">
                <FaRocket className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-200">
                <FaChartLine className="w-4 h-4 text-yellow-400" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-200">
                <FaBrain className="w-4 h-4 text-yellow-400" />
                <span>AI-Powered Tools</span>
              </div>
            </div>

            {/* Waitlist Form */}
            <div className="w-full max-w-md mt-8">
              <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleWaitlistSignup}>
              <Input
                  className="flex-1 bg-white/90 dark:bg-gray-800/90 text-primary dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-200 dark:border-gray-700 focus:ring-primary/20 dark:focus:ring-primary/40"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="secondary"
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-semibold"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="animate-spin"><Zap className="w-4 h-4" /></span> 
                      Joining...
                    </div>
                  ) : (
                    'Join Waitlist'
                  )}
                </Button>
              </form>
              <p className="text-xs md:text-sm text-gray-300 flex items-center justify-center gap-2 mt-2">
                <span className="flex h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                {DAILY_SIGNUPS} people joined today
              </p>
            </div>

            {/* Product Hunt Badge */}
            <div className="hidden md:block mt-8">
              <a href="https://www.producthunt.com/posts/appliedtrack" className="inline-block">
                <img 
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=587730&theme=neutral" 
                  alt="AppliedTrack on Product Hunt" 
                  width="250" 
                  height="54" 
                />
              </a>
            </div>
          </div>
        </section>

        {/* Features Section with proper grid */}
        <section className="w-full py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                Features that Make the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Difference
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Everything you need to streamline your job search and increase your chances of landing the perfect role.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Smart Application Tracking */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">Smart Application Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">Organize and monitor all your job applications with detailed status tracking and follow-up reminders.</p>
                </CardContent>
              </Card>

              {/* Email Discovery */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      <Search className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">Email Discovery</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">Powered by Hunter.io, automatically find the right contact person for your follow-ups and networking.</p>
                </CardContent>
              </Card>

              {/* Resume Management */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                      <BarChart className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">Resume Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">Upload multiple resumes and track which version you used for each application.</p>
                </CardContent>
              </Card>

              {/* Cover Letter Generator */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                      <Users className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">Cover Letter Generator</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">Generate professional, personalized PDF cover letters tailored to each application.</p>
                </CardContent>
              </Card>

              {/* Follow-up Reminders */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                      <Clock className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">Follow-up Reminders</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">We will remind you to follow up on your applications if it has been a while since you last heard from them.</p>
                </CardContent>
              </Card>

              {/* ATS Review */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">Coming Soon: ATS Review</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">Get insights on how your resume performs against applicant tracking systems.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="w-full py-24 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                See AppliedTrack in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Action
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Watch how AppliedTrack streamlines your job search process from start to finish.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl">
                <DemoVideo />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <Suspense fallback={<LoadingPricingSection />}>
          <PricingSection />
        </Suspense>

        {/* Footer */}
        <footer className="w-full py-6 border-t dark:border-gray-700">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 AppliedTrack. All rights reserved.</p>
            <nav className="flex gap-4 sm:gap-6 mt-4 sm:mt-0">
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
          </div>
        </footer>
      </main>
    </div>
  )
}

// Keep LoadingPricingSection component
function LoadingPricingSection() {
  return (
    <div className="w-full py-24 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-900 rounded w-64 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-900 rounded w-96 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-900 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingDemoVideo() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-900 animate-pulse rounded-xl" />
  )
}

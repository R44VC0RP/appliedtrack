"use client"

// USING SERVER ACTIONS FROM @/app/actions/server/homepage/primary.ts

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Briefcase, Calendar, Search, Users, BarChart, Clock, Zap } from 'lucide-react'
import { Header } from '@/components/header'
import dynamic from 'next/dynamic'
import { FaRocket, FaChartLine, FaBrain } from 'react-icons/fa'
import { Sparkles } from 'lucide-react'
import { toast } from "sonner"
import type { Engine } from "tsparticles-engine"
import Particles from "react-particles"
import { loadFull } from "tsparticles"
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'



// Import Server Actions and Types
import { srv_handleWaitlistSignup, srv_recordPageVisit, srv_getHomepageData } from '@/app/actions/server/homepage/primary'
import { PricingTier } from '@/models/Config'



const ReactPlayerNoSSR = dynamic(() => import('react-player'), { ssr: false })

export default function Homepage() {
  const [refItem, setRefItem] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dailySignups, setDailySignups] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[] | null>(null)
  const particlesInit = useCallback(async (engine: Engine): Promise<void> => {
    await loadFull(engine)
  }, [])

  useEffect(() => {
    const trackCampaignVisit = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const ref = urlParams.get('ref')
        if (ref) {
          setRefItem(ref)
          await srv_recordPageVisit(ref)
        }
      } catch (error) {
        console.error('Failed to track campaign visit:', error)
      }
    }
    const fetchPricingTiers = async () => {
      const data = await srv_getHomepageData()
      setPricingTiers(data?.pricingTiers || null)
    }

    trackCampaignVisit()
    fetchPricingTiers()
  }, [])

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!email) {
        throw new Error('Email is required')
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address')
        return
      }

      const response = await srv_handleWaitlistSignup(email, refItem || '')
      setEmail('')

      toast.success("Success!", {
        description: response.message
      })

    } catch (err: any) {
      toast.error(err.message.includes('already on our waitlist') ? "Notice" : "Error", {
        description: err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-950">
      <Header />
      <main className="flex-1">
        {/* Particles Background */}
        <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-gray-950 dark:via-gray-950/90 dark:to-gray-950/80 overflow-hidden">
          <Particles
            id="tsparticles"
            init={particlesInit}
            className="absolute inset-0"
            options={{
              fullScreen: { enable: false },
              background: {
                color: {
                  value: "transparent",
                },
              },
              fpsLimit: 120,
              interactivity: {
                events: {
                  onHover: {
                    enable: true,
                    mode: "grab",
                  },
                },
                modes: {
                  grab: {
                    distance: 140,
                    links: {
                      opacity: 0.5,
                    },
                  },
                },
              },
              particles: {
                color: {
                  value: "#ffffff",
                },
                links: {
                  color: "#ffffff",
                  distance: 150,
                  enable: true,
                  opacity: 0.2,
                  width: 1,
                },
                move: {
                  direction: "none",
                  enable: true,
                  outModes: {
                    default: "bounce",
                  },
                  random: false,
                  speed: 1,
                  straight: false,
                },
                number: {
                  density: {
                    enable: true,
                    area: 800,
                  },
                  value: 80,
                },
                opacity: {
                  value: 0.3,
                },
                shape: {
                  type: "circle",
                },
                size: {
                  value: { min: 1, max: 3 },
                },
              },
              detectRetina: true,
            }}
          />
          <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center">
            <div className="mb-6">
              <span className="px-3 py-1 text-sm bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Beta Access</span>
                <span className="md:hidden">Beta Soon</span>
              </span>
            </div>
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
                {dailySignups ?? 35} people joined today
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
                <div className="relative mx-auto max-w-[1200px]">
                  <div className="relative rounded-lg overflow-hidden border shadow-lg dark:border-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                    <ReactPlayerNoSSR
                      url="https://utfs.io/f/HhaWmBOvDmlROQ3xTvtchYsK8zZDAp4J1TSadIxoHBWQ7lPq"
                      width="100%"
                      height="100%"
                      playing={true}
                      loop={true}
                      muted={true}
                      controls={false}
                      playsinline={true}
                      config={{
                        file: {
                          attributes: {
                            style: { width: '100%', height: '100%' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white to-transparent dark:from-gray-900 dark:to-transparent" />
          
          <div className="container relative mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <span className="px-4 py-1.5 text-sm bg-primary/10 text-primary dark:bg-primary/20 rounded-full font-medium inline-block mb-4">
                Simple Pricing
              </span>
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                Choose the Right Plan for You
              </h2>
              <div className="mt-6 flex items-center justify-center gap-2 max-w-2xl mx-auto mb-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium">
                  <span className="hidden sm:inline"><Sparkles className="w-4 h-4" /></span>
                  Students save 50% with .edu email verification
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Start free and upgrade as you grow. No hidden fees, no surprises.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingTiers?.map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {tier.name === 'Pro' && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="px-3 py-1 text-sm bg-gradient-to-r from-primary to-primary/80 text-white rounded-full font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <Card className={`h-full flex flex-col dark:bg-gray-900 dark:border-gray-800 ${
                    tier.name === 'Pro' ? 'border-primary shadow-lg scale-105' : ''
                  }`}>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                      <CardDescription className="flex items-baseline mt-4">
                        <span className="text-4xl font-bold">{tier.price}</span>
                        {tier.price !== 'Free' && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-4">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            <span className="dark:text-gray-300">{feature}</span>
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

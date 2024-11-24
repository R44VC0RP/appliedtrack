"use client"

// USING SERVER ACTIONS FROM @/app/actions/server/homepage/primary.ts

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Briefcase, Calendar, Search, Users, BarChart, Clock, Zap, File, Sparkle, Mail, MailCheck, Rocket } from 'lucide-react'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { homepageConfig } from '@/config/homepage'
import { SignedIn, SignedOut, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Import Server Actions and Types
import { srv_handleWaitlistSignup, srv_recordPageVisit, srv_getHomepageData } from '@/app/actions/server/homepage/primary'
import { srv_getServiceQuota } from '@/lib/tierlimits'

const ReactPlayerNoSSR = dynamic(() => import('react-player'), { ssr: false })

export default function Homepage() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const [refItem, setRefItem] = useState<string | null>(null)
  const [homepageTest, setHomepageTest] = useState<string | null>("A")
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dailySignups, setDailySignups] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pricingTiers, setPricingTiers] = useState<any[] | null>(null)
  
  const config = homepageConfig.isWaitlist ? homepageConfig.waitlistConfig : homepageConfig.signupConfig

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (homepageConfig.isWaitlist) {
        await srv_handleWaitlistSignup(email, refItem || '')
        toast.success(config.successMessage)
      } else {
        if (!isLoaded) {
          toast.error('Authentication is not ready yet')
          return
        }

        try {
          console.log("Starting sign-up process...");
          
          // Start the sign-up process with email
          const signUpAttempt = await signUp.create({
            emailAddress: email,
          });

          console.log("Sign-up creation response:", signUpAttempt);

          if (signUpAttempt.status !== "missing_requirements") {
            console.error("Unexpected sign-up status:", signUpAttempt.status);
            toast.error("Something went wrong during sign-up");
            return;
          }

          // Start the email verification process
          const verificationAttempt = await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          console.log("Verification preparation response:", verificationAttempt);

          // Redirect to the sign-up verification page
          router.push('/sign-up/verify');
          
          toast.success('Check your email for a verification code');
        } catch (err: any) {
          console.error('Error during signup:', err);
          toast.error(err.errors?.[0]?.message || 'Failed to start sign-up process');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.')
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
          <div className="container relative mx-auto px-4 md:px-6 flex flex-col items-center text-center ">
            <div className="mb-6">
              <span className="px-3 py-1 text-sm bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Beta Access</span>
                <span className="md:hidden">Beta Soon</span>
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white max-w-4xl">
              Your Job Search
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                Supercharged and Simplified
              </span>
            </h1>

            <p className="max-w-[600px] text-base md:text-xl text-gray-200 mt-4 md:mt-6">
              Stop getting rejected. Land interviews, and network {' '}
              <span className="font-semibold text-yellow-300">3x faster</span>{' '}
              with our simple system and personalized tools.
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
                <span>Personalized Insights</span>
              </div>
            </div>

            {/* Waitlist Form */}
            <div className="w-full max-w-md mt-8">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <SignedOut>
                <Input
                  className="flex-1 bg-white/90 dark:bg-gray-800/90 text-primary dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-200 dark:border-gray-700 focus:ring-primary/20 dark:focus:ring-primary/40"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-semibold"
                  disabled={isSubmitting || !isLoaded}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="animate-spin"><Zap className="w-4 h-4" /></span>
                      Joining...
                    </div>
                  ) : (
                    config.buttonText
                  )}
                </Button>
                </SignedOut>
                

              </form>
              <SignedIn>  
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-semibold"
                  onClick={() => router.push('/dashboard')}
                >
                  Jump to Dashboard <Rocket className="w-4 h-4 ml-2" />
                </Button>
                </SignedIn>
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
                We make job searching easier by personalizing common tools to fit your unique needs.
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
                    <CardTitle className="dark:text-white">Application Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 mb-2">Organize and monitor all your job applications with detailed status tracking and note taking.</p>
                  <p className='text-xs text-gray-500'>No super crazy features here, just a simple way to keep track of your applications.</p>
                </CardContent>
              </Card>

              {/* Email Discovery */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      <File className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">ATS Optimized Resumes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 mb-2">We generate resumes from your personal context that are optimized for each application. </p>
                  <p className="text-xs text-gray-500">All while keeping your information private and fully supporting annoying ATS filters.</p>
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
                    <CardTitle className="dark:text-white">Personalized Cover Letters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 mb-2">We generate cover letters from your personal context that look like they were written by you, that are tailored for each application.</p>
                  <p className="text-xs text-gray-500">All while keeping your information private and fully supporting annoying ATS filters.</p>
                </CardContent>
              </Card>

              {/* Cover Letter Generator */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                      <Sparkle className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">JobMatch&trade; Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 mb-2">For each job you apply to, we provide personalized insights and a personalized score to help you understand how good of a fit you are.</p>
                  <p className="text-xs text-gray-500">This helps you self-assess and evaluate your career goals. We also provide personalized recommendations on how to improve your career search.</p>
                </CardContent>
              </Card>

              {/* Follow-up Reminders */}
              <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-950/50 dark:border-gray-800">
                <CardHeader>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                      <MailCheck className="w-6 h-6" />
                    </div>
                    <CardTitle className="dark:text-white">InsightLink&trade; Contacts<br /><span className='text-xs text-gray-500'>Powered by Hunter.io</span></CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400">Haven't heard back from a company? We'll help you find the right contact person to follow up with.</p>
                  <p className="text-xs text-gray-500">Powered by Hunter.io, we'll find the right contact person for your follow-ups and networking.</p>
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
                    <CardTitle className="dark:text-white">ATS Review<br /><span className='text-xs text-gray-500'>Coming Soon</span></CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="dark:text-gray-400 mb-2">Get insights on how your resume performs against applicant tracking systems.</p>
                  <p className="text-xs text-gray-500">Coming soon, we'll analyze your resume and cover letter and provide personalized insights on how to improve your chances of getting an interview.</p>
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

                  <Card className={`h-full flex flex-col dark:bg-gray-900 dark:border-gray-800 ${tier.name === 'Pro' ? 'border-primary shadow-lg scale-105' : ''
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
                        {tier.features.map((feature: string, featureIndex: number) => (
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

        {/* Testimonials Section */}
        <section className="w-full py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white to-transparent dark:from-gray-950 dark:to-transparent" />

          <div className="container relative mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                Loved by Job Seekers
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                See what our users are saying about their experience with AppliedTrack
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                {
                  name: "Sarah Chen",
                  role: "Software Engineer",
                  company: "Recently hired at Microsoft",
                  content: "AppliedTrack's AI-powered resume optimization helped me land interviews at top tech companies. The personalized insights were game-changing!",
                  image: "https://d2pasa6bkzkrjd.cloudfront.net/_resize/consensus2024/speaker/300/site/consensus2024/images/userfiles/speakers/e344eea533f9623cc91fefd17a915b5d.jpg"
                },
                {
                  name: "Michael Rodriguez",
                  role: "Marketing Manager",
                  company: "Landed role at HubSpot",
                  content: "The automated cover letter generator saved me hours of time, and the quality was impressive. Each letter felt personal and tailored to the role.",
                  image: "https://www.leehealth.org/getmedia/9671f1ff-2aaa-4856-a770-58588d4f7faf/Rodriquez-Michael-Psy-D_480x480.jpg?width=479&height=479&ext=.jpg"
                },
                {
                  name: "Emily Thompson",
                  role: "Product Manager",
                  company: "Hired at Stripe",
                  content: "The job matching insights helped me focus on roles where I had the best chance. Landed my dream job in half the time I expected!",
                  image: "https://pbs.twimg.com/profile_images/1460356790131040258/e62OCGsm_400x400.jpg"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full dark:bg-gray-900/50 dark:border-gray-800 relative overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold dark:text-white">{testimonial.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <span className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <FaRocket
                              key={i}
                              className="w-4 h-4 text-yellow-400"
                            />
                          ))}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.content}"</p>
                      <div className="mt-4 pt-4 border-t dark:border-gray-800">
                        <p className="text-sm text-primary dark:text-primary/80">{testimonial.company}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Everything you need to know about AppliedTrack
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    What makes AppliedTrack different from other job tracking tools?
                  </AccordionTrigger>
                  <AccordionContent>
                    AppliedTrack combines intelligent job tracking with AI-powered tools for resume optimization and personalized insights. Unlike other platforms, we focus on providing actionable feedback and automated improvements to increase your chances of landing interviews.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Is my data secure and private?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, absolutely. We take data privacy seriously. Your personal information and job search data are encrypted and never shared with third parties. We comply with GDPR and other privacy regulations to ensure your data remains secure.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    Can I use AppliedTrack for free?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! We offer a generous free tier that includes basic job tracking and application management. Premium features like AI-powered resume optimization and advanced insights are available in our paid plans.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    How does the student discount work?
                  </AccordionTrigger>
                  <AccordionContent>
                    Students with a valid .edu email address receive a 50% discount on all paid plans. Simply verify your student status during signup, and the discount will be automatically applied to your subscription.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    Can I import my existing job applications?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, you can import existing applications manually or through our bulk import feature. We also support integration with popular job boards to automatically track new applications.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    What kind of support do you offer?
                  </AccordionTrigger>
                  <AccordionContent>
                    We provide email support for all users and priority support for paid subscribers. Our knowledge base is regularly updated with guides and tips, and we're constantly improving based on user feedback.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="w-full py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                Product Roadmap
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                See what's coming next for AppliedTrack
              </p>
            </div>

            <div className="grid gap-6 max-w-3xl mx-auto">
              {/* Current Quarter */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-2 w-2 bg-green-500 rounded-full" />
                    {`Current Quarter (Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-left">
                        Job Auto-Add with LinkedIn and Indeed
                      </AccordionTrigger>
                      <AccordionContent>
                        Automatically add jobs from LinkedIn and Indeed to your dashboard for easy tracking.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-left">
                        Filtered Job Search
                      </AccordionTrigger>
                      <AccordionContent>
                        Filter jobs by location, company, and more to find the perfect fit, also fiters out all the BS spam jobs.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Next Quarter */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-2 w-2 bg-blue-500 rounded-full" />
                    {`Next Quarter (Q${((Math.ceil((new Date().getMonth() + 1) / 3) + 1) % 4) || 4} ${new Date().getFullYear() + (Math.ceil((new Date().getMonth() + 1) / 3) + 1 > 4 ? 1 : 0)})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-left">
                        Hiring Tools
                      </AccordionTrigger>
                      <AccordionContent>
                        Hiring tools to help you add potential candidates, that seem most suited for your open positions.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-left">
                        Job Posting
                      </AccordionTrigger>
                      <AccordionContent>
                        Post Jobs directly to AppliedTrack, and track applications all in one place.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Future */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-2 w-2 bg-purple-500 rounded-full" />
                    Future Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-left">
                        Career Path Planning
                      </AccordionTrigger>
                      <AccordionContent>
                        Personalized career development roadmaps and skill gap analysis.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-left">
                        Salary Insights
                      </AccordionTrigger>
                      <AccordionContent>
                        Advanced salary negotiation tools and market rate analysis.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-6 border-t dark:border-gray-700">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400"> 2023 AppliedTrack. All rights reserved.</p>
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

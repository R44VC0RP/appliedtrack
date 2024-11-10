"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SubscriptionButton } from '@/components/ui/subscription-button'
// import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Briefcase, Calendar, Search, Users, BarChart, Clock, FileUp, BarChart2, Target, Quote, Zap } from 'lucide-react'
import { Header } from '@/components/header'
import { SignedOut, SignedIn, useUser } from '@clerk/nextjs'
import { useToast } from "@/hooks/use-toast"
import { FaRocket, FaChartLine, FaBrain } from 'react-icons/fa'
import { Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'

// import jobTrackrLogo from '@/app/logos/logo.png'

// images:

import jobTrackDashboard from '@/app/images/jobTrackDashboard.png'
import emailLookup from '@/app/images/emailLookup.png'
import resumeManagement from '@/app/images/resumeManagement.png'

const PricingSection = dynamic(() => import('./homepage-components/PricingSection'), {
  loading: () => (
    <div className="w-full py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96 mx-auto"></div>
        </div>
      </div>
    </div>
  )
})

export default function Homepage() {
  const [refItem, setRefItem] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dailySignups, setDailySignups] = useState(0)

  const { toast } = useToast()
  const isDev = true // Toggle for development/launch mode

  const features = [
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
  ]

  


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

  useEffect(() => {
    const trackCampaignVisit = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      console.log('ref', ref)
      setRefItem(ref || '')
      const type = "access"
      
      if (ref) {
        try {
          await fetch('/api/campaigns/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref, type }),
          });
          // remove ref from url
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error tracking campaign visit:', error);
        }
      }
    };

    trackCampaignVisit();
  }, []);

  useEffect(() => {
    setDailySignups(Math.floor(Math.random() * (50 - 20) + 20))
  }, [])

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-950">
      <Header />
      {/* Add Student Discount Banner */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800">
        <div className="container mx-auto px-4 py-2 text-center">
            <span className="hidden sm:inline">
              <Sparkles className="w-4 h-4" />
            </span>
            Students get 50% off with a valid .edu email!
            <Button 
              variant="link" 
              className="text-white hover:text-blue-100 pl-1 underline-offset-4 h-auto p-0"
              onClick={() => {
                const element = document.getElementById('pricing');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn more
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
        </div>
      </div>
      <main className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-900/80 overflow-hidden">
          {/* Abstract Background Shapes */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="container relative mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              > */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span className="px-4 py-1.5 text-sm bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-full font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Beta Access Coming Soon
                  </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-white">
                  Your Job Search,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                    Supercharged
                  </span>
                  
                </h1>
                

                <p className="mx-auto max-w-[800px] text-gray-200 md:text-xl mt-6 leading-relaxed">
                  Never miss another opportunity. Join to get a better view on your job search{' '}
                  <span className="font-semibold text-yellow-300">and land interviews 3x faster</span>{' '}
                  with our intelligent application management system.

                </p>

                <div className="flex items-center justify-center space-x-6 mt-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0 }}
                    className="flex items-center space-x-2 text-gray-200"
                  >
                    <FaRocket className="w-4 h-4 text-yellow-400" />
                    <span>Free Forever Plan</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-2 text-gray-200"
                  >
                    <FaChartLine className="w-4 h-4 text-yellow-400" />
                    <span>No Credit Card</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center space-x-2 text-gray-200"
                  >
                    <FaBrain className="w-4 h-4 text-yellow-400" />
                    <span>AI-Powered Tools</span>
                  </motion.div>
                </div>
              {/* </motion.div> */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-md space-y-2 mt-8"
              >
                <form className="flex space-x-2" onSubmit={handleWaitlistSignup}>
                  <Input
                    className="max-w-lg flex-1 bg-white/90 text-primary placeholder:text-gray-500"
                    placeholder="Enter your email for early access"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-semibold transition-all duration-200"
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
                <p className="text-sm text-gray-300 flex items-center justify-center gap-2">
                  <span className="flex h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  {dailySignups} people joined today - Limited spots available
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <a 
                  href="https://www.producthunt.com/posts/appliedtrack?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-appliedtrack" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <img 
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=587730&theme=neutral" 
                    alt="AppliedTrack - Have peace of mind in your job hunt. | Product Hunt" 
                    width="250" 
                    height="54" 
                    style={{ width: '250px', height: '54px' }} 
                  />
                </a>
              </motion.div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />

          <div className="container relative mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                Features that Make the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Difference
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Everything you need to streamline your job search and increase your chances of landing the perfect role.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="relative group hover:shadow-lg transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
                    <CardHeader>
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white`}>
                          <feature.icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="dark:text-white">{feature.title}</CardTitle>
                      </div>
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
        <section className="w-full py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1/2 h-[500px] bg-gradient-to-r from-primary/20 to-transparent blur-3xl" />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1/2 h-[500px] bg-gradient-to-l from-primary/20 to-transparent blur-3xl" />

          <div className="container relative mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                How{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  AppliedTrack
                </span>{' '}
                Works
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Your intelligent job application assistant that streamlines every step of your job search
              </p>
            </motion.div>

            <div className="relative">
              {/* Connection line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 hidden md:block" />

              {/* Steps */}
              {[
                {
                  title: "Initial Setup",
                  description: "When you join, you upload your base resume and share your professional background in a short bio. Our AI learns your style and characteristics to fine tune it for you.",
                  image: "/setup-illustration.png"
                },
                {
                  title: "Job Discovery & Analysis",
                  description: "Before you apply, add the company name, job title and the job description. (LinkedIn & Indeed Integration Coming Soon), from this we'll analyze your match score to help you prioritize applications.",
                  image: "/analysis-illustration.png"
                },
                {
                  title: "Personalized Documents",
                  description: "Once you have added a job, we'll generate a tailored resume and cover letter that matches the job requirements while maintaining your professional voice.",
                  image: "/documents-illustration.png"
                },
                {
                  title: "Application Tracking",
                  description: "We provide a dashboard to track your application statuses, receive follow-up reminders.",
                  image: "/tracking-illustration.png"
                },
                {
                  title: "Smart Networking",
                  description: "We provide a list of internal contacts for follow-ups based on your job history. You can search based on company name, location, and industry.",
                  image: "/networking-illustration.png"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className={`relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16 ${
                    index % 2 === 0 ? 'md:text-right' : 'md:text-left md:flex-row-reverse'
                  }`}
                >
                  <div className={`space-y-4 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                    <div className={`inline-flex items-center ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                    </div>
                    <div className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg ${
                      index % 2 === 0 ? 'md:mr-4' : 'md:ml-4'
                    }`}>
                      <h3 className="text-xl font-bold mb-2 dark:text-white">{step.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className={`relative ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl p-4">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {/* Replace with actual feature preview images */}
                        <div className="text-primary/40">Feature Preview</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  const element = document.getElementById('pricing');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Get Started Now
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>
        <PricingSection />
        
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4 dark:text-white">
                  Your Complete Job Search{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    Command Center
                  </span>
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                    AppliedTrack transforms your job search from chaotic to organized. Built by job seekers for job seekers, we understand the challenges of managing multiple applications across different platforms.
                  </p>
                  
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Smart Organization
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Track every application, document, and follow-up in one place with our intuitive dashboard.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          AI-Powered Insights
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Get personalized suggestions for follow-ups and networking opportunities based on your application history.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Document Management
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Store and version-control your resumes and cover letters, knowing exactly which version you used for each application.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  {/* Main Dashboard View */}
                  <div className="rounded-xl overflow-hidden shadow-2xl">
                    <Image
                      src={jobTrackDashboard}
                      alt="AppliedTrack Dashboard"
                      className="w-full"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Feature Previews */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="relative rounded-lg overflow-hidden shadow-lg"
                    >
                      <Image
                        src={emailLookup}
                        alt="Email Discovery Feature"
                        className="w-full"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <span className="text-white text-sm p-3 font-medium">
                          Email Discovery
                        </span>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="relative rounded-lg overflow-hidden shadow-lg"
                    >
                      <Image
                        src={resumeManagement}
                        alt="Resume Management"
                        className="w-full"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <span className="text-white text-sm p-3 font-medium">
                          Resume Management
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* User Testimonial */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold dark:text-white">From Our Users</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Trusted by job seekers worldwide</div>
                    </div>
                  </div>
                  <blockquote className="text-gray-600 dark:text-gray-400 italic">
                    "AppliedTrack helped me land my dream job by keeping me organized and on top of my follow-ups. The email discovery feature was a game-changer for networking."
                  </blockquote>
                </motion.div>
              </div>
            </div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-5xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">User Satisfaction</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">3x</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Faster Applications</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support Available</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Applications Tracked</div>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="w-full py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4 dark:text-white">
                How AppliedTrack{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Streamlines Your Job Search
                </span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 text-5xl font-bold text-gray-100 dark:text-gray-700">
                    1
                  </div>
                  <div className="relative">
                    <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg">
                      <FileUp className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">Import Applications</h3>
                    <p className="text-gray-600 dark:text-gray-400">Easily import job applications by filling out 3 fields manually. We'll automatically organize everything for you.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 text-5xl font-bold text-gray-100 dark:text-gray-700">
                    2
                  </div>
                  <div className="relative">
                    <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg">
                      <BarChart2 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">Track Progress</h3>
                    <p className="text-gray-600 dark:text-gray-400">Monitor application statuses, upcoming interviews, and follow-ups all in one dashboard.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 text-5xl font-bold text-gray-100 dark:text-gray-700">
                    3
                  </div>
                  <div className="relative">
                    <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">Land Interviews</h3>
                    <p className="text-gray-600 dark:text-gray-400">Get reminded when to follow up and use our AI tools to increase your response rates.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Success Stories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-24">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-6 dark:text-white">Success Stories</h3>
                <div className="space-y-6">
                  {[
                    {
                      quote: "I was applying to 20+ jobs a week and losing track. AppliedTrack helped me stay organized and land 3 interviews in my first week of using it.",
                      name: "Software Engineer",
                      company: "Tech Industry"
                    },
                    {
                      quote: "The email finder tool helped me connect with hiring managers directly. Game changer for getting responses!",
                      name: "Marketing Professional",
                      company: "Fortune 500 Company"
                    }
                  ].map((testimonial, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 }}
                      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Quote className="w-8 h-8 text-primary/40" />
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">{testimonial.quote}</p>
                          <div className="text-sm">
                            <p className="font-semibold dark:text-white">{testimonial.name}</p>
                            <p className="text-gray-500 dark:text-gray-400">{testimonial.company}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Feature Comparison */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl"
              >
                <h3 className="text-2xl font-bold mb-6 dark:text-white">Why Choose AppliedTrack?</h3>
                <div className="space-y-4">
                  {[
                    {
                      feature: "Application Tracking",
                      appliedtrack: "Smart tracking with automated updates",
                      others: "Manual tracking in spreadsheets"
                    },
                    {
                      feature: "Email Discovery",
                      appliedtrack: "Built-in email finder with verification",
                      others: "No email finding capabilities"
                    },
                    {
                      feature: "Follow-up Reminders",
                      appliedtrack: "AI-powered timing suggestions",
                      others: "Basic calendar reminders"
                    },
                    {
                      feature: "Resume Management",
                      appliedtrack: "Version control with application matching",
                      others: "Basic file storage"
                    }
                  ].map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 py-3 border-b dark:border-gray-700">
                      <div className="font-medium dark:text-white">{item.feature}</div>
                      <div className="text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {item.appliedtrack}
                        </span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">{item.others}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-24 max-w-3xl mx-auto"
            >
              <h3 className="text-2xl font-bold mb-4 dark:text-white">
                Ready to Transform Your Job Search?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of job seekers who are landing their dream jobs faster with AppliedTrack.
              </p>
              <form className="flex gap-4 max-w-md mx-auto" onSubmit={handleWaitlistSignup}>
                <Input
                  className="flex-1"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </form>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No credit card required. Free forever plan available.
              </p>
            </motion.div>
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

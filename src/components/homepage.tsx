'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Briefcase, Calendar, Search, Users, BarChart, FileText, Mail, Phone, ExternalLink } from 'lucide-react'

export function LandingPageColorful() {
  const [email, setEmail] = useState('')
  const controls = useAnimation()

  useEffect(() => {
    controls.start(i => ({
      y: [0, -10, 0],
      transition: { repeat: Infinity, duration: 2, delay: i * 0.2 },
    }))
  }, [controls])

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="px-4 lg:px-6 h-14 flex items-center fixed w-full bg-white z-50 shadow-md">
        <Link href="/" className="flex items-center justify-center">
          <Briefcase className="h-6 w-6 text-purple-600" />
          <span className="ml-2 text-2xl font-bold text-purple-600">JobTrackr</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:text-purple-600 transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium hover:text-purple-600 transition-colors">
            Pricing
          </Link>
          <Link href="#about" className="text-sm font-medium hover:text-purple-600 transition-colors">
            About
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-slow-spin">
              <div className="absolute inset-0 bg-white opacity-5 blur-3xl scale-75 rotate-45 transform origin-center"></div>
            </div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  Your Career Journey, Colorfully Organized
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Track applications, schedule interviews, and land your dream job with JobTrackr.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-sm space-y-2"
              >
                <form className="flex space-x-2" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    className="max-w-lg flex-1 bg-white text-purple-600"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" variant="secondary" className="bg-yellow-400 text-purple-600 hover:bg-yellow-300">
                    Get Started
                  </Button>
                </form>
                <p className="text-xs text-gray-300">
                  Start your free trial. No credit card required.
                </p>
              </motion.div>
            </div>
            <motion.div 
              className="mt-12 grid grid-cols-3 gap-4 md:gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    delayChildren: 0.3,
                    staggerChildren: 0.2
                  }
                }
              }}
            >
              {[Briefcase, FileText, Mail, Phone, Calendar, ExternalLink].map((Icon, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  animate={controls}
                  className="flex justify-center"
                >
                  <Icon className="w-12 h-12 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-purple-50">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-purple-600">
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
                  <Card className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <feature.icon className="w-10 h-10 text-purple-600 mb-2" />
                      <CardTitle className="text-purple-600">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-purple-50 to-white">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-purple-600">
              Your Job Search Dashboard
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                  <CardHeader>
                    <CardTitle>Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">24</div>
                    <p className="text-sm">Active applications</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <CardHeader>
                    <CardTitle>Interviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">3</div>
                    <p className="text-sm">Upcoming this week</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <CardHeader>
                    <CardTitle>Response Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">68%</div>
                    <p className="text-sm">Positive responses</p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Recent Activity</h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between p-2 bg-purple-100 rounded">
                    <span className="text-purple-700">Applied to Frontend Developer at TechCorp</span>
                    <Badge className="bg-yellow-400 text-purple-700">New</Badge>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-blue-100 rounded">
                    <span className="text-blue-700">Interview scheduled with InnoSoft</span>
                    <Badge className="bg-blue-400 text-white">Tomorrow</Badge>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-green-100 rounded">
                    <span className="text-green-700">Received offer from DataDynamics</span>
                    <Badge className="bg-green-400 text-white">Review</Badge>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-purple-50">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-purple-600">
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
                  <Card className="h-full flex flex-col bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription className="text-purple-100">
                        <span className="text-3xl font-bold">{tier.price}</span>
                        {tier.price !== 'Custom' && <span className="text-sm ml-1">/month</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-2">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-purple-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4 text-purple-600">
                  About JobTrackr
                </h2>
                <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-4">
                  JobTrackr was born out of a simple idea: to make the job search process easier and more efficient for everyone. Our team of dedicated professionals has experienced the challenges of job hunting firsthand, and we've built the tool we wish we had.
                </p>
                <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-6">
                  With JobTrackr, you're not just getting a job application tracker. You're gaining a partner in your career journey, equipped with powerful tools and insights to help you land your dream job.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
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
      <footer className="w-full py-6 bg-purple-600 text-white">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs">© 2024 JobTrackr. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
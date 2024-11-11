import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionButton } from '@/components/ui/subscription-button'
import { CheckCircle2 } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { SignedIn } from '@clerk/nextjs'
// Define the interface for pricing tier
interface PricingTier {
    name: string;
    price: string;
    features: string[];
  }

export default function PricingSection() {
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

    useEffect(() => {
      const fetchTiers = async () => {
        const response = await fetch('/api/tiers')
        const data = await response.json()
        console.log('data', data)
        setPricingTiers([{ 
              name: "Basic", 
              price: 'Free', 
              features: [
                `Up to ${data.free?.jobs || 15} job applications`,
                'Unlimited resumes',
                `Up to ${data.free?.coverLetters || 5} personalized cover letters/month`, 
                `${data.free?.contactEmails || 5} email domain lookups/month`
              ] 
            },
            { 
              name: 'Pro', 
              price: '$10', 
              features: [
                `Up to ${data.pro?.jobs || 100} job applications`,
                'Unlimited resumes', 
                `Up to ${data.pro?.coverLetters || 25} personalized cover letters/month`,
                `${data.pro?.contactEmails || 25} email domain lookups/month`,
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
                `${data.power?.contactEmails || 50} email domain lookups/month`
              ]
            }
          ]
        )
      }
      fetchTiers()
    }, [])

  return (
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
              {pricingTiers.map((tier, index) => (
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
  )
} 
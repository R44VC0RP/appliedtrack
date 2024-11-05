'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { AdminOnly } from '@/components/auth/AdminOnly'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from '@clerk/nextjs'
import { AdminUsers } from './components/adminusers'
import { Waitlist } from './components/waitlist'
import logo from '@/app/logos/logo.png'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger
} from '@/components/ui/sidebar'
import {
    Users,
    Settings,
    ShoppingCart,
    FileText,
    MessageSquare,
    BarChart3,
    CreditCard
} from 'lucide-react'
import { StripeTestHelper } from '@/components/stripe-test-helper'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BillingDashboard } from './components/billing-dashboard'
import { TierConfig } from './components/tier-config'
import { CampaignManagement } from './components/campaign-management'
import AiPlayground from './components/aiplayground'
import { LoggingDashboard } from './components/logging-dashboard'

interface NavItem {
    title: string;
    icon: any;
    component: () => JSX.Element;
}

const navItems: NavItem[] = [
    {
        title: "User Management",
        icon: Users,
        component: AdminUsers,
    },
    {
        title: "Waitlist",
        icon: Users,
        component: Waitlist,
    },
    {
        title: "Billing & Subscriptions",
        icon: CreditCard,
        component: BillingDashboard, // We'll create this component
    },
    {
        title: "Configs",
        icon: Settings,
        component: TierConfig, // Placeholder
    },
    {
        title: "Campaigns",
        icon: BarChart3,
        component: CampaignManagement,
    },
    {
        title: "AI Playground",
        icon: MessageSquare,
        component: AiPlayground,
    },
    {
        title: "Logging",
        icon: FileText,
        component: LoggingDashboard,
    },
    {
        title: "Settings",
        icon: Settings,
        component: () => <div>Settings Component</div>, // Placeholder
    },
]

export default function AdminDashboard() {
    const [activeComponent, setActiveComponent] = useState(() => {
        // Initialize from cookie or default to "User Management"
        return Cookies.get('adminActiveComponent') || "User Management"
    })
    const { user } = useUser()

    // Update cookie when activeComponent changes
    useEffect(() => {
        Cookies.set('adminActiveComponent', activeComponent, { expires: 7 }) // Expires in 7 days
    }, [activeComponent])

    return (
        <AdminOnly>
            <SidebarProvider>
                {/* <div className="grid grid-cols-[auto,1fr] h-screen"> */}
                <div className="flex h-screen w-full">
                    <Sidebar>
                        <SidebarHeader className="p-4 border-b inline-flex items-center gap-2" onClick={() => window.location.href = '/'}>
                            <Image src={logo} alt="Applied Track Logo" className="w-8 h-8" />
                            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
                        </SidebarHeader>
                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {navItems.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    onClick={() => setActiveComponent(item.title)}
                                                    className="flex items-center gap-3 px-3 py-2 w-full"
                                                    isActive={activeComponent === item.title}
                                                >
                                                    <item.icon className="h-5 w-5" />
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                        <SidebarFooter className="p-4 border-t">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.imageUrl} />
                                    <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{user?.emailAddresses[0].emailAddress}</span>
                                </div>
                            </div>
                        </SidebarFooter>
                    </Sidebar>
                    

                    <div className="flex-1 overflow-auto">
                        <div className="w-full">
                            <div className="p-3 flex items-center justify-start gap-2 items-center">
                                <SidebarTrigger />
                                <p className="text-lg font-semibold">Hi {user?.firstName}!</p>
                            </div>
                            <hr className="border-border mb-4" />
                        </div>

                        <div className="h-full p-6">
                            {navItems.map(item => (
                                activeComponent === item.title && (
                                    <div key={item.title} className="h-full w-full">
                                        <item.component />
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                    
                </div>
                
            </SidebarProvider>
            
        </AdminOnly>
    )
}

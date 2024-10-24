'use client'

import { useState } from 'react'
import { AdminOnly } from '@/components/auth/AdminOnly'
import { Header } from '@/components/header'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from '@clerk/nextjs'
import { AdminUsers } from './components/adminusers'
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
        title: "Orders",
        icon: ShoppingCart,
        component: () => <div>Orders Component</div>, // Placeholder
    },
    {
        title: "Content",
        icon: FileText,
        component: () => <div>Content Component</div>, // Placeholder
    },
    {
        title: "Analytics",
        icon: BarChart3,
        component: () => <div>Analytics Component</div>, // Placeholder
    },
    {
        title: "Support",
        icon: MessageSquare,
        component: () => <div>Support Component</div>, // Placeholder
    },
    {
        title: "Billing",
        icon: CreditCard,
        component: () => <div>Billing Component</div>, // Placeholder
    },
    {
        title: "Settings",
        icon: Settings,
        component: () => <div>Settings Component</div>, // Placeholder
    },
]

export default function AdminDashboard() {
    const [activeComponent, setActiveComponent] = useState("User Management")
    const { user } = useUser()

    return (
        <div className="flex flex-col h-screen">
            <AdminOnly>
                <SidebarProvider>
                    <div className="flex h-screen">
                        <Sidebar className="hidden lg:block w-64 border-r">
                            <SidebarHeader className="p-4">
                                <h2 className="text-lg font-semibold">Admin Dashboard</h2>
                            </SidebarHeader>
                            <SidebarContent>
                                <SidebarGroup>
                                    <SidebarGroupContent>
                                        <SidebarMenu>
                                            {navItems.map((item) => (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton asChild>
                                                        <button
                                                            onClick={() => setActiveComponent(item.title)}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md w-full text-left"
                                                        >
                                                            <item.icon className="h-5 w-5" />
                                                            <span>{item.title}</span>
                                                        </button>
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
                        <div className="flex-1 overflow-auto w-full">
                            <div className="w-full h-full p-6">
                                <div className="w-full max-w-7xl mx-auto">
                                    {navItems.map(item => (
                                        activeComponent === item.title && <item.component key={item.title} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarProvider>
            </AdminOnly>
        </div>
    )
}

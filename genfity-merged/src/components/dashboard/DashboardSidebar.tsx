"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Bot,
  ChevronRight,
  CreditCard,
  Home,
  MessageSquare,
  Package,
  Package2,
  Settings,
  ShoppingCart,
  Smartphone,
  TestTube,
  Users,
  Zap,
} from "lucide-react"
import Image from "next/image"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

// Menu data
const data = {
  mainNavigation: [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Product",
      url: "/dashboard/product",
      icon: Package2,
    },
    {
      title: "Transaction",
      url: "/dashboard/transaction",
      icon: CreditCard,
    },
    // {
    //   title: "Payment",
    //   url: "/dashboard/payment",
    //   icon: ShoppingCart,
    // },
  ],
  whatsappServices: {
    title: "WhatsApp Services",
    icon: MessageSquare,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/whatsapp",
        icon: Home,
      },
      {
        title: "Perangkat",
        url: "/dashboard/whatsapp/devices",
        icon: Smartphone,
      },
      {
        title: "Playground",
        url: "/dashboard/whatsapp/playground",
        icon: TestTube,
      },
      {
        title: "Langganan",
        url: "/dashboard/whatsapp/subscription",
        icon: Package,
      },
      {
        title: "Transaksi",
        url: "/dashboard/whatsapp/transactions",
        icon: CreditCard,
      },
      // {
      //   title: "Manage AI Agent",
      //   url: "/dashboard/whatsapp/ai-agent",
      //   icon: Bot,
      // },
      // {
      //   title: "Credit Usage",
      //   url: "/dashboard/whatsapp/credit",
      //   icon: Zap,
      // },
    ],
  },
}

// Helper function untuk mengecek active menu
const isActivePath = (pathname: string, itemUrl: string) => {
  // Remove locale prefix (e.g., /en/, /id/) from pathname
  const cleanPathname = pathname.replace(/^\/[a-z]{2}\//, '/')
  
  if (itemUrl === "/dashboard" && cleanPathname === "/dashboard") return true
  if (itemUrl === "/dashboard" && cleanPathname === "/dashboard/home") return true
  if (itemUrl !== "/dashboard" && cleanPathname.startsWith(itemUrl)) return true
  return false
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme } = useTheme()
  const { state } = useSidebar()
  const pathname = usePathname()
  const getLogoSrc = () => {
    // if (state === "collapsed") {
    //   return theme === 'dark' ? "/icon-dark.svg" : "/icon-light.svg";
    // }
    return theme === 'dark' ? "/logo.svg" : "/logo-dark-mode.svg"
  }  // Determine logo size based on sidebar state
  const getLogoSize = () => {
    if (state === "collapsed") {
      return { width: 48, height: 48 }
    }
    return { width: 140, height: 30 }
  }

  return (    
    <Sidebar collapsible="icon" {...props} className="border-none shadow-lg">        
      <SidebarHeader className="border-none bg-sidebar-background">        <div className={`flex items-center py-4 ${state === "collapsed" ? "justify-center px-2" : "justify-center px-4"}`}>
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <Image 
              src={getLogoSrc()}
              alt="Logo" 
              width={getLogoSize().width}
              height={getLogoSize().height}
              className={`transition-all duration-300 ${state === "collapsed" ? "min-w-[38px] min-h-[38px]" : ""}`}
              priority
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className={`bg-sidebar-background ${state === "collapsed" ? "px-1" : "px-2"}`}>          {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-semibold text-sidebar-foreground/70 mb-2 px-2 ${state === "collapsed" ? "sr-only" : ""}`}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">              
              {data.mainNavigation.map((item) => {
                const isActive = isActivePath(pathname, item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.url} className="block w-full">
                      <button
                        className={`h-10 transition-all duration-200 relative overflow-hidden rounded-lg flex items-center gap-3 w-full ${
                          state === "collapsed" ? "px-2 justify-center" : "px-3"
                        } ${isActive 
                          ? 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity' 
                          : state === "collapsed"
                            ? 'hover:bg-sidebar-accent hover:shadow-md'
                            : 'hover:bg-sidebar-accent hover:shadow-md hover:scale-105 hover:border-l-2 hover:border-primary dark:hover:border-white'
                        }`}
                      >
                        <item.icon className={`${state === "collapsed" ? "h-5 w-5 flex-shrink-0" : "h-4 w-4"} transition-all duration-200 ${
                          isActive 
                            ? 'text-white drop-shadow-sm' 
                            : theme === 'dark' 
                              ? 'text-white/80 group-hover:text-white' 
                              : 'text-gray-700 group-hover:text-gray-900'
                        }`} />
                        {state !== "collapsed" && (
                          <span className={`font-medium transition-all duration-200 ${
                            isActive 
                              ? 'text-white drop-shadow-sm' 
                              : theme === 'dark' 
                                ? 'text-white/90 group-hover:text-white' 
                                : 'text-gray-800 group-hover:text-gray-900'
                          }`}>
                            {item.title}
                          </span>
                        )}
                        {isActive && state !== "collapsed" && (
                          <>
                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-full opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none animate-pulse" />
                          </>
                        )}
                      </button>
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* <SidebarSeparator className={`my-4 bg-sidebar-border/30 ${state === "collapsed" ? "mx-1" : "mx-2"}`} />           */}
        {/* WhatsApp Services */}
        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-semibold text-sidebar-foreground/70 mb-2 px-2 ${state === "collapsed" ? "sr-only" : ""}`}>
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>            
            <SidebarMenu className="gap-1">
              <Collapsible key={data.whatsappServices.title} defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <button 
                      className={`h-10 rounded-lg hover:bg-sidebar-accent hover:shadow-md hover:scale-105 transition-all duration-200 group flex items-center gap-3 w-full ${
                        state === "collapsed" ? "px-3 justify-center" : "px-3"
                      }`}
                    >
                      <data.whatsappServices.icon className={`${state === "collapsed" ? "h-5 w-5 flex-shrink-0" : "h-4 w-4"} transition-all duration-200 ${
                        theme === 'dark' 
                          ? 'text-white/80 group-hover:text-white' 
                          : 'text-gray-700 group-hover:text-gray-900'
                      }`} />
                      {state !== "collapsed" && (
                        <span className={`font-medium transition-all duration-200 ${
                          theme === 'dark' 
                            ? 'text-white/90 group-hover:text-white' 
                            : 'text-gray-800 group-hover:text-gray-900'
                        }`}>
                          {data.whatsappServices.title}
                        </span>
                      )}
                      {state !== "collapsed" && (
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${
                          theme === 'dark' 
                            ? 'text-white/60 group-hover:text-white/80' 
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className={`mx-0 px-0 border-l-2 border-sidebar-border/20 mt-1  ${state === "collapsed" ? "ml-2" : "ml-6"}`}>                      {data.whatsappServices.items.map((subItem) => {
                        const isActive = isActivePath(pathname, subItem.url)
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <Link href={subItem.url} className="block w-full">                              <button
                                className={`h-9 rounded-lg transition-all duration-200 relative overflow-hidden group flex items-center gap-2 w-full ${
                                  state === "collapsed" ? "pl-3 justify-center" : "pl-4"
                                } ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity' 
                                    : state === "collapsed"
                                      ? 'hover:bg-sidebar-accent/80 hover:shadow-md'
                                      : 'hover:bg-sidebar-accent/80 hover:shadow-md hover:scale-105 hover:border-l-2 hover:border-primary dark:hover:border-white'
                                }`}
                              >
                                <subItem.icon className={`${state === "collapsed" ? "h-4 w-4 flex-shrink-0" : "h-3.5 w-3.5"} transition-all duration-200 ${
                                  isActive 
                                    ? 'text-white drop-shadow-sm' 
                                    : theme === 'dark' 
                                      ? 'text-white/70 group-hover:text-white' 
                                      : 'text-gray-600 group-hover:text-gray-800'
                                }`} />
                                {state !== "collapsed" && (
                                  <span className={`text-sm transition-all duration-200 ${
                                    isActive 
                                      ? 'text-white font-medium drop-shadow-sm' 
                                      : theme === 'dark' 
                                        ? 'text-white/80 group-hover:text-white' 
                                        : 'text-gray-700 group-hover:text-gray-900'
                                  }`}>
                                    {subItem.title}
                                  </span>
                                )}
                                {isActive && state !== "collapsed" && (
                                  <>
                                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-foreground rounded-full opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none animate-pulse" />
                                  </>
                                )}
                              </button>
                            </Link>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>        
        </SidebarGroup>

      <SidebarSeparator className={`my-4 bg-sidebar-border/30 ${state === "collapsed" ? "mx-1" : "mx-2"}`} />
      </SidebarContent>          <SidebarFooter className={`bg-sidebar-background border-none ${state === "collapsed" ? "p-1" : "p-2"}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard/settings" className="block w-full">              <button
                className={`h-10 rounded-lg transition-all duration-200 group relative overflow-hidden flex items-center gap-3 w-full ${
                  state === "collapsed" ? "px-3 justify-center" : "px-3"
                } ${
                  isActivePath(pathname, "/dashboard/settings")
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity' 
                    : state === "collapsed"
                      ? 'hover:bg-sidebar-accent hover:shadow-md'
                      : 'hover:bg-sidebar-accent hover:shadow-md hover:scale-105 hover:border-l-2 hover:border-primary dark:hover:border-white'
                }`}
              >
                <Settings className={`${state === "collapsed" ? "h-5 w-5 flex-shrink-0" : "h-4 w-4"} transition-all duration-200 ${
                  isActivePath(pathname, "/dashboard/settings") 
                    ? 'text-white drop-shadow-sm' 
                    : theme === 'dark' 
                      ? 'text-white/80 group-hover:text-white' 
                      : 'text-gray-700 group-hover:text-gray-900'
                }`} />
                {state !== "collapsed" && (
                  <span className={`font-medium transition-all duration-200 ${
                    isActivePath(pathname, "/dashboard/settings") 
                      ? 'text-white drop-shadow-sm' 
                      : theme === 'dark' 
                        ? 'text-white/90 group-hover:text-white' 
                        : 'text-gray-800 group-hover:text-gray-900'
                  }`}>
                    Account Settings
                  </span>
                )}
                {isActivePath(pathname, "/dashboard/settings") && state !== "collapsed" && (
                  <>
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-full opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none animate-pulse" />
                  </>
                )}
              </button>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

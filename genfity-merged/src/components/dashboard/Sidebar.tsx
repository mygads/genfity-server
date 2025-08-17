"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image" // Import next/image
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes" // Added useTheme import
import { 
  ChevronDown, 
  Users, 
  Box, 
  ShoppingCart, 
  Webhook, 
  X, 
  Layers, 
  FileText, 
  Settings,
  MessageSquare,
  Package,
  CreditCard,
  UserCheck,
  PackageCheck,
  Truck,
  Activity,
  BarChart3,
  Tag,
  Home,
  Server,
  Building2,
  Zap,
  FileArchive
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme() // Get the resolved theme
  const [waDropdown, setWaDropdown] = useState(false);
  const [productDropdown, setProductDropdown] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setOpen])  // Close sidebar when navigating on mobile
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])
  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Analytics & overview"
    },
    {
      title: "Webhook",
      href: "/dashboard/webhook",
      icon: Webhook,
      description: "Manage webhook endpoints"
    },
    {
      title: "Voucher",
      href: "/dashboard/vouchers",
      icon: Tag,
      description: "Manage discount vouchers"
    },    {
      title: "Service Fees",
      href: "/dashboard/service-fees",
      icon: CreditCard,
      description: "Manage payment service fees"
    },
    {
      title: "Bank Details",
      href: "/dashboard/bank-details",
      icon: Building2,
      description: "Manage bank account details"
    },
    {
      title: "Payments",
      href: "/dashboard/payments",
      icon: Activity,
      description: "Manage payment approvals"
    },    {
      title: "Transaction",
      href: "/dashboard/transaction",
      icon: ShoppingCart,
      description: "View transaction history"
    },    {
      title: "Servers",
      href: "/dashboard/servers",
      icon: Server,
      description: "Monitor server resources"
    },    {
      title: "Pengguna",
      href: "/dashboard/users",
      icon: Users,
      description: "User management"
    },
  ]
    const productMenuItems = [
    {
      title: "Product Management",
      href: "/dashboard/products",
      icon: Box,
      description: "Product catalog management",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Product Transactions",
      href: "/dashboard/product-transactions",
      icon: PackageCheck,
      description: "Manage product transactions",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Product Delivered",
      href: "/dashboard/package-customers",
      icon: Truck,
      description: "Manage delivered packages",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Addon Transactions",
      href: "/dashboard/addon-transactions",
      icon: FileText,
      description: "View addon transactions",
      color: "text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "Addon Delivered",
      href: "/dashboard/addon-delivery",
      icon: Layers,
      description: "Manage addon deliveries",
      color: "text-indigo-600 dark:text-indigo-400"
    }
  ]
  
  const whatsappMenuItems = [
    {
      title: "WhatsApp Home",
      href: "/dashboard/whatsapp-home",
      icon: Home,
      description: "WhatsApp dashboard & analytics",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Package Management",
      href: "/dashboard/whatsapp-packages",
      icon: Package,
      description: "Manage WhatsApp packages",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "WhatsApp Playground",
      href: "/dashboard/whatsapp-playground",
      icon: Settings,
      description: "Test & manage WhatsApp API",
      color: "text-emerald-600 dark:text-emerald-400"
    },    {
      title: "WhatsApp Sessions",
      href: "/dashboard/whatsapp-management",
      icon: MessageSquare,
      description: "Manage active WhatsApp sessions",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Service Management",
      href: "/dashboard/whatsapp-admin",
      icon: UserCheck,
      description: "Manage subscriptions & services",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "WhatsApp Transactions", 
      href: "/dashboard/whatsapp-transactions",
      icon: CreditCard,
      description: "View all WhatsApp API transactions",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Analytics",
      href: "/dashboard/whatsapp-analytics",
      icon: BarChart3,
      description: "Service usage analytics",
      color: "text-indigo-600 dark:text-indigo-400"
    }
  ]

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl lg:static lg:z-auto border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col", // Added flex flex-col for proper layout
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-all duration-300 ease-in-out lg:transition-none",
        )}
      >{/* Mobile close button */}
        <button
          className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </button>        
        {/* Logo */}        
        <div className="flex h-20 items-center justify-center mt-6 mb-8 px-6 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center transition-transform hover:scale-105">
            {resolvedTheme === "dark" ? (
              <Image 
                src="/logo-dark-mode.svg" 
                alt="Genfity Logo Dark" 
                width={0}
                height={0}
                style={{ height: "auto", width: "auto" }}
                priority 
              />
            ) : (
              <Image 
                src="/logo.svg" 
                alt="Genfity Logo" 
                width={0}
                height={0}
                style={{ height: "auto", width: "auto" }}
                priority 
              />
            )}
          </Link>
        </div>
        {/* Scrollable Menu Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(156 163 175) transparent'
        }}>{/* Menu items */}
          <nav className="space-y-2 px-4 pb-32">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                pathname === item.href
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors", 
                pathname === item.href 
                  ? "text-white" 
                  : "text-gray-700 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-400"
              )} />
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                {item.description && (
                  <span className={cn(
                    "text-xs opacity-70",
                    pathname === item.href ? "text-white" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {item.description}
                  </span>
                )}
              </div>            
              </Link>
          ))}

          {/* Product Management Dropdown */}
          <div className="mt-6">
            <div className="mb-3 px-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product Management
              </h3>
            </div>
            <button
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium w-full transition-all duration-200 hover:scale-[1.02]",
                productDropdown 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              )}
              onClick={() => setProductDropdown((v) => !v)}
              type="button"
            >
              <Box className={cn(
                "h-5 w-5 transition-colors",
                productDropdown ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              )} />
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">Products</span>
                <span className={cn(
                  "text-xs opacity-70 text-left",
                  productDropdown ? "text-white" : "text-gray-700 dark:text-gray-300"
                )}>
                  Manage products & orders
                </span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200", 
                productDropdown ? "rotate-180 text-white" : "rotate-0 text-gray-400"
              )}/>
            </button>
            
            {/* Product Dropdown Menu */}
            <div className={cn(
              "mt-2 space-y-1  transition-all duration-300 ease-in-out",
              productDropdown ? " opacity-100" : "max-h-0 opacity-0"
            )}>
              {productMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-4 py-2.5 ml-4 text-sm font-medium transition-all duration-200 hover:scale-[1.02] border-l-2",
                      isActive 
                        ? "bg-white/10 dark:bg-white/5 border-l-blue-500 text-blue-600 dark:text-blue-400 shadow-sm" 
                        : "border-l-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800/30 hover:border-l-gray-300 dark:hover:border-l-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? item.color : "text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    )} />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs opacity-70">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}            
            </div>
          </div>

          {/* WhatsApp Service Dropdown */}
          <div className="mt-6">
            <div className="mb-3 px-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                WhatsApp Services
              </h3>
            </div>
            <button
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium w-full transition-all duration-200 hover:scale-[1.02]",
                waDropdown 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              )}
              onClick={() => setWaDropdown((v) => !v)}
              type="button"
            >
              <Layers className={cn(
                "h-5 w-5 transition-colors",
                waDropdown ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              )} />              
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">WhatsApp</span>
                <span className={cn(
                  "text-xs opacity-70 text-left",
                  waDropdown ? "text-white" : "text-gray-700 dark:text-gray-300"
                )}>
                  Manage WhatsApp services
                </span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200", 
                waDropdown ? "rotate-180 text-white" : "rotate-0 text-gray-400"
              )}/>
            </button>
            
            {/* Dropdown Menu */}
            <div className={cn(
              "mt-2 space-y-1  transition-all duration-300 ease-in-out",
              waDropdown ? "opacity-100" : "max-h-0 opacity-0"
            )}>
              {whatsappMenuItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href.includes('?tab=transaction') && pathname === "/dashboard/whatsapp-admin" && 
                    typeof window !== 'undefined' && window.location.search.includes('tab=transaction'));
                // console.log('isActive:', isActive);
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-4 py-2.5 ml-4 text-sm font-medium transition-all duration-200 hover:scale-[1.02] border-l-2",
                      isActive 
                        ? "bg-white/10 dark:bg-white/5 border-l-blue-500 text-blue-600 dark:text-blue-400 shadow-sm" 
                        : "border-l-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800/30 hover:border-l-gray-300 dark:hover:border-l-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? item.color : "text-gray-700 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    )} />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs opacity-70">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}            
            </div>
          </div>
        </nav>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600/10 via-indigo-500/5 to-transparent dark:from-blue-400/20 dark:via-indigo-400/10 dark:to-transparent pointer-events-none"></div>
        
        {/* Version info */}
        <div className="my-4 mx-auto text-center">
          <p className="text-xs text-gray-700 dark:text-white">
            Genfity Dashboard v1.0
          </p>
        </div>
      </div>
    </>
  )
}

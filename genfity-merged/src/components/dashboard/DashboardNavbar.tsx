"use client"

import { useState } from "react"
import { LogOut, User, ShoppingCart, Moon, Sun, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useParams, useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button2"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useCart } from "@/components/Cart/CartContext"
import { useAuth } from "@/components/Auth/AuthContext"
import CartSidebar from "@/components/Cart/CartSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardNavbar() {
  const { theme, setTheme } = useTheme()
  const { items } = useCart()
  const { user, logout } = useAuth()
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [cartOpen, setCartOpen] = useState(false)
  
  // Get current locale from params or default to 'en'
  const currentLocale = (params?.locale as string) || 'en'
  // Calculate total cart items
  const totalCartItems = items.reduce((total, item) => total + item.qty, 0)

  // Use real user data from auth context - ensure name is always displayed
  const userDisplayData = user ? {
    name: user.name || user.email?.split('@')[0] || 'User',
    email: user.email || 'user@example.com',
    avatar: "/placeholder.svg?height=32&width=32",
  } : {
    name: "Loading...",
    email: "loading@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }
  const handleLogout = () => {
    if (logout) {
      logout()
    } else {
      console.log("Logging out...")
    }
  }
  const flagSVG = {
    en: (
      // UK flag (Union Jack) - improved and more accurate
      <svg width="20" height="14" viewBox="0 0 60 42" className="inline-block mr-2 align-middle">
        <rect width="60" height="42" fill="#012169" />
        <g>
          <polygon points="0,0 60,42 60,38 8,0" fill="#FFF" />
          <polygon points="60,0 0,42 0,38 52,0" fill="#FFF" />
          <polygon points="0,0 24,16 20,16 0,2" fill="#C8102E" />
          <polygon points="60,0 36,16 40,16 60,2" fill="#C8102E" />
          <polygon points="0,42 24,26 20,26 0,40" fill="#C8102E" />
          <polygon points="60,42 36,26 40,26 60,40" fill="#C8102E" />
        </g>
        <rect x="25" width="10" height="42" fill="#FFF" />
        <rect y="16" width="60" height="10" fill="#FFF" />
        <rect x="27" width="6" height="42" fill="#C8102E" />
        <rect y="18" width="60" height="6" fill="#C8102E" />
      </svg>
    ),
    id: (
      <svg width="20" height="14" viewBox="0 0 20 14" className="inline-block mr-2 align-middle">
        <rect width="20" height="7" fill="#e70011" />
        <rect y="7" width="20" height="7" fill="#fff" />
      </svg>
    ),
  }

  const languages = [
    { code: "en", name: "English", flag: flagSVG.en },
    { code: "id", name: "Bahasa Indonesia", flag: flagSVG.id },
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]
  const switchLanguage = (newLocale: string) => {
    const currentPath = pathname
    const newPath = currentPath.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }
  const handleProfileClick = () => {
    router.push(`/dashboard/profile`)
  }

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 shadow-sm dark:border-border/50 dark:bg-background/95 supports-[backdrop-filter]:bg-background/90 backdrop-blur supports-[backdrop-filter]:dark:bg-background/90 mr-4">
      <SidebarTrigger className="-ml-1 h-8 w-8 hover:bg-accent rounded-md transition-colors" />

      <div className="ml-auto flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-8 w-8 rounded-lg hover:bg-gray-200 bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center h-8 gap-0 px-3 rounded-lg hover:bg-gray-200 bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors uppercase"
            >
              {currentLanguage.flag}
              {currentLanguage.code}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg border border-border/50 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/90">
            <DropdownMenuLabel className="text-sm font-medium">Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            {languages.map((language) => (
              <DropdownMenuItem 
                key={language.code}
                onClick={() => switchLanguage(language.code)}
                className="rounded-md cursor-pointer hover:bg-accent focus:bg-accent"
              >
                <span className="mr-2">{language.flag}</span>
                <span>{language.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>        {/* Shopping Cart */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCartOpen(true)}
          className="h-8 w-8 relative rounded-lg hover:bg-gray-200 bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-center font-medium">
              {totalCartItems}
            </span>
          )}
          <span className="sr-only">Shopping cart</span>
        </Button>
        <div className="border-r dark:border-white/60 h-6 ml-2 "></div>
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 rounded-md hover:bg-accent transition-colors">
              <Avatar className="h-6 w-6 ring-2 ring-primary/30 dark:ring-primary/30">
                <AvatarImage src="/placeholder.svg" alt={userDisplayData.name || "User"} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-semibold">
                  {userDisplayData.name ? getInitials(userDisplayData.name) : 'U'}
                </AvatarFallback>
              </Avatar>              
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-foreground">{userDisplayData.name}</p>
                <p className="text-xs text-muted-foreground">{userDisplayData.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg border border-border/50 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/90">
            <DropdownMenuLabel className="text-sm font-medium">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="rounded-md cursor-pointer hover:bg-accent focus:bg-accent" onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-md cursor-pointer hover:bg-accent focus:bg-accent">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-md cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>        
        </DropdownMenu>
      </div>      
      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
    </>
  )
}

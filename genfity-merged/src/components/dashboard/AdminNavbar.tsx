"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Menu, Settings, User, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/Auth/AuthContext"

interface AdminNavbarProps {
    onMenuButtonClick: () => void
}

export default function AdminNavbar({ onMenuButtonClick }: AdminNavbarProps) {
    const [showNotifications, setShowNotifications] = useState(false)
    const router = useRouter()
    const { user, logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Logout error:', error)
        }
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 px-4 md:px-6 shadow-sm dark:shadow-gray-900/20 transition-colors duration-300">
            <Button variant="ghost" size="icon" className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onMenuButtonClick}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            <div className="flex-1" /> {/* Spacer */}
            
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="sr-only">Notifications</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-all duration-200"
                        >
                            <Avatar className="h-8 w-8 ring-2 ring-purple-500/30 dark:ring-purple-400/30">
                                <AvatarImage src="/placeholder.svg" alt={user?.name || "Admin"} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold">
                                    {user?.name ? getInitials(user.name) : 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden flex-col items-start md:flex">
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{user?.name || 'Admin'}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@example.com'}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Admin Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                            <DropdownMenuItem className="hover:bg-gray-100/80 dark:hover:bg-gray-700/50 focus:bg-gray-100/80 dark:focus:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-gray-100/80 dark:hover:bg-gray-700/50 focus:bg-gray-100/80 dark:focus:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                        <DropdownMenuItem className="hover:bg-red-100/80 dark:hover:bg-red-900/20 focus:bg-red-100/80 dark:focus:bg-red-900/20 text-red-600 dark:text-red-400" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

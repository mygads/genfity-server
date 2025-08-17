"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAdminAuth } from "./AdminAuthContext"
import { Eye, EyeOff, Loader2, Shield, User, Mail } from "lucide-react"
import { ShineBorder } from "@/components/ui/shine-border"

export default function AdminSignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, error } = useAdminAuth()
  const router = useRouter()

  // Demo credentials untuk masuk cepat
  const demoCredentials = [
    {
      label: "Super Admin",
      email: "admin@genfity.com",
      password: "admin123",
      icon: Shield,
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      label: "Admin User",
      email: "user@genfity.com",
      password: "user123",
      icon: User,
      color: "bg-blue-500 hover:bg-blue-600"
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickSignIn = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setIsLoading(true)

    try {
      const result = await signIn(demoEmail, demoPassword)
      if (result.success) {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Quick sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ShineBorder
      className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl"
      color="#A07CFE"
    >
      <div className="w-full max-w-sm space-y-6 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 p-8 rounded-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <Link href="/" className="block">
            <Image
              src="/logo.svg"
              alt="Genfity Logo"
              width={120}
              height={40}
              className="mx-auto object-contain block dark:hidden"
            />
            <Image
              src="/logo-dark-mode.svg"
              alt="Genfity Logo"
              width={120}
              height={40}
              className="mx-auto object-contain hidden dark:block"
            />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sign in to access the admin panel
            </p>
          </div>
        </div>

        {/* Quick Sign In Buttons */}
        <div className="space-y-3">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
            Quick Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoCredentials.map((demo, index) => {
              const IconComponent = demo.icon
              return (
                <button
                  key={index}
                  onClick={() => handleQuickSignIn(demo.email, demo.password)}
                  disabled={isLoading}
                  className={`${demo.color} text-white text-xs py-2 px-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md`}
                >
                  <IconComponent size={12} />
                  {demo.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
              Or sign in manually
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@genfity.com"
                required
                disabled={isLoading}
                className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="block w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Sign In to Admin
              </>
            )}
          </button>
        </form>

        {/* Back to User Site */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </ShineBorder>
  )
}

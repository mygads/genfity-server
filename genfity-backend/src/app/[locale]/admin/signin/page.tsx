"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, Shield, Lock, Mail } from "lucide-react"
import { useAdminAuth } from "@/components/Auth/AdminAuthContext"
import { ShineBorder } from "@/components/ui/shine-border"

export default function AdminSignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, error } = useAdminAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Admin sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Quick login function for development
  const quickLogin = async () => {
    setEmail("genfity@gmail.com")
    setPassword("1234abcd")
    
    setTimeout(async () => {
      setIsLoading(true)
      try {
        const result = await signIn("genfity@gmail.com", "1234abcd")
        if (result.success) {
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Quick login error:", err)
      } finally {
        setIsLoading(false)
      }
    }, 100)
  }

  return (
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px] bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 min-h-screen w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center">            
          <div className="w-full px-4">
            <div className="mx-auto max-w-[500px] relative rounded-xl bg-white px-6 py-10 shadow-2xl dark:bg-gray-900 sm:p-[60px]">
              <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
              
              {/* Admin Badge */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </div>
              </div>

              <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Admin Sign In
              </h3>
              
              <p className="mb-11 text-center text-base font-medium text-gray-700 dark:text-gray-300">
                Access the Genfity administration panel
              </p>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400 border border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-8">
                  <label htmlFor="email" className="mb-3 block text-sm text-dark dark:text-white">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Admin Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@genfity.com"
                    className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-8">
                  <label htmlFor="password" className="mb-3 block text-sm text-dark dark:text-white">
                    <Lock className="inline h-4 w-4 mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 pr-12 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="flex w-full items-center justify-center rounded-md bg-primary dark:bg-primary px-9 py-3 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/80 dark:shadow-submit-dark disabled:opacity-50 disabled:hover:bg-primary"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    {isLoading ? "Signing in..." : "Sign In as Admin"}
                  </button>

                  {/* Quick Login Button for Development */}
                  <button
                    type="button"
                    onClick={quickLogin}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center rounded-md bg-gradient-to-r from-green-500 to-emerald-600 px-9 py-2 text-sm font-medium text-white shadow-submit duration-300 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                  >
                    ⚡ Quick Login (Dev)
                  </button>
                </div>
              </form>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customer portal? {" "}
                  <Link href="/signin" className="text-primary dark:text-blue-500 hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute left-0 top-0 z-[-1]">
        <svg width="1440" height="969" viewBox="0 0 1440 969" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask
            id="mask0_95:1005"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1440"
            height="969"
          >
            <rect width="1440" height="969" fill="#090E34" />
          </mask>
          <g mask="url(#mask0_95:1005)">
            <path
              opacity="0.1"
              d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
              fill="url(#paint0_linear_95:1005)"
            />
            <path
              opacity="0.1"
              d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
              fill="url(#paint1_linear_95:1005)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear_95:1005"
              x1="1178.4"
              y1="151.853"
              x2="780.959"
              y2="453.581"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_95:1005"
              x1="160.5"
              y1="220"
              x2="1099.45"
              y2="1192.04"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>      
    </section>
  )
}

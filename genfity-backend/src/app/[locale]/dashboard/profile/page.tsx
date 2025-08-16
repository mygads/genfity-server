"use client"

import type React from "react"
import Image from "next/image"

import { useState, useEffect, useRef } from "react"
import { Loader2, Save, User, Mail, Phone, Shield, BarChart3, Camera, Send, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/Auth/AuthContext"

interface ProfileData {
  id: string
  name: string
  email: string
  phone: string
  image: string | null
  emailVerified: string | null
  phoneVerified: string | null
  role: string
  _count: {
    transactions: number
  }
  verification: {
    emailVerified: boolean
    phoneVerified: boolean
  }
  stats: {
    totalTransactions: number
    totalWhatsappTransactions: number
    activeWhatsappServices: number
    totalWhatsappServices: number
  }
}

export default function ProfilePage() {
  const { user, updatePassword } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" })
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" })
  const [emailMessage, setEmailMessage] = useState({ type: "", text: "" })

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        const result = await response.json()
        if (result.success && result.data) {
          setProfile(result.data)
          setFormData({
            name: result.data.name,
            email: result.data.email,
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setProfileMessage({ type: "", text: "" })

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        })
      })
      const result = await response.json()

      if (result.success) {
        setProfileMessage({ type: "success", text: "Profil berhasil diperbarui" })
        // Refresh profile data
        const profileResponse = await fetch('/api/profile')
        const updatedProfile = await profileResponse.json()
        if (updatedProfile.success && updatedProfile.data) {
          setProfile(updatedProfile.data)
        }
      } else {
        setProfileMessage({ type: "error", text: result.error?.message || "Gagal memperbarui profil" })
      }
    } catch (error) {
      setProfileMessage({ type: "error", text: "Terjadi kesalahan saat memperbarui profil" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordMessage({ type: "", text: "" })

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Konfirmasi password baru tidak cocok" })
      setIsChangingPassword(false)
      return
    }

    try {
      const { success, error } = await updatePassword(passwordData.currentPassword, passwordData.newPassword)

      if (success) {
        setPasswordMessage({ type: "success", text: "Password berhasil diperbarui" })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setPasswordMessage({ type: "error", text: error.message || "Gagal memperbarui password" })
      }
    } catch (error) {
      setPasswordMessage({ type: "error", text: "Terjadi kesalahan saat memperbarui password" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: "error", text: "File harus berupa gambar" })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Ukuran file maksimal 5MB" })
      return
    }

    setIsUploadingImage(true)
    setProfileMessage({ type: "", text: "" })

    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      if (result.success) {
        setProfileMessage({ type: "success", text: "Foto profil berhasil diperbarui" })
        // Refresh profile data
        const profileResponse = await fetch('/api/profile')
        const updatedProfile = await profileResponse.json()
        if (updatedProfile.success && updatedProfile.data) {
          setProfile(updatedProfile.data)
        }
      } else {
        setProfileMessage({ type: "error", text: result.error?.message || "Gagal mengupload foto profil" })
      }
    } catch (error) {
      setProfileMessage({ type: "error", text: "Terjadi kesalahan saat mengupload foto" })
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleResendEmailVerification = async () => {
    setIsResendingEmail(true)
    setEmailMessage({ type: "", text: "" })

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setEmailMessage({ type: "success", text: "Email verifikasi berhasil dikirim" })
      } else {
        setEmailMessage({ type: "error", text: result.error?.message || "Gagal mengirim email verifikasi" })
      }
    } catch (error) {
      setEmailMessage({ type: "error", text: "Terjadi kesalahan saat mengirim email verifikasi" })
    } finally {
      setIsResendingEmail(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Pengaturan Profil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola informasi profil dan keamanan akun Anda
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex flex-col items-center text-center">
                {/* Profile Image */}
                <div className="relative mb-4">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                    {profile?.image ? (
                      <Image
                        src={profile.image}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-primary">
                        {profile?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-xs hover:bg-primary/90 transition-colors disabled:opacity-70"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {profile?.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {profile?.email}
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {profile?.phone || "No phone"}
                </div>
                
                {/* Verification Status */}
                <div className="w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Email</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile?.verification.emailVerified 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {profile?.verification.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Phone</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile?.verification.phoneVerified 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {profile?.verification.phoneVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>

                  {/* Email Verification Button */}
                  {!profile?.verification.emailVerified && (
                    <div className="mt-3">
                      {emailMessage.text && (
                        <div className={`p-2 rounded-lg mb-2 text-xs ${
                          emailMessage.type === "success"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {emailMessage.text}
                        </div>
                      )}
                      <button
                        onClick={handleResendEmailVerification}
                        disabled={isResendingEmail}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
                      >
                        {isResendingEmail ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Resend Verification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Statistics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {profile?.stats.totalTransactions || 0}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Transactions
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {profile?.stats.totalWhatsappTransactions || 0}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    WhatsApp
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {profile?.stats.activeWhatsappServices || 0}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Active
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {profile?.stats.totalWhatsappServices || 0}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Services
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your basic profile information</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleProfileChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile?.phone || ""}
                      disabled
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60"
                      placeholder="WhatsApp number cannot be changed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      WhatsApp number cannot be changed for security reasons
                    </p>
                  </div>
                </div>

                {profileMessage.text && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    profileMessage.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center gap-2">
                      {profileMessage.type === "success" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {profileMessage.text}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5 text-orange-500" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Security</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Change your password to keep your account secure</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        required
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>

                  {passwordMessage.text && (
                    <div className={`p-3 rounded-lg text-sm ${
                      passwordMessage.type === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                    }`}>
                      <div className="flex items-center gap-2">
                        {passwordMessage.type === "success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {passwordMessage.text}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-70"
                    >
                      {isChangingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      {isChangingPassword ? "Changing Password..." : "Change Password"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

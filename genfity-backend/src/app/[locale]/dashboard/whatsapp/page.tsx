"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  MessageSquare, 
  Settings, 
  Zap, 
  ArrowRight,
  Users,
  TestTube,
  Key,
  Bot,
  Package,
  CreditCard,
  Play,
  Eye
} from "lucide-react"
import { useWhatsApp } from '@/hooks/useWhatsApp'

export default function WhatsAppDashboardPage() {
  const {
    apiKey,
    sessions,
    subscription,
    usage,
    transactions,
    sessionQuota,
    packageInfo,
    loading,
    error
  } = useWhatsApp()

  // Calculate stats
  const activeSessions = sessions?.length || 0
  const maxSessions = sessionQuota?.max || packageInfo?.maxSessions || 0
  const messagesThisMonth = usage?.messagesThisMonth || 0
  const packageName = packageInfo?.name || subscription?.packageName || '-'
  const apiKeyStatus = apiKey ? 'Tersedia' : 'Belum Ada'
  const transactionCount = transactions?.length || 0
  const packageStatus = subscription?.status === 'ACTIVE' ? 'Aktif' : (subscription?.status || '-')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          WhatsApp Services Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola session WhatsApp, API Key, langganan, dan uji coba pengiriman pesan
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Session Aktif</p>
                <p className="text-2xl font-bold">{activeSessions}</p>
                <p className="text-xs text-gray-500 mt-1">dari {maxSessions} maksimal</p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pesan Bulan Ini</p>
                <p className="text-2xl font-bold">{messagesThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">terkirim</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Key</p>
                <p className="text-2xl font-bold">{apiKeyStatus}</p>
                <p className="text-xs text-gray-500 mt-1">global key</p>
              </div>
              <Key className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status Paket</p>
                <p className="text-2xl font-bold">{packageStatus}</p>
                <p className="text-xs text-gray-500 mt-1">{packageName}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Kelola Perangkat
            </CardTitle>
            <CardDescription>
              Buat, kelola, dan pantau session WhatsApp Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Session Aktif</span>
                <Badge variant="secondary">{activeSessions} / {maxSessions}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Status</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {sessionQuota?.canCreateMore ? 'Siap Digunakan' : 'Kuota Penuh'}
                </Badge>
              </div>
              <Link href="/dashboard/whatsapp/devices">
                <Button className="w-full">
                  Kelola Perangkat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-green-500" />
              API Playground
            </CardTitle>
            <CardDescription>
              Uji coba pengiriman pesan WhatsApp secara langsung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>API Key</span>
                <Badge variant="outline">{apiKeyStatus}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Supported</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Text, Image, Doc
                </Badge>
              </div>
              <Link href="/dashboard/whatsapp/playground">
                <Button className="w-full">
                  Buka Playground
                  <Play className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Informasi Langganan
            </CardTitle>
            <CardDescription>
              Detail paket dan penggunaan layanan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Paket</span>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {packageName}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Status</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {packageStatus}
                </Badge>
              </div>
              <Link href="/dashboard/whatsapp/subscription">
                <Button className="w-full" variant="outline">
                  Lihat Detail
                  <Eye className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Riwayat Transaksi
            </CardTitle>
            <CardDescription>
              Lihat riwayat pembayaran dan transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Transaksi Bulan Ini</span>
                <Badge variant="secondary">{transactionCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Status</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Lunas
                </Badge>
              </div>
              <Link href="/dashboard/whatsapp/transactions">
                <Button className="w-full" variant="outline">
                  Lihat Transaksi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-500" />
              API Key Management
            </CardTitle>
            <CardDescription>
              Kelola API Key untuk integrasi eksternal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Global API Key</span>
                <Badge variant="outline">{apiKeyStatus}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Akses</span>
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  Public API
                </Badge>
              </div>
              <Link href="/dashboard/whatsapp/devices">
                <Button className="w-full" variant="outline">
                  Buat API Key
                  <Key className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future features */}
        <Card className="hover:shadow-lg transition-shadow opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-gray-400" />
              AI Agent (Segera)
            </CardTitle>
            <CardDescription>
              Manajemen AI agent untuk automasi pesan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Status</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Features</span>
                <Badge variant="outline">Auto Reply</Badge>
              </div>
              <Button className="w-full" disabled>
                Segera Hadir
                <Bot className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Aksi cepat untuk memulai menggunakan WhatsApp Services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/whatsapp/devices">
              <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                <Smartphone className="h-6 w-6" />
                <span className="text-sm">Buat Session Baru</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/whatsapp/playground">
              <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Kirim Pesan Test</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/whatsapp/subscription">
              <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                <Package className="h-6 w-6" />
                <span className="text-sm">Cek Kuota Session</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/whatsapp/transactions">
              <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Lihat Tagihan</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2" disabled>
              <Key className="h-6 w-6" />
              <span>Generate API Key</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  CreditCard, 
  Calendar, 
  Users, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useWhatsApp } from "@/hooks/useWhatsApp"

export default function SubscriptionPage() {
  const {
    subscription,
    sessionQuota,
    loading,
    error,
    fetchSubscription,
    clearError
  } = useWhatsApp()

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      INACTIVE: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Loader2 },
      EXPIRED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  // Show error if there's one
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>Error: {error}</span>
              </div>
              <Button 
                onClick={clearError} 
                variant="outline" 
                className="mt-4"
              >
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Informasi Langganan
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detail paket dan penggunaan layanan WhatsApp
            </p>
          </div>
          <Button 
            onClick={fetchSubscription} 
            variant="outline" 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {!subscription ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                {loading ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Memuat informasi langganan...
                    </p>
                  </>
                ) : (
                  <>
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Informasi langganan tidak tersedia
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Paket Saat Ini
                </CardTitle>
                <CardDescription>
                  Informasi paket langganan WhatsApp aktif
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{subscription.packageName}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusBadge(subscription.status)}
                      {subscription.isLegacy && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Legacy
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {subscription.price && subscription.currency && (
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {formatCurrency(subscription.price, subscription.currency)}
                      </div>
                      {subscription.billingCycle && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          per {subscription.billingCycle === 'monthly' ? 'bulan' : 'tahun'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Maksimal Session</span>
                    </div>
                    <div className="text-2xl font-bold">{subscription.maxSessions}</div>
                  </div>

                  {subscription.nextBillingDate && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Tagihan Berikutnya</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatDate(subscription.nextBillingDate)}
                      </div>
                    </div>
                  )}

                  {subscription.billingCycle && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Siklus Tagihan</span>
                      </div>
                      <div className="text-lg font-semibold capitalize">
                        {subscription.billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'}
                      </div>
                    </div>
                  )}
                </div>

                {subscription.features.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Fitur yang Tersedia
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {subscription.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Statistik Penggunaan
                </CardTitle>
                <CardDescription>
                  Ringkasan penggunaan layanan bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Session Terpakai</span>
                        <span className="text-sm text-gray-500">
                          {sessionQuota?.used || 0} / {subscription.maxSessions}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(((sessionQuota?.used || 0) / subscription.maxSessions) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Pesan Bulan Ini</span>
                        <span className="text-sm text-gray-500">
                          Tidak tersedia
                        </span>
                      </div>
                      <div className="text-2xl font-bold">
                        -
                      </div>
                      <div className="text-sm text-gray-500">pesan terkirim</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legacy Notice */}
            {subscription.isLegacy && (
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        Paket Legacy
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Anda sedang menggunakan paket legacy. Beberapa fitur terbaru mungkin tidak tersedia. 
                        Pertimbangkan untuk upgrade ke paket yang lebih baru untuk mendapatkan fitur lengkap.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

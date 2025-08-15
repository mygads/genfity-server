"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Trash2, 
  QrCode, 
  Key, 
  Edit2,
  Smartphone, 
  Wifi, 
  WifiOff,
  Copy,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Package,
  Eye,
  EyeOff,
  Save
} from "lucide-react"
import { useWhatsApp } from "@/hooks/useWhatsApp"

// Simple notification function with fallback
const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
  try {
    // Try to use sonner toast if available
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast[type](message)
    } else {
      // Fallback to alert
      const emoji = type === 'success' ? '✅' : '❌'
      alert(`${emoji} ${message}`)
    }
  } catch {
    // Ultimate fallback
    const emoji = type === 'success' ? '✅' : '❌'
    alert(`${emoji} ${message}`)
  }
}

export default function DevicesTab() {
  const {
    apiKey,
    sessions,
    sessionQuota,
    packageInfo,
    loading,
    error,
    createApiKey,
    createNewSession,
    updateSessionName,
    removeSession,
    getQRCode,
    fetchSessions,
    clearError
  } = useWhatsApp()

  const [newSessionName, setNewSessionName] = useState("")
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [loadingQR, setLoadingQR] = useState(false)

  // Auto-refresh sessions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      showMessage("Nama session tidak boleh kosong", 'error')
      return
    }

    if (newSessionName.trim().length < 3 || newSessionName.trim().length > 50) {
      showMessage("Nama session harus antara 3-50 karakter", 'error')
      return
    }

    setCreatingSession(true)
    try {
      const session = await createNewSession(newSessionName.trim())
      if (session) {
        showMessage("Session berhasil dibuat!", 'success')
        setNewSessionName("")
        setShowNewSessionDialog(false)
      } else {
        showMessage("Gagal membuat session", 'error')
      }
    } catch (error) {
      showMessage("Terjadi kesalahan saat membuat session", 'error')
    } finally {
      setCreatingSession(false)
    }
  }

  const handleEditSession = async () => {
    if (!editingSession || !editName.trim()) {
      showMessage("Nama session tidak boleh kosong", 'error')
      return
    }

    if (editName.trim().length < 3 || editName.trim().length > 50) {
      showMessage("Nama session harus antara 3-50 karakter", 'error')
      return
    }

    const success = await updateSessionName(editingSession.id, editName.trim())
    if (success) {
      showMessage("Nama session berhasil diubah!", 'success')
      setShowEditDialog(false)
      setEditingSession(null)
      setEditName("")
    } else {
      showMessage("Gagal mengubah nama session", 'error')
    }
  }

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus session "${sessionName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setDeletingSessionId(sessionId)
    try {
      const success = await removeSession(sessionId)
      if (success) {
        showMessage("Session berhasil dihapus!", 'success')
      } else {
        showMessage("Gagal menghapus session", 'error')
      }
    } catch (error) {
      showMessage("Terjadi kesalahan saat menghapus session", 'error')
    } finally {
      setDeletingSessionId(null)
    }
  }

  const handleShowQR = async (sessionId: string) => {
    setLoadingQR(true)
    setQrSessionId(sessionId)
    try {
      const qrData = await getQRCode(sessionId)
      if (qrData) {
        setQrCodeData(qrData)
        setShowQRDialog(true)
      } else {
        showMessage("Gagal mengambil QR code", 'error')
      }
    } catch (error) {
      showMessage("Terjadi kesalahan saat mengambil QR code", 'error')
    } finally {
      setLoadingQR(false)
    }
  }

  const handleCreateApiKey = async () => {
    const newApiKey = await createApiKey()
    if (newApiKey) {
      showMessage("API Key berhasil dibuat!", 'success')
      setShowApiKeyDialog(false)
    } else {
      showMessage("Gagal membuat API Key", 'error')
    }
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      showMessage("API Key berhasil disalin!", 'success')
    }
  }

  const openEditDialog = (session: { id: string; name: string }) => {
    setEditingSession(session)
    setEditName(session.name)
    setShowEditDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONNECTED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Wifi },
      DISCONNECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: WifiOff },
      CONNECTING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Loader2 },
      ERROR: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ERROR
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID')
  }

  // Show error if there's one
  if (error) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            API Key global untuk mengakses WhatsApp API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                value={apiKey || ""}
                readOnly
                placeholder="API Key belum tersedia"
                type={showApiKey ? "text" : "password"}
                className="font-mono text-sm"
              />
              <Button 
                onClick={() => setShowApiKey(!showApiKey)} 
                variant="outline" 
                size="sm"
                disabled={!apiKey}
                className="flex-shrink-0"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={copyApiKey} 
                variant="outline" 
                size="sm"
                disabled={!apiKey}
                className="flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {!apiKey && (
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Buat API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat API Key</DialogTitle>
                  <DialogDescription>
                    API Key akan digunakan untuk mengakses WhatsApp API dari aplikasi eksternal.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Klik tombol di bawah untuk membuat API Key baru. API Key ini akan menggantikan API Key yang sudah ada jika ada.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateApiKey}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Membuat...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Buat API Key
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApiKeyDialog(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Package & Quota Info */}
      {packageInfo && sessionQuota && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paket & Kuota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Paket Saat Ini</Label>
                <p className="text-lg font-semibold">{packageInfo.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Kuota Session</Label>
                <p className="text-lg font-semibold">
                  {sessionQuota.used} / {sessionQuota.max}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(sessionQuota.used / sessionQuota.max) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-lg font-semibold">
                  {sessionQuota.canCreateMore ? (
                    <span className="text-green-600 dark:text-green-400">Dapat Membuat</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">Kuota Penuh</span>
                  )}
                </p>
              </div>
            </div>
            
            {packageInfo.features.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <Label className="text-sm font-medium">Fitur Paket</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {packageInfo.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Daftar Session WhatsApp
              </CardTitle>
              <CardDescription>
                Kelola session WhatsApp Anda
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchSessions} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={!sessionQuota?.canCreateMore || loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Session Baru</DialogTitle>
                    <DialogDescription>
                      Buat session WhatsApp baru untuk perangkat terpisah
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-name">Nama Session</Label>
                      <Input
                        id="session-name"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        placeholder="Contoh: WhatsApp Bisnis"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-500">
                        3-50 karakter, harus unik
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreateSession}
                        disabled={creatingSession || !newSessionName.trim()}
                        className="flex-1"
                      >
                        {creatingSession ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Membuat...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Session
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowNewSessionDialog(false)
                          setNewSessionName("")
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Belum ada session WhatsApp. Buat session pertama Anda!
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{session.name}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div><strong>ID:</strong> {session.id}</div>
                          {session.phone && <div><strong>Nomor:</strong> {session.phone}</div>}
                          <div><strong>Dibuat:</strong> {formatDate(session.createdAt)}</div>
                          <div><strong>Diperbarui:</strong> {formatDate(session.updatedAt)}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleShowQR(session.id)}
                          variant="outline"
                          size="sm"
                          disabled={loadingQR && qrSessionId === session.id}
                        >
                          {loadingQR && qrSessionId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => openEditDialog({ id: session.id, name: session.name })}
                          variant="outline"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => handleDeleteSession(session.id, session.name)}
                          variant="outline"
                          size="sm"
                          disabled={deletingSessionId === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                        >
                          {deletingSessionId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code WhatsApp</DialogTitle>
            <DialogDescription>
              Scan QR code ini dengan WhatsApp di ponsel Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeData ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={qrCodeData} 
                    alt="WhatsApp QR Code" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    1. Buka WhatsApp di ponsel Anda
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    2. Ketuk Menu atau Settings → Perangkat Terhubung
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    3. Ketuk "Hubungkan Perangkat" dan scan QR code ini
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nama Session</DialogTitle>
            <DialogDescription>
              Ubah nama session WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Session</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nama session baru"
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                3-50 karakter, harus unik
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleEditSession}
                disabled={loading || !editName.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingSession(null)
                  setEditName("")
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

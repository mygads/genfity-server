"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Send,
  Smartphone,
  MessageSquare,
  Image,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  Wifi,
  WifiOff
} from "lucide-react"
import { useWhatsApp } from "@/hooks/useWhatsApp"

// Types
interface SendMessageLog {
  id: string
  timestamp: string
  sessionName: string
  phone: string
  contentType: string
  content: string
  status: 'success' | 'error'
  message?: string
}

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

export default function PlaygroundTab() {
  const {
    apiKey,
    sessions,
    loading,
    error,
    sendWhatsAppMessage,
    sendQuickMessage,
    clearError
  } = useWhatsApp()

  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [contentType, setContentType] = useState<'text' | 'image' | 'document'>('text')
  const [messageContent, setMessageContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [caption, setCaption] = useState("")
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState<SendMessageLog[]>([])

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    // Load logs from localStorage
    const savedLogs = localStorage.getItem('whatsapp_message_logs')
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs))
      } catch (error) {
        console.error('Error loading logs:', error)
        // Initialize with empty array if parsing fails
        setLogs([])
      }
    }
  }

  const saveLogs = (newLogs: SendMessageLog[]) => {
    try {
      localStorage.setItem('whatsapp_message_logs', JSON.stringify(newLogs))
      setLogs(newLogs)
    } catch (error) {
      console.error('Error saving logs:', error)
    }
  }

  const addLog = (log: Omit<SendMessageLog, 'id' | 'timestamp'>) => {
    const newLog: SendMessageLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    const updatedLogs = [newLog, ...logs].slice(0, 100) // Keep only last 100 logs
    saveLogs(updatedLogs)
  }

  const handleSendMessage = async () => {
    if (!selectedSessionId || !phoneNumber.trim() || !messageContent.trim() || !apiKey) {
      showMessage("Harap lengkapi semua field yang diperlukan", 'error')
      return
    }

    setSending(true)
    
    try {
      const selectedSession = sessions.find(s => s.id === selectedSessionId)
      const sessionName = selectedSession?.name || selectedSessionId

      let success = false

      if (contentType === 'text') {
        // Use quick message for text messages (GET method)
        success = await sendQuickMessage(selectedSessionId, phoneNumber, messageContent)
      } else {
        // Use full message API for media messages (POST method)
        const payload = {
          phone: phoneNumber,
          type: contentType,
          ...(contentType === 'image' ? {
            image: messageContent,
            caption: caption || undefined
          } : {
            document: messageContent,
            filename: fileName || 'document'
          })
        }
        success = await sendWhatsAppMessage(selectedSessionId, payload)
      }

      if (success) {
        addLog({
          sessionName,
          phone: phoneNumber,
          contentType,
          content: messageContent,
          status: 'success'
        })
        showMessage("Pesan berhasil dikirim!", 'success')
        
        // Clear form
        setPhoneNumber("")
        setMessageContent("")
        setFileName("")
        setCaption("")
      } else {
        addLog({
          sessionName,
          phone: phoneNumber,
          contentType,
          content: messageContent,
          status: 'error',
          message: 'Failed to send message'
        })
        showMessage("Gagal mengirim pesan", 'error')
      }
    } catch (error) {
      console.error('Send message error:', error)
      showMessage("Terjadi kesalahan saat mengirim pesan", 'error')
      
      const selectedSession = sessions.find(s => s.id === selectedSessionId)
      const sessionName = selectedSession?.name || selectedSessionId
      
      addLog({
        sessionName,
        phone: phoneNumber,
        contentType,
        content: messageContent,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setSending(false)
    }
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      showMessage("API Key berhasil disalin!", 'success')
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID')
  }

  const getStatusColor = (status: 'success' | 'error') => {
    return status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const getSessionStatusBadge = (status: string) => {
    const statusConfig = {
      CONNECTED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Wifi },
      DISCONNECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: WifiOff },
      CONNECTING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Loader2 },
      ERROR: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
      // Legacy lowercase support
      connected: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Wifi },
      disconnected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: WifiOff },
      connecting: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Loader2 },
      inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: AlertCircle }
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
            <MessageSquare className="h-5 w-5" />
            API Playground
          </CardTitle>
          <CardDescription>
            Uji coba pengiriman pesan WhatsApp menggunakan API
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
                className="font-mono text-sm"
              />
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
        </CardContent>
      </Card>

      {/* Send Message Section */}
      <Card>
        <CardHeader>
          <CardTitle>Kirim Pesan</CardTitle>
          <CardDescription>
            Pilih session dan kirim pesan ke nomor WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Selection */}
          <div className="space-y-2">
            <Label htmlFor="session">Pilih Session</Label>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih session WhatsApp" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{session.name}</span>
                      {getSessionStatusBadge(session.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="628123456789"
              type="tel"
            />
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="content-type">Tipe Konten</Label>
            <Select value={contentType} onValueChange={(value: 'text' | 'image' | 'document') => setContentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Teks
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Gambar
                  </div>
                </SelectItem>
                <SelectItem value="document">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dokumen
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">
              {contentType === 'text' ? 'Pesan' : contentType === 'image' ? 'Data Gambar (Base64)' : 'Data Dokumen (Base64)'}
            </Label>
            <Textarea
              id="message"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={
                contentType === 'text' 
                  ? 'Tulis pesan Anda di sini...' 
                  : contentType === 'image'
                  ? 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'
                  : 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAo...'
              }
              rows={contentType === 'text' ? 4 : 6}
              className={contentType !== 'text' ? 'font-mono text-xs' : ''}
            />
          </div>

          {/* File Name (for non-text) */}
          {contentType !== 'text' && (
            <div className="space-y-2">
              <Label htmlFor="filename">Nama File</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={contentType === 'image' ? 'gambar.jpg' : 'dokumen.pdf'}
              />
            </div>
          )}

          {/* Caption (for image) */}
          {contentType === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (Opsional)</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption untuk gambar..."
              />
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage} 
            disabled={sending || loading || !selectedSessionId || !phoneNumber.trim() || !messageContent.trim()}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Kirim Pesan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Message Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Log Pengiriman Pesan
          </CardTitle>
          <CardDescription>
            Riwayat pengiriman pesan WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Belum ada log pengiriman pesan
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{log.sessionName}</span>
                      <Badge variant="outline" className={getStatusColor(log.status)}>
                        {log.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {log.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div><strong>Ke:</strong> {log.phone}</div>
                    <div><strong>Tipe:</strong> {log.contentType}</div>
                    <div><strong>Konten:</strong> 
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {log.contentType === 'text' 
                          ? log.content 
                          : `${log.contentType} data (${log.content.length} chars)`
                        }
                      </span>
                    </div>
                    {log.message && (
                      <div className="text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {log.message}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Calendar, 
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useWhatsApp } from "@/hooks/useWhatsApp"

export default function TransactionsPage() {
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
    clearError
  } = useWhatsApp()

  const [statusFilter, setStatusFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadTransactions()
  }, [currentPage, statusFilter, startDate, endDate])

  const loadTransactions = async () => {
    const options = {
      ...(statusFilter && { status: statusFilter }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      limit,
      offset: (currentPage - 1) * limit
    }
    
    await fetchTransactions(options)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadTransactions()
  }

  const handleReset = () => {
    setStatusFilter("")
    setStartDate("")
    setEndDate("")
    setSearchTerm("")
    setCurrentPage(1)
    fetchTransactions({ limit, offset: 0 })
  }

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUCCESS: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      FAILED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      CANCELLED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'subscription':
        return <Package className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              Riwayat Transaksi
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Riwayat transaksi dan pembayaran layanan WhatsApp
            </p>
          </div>
          <Button 
            onClick={loadTransactions} 
            variant="outline" 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Cari Transaksi</Label>
                <Input
                  id="search"
                  placeholder="ID atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Status</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-date">Tanggal Mulai</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">Tanggal Akhir</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={loading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Daftar Transaksi
            </CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaksi ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Memuat transaksi...
                  </p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Tidak ada transaksi yang ditemukan
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.type)}
                              <h3 className="font-semibold">{transaction.description}</h3>
                            </div>
                            {getStatusBadge(transaction.status)}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">ID:</span>
                              <span className="font-mono">{transaction.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(transaction.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Tipe:</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.type}
                              </Badge>
                            </div>
                            {transaction.packageInfo && (
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3" />
                                <span>{transaction.packageInfo.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({transaction.packageInfo.maxSessions} sessions)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.currency}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Menampilkan {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      {currentPage}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={filteredTransactions.length < limit || loading}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

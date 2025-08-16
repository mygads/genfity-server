"use client"

import { motion } from "framer-motion"
import { 
  Download,
  Printer,
  Calendar,
  Hash,
  Building,
  User,
  CreditCard,
  Package,
  Tag
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { PaymentStatus } from "@/types/checkout"

interface InvoiceProps {
  paymentData: PaymentStatus
}

export default function Invoice({ paymentData }: InvoiceProps) {
  const { payment, transaction, items, voucher, pricing } = paymentData.data

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // This would typically generate a PDF
    // For now, we'll just print
    handlePrint()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Invoice Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 mb-6 print:shadow-none print:p-4"
      >
        {/* Company Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">INVOICE</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">#{payment.id.slice(-12).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">GENFITY</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Digital Solutions Provider
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Bill To */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Bill To
            </h3>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white">Customer</p>
              <p>Payment ID: {payment.id}</p>
              <p>Transaction ID: {payment.transactionId}</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Invoice Details
            </h3>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Invoice Date:</span>
                <span>{new Date(payment.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <span>
                  {new Date(payment.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>{payment.method.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="default" className="bg-green-600">PAID</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items
          </h3>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.duration && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Duration: {item.duration}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{item.type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voucher (if applied) */}
        {voucher && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Voucher Applied: {voucher.code} - {voucher.name}
                </span>
              </div>
              <span className="font-medium text-green-600">
                -Rp {voucher.discountAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        {/* Total Section */}
        <div className="flex justify-end">
          <div className="w-80">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                </div>
                
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-Rp {pricing.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {pricing.serviceFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Service Fee:</span>
                    <span className="font-medium">Rp {pricing.serviceFee.amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Paid:</span>
                  <span className="text-green-600">Rp {payment.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800 dark:text-blue-200">Payment Information</span>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>Payment Method: {payment.method.replace(/_/g, ' ').toUpperCase()}</p>
            <p>Transaction Type: {transaction.type.replace(/_/g, ' ').toUpperCase()}</p>
            <p>Currency: {transaction.currency.toUpperCase()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Thank you for your business! This is a computer-generated invoice.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Generated on {new Date().toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </motion.div>

      {/* Action Buttons (hidden in print) */}
      <div className="flex justify-center gap-4 print:hidden">
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
      </div>
    </div>
  )
}

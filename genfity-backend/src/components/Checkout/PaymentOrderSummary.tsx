"use client"

import type React from "react"

import { ChevronDown } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import Image from "next/image"
import type { CartItem } from "@/components/Cart/CartContext"
import { CheckoutForm } from "@/types/checkout"
import { useLocale } from "next-intl"

interface PaymentOrderSummaryProps {
  groups: Record<string, {
    packages: CartItem[],
    addons: CartItem[]
  }>
  whatsappItems: CartItem[]
  ungroupedItems: CartItem[]
  regularItems: CartItem[]
  addOns: CartItem[]
  selectedItemsTotal: number
  voucherApplied: boolean
  voucherDiscount: number
  voucherData: any
}

export function PaymentOrderSummary({
  groups,
  whatsappItems,
  ungroupedItems,
  regularItems,
  addOns,
  selectedItemsTotal,
  voucherApplied,
  voucherDiscount,
  voucherData,
}: PaymentOrderSummaryProps) {
  const locale = useLocale()

  // Helper function to format price based on locale
  const formatPrice = (price: number) => {
    if (locale === "en") {
      return `$${price.toLocaleString()}`
    } else {
      return `Rp ${price.toLocaleString()}`
    }
  }

  // Helper function to get localized name
  const getLocalizedName = (item: CartItem) => {
    if (item.name_en && item.name_id) {
      return locale === "en" ? item.name_en : item.name_id
    }
    return item.name
  }

  // Helper function to get localized price
  const getLocalizedPrice = (item: CartItem) => {
    if (item.price_usd && item.price_idr) {
      return locale === "en" ? item.price_usd : item.price_idr
    }
    return item.price
  }

  // Calculate totals with localized prices
  const calculateLocalizedTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + getLocalizedPrice(item) * item.qty, 0)
  }

  const localizedTotal = calculateLocalizedTotal([
    ...Object.values(groups).flatMap(group => [...group.packages, ...group.addons]),
    ...whatsappItems,
    ...ungroupedItems
  ])

  const finalAmount = localizedTotal - voucherDiscount

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-primary/60 dark:border-gray-600 p-6 sticky top-24">
      <h2 className="text-lg font-bold mb-4">Order Summary</h2>

      <div className="max-h-[400px] overflow-y-auto mb-4 pr-2">
        {/* Grouped Items by Category */}
        {Object.entries(groups).map(([categoryName, groupItems]) => {
          const hasPackages = groupItems.packages.length > 0
          const hasAddons = groupItems.addons.length > 0

          return (
            <div key={categoryName} className="mb-6">
              {/* Category Header */}
              <div className="mb-3">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  - {categoryName}
                </h3>
                <div className="w-full h-px bg-gradient-to-r from-primary/80 dark:from-white/80 to-transparent mt-1"></div>
              </div>

              {/* Packages */}
              {hasPackages && (
                <div className="mb-3">
                  <ul className="space-y-3">
                    {groupItems.packages.map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={getLocalizedName(item)}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm truncate">{getLocalizedName(item)}</p>
                            <span className="text-sm ml-2">x{item.qty}</span>
                          </div>
                          <p className="text-primary dark:text-gray-200 text-sm mt-1">{formatPrice(getLocalizedPrice(item))}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add-ons with visual hierarchy */}
              {hasAddons && (
                <div className="ml-2 relative">
                  {/* Arrow indicator */}
                  <div className="absolute -top-2 -left-2 flex items-center">
                    <ChevronDown className="h-3 w-3 text-primary dark:text-white ml-1" />
                  </div>
                  
                  <div className="border-l-2 border-primary/20 dark:border-gray-500 pl-3">
                    <h4 className="font-medium text-xs mb-2 text-gray-600 dark:text-gray-200 flex items-center">
                      <span className="mr-2">Add-ons</span>
                      <span className="text-xs bg-primary/10 text-primary dark:bg-white px-1.5 py-0.5 rounded-full">
                        {groupItems.addons.length}
                      </span>
                    </h4>
                    <ul className="space-y-3">
                      {groupItems.addons.map((item) => (
                        <li key={item.id} className="flex gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 dark:bg-primary/20 flex-shrink-0 overflow-hidden p-1">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={getLocalizedName(item)}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-medium truncate">{getLocalizedName(item)}</p>
                              <span className="text-xs ml-2">x{item.qty}</span>
                            </div>
                            <p className="text-primary dark:text-gray-200 text-xs">{formatPrice(getLocalizedPrice(item))}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* WhatsApp Items */}
        {whatsappItems.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">WhatsApp Services</h3>
            <div className="w-full h-px bg-gradient-to-r from-green-500/30 to-transparent mb-3"></div>
            <ul className="space-y-3">
              {whatsappItems.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="h-12 w-12 rounded-md bg-green-50 dark:bg-green-600/20 flex-shrink-0 flex items-center justify-center">
                    <FaWhatsapp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">{getLocalizedName(item)}</p>
                      <span className="text-sm ml-2">x{item.qty}</span>
                    </div>
                    <p className="text-primary dark:text-gray-200 text-sm">
                      {getLocalizedPrice(item) === 0 ? "Free" : formatPrice(getLocalizedPrice(item))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ungrouped Items (Legacy items) */}
        {ungroupedItems.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Other Services</h3>
            <div className="w-full h-px bg-gradient-to-r from-gray-400/30 to-transparent mb-3"></div>
            <ul className="space-y-3">
              {ungroupedItems.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={getLocalizedName(item)}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">{getLocalizedName(item)}</p>
                      <span className="text-sm ml-2">x{item.qty}</span>
                    </div>
                    <p className="text-primary dark:text-gray-200 text-sm">
                      {getLocalizedPrice(item) === 0 ? "Free" : formatPrice(getLocalizedPrice(item))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Applied Voucher Display (Read-only) */}
      {voucherApplied && (
        <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-4 mb-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">Voucher Applied:</span>
                <span className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-sm">
                  {voucherData?.code || 'VOUCHER'}
                </span>
                {voucherData && voucherData.discountType === "percentage" && (
                  <span className="text-xs bg-green-200 dark:bg-green-700 px-1.5 py-0.5 rounded">
                    {voucherData.value}%
                  </span>
                )}
              </div>
              <span className="font-medium">-{formatPrice(voucherDiscount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-800 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
          <span>{formatPrice(localizedTotal)}</span>
        </div>

        {voucherApplied && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>
              Diskon
              {voucherData && voucherData.discountType === "percentage" && (
                <span className="text-xs ml-1">({voucherData.value}%)</span>
              )}
            </span>
            <span>-{formatPrice(voucherDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-800">
          <span>Total</span>
          <span className="text-primary dark:text-white">{formatPrice(finalAmount)}</span>
        </div>
      </div>
    </div>
  )
}

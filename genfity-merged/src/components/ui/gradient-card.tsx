"use client"

import { cn } from "@/lib/utils"
import { Check, X, ShoppingCart, ChevronDown, Crown, Plus, Minus } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import Image from "next/image"
import { FaCartPlus } from "react-icons/fa"
import { ShineBorder } from "./shine-border"
import { BorderBeam } from "./border-beam"
import { useTheme } from "next-themes"

interface GradientCardProps {
  title: string
  description?: string
  price: number
  features: { name: string; included: boolean }[]
  popular?: boolean
  className?: string
  gradientClass?: string
  children?: ReactNode
  onAction?: () => void
  onBuyNow?: () => void
  onUpdateQuantity?: (quantity: number) => void
  onRemove?: () => void
  onOpenCart?: () => void
  actionText?: string
  image?: string
  currency?: string
  cartQuantity?: number
}

export function GradientCard({
  title,
  description,
  price,
  features,
  popular = false,
  className,
  gradientClass = "from-blue-600 to-violet-600",
  children,
  onAction,
  onBuyNow,
  onUpdateQuantity,
  onRemove,
  onOpenCart,
  actionText = "Add to Cart",
  image,
  currency = "Rp",
  cartQuantity = 0,
}: GradientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const visibleFeatures = isExpanded ? features : features.slice(0, 6)
  const hasMoreFeatures = features.length > 6
  const theme = useTheme()

  const handleAddToCart = async () => {
    setIsAdding(true)
    onAction?.()
    
    // Animation duration
    setTimeout(() => {
      setIsAdding(false)
    }, 1000)
  }
  const handleBuyNow = async () => {
    setIsBuyingNow(true)
    onBuyNow?.()
    
    // Animation duration  
    setTimeout(() => {
      setIsBuyingNow(false)
    }, 1000)
  }

  const handleIncrement = () => {
    onUpdateQuantity?.(cartQuantity + 1)
  }

  const handleDecrement = () => {
    if (cartQuantity > 1) {
      onUpdateQuantity?.(cartQuantity - 1)
    } else if (cartQuantity === 1) {
      onRemove?.()
    }
  }

  return (
    <div
      className={cn(
      "relative overflow-hidden rounded-2xl border dark:bg-gray-800 hover:shadow-xl border-gray-300 dark:border-gray-800 h-full flex flex-col",
      className,
      )}
    >
      {popular && <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />}
      {popular && (
        <div className="absolute right-0 top-0 z-10 rounded-bl-lg bg-primary px-3 py-1 text-xs font-bold text-white">
          Popular
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10`}></div>

      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            {description && <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>}
          </div>
          {image && (
            <div className="ml-2 flex-shrink-0">
                <Image src={image} alt={title} width={56} height={56} className="w-14 h-14 object-cover rounded" />
            </div>
          )}
        </div>          <div className="mb-6">
          <div className="text-3xl font-bold mb-1">{currency} {price.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">One-time payment</div>
          {cartQuantity > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 py-2 px-4 bg-primary/5 dark:border-gray-600 rounded-lg border border-primary/20">
                <div className="w-2 h-2 bg-primary dark:bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary dark:text-gray-300">
                  {cartQuantity} in cart
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex-grow">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Features</h4>
          <ul className="space-y-2">
            {visibleFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                {feature.included ? (
                  <div className="w-5 h-5 bg-primary dark:bg-primary rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-800 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <X className="w-3 h-3 text-gray-800 dark:text-gray-300" />
                  </div>
                )}
                <span className={feature.included ? "" : "text-gray-400 dark:text-gray-500"}>{feature.name}</span>
              </li>
            ))}
          </ul>
          
          {hasMoreFeatures && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-sm text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-secondary/80 flex items-center transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronDown className="w-4 h-4 ml-1 rotate-180 transition-transform" />
                </>
              ) : (
                <>
                  <span>Read more ({features.length - 6} more features)</span>
                  <ChevronDown className="w-4 h-4 ml-1 transition-transform" />
                </>
              )}
            </button>
          )}
        </div>        
        {children}        
        {/* Action Buttons with Cart Quantity Support */}
        <div className="space-y-2 mt-auto">
          {cartQuantity > 0 && (
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-700 dark:text-gray-200">
                Total: {currency}{(price * cartQuantity).toLocaleString()}
              </div>
            </div>
          )}
          
          {cartQuantity === 0 ? (
            /* Buy Now (3/4) + Add to Cart Icon (1/4) */
            <div className="flex gap-2">
              {onBuyNow && (
                <button
                  onClick={handleBuyNow}
                  disabled={isAdding || isBuyingNow}
                  className={cn(
                    "flex-[3] py-3 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 transform",
                    isBuyingNow 
                      ? "bg-green-700 scale-95" 
                      : "bg-primary hover:bg-primary/90 hover:scale-105",
                    (isAdding || isBuyingNow) && "opacity-50"
                  )}
                >
                  <BorderBeam duration={10} size={80} />
                  {isBuyingNow ? "Processing..." : "Buy Now"}
                </button>

              )}
              
              {onAction && (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isBuyingNow}
                  className={cn(
                    "flex-1 py-3 text-foreground border-2 shadow border-primary dark:hover:border-primary dark:border-gray-600 rounded-md font-medium text-sm flex items-center justify-center transition-all duration-300 transform hover:bg-primary dark:hover:bg-primary hover:text-white",
                    isAdding && "bg-green-700 text-white scale-95",
                    (isAdding || isBuyingNow) && "opacity-50"
                  )}
                  title={actionText}
                >
                  <FaCartPlus className={cn("w-4 h-4 transition-transform duration-200", isAdding && "animate-bounce")} />
                </button>
              )}
            </div>
          ) : (
            /* Quantity controls when items are in cart */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecrement}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="flex-1 text-center">
                  <span className="text-lg font-semibold">{cartQuantity}</span>
                </div>
                
                <button
                  onClick={handleIncrement}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
                {/* Open Cart button when items are in cart */}
              <button
                onClick={() => {
                  onOpenCart?.()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium dark:text-white text-primary border border-primary dark:border-gray-400 hover:bg-primary dark:hover:border-primary hover:text-white transition-all duration-300"
              >
                <ShoppingCart className="h-4 w-4" />
                Open Cart
                <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

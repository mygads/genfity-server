"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Crown, ShoppingCart, Plus, Minus } from "lucide-react"
import { useState } from "react"
import { FaCartPlus } from "react-icons/fa"
import { ShineBorder } from "./shine-border"
import { useTheme } from "next-themes"

interface AddonCardProps {
    title: string
    description: string
    price: number
    image: string
    className?: string
    onAdd?: () => void
    onRemove?: () => void
    onUpdateQuantity?: (quantity: number) => void
    onBuyNow?: () => void
    onOpenCart?: () => void
    currency?: string
    popular?: boolean
    cartQuantity?: number
}

export function AddonCard({ 
    title, 
    description, 
    price, 
    image, 
    className, 
    onAdd, 
    onRemove,
    onUpdateQuantity,
    onBuyNow,
    onOpenCart,
    currency = "Rp", 
    popular = false,
    cartQuantity = 0 
}: AddonCardProps) {
    const [isAdding, setIsAdding] = useState(false)
    const theme = useTheme()

    const handleAddToCart = async () => {
        setIsAdding(true)
        onAdd?.()
        
        // Animation duration
        setTimeout(() => {
            setIsAdding(false)
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
                "group relative overflow-hidden rounded-xl border h-full flex flex-col transition-all hover:shadow-lg",
                popular 
                    ? "border-2 border-transparent bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-pink-400/20 p-0.5" 
                    : "border-gray-300 bg-white hover:border-primary/20 dark:border-gray-800 dark:bg-gray-900",
                className,
            )}
        >
            {/* Gradient border for popular cards */}
            {popular && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 p-0.5">
                    <div className="h-full w-full rounded-xl bg-white dark:bg-gray-900" />
                </div>
            )}
            
            {/* Inner card content */}
            <div className={cn(
                "relative overflow-hidden rounded-xl hover:shadow-xl hover:border-primary h-full flex flex-col",
                popular ? "bg-white dark:bg-gray-900 m-0.5" : "bg-white dark:bg-gray-800"
            )}>
                {/* Crown and Popular Badge */}
                {popular && (
                    <>
                        {/* Ornamental background elements */}
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full transform rotate-12" />
                        </div>
                        <div className="absolute top-2 left-2 w-12 h-12 opacity-5">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full" />
                        </div>
                        
                        {/* Crown icon */}
                        <div className="absolute left-3 top-3 z-20">
                            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                                <Crown className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        {popular && <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />}
                        
                        {/* Popular badge */}
                        <div className="absolute right-0 top-0 z-10 rounded-bl-lg bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-1 text-xs font-bold text-white shadow-lg">
                            Popular
                        </div>
                    </>
                )}

                <div className="p-6 flex flex-col h-full">
                    {/* Header with image and title */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">{title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                            <div className="w-14 h-14  flex items-center justify-center">
                                <Image
                                    src={image || "/placeholder.svg"}
                                    alt={title}
                                    width={40}
                                    height={40}
                                    className="w-14 h-14 object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quantity indicator */}
                    {cartQuantity > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 py-2 px-4 bg-primary/5 rounded-lg border border-primary/20 dark:border-gray-600">
                                <div className="w-2 h-2 bg-primary dark:bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-primary dark:text-gray-300">
                                    {cartQuantity} in cart
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Price and Controls */}
                    <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-2xl font-bold text-black dark:text-white">
                                {currency} {price.toLocaleString()}
                            </div>
                            {cartQuantity > 0 && (
                                <div className="text-sm text-gray-700 dark:text-gray-200">
                                    Total: {currency}{(price * cartQuantity).toLocaleString()}
                                </div>
                            )}
                        </div>                        
                        {/* Action buttons - Buy Now (3/4) and Add to Cart (1/4) */}
                        <div className="space-y-2">
                            {cartQuantity === 0 ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isAdding}
                                        className={cn(
                                            "flex-1 flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 hover:shadow-md hover:scale-105 transition-all duration-300 transform gap-2",
                                            isAdding && "bg-green-500 scale-95"
                                        )}
                                    >
                                        <FaCartPlus className={cn("h-4 w-4 transition-transform duration-300", isAdding && "animate-bounce")} />
                                        Add to Cart
                                    </button>
                                </div>
                            ) : (
                                // Quantity controls ketika sudah di cart
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDecrement}
                                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        
                                        <div className="flex-1 text-center">
                                            <span className="text-lg font-semibold">{cartQuantity}</span>
                                        </div>
                                        
                                        <button
                                            onClick={handleIncrement}
                                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>                                    
                                    {/* Open Cart button when items are in cart */}
                                    <button
                                        onClick={() => {
                                            onOpenCart?.()
                                        }}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground border border-primary dark:border-gray-400 hover:bg-primary hover:text-white dark:hover:border-gray-700 transition-all duration-300"
                                    >
                                        <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
                                        <ShoppingCart className="h-4 w-4" />
                                        Open Cart
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

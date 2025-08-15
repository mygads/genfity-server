"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  qty: number
  selected?: boolean
  category?: string
  subcategory?: string
  type?: 'package' | 'addon' | 'whatsapp'
  // Optional fields for multi-language support
  name_en?: string
  name_id?: string
  price_usd?: number
  price_idr?: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: CartItem) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleItemSelection: (productId: string, selected: boolean) => void
  selectAllItems: (selected: boolean) => void
  removeSelectedItems: () => void
  selectedItems: CartItem[]
  totalItems: number
  totalPrice: number
  selectedItemsCount: number
  selectedItemsTotal: number  // New function for Buy Now functionality
  buyNow: (product: CartItem) => void
  // Helper function to check if WhatsApp service is in cart
  isWhatsAppInCart: (productId: string) => boolean
  // Helper function to check if any WhatsApp service is in cart
  hasWhatsAppInCart: () => boolean
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  toggleItemSelection: () => {},
  selectAllItems: () => {},
  removeSelectedItems: () => {},
  selectedItems: [],
  totalItems: 0,
  totalPrice: 0,
  selectedItemsCount: 0,  selectedItemsTotal: 0,
  buyNow: () => {},
  isWhatsAppInCart: () => false,
  hasWhatsAppInCart: () => false,
})

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e)
      }
    }
  }, [])
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items, isClient])
  
  const addToCart = (product: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)
        // For WhatsApp services, check if there's already any WhatsApp service in cart
      if (product.type === 'whatsapp') {
        const hasWhatsAppService = prevItems.some(item => item.type === 'whatsapp')
        if (hasWhatsAppService && !existingItem) {
          // Remove existing WhatsApp service and add new one
          const filteredItems = prevItems.filter(item => item.type !== 'whatsapp')
          return [...filteredItems, { ...product, selected: true }]
        }
        if (existingItem) {
          // Don't allow quantity increase for existing WhatsApp services
          return prevItems
        }
      }
      
      if (existingItem) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, qty: item.qty + product.qty } : item))
      } else {
        return [...prevItems, { ...product, selected: true }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => {
      if (item.id === productId) {
        // For WhatsApp services, don't allow quantity increase beyond 1
        if (item.type === 'whatsapp' && quantity > 1) {
          return item // Keep quantity at current value (1)
        }
        return { ...item, qty: quantity }
      }
      return item
    }))
  }

  const toggleItemSelection = (productId: string, selected: boolean) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, selected } : item)))
  }

  const selectAllItems = (selected: boolean) => {
    setItems((prevItems) => prevItems.map((item) => ({ ...item, selected })))
  }

  const removeSelectedItems = () => {
    setItems((prevItems) => prevItems.filter((item) => !item.selected))
  }

  const clearCart = () => {
    setItems([])
  }

  // Buy Now functionality - clear cart and add single item, then redirect to checkout
  const buyNow = (product: CartItem) => {
    // Clear cart and add only this item
    setItems([{ ...product, selected: true }])
    
    // Redirect to checkout page
    if (typeof window !== 'undefined') {
      window.location.href = '/checkout'
    }
  }
  // Helper function to check if WhatsApp service is in cart
  const isWhatsAppInCart = (productId: string) => {
    return items.some(item => item.id === productId && item.type === 'whatsapp')
  }

  // Helper function to check if any WhatsApp service is in cart
  const hasWhatsAppInCart = () => {
    return items.some(item => item.type === 'whatsapp')
  }

  const selectedItems = items.filter((item) => item.selected)
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const selectedItemsCount = selectedItems.reduce((sum, item) => sum + item.qty, 0)
  const selectedItemsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleItemSelection,
        selectAllItems,
        removeSelectedItems,
        selectedItems,
        totalItems,
        totalPrice,
        selectedItemsCount,        selectedItemsTotal,
        buyNow,
        isWhatsAppInCart,
        hasWhatsAppInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

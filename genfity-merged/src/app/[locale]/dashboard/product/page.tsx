"use client"

import { useState, useEffect } from "react"
import { 
  ShoppingCart, 
  Check, 
  PackageIcon, 
  Zap, 
  Globe, 
  ChevronRight, 
  Crown, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Minus,
  CreditCard,
  Loader2,
  Monitor,
  Smartphone,
  Code,
  PenTool,
  TrendingUp,
  Headphones
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/Auth/AuthContext"
import { useCart } from "@/components/Cart/CartContext"
import type { CategoryFrontend, PackageFrontend, AddonFrontend, WhatsAppPackage } from "@/types/product"
import { FaWhatsapp } from "react-icons/fa"
import { GradientCard } from "@/components/ui/gradient-card"
import { AddonCard } from "@/components/ui/addon-card"
import CartSidebar from "@/components/Cart/CartSidebar"

// Category icons mapping
const categoryIcons: { [key: string]: any } = {
  "Web Development": Monitor,
  "Mobile Development": Smartphone,
  "Desktop Development": Monitor,
  development: Code,
  web: Monitor,
  mobile: Smartphone,
  desktop: Monitor,
  design: PenTool,
  marketing: TrendingUp,
  support: Headphones,
}

export default function DashboardProductPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { items: cartItems, addToCart: addToCartContext, removeFromCart, updateQuantity, selectedItems, selectedItemsTotal, isWhatsAppInCart, hasWhatsAppInCart } = useCart()
  
  // Product data state - same structure as /products page
  const [categories, setCategories] = useState<CategoryFrontend[]>([])
  const [whatsappPackages, setWhatsappPackages] = useState<WhatsAppPackage[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [currentLocale, setCurrentLocale] = useState("en")
  const [currentCurrency, setCurrentCurrency] = useState("idr")
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: string]: boolean }>({})
  const [activeTab, setActiveTab] = useState<string>("products")
  const [billingType, setBillingType] = useState<"monthly" | "yearly">("monthly")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  // Checkout state
  const [cartOpen, setCartOpen] = useState(false)

  // Load products on component mount - use direct API call
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/product')
        const catalogResponse = await response.json()
        
        console.log("Dashboard Catalog Response:", catalogResponse)
        
        if (catalogResponse && catalogResponse.success && catalogResponse.data) {
          // Handle products data
          if (catalogResponse.data.product) {
            const categoriesArray = Object.values(catalogResponse.data.product) as CategoryFrontend[]
            console.log("Dashboard Categories Array:", categoriesArray)
            setCategories(categoriesArray)
            
            // Initialize with first category and subcategory
            if (categoriesArray.length > 0) {
              setSelectedCategory(categoriesArray[0].id)
              const subcategoryKeys = Object.keys(categoriesArray[0].subcategories)
              if (subcategoryKeys.length > 0) {
                setSelectedSubcategory(subcategoryKeys[0])
              }
            }
          }

          // Handle WhatsApp packages data
          if (catalogResponse.data.whatsapp && catalogResponse.data.whatsapp.packages) {
            setWhatsappPackages(catalogResponse.data.whatsapp.packages)
          }
        }
      } catch (error) {
        console.error("Failed to load catalog data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load products. Please try again."
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Helper functions - same as /products page
  const getLocalizedName = (item: { name_en: string; name_id: string }) => {
    return currentLocale === "en" ? item.name_en : item.name_id
  }

  const getLocalizedDescription = (item: { description_en: string; description_id: string }) => {
    return currentLocale === "en" ? item.description_en : item.description_id
  }

  const getPrice = (item: { price_idr: number; price_usd: number }) => {
    return currentCurrency === "idr" ? item.price_idr : item.price_usd
  }

  const getCurrencySymbol = () => {
    return currentCurrency === "idr" ? "Rp" : "$"
  }

  const formatPrice = (priceIdr: number, priceUsd: number) => {
    if (currentCurrency === "idr") {
      return `Rp ${priceIdr.toLocaleString("id-ID")}`
    }
    return `$${priceUsd}`
  }

  const formatWhatsAppPrice = (priceMonth: number, priceYear: number, billing: "monthly" | "yearly") => {
    const price = billing === "monthly" ? priceMonth : priceYear
    if (price === 0) return "Free"
    return `Rp ${price.toLocaleString("id-ID")}/${billing === "monthly" ? "month" : "year"}`
  }

  // Get current category and subcategory data
  const currentCategory = categories.find((cat) => cat.id === selectedCategory)
  const currentSubcategory = currentCategory?.subcategories?.[selectedSubcategory]
  // Get packages and addons for current selection
  const currentPackages = currentSubcategory?.packages ? Object.values(currentSubcategory.packages) : []
  const currentAddons = currentCategory?.addons ? Object.values(currentCategory.addons) : []

  // Cart handling functions
  const handleAddToCart = (pkg: PackageFrontend) => {
    addToCartContext({
      id: pkg.id,
      name: getLocalizedName(pkg),
      price: getPrice(pkg),
      image: pkg.image,
      qty: 1,
      category: currentCategory ? getLocalizedName(currentCategory) : undefined,
      subcategory: currentSubcategory ? getLocalizedName(currentSubcategory) : undefined,
      type: 'package',
      // Store multi-language data
      name_en: pkg.name_en,
      name_id: pkg.name_id,
      price_usd: pkg.price_usd,
      price_idr: pkg.price_idr,
    })
  }
  const handleBuyNowPackage = (pkg: PackageFrontend) => {
    // Clear all items from cart first
    cartItems.forEach(item => removeFromCart(item.id))
    
    // Add only this package to cart
    handleAddToCart(pkg)
    
    // Navigate directly to checkout
    router.push('/checkout')
  }

  const handleAddAddon = (addon: AddonFrontend) => {
    addToCartContext({
      id: addon.id,
      name: getLocalizedName(addon),
      price: getPrice(addon),
      image: addon.image,
      qty: 1,
      category: currentCategory ? getLocalizedName(currentCategory) : undefined,
      subcategory: currentSubcategory ? getLocalizedName(currentSubcategory) : undefined,
      type: 'addon',
      // Store multi-language data
      name_en: addon.name_en,
      name_id: addon.name_id,
      price_usd: addon.price_usd,
      price_idr: addon.price_idr,
    })
  }
  const handleBuyNowAddon = (addon: AddonFrontend) => {
    // Add to cart first
    handleAddAddon(addon)
    // Then open cart
    setCartOpen(true)
  }

  const handleAddWhatsAppPackage = (pkg: WhatsAppPackage) => {
    const packageKey = `${pkg.id}_${billingType}`
    
    // Check if already in cart
    if (isWhatsAppInCart(packageKey)) {
      return // Don't add if already in cart
    }
    
    const price = billingType === "monthly" ? pkg.priceMonth : pkg.priceYear
    addToCartContext({
      id: packageKey,
      name: `${pkg.name} (${billingType})`,
      price: price,
      image: "/placeholder.svg",
      qty: 1,
      type: 'whatsapp',
    })
  }
  const toggleFeatures = (itemId: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const isInCart = (itemId: string, type?: "whatsapp", duration?: "month" | "year") => {
    const cartId = type === "whatsapp" ? `${itemId}_${duration}` : itemId
    return cartItems.some(item => item.id === cartId)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Products & Services</h1>
          <p className="text-muted-foreground mt-1">
            Browse our products and services, add them to your cart and checkout directly.
          </p>
        </div>
        <div className="flex items-center gap-3">          
            <Button 
            disabled={cartItems.length === 0} 
            onClick={() => setCartOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white hover:scale-105 transition-all duration-300"
            >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart ({cartItems.reduce((total, item) => total + item.qty, 0)})
            </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="gap-2">
              <PackageIcon className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <Zap className="w-4 h-4" />
              WhatsApp Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-8 py-4">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar */}
              <div className="w-full md:w-64 shrink-0">
                <div className="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-400 dark:border-gray-700 p-4 sticky top-24">
                  <h2 className="font-semibold text-lg mb-4 border-b border-gray-300 dark:border-gray-400 pb-2">Categories</h2>
                  <ul className="space-y-1">                  
                    {categories.map((category) => {
                      const IconComponent = categoryIcons[category.name_en] || categoryIcons[category.id] || Monitor
                      const isActive = selectedCategory === category.id

                      return (
                        <li key={category.id}>
                          <button
                            onClick={() => {
                              setSelectedCategory(category.id)
                              const firstSubcategoryKey = Object.keys(category.subcategories)[0]
                              if (firstSubcategoryKey) {
                                setSelectedSubcategory(firstSubcategoryKey)
                              }
                            }}
                            className={`flex items-center w-full px-3 py-2 rounded-lg text-left transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary dark:text-white dark:bg-white/10"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                            {getLocalizedName(category)}
                          </button>

                          {isActive && Object.keys(category.subcategories).length > 0 && (
                            <ul className="ml-7 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                              {Object.entries(category.subcategories).map(([key, subcategory]) => (
                                <li key={key}>
                                  <button
                                    onClick={() => setSelectedSubcategory(key)} // Use the key
                                    className={`flex items-center w-full px-3 py-1.5 rounded-md text-sm text-left transition-colors ${
                                      selectedSubcategory === key // Compare with key
                                        ? "bg-primary/10 text-primary dark:text-white dark:bg-white/10"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                                  >
                                    <ChevronRight className="w-3 h-3 mr-1" />
                                    {getLocalizedName(subcategory)}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">              
                {/* Current Category & Subcategory */}
                {currentCategory && currentSubcategory && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      {getLocalizedName(currentCategory)} - {getLocalizedName(currentSubcategory)}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-200">Select the package that best fits your needs and budget</p>
                  </div>
                )}                      
                {/* Packages */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {currentPackages.map((pkg) => {
                    const cartQuantity = cartItems.find(item => item.id === pkg.id)?.qty || 0
                    return (                      
                    <GradientCard
                        key={pkg.id}
                        title={getLocalizedName(pkg)}
                        description={getLocalizedDescription(pkg)}
                        price={getPrice(pkg)}
                        currency={getCurrencySymbol()}
                        features={pkg.features.map(feature => ({
                          name: currentLocale === "en" ? feature.name_en : feature.name_id,
                          included: feature.included
                        }))}
                        popular={pkg.popular}
                        gradientClass={pkg.bgColor}
                        image={pkg.image}
                        cartQuantity={cartQuantity}
                        onAction={() => handleAddToCart(pkg)}
                        onBuyNow={() => handleBuyNowPackage(pkg)}
                        onUpdateQuantity={(quantity) => updateQuantity(pkg.id, quantity)}                        
                        onRemove={() => removeFromCart(pkg.id)}
                        onOpenCart={() => setCartOpen(true)}
                      />
                    )
                  })}
                </div>
                
                {/* Add-ons Section */}
                {currentAddons.length > 0 && (
                  <div className="mt-16">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">Add-ons</h2>
                        <p className="text-gray-700 dark:text-gray-200">
                          Enhance your packages with these additional features
                        </p>
                      </div>
                    </div>                      
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {currentAddons.map((addon) => {
                        const cartQuantity = cartItems.find(item => item.id === addon.id)?.qty || 0
                        return (                          <AddonCard
                            key={addon.id}
                            title={getLocalizedName(addon)}
                            description={getLocalizedDescription(addon)}
                            price={getPrice(addon)}
                            currency={getCurrencySymbol()}
                            image={addon.image}
                            popular={addon.popular}
                            cartQuantity={cartQuantity}
                            onAdd={() => handleAddAddon(addon)}
                            onRemove={() => removeFromCart(addon.id)}
                            onUpdateQuantity={(quantity) => updateQuantity(addon.id, quantity)}                            onBuyNow={() => handleBuyNowAddon(addon)}
                            onOpenCart={() => setCartOpen(true)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-8 py-4">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">WhatsApp Business Services</h2>
              <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                Enhance your business communication with our WhatsApp automation and AI services.
                Choose between monthly and yearly billing options.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setBillingType("monthly")}
                  className={`px-6 py-1 rounded-md font-medium transition-colors ${
                    billingType === "monthly"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingType("yearly")}
                  className={`px-4 py-1 rounded-md font-medium transition-colors ${
                    billingType === "yearly"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Yearly
                  <Badge variant="secondary" className="ml-1 bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-100">
                    Save {whatsappPackages[0]?.yearlyDiscount || 20}%
                  </Badge>
                </button>
              </div>
            </div>          
              {/* WhatsApp Packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatsappPackages.map((pkg) => {
                const price = billingType === "monthly" ? pkg.priceMonth : pkg.priceYear
                const monthlyPrice = billingType === "yearly" ? Math.round(pkg.priceYear / 12) : pkg.priceMonth
                const isExpanded = expandedFeatures[pkg.id] || false
                const visibleFeatures = isExpanded ? pkg.features : pkg.features.slice(0, 6)
                const hasMoreFeatures = pkg.features.length > 6
                const packageKey = `${pkg.id}_${billingType}`
                const isInCartCheck = isWhatsAppInCart(packageKey)
                
                return (
                  <Card
                    key={pkg.id}
                    className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-lg dark:bg-gray-800 ${
                      pkg.recommended ? "border-primary shadow-lg ring-2 ring-primary" : "border-gray-300 dark:border-gray-800 hover:border-primary/50"
                    }`}
                  >
                    {pkg.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-white font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Crown className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        {pkg.description && (
                          <CardDescription className="mt-2 text-gray-600 dark:text-gray-300">{pkg.description}</CardDescription>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <FaWhatsapp className="w-12 h-12 text-primary dark:text-gray-200" />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <div className="">
                        <div className="flex items-baseline mb-2">
                          <span className="text-3xl font-bold">{getCurrencySymbol()}{price.toLocaleString()}</span>
                          <span className="text-gray-600 dark:text-gray-300 ml-2">
                            /{billingType === "monthly" ? "month" : "year"}
                          </span>
                        </div>
                        {billingType === "yearly" && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getCurrencySymbol()}{monthlyPrice.toLocaleString()}/month when billed annually
                          </p>
                        )}
                      </div>

                      <div className="mb-6 flex-1">
                        <h4 className="font-semibold mb-3">Features:</h4>
                        <ul className="space-y-2">
                          {visibleFeatures.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <div className="w-5 h-5 bg-primary dark:bg-primary rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {hasMoreFeatures && (
                          <button
                            onClick={() => setExpandedFeatures(prev => ({ ...prev, [pkg.id]: !prev[pkg.id] }))}
                            className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>Show less</span>
                                <ChevronDown className="w-4 h-4 ml-1 rotate-180 transition-transform" />
                              </>
                            ) : (
                              <>
                                <span>Read more ({pkg.features.length - 6} more features)</span>
                                <ChevronDown className="w-4 h-4 ml-1 transition-transform" />
                              </>
                            )}
                          </button>
                        )}
                      </div>                        
                      
                      {/* Action Button */}
                      <div className="space-y-2 mt-auto">
                        <Button
                          onClick={() => handleAddWhatsAppPackage(pkg)}
                          disabled={isInCartCheck}
                          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white hover:scale-105 transition-all duration-300"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isInCartCheck ? "Added to Cart" : "Add to Cart"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>          
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Sidebar */}
      <div className="bottom-0 right-0 w-full md:w-96 h-full">
        <CartSidebar 
          open={cartOpen} 
          onClose={() => setCartOpen(false)} 
        />
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/Cart/CartContext"
import CartSidebar from "@/components/Cart/CartSidebar"
import type { CategoryFrontend, PackageFrontend, AddonFrontend, WhatsAppPackage } from "@/types/product"
import { ChevronRight, MessageSquare, Globe, Monitor, PenTool, TrendingUp, Headphones, Check, ChevronDown, ShoppingCart, Crown, Eye } from "lucide-react"
import { GradientCard } from "@/components/ui/gradient-card"
import { AddonCard } from "@/components/ui/addon-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import { FaCartPlus, FaWhatsapp, FaWhatsappSquare } from "react-icons/fa"
import { useToast } from "@/components/ui/toast"
import { ShineBorder } from "@/components/ui/shine-border"
import { useTheme } from "next-themes"

// Category icons mapping - using English category names from API
const categoryIcons: Record<string, any> = {
  "FOOD": Monitor, // You can change this to a food/restaurant icon
  "Website Developer": Monitor,
  website: Monitor,
  design: PenTool,
  marketing: TrendingUp,
  support: Headphones,
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<CategoryFrontend[]>([])
  const [whatsappPackages, setWhatsappPackages] = useState<WhatsAppPackage[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("products")
  const [billingType, setBillingType] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(true)
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: string]: boolean }>({})
  const [addingWhatsApp, setAddingWhatsApp] = useState<{ [key: string]: boolean }>({})
  const [cartOpen, setCartOpen] = useState(false)
  const { addToCart, removeFromCart, updateQuantity, items, buyNow, isWhatsAppInCart, hasWhatsAppInCart } = useCart()
  const { addToast } = useToast()
  const locale = useLocale()
  const theme = useTheme()
  
  // Set currency based on locale
  const currency = locale === "en" ? "usd" : "idr"  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/catalog')
        const catalogResponse = await response.json()
        
        console.log("Catalog Response:", catalogResponse)
        
        if (catalogResponse && catalogResponse.success && catalogResponse.data) {
          // Handle products data
          if (catalogResponse.data.product) {
            const categoriesArray = Object.values(catalogResponse.data.product) as CategoryFrontend[]
            console.log("Categories Array:", categoriesArray)
            setCategories(categoriesArray)
            
            // Initialize with first category and subcategory
            if (categoriesArray.length > 0) {
              setSelectedCategory(categoriesArray[0].id)
              const subcategoryKeys = Object.keys(categoriesArray[0].subcategories)
              if (subcategoryKeys.length > 0) {
                setSelectedSubcategory(subcategoryKeys[0]) // Use the key instead of the ID
              }
            }
          }

          // Handle WhatsApp packages data
          if (catalogResponse.data.whatsapp && catalogResponse.data.whatsapp.packages) {
            setWhatsappPackages(catalogResponse.data.whatsapp.packages)
          }
        }
      } catch (error) {
        console.error("Error fetching catalog data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Listen for WhatsApp replacement events from cart context
  useEffect(() => {
    const handleWhatsAppReplaced = (event: CustomEvent) => {
      addToast({
        type: "warning",
        title: "WhatsApp Plan Replaced",
        description: event.detail.message,
        duration: 4000
      })
    }

    window.addEventListener('whatsapp-replaced', handleWhatsAppReplaced as EventListener)
    
    return () => {
      window.removeEventListener('whatsapp-replaced', handleWhatsAppReplaced as EventListener)
    }
  }, [addToast])

  // Helper functions to get localized content
  const getLocalizedName = (item: { name_en: string; name_id: string }) => {
    return locale === "en" ? item.name_en : item.name_id
  }

  const getLocalizedDescription = (item: { description_en: string; description_id: string }) => {
    return locale === "en" ? item.description_en : item.description_id
  }

  const getPrice = (item: { price_idr: number; price_usd: number }) => {
    return currency === "idr" ? item.price_idr : item.price_usd
  }

  const getCurrencySymbol = () => {
    return currency === "idr" ? "Rp" : "$"
  }  // Get current category and subcategory data
  const currentCategory = categories.find((cat) => cat.id === selectedCategory)
  const currentSubcategory = currentCategory?.subcategories?.[selectedSubcategory] // Use selectedSubcategory as key directly
  // Get packages and addons for current selection
  const currentPackages = currentSubcategory?.packages ? Object.values(currentSubcategory.packages) : []
  const currentAddons = currentCategory?.addons ? Object.values(currentCategory.addons) : []

  const handleAddToCart = (pkg: PackageFrontend) => {
    addToCart({
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
    buyNow({
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

  const handleAddAddon = (addon: AddonFrontend) => {
    addToCart({
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

  const handleRemoveAddon = (addonId: string) => {
    removeFromCart(addonId)
  }

  const handleUpdateAddonQuantity = (addonId: string, quantity: number) => {
    updateQuantity(addonId, quantity)
  }

  const handleBuyNowAddon = (addon: AddonFrontend) => {
    buyNow({
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
  const getAddonCartQuantity = (addonId: string) => {
    const item = items.find(item => item.id === addonId)
    return item ? item.qty : 0
  }

  const getPackageCartQuantity = (packageId: string) => {
    const item = items.find(item => item.id === packageId)
    return item ? item.qty : 0
  }

  const handleRemovePackage = (packageId: string) => {
    removeFromCart(packageId)
  }

  const handleUpdatePackageQuantity = (packageId: string, quantity: number) => {
    updateQuantity(packageId, quantity)
  }
    const handleAddWhatsAppPackage = async (pkg: WhatsAppPackage) => {
    const packageKey = `${pkg.id}_${billingType}`
    
    // Check if already in cart
    if (isWhatsAppInCart(packageKey)) {
      return // Don't add if already in cart
    }
      // Check if any WhatsApp service is in cart and show notification
    if (hasWhatsAppInCart()) {
      // Show toast notification that only one plan is allowed
      addToast({
        type: "warning",
        title: "WhatsApp Plan Replaced",
        description: "Only one WhatsApp plan can be selected. Your previous plan has been replaced with the new one.",
        duration: 4000
      })
    }
    
    setAddingWhatsApp(prev => ({ ...prev, [packageKey]: true }))
    
    const price = billingType === "monthly" ? pkg.priceMonth : pkg.priceYear
    addToCart({
      id: packageKey,
      name: `${pkg.name} (${billingType})`,
      price: price,
      image: "/placeholder.svg",
      qty: 1,
      type: 'whatsapp',
    })
    
    // Animation duration
    setTimeout(() => {
      setAddingWhatsApp(prev => ({ ...prev, [packageKey]: false }))
    }, 1000)
  }

  const handleBuyWhatsAppPackage = (pkg: WhatsAppPackage) => {
    const packageKey = `${pkg.id}_${billingType}`
    const price = billingType === "monthly" ? pkg.priceMonth : pkg.priceYear
    
    buyNow({
      id: packageKey,
      name: `${pkg.name} (${billingType})`,
      price: price,
      image: "/placeholder.svg",
      qty: 1,
      type: 'whatsapp',
    })
  }

  // if (loading) {
  //   return (
  //     <div className="container mx-auto py-24 px-4">
  //       <div className="flex justify-center items-center h-64">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto py-12 pt-36 px-4">
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-primary/80 to-primary p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Our Packages</h1>
          <p className="text-white/80 max-w-2xl">
            Choose the perfect package for your business needs. We offer a variety of services to help you grow your
            online presence and reach your goals.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {loading && (
          <div className="flex justify-center items-center h-64 py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        )}

        {!loading && (
          <>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Products & Services
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <FaWhatsapp className="h-4 w-4" />
                WhatsApp Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-8 py-8">
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
                                  setSelectedSubcategory(firstSubcategoryKey) // Use the key instead of ID
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
                      const cartQuantity = getPackageCartQuantity(pkg.id)
                      return (
                        <GradientCard
                          key={pkg.id}
                          title={getLocalizedName(pkg)}
                          description={getLocalizedDescription(pkg)}
                          price={getPrice(pkg)}
                          currency={getCurrencySymbol()}
                          features={pkg.features.map(feature => ({
                            name: locale === "en" ? feature.name_en : feature.name_id,
                            included: feature.included
                          }))}
                          popular={pkg.popular}
                          gradientClass={pkg.bgColor}
                          image={pkg.image}
                          cartQuantity={cartQuantity}
                          onAction={() => handleAddToCart(pkg)}
                          onBuyNow={() => handleBuyNowPackage(pkg)}
                          onUpdateQuantity={(quantity) => handleUpdatePackageQuantity(pkg.id, quantity)}
                          onRemove={() => handleRemovePackage(pkg.id)}
                          onOpenCart={() => setCartOpen(true)}
                        />
                      )
                    })}
                  </div>                  
                  {/* Add-ons Section */}
                  {selectedCategory && currentAddons.length > 0 && (
                    <div className="mt-16">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-1">Add-ons</h2>
                          <p className="text-gray-700 dark:text-gray-200">
                            Enhance your website with these additional features
                          </p>
                        </div>
                      </div>                  
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {currentAddons.map((addon) => {
                          const cartQuantity = getAddonCartQuantity(addon.id)
                          return (                            <AddonCard
                              key={addon.id}
                              title={getLocalizedName(addon)}
                              description={getLocalizedDescription(addon)}
                              price={getPrice(addon)}
                              currency={getCurrencySymbol()}
                              image={addon.image}
                              popular={addon.popular}
                              cartQuantity={cartQuantity}
                              onAdd={() => handleAddAddon(addon)}
                              onRemove={() => handleRemoveAddon(addon.id)}
                              onUpdateQuantity={(quantity) => handleUpdateAddonQuantity(addon.id, quantity)}
                              onBuyNow={() => handleBuyNowAddon(addon)}
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

            <TabsContent value="whatsapp" className="space-y-8 py-8">
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
                  
                  return (
                    <Card
                      key={pkg.id}
                      className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-lg dark:bg-gray-800 border-gray-300 dark:border-gray-800 hover:border-primary/50`}
                    >
                      {pkg.recommended && <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />}
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

                        {/* <div className="">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Max Sessions: <span className="font-semibold">{pkg.maxSession.toLocaleString()}</span>
                          </p>
                        </div> */}

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
                        {/* Action Buttons - Buy Now (kiri) + Add to Cart (kanan) */}
                        <div className="space-y-2 mt-auto">
                          {(() => {
                          const packageKey = `${pkg.id}_${billingType}`
                          const isInCart = isWhatsAppInCart(packageKey)
                          const isAdding = addingWhatsApp[packageKey]
                          
                          return (
                            <div className="flex gap-2">
                            {/* Buy Now Button - Kiri (3/4 width) */}
                            <Button
                              onClick={() => handleBuyWhatsAppPackage(pkg)}
                              variant="outline"
                              className="flex-[3] flex items-center justify-center gap-2 border-primary hover:bg-primary hover:text-white text-white hover:scale-105 transition-all duration-300 bg-primary"
                            >
                              Buy Now
                            </Button>                            
                            {/* Add to Cart Button - Kanan (1/4 width) */}
                            {isInCart ? (
                              <Button
                                onClick={() => setCartOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 border bg-transparent dark:border-gray-400 dark:hover:border-primary text-foreground hover:bg-primary hover:text-white transition-all duration-300 border-primary"
                              >
                                <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
                                <Eye className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleAddWhatsAppPackage(pkg)}
                                disabled={isAdding}
                                className={cn(
                                  "flex-1 flex items-center justify-center gap-2 transition-all duration-300 transform dark:border-gray-500 dark:hover:border-primary text-foreground hover:bg-primary  border-primary text-white"
                              )}
                              >
                              <FaCartPlus className={cn("w-4 h-4 transition-transform duration-200", isAdding && "animate-bounce")} />
                              </Button>
                            )}
                            
                            </div>
                          )
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </>
        )}        
      </Tabs>

      {/* Cart Sidebar */}
      <CartSidebar 
        open={cartOpen} 
        onClose={() => setCartOpen(false)} 
      />
    </div>
  )
}

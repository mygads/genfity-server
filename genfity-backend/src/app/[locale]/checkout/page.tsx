"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useCart } from "@/components/Cart/CartContext"
import { useAuth } from "@/components/Auth/AuthContext"
import { useRouter } from "next/navigation"
import { useCheckoutState } from "@/hooks/useCheckoutPersistence"
import { EmptyCart } from "@/components/Checkout/EmptyCart"
import { LoadingState } from "@/components/Checkout/LoadingState"
import { Step } from "@/components/Checkout/Step"
import { ContactInformationStep } from "@/components/Checkout/ContactInformationStep"
import { VerificationStep } from "@/components/Checkout/VerificationStep"
import { CheckoutStep } from "@/components/Checkout/CheckoutStep"
import { PaymentMethodStep } from "@/components/Checkout/PaymentMethodStep"
import { OrderSummary } from "@/components/Checkout/OrderSummary"
import { PaymentOrderSummary } from "@/components/Checkout/PaymentOrderSummary"

import { 
  // checkVoucher function will be replaced with direct fetch 
} from "@/types/checkout"
import type { 
  VoucherCheckRequest,
  VoucherCheckItem,
  VoucherCheckResponse,
  CheckoutResponse,
  PaymentCreateResponse,
} from "@/types/checkout"


export default function CheckoutPage() {
  const { user, isAuthenticated, isLoading, checkoutWithPhone, verifyCheckoutOtp, resendOtp } = useAuth()
  const { selectedItems, selectedItemsTotal } = useCart()  // Handle successful login from modal
  const handleLoginSuccess = () => {
    // After successful login, the user state will automatically update via AuthContext
    // and the form will be automatically filled with user data
    console.log("[Checkout] Login successful, form will auto-fill with user data")
  }
  // Handle checkout completion
  const handleCheckoutSuccess = (response: CheckoutResponse) => {
    setCheckoutResponse(response)
    updateStep(4) // Move to payment method selection
  }
  // Handle payment creation - redirect to payment status page
  const handlePaymentCreated = (response: PaymentCreateResponse) => {
    const paymentId = response.data.payment.id
    router.push(`/payment/status/${paymentId}`)
  }

  // Group selected items by type - similar to cart logic
  const groupedItems = () => {
    const groups: Record<string, {
      packages: typeof selectedItems,
      addons: typeof selectedItems
    }> = {}
    
    const whatsappItems: typeof selectedItems = []
    const ungroupedItems: typeof selectedItems = []
    
    selectedItems.forEach(item => {
      if (item.type === 'whatsapp') {
        whatsappItems.push(item)
      } else if (item.category && item.type) {
        const groupKey = item.category
        if (!groups[groupKey]) {
          groups[groupKey] = { packages: [], addons: [] }
        }
        
        if (item.type === 'addon') {
          groups[groupKey].addons.push(item)
        } else {
          groups[groupKey].packages.push(item)
        }
      } else {
        // Items without proper categorization (legacy items)
        ungroupedItems.push(item)
      }
    })
    
    return { groups, whatsappItems, ungroupedItems }
  }
  const { groups, whatsappItems, ungroupedItems } = groupedItems()
    // Create flattened arrays for backward compatibility with existing OrderSummary props
  const regularItems = [
    ...Object.values(groups).flatMap(group => group.packages),
    ...ungroupedItems
  ]
  const addOns = Object.values(groups).flatMap(group => group.addons)
    // Use checkout state hook
  const {
    step,
    formData,
    voucherApplied,
    voucherDiscount,
    voucherData,
    voucherError,
    updateStep,
    updateFormData,
    updateVoucherState,
  } = useCheckoutState()

  // Wrapper functions for backward compatibility with OrderSummary component
  const setVoucherApplied = useCallback((applied: boolean) => {
    updateVoucherState({ voucherApplied: applied })
  }, [updateVoucherState])

  const setVoucherDiscount = useCallback((discount: number) => {
    updateVoucherState({ voucherDiscount: discount })
  }, [updateVoucherState])
  const setVoucherData = useCallback((data: VoucherCheckResponse['data'] | null) => {
    updateVoucherState({ voucherData: data })
  }, [updateVoucherState])
  // Additional state variables (not persisted)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [checkoutResponse, setCheckoutResponse] = useState<CheckoutResponse | null>(null)
  const router = useRouter()  // Auto-skip verification step if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user && step === 2) {
      console.log("[Checkout] User authenticated, skipping to payment step")
      updateStep(3)
    }
  }, [isAuthenticated, user, step, updateStep])

  // Auto-fill form data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && (!formData.name || !formData.email || !formData.whatsapp)) {
      console.log("[Checkout] Auto-filling form with user data:", user)
      updateFormData({
        ...formData,
        name: formData.name || user.name || "",
        email: formData.email || user.email || "",
        whatsapp: formData.whatsapp || user.phone || ""
      })
    }
  }, [isAuthenticated, user, formData, updateFormData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateFormData({ ...formData, [name]: value })
  }
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement
        if (nextInput) nextInput.focus()
      }
    }
  }
  const handleSendOtp = async () => {
    if (!formData.whatsapp || !formData.name || !formData.email) {
      setError("Harap isi semua kolom wajib (nama, WhatsApp, email)")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const { error, success } = await checkoutWithPhone(formData.whatsapp, formData.name, formData.email)

      if (success) {
        setOtpSent(true)
        setSuccessMessage("Kode OTP telah dikirim ke WhatsApp Anda")
      } else if (error) {
        setError(error.message || "Gagal mengirim OTP. Silakan coba lagi.")
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.")
      console.error("Error sending OTP:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (!formData.whatsapp) {
      setError("Nomor WhatsApp tidak ditemukan")
      return
    }

    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      const { error, success } = await resendOtp(formData.whatsapp, "signup")

      if (success) {
        setOtp(["", "", "", ""]) // Reset OTP input
        setSuccessMessage("Kode OTP baru telah dikirim ke WhatsApp Anda")
      } else if (error) {
        setError(error.message || "Gagal mengirim ulang OTP. Silakan coba lagi.")
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.")
      console.error("Error resending OTP:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      const otpValue = otp.join("")
      console.log("[Checkout] Verifying OTP for phone:", formData.whatsapp)

      const result = await verifyCheckoutOtp(formData.whatsapp, otpValue)
      console.log("[Checkout] Raw OTP verification result:", result)

      const { error, success, isNewUser, user, token, passwordGenerated } = result

      console.log("[Checkout] OTP verification result:", { 
        success, 
        isNewUser, 
        hasUser: !!user, 
        hasToken: !!token, 
        passwordGenerated,
        userDetails: user ? { id: user.id, name: user.name, email: user.email } : null
      })

      if (success && user && token) {
        // Set success message based on whether user is new or existing
        if (isNewUser || passwordGenerated) {
          setSuccessMessage("Akun baru telah dibuat dan Anda telah login otomatis")
        } else {
          setSuccessMessage("Anda telah berhasil login")
        }        console.log("[Checkout] OTP verification successful, proceeding to payment step")

        // Short delay to show success message, then proceed to payment step
        setTimeout(() => {
          updateStep(3)
        }, 1500)
      } else if (error) {
        console.error("[Checkout] OTP verification error:", error)
        setError(error.message || "Kode OTP tidak valid. Silakan coba lagi.")
      } else {
        console.error("[Checkout] OTP verification failed without specific error", {
          success,
          hasUser: !!user,
          hasToken: !!token,
          result
        })
        setError("Verifikasi OTP gagal. Silakan coba lagi.")
      }
    } catch (err) {
      console.error("Error verifying OTP:", err)
      setError("Terjadi kesalahan. Silakan coba lagi.")    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApplyVoucher = async () => {
    if (!formData.voucher) {
      updateVoucherState({ voucherError: "Masukkan kode voucher terlebih dahulu" })
      return
    }

    setIsSubmitting(true)
    updateVoucherState({ voucherError: "" })

    try {
      // Prepare items for voucher check according to new API structure
      const voucherItems: VoucherCheckItem[] = []
      
      // Add regular packages as "product" type
      regularItems.forEach(item => {
        voucherItems.push({
          type: "product",
          id: item.id
        })
      })
      
      // Add addons as "addons" type
      addOns.forEach(item => {
        voucherItems.push({
          type: "addons", 
          id: item.id
        })
      })
        // Add whatsapp items as "whatsapp" type
      whatsappItems.forEach(item => {
        // Extract package ID and duration from composite ID
        // WhatsApp items have IDs like "packageId_monthly" or "packageId_yearly"
        const idParts = item.id.split('_')
        const packageId = idParts[0] // Original package ID
        const billingType = idParts[1] // "monthly" or "yearly"
          // Convert billing type to duration format expected by backend
        const duration = billingType === "yearly" ? "year" : "month"
        voucherItems.push({
          type: "whatsapp",
          id: packageId, // Use the original package ID, not the composite one
          duration: duration
        })
      })

      const voucherRequest: VoucherCheckRequest = {
        code: formData.voucher,
        currency: "idr",
        items: voucherItems
      }

      // Direct API call to check voucher
      const response = await fetch('/api/voucher/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherRequest)
      })
      
      const voucherResponse = await response.json()
      
      if (voucherResponse.success && voucherResponse.isValid && voucherResponse.data) {
        updateVoucherState({
          voucherData: voucherResponse.data.voucher,
          voucherApplied: true,
          voucherDiscount: voucherResponse.data.calculation.discountAmount,
          voucherError: ""
        })
      } else {
        updateVoucherState({
          voucherData: null,
          voucherApplied: false,
          voucherDiscount: 0,
          voucherError: "Voucher tidak valid atau sudah kadaluarsa"
        })
      }    } catch (error: unknown) {
      updateVoucherState({
        voucherData: null,
        voucherApplied: false,
        voucherDiscount: 0,
        voucherError: error instanceof Error ? error.message : "Gagal memvalidasi voucher. Silakan coba lagi."
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleNextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.name || !formData.whatsapp || !formData.email) {
        setError("Harap isi semua kolom wajib (nama, WhatsApp, email)")
        return
      }

      // If user is authenticated, skip verification step and go directly to checkout
      if (isAuthenticated) {
        updateStep(3)
      } else {
        updateStep(2)
      }
    }
  }

  if (selectedItems.length === 0) {
    return <EmptyCart />
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="container mx-auto py-36 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>        {/* Unified Progress Steps - Updated to 4 steps only */}
        <div className="flex items-center justify-between max-w-3xl mb-10">
          <Step number={1} title="Informasi" isActive={step === 1} isCompleted={step > 1} />
          <div className="h-0.5 flex-1 mx-2 bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full bg-primary"
              style={{ width: step > 1 ? "100%" : "0%", transition: "width 0.3s ease" }}
            />
          </div>

          {!isAuthenticated && (
            <>
              <Step number={2} title="Verifikasi" isActive={step === 2} isCompleted={step > 2} />
              <div className="h-0.5 flex-1 mx-2 bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full bg-primary"
                  style={{ width: step > 2 ? "100%" : "0%", transition: "width 0.3s ease" }}
                />
              </div>
            </>
          )}

          <Step 
            number={isAuthenticated ? 2 : 3} 
            title="Checkout" 
            isActive={step === 3} 
            isCompleted={step > 3} 
          />
          <div className="h-0.5 flex-1 mx-2 bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full bg-primary"
              style={{ width: step > 3 ? "100%" : "0%", transition: "width 0.3s ease" }}
            />
          </div>

          <Step 
            number={isAuthenticated ? 3 : 4} 
            title="Pilih Pembayaran" 
            isActive={step === 4} 
            isCompleted={step > 4} 
          />
        </div>
      </div>      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Checkout Steps */}
        <div className="lg:col-span-2">
          {/* Step 1: Contact Information */}
          {step === 1 && (
            <ContactInformationStep
              formData={formData}
              handleInputChange={handleInputChange}
              handleNextStep={handleNextStep}
              isAuthenticated={isAuthenticated}
              user={user}
              error={error}
              onLoginSuccess={handleLoginSuccess}
            />
          )}          {/* Step 2: WhatsApp Verification (Only for non-authenticated users) */}
          {step === 2 && !isAuthenticated && (
            <VerificationStep
              formData={formData}
              error={error}
              successMessage={successMessage}
              otpSent={otpSent}
              isSubmitting={isSubmitting}
              otp={otp}
              handleSendOtp={handleSendOtp}
              handleResendOtp={handleResendOtp}
              handleOtpChange={handleOtpChange}
              handleVerifyOtp={handleVerifyOtp}
              setStep={updateStep}
            />
          )}          {/* Step 3: Checkout */}
          {step === 3 && (
            <CheckoutStep
              isAuthenticated={isAuthenticated}
              formData={formData}
              selectedItems={selectedItems}
              whatsappItems={whatsappItems}
              regularItems={regularItems}
              addOns={addOns}
              voucherApplied={voucherApplied}
              selectedItemsTotal={selectedItemsTotal}
              voucherDiscount={voucherDiscount}
              setStep={updateStep}
              onCheckoutSuccess={handleCheckoutSuccess}
              onError={setError}
              error={error}
            />
          )}

          {/* Step 4: Payment Method Selection */}
          {step === 4 && checkoutResponse && (
            <PaymentMethodStep
              checkoutResponse={checkoutResponse}
              setStep={updateStep}
              onPaymentCreated={handlePaymentCreated}
              onError={setError}
              error={error}
            />
          )}
        </div>        {/* Right Column - Order Summary */}
        <div>
          {/* Show PaymentOrderSummary during payment method selection (step 4), regular OrderSummary for other steps */}
          {step === 4 ? (
            <PaymentOrderSummary
              groups={groups}
              whatsappItems={whatsappItems}
              ungroupedItems={ungroupedItems}
              regularItems={regularItems}
              addOns={addOns}
              selectedItemsTotal={selectedItemsTotal}
              voucherApplied={voucherApplied}
              voucherDiscount={voucherDiscount}
              voucherData={voucherData}
            />
          ) : (<OrderSummary
              groups={groups}
              whatsappItems={whatsappItems}
              ungroupedItems={ungroupedItems}
              regularItems={regularItems}
              addOns={addOns}
              selectedItemsTotal={selectedItemsTotal}
              formData={formData}
              handleInputChange={handleInputChange}
              voucherApplied={voucherApplied}
              voucherDiscount={voucherDiscount}
              voucherData={voucherData}
              voucherError={voucherError}
              isSubmitting={isSubmitting}
              handleApplyVoucher={handleApplyVoucher}
              setVoucherApplied={setVoucherApplied}
              setVoucherDiscount={setVoucherDiscount}
              setVoucherData={setVoucherData}
              setFormData={updateFormData}
            />
          )}
        </div>
      </div>
    </div>
  )
}

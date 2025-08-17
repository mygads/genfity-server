"use client"

import React, { useState, useRef, useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"

interface OtpInputProps {
  length?: number
  onComplete: (otp: string) => void
  onResend?: () => void
  isLoading?: boolean
  isResending?: boolean
  resendCooldown?: number
  error?: string
  disabled?: boolean
  identifier?: string
}

export function OtpInput({
  length = 4,
  onComplete,
  onResend,
  isLoading = false,
  isResending = false,
  resendCooldown = 0,
  error,
  disabled = false,
  identifier
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    if (disabled) return

    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all digits are filled
    if (newOtp.every(digit => digit !== "") && newOtp.join("").length === length) {
      onComplete(newOtp.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, length)
    
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    for (let i = 0; i < Math.min(pastedData.length, length); i++) {
      newOtp[i] = pastedData[i]
    }
    
    setOtp(newOtp)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === "")
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()

    // Call onComplete if all digits are filled
    if (newOtp.every(digit => digit !== "")) {
      onComplete(newOtp.join(""))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Enter 4-digit verification code
          {identifier && (
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sent to {identifier}
            </span>
          )}
        </label>
        
        <div className="flex justify-center gap-3">          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled || isLoading}
              className={`
                w-12 h-12 text-center text-lg font-bold border rounded-lg
                focus:ring-2 focus:ring-primary focus:border-primary
                transition-all duration-200
                ${error 
                  ? "border-red-500 bg-red-50 dark:bg-red-900/10" 
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                }
                ${disabled || isLoading 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:border-primary/50"
                }
                dark:text-white
              `}
            />
          ))}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        )}
      </div>

      {onResend && (
        <div className="flex justify-center">
          <button
            onClick={onResend}
            disabled={isResending || isLoading || resendCooldown > 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 dark:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Resend Code ({resendCooldown}s)
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Resend Code
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

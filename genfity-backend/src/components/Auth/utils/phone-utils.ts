// Format phone number to international format
export const formatPhoneNumber = (phone: string): string => {
    let formattedPhone = phone.trim()
    if (formattedPhone.startsWith("+")) {
      // Keep the '+' for UltraMsg if needed, or remove based on API spec
      // Assuming UltraMsg wants the '+'
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = "+62" + formattedPhone.substring(1) // Add '+' prefix
    } else if (formattedPhone.startsWith("62")) {
      formattedPhone = "+" + formattedPhone // Add '+' prefix if missing
    } else {
      // Assuming Indonesian numbers if no prefix
      formattedPhone = "+62" + formattedPhone // Add '+' prefix
    }
    return formattedPhone
  }
  
  // Send OTP via WhatsApp using third-party service
  export const sendWhatsAppOtp = async (phone: string): Promise<{ error: any; success: boolean; otp: string }> => {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("Generated OTP:", otp) // For debugging only, remove in production
  
    const messageBody = `Kode OTP Anda adalah: ${otp}. Jangan bagikan kode ini.` // Customize your message
  
    // Third-party WhatsApp API integration (UltraMsg in this example)
    const ultraMsgToken = "ftt8n27poay803hd" // Should be in environment variables
    const ultraMsgInstance = "instance118050" // Should be in environment variables
    const ultraMsgUrl = `https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`
  
    const myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")
  
    const raw = JSON.stringify({
      token: ultraMsgToken,
      to: phone,
      body: messageBody,
      priority: 1,
      referenceId: "",
      msgId: "",
      mentions: "",
    })
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow" as RequestRedirect,
    }
  
    try {
      const response = await fetch(ultraMsgUrl, requestOptions)
      const resultText = await response.text()
      console.log("UltraMsg API Response:", resultText)
  
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(resultText)
        } catch (e) {
          errorData = { message: response.statusText, details: resultText }
        }
        console.error("UltraMsg API error:", response.status, errorData)
        return {
          error: errorData || new Error(`API request failed with status ${response.status}`),
          success: false,
          otp: "",
        }
      }
  
      return { error: null, success: true, otp }
    } catch (error) {
      console.error("UltraMsg API call failed:", error)
      const err = error instanceof Error ? error : new Error("Unknown error during API call")
      return { error: { message: err.message, cause: err }, success: false, otp: "" }
    }
  }
  
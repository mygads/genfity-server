# Signup Page - International WhatsApp Format Update

## Overview
Updated the signup page to support international WhatsApp number formats and enhanced error handling based on the new signup API logic.

## Key Changes Made

### 1. **Phone Number Input Enhancement**
- **Label**: Changed from "Phone Number" to "WhatsApp Number"
- **Placeholder**: Updated to show international format examples:
  - English: "Enter your WhatsApp number with country code (e.g., +62812345678, +15551234567)"
  - Indonesian: "Masukkan nomor WhatsApp dengan kode negara (misal: +6281234567890, +6512345678)"
- **Helper Text**: Added support information for international numbers:
  - English: "Supports international WhatsApp numbers: +62 (Indonesia), +1 (USA), +44 (UK), +61 (Australia), etc."
  - Indonesian: "Mendukung nomor WhatsApp internasional: +62 (Indonesia), +1 (USA), +44 (UK), +61 (Australia), dll."

### 2. **Client-Side Validation**
- **International Regex**: `/^(\+\d{1,3})?[0-9\s\-\(\)]{7,15}$/`
- **Real-time Validation**: Phone input validates format as user types
- **Visual Feedback**:
  - Green border + checkmark when valid
  - Red border + error message when invalid
  - Neutral state when empty
- **Submit Button**: Disabled when phone format is invalid

### 3. **Enhanced Error Handling**
Added specific error messages for various signup scenarios:

#### New Error Messages (English):
```json
{
  "invalidPhone": "Please enter a valid WhatsApp number with country code (e.g., +62812345678)",
  "emailExists": "An account with this email already exists. Please use a different email or sign in.",
  "phoneExists": "An account with this WhatsApp number already exists. Please use a different number or sign in.",
  "userExists": "An account with this information already exists. Please sign in instead.",
  "otpExpired": "The verification code has expired. Please request a new one.",
  "verificationExpired": "The verification deadline has passed. Please register again.",
  "generalError": "Registration failed. Please check your information and try again."
}
```

#### New Error Messages (Indonesian):
```json
{
  "invalidPhone": "Harap masukkan nomor WhatsApp yang valid dengan kode negara (misal: +6281234567890)",
  "emailExists": "Akun dengan email ini sudah ada. Silakan gunakan email lain atau masuk.",
  "phoneExists": "Akun dengan nomor WhatsApp ini sudah ada. Silakan gunakan nomor lain atau masuk.",
  "userExists": "Akun dengan informasi ini sudah ada. Silakan masuk.",
  "otpExpired": "Kode verifikasi telah kedaluwarsa. Silakan minta yang baru.",
  "verificationExpired": "Batas waktu verifikasi telah habis. Silakan daftar ulang.",
  "generalError": "Pendaftaran gagal. Silakan periksa informasi Anda dan coba lagi."
}
```

### 4. **Error Code Mapping**
The signup form now handles specific error codes from the API:

```typescript
switch (result.errorCode) {
  case 'INVALID_PHONE':
    setError(t('errors.invalidPhone'))
    break
  case 'EMAIL_EXISTS':
    setError(t('errors.emailExists'))
    break
  case 'PHONE_EXISTS':
    setError(t('errors.phoneExists'))
    break
  case 'USER_EXISTS':
    setError(t('errors.userExists'))
    break
  default:
    setError(result.error?.message || result.message || t('errors.generalError'))
}
```

### 5. **OTP Verification Improvements**
- **Expired OTP Handling**: Shows specific message for expired OTP codes
- **Verification Deadline**: Auto-redirects to signup form when verification deadline passes
- **Enhanced Resend Logic**: Better error handling for resend OTP failures

### 6. **Auto-redirect on Expiration**
When verification deadline expires:
1. Shows expiration message
2. Automatically redirects back to signup form after 3 seconds
3. Clears OTP input fields

## Supported Phone Formats

### International Examples:
- **Indonesia**: `+6281234567890`, `+62 812-345-6789`
- **USA**: `+15551234567`, `+1 555-123-4567`
- **UK**: `+447700123456`, `+44 7700 123456`
- **Australia**: `+61412345678`, `+61 412 345 678`
- **Singapore**: `+6591234567`, `+65 9123 4567`

### Backward Compatibility:
- Indonesian local format `08123456789` is automatically converted to `+6281234567890`
- Existing users with local format will continue to work

## User Experience Improvements

### 1. **Visual Feedback**
- Green border and checkmark for valid phone numbers
- Red border and error message for invalid formats
- Helper text showing supported country codes

### 2. **Smart Validation**
- Client-side validation prevents unnecessary API calls
- Submit button disabled until all fields are valid
- Real-time feedback as user types

### 3. **Better Error Messages**
- Specific messages for different error scenarios
- Localized error messages in English and Indonesian
- Clear guidance on what to do when errors occur

### 4. **International Support**
- Welcomes users from any country
- Clear examples for major countries
- No limitation to Indonesian numbers only

## Testing Scenarios

### Valid Phone Formats:
```javascript
// Test cases that should pass validation
const validPhones = [
  '+6281234567890',    // Indonesia
  '+15551234567',      // USA
  '+447700123456',     // UK
  '+61412345678',      // Australia
  '+6591234567',       // Singapore
  '+1 555-123-4567',   // USA with formatting
  '+62 812-345-6789',  // Indonesia with formatting
  '08123456789'        // Indonesian local (auto-converted)
]
```

### Invalid Phone Formats:
```javascript
// Test cases that should fail validation
const invalidPhones = [
  '123',               // Too short
  '+',                 // Just plus sign
  'abcd1234567',       // Contains letters
  '+999123456789012',  // Too long
  '+1234567890123456', // Exceeds max length
]
```

## Files Modified

1. **`src/app/[locale]/signup/page.tsx`**:
   - Added international phone validation
   - Enhanced error handling with specific error codes
   - Added real-time phone format validation
   - Improved UX with visual feedback

2. **`messages/en.json`**:
   - Updated phone field labels and placeholders
   - Added new error messages for various scenarios
   - Added helper text for international support

3. **`messages/id.json`**:
   - Updated phone field labels and placeholders
   - Added Indonesian translations for new error messages
   - Added helper text in Indonesian

## Integration with Backend

The frontend now properly handles all error codes from the enhanced signup API:
- `INVALID_PHONE`: Invalid phone format
- `EMAIL_EXISTS`: Duplicate email
- `PHONE_EXISTS`: Duplicate phone number  
- `USER_EXISTS`: Duplicate user information
- `OTP_EXPIRED`: OTP code expired
- `VERIFICATION_EXPIRED`: Verification deadline passed

## Next Steps

### Optional Enhancements:
1. **Country Code Dropdown**: Add dropdown selector for common country codes
2. **Phone Format Auto-Detection**: Automatically format input based on country code
3. **SMS Cost Warning**: Show different costs for international SMS
4. **Phone Number Verification**: Visual verification of formatted number before submission

### Frontend Testing:
1. Test all supported international formats
2. Verify error message display in both languages
3. Test auto-redirect on verification expiration
4. Verify submit button disable/enable logic

The signup page now provides a much better user experience for international users while maintaining full backward compatibility with existing Indonesian users.

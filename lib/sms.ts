import AfricasTalking from 'africastalking';
import { logger } from './logger';

const apiKey = process.env.AFRICA_TALKING_API_KEY || '';
const username = process.env.AFRICA_TALKING_USERNAME || 'sandbox';

// Initialize Africa's Talking
const africasTalking = AfricasTalking({
  apiKey,
  username,
});

const sms = africasTalking.SMS;

export function formatKenyanPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If it starts with 0, replace with +254
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.slice(1);
  }
  
  // If it doesn't start with +, add +254
  if (!cleaned.startsWith('+')) {
    cleaned = '+254' + cleaned;
  }
  
  // Ensure it starts with +254
  if (!cleaned.startsWith('+254')) {
    cleaned = '+254' + cleaned.replace(/^\+/, '');
  }
  
  return cleaned;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP storage for development (use database in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export function storeOTP(phoneNumber: string, otp: string): void {
  const formattedPhone = formatKenyanPhoneNumber(phoneNumber);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(formattedPhone, { otp, expiresAt });
  logger.log(`[OTP STORED] ${formattedPhone}: ${otp} (expires in 10 minutes)`);
}

export async function verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatKenyanPhoneNumber(phoneNumber);
  
  // In development mode, accept any 6-digit OTP for testing
  if (!apiKey || apiKey === 'placeholder_api_key') {
    logger.log(`[DEV MODE] Verifying OTP for ${formattedPhone}: ${otp}`);
    
    // Check in-memory store first
    const stored = otpStore.get(formattedPhone);
    
    if (stored) {
      // Check if expired
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(formattedPhone);
        return {
          success: false,
          error: 'OTP has expired',
        };
      }
      
      // Verify OTP matches
      if (stored.otp === otp) {
        otpStore.delete(formattedPhone);
        logger.log(`[DEV MODE] OTP verified successfully for ${formattedPhone}`);
        return { success: true };
      }
    }
    
    // In dev mode, also accept any valid 6-digit number as fallback
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      logger.log(`[DEV MODE] Accepting OTP (fallback mode) for ${formattedPhone}`);
      return { success: true };
    }
    
    return {
      success: false,
      error: 'Invalid OTP',
    };
  }

  // Production mode - check stored OTP
  const stored = otpStore.get(formattedPhone);
  
  if (!stored) {
    return {
      success: false,
      error: 'OTP not found or expired',
    };
  }

  // Check if expired (10 minutes)
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(formattedPhone);
    return {
      success: false,
      error: 'OTP has expired',
    };
  }

  // Verify OTP matches
  if (stored.otp === otp) {
    otpStore.delete(formattedPhone);
    return { success: true };
  }

  return {
    success: false,
    error: 'Invalid OTP',
  };
}

export async function sendOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string; otp?: string }> {
  const formattedPhone = formatKenyanPhoneNumber(phoneNumber);
  const message = `Your Outfittr verification code is: ${otp}. Valid for 10 minutes.`;

  // In development or if credentials are not set, just log and return success
  if (!apiKey || apiKey === 'placeholder_api_key' || username === 'sandbox') {
    console.log(`[DEV MODE] Would send SMS to ${formattedPhone}: ${message}`);
    
    // Store OTP for verification
    storeOTP(formattedPhone, otp);
    
    return {
      success: true,
      messageId: 'dev-' + Date.now(),
      otp: otp, // Return OTP in development for testing
    };
  }

  try {
    const result = await sms.send({
      to: [formattedPhone],
      message,
      from: 'Outfittr',
    });

    if (result.SMSMessageData.Recipients[0].status === 'Success') {
      return {
        success: true,
        messageId: result.SMSMessageData.Recipients[0].messageId,
      };
    } else {
      return {
        success: false,
        error: 'Failed to send SMS',
      };
    }
  } catch (error: any) {
    logger.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
    };
  }
}

export async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedPhone = formatKenyanPhoneNumber(phoneNumber);

  // In development or if credentials are not set, just log and return success
  if (!apiKey || apiKey === 'placeholder_api_key' || username === 'sandbox') {
    logger.log(`[DEV MODE] Would send SMS to ${formattedPhone}: ${message}`);
    return {
      success: true,
      messageId: 'dev-' + Date.now(),
    };
  }

  try {
    const result = await sms.send({
      to: [formattedPhone],
      message,
      from: 'Outfittr',
    });

    if (result.SMSMessageData.Recipients[0].status === 'Success') {
      return {
        success: true,
        messageId: result.SMSMessageData.Recipients[0].messageId,
      };
    } else {
      return {
        success: false,
        error: 'Failed to send SMS',
      };
    }
  } catch (error: any) {
    logger.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}


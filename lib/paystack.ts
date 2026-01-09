/**
 * Paystack API Integration
 * Handles both M-Pesa (mobile money) and card payments in Kenya
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// =============================================
// TYPES
// =============================================

export interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackChargeResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    status: 'success' | 'pending' | 'failed' | 'abandoned';
    display_text?: string;
    gateway_response?: string;
  };
}

export interface PaystackTransactionResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    reference: string;
    amount: number; // In kobo/cents
    currency: string;
    status: 'success' | 'pending' | 'failed' | 'abandoned' | 'reversed';
    gateway_response: string;
    channel: string; // 'card', 'mobile_money', 'bank', etc.
    customer: {
      id: number;
      email: string;
      customer_code: string;
      phone?: string;
    };
    metadata?: Record<string, unknown>;
    paid_at?: string;
    created_at: string;
  };
}

export interface PaystackSubscriptionResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    subscription_code: string;
    email_token: string;
    status: 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled';
    next_payment_date: string;
    plan: {
      id: number;
      plan_code: string;
      name: string;
      amount: number;
    };
    customer: {
      id: number;
      customer_code: string;
      email: string;
    };
  };
}

export interface PaystackPlan {
  id: number;
  plan_code: string;
  name: string;
  amount: number;
  interval: 'monthly' | 'yearly' | 'weekly' | 'daily';
  currency: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function paystackRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Paystack API error:', data);
    throw new Error(data.message || 'Paystack API request failed');
  }

  return data as T;
}

/**
 * Format phone number for Kenyan M-Pesa
 * Converts various formats to 254XXXXXXXXX
 */
export function formatKenyanPhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate unique reference for transactions
 */
export function generateReference(prefix: string = 'outfittr'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

// =============================================
// TRANSACTION INITIALIZATION
// =============================================

/**
 * Initialize a payment transaction
 * Works for both card and mobile money (M-Pesa)
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // In KES (will be converted to cents)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: ('card' | 'mobile_money' | 'bank')[];
}): Promise<PaystackInitializeResponse> {
  const reference = params.reference || generateReference();
  
  return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', 'POST', {
    email: params.email,
    amount: Math.round(params.amount * 100), // Convert to cents
    currency: 'KES',
    reference,
    callback_url: params.callback_url,
    metadata: params.metadata,
    channels: params.channels || ['card', 'mobile_money'],
  });
}

/**
 * Charge mobile money (M-Pesa) directly via STK Push
 */
export async function chargeMobileMoney(params: {
  email: string;
  amount: number; // In KES
  phone: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackChargeResponse> {
  const reference = params.reference || generateReference();
  const phone = formatKenyanPhone(params.phone);
  
  return paystackRequest<PaystackChargeResponse>('/charge', 'POST', {
    email: params.email,
    amount: Math.round(params.amount * 100), // Convert to cents
    currency: 'KES',
    mobile_money: {
      phone,
      provider: 'mpesa',
    },
    reference,
    metadata: params.metadata,
  });
}

/**
 * Submit OTP/PIN for mobile money charge (if required)
 */
export async function submitOTP(params: {
  reference: string;
  otp: string;
}): Promise<PaystackChargeResponse> {
  return paystackRequest<PaystackChargeResponse>('/charge/submit_otp', 'POST', {
    reference: params.reference,
    otp: params.otp,
  });
}

// =============================================
// TRANSACTION VERIFICATION
// =============================================

/**
 * Verify a transaction by reference
 */
export async function verifyTransaction(reference: string): Promise<PaystackTransactionResponse> {
  return paystackRequest<PaystackTransactionResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// =============================================
// SUBSCRIPTIONS
// =============================================

/**
 * Create a subscription plan (do this once in dashboard or via API)
 */
export async function createPlan(params: {
  name: string;
  amount: number; // In KES
  interval: 'monthly' | 'yearly' | 'weekly';
  description?: string;
}): Promise<{ status: boolean; data?: PaystackPlan }> {
  return paystackRequest('/plan', 'POST', {
    name: params.name,
    amount: Math.round(params.amount * 100),
    interval: params.interval,
    currency: 'KES',
    description: params.description,
  });
}

/**
 * Get all plans
 */
export async function listPlans(): Promise<{ status: boolean; data?: PaystackPlan[] }> {
  return paystackRequest('/plan');
}

/**
 * Initialize a subscription checkout
 * Customer will be redirected to Paystack to complete payment
 */
export async function initializeSubscription(params: {
  email: string;
  plan_code: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResponse> {
  return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', 'POST', {
    email: params.email,
    plan: params.plan_code,
    currency: 'KES',
    callback_url: params.callback_url,
    metadata: params.metadata,
    channels: ['card', 'mobile_money'],
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionIdOrCode: string): Promise<PaystackSubscriptionResponse> {
  return paystackRequest<PaystackSubscriptionResponse>(`/subscription/${encodeURIComponent(subscriptionIdOrCode)}`);
}

/**
 * Cancel/disable a subscription
 */
export async function cancelSubscription(params: {
  code: string;
  token: string;
}): Promise<{ status: boolean; message: string }> {
  return paystackRequest('/subscription/disable', 'POST', {
    code: params.code,
    token: params.token,
  });
}

/**
 * Enable a cancelled subscription
 */
export async function enableSubscription(params: {
  code: string;
  token: string;
}): Promise<{ status: boolean; message: string }> {
  return paystackRequest('/subscription/enable', 'POST', {
    code: params.code,
    token: params.token,
  });
}

/**
 * Generate a link to manage subscription (update card, cancel, etc.)
 */
export async function getSubscriptionManageLink(subscriptionCode: string): Promise<{ status: boolean; data?: { link: string } }> {
  return paystackRequest(`/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`);
}

// =============================================
// CUSTOMERS
// =============================================

/**
 * Create or get a customer
 */
export async function createCustomer(params: {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ status: boolean; data?: PaystackCustomer }> {
  return paystackRequest('/customer', 'POST', {
    email: params.email,
    first_name: params.first_name,
    last_name: params.last_name,
    phone: params.phone ? formatKenyanPhone(params.phone) : undefined,
    metadata: params.metadata,
  });
}

/**
 * Get customer by email or customer code
 */
export async function getCustomer(emailOrCode: string): Promise<{ status: boolean; data?: PaystackCustomer }> {
  return paystackRequest(`/customer/${encodeURIComponent(emailOrCode)}`);
}

// =============================================
// WEBHOOK VERIFICATION
// =============================================

import crypto from 'crypto';

/**
 * Verify Paystack webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = PAYSTACK_SECRET_KEY || ''
): boolean {
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// =============================================
// EXPORTS
// =============================================

export const paystack = {
  initializeTransaction,
  chargeMobileMoney,
  submitOTP,
  verifyTransaction,
  createPlan,
  listPlans,
  initializeSubscription,
  getSubscription,
  cancelSubscription,
  enableSubscription,
  getSubscriptionManageLink,
  createCustomer,
  getCustomer,
  verifyWebhookSignature,
  generateReference,
  formatKenyanPhone,
};

export default paystack;


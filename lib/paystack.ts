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
// SUBACCOUNTS (for seller split payments)
// =============================================

export interface PaystackSubaccountResponse {
  status: boolean;
  message: string;
  data?: {
    business_name: string;
    account_number: string;
    percentage_charge: number;
    settlement_bank: string;
    currency: string;
    bank: number;
    integration: number;
    domain: string;
    account_name: string;
    subaccount_code: string;
    is_verified: boolean;
    settlement_schedule: string;
    active: boolean;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface PaystackBankListResponse {
  status: boolean;
  message: string;
  data?: Array<{
    name: string;
    slug: string;
    code: string;
    country: string;
    currency: string;
    type: string;
    active: boolean;
  }>;
}

/**
 * Create a Paystack subaccount for a seller
 * The subaccount receives 95% of each transaction (percentage_charge = 5 means 5% to platform)
 */
export async function createSubaccount(params: {
  business_name: string;
  bank_code: string;
  account_number: string;
  percentage_charge?: number; // Platform's percentage (default 5%)
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackSubaccountResponse> {
  return paystackRequest<PaystackSubaccountResponse>('/subaccount', 'POST', {
    business_name: params.business_name,
    bank_code: params.bank_code,
    account_number: params.account_number,
    percentage_charge: params.percentage_charge ?? 5, // 5% to platform by default
    primary_contact_email: params.primary_contact_email,
    primary_contact_name: params.primary_contact_name,
    primary_contact_phone: params.primary_contact_phone
      ? formatKenyanPhone(params.primary_contact_phone)
      : undefined,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
  });
}

/**
 * Get a Paystack subaccount by code
 */
export async function getSubaccount(idOrCode: string): Promise<PaystackSubaccountResponse> {
  return paystackRequest<PaystackSubaccountResponse>(`/subaccount/${encodeURIComponent(idOrCode)}`);
}

/**
 * Update a Paystack subaccount
 */
export async function updateSubaccount(
  idOrCode: string,
  params: {
    business_name?: string;
    bank_code?: string;
    account_number?: string;
    percentage_charge?: number;
    primary_contact_email?: string;
    primary_contact_name?: string;
    primary_contact_phone?: string;
  }
): Promise<PaystackSubaccountResponse> {
  return paystackRequest<PaystackSubaccountResponse>(
    `/subaccount/${encodeURIComponent(idOrCode)}`,
    'PUT',
    params
  );
}

/**
 * List Kenyan banks supported by Paystack
 */
export async function listBanks(country: string = 'kenya'): Promise<PaystackBankListResponse> {
  return paystackRequest<PaystackBankListResponse>(`/bank?country=${encodeURIComponent(country)}`);
}

// =============================================
// TRANSACTION INITIALIZATION
// =============================================

/**
 * Initialize a payment transaction
 * Works for both card and mobile money (M-Pesa)
 * Supports split payments via subaccount parameter
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // In KES (will be converted to cents)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: ('card' | 'mobile_money' | 'bank')[];
  // Split payment params
  subaccount?: string; // Subaccount code for split payment
  bearer?: 'account' | 'subaccount' | 'all' | 'all-proportional';
  transaction_charge?: number; // Flat fee override in kobo (optional)
}): Promise<PaystackInitializeResponse> {
  const reference = params.reference || generateReference();

  const body: Record<string, unknown> = {
    email: params.email,
    amount: Math.round(params.amount * 100), // Convert to cents
    currency: 'KES',
    reference,
    callback_url: params.callback_url,
    metadata: params.metadata,
    channels: params.channels || ['card', 'mobile_money'],
  };

  // Add split payment config if subaccount is provided
  if (params.subaccount) {
    body.subaccount = params.subaccount;
    body.bearer = params.bearer || 'subaccount'; // Seller bears Paystack fees by default
    if (params.transaction_charge !== undefined) {
      body.transaction_charge = params.transaction_charge;
    }
  }

  return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', 'POST', body);
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
  // Transactions
  initializeTransaction,
  chargeMobileMoney,
  submitOTP,
  verifyTransaction,
  // Subaccounts (split payments)
  createSubaccount,
  getSubaccount,
  updateSubaccount,
  listBanks,
  // Subscriptions
  createPlan,
  listPlans,
  initializeSubscription,
  getSubscription,
  cancelSubscription,
  enableSubscription,
  getSubscriptionManageLink,
  // Customers
  createCustomer,
  getCustomer,
  // Verification & utils
  verifyWebhookSignature,
  generateReference,
  formatKenyanPhone,
};

export default paystack;


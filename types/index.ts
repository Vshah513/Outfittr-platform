export type ProductCategory = 
  | 'clothing'
  | 'shoes'
  | 'accessories'
  | 'bags'
  | 'beauty'
  | 'home'
  | 'electronics'
  | 'books'
  | 'sports'
  | 'vintage';

export type ProductCondition = 
  | 'brand_new'
  | 'like_new'
  | 'excellent'
  | 'good'
  | 'fair';

export type DeliveryMethod = 
  | 'shipping'
  | 'pickup'
  | 'both';

export type UserType = 'buyer' | 'seller' | 'both';

export interface Product {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  subcategory?: string;
  condition: ProductCondition;
  brand?: string;
  size?: string;
  color?: string;
  images: string[];
  location: string;
  meetup_location?: string;
  delivery_method: DeliveryMethod;
  shipping_cost?: number;
  status: 'active' | 'sold' | 'draft';
  views: number;
  view_count?: number;
  likes: number;
  created_at: string;
  updated_at: string;
  sold_at?: string;
  // Populated by API joins
  seller?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    location?: string;
    created_at?: string;
  };
  // Boost info
  is_boosted?: boolean;
  boost_type?: string;
}

export interface User {
  id: string;
  username?: string;
  phone_number?: string;
  email?: string;
  email_verified?: boolean;
  full_name: string;
  user_type: UserType;
  avatar_url?: string;
  bio?: string;
  location?: string;
  rating?: number;
  total_sales?: number;
  is_admin?: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  conversation_id: string;
  last_message: Message;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  product?: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  unread_count: number;
  created_at?: string;
  updated_at?: string;
}

// Subcategories for each main category
export const SUBCATEGORIES: Record<string, string[]> = {
  mens: ['T-Shirts', 'Shirts', 'Trousers', 'Jeans', 'Shorts', 'Jackets', 'Suits', 'Sweaters', 'Hoodies'],
  womens: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Trousers', 'Jeans', 'Jackets', 'Sweaters', 'Jumpsuits'],
  kids: ['Boys Clothing', 'Girls Clothing', 'Baby Clothing', 'School Uniforms', 'Jackets', 'Shoes'],
  sports: ['Activewear', 'Sneakers', 'Jerseys', 'Tracksuits', 'Sports Bras', 'Shorts'],
  clothing: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Suits', 'Activewear'],
  shoes: ['Sneakers', 'Heels', 'Boots', 'Sandals', 'Flats', 'Loafers', 'Sports Shoes'],
  accessories: ['Watches', 'Jewelry', 'Belts', 'Hats', 'Scarves', 'Sunglasses', 'Wallets'],
  bags: ['Handbags', 'Backpacks', 'Clutches', 'Totes', 'Crossbody', 'Duffel Bags'],
  vintage: ['70s', '80s', '90s', 'Y2K', 'Designer Vintage', 'Retro'],
};

// Marketplace tab types
export type MarketplaceTab = 'for-you' | 'following' | 'new';

// Follow relationship
export interface Follow {
  id: string;
  follower_id: string;
  seller_id: string;
  created_at: string;
}

// Response time tiers
export type ResponseTimeTier = 'fast' | 'same_day' | 'slow' | 'unknown';

// Trust metrics for sellers
export interface SellerTrustMetrics {
  phone_verified: boolean;
  email_verified: boolean;
  last_active_at: string | null;
  response_time_tier: ResponseTimeTier;
  response_time_hours: number | null;
  vouch_count: number;
  vouch_tags: VouchTagCount[];
}

// Vouch system types
export type VouchTag = 'item_as_described' | 'smooth_meetup' | 'good_communication' | 'quick_delivery';

export interface VouchTagCount {
  tag: VouchTag;
  count: number;
}

export interface Vouch {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string;
  tags: VouchTag[];
  created_at: string;
  buyer?: User;
  product?: Product;
}

export const VOUCH_TAG_LABELS: Record<VouchTag, string> = {
  item_as_described: 'Item as described',
  smooth_meetup: 'Smooth meetup',
  good_communication: 'Good communication',
  quick_delivery: 'Quick delivery',
};

// Extended seller info with trust metrics
export interface SellerProfile extends User {
  trust_metrics: SellerTrustMetrics;
  listings_count: number;
  sold_count: number;
  is_following?: boolean;
}

// Bundle system types
export type BundleStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface BundleRequest {
  id: string;
  buyer_id: string;
  seller_id: string;
  conversation_id: string;
  product_ids: string[];
  products?: Product[];
  offer_amount: number | null;
  status: BundleStatus;
  reserved_until: string | null;
  created_at: string;
}

export interface BundleItem {
  product: Product;
  added_at: string;
}

// Seller analytics types
export interface SellerAnalytics {
  overview: {
    totalEarnings: number;
    activeListings: number;
    soldItems: number;
    totalViews: number;
    averagePrice: number;
  };
  topCategories: Array<{
    name: string;
    count: number;
    earnings: number;
  }>;
  salesTrend: Array<{
    date: string;
    amount: number;
  }>;
  recentListings: Array<{
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
    views: number;
    created_at: string;
  }>;
}

// Leaderboard types
export interface LeaderboardSeller {
  seller_id: string;
  full_name: string;
  avatar_url?: string;
  location?: string;
  items_sold?: number;
  total_views?: number;
  follower_count: number;
  rating?: number;
  rank_position: number;
}

export interface LeaderboardData {
  topBySales: LeaderboardSeller[];
  topByViews: LeaderboardSeller[];
  month: string; // Current month name
  year: number;
}

// =============================================
// BLOG TYPES
// =============================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author_id: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_user_post: boolean;
  user_post_author_id?: string;
}

// =============================================
// MONETIZATION TYPES
// =============================================

// Subscription tiers
export type SubscriptionTierId = 'free' | 'base' | 'growth' | 'pro';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  price_kes: number;
  active_listings_limit: number | null; // null = unlimited
  features: string[];
  paystack_plan_code?: string; // Paystack plan code for recurring subscriptions
}

export interface SellerPlan {
  seller_id: string;
  tier_id: SubscriptionTierId;
  tier?: SubscriptionTier;
  payment_provider?: 'paystack';
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  paystack_email_token?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  is_active: boolean;
}

export interface SellerPlanWithLimits {
  tier_id: SubscriptionTierId;
  tier_name: string;
  price_kes: number;
  active_listings_limit: number | null;
  features: string[];
  current_period_end?: string;
  is_active: boolean;
  current_listings_count: number;
  can_create_listing: boolean;
}

// Boost packages
export type BoostPackageId = 'boost_24h' | 'boost_7d' | 'boost_30d';
export type BoostType = 'top_category' | 'homepage_carousel';

export interface BoostPackage {
  id: BoostPackageId;
  name: string;
  duration_hours: number;
  price_kes: number;
  boost_type: BoostType;
  description: string;
}

export interface ProductBoost {
  id: string;
  product_id: string;
  seller_id: string;
  package_id: BoostPackageId;
  boost_type: BoostType;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  payment_transaction_id?: string;
  created_at: string;
}

// Payment transactions
export type PaymentType = 'subscription' | 'boost';
export type PaymentProvider = 'paystack';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  user_id: string;
  payment_type: PaymentType;
  payment_provider: PaymentProvider;
  amount_kes: number;
  currency: string;
  status: PaymentStatus;
  paystack_reference?: string;
  paystack_transaction_id?: string;
  mpesa_receipt_number?: string;
  metadata?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Subscription tier constants
export const SUBSCRIPTION_TIERS: Record<SubscriptionTierId, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price_kes: 0,
    active_listings_limit: 7,
    features: ['Basic selling', 'Up to 7 active listings'],
  },
  base: {
    id: 'base',
    name: 'Base',
    price_kes: 400,
    active_listings_limit: 40,
    features: ['Up to 40 active listings', 'Basic analytics', 'Priority in search'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price_kes: 1000,
    active_listings_limit: 100,
    features: [
      'Up to 100 active listings',
      'Advanced analytics',
      'Bulk upload tools',
      'Auto-relist',
      'Trending badge eligibility',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price_kes: 4000,
    active_listings_limit: null,
    features: [
      'Unlimited listings',
      'Priority support',
      'Featured seller badge',
      'Demand insights dashboard',
      'All Growth features',
    ],
  },
};

// Boost package constants
export const BOOST_PACKAGES: Record<BoostPackageId, BoostPackage> = {
  boost_24h: {
    id: 'boost_24h',
    name: 'Quick Boost',
    duration_hours: 24,
    price_kes: 50,
    boost_type: 'top_category',
    description: 'Your listing appears at the top of its category for 24 hours',
  },
  boost_7d: {
    id: 'boost_7d',
    name: 'Weekly Boost',
    duration_hours: 168,
    price_kes: 200,
    boost_type: 'top_category',
    description: 'Your listing appears at the top of its category for 7 days',
  },
  boost_30d: {
    id: 'boost_30d',
    name: 'Featured',
    duration_hours: 720,
    price_kes: 600,
    boost_type: 'homepage_carousel',
    description: 'Premium visibility: Homepage carousel + top of category for 30 days',
  },
};


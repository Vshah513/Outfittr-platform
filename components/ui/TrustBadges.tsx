'use client';

import { SellerTrustMetrics, ResponseTimeTier, VouchTagCount, VOUCH_TAG_LABELS } from '@/types';

interface TrustBadgesProps {
  metrics: SellerTrustMetrics;
  variant?: 'compact' | 'full';
  className?: string;
}

// Helper to format last active time
function formatLastActive(lastActiveAt: string | null): string {
  if (!lastActiveAt) return 'Unknown';
  
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Active now';
  if (diffHours < 24) return 'Active today';
  if (diffDays < 7) return 'Active this week';
  if (diffDays < 30) return 'Active this month';
  return 'Not recently active';
}

// Helper to get response time label
function getResponseTimeLabel(tier: ResponseTimeTier, hours: number | null): string {
  switch (tier) {
    case 'fast':
      return 'Fast replies';
    case 'same_day':
      return 'Replies same day';
    case 'slow':
      return hours ? `Usually replies in ${Math.ceil(hours / 24)} days` : 'Slow to reply';
    default:
      return '';
  }
}

// Helper to get activity status color
function getActivityColor(lastActiveAt: string | null): string {
  if (!lastActiveAt) return 'text-gray-400';
  
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 24) return 'text-emerald-500';
  if (diffHours < 168) return 'text-amber-500'; // 7 days
  return 'text-gray-400';
}

export default function TrustBadges({ metrics, variant = 'full', className = '' }: TrustBadgesProps) {
  const isCompact = variant === 'compact';
  
  if (isCompact) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {metrics.phone_verified && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Phone
          </span>
        )}
        {metrics.email_verified && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Email
          </span>
        )}
        {metrics.response_time_tier !== 'unknown' && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            metrics.response_time_tier === 'fast' 
              ? 'text-blue-600 bg-blue-50' 
              : metrics.response_time_tier === 'same_day'
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-600 bg-gray-100'
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {getResponseTimeLabel(metrics.response_time_tier, metrics.response_time_hours)}
          </span>
        )}
        {metrics.vouch_count > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {metrics.vouch_count} {metrics.vouch_count === 1 ? 'vouch' : 'vouches'}
          </span>
        )}
      </div>
    );
  }

  // Full variant - more detailed display
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Verification Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</h4>
        <div className="flex flex-wrap gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
            metrics.phone_verified ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              metrics.phone_verified ? 'bg-emerald-500' : 'bg-gray-300'
            }`}>
              {metrics.phone_verified ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-medium ${metrics.phone_verified ? 'text-emerald-700' : 'text-gray-500'}`}>
              Phone {metrics.phone_verified ? 'verified' : 'not verified'}
            </span>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
            metrics.email_verified ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              metrics.email_verified ? 'bg-emerald-500' : 'bg-gray-300'
            }`}>
              {metrics.email_verified ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-medium ${metrics.email_verified ? 'text-emerald-700' : 'text-gray-500'}`}>
              Email {metrics.email_verified ? 'verified' : 'not verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</h4>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
            <div className={`w-2 h-2 rounded-full ${getActivityColor(metrics.last_active_at)}`} />
            <span className="text-sm text-gray-700">{formatLastActive(metrics.last_active_at)}</span>
          </div>
          
          {metrics.response_time_tier !== 'unknown' && (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
              metrics.response_time_tier === 'fast'
                ? 'border-blue-200 bg-blue-50'
                : metrics.response_time_tier === 'same_day'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 bg-gray-50'
            }`}>
              <svg className={`w-4 h-4 ${
                metrics.response_time_tier === 'fast'
                  ? 'text-blue-500'
                  : metrics.response_time_tier === 'same_day'
                    ? 'text-amber-500'
                    : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-gray-700">
                {getResponseTimeLabel(metrics.response_time_tier, metrics.response_time_hours)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Vouches Section */}
      {metrics.vouch_count > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Vouched by {metrics.vouch_count} {metrics.vouch_count === 1 ? 'buyer' : 'buyers'}
          </h4>
          {metrics.vouch_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metrics.vouch_tags.map(({ tag, count }) => (
                <div 
                  key={tag} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100"
                >
                  <span className="text-sm text-purple-700">{VOUCH_TAG_LABELS[tag]}</span>
                  <span className="text-xs text-purple-500 font-medium">×{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline badges for use in cards
export function TrustBadgesInline({ metrics }: { metrics: SellerTrustMetrics }) {
  const badges: React.ReactNode[] = [];
  
  if (metrics.phone_verified) {
    badges.push(
      <span key="phone" className="text-emerald-600" title="Phone verified">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  
  if (metrics.response_time_tier === 'fast') {
    badges.push(
      <span key="fast" className="text-blue-500" title="Fast replies">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </span>
    );
  }
  
  if (metrics.vouch_count > 0) {
    badges.push(
      <span key="vouches" className="text-purple-500 text-[10px] font-medium" title={`${metrics.vouch_count} vouches`}>
        {metrics.vouch_count}★
      </span>
    );
  }
  
  if (badges.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1">
      {badges}
    </div>
  );
}



'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  variant?: 'default' | 'following' | 'search' | 'filters';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  isLoggedIn?: boolean;
}

export default function EmptyState({
  variant = 'default',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  isLoggedIn = false,
}: EmptyStateProps) {
  // Default content based on variant
  const content = {
    default: {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'No finds yet',
      description: 'New items are added daily. Check back soon or widen your search.',
      actionLabel: 'Browse all items',
      actionHref: '/marketplace',
    },
    following: {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: isLoggedIn ? 'Build your trusted feed' : 'Sign in to follow sellers',
      description: isLoggedIn 
        ? 'Follow sellers to see their new listings here. Discover unique finds from people you trust.'
        : 'Create an account to follow sellers and build your trusted shopping circle.',
      actionLabel: isLoggedIn ? 'Discover sellers' : 'Sign in',
      actionHref: isLoggedIn ? '/marketplace?tab=for-you' : '/login',
    },
    search: {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'No results found',
      description: 'Try different keywords or browse our categories.',
      actionLabel: 'Clear search',
      actionHref: '/marketplace',
    },
    filters: {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      title: 'No matches',
      description: 'Try adjusting your filters to see more results.',
      actionLabel: 'Clear filters',
      actionHref: undefined,
    },
  };

  const {
    icon,
    title: defaultTitle,
    description: defaultDescription,
    actionLabel: defaultActionLabel,
    actionHref: defaultActionHref,
  } = content[variant];

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalActionLabel = actionLabel || defaultActionLabel;
  const finalActionHref = actionHref || defaultActionHref;

  return (
    <div className="empty-state-vintage">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vintage-stone flex items-center justify-center text-vintage-muted">
        {icon}
      </div>
      
      <h3>{finalTitle}</h3>
      <p>{finalDescription}</p>
      
      {(finalActionHref || onAction) && (
        finalActionHref ? (
          <Link
            href={finalActionHref}
            className="inline-flex btn-vintage-primary"
          >
            {finalActionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="btn-vintage-primary"
          >
            {finalActionLabel}
          </button>
        )
      )}
    </div>
  );
}


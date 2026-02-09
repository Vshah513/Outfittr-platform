# Protected Routes Implementation

## Overview
This document describes the simple authentication protection system that redirects unauthenticated users to the login page and then returns them to their original destination after successful authentication.

## How It Works

### 1. Protected Pages
The following pages now require authentication:
- `/messages` - Messages page
- `/dashboard` - Seller dashboard
- `/listings/new` - Create new listing (Sell page)

**Public (no sign-in required to view):** Marketplace (`/marketplace`), product detail (`/product/[id]`), swipe discovery (home), and category pages. Sign-in is only required when the user tries to **purchase**, **save** an item, or **create a listing**.

### 2. Flow for Unauthenticated Users

**Scenario 1: User clicks "Sell" button without being logged in**
1. User clicks the "Sell" button in the navbar
2. System detects user is not authenticated
3. Auth modal opens with the return URL set to `/listings/new`
4. User signs in or creates an account
5. After successful authentication, user is automatically redirected to `/listings/new`

**Scenario 2: User clicks "Messages" button without being logged in**
1. User clicks the "Messages" button in the navbar
2. System detects user is not authenticated
3. Auth modal opens with the return URL set to `/messages`
4. User signs in or creates an account
5. After successful authentication, user is automatically redirected to `/messages`

**Scenario 3: User directly navigates to a protected page**
1. User types `/listings/new` in the browser or follows a link
2. Page loads and detects user is not authenticated
3. User is redirected to `/login?returnTo=/listings/new`
4. Login page opens the auth modal
5. After successful authentication, user is redirected to `/listings/new`

### 3. Implementation Details

#### Navbar Buttons (`components/layout/Navbar.tsx`)
```typescript
const handleSellClick = () => {
  if (!user) {
    openAuthModal('/listings/new', undefined, 'signin');
  } else {
    router.push('/listings/new');
  }
};

const handleMessagesClick = () => {
  if (!user) {
    openAuthModal('/messages', undefined, 'signin');
  } else {
    router.push('/messages');
  }
};
```

#### Protected Pages Pattern
Each protected page includes:
```typescript
const { user, isLoading: authLoading } = useAuth();

// Redirect unauthenticated users
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login?returnTo=/current-page-path');
  }
}, [user, authLoading, router]);

// Show loading state while checking auth
if (authLoading || !user) {
  return <LoadingSpinner />;
}
```

#### Auth Context (`contexts/AuthContext.tsx`)
The AuthContext already handles the redirect after successful login:
```typescript
useEffect(() => {
  if (user && returnUrl) {
    router.push(returnUrl);
    clearPendingAction();
  }
}, [user, returnUrl, router]);
```

#### Login Page (`app/(auth)/login/page.tsx`)
The login page extracts the `returnTo` parameter and passes it to the auth modal:
```typescript
const returnTo = searchParams.get('returnTo') || undefined;
openAuthModal(returnTo, undefined, 'signin');
```

## User Experience

### For Logged Out Users:
- Click "Sell" → Auth modal opens → Sign in → Automatically land on listing creation page
- Click "Messages" → Auth modal opens → Sign in → Automatically land on messages page
- Direct URL navigation → Redirect to login → Sign in → Return to original page

### For Logged In Users:
- Click "Sell" → Direct navigation to listing creation page
- Click "Messages" → Direct navigation to messages page
- No interruption in the user flow

## Benefits
1. **Simple Implementation**: No complex route guards or middleware
2. **Good UX**: Users are always returned to where they intended to go
3. **Flexible**: Easy to add more protected pages by following the same pattern
4. **Modal-Based**: Uses the existing auth modal system
5. **No Overcomplicated State**: Leverages URL parameters for simplicity

## Adding New Protected Pages
To protect a new page:

1. Add the useAuth hook and router:
```typescript
const router = useRouter();
const { user, isLoading: authLoading } = useAuth();
```

2. Add redirect effect:
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login?returnTo=/your-page-path');
  }
}, [user, authLoading, router]);
```

3. Add loading state:
```typescript
if (authLoading || !user) {
  return <LoadingSpinner />;
}
```

That's it! The auth system handles the rest.


/**
 * Session Management Utility
 * Handles session IDs for anonymous user tracking
 */

const SESSION_KEY = 'thrift_session_id';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}

/**
 * Get or create a session ID
 * Stores in localStorage for persistence across page reloads
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // If localStorage is not available, generate a temporary session ID
    console.warn('localStorage not available, using temporary session ID');
    return generateSessionId();
  }
}

/**
 * Clear the session ID (useful for testing or logout)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session ID');
    }
  }
}


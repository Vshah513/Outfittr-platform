import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return { count, isLoading };
}


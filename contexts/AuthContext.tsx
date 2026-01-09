'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/auth';
import type { User } from '@/types';

export type PendingAction = 
  | { type: 'follow'; sellerId: string }
  | { type: 'save'; productId: string }
  | { type: 'message'; sellerId: string; productId?: string }
  | { type: 'sell' }
  | { type: 'messages' };

export type ModalStep = 'initial' | 'forgot-password' | 'reset-sent' | 'success' | 'new-password';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  openAuthModal: (returnUrl?: string, pendingAction?: PendingAction, mode?: 'signin' | 'signup', initialStep?: ModalStep) => void;
  closeAuthModal: () => void;
  modalOpen: boolean;
  modalMode: 'signin' | 'signup';
  modalInitialStep?: ModalStep;
  pendingAction?: PendingAction;
  returnUrl?: string;
  refreshUser: () => Promise<void>;
  clearPendingAction: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signin');
  const [modalInitialStep, setModalInitialStep] = useState<ModalStep | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<PendingAction | undefined>(undefined);
  const [returnUrl, setReturnUrl] = useState<string | undefined>(undefined);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch user on mount
    fetchUser();

    // Listen to Supabase auth state changes
    const supabase = createSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Post-login action resumption
  useEffect(() => {
    if (user && pendingAction) {
      const executePendingAction = async () => {
        try {
          switch (pendingAction.type) {
            case 'follow':
              await fetch('/api/follows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seller_id: pendingAction.sellerId }),
              });
              console.log('Seller followed automatically after login');
              break;
            
            case 'save':
              await fetch('/api/saved-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: pendingAction.productId }),
              });
              console.log('Item saved automatically after login');
              break;
            
            case 'message':
              if (pendingAction.productId) {
                router.push(`/product/${pendingAction.productId}?openMessage=true`);
              } else {
                router.push('/messages');
              }
              break;
            
            case 'sell':
              router.push('/listings/new');
              break;
            
            case 'messages':
              router.push('/messages');
              break;
          }
        } catch (error) {
          console.error('Error executing pending action:', error);
        } finally {
          // Clear pending action after execution
          clearPendingAction();
        }
      };

      executePendingAction();
    } else if (user && returnUrl) {
      // If there's a returnUrl but no specific action, just navigate there
      router.push(returnUrl);
      clearPendingAction();
    }
  }, [user, pendingAction, returnUrl, router]);

  const openAuthModal = useCallback((
    url?: string,
    action?: PendingAction,
    mode: 'signin' | 'signup' = 'signin',
    initialStep?: ModalStep
  ) => {
    setReturnUrl(url);
    setPendingAction(action);
    setModalMode(mode);
    setModalInitialStep(initialStep);
    setModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setModalOpen(false);
    setModalInitialStep(undefined);
    // Don't clear pendingAction/returnUrl immediately - they're needed after auth
  }, []);

  const clearPendingAction = useCallback(() => {
    setPendingAction(undefined);
    setReturnUrl(undefined);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    openAuthModal,
    closeAuthModal,
    modalOpen,
    modalMode,
    modalInitialStep,
    pendingAction,
    returnUrl,
    refreshUser,
    clearPendingAction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


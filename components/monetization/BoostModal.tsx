'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { BoostPackage, BOOST_PACKAGES, BoostPackageId } from '@/types';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
  };
  packages?: BoostPackage[];
  userPhone?: string;
  onSuccess?: () => void;
}

export function BoostModal({ isOpen, onClose, product, packages, userPhone, onSuccess }: BoostModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(userPhone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (userPhone) {
      setPhoneNumber(userPhone);
    }
  }, [userPhone]);

  // Poll for payment status when pending
  useEffect(() => {
    if (!pendingReference) return;

    const interval = setInterval(async () => {
      setCheckingStatus(true);
      try {
        const response = await fetch(`/api/payments/paystack/verify?reference=${pendingReference}`);
        const data = await response.json();

        if (data.status === 'success') {
          setSuccess(true);
          setPendingReference(null);
          onSuccess?.();
        } else if (data.status === 'failed') {
          setError(data.message || 'Payment failed');
          setPendingReference(null);
        }
        // If still pending, continue polling
      } catch (err) {
        console.error('Error checking payment status:', err);
      } finally {
        setCheckingStatus(false);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (pendingReference) {
        setError('Payment verification timed out. Please check your M-Pesa messages.');
        setPendingReference(null);
      }
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pendingReference, onSuccess]);

  if (!isOpen) return null;

  const handleBoost = async () => {
    if (!selectedPackage) {
      setError('Please select a boost package');
      return;
    }

    if (!phoneNumber) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'boost',
          productId: product.id,
          boostPackageId: selectedPackage,
          phoneNumber: cleanPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      if (data.type === 'pending') {
        // M-Pesa STK push sent, start polling
        setPendingReference(data.reference);
      } else if (data.type === 'success') {
        setSuccess(true);
        onSuccess?.();
      } else if (data.type === 'redirect' && data.url) {
        // Redirect to Paystack checkout (rare for boosts)
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const displayPackages = packages && packages.length > 0 ? packages : Object.values(BOOST_PACKAGES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-xl font-bold text-white">Boost Your Listing</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/90 text-sm mt-1 truncate">
            {product.title}
          </p>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boost Activated!</h3>
            <p className="text-gray-600 mb-4">
              Your listing is now boosted and will get more visibility.
            </p>
            <Button onClick={onClose} variant="primary">
              Done
            </Button>
          </div>
        ) : pendingReference ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {checkingStatus ? (
                <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Phone</h3>
            <p className="text-gray-600 mb-4">
              Enter your M-Pesa PIN to complete the payment.
              <br />
              <span className="text-sm text-gray-500">We'll activate your boost automatically.</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
              </svg>
              Waiting for payment confirmation...
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Package Selection */}
            <div className="space-y-3 mb-6">
              {displayPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPackage === pkg.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.boost_type === 'homepage_carousel' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Best Value
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(pkg.price_kes)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pkg.duration_hours < 48 
                          ? `${pkg.duration_hours} hours`
                          : `${Math.round(pkg.duration_hours / 24)} days`
                        }
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Phone Number Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  +254
                </span>
                <input
                  type="tel"
                  value={phoneNumber.replace(/^(\+?254|0)/, '')}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="712345678"
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You'll receive an M-Pesa prompt on this number
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBoost}
                disabled={!selectedPackage || !phoneNumber || isLoading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Pay with M-Pesa'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

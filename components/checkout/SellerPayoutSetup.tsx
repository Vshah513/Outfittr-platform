'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface Bank {
  name: string;
  code: string;
  type: string;
}

interface PayoutStatus {
  isOnboarded: boolean;
  subaccountCode: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankName: string | null;
  onboardedAt: string | null;
}

export default function SellerPayoutSetup() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    bankCode: '',
    accountNumber: '',
    businessName: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [banksRes, statusRes] = await Promise.all([
        fetch('/api/sellers/banks'),
        fetch('/api/sellers/onboard'),
      ]);

      const banksData = await banksRes.json();
      const statusData = await statusRes.json();

      if (banksRes.ok && banksData.banks) {
        setBanks(banksData.banks);
      }

      if (statusRes.ok) {
        setStatus(statusData);
        if (statusData.bankCode) {
          setFormData((prev) => ({
            ...prev,
            bankCode: statusData.bankCode || '',
            accountNumber: statusData.accountNumber || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    if (!formData.bankCode || !formData.accountNumber) {
      setMessage({ type: 'error', text: 'Please select a bank and enter your account number.' });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/sellers/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Payout account ${status?.isOnboarded ? 'updated' : 'created'} successfully! Account: ${data.accountName || 'Verified'} at ${data.bankName || 'your bank'}.`,
        });
        // Refresh status
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to set up payout account.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Payout Settings</h2>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Payout Settings</h2>
          {status?.isOnboarded && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Set up your bank account to receive payments when buyers purchase your items.
          You&apos;ll automatically receive 95% of each sale.
        </p>
      </CardHeader>
      <CardContent>
        {/* Current Status */}
        {status?.isOnboarded && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Payouts are set up
            </p>
            <p className="text-sm text-green-700 mt-1">
              Bank: {status.bankName || 'Connected'} &bull; Account: {status.accountName || '****' + (status.accountNumber?.slice(-4) || '')}
            </p>
          </div>
        )}

        {/* Alert Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Select */}
          <div>
            <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700 mb-2">
              Bank
            </label>
            <select
              id="bankCode"
              value={formData.bankCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, bankCode: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              required
            >
              <option value="">Select your bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <Input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="Enter your bank account number"
              required
            />
          </div>

          {/* Business Name (optional) */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
              Business / Store Name <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
              placeholder="e.g. Jane's Fashion Store"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for your Paystack payout account. Defaults to your name.
            </p>
          </div>

          {/* Submit */}
          <Button type="submit" variant="primary" disabled={isSaving} isLoading={isSaving}>
            {isSaving
              ? 'Setting up...'
              : status?.isOnboarded
              ? 'Update Payout Details'
              : 'Set Up Payouts'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

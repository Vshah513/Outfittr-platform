import { NextRequest, NextResponse } from 'next/server';
import { paystack } from '@/lib/paystack';

/**
 * GET /api/sellers/banks
 * List banks supported by Paystack for Kenyan sellers
 * Used during seller onboarding to select their bank
 */
export async function GET(request: NextRequest) {
  try {
    const result = await paystack.listBanks('kenya');

    if (!result.status || !result.data) {
      return NextResponse.json(
        { error: result.message || 'Failed to fetch banks' },
        { status: 400 }
      );
    }

    // Filter to only active banks and sort alphabetically
    const banks = result.data
      .filter((bank) => bank.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((bank) => ({
        name: bank.name,
        code: bank.code,
        type: bank.type,
      }));

    return NextResponse.json({ banks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banks list' },
      { status: 500 }
    );
  }
}

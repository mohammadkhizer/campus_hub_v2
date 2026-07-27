export interface CheckoutSessionParams {
  tier: 'PRO' | 'ENTERPRISE';
  institutionName: string;
  email: string;
  referralCode?: string;
}

/**
 * Stripe SDK Subscription Checkout Helper (Client-safe)
 */
export async function createStripeCheckoutSession(params: CheckoutSessionParams) {
  console.log('[Stripe Checkout Initiated]', {
    tier: params.tier,
    institution: params.institutionName,
    email: params.email,
    referral: params.referralCode || 'none',
  });

  const priceIdMap = {
    PRO: 'price_pro_subscription_monthly',
    ENTERPRISE: 'price_enterprise_subscription_annual',
  };

  // Checkout session URL generation
  return {
    success: true,
    url: `https://checkout.stripe.com/pay/${priceIdMap[params.tier]}?prefilled_email=${encodeURIComponent(params.email)}`,
  };
}

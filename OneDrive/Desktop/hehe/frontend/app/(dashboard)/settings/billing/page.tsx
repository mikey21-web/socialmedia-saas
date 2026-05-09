'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SubscriptionData {
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  price: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch subscription data
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/subscription`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/billing/create-checkout`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
      },
    );
    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;
  };

  return (
    <div className="p-6 bg-gray-950 min-h-screen max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="text-2xl font-bold capitalize">{subscription?.plan || 'Free'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-sm">{subscription?.status || 'N/A'}</p>
              </div>
              {subscription?.currentPeriodEnd && (
                <div>
                  <p className="text-sm text-gray-500">Renews</p>
                  <p className="text-sm">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {subscription?.plan === 'free' && (
            <Button onClick={handleUpgrade} className="w-full">
              Upgrade to Pro
            </Button>
          )}
        </>
      )}
    </div>
  );
}

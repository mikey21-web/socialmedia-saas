'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { TrendingUp, DollarSign, CreditCard, Users } from 'lucide-react';

interface BillingMetrics {
  mrr: number;
  arr: number;
  totalSubscriptions: number;
  proSubscriptions: number;
  freeSubscriptions: number;
  churnRate: number;
  recentTransactions: Array<{
    id: string;
    email: string;
    amount: number;
    plan: string;
    status: string;
    date: string;
  }>;
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<BillingMetrics>('/api/admin/billing')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        {
          label: 'MRR',
          value: `$${(data.mrr / 100).toLocaleString()}`,
          icon: DollarSign,
          color: 'text-emerald-500',
        },
        {
          label: 'ARR',
          value: `$${(data.arr / 100).toLocaleString()}`,
          icon: TrendingUp,
          color: 'text-blue-500',
        },
        {
          label: 'Pro Subscribers',
          value: data.proSubscriptions.toLocaleString(),
          icon: CreditCard,
          color: 'text-violet-500',
        },
        {
          label: 'Total Users',
          value: (data.freeSubscriptions + data.proSubscriptions).toLocaleString(),
          icon: Users,
          color: 'text-amber-500',
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Billing & Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscription metrics and transaction history.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest subscription events.</CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.recentTransactions?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data?.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{tx.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="capitalize"
                        >
                          {tx.plan}
                        </Badge>
                        <span className="font-semibold">
                          ${(tx.amount / 100).toFixed(2)}
                        </span>
                        <Badge
                          className={
                            tx.status === 'succeeded'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }
                          variant="outline"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

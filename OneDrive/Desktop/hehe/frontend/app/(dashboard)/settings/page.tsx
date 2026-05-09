'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

const settingsSections = [
  { title: 'Profile', href: '/settings/profile', description: 'Manage your account' },
  { title: 'Billing', href: '/settings/billing', description: 'Subscription & payment' },
  { title: 'Connections', href: '/settings/connections', description: 'Platform OAuth' },
];

export default function SettingsPage() {
  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-3 gap-4">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

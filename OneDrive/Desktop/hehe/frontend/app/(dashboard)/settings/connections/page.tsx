'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PLATFORMS = [
  { id: 'x', name: 'X (Twitter)', icon: '𝕏' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'linkedin', name: 'LinkedIn', icon: '🔗' },
  { id: 'facebook', name: 'Facebook', icon: '👍' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
];

interface ConnectionStatus {
  platform: string;
  connected: boolean;
  account?: string;
  connectedAt?: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/platforms/connections`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
    })
      .then((r) => r.json())
      .then((data) => setConnections(data))
      .catch(() => {});
  }, []);

  const handleConnect = (platform: string) => {
    window.location.href = `/api/auth/oauth/${platform}`;
  };

  return (
    <div className="p-6 bg-gray-950 min-h-screen max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Platform Connections</h1>

      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const conn = connections.find((c) => c.platform === platform.id);
          return (
            <Card key={platform.id} className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6 flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">
                    {platform.icon} {platform.name}
                  </p>
                  {conn?.connected && (
                    <p className="text-sm text-gray-500">
                      Connected: {conn.account}
                    </p>
                  )}
                </div>
                <div>
                  {conn?.connected ? (
                    <Badge className="bg-green-600">Connected</Badge>
                  ) : (
                    <Button onClick={() => handleConnect(platform.id)}>
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

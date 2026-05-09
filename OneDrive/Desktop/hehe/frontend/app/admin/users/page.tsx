'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  team: string;
  plan: 'free' | 'pro';
  createdAt: string;
  lastActive: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="space-y-3">
        {loading ? (
          <div>Loading...</div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.team}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={user.plan === 'pro' ? 'bg-green-600' : 'bg-gray-600'}>
                    {user.plan}
                  </Badge>
                  <p className="text-sm text-gray-500">
                    Last active: {new Date(user.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

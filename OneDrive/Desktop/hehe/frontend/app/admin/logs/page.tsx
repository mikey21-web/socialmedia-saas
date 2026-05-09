'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AlertCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  teamId?: string;
}

const LEVEL_CONFIG: Record<
  LogLevel,
  { icon: React.ElementType; className: string; badge: string }
> = {
  error: {
    icon: AlertCircle,
    className: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  warn: {
    icon: AlertTriangle,
    className: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  info: {
    icon: Info,
    className: 'text-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  debug: {
    icon: Info,
    className: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ logs: LogEntry[] }>('/api/admin/logs');
      setLogs(r.data.logs ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered =
    filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  const counts = {
    error: logs.filter((l) => l.level === 'error').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    info: logs.filter((l) => l.level === 'info').length,
    debug: logs.filter((l) => l.level === 'debug').length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Activity Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System events, errors, and audit trail.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map((level) => {
          const cfg = LEVEL_CONFIG[level];
          return (
            <Card
              key={level}
              className={`cursor-pointer transition-all ${filter === level ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilter(filter === level ? 'all' : level)}
            >
              <CardContent className="pt-6 flex items-center gap-3">
                <cfg.icon className={`w-5 h-5 ${cfg.className}`} />
                <div>
                  <p className="text-xs text-muted-foreground capitalize">{level}</p>
                  <p className="text-xl font-bold">{counts[level]}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Log table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filter === 'all' ? 'All Logs' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Logs`}
            </CardTitle>
            {filter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                Clear filter
              </Button>
            )}
          </div>
          <CardDescription>{filtered.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No log entries.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((log) => {
                const cfg = LEVEL_CONFIG[log.level];
                return (
                  <div key={log.id} className="py-3 space-y-1">
                    <div className="flex items-start gap-3">
                      <cfg.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.className}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className={cfg.badge}>
                            {log.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          {log.userId && (
                            <span className="text-xs text-muted-foreground">
                              User: {log.userId.slice(-8)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm break-words">{log.message}</p>
                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <pre className="mt-1 text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

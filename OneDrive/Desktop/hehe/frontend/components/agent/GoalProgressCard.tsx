'use client';

import { useEffect, useState } from 'react';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getGoals, Goal } from '@/lib/agent-chat';

export function GoalProgressCard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGoals()
      .then(setGoals)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-4 space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="p-6 text-center border-dashed">
        <div className="w-10 h-10 mx-auto bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mb-3">
          <Target className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium">No active goals</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Open the Strategy Agent to set new growth goals.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold">Active Goals</h3>
      </div>
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) || 0;
          const isComplete = progress >= 100 || goal.status === 'completed';

          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate flex-1 pr-2">{goal.title}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded">
                  {goal.platform || 'All platforms'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-violet-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium w-8 text-right">
                  {progress}%
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.targetMetric.replace(/_/g, ' ')}
                </div>
                {isComplete && (
                  <div className="flex items-center gap-1 text-emerald-500 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

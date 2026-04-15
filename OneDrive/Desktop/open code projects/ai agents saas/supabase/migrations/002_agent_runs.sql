CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  CONSTRAINT agent_runs_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  CONSTRAINT agent_run_steps_run_fkey FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_runs_user_id ON agent_runs(user_id);
CREATE INDEX idx_agent_runs_agent_type ON agent_runs(agent_type);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_run_steps_run_id ON agent_run_steps(run_id);

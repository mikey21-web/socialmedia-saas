CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  prediction TEXT NOT NULL,
  actual TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT feedback_run_fkey FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  misclassification_type TEXT,
  corrected_value TEXT,
  weight_adjustment NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT learnings_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_agent_id ON feedback(agent_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_learnings_agent_id ON learnings(agent_id);

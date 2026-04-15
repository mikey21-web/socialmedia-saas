/**
 * Valid business type classifications
 */
export type BusinessTypeOption = 'real_estate' | 'ecommerce' | 'coaching' | 'manufacturing' | 'healthcare' | 'saas' | 'services' | 'unknown';

/**
 * Unified context passed to all agent executors
 */
export interface AgentExecutorContext {
  agentId: string;
  userId: string;
  runId: string;
  channel: 'api' | 'webhook' | 'test';
  fromPhone?: string;
  fromEmail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Step-level execution log
 */
export interface AgentStepLog {
  stepName: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  durationMs: number;
  output?: unknown;
  error?: string;
}

/**
 * Result returned by any agent executor
 */
export interface AgentExecutorResult {
  success: boolean;
  message: string;
  runId: string;
  data?: Record<string, unknown>;
  steps?: AgentStepLog[];
  error?: string;
}

/**
 * Agent executor function signature
 */
export type AgentExecutor = (
  userMessage: string,
  context: AgentExecutorContext
) => Promise<AgentExecutorResult>;

/**
 * Business context extracted by Context Engine
 */
export interface BusinessContext {
  businessType: BusinessTypeOption;
  industry: string;
  size: string;
  revenue?: string;
  location?: string;
  specialties?: string[];
  customContext?: Record<string, unknown>;
}

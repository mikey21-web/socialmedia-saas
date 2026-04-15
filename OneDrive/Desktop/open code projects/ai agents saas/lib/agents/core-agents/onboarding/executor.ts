import { AgentExecutor, AgentExecutorContext, AgentExecutorResult, BusinessContext } from '@/lib/agents/executor-types';
import { classifyBusinessType } from '@/lib/agents/context-engine';
import { getDomainTemplate, getSystemPrompt } from '@/lib/agents/domain-router';

export const executeOnboarding: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps = [];

  const startStep = Date.now();
  steps.push({
    stepName: 'onboarding_start',
    status: 'completed' as const,
    durationMs: Date.now() - startStep,
    output: 'Onboarding initiated'
  });

  // Extract business context from conversation
  const extractStep = Date.now();
  const classification = await classifyBusinessType(userMessage);
  const context: BusinessContext = {
    businessType: classification.businessType,
    industry: extractIndustry(userMessage),
    size: extractCompanySize(userMessage),
    location: extractLocation(userMessage)
  };
  steps.push({
    stepName: 'context_extraction',
    status: 'completed' as const,
    durationMs: Date.now() - extractStep,
    output: { businessType: context.businessType, industry: context.industry }
  });

  // Route to appropriate domain
  const routeStep = Date.now();
  const template = getDomainTemplate(context);
  steps.push({
    stepName: 'domain_routing',
    status: 'completed' as const,
    durationMs: Date.now() - routeStep,
    output: { domain: template.domain, agentWeights: template.agentWeights }
  });

  // Generate system prompt for the business
  const promptStep = Date.now();
  const systemPrompt = getSystemPrompt(context);
  steps.push({
    stepName: 'system_prompt_generation',
    status: 'completed' as const,
    durationMs: Date.now() - promptStep,
    output: { prompt: systemPrompt }
  });

  const businessName = extractBusinessName(userMessage) || 'to diyaa.ai';

  return {
    success: true,
    runId: ctx.runId,
    message: `Welcome ${businessName}! I've set up your account for a ${context.businessType} business. Ready to configure your first agent.`,
    data: {
      businessType: context.businessType,
      businessName,
      industry: context.industry,
      domain: template.domain,
      systemPrompt: systemPrompt
    },
    steps
  };
};

// Helper functions for extraction
function extractBusinessName(message: string): string | null {
  const namePatterns = [
    /I\s+(?:own|run|manage)\s+(?:a|an)\s+(?:online\s+)?(\w+(?:\s+\w+)*)/i,
    /(?:company|agency|business|firm)\s+(?:named|called)\s+(\w+(?:\s+\w+)*)/i,
    /^\s*([A-Z][\w\s]*?)(?:\s+(?:is|has|run|sell))/i,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50 && !name.match(/\d+/)) {
        return name;
      }
    }
  }
  return null;
}

function extractIndustry(message: string): string {
  const industries = ['real estate', 'ecommerce', 'coaching', 'healthcare', 'saas', 'manufacturing', 'services'];
  const lowerMessage = message.toLowerCase();
  for (const industry of industries) {
    if (lowerMessage.includes(industry)) {
      return industry;
    }
  }
  return 'unknown';
}

function extractCompanySize(message: string): string {
  const match = message.match(/\b([0-9]{1,3})\s*(staff|employees?|team members?)\b/i);
  if (match) {
    const size = parseInt(match[1]);
    if (size <= 10) return '1-10';
    if (size <= 50) return '11-50';
    if (size <= 200) return '51-200';
    if (size <= 500) return '201-500';
    return '500+';
  }
  return 'unknown';
}

function extractLocation(message: string): string | undefined {
  const locations = ['California', 'New York', 'San Francisco', 'Texas', 'Florida', 'India', 'Hyderabad', 'Dubai'];
  for (const location of locations) {
    if (message.includes(location)) {
      return location;
    }
  }
  return undefined;
}

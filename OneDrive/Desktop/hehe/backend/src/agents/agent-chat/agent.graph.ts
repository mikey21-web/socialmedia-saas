import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentService } from '../content/content.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { BrandService } from '../../brand/brand.service';
import { TrendService } from '../trend/trend.service';
import { CompetitorService } from '../competitor/competitor.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { LlmService } from '../llm/llm.service';
import { buildStrategyTools } from './tools/strategy.tools';
import { buildContentTools } from './tools/content.tools';
import { buildAnalyticsTools } from './tools/analytics.tools';
import { buildEngagementTools } from './tools/engagement.tools';
import { buildIntelligenceTools } from './tools/intelligence.tools';

export type AgentName = 'strategy' | 'content' | 'analytics' | 'engagement' | 'intelligence' | 'supervisor';

export interface AgentDeps {
  prisma: PrismaService;
  contentService: ContentService;
  analyticsService: AnalyticsService;
  brandService: BrandService;
  trendService: TrendService;
  competitorService: CompetitorService;
  notificationsService: NotificationsService;
  llm: LlmService;
  teamId: string;
}

export function buildModel(): BaseChatModel {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
    return new ChatAnthropic({
      model: 'claude-3-5-haiku-20241022',
      temperature: 0.3,
    }) as unknown as BaseChatModel;
  }
  // Fall back to Groq via OpenAI-compatible API
  return new ChatOpenAI({
    modelName: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    openAIApiKey: process.env.GROQ_API_KEY ?? 'no-key',
    configuration: {
      baseURL: 'https://api.groq.com/openai/v1',
    },
  }) as unknown as BaseChatModel;
}

const AGENT_SYSTEM_PROMPTS: Record<AgentName, string> = {
  strategy: `You are the Strategy Agent for a social media management platform.
Your job is to help create growth goals, build content plans, and design campaign strategies.
Always be specific about targets, timelines, and success metrics.
When you create goals or campaigns, use your tools to persist them and return pending approvals for user review.`,

  content: `You are the Content Agent for a social media management platform.
Your job is to draft, repurpose, and schedule social media content.
Use the user's brand voice and platform best practices.
Always generate draft posts via tools and return them as pending approvals so the user can review before publishing.`,

  analytics: `You are the Analytics Agent for a social media management platform.
Your job is to analyze performance data, diagnose issues, and generate reports.
Be data-driven, specific with numbers, and provide actionable insights.
Use the actual data from tools rather than making up statistics.`,

  engagement: `You are the Engagement Agent for a social media management platform.
Your job is to manage community interactions — reply to comments, monitor DMs, and boost engagement.
Draft replies that match the brand's voice. Always show drafted replies for user approval before submission.`,

  intelligence: `You are the Intelligence Agent for a social media management platform.
Your job is to monitor trends and competitor activity, then suggest how to capitalize on opportunities.
Use real data from tools to provide specific, timely insights.`,

  supervisor: `You are the Supervisor Agent for a social media management platform.
Your job is to act as the central coordinator and route user requests to the appropriate specialized capabilities:
- Strategy: for goals, content plans, and campaigns
- Content: for drafting, repurposing, and scheduling posts
- Analytics: for performance metrics and reports
- Engagement: for community interaction and replies
- Intelligence: for market trends and competitor analysis
You have access to all tools from these specialized domains. Determine the user's intent and invoke the necessary tools directly to accomplish their goal.`,
};

export function buildAgentForTeam(agentName: AgentName, deps: AgentDeps) {
  const model = buildModel();

  let tools: DynamicStructuredTool[];

  switch (agentName) {
    case 'strategy':
      tools = buildStrategyTools(deps.prisma, deps.contentService, deps.llm, deps.teamId);
      break;
    case 'content':
      tools = buildContentTools(deps.prisma, deps.contentService, deps.llm, deps.teamId);
      break;
    case 'analytics':
      tools = buildAnalyticsTools(deps.prisma, deps.analyticsService, deps.llm, deps.teamId);
      break;
    case 'engagement':
      tools = buildEngagementTools(
        deps.prisma,
        deps.brandService,
        deps.llm,
        deps.notificationsService,
        deps.teamId,
      );
      break;
    case 'intelligence':
      tools = buildIntelligenceTools(
        deps.prisma,
        deps.trendService,
        deps.competitorService,
        deps.brandService,
        deps.llm,
        deps.contentService,
        deps.teamId,
      );
      break;
    case 'supervisor':
      tools = [
        ...buildStrategyTools(deps.prisma, deps.contentService, deps.llm, deps.teamId),
        ...buildContentTools(deps.prisma, deps.contentService, deps.llm, deps.teamId),
        ...buildAnalyticsTools(deps.prisma, deps.analyticsService, deps.llm, deps.teamId),
        ...buildEngagementTools(
          deps.prisma,
          deps.brandService,
          deps.llm,
          deps.notificationsService,
          deps.teamId,
        ),
        ...buildIntelligenceTools(
          deps.prisma,
          deps.trendService,
          deps.competitorService,
          deps.brandService,
          deps.llm,
          deps.contentService,
          deps.teamId,
        ),
      ];
      break;
    default:
      tools = [];
  }

  const agent = createReactAgent({
    llm: model as Parameters<typeof createReactAgent>[0]['llm'],
    tools,
    stateModifier: AGENT_SYSTEM_PROMPTS[agentName],
  });

  return agent;
}

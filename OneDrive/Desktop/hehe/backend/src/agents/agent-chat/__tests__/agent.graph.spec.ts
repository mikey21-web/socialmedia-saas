import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  buildAgentForTeam,
  buildModel,
  AgentDeps,
  AgentName,
} from '../agent.graph';
import { buildAnalyticsTools } from '../tools/analytics.tools';
import { buildContentTools } from '../tools/content.tools';
import { buildEngagementTools } from '../tools/engagement.tools';
import { buildIntelligenceTools } from '../tools/intelligence.tools';
import { buildStrategyTools } from '../tools/strategy.tools';

jest.mock('@langchain/anthropic', () => ({
  ChatAnthropic: jest.fn().mockImplementation(() => ({ _modelType: 'anthropic' })),
}));

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({ _modelType: 'openai' })),
}));

jest.mock('@langchain/langgraph/prebuilt', () => ({
  createReactAgent: jest
    .fn()
    .mockReturnValue({ invoke: jest.fn(), streamEvents: jest.fn() }),
}));

jest.mock('../tools/strategy.tools', () => ({
  buildStrategyTools: jest.fn().mockReturnValue([]),
}));
jest.mock('../tools/content.tools', () => ({
  buildContentTools: jest.fn().mockReturnValue([]),
}));
jest.mock('../tools/analytics.tools', () => ({
  buildAnalyticsTools: jest.fn().mockReturnValue([]),
}));
jest.mock('../tools/engagement.tools', () => ({
  buildEngagementTools: jest.fn().mockReturnValue([]),
}));
jest.mock('../tools/intelligence.tools', () => ({
  buildIntelligenceTools: jest.fn().mockReturnValue([]),
}));

const deps = {
  prisma: {},
  contentService: {},
  analyticsService: {},
  brandService: {},
  trendService: {},
  competitorService: {},
  notificationsService: {},
  llm: {},
  teamId: 'team-abc',
} as AgentDeps;

const savedEnv = { ...process.env };

describe('agent.graph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...savedEnv, GROQ_API_KEY: 'groq-key' };
    (buildStrategyTools as jest.Mock).mockReturnValue(['strategy-tool']);
    (buildContentTools as jest.Mock).mockReturnValue(['content-tool']);
    (buildAnalyticsTools as jest.Mock).mockReturnValue(['analytics-tool']);
    (buildEngagementTools as jest.Mock).mockReturnValue(['engagement-tool']);
    (buildIntelligenceTools as jest.Mock).mockReturnValue(['intelligence-tool']);
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  describe('buildModel()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env = { ...savedEnv, GROQ_API_KEY: 'groq-key' };
    });

    it("uses ChatAnthropic when ANTHROPIC_API_KEY starts with 'sk-ant-'", () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

      const model = buildModel();

      expect(ChatAnthropic).toHaveBeenCalledWith({
        model: 'claude-3-5-haiku-20241022',
        temperature: 0.3,
      });
      expect(model).toEqual({ _modelType: 'anthropic' });
    });

    it('falls back to ChatOpenAI (Groq) when ANTHROPIC_API_KEY is missing', () => {
      delete process.env.ANTHROPIC_API_KEY;

      const model = buildModel();

      expect(ChatOpenAI).toHaveBeenCalled();
      expect(model).toEqual({ _modelType: 'openai' });
    });

    it("falls back to ChatOpenAI when ANTHROPIC_API_KEY is 'your-anthropic-api-key' (placeholder)", () => {
      process.env.ANTHROPIC_API_KEY = 'your-anthropic-api-key';

      buildModel();

      expect(ChatOpenAI).toHaveBeenCalled();
      expect(ChatAnthropic).not.toHaveBeenCalled();
    });

    it("Groq model uses correct baseURL 'https://api.groq.com/openai/v1'", () => {
      delete process.env.ANTHROPIC_API_KEY;

      buildModel();

      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          configuration: {
            baseURL: 'https://api.groq.com/openai/v1',
          },
        }),
      );
    });
  });

  describe('buildAgentForTeam()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env = { ...savedEnv, GROQ_API_KEY: 'groq-key' };
      (buildStrategyTools as jest.Mock).mockReturnValue(['strategy-tool']);
      (buildContentTools as jest.Mock).mockReturnValue(['content-tool']);
      (buildAnalyticsTools as jest.Mock).mockReturnValue(['analytics-tool']);
      (buildEngagementTools as jest.Mock).mockReturnValue(['engagement-tool']);
      (buildIntelligenceTools as jest.Mock).mockReturnValue(['intelligence-tool']);
    });

    it('builds strategy agent with strategy tools only', () => {
      buildAgentForTeam('strategy', deps);

      expect(createReactAgent).toHaveBeenCalledWith(
        expect.objectContaining({ tools: ['strategy-tool'] }),
      );
    });

    it('builds content agent with content tools only', () => {
      buildAgentForTeam('content', deps);

      expect(createReactAgent).toHaveBeenCalledWith(
        expect.objectContaining({ tools: ['content-tool'] }),
      );
    });

    it('builds analytics agent with analytics tools only', () => {
      buildAgentForTeam('analytics', deps);

      expect(createReactAgent).toHaveBeenCalledWith(
        expect.objectContaining({ tools: ['analytics-tool'] }),
      );
    });

    it('builds engagement agent with engagement tools only', () => {
      buildAgentForTeam('engagement', deps);

      expect(createReactAgent).toHaveBeenCalledWith(
        expect.objectContaining({ tools: ['engagement-tool'] }),
      );
    });

    it('builds intelligence agent with intelligence tools only', () => {
      buildAgentForTeam('intelligence', deps);

      expect(createReactAgent).toHaveBeenCalledWith(
        expect.objectContaining({ tools: ['intelligence-tool'] }),
      );
    });

    it('builds supervisor agent with ALL tools combined', () => {
      buildAgentForTeam('supervisor', deps);

      expect(createReactAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: [
            'strategy-tool',
            'content-tool',
            'analytics-tool',
            'engagement-tool',
            'intelligence-tool',
          ],
        }),
      );
    });

    it('passes correct system prompt for each agent name', () => {
      const expectedPromptSnippets: Record<AgentName, string> = {
        strategy: 'You are the Strategy Agent',
        content: 'You are the Content Agent',
        analytics: 'You are the Analytics Agent',
        engagement: 'You are the Engagement Agent',
        intelligence: 'You are the Intelligence Agent',
        supervisor: 'You are the Supervisor Agent',
      };

      for (const [agentName, promptSnippet] of Object.entries(
        expectedPromptSnippets,
      ) as [AgentName, string][]) {
        jest.clearAllMocks();

        buildAgentForTeam(agentName, deps);

        expect(createReactAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            stateModifier: expect.stringContaining(promptSnippet),
          }),
        );
      }
    });

    it('calls createReactAgent with llm, tools, stateModifier', () => {
      buildAgentForTeam('content', deps);

      expect(createReactAgent).toHaveBeenCalledWith({
        llm: { _modelType: 'openai' },
        tools: ['content-tool'],
        stateModifier: expect.stringContaining('You are the Content Agent'),
      });
    });
  });
});

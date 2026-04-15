/**
 * Content Engine Agent - Main Orchestrator
 * Coordinates research, writing, formatting, and distribution
 */

import {
  AgentExecutor,
  AgentExecutorContext,
  AgentExecutorResult,
  AgentStepLog,
} from '@/lib/agents/executor-types';
import { conductResearch } from './research';
import { writeContent } from './write';
import { formatContent } from './format';
import { distributeContent } from './distribute';

/**
 * Execute the complete content engine workflow
 */
export const executeContentEngine: AgentExecutor = async (
  userMessage: string,
  ctx: AgentExecutorContext
): Promise<AgentExecutorResult> => {
  const steps: AgentStepLog[] = [];

  try {
    // Step 1: Research
    const t1 = Date.now();
    const research = await conductResearch(userMessage);
    const researchDuration = Date.now() - t1;
    steps.push({
      stepName: 'research',
      status: 'completed',
      durationMs: researchDuration,
      output: { sources: research.sources },
    });

    // Step 2: Writing
    const t2 = Date.now();
    const written = await writeContent(research);
    const writingDuration = Date.now() - t2;
    steps.push({
      stepName: 'writing',
      status: 'completed',
      durationMs: writingDuration,
      output: { wordCount: written.wordCount },
    });

    // Step 3: Formatting
    const t3 = Date.now();
    const formatted = await formatContent(written);
    const formatDuration = Date.now() - t3;
    steps.push({
      stepName: 'formatting',
      status: 'completed',
      durationMs: formatDuration,
      output: { formatted: true, sections: formatted.sections },
    });

    // Step 4: Distribution
    const t4 = Date.now();
    const distributed = await distributeContent(formatted);
    const distributeDuration = Date.now() - t4;
    steps.push({
      stepName: 'distribution',
      status: 'completed',
      durationMs: distributeDuration,
      output: { channels: distributed.channels },
    });

    const totalDuration = Date.now() - t1;

    return {
      success: true,
      message: `Content ready: ${written.wordCount} words, ${formatted.sections} sections, ${distributed.channels} channels`,
      runId: ctx.runId,
      data: {
        wordCount: written.wordCount,
        sections: formatted.sections,
        channels: distributed.channels,
        sources: research.sources,
        totalDurationMs: totalDuration,
      },
      steps,
    };
  } catch (error) {
    return {
      success: false,
      message: `Content Engine failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      runId: ctx.runId,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
    };
  }
};

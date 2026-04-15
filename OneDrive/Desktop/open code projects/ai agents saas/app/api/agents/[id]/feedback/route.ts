import { LearningEngine } from '@/lib/agents/learning-engine';
import { NextRequest, NextResponse } from 'next/server';

const learningEngine = new LearningEngine();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { runId, prediction, actual } = await request.json();
    const userId = request.headers.get('x-user-id') || 'anonymous';

    if (!runId || !prediction || !actual) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, prediction, actual' },
        { status: 400 }
      );
    }

    await learningEngine.recordFeedback(
      runId,
      params.id,
      userId,
      prediction,
      actual
    );

    const stats = await learningEngine.getFeedbackStats(params.id);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      agentId: params.id,
      stats
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

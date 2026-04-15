export interface ExecutionFeedback {
  runId: string;
  agentId: string;
  userId: string;
  prediction: string;
  actual: string;
  wasCorrect: boolean;
  confidence: number;
  timestamp: Date;
}

export class LearningEngine {
  private feedbackBuffer: ExecutionFeedback[] = [];
  private refinementThreshold = 0.7; // If accuracy < 70%, trigger refinement

  async recordExecution(
    runId: string,
    agentId: string,
    userId: string,
    prediction: string,
    confidence: number
  ): Promise<void> {
    // Store in memory buffer (Task 5+ will persist to Supabase)
    console.log(`[LEARNING] Recorded execution ${runId} for agent ${agentId}`);
  }

  async recordFeedback(
    runId: string,
    agentId: string,
    userId: string,
    prediction: string,
    actual: string
  ): Promise<void> {
    const wasCorrect = prediction.toLowerCase() === actual.toLowerCase();
    const feedback: ExecutionFeedback = {
      runId,
      agentId,
      userId,
      prediction,
      actual,
      wasCorrect,
      confidence: wasCorrect ? 0.9 : 0.3,
      timestamp: new Date()
    };

    this.feedbackBuffer.push(feedback);

    // Check if refinement needed
    const accuracy = this.calculateAccuracy(agentId);
    if (accuracy < this.refinementThreshold) {
      await this.triggerRefinement(agentId);
    }
  }

  private calculateAccuracy(agentId: string): number {
    const agentFeedback = this.feedbackBuffer.filter(f => f.agentId === agentId);
    if (agentFeedback.length === 0) return 1.0;
    const correct = agentFeedback.filter(f => f.wasCorrect).length;
    return correct / agentFeedback.length;
  }

  private async triggerRefinement(agentId: string): Promise<void> {
    console.log(`[LEARNING] Refinement triggered for ${agentId} (accuracy < ${this.refinementThreshold})`);
    // In production: update agent weights, trigger fine-tuning
  }

  async getFeedbackStats(agentId: string): Promise<{ accuracy: number; count: number }> {
    const agentFeedback = this.feedbackBuffer.filter(f => f.agentId === agentId);
    const accuracy = this.calculateAccuracy(agentId);
    return { accuracy, count: agentFeedback.length };
  }
}

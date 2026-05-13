import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CritiqueService, CritiqueContext, CritiqueResult } from './critique.service';

@Controller('ai/critique')
@UseGuards(JwtAuthGuard)
export class CritiqueController {
  constructor(private readonly critique: CritiqueService) {}

  /**
   * Quick rule-based AI-slop check (no LLM call). Returns 0-100 risk + flags.
   * Use as a fast pre-filter before the full critique.
   */
  @Post('detect-slop')
  detectSlop(@Body() body: { content: string }) {
    return this.critique.detectAiSlop(body.content);
  }

  /**
   * Full 5-dimensional critique. Returns scores + failing dimensions.
   */
  @Post()
  critique_(@Body() body: { content: string; context: CritiqueContext }): Promise<CritiqueResult> {
    return this.critique.critique(body.content, body.context);
  }

  /**
   * Critique → revise → re-critique loop. Returns the final passing version.
   */
  @Post('revise')
  reviseUntilPassing(
    @Body() body: { content: string; context: CritiqueContext; maxAttempts?: number },
  ) {
    return this.critique.critiqueAndRevise(body.content, body.context, {
      maxAttempts: body.maxAttempts,
    });
  }
}

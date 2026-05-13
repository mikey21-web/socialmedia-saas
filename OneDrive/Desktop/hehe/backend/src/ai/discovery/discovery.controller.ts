import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import {
  DISCOVERY_FORM,
  inferDefaults,
  answersToPromptContext,
  DiscoveryAnswers,
} from './discovery.types';

@Controller('ai/discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  /**
   * Returns the discovery form spec — used to render the radio form UI.
   */
  @Get('form')
  getForm() {
    return { fields: DISCOVERY_FORM };
  }

  /**
   * Given a partial input (topic / platform / intent), return smart defaults
   * for the form. Lets us pre-fill 80% of the form so users only confirm.
   */
  @Post('defaults')
  defaults(@Body() body: { topic?: string; platform?: string; intent?: string }) {
    return inferDefaults(body);
  }

  /**
   * Convert form answers into a brief block. Useful for testing / preview.
   */
  @Post('format')
  format(@Body() body: { answers: DiscoveryAnswers }) {
    return { brief: answersToPromptContext(body.answers) };
  }
}

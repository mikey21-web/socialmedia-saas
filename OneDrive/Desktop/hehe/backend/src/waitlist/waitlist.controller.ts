import { Body, Controller, Get, Post } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly service: WaitlistService) {}

  @Post('join')
  join(@Body() body: { email: string; name?: string; referredBy?: string }) {
    return this.service.join(body.email, body.name, body.referredBy);
  }

  @Get('count')
  count() {
    return this.service.getCount();
  }
}

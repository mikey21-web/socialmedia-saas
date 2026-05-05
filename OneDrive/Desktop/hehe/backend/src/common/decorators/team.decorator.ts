import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequestUser } from '../interfaces/authenticated-request-user.interface';

export const TeamId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    return request.user?.team_id;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ClinicJwtPayload } from '../services/clinic-token.service.js';

export const CurrentClinicUser = createParamDecorator(
  (data: keyof ClinicJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as ClinicJwtPayload;
    return data ? user?.[data] : user;
  },
);

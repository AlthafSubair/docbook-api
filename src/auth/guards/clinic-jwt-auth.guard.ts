import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClinicJwtAuthGuard extends AuthGuard('jwt-clinic') {}

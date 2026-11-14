import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicUsersController } from './clinic-users.controller.js';
import { ClinicUsersService } from './clinic-users.service.js';
import { User } from '../users/entities/user.entity.js';
import { Clinic } from '../clinics/entities/clinic.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Clinic])],
  controllers: [ClinicUsersController],
  providers: [ClinicUsersService],
  exports: [ClinicUsersService],
})
export class ClinicUsersModule {}

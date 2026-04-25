import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';
import { EscrowCronService } from './escrow.cron';
import { EscrowController } from './escrow.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthorizationModule } from '../common/authorization/authorization.module';

@Module({
  imports: [DatabaseModule, SettingsModule, ScheduleModule.forRoot(), AuthorizationModule],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowCronService],
  exports: [EscrowService],
})
export class EscrowModule {}

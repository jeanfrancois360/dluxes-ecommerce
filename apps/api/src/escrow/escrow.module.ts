import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';
import { EscrowCronService } from './escrow.cron';
import { EscrowController } from './escrow.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule, ScheduleModule.forRoot()],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowCronService],
  exports: [EscrowService],
})
export class EscrowModule {}

import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryCompanyController } from './delivery-company.controller';
import { AdminDeliveryController } from './admin-delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryCompanyService } from './delivery-company.service';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { DeliveryAuditService } from './delivery-audit.service';
import { AdminDeliveryService } from './admin-delivery.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, UploadModule],
  controllers: [
    DeliveryController,
    DeliveryCompanyController,
    AdminDeliveryController,
  ],
  providers: [
    DeliveryService,
    DeliveryCompanyService,
    DeliveryAssignmentService,
    DeliveryAuditService,
    AdminDeliveryService,
  ],
  exports: [
    DeliveryService,
    DeliveryCompanyService,
    DeliveryAssignmentService,
    DeliveryAuditService,
    AdminDeliveryService,
  ],
})
export class DeliveryModule {}

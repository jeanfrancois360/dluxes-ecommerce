import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EasyPostService } from './easypost.service';

@Injectable()
export class EasyPostTrackingService {
  private readonly logger = new Logger(EasyPostTrackingService.name);

  constructor(
    private readonly easyPostService: EasyPostService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Create a tracker for external tracking numbers
   */
  async createTracker(trackingNumber: string, carrier?: string) {
    const client = this.easyPostService.getClient();

    const tracker = await client.Tracker.create({
      tracking_code: trackingNumber,
      carrier: carrier,
    });

    return {
      id: tracker.id,
      trackingCode: tracker.tracking_code,
      carrier: tracker.carrier,
      status: tracker.status,
      statusDetail: tracker.status_detail,
      estDeliveryDate: tracker.est_delivery_date,
      publicUrl: tracker.public_url,
      trackingDetails: tracker.tracking_details?.map((td) => ({
        status: td.status,
        message: td.message,
        datetime: td.datetime,
        location: td.tracking_location,
      })),
    };
  }

  /**
   * Get tracking info for a shipment
   */
  async getTracking(shipmentId: string) {
    const shipment = await this.prisma.easyPostShipment.findUnique({
      where: { id: shipmentId },
      include: {
        trackingEvents: {
          orderBy: { eventDatetime: 'desc' },
        },
      },
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // If we have a tracker, get fresh data from EasyPost
    if (shipment.easypostTrackerId) {
      const client = this.easyPostService.getClient();
      const tracker = await client.Tracker.retrieve(shipment.easypostTrackerId);

      return {
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: tracker.status,
        statusDetail: tracker.status_detail,
        estDeliveryDate: tracker.est_delivery_date,
        signedBy: tracker.signed_by,
        publicUrl: tracker.public_url,
        trackingDetails: tracker.tracking_details?.map((td) => ({
          status: td.status,
          statusDetail: td.status_detail,
          message: td.message,
          datetime: td.datetime,
          city: td.tracking_location?.city,
          state: td.tracking_location?.state,
          country: td.tracking_location?.country,
          zip: td.tracking_location?.zip,
        })),
        carrierDetail: tracker.carrier_detail,
      };
    }

    // Return cached events if no tracker
    return {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      trackingDetails: shipment.trackingEvents,
    };
  }

  /**
   * Process webhook tracking update
   */
  async processTrackingUpdate(trackerId: string, trackerData: any) {
    // Find shipment by tracker ID
    const shipment = await this.prisma.easyPostShipment.findFirst({
      where: { easypostTrackerId: trackerId },
    });

    if (!shipment) {
      this.logger.warn(`Shipment not found for tracker: ${trackerId}`);
      return;
    }

    // Update shipment status
    const newStatus = this.easyPostService.mapTrackingStatus(trackerData.status);

    await this.prisma.easyPostShipment.update({
      where: { id: shipment.id },
      data: {
        status: newStatus as any,
        estimatedDeliveryDate: trackerData.est_delivery_date
          ? new Date(trackerData.est_delivery_date)
          : undefined,
      },
    });

    // Add tracking events
    const newEvents = trackerData.tracking_details || [];
    for (const event of newEvents) {
      // Check if event already exists
      const existing = await this.prisma.easyPostTrackingEvent.findFirst({
        where: {
          shipmentId: shipment.id,
          eventDatetime: new Date(event.datetime),
          message: event.message,
        },
      });

      if (!existing) {
        await this.prisma.easyPostTrackingEvent.create({
          data: {
            shipmentId: shipment.id,
            status: event.status,
            statusDetail: event.status_detail,
            message: event.message,
            description: event.description,
            city: event.tracking_location?.city,
            state: event.tracking_location?.state,
            country: event.tracking_location?.country,
            zip: event.tracking_location?.zip,
            eventDatetime: new Date(event.datetime),
            source: event.source,
            carrierCode: event.carrier_code,
          },
        });
      }
    }

    // Update order delivery status if delivered
    if (newStatus === 'DELIVERED') {
      await this.prisma.delivery.updateMany({
        where: {
          orderId: shipment.orderId,
          trackingNumber: shipment.trackingNumber,
        },
        data: {
          currentStatus: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });
    }

    return shipment;
  }
}

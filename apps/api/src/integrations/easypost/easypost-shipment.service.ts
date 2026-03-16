import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EasyPostService } from './easypost.service';
import { PurchaseLabelDto } from './dto/purchase-label.dto';

@Injectable()
export class EasyPostShipmentService {
  private readonly logger = new Logger(EasyPostShipmentService.name);

  constructor(
    private readonly easyPostService: EasyPostService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Purchase a shipping label
   */
  async purchaseLabel(dto: PurchaseLabelDto) {
    const client = this.easyPostService.getClient();

    // Get or create shipment
    let shipment;
    if (dto.shipmentId) {
      // Use existing shipment from rate shopping
      shipment = await client.Shipment.retrieve(dto.shipmentId);
    } else {
      // Create new shipment with addresses
      shipment = await client.Shipment.create({
        to_address: this.easyPostService.formatAddress(dto.toAddress),
        from_address: this.easyPostService.formatAddress(dto.fromAddress),
        parcel: {
          length: dto.parcel.length,
          width: dto.parcel.width,
          height: dto.parcel.height,
          weight: dto.parcel.weight,
        },
        customs_info: dto.customsInfo,
        options: {
          label_format: dto.labelFormat || 'PNG',
          label_size: dto.labelSize || '4x6',
        },
      });
    }

    // Find the rate to purchase
    const rate = shipment.rates.find((r) => r.id === dto.rateId);
    if (!rate) {
      throw new BadRequestException('Selected rate not found');
    }

    // Buy the shipment
    const boughtShipment = await client.Shipment.buy(shipment.id, dto.rateId);

    // Store in database
    const easypostShipment = await this.prisma.easyPostShipment.create({
      data: {
        orderId: dto.orderId,
        orderItemId: dto.orderItemId,
        sellerId: dto.sellerId,
        storeId: dto.storeId,
        easypostShipmentId: boughtShipment.id,
        easypostRateId: rate.id,
        easypostTrackerId: boughtShipment.tracker?.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: parseFloat(rate.rate),
        currency: rate.currency,
        retailRate: rate.retail_rate ? parseFloat(rate.retail_rate) : null,
        listRate: rate.list_rate ? parseFloat(rate.list_rate) : null,
        labelUrl: boughtShipment.postage_label?.label_url,
        labelFormat:
          boughtShipment.postage_label?.label_file_type?.split('/')[1]?.toUpperCase() || 'PNG',
        labelSize: boughtShipment.postage_label?.label_size,
        trackingNumber: boughtShipment.tracking_code,
        trackingUrl: boughtShipment.tracker?.public_url,
        estimatedDeliveryDate: boughtShipment.tracker?.est_delivery_date
          ? new Date(boughtShipment.tracker.est_delivery_date)
          : null,
        deliveryDays: rate.delivery_days,
        status: 'PURCHASED',
        fromAddress: this.easyPostService.formatAddress(dto.fromAddress) as any,
        toAddress: this.easyPostService.formatAddress(dto.toAddress) as any,
        parcel: dto.parcel as any,
        customsInfo: dto.customsInfo as any,
        insuredAmount: dto.insuranceAmount,
        insuranceFee: boughtShipment.fees?.find((f) => f.type === 'InsuranceFee')?.amount
          ? parseFloat(boughtShipment.fees.find((f) => f.type === 'InsuranceFee').amount)
          : null,
        postageFee: boughtShipment.fees?.find((f) => f.type === 'PostageFee')?.amount
          ? parseFloat(boughtShipment.fees.find((f) => f.type === 'PostageFee').amount)
          : null,
        purchasedAt: new Date(),
      },
    });

    // Update order with shipping provider
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        shippingProvider: 'EASYPOST',
        shippingProviderData: {
          shipmentId: easypostShipment.id,
          trackingNumber: boughtShipment.tracking_code,
          carrier: rate.carrier,
          service: rate.service,
        } as any,
      },
    });

    return {
      id: easypostShipment.id,
      trackingNumber: boughtShipment.tracking_code,
      trackingUrl: boughtShipment.tracker?.public_url,
      labelUrl: boughtShipment.postage_label?.label_url,
      labelPdfUrl: boughtShipment.postage_label?.label_pdf_url,
      labelZplUrl: boughtShipment.postage_label?.label_zpl_url,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate),
      estimatedDeliveryDate: boughtShipment.tracker?.est_delivery_date,
      fees: boughtShipment.fees,
    };
  }

  /**
   * Refund a shipping label
   */
  async refundLabel(shipmentId: string) {
    const shipment = await this.prisma.easyPostShipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.refundStatus) {
      throw new BadRequestException('Refund already requested');
    }

    const client = this.easyPostService.getClient();
    const refundedShipment = await client.Shipment.refund(shipment.easypostShipmentId);

    await this.prisma.easyPostShipment.update({
      where: { id: shipmentId },
      data: {
        refundStatus: 'SUBMITTED',
        status: 'CANCELLED',
        refundedAt: new Date(),
      },
    });

    return {
      id: shipmentId,
      refundStatus: refundedShipment.refund_status,
    };
  }

  /**
   * Create a return label
   */
  async createReturnLabel(dto: PurchaseLabelDto) {
    const client = this.easyPostService.getClient();

    // Swap to/from addresses for return
    const shipment = await client.Shipment.create({
      to_address: this.easyPostService.formatAddress(dto.fromAddress), // Original sender becomes recipient
      from_address: this.easyPostService.formatAddress(dto.toAddress), // Original recipient becomes sender
      parcel: dto.parcel,
      is_return: true,
      options: {
        label_format: dto.labelFormat || 'PNG',
      },
    });

    // Continue with purchase flow...
    return this.purchaseLabel({
      ...dto,
      shipmentId: shipment.id,
    });
  }

  /**
   * Convert label format
   */
  async convertLabelFormat(shipmentId: string, format: 'PDF' | 'ZPL' | 'EPL2') {
    const shipment = await this.prisma.easyPostShipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const client = this.easyPostService.getClient();
    const convertedShipment = await client.Shipment.convertLabelFormat(
      shipment.easypostShipmentId,
      format
    );

    const newLabelUrl =
      format === 'PDF'
        ? convertedShipment.postage_label?.label_pdf_url
        : format === 'ZPL'
          ? convertedShipment.postage_label?.label_zpl_url
          : convertedShipment.postage_label?.label_epl2_url;

    return {
      id: shipmentId,
      format,
      labelUrl: newLabelUrl,
    };
  }

  /**
   * Get shipment by ID
   */
  async getShipment(id: string) {
    return this.prisma.easyPostShipment.findUnique({
      where: { id },
      include: {
        trackingEvents: {
          orderBy: { eventDatetime: 'desc' },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get shipments for an order
   */
  async getOrderShipments(orderId: string) {
    return this.prisma.easyPostShipment.findMany({
      where: { orderId },
      include: {
        trackingEvents: {
          orderBy: { eventDatetime: 'desc' },
          take: 5,
        },
      },
    });
  }
}

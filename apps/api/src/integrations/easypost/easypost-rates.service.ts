import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EasyPostService } from './easypost.service';
import { EasyPostCustomsService } from './easypost-customs.service';
import { GetRatesDto } from './dto/get-rates.dto';

@Injectable()
export class EasyPostRatesService {
  private readonly logger = new Logger(EasyPostRatesService.name);

  constructor(
    private readonly easyPostService: EasyPostService,
    private readonly prisma: PrismaService,
    private readonly customsService: EasyPostCustomsService
  ) {}

  async getRates(dto: GetRatesDto) {
    const client = this.easyPostService.getClient();

    // Auto-build customs info from order product data when crossing borders
    let resolvedCustomsInfo: object | undefined;
    if (dto.customsInfo) {
      // Caller explicitly provided customs info — map DTO fields to EasyPost shape
      resolvedCustomsInfo = {
        contents_type: dto.customsInfo.contentsType || 'merchandise',
        contents_explanation: dto.customsInfo.contentsExplanation,
        customs_certify: true,
        customs_signer: dto.customsInfo.signer,
        eel_pfc: dto.customsInfo.eelPfc || 'NOEEI 30.37(a)',
        non_delivery_option: dto.customsInfo.nonDeliveryOption || 'return',
        restriction_type: 'none',
        customs_items: dto.customsInfo.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          value: item.value,
          weight: item.weight,
          hs_tariff_number: item.hsTariffNumber,
          origin_country: item.originCountry || 'US',
        })),
      };
    } else if (dto.orderId) {
      // Auto-build from product hsCode / countryOfOrigin
      resolvedCustomsInfo =
        (await this.customsService.buildCustomsInfoFromOrder(
          dto.orderId,
          dto.fromAddress.country,
          dto.toAddress.country
        )) ?? undefined;
    }

    const shipment = await client.Shipment.create({
      to_address: this.easyPostService.formatAddress(dto.toAddress),
      from_address: this.easyPostService.formatAddress(dto.fromAddress),
      parcel: {
        length: dto.parcel.length,
        width: dto.parcel.width,
        height: dto.parcel.height,
        weight: dto.parcel.weight, // in oz
      },
      customs_info: resolvedCustomsInfo,
    });

    // Log detailed shipment info for debugging
    this.logger.debug(`EasyPost Shipment Created: ${shipment.id}`);
    this.logger.debug(`From: ${dto.fromAddress.country}, To: ${dto.toAddress.country}`);
    this.logger.debug(`Rates returned: ${shipment.rates?.length || 0}`);

    if (shipment.rates?.length === 0 && shipment.messages?.length > 0) {
      this.logger.warn(`EasyPost Messages: ${JSON.stringify(shipment.messages)}`);
    }

    // Transform rates for frontend
    const rates = shipment.rates.map((rate) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate),
      currency: rate.currency,
      retailRate: rate.retail_rate ? parseFloat(rate.retail_rate) : null,
      listRate: rate.list_rate ? parseFloat(rate.list_rate) : null,
      deliveryDays: rate.delivery_days,
      deliveryDate: rate.delivery_date,
      deliveryDateGuaranteed: rate.delivery_date_guaranteed,
      estDeliveryDays: rate.est_delivery_days,
    }));

    return {
      shipmentId: shipment.id,
      rates: rates.sort((a, b) => a.rate - b.rate), // Sort by price
    };
  }

  // Get lowest rate for a shipment
  async getLowestRate(dto: GetRatesDto, carriers?: string[], services?: string[]) {
    const { shipmentId, rates } = await this.getRates(dto);

    let filteredRates = rates;

    if (carriers?.length) {
      filteredRates = filteredRates.filter((r) =>
        carriers.some((c) => r.carrier.toLowerCase() === c.toLowerCase())
      );
    }

    if (services?.length) {
      filteredRates = filteredRates.filter((r) =>
        services.some((s) => r.service.toLowerCase().includes(s.toLowerCase()))
      );
    }

    if (filteredRates.length === 0) {
      throw new Error('No rates available for the specified criteria');
    }

    return {
      shipmentId,
      lowestRate: filteredRates[0],
      allRates: filteredRates,
    };
  }
}

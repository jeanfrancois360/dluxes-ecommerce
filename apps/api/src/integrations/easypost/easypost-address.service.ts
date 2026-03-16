import { Injectable, Logger } from '@nestjs/common';
import { EasyPostService } from './easypost.service';
import { AddressDto } from './dto/address.dto';

@Injectable()
export class EasyPostAddressService {
  private readonly logger = new Logger(EasyPostAddressService.name);

  constructor(private readonly easyPostService: EasyPostService) {}

  /**
   * Verify an address
   */
  async verifyAddress(address: AddressDto, strict: boolean = false) {
    const client = this.easyPostService.getClient();

    const formattedAddress = this.easyPostService.formatAddress(address);

    try {
      const verifiedAddress = await client.Address.createAndVerify({
        ...formattedAddress,
        verify: !strict,
        verify_strict: strict,
      });

      return {
        verified: true,
        address: {
          name: verifiedAddress.name,
          company: verifiedAddress.company,
          street1: verifiedAddress.street1,
          street2: verifiedAddress.street2,
          city: verifiedAddress.city,
          state: verifiedAddress.state,
          zip: verifiedAddress.zip,
          country: verifiedAddress.country,
          phone: verifiedAddress.phone,
          email: verifiedAddress.email,
          residential: verifiedAddress.residential,
        },
        verifications: verifiedAddress.verifications,
      };
    } catch (error) {
      return {
        verified: false,
        errors: error.errors || [{ message: error.message }],
        address: formattedAddress,
      };
    }
  }
}

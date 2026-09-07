import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivePartners() {
    return this.prisma.trustedPartner.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getAllPartners() {
    return this.prisma.trustedPartner.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getPartner(id: string) {
    const partner = await this.prisma.trustedPartner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async createPartner(dto: CreatePartnerDto) {
    return this.prisma.trustedPartner.create({
      data: {
        name: dto.name,
        logo: dto.logo,
        website: dto.website,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePartner(id: string, dto: UpdatePartnerDto) {
    await this.getPartner(id);
    return this.prisma.trustedPartner.update({ where: { id }, data: dto });
  }

  async deletePartner(id: string) {
    await this.getPartner(id);
    return this.prisma.trustedPartner.delete({ where: { id } });
  }
}

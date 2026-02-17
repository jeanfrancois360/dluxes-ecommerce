import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AnnouncementType } from '@prisma/client';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active announcements (public endpoint)
   * Returns announcements that are currently valid and active
   */
  async getActiveAnnouncements() {
    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        text: true,
        icon: true,
        link: true,
        type: true,
        displayOrder: true,
      },
    });

    this.logger.log(`Retrieved ${announcements.length} active announcements`);
    return announcements;
  }

  /**
   * Get all announcements (admin endpoint)
   */
  async getAllAnnouncements(filters?: { isActive?: boolean; type?: AnnouncementType }) {
    return this.prisma.announcement.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.type && { type: filters.type }),
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get single announcement by ID
   */
  async getAnnouncementById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  /**
   * Create new announcement
   */
  async createAnnouncement(data: {
    text: string;
    icon?: string;
    link?: string;
    type?: AnnouncementType;
    displayOrder?: number;
    isActive?: boolean;
    validFrom?: Date;
    validUntil?: Date;
    createdBy: string;
  }) {
    const announcement = await this.prisma.announcement.create({
      data: {
        text: data.text,
        icon: data.icon,
        link: data.link,
        type: data.type || AnnouncementType.INFO,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        createdBy: data.createdBy,
      },
    });

    this.logger.log(`Created announcement: ${announcement.id} - "${announcement.text}"`);
    return announcement;
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(
    id: string,
    data: {
      text?: string;
      icon?: string;
      link?: string;
      type?: AnnouncementType;
      displayOrder?: number;
      isActive?: boolean;
      validFrom?: Date;
      validUntil?: Date;
      updatedBy: string;
    }
  ) {
    const existing = await this.getAnnouncementById(id);

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(data.text !== undefined && { text: data.text }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.link !== undefined && { link: data.link }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.validFrom !== undefined && { validFrom: data.validFrom }),
        ...(data.validUntil !== undefined && { validUntil: data.validUntil }),
        updatedBy: data.updatedBy,
      },
    });

    this.logger.log(`Updated announcement: ${announcement.id}`);
    return announcement;
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: string) {
    const existing = await this.getAnnouncementById(id);

    await this.prisma.announcement.delete({
      where: { id },
    });

    this.logger.log(`Deleted announcement: ${id} - "${existing.text}"`);
    return { success: true, message: 'Announcement deleted successfully' };
  }

  /**
   * Reorder announcements
   */
  async reorderAnnouncements(announcementIds: string[]) {
    const updates = announcementIds.map((id, index) =>
      this.prisma.announcement.update({
        where: { id },
        data: { displayOrder: index },
      })
    );

    await this.prisma.$transaction(updates);

    this.logger.log(`Reordered ${announcementIds.length} announcements`);
    return { success: true, message: 'Announcements reordered successfully' };
  }
}

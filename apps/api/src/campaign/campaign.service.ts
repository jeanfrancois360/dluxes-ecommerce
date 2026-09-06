import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignAudience, CampaignStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { campaignEmailTemplate } from '../email/templates/campaign.template';
import { CreateCampaignDto, UpdateCampaignDto, ScheduleCampaignDto } from './dto/campaign.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(dto: CreateCampaignDto, createdBy: string) {
    return this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        previewText: dto.previewText,
        body: dto.body,
        audience: dto.audience ?? CampaignAudience.ALL,
        createdBy,
      },
    });
  }

  async findAll() {
    return this.prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be edited');
    }
    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.previewText !== undefined && { previewText: dto.previewText }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.audience !== undefined && { audience: dto.audience }),
      },
    });
  }

  async delete(id: string) {
    const campaign = await this.findOne(id);
    if (campaign.status === CampaignStatus.SENDING) {
      throw new BadRequestException('Cannot delete a campaign that is currently sending');
    }
    await this.prisma.emailCampaign.delete({ where: { id } });
    return { success: true };
  }

  // ─── Scheduling ───────────────────────────────────────────────────────────────

  async schedule(id: string, dto: ScheduleCampaignDto) {
    const campaign = await this.findOne(id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be scheduled');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    return this.prisma.emailCampaign.update({
      where: { id },
      data: { status: CampaignStatus.SCHEDULED, scheduledAt },
    });
  }

  async cancelSchedule(id: string) {
    const campaign = await this.findOne(id);
    if (campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Campaign is not scheduled');
    }
    return this.prisma.emailCampaign.update({
      where: { id },
      data: { status: CampaignStatus.DRAFT, scheduledAt: null },
    });
  }

  // ─── Sending ──────────────────────────────────────────────────────────────────

  async getRecipientCount(audience: CampaignAudience): Promise<number> {
    const where = this.buildAudienceWhere(audience);
    return this.prisma.user.count({ where });
  }

  async sendNow(id: string) {
    const campaign = await this.findOne(id);
    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED &&
      campaign.status !== CampaignStatus.FAILED
    ) {
      throw new BadRequestException(
        'Campaign must be in DRAFT, SCHEDULED, or FAILED state to send'
      );
    }

    // Resolve recipients
    const where = this.buildAudienceWhere(campaign.audience);
    const recipients = await this.prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true },
    });

    if (recipients.length === 0) {
      throw new BadRequestException('No recipients found for the selected audience');
    }

    // Mark as SENDING
    await this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SENDING,
        recipientCount: recipients.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    this.logger.log(`Campaign "${campaign.subject}" sending to ${recipients.length} recipients`);

    // Send in batches of 50 to avoid rate limits
    let sent = 0;
    let failed = 0;
    const BATCH = 50;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);

      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const html = campaignEmailTemplate(
              campaign.subject,
              campaign.body,
              campaign.previewText ?? undefined
            );
            const ok = await this.emailService.sendCampaignEmail(
              user.email,
              campaign.subject,
              html
            );
            if (ok) {
              sent++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        })
      );

      // Update progress after each batch
      await this.prisma.emailCampaign.update({
        where: { id },
        data: { sentCount: sent, failedCount: failed },
      });
    }

    const finalStatus = failed === recipients.length ? CampaignStatus.FAILED : CampaignStatus.SENT;

    await this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        sentCount: sent,
        failedCount: failed,
      },
    });

    this.logger.log(`Campaign "${campaign.subject}" complete — sent: ${sent}, failed: ${failed}`);

    return { success: true, sent, failed, total: recipients.length };
  }

  // ─── Cron — runs every minute, fires scheduled campaigns ─────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledCampaigns() {
    const due = await this.prisma.emailCampaign.findMany({
      where: {
        status: CampaignStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
    });

    for (const campaign of due) {
      this.logger.log(`Auto-sending scheduled campaign: ${campaign.id}`);
      try {
        await this.sendNow(campaign.id);
      } catch (err) {
        this.logger.error(`Failed to send scheduled campaign ${campaign.id}`, err);
        await this.prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: CampaignStatus.FAILED },
        });
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private buildAudienceWhere(audience: CampaignAudience) {
    const roleMap: Record<CampaignAudience, UserRole[] | undefined> = {
      ALL: undefined,
      SELLERS: [UserRole.SELLER],
      BUYERS: [UserRole.BUYER, UserRole.CUSTOMER],
      ADMINS: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      DELIVERY_PARTNERS: [UserRole.DELIVERY_PARTNER],
    };

    const roles = roleMap[audience];
    return roles ? { role: { in: roles }, emailVerified: true } : { emailVerified: true };
  }
}

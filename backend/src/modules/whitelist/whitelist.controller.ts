import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('whitelist')
export class WhitelistController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('check')
  async check(@Query('studentId') studentId: string) {
    if (!studentId) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'studentId is required',
      });
    }

    const entry = await this.prisma.whitelist.findUnique({
      where: { studentId },
    });

    if (!entry || !entry.isActive) {
      return { success: true, data: { valid: false } };
    }

    return {
      success: true,
      data: { valid: true, name: entry.name, groupCode: entry.groupCode },
    };
  }
}

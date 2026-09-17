import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/decorators';

@ApiTags('Santé')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async health() {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      // Sans ça, impossible de savoir quelle version répond : deux commits qui
      // ne changent rien de visible produisent des pages identiques.
      commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? 'inconnu',
      timestamp: new Date().toISOString(),
    };
  }
}

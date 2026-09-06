import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry, req?: { ip?: string; headers?: Record<string, unknown> }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          ipAddress: entry.ipAddress ?? (req?.ip as string) ?? null,
          userAgent:
            entry.userAgent ??
            ((req?.headers?.['user-agent'] as string) ?? null),
          metadata: (entry.metadata as never) ?? undefined,
        },
      });
    } catch {
      // Audit logging must never break the main flow
      // eslint-disable-next-line no-console
      console.error('Audit log write failed');
    }
  }
}

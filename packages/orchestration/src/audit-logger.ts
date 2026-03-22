import type { RiskLevel } from '@ail/common';
import type { AuditRepository } from '@ail/storage';

export class AuditLogger {
  constructor(private auditRepo: AuditRepository) {}

  log(
    actor: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    riskLevel: RiskLevel = 'safe'
  ): void {
    this.auditRepo.log({
      actor,
      action,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      detailsJson: details ? JSON.stringify(details) : null,
      riskLevel,
    });
  }
}

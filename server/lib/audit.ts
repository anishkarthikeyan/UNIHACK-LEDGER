import { pool } from '../db/pool';

// Moved verbatim from the original monolithic server/index.ts — behavior is unchanged.
export async function audit(actorId: string | undefined, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  await pool.query('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)', [actorId ?? null, action, entityType, entityId ?? null, metadata]);
}

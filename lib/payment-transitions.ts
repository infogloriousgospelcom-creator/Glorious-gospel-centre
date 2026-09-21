/**
 * Allowed giving_transactions status transitions for provider callbacks.
 *
 * SUCCESS is terminal (idempotent ignore). Terminal failures may not be
 * resurrected to SUCCESS via a forged callback.
 */

export type GivingTxStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

const ALLOWED: Record<GivingTxStatus, ReadonlySet<GivingTxStatus>> = {
  PENDING: new Set(["PROCESSING", "SUCCESS", "FAILED", "CANCELLED"]),
  PROCESSING: new Set(["SUCCESS", "FAILED", "CANCELLED"]),
  SUCCESS: new Set(),
  FAILED: new Set(["FAILED"]),
  CANCELLED: new Set(["CANCELLED"]),
};

export function canTransition(
  from: string,
  to: string,
): boolean {
  const allowed = ALLOWED[from as GivingTxStatus];
  if (!allowed) return false;
  return allowed.has(to as GivingTxStatus);
}

export function isTerminalSuccess(status: string): boolean {
  return status === "SUCCESS";
}

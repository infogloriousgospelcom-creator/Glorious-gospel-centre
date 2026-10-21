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

/**
 * Transitions available to the audited staff override path.
 *
 * Deliberately stricter than `ALLOWED`: the provider callback is what
 * legitimately completes a payment, so a human writing a status directly
 * must never be able to mark an unpaid gift as paid. The one exception is
 * SUCCESS -> FAILED, which is a correction of a genuine mistake and is
 * recorded in the audit log with a mandatory reason.
 */
const STAFF_ALLOWED: Record<GivingTxStatus, ReadonlySet<GivingTxStatus>> = {
  PENDING: new Set(["FAILED", "CANCELLED"]),
  PROCESSING: new Set(["FAILED", "CANCELLED"]),
  SUCCESS: new Set(["FAILED"]),
  FAILED: new Set(),
  CANCELLED: new Set(),
};

export function canStaffTransition(
  from: string,
  to: string,
): boolean {
  const allowed = STAFF_ALLOWED[from as GivingTxStatus];
  if (!allowed) return false;
  return allowed.has(to as GivingTxStatus);
}

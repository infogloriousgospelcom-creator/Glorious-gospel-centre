"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type PaymentStatus =
  | "IDLE"
  | "PROCESSING"
  | "STK_SENT"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "TIMEOUT";

export interface TransactionStatus {
  id: string;
  status: string;
  externalReference: string | null;
  amountCents: number;
  currency: string;
  phone: string | null;
  categoryLabel: string | null;
  createdAt: string;
  updatedAt: string;
  mpesaReceiptNumber?: string | null;
  rawCallback?: unknown;
}

interface UsePaymentStatusOptions {
  transactionId?: string;
  externalReference?: string;
  enabled?: boolean;
  intervalMs?: number;
  maxAttempts?: number;
}

interface UsePaymentStatusResult {
  status: PaymentStatus;
  transaction: TransactionStatus | null;
  isPolling: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
}

function mapStatus(dbStatus: string): PaymentStatus {
  switch (dbStatus) {
    case "PENDING":
      return "PROCESSING";
    case "PROCESSING":
      return "STK_SENT";
    case "SUCCESS":
      return "SUCCESS";
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PROCESSING";
  }
}

function getSupabaseAnonKey(): string {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function usePaymentStatus({
  transactionId,
  externalReference,
  enabled = true,
  intervalMs = 3000,
  maxAttempts = 60,
}: UsePaymentStatusOptions): UsePaymentStatusResult {
  const [status, setStatus] = useState<PaymentStatus>("IDLE");
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const functionsUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/functions/v1` 
    : "";

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!transactionId && !externalReference) return;

    try {
      const params = new URLSearchParams();
      if (transactionId) params.set("transactionId", transactionId);
      if (externalReference) params.set("externalReference", externalReference);

      const res = await fetch(`${functionsUrl}/mpesa-payment-status?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${getSupabaseAnonKey()}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Authentication required");
          stopPolling();
          return;
        }
        if (res.status === 404) {
          setStatus("FAILED");
          setError("Transaction not found");
          stopPolling();
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.ok && data.transaction) {
        setTransaction(data.transaction);
        const newStatus = mapStatus(data.transaction.status);
        setStatus(newStatus);

        if (newStatus === "SUCCESS" || newStatus === "FAILED" || newStatus === "CANCELLED") {
          stopPolling();
        }
      }
    } catch (e) {
      console.error("Payment status poll error:", e);
      setError("Failed to check payment status");
    }
  }, [transactionId, externalReference, functionsUrl, stopPolling]);

  const startPolling = useCallback(() => {
    if (isPolling || (!transactionId && !externalReference)) return;
    setIsPolling(true);
    setStatus("PROCESSING");
    setError(null);
    setAttempts(0);
    fetchStatus();
    const interval = setInterval(() => {
      setAttempts((a) => a + 1);
      if (attempts >= maxAttempts - 1) {
        stopPolling();
        setStatus("TIMEOUT");
        setError("Payment timed out. Please try again.");
        return;
      }
      fetchStatus();
    }, intervalMs);
    intervalRef.current = interval;
  }, [isPolling, transactionId, externalReference, intervalMs, maxAttempts, attempts, fetchStatus, stopPolling]);

  useEffect(() => {
    if (enabled && (transactionId || externalReference)) {
      startPolling();
    }
    return () => stopPolling();
  }, [enabled, transactionId, externalReference, startPolling, stopPolling]);

  return {
    status,
    transaction,
    isPolling,
    error,
    startPolling,
    stopPolling,
  };
}
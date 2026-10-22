"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/supabase/client";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

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

function getFunctionsUrl(): string {
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  return base ? `${base}/functions/v1` : "";
}

async function getUserAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
    setIsPolling(false);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!transactionId && !externalReference) return;

    try {
      const functionsUrl = getFunctionsUrl();
      if (!functionsUrl) {
        setError("Payment status is not configured");
        stopPolling();
        return;
      }

      const accessToken = await getUserAccessToken();
      if (!accessToken) {
        setError("Authentication required");
        stopPolling();
        return;
      }

      const params = new URLSearchParams();
      if (transactionId) params.set("transactionId", transactionId);
      if (externalReference) params.set("externalReference", externalReference);

      const res = await fetch(`${functionsUrl}/mpesa-payment-status?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
  }, [transactionId, externalReference, stopPolling]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current || (!transactionId && !externalReference)) return;
    isPollingRef.current = true;
    attemptsRef.current = 0;
    setIsPolling(true);
    setStatus("PROCESSING");
    setError(null);
    fetchStatus();
    const interval = setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current >= maxAttempts) {
        stopPolling();
        setStatus("TIMEOUT");
        setError("Payment timed out. Please try again.");
        return;
      }
      fetchStatus();
    }, intervalMs);
    intervalRef.current = interval;
  }, [transactionId, externalReference, intervalMs, maxAttempts, fetchStatus, stopPolling]);

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

"use client";
import { Button } from "@/components/ui/Button";
import { toggleAdminActive } from "@/services/admin/users";
import { useTransition } from "react";
export function AdminToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, start] = useTransition();
  function toggle() {
    start(async () => { await toggleAdminActive(id, !isActive); });
  }
  return (
    <Button type="button" size="sm" variant={isActive ? "secondary" : "primary"} isLoading={pending} onClick={toggle}>
      {isActive ? "Disable" : "Enable"}
    </Button>
  );
}

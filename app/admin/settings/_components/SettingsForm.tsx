"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { updateSiteSettings } from "@/services/admin/settings";
import type { AdminActionState } from "@/services/admin/sermons";
const initial: AdminActionState = { ok: false, message: "" };
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" isLoading={pending}>{label}</Button>;
}
export interface SettingsFormInitial {
  church_name?: string; tagline?: string | null; phone?: string | null; email?: string | null;
  address?: string | null; office_hours?: string | null; google_maps_url?: string | null;
  whatsapp?: string | null; mpesa_paybill?: string | null; mpesa_till?: string | null;
  bank_instructions?: string | null; seo_default_title?: string | null;
  seo_default_description?: string | null; seo_default_og_image?: string | null;
}
export function SettingsForm({ initial: i }: { initial: SettingsFormInitial }) {
  const [state, formAction] = useFormState(updateSiteSettings, initial);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Church name" htmlFor="st-name" required error={state.errors?.church_name}>
          <Input id="st-name" name="church_name" required maxLength={200} defaultValue={i.church_name ?? ""} />
        </Field>
        <Field label="Tagline" htmlFor="st-tagline" error={state.errors?.tagline}>
          <Input id="st-tagline" name="tagline" maxLength={200} defaultValue={i.tagline ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="st-phone" error={state.errors?.phone}>
          <Input id="st-phone" name="phone" maxLength={40} defaultValue={i.phone ?? ""} />
        </Field>
        <Field label="Email" htmlFor="st-email" error={state.errors?.email}>
          <Input id="st-email" name="email" type="email" defaultValue={i.email ?? ""} />
        </Field>
        <Field label="WhatsApp" htmlFor="st-wa" error={state.errors?.whatsapp}>
          <Input id="st-wa" name="whatsapp" maxLength={40} defaultValue={i.whatsapp ?? ""} />
        </Field>
        <Field label="Office hours" htmlFor="st-hours" error={state.errors?.office_hours}>
          <Input id="st-hours" name="office_hours" maxLength={200} defaultValue={i.office_hours ?? ""} />
        </Field>
        <Field label="M-Pesa Paybill" htmlFor="st-paybill" error={state.errors?.mpesa_paybill}>
          <Input id="st-paybill" name="mpesa_paybill" maxLength={40} defaultValue={i.mpesa_paybill ?? ""} />
        </Field>
        <Field label="M-Pesa Till" htmlFor="st-till" error={state.errors?.mpesa_till}>
          <Input id="st-till" name="mpesa_till" maxLength={40} defaultValue={i.mpesa_till ?? ""} />
        </Field>
        <Field label="Google Maps URL" htmlFor="st-map" error={state.errors?.google_maps_url}>
          <Input id="st-map" name="google_maps_url" type="url" defaultValue={i.google_maps_url ?? ""} />
        </Field>
        <Field label="SEO default title" htmlFor="st-seo-t" error={state.errors?.seo_default_title}>
          <Input id="st-seo-t" name="seo_default_title" maxLength={200} defaultValue={i.seo_default_title ?? ""} />
        </Field>
        <Field label="SEO default OG image" htmlFor="st-seo-og" error={state.errors?.seo_default_og_image}>
          <Input id="st-seo-og" name="seo_default_og_image" type="url" defaultValue={i.seo_default_og_image ?? ""} />
        </Field>
      </div>
      <Field label="Address" htmlFor="st-addr" error={state.errors?.address}>
        <Textarea id="st-addr" name="address" rows={2} maxLength={500} defaultValue={i.address ?? ""} />
      </Field>
      <Field label="Bank instructions" htmlFor="st-bank" error={state.errors?.bank_instructions}>
        <Textarea id="st-bank" name="bank_instructions" rows={4} maxLength={2000} defaultValue={i.bank_instructions ?? ""} />
      </Field>
      <Field label="SEO default description" htmlFor="st-seo-d" error={state.errors?.seo_default_description}>
        <Textarea id="st-seo-d" name="seo_default_description" rows={2} maxLength={500} defaultValue={i.seo_default_description ?? ""} />
      </Field>
      {state.message ? <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label="Save settings" /></div>
    </form>
  );
}

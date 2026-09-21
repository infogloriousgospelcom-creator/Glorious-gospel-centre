"use client";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Select } from "@/components/ui/Select";
import { createLeader, updateLeader, uploadLeaderImage } from "@/services/admin/leaders";
import type { AdminActionState } from "@/services/admin/sermons";

const initial: AdminActionState = { ok: false, message: "" };
const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function Submit({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" isLoading={pending} disabled={disabled}>{label}</Button>;
}

export interface LeaderFormInitial {
  id?: string; full_name?: string; title?: string | null; bio?: string | null;
  image_url?: string | null; email?: string | null; phone?: string | null;
  sort_order?: number; is_featured?: boolean; status?: string;
}

export function LeaderForm({ initial: i }: { initial?: LeaderFormInitial }) {
  const action = i?.id ? updateLeader.bind(null, i.id) : createLeader;
  const [state, formAction] = useFormState(action, initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(i?.image_url ?? "");
  const [preview, setPreview] = useState(i?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadSuccess("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError("File is too large. Maximum size is 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadLeaderImage(null, fd);

      if (!result.ok) {
        setUploadError(result.message);
        setPreview("");
        return;
      }

      setImageUrl(result.id!);
      setUploadSuccess("Image uploaded successfully.");
      setPreview(result.id!);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
    setPreview("");
    setUploadError("");
    setUploadSuccess("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="ld-name" required error={state.errors?.full_name}>
          <Input id="ld-name" name="full_name" required maxLength={120} defaultValue={i?.full_name ?? ""} />
        </Field>
        <Field label="Title" htmlFor="ld-title" error={state.errors?.title}>
          <Input id="ld-title" name="title" maxLength={120} defaultValue={i?.title ?? ""} />
        </Field>
        <Field label="Leadership Photo" htmlFor="ld-photo" hint="JPG, PNG, or WEBP. Max 5 MB." error={state.errors?.image_url}>
          <input
            ref={fileRef}
            id="ld-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 file:disabled:cursor-not-allowed file:disabled:opacity-50"
          />
          <input type="hidden" name="image_url" value={imageUrl} />
          {uploadError && <p className="mt-1.5 text-xs font-medium text-danger-700" role="alert">{uploadError}</p>}
          {uploadSuccess && !uploadError && <p className="mt-1.5 text-xs font-medium text-success-700" role="status">{uploadSuccess}</p>}
        </Field>
        <Field label="Email" htmlFor="ld-email" error={state.errors?.email}>
          <Input id="ld-email" name="email" type="email" defaultValue={i?.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="ld-phone" error={state.errors?.phone}>
          <Input id="ld-phone" name="phone" maxLength={40} defaultValue={i?.phone ?? ""} />
        </Field>
        <Field label="Sort order" htmlFor="ld-order" error={state.errors?.sort_order}>
          <Input id="ld-order" name="sort_order" type="number" min={0} defaultValue={i?.sort_order ?? 0} />
        </Field>
        <Field label="Status" htmlFor="ld-status" error={state.errors?.status}>
          <Select
            id="ld-status"
            name="status"
            options={STATUS_OPTIONS}
            defaultValue={i?.status ?? "DRAFT"}
            error={state.errors?.status}
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
          <input type="checkbox" name="is_featured" defaultChecked={Boolean(i?.is_featured)} className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500" />
          Featured on home page
        </label>
      </div>
      {preview && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-900">Photo preview</p>
          <div className="relative h-48 w-36 overflow-hidden rounded-xl border border-brand-100 bg-gradient-to-br from-brand-100 to-brand-50">
            <Image src={preview} alt="Leadership photo preview" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={removeImage}
              disabled={uploading}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-danger-600 shadow-sm transition-colors hover:bg-white disabled:opacity-50"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <Field label="Bio" htmlFor="ld-bio" error={state.errors?.bio}>
        <Textarea id="ld-bio" name="bio" rows={6} maxLength={20000} defaultValue={i?.bio ?? ""} />
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label={i?.id ? "Save changes" : "Create leader"} disabled={uploading} /></div>
    </form>
  );
}

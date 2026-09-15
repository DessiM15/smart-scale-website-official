"use client";

/**
 * The receipt file input, and the big button built on it.
 *
 * A receipt can come from the camera, the camera roll, a desktop folder, or
 * an email: the input takes any picture or a PDF, and leaves the choice of
 * where to get it to the phone's own sheet (no `capture`, which would force
 * the camera and hide the photo library).
 *
 * A phone photo is 4 to 12 MB and the server will take 4. So a picture is
 * shrunk on the phone before it goes anywhere: drawn onto a canvas at most
 * 1600px on its long side and re-encoded as a JPEG, which is a few hundred
 * KB and still perfectly legible. The shrunk file replaces the original in
 * the same input, so the form submits as if nothing happened. A PDF is sent
 * as it is; email receipts are small.
 *
 * If the browser cannot decode the file (an old one, an odd format), the
 * original is sent and the server has its own go at it.
 */

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { bebas, btnSolid } from "./ui";

/** What the input offers. The bare extension is for pickers that don't know the type. Mirrors RECEIPT_TYPES on the server. */
const RECEIPT_ACCEPT = "image/*,application/pdf,.pdf";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || (!file.type && /\.pdf$/i.test(file.name));
}

async function shrink(file: File): Promise<File> {
  if (isPdf(file) || typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

type Picked = { name: string; size: number; pdf: boolean; preview: string | null };

/**
 * The bare input, for a form that lays itself out. Shrinks a picture in
 * place; the form submits the field as `photo` like before. `onPicked`
 * hears what is in the input now, or null when it was cleared.
 */
export function ReceiptFileInput({
  id,
  className,
  disabled,
  onPicked,
  onBusy,
}: {
  id: string;
  className?: string;
  disabled?: boolean;
  onPicked?: (picked: Picked | null) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  async function onChange() {
    const el = input.current;
    const file = el?.files?.[0];
    if (!el || !file) {
      onPicked?.(null);
      return;
    }
    onBusy?.(true);
    try {
      const small = await shrink(file);
      if (small !== file && typeof DataTransfer !== "undefined") {
        const dt = new DataTransfer();
        dt.items.add(small);
        el.files = dt.files;
      }
      const chosen = el.files?.[0] ?? small;
      const pdf = isPdf(chosen);
      onPicked?.({ name: chosen.name, size: chosen.size, pdf, preview: pdf ? null : URL.createObjectURL(chosen) });
    } finally {
      onBusy?.(false);
    }
  }

  return (
    <input
      ref={input}
      id={id}
      name="photo"
      type="file"
      accept={RECEIPT_ACCEPT}
      onChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={!ready || pending} aria-busy={pending} className={`${btnSolid} w-full sm:w-auto`}>
      {pending ? "Reading the receipt" : "Read it"}
    </button>
  );
}

/** The big dashed button on the Receipts page: pick, see it, send it to be read. */
export function ReceiptPicker({ id = "photo", disabled }: { id?: string; disabled?: boolean }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);

  function onPicked(next: Picked | null) {
    setPicked((old) => {
      if (old?.preview) URL.revokeObjectURL(old.preview);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor={id}
        className={`flex flex-col items-center justify-center gap-3 border border-dashed px-5 py-8 text-center cursor-pointer transition-colors ${
          disabled ? "border-white/[0.08] text-white/30 cursor-not-allowed" : "border-[#DC2626]/60 hover:bg-[#DC2626]/[0.06] text-white"
        }`}
      >
        {picked?.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picked.preview} alt="The receipt you picked" className="max-h-72 w-auto object-contain" />
        ) : picked?.pdf ? (
          <span className="flex flex-col items-center gap-2 text-white">
            <PdfGlyph size={40} />
            <span className="text-sm text-white/70 max-w-[18rem] truncate">{picked.name}</span>
          </span>
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-[#DC2626]">
            <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
        <span className={`${bebas} text-[14px] tracking-[0.24em]`}>
          {busy ? "Shrinking the photo" : picked ? "Pick a different one" : "Take a photo or upload the receipt"}
        </span>
        {picked && !busy && <span className="text-xs text-white/40">{(picked.size / 1024).toFixed(0)} KB, ready to send</span>}
        {!picked && !busy && <span className="text-xs text-white/40">From the camera, your photos, or a PDF from an email</span>}
      </label>
      <ReceiptFileInput id={id} disabled={disabled} onPicked={onPicked} onBusy={setBusy} className="sr-only" />
      <Submit ready={Boolean(picked) && !busy && !disabled} />
    </div>
  );
}

/** A document outline with "PDF" on it; stands in wherever a photo thumbnail would go. */
export function PdfGlyph({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M6 2h8l5 5v15H6z" />
      <path d="M14 2v5h5" />
      <path d="M8.5 17.5v-5h1.6a1.5 1.5 0 0 1 0 3H8.5" />
      <path d="M12.6 12.5h1.2a2.5 2.5 0 0 1 0 5h-1.2z" />
      <path d="M16.8 17.5v-5h2.4M16.8 15h1.9" />
    </svg>
  );
}

"use client";

/**
 * The camera button.
 *
 * A phone photo is 4 to 12 MB and the server will take 4. So the picture is
 * shrunk on the phone before it goes anywhere: drawn onto a canvas at most
 * 1600px on its long side and re-encoded as a JPEG, which is a few hundred
 * KB and still perfectly legible. The shrunk file replaces the original in
 * the same input, so the form submits as if nothing happened.
 *
 * If the browser cannot decode the file (an old one, an odd format), the
 * original is sent and the server has its own go at it.
 */

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { bebas, btnSolid } from "./ui";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

async function shrink(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;
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

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={!ready || pending} aria-busy={pending} className={`${btnSolid} w-full sm:w-auto`}>
      {pending ? "Reading the receipt" : "Read it"}
    </button>
  );
}

export function ReceiptPicker({ id = "photo", disabled }: { id?: string; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange() {
    const el = input.current;
    const file = el?.files?.[0];
    if (!el || !file) {
      setPreview(null);
      setSize(null);
      return;
    }
    setBusy(true);
    try {
      const small = await shrink(file);
      if (small !== file && typeof DataTransfer !== "undefined") {
        const dt = new DataTransfer();
        dt.items.add(small);
        el.files = dt.files;
      }
      const chosen = el.files?.[0] ?? small;
      setSize(chosen.size);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(chosen);
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor={id}
        className={`flex flex-col items-center justify-center gap-3 border border-dashed px-5 py-8 text-center cursor-pointer transition-colors ${
          disabled ? "border-white/[0.08] text-white/30 cursor-not-allowed" : "border-[#DC2626]/60 hover:bg-[#DC2626]/[0.06] text-white"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="The receipt you picked" className="max-h-72 w-auto object-contain" />
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-[#DC2626]">
            <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
        <span className={`${bebas} text-[14px] tracking-[0.24em]`}>
          {busy ? "Shrinking the photo" : preview ? "Pick a different photo" : "Take a photo of the receipt"}
        </span>
        {size !== null && !busy && <span className="text-xs text-white/40">{(size / 1024).toFixed(0)} KB, ready to send</span>}
        {!preview && !busy && <span className="text-xs text-white/40">Or choose one from your photos</span>}
      </label>
      <input
        ref={input}
        id={id}
        name="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <Submit ready={Boolean(preview) && !busy && !disabled} />
    </div>
  );
}

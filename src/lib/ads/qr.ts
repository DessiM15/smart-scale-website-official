/**
 * Print-ready QR artwork.
 *
 * These get scanned off a television from across a dining room, which drives
 * every choice here: a wide quiet zone, pure black on pure white, and the
 * lowest error correction the artwork allows — a sparser code has larger
 * modules and reads from further away. A logo forces level H, because a logo
 * is damage the reader has to recover from.
 */

import QRCode from "qrcode";
import { SITE } from "./links";
import type { AdLinkRecord } from "./link-store";

/** Share of the code's width a logo may cover. Level H recovers about 30%. */
export const LOGO_SCALE = 0.22;
export const PNG_MIN = 512;
export const PNG_MAX = 3000;

export function clampPngWidth(requested: unknown): number {
  const n = Number(requested);
  if (!Number.isFinite(n)) return 2000;
  return Math.min(PNG_MAX, Math.max(PNG_MIN, Math.round(n)));
}

/**
 * Drops a logo into the middle of a qrcode-generated SVG, on a white plate so
 * it never sits directly on the modules.
 */
export function embedLogo(svg: string, logoDataUri: string): string {
  const viewBox = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /);
  if (!viewBox) return svg;

  const size = Number(viewBox[1]);
  const logo = size * LOGO_SCALE;
  const pad = logo * 0.12;
  const plate = logo + pad * 2;
  const plateXY = (size - plate) / 2;
  const logoXY = (size - logo) / 2;

  const overlay =
    `<rect x="${plateXY}" y="${plateXY}" width="${plate}" height="${plate}" rx="${plate * 0.12}" fill="#FFFFFF"/>` +
    `<image href="${logoDataUri}" x="${logoXY}" y="${logoXY}" width="${logo}" height="${logo}" preserveAspectRatio="xMidYMid meet"/>`;

  return svg.replace("</svg>", `${overlay}</svg>`);
}

export function scanUrlFor(code: string): string {
  return `${SITE}/go/${code}`;
}

export async function renderSvg(link: AdLinkRecord): Promise<string> {
  const svg = await QRCode.toString(scanUrlFor(link.code), {
    type: "svg",
    errorCorrectionLevel: link.logoDataUri ? "H" : "M",
    margin: 4,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  return link.logoDataUri ? embedLogo(svg, link.logoDataUri) : svg;
}

export async function renderPng(
  link: AdLinkRecord,
  width: number,
): Promise<Buffer> {
  const svg = await renderSvg(link);
  const { default: sharp } = await import("sharp");
  return sharp(Buffer.from(svg), { density: 300 })
    .resize(width, width, { fit: "contain" })
    .png()
    .toBuffer();
}

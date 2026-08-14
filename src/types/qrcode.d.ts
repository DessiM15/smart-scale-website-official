/** Minimal declarations for the bits of `qrcode` we use — it ships no types. */
declare module "qrcode" {
  export interface QRCodeToStringOptions {
    type?: "svg" | "utf8" | "terminal";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  }
  export function toString(
    text: string,
    options?: QRCodeToStringOptions,
  ): Promise<string>;
}

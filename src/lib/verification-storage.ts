// Shared in-memory storage for verification codes
// In production, replace this with Redis or a database

export interface VerificationData {
  code: string;
  expiresAt: number;
  phone: string;
  name: string;
  email: string;
}

const verificationCodes = new Map<string, VerificationData>();

export function storeVerificationCode(
  phone: string,
  data: VerificationData
): void {
  verificationCodes.set(phone, data);
}

export function getVerificationData(phone: string): VerificationData | undefined {
  return verificationCodes.get(phone);
}

export function deleteVerificationCode(phone: string): void {
  verificationCodes.delete(phone);
}

export function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(phone);
    }
  }
}


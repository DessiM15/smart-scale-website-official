import { NextRequest, NextResponse } from "next/server";
import {
  getVerificationData,
  deleteVerificationCode,
  cleanupExpiredCodes,
} from "@/lib/verification-storage";

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: "Phone and code are required" },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");

    // Clean up expired codes
    cleanupExpiredCodes();

    // Get stored verification data
    const storedData = getVerificationData(cleanedPhone);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: "Verification code not found or expired" },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      deleteVerificationCode(cleanedPhone);
      return NextResponse.json(
        { success: false, error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Verify code
    if (storedData.code !== code) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Code is valid - store consent (in production, save to database)
    // For now, we'll just remove the code and return success
    // You can add database logic here to store the consent
    const consentData = {
      phone: storedData.phone,
      name: storedData.name,
      email: storedData.email,
      verifiedAt: new Date().toISOString(),
    };

    // Remove used code
    deleteVerificationCode(cleanedPhone);

    // TODO: Save consent to database here
    // Example:
    // await saveConsentToDatabase(consentData);

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      data: consentData,
    });
  } catch (error: any) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify code",
      },
      { status: 500 }
    );
  }
}

